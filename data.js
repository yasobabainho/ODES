/* ODES demo prototipi - demo veri deposu (localStorage).
   UYARI: Bu bir prototiptir. Gerçek kimlik doğrulama, şifre saklama veya sunucu tarafı
   yetkilendirme YOKTUR. Tüm veri bu tarayıcıda tutulur. */
(function (global) {
  'use strict';

  const DB_KEY = 'odes.demo.v1';
  const SESSION_KEY = 'odes.session.v1';
  const VERSION = 1;
  const DAY = 86400000;
  const HOUR = 3600000;

  const TYPES = {
    duyuru: 'Duyuru',
    odev: 'Ödev',
    sinav: 'Sınav',
    acil: 'Acil'
  };

  const STATUSES = {
    draft: 'Taslak',
    scheduled: 'Zamanlandı',
    sent: 'Gönderildi',
    cancelled: 'İptal edildi'
  };

  const ROLES = {
    student: 'Öğrenci',
    teacher: 'Öğretmen',
    admin: 'Yönetici'
  };

  const REPORT_STATUSES = {
    new: 'Yeni',
    reviewing: 'İnceleniyor',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı'
  };

  const REPORT_CATEGORIES = {
    bullying: 'Akran zorbalığı',
    safety: 'Güvenlik',
    facility: 'Fiziksel ortam',
    communication: 'İletişim sorunu',
    other: 'Diğer'
  };

  const REPORT_SEVERITIES = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik'
  };

  const REPORT_FREQUENCIES = {
    once: 'İlk kez',
    sometimes: 'Ara sıra',
    often: 'Sık sık',
    constant: 'Sürekli'
  };

  const SCHOOL_LOCATIONS = [
    'Giriş ve güvenlik noktası',
    'Derslikler',
    'Koridorlar',
    'Merdivenler',
    'Tuvaletler',
    'Laboratuvarlar',
    'Kütüphane',
    'Kantin',
    'Spor salonu',
    'Öğretmenler odası',
    'İdari bölümler',
    'Diğer'
  ];

  const CLASSES = [
    '9-A', '9-B', '9-C', '9-D', '9-E', '9-F', '9-G', '9-H',
    '10-A', '10-B', '10-C', '10-D', '10-E', '10-F', '10-G', '10-H',
    '11-A', '11-B', '11-C', '11-D', '11-E', '11-F', '11-G', '11-H',
    '12-A', '12-B', '12-C', '12-D', '12-E', '12-F', '12-G', '12-H'
  ];

  const DAYS = [
    'Pazar', 'Pazartesi', 'Salı', 'Çarşamba',
    'Perşembe', 'Cuma', 'Cumartesi'
  ];

  const pad = n => String(n).padStart(2, '0');

  const dateKey = d => {
    d = d ? new Date(d) : new Date();
    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate());
  };

  const atDay = (offset, h, m) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h == null ? 9 : h, m || 0, 0, 0);
    return d.toISOString();
  };

  const uid = p =>
    p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- Alıcı çözümleme ---------- */

  function resolve(users, aud, senderId) {
    const sender = users.find(u => u.id === senderId);
    const act = users.filter(u =>
      u.status === 'active' && u.id !== senderId
    );

    switch (aud && aud.kind) {
      case 'all':
        return act.map(u => u.id);

      case 'students':
        return act.filter(u => u.role === 'student').map(u => u.id);

      case 'teachers':
        return act.filter(u => u.role === 'teacher').map(u => u.id);

      case 'class':
        return act
          .filter(u => u.role === 'student' && u.class === aud.value)
          .map(u => u.id);

      case 'myclasses':
        return act
          .filter(u =>
            u.role === 'student' &&
            sender &&
            (sender.classes || []).includes(u.class)
          )
          .map(u => u.id);

      case 'user':
        return act.filter(u => u.id === aud.value).map(u => u.id);

      case 'users':
        return act
          .filter(u => (aud.value || []).includes(u.id))
          .map(u => u.id);

      default:
        return [];
    }
  }

  /* ---------- Tohum veri ---------- */

  function seed() {
    const users = [
      {
        id: 'a1',
        name: 'Mehmet Kaya',
        email: 'yonetici@odes.demo',
        role: 'admin',
        status: 'active'
      },
      {
        id: 't1',
        name: 'Ayşe Demir',
        email: 'ogretmen@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Matematik',
        classes: ['10-A', '11-A', '11-B']
      },
      {
        id: 't2',
        name: 'Burak Şahin',
        email: 'burak.sahin@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Fizik',
        classes: ['10-A', '11-A']
      },
      {
        id: 't4',
        name: 'Cem Yıldız',
        email: 'cem.yildiz@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Edebiyat',
        classes: ['10-A', '11-A', '11-B']
      },
      {
        id: 't3',
        name: 'Zeynep Arslan',
        email: 'zeynep.arslan@odes.demo',
        role: 'teacher',
        status: 'pending',
        branch: 'Kimya',
        classes: []
      },
      {
        id: 's1',
        name: 'Elif Yılmaz',
        email: 'ogrenci@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A'
      },
      {
        id: 's2',
        name: 'Can Öztürk',
        email: 'can.ozturk@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A'
      },
      {
        id: 's3',
        name: 'Deniz Acar',
        email: 'deniz.acar@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A'
      },
      {
        id: 's10',
        name: 'Mina Erdem',
        email: 'mina.erdem@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A'
      },
      {
        id: 's4',
        name: 'Selin Çelik',
        email: 'selin.celik@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B'
      },
      {
        id: 's5',
        name: 'Emre Koç',
        email: 'emre.koc@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B'
      },
      {
        id: 's9',
        name: 'Yusuf Tan',
        email: 'yusuf.tan@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B'
      },
      {
        id: 's6',
        name: 'Naz Aydın',
        email: 'naz.aydin@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A'
      },
      {
        id: 's7',
        name: 'Kerem Polat',
        email: 'kerem.polat@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A'
      },
      {
        id: 's8',
        name: 'Ada Güneş',
        email: 'ada.gunes@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A'
      },
      {
        id: 's11',
        name: 'Orhan Bilgin',
        email: 'orhan.bilgin@odes.demo',
        role: 'student',
        status: 'inactive',
        class: '11-B'
      }
    ];

    const courses = [
      {
        id: 'c1',
        name: 'Matematik',
        teacherId: 't1',
        classes: ['10-A', '11-A', '11-B']
      },
      {
        id: 'c2',
        name: 'Fizik',
        teacherId: 't2',
        classes: ['10-A', '11-A']
      },
      {
        id: 'c3',
        name: 'Türk Dili ve Edebiyatı',
        teacherId: 't4',
        classes: ['10-A', '11-A', '11-B']
      }
    ];

    const grades = {};

    users.filter(u => u.role === 'student').forEach((u, a) => {
      grades[u.id] = {};

      courses.forEach((c, b) => {
        if (!c.classes.includes(u.class)) return;

        const g = k =>
          55 + (
            (a + 1) * 37 +
            (b + 1) * 23 +
            k * 11 +
            (a + 1) * (b + 1) * (k + 2)
          ) % 41;

        grades[u.id][c.id] = {
          vize: g(1),
          quiz: g(2),
          proje: g(3)
        };
      });
    });

    const assignments = [
      {
        id: 'as1',
        title: 'Türev problem seti',
        courseId: 'c1',
        class: '11-A',
        due: atDay(2, 23, 59),
        createdBy: 't1',
        done: {}
      },
      {
        id: 'as2',
        title: 'Fizik laboratuvar raporu',
        courseId: 'c2',
        class: '11-A',
        due: atDay(4, 23, 59),
        createdBy: 't2',
        done: { s2: true }
      },
      {
        id: 'as3',
        title: 'Kitap analizi (2 sayfa)',
        courseId: 'c3',
        class: '11-A',
        due: atDay(7, 23, 59),
        createdBy: 't4',
        done: {}
      },
      {
        id: 'as4',
        title: 'Limit çalışma kağıdı',
        courseId: 'c1',
        class: '11-B',
        due: atDay(3, 23, 59),
        createdBy: 't1',
        done: { s4: true }
      },
      {
        id: 'as5',
        title: 'Newton yasaları sunumu',
        courseId: 'c2',
        class: '10-A',
        due: atDay(5, 23, 59),
        createdBy: 't2',
        done: {}
      },
      {
        id: 'as6',
        title: 'Şiir çözümleme',
        courseId: 'c3',
        class: '10-A',
        due: atDay(-2, 23, 59),
        createdBy: 't4',
        done: { s6: true, s8: true }
      },
      {
        id: 'as7',
        title: 'İntegral testi',
        courseId: 'c1',
        class: '11-A',
        due: atDay(-3, 23, 59),
        createdBy: 't1',
        done: { s1: true, s2: true, s3: true }
      }
    ];

    const attendance = {};
    const absent = {
      '-1': ['s3', 's7'],
      '-2': ['s1', 's7'],
      '-3': ['s5']
    };

    [-1, -2, -3].forEach(off => {
      const dk = dateKey(new Date(Date.now() + off * DAY));

      CLASSES.slice(8, 11).forEach(cl => {
        const rec = {};

        users
          .filter(u =>
            u.role === 'student' &&
            u.class === cl &&
            u.status === 'active'
          )
          .forEach(u => {
            rec[u.id] = absent[String(off)].includes(u.id)
              ? 'absent'
              : 'present';
          });

        attendance[dk + '|' + cl] = rec;
      });
    });

    const notifications = seedNotifications(users);

    const activity = [
      {
        at: atDay(-2, 14, 5),
        text: 'Mehmet Kaya "Kütüphane uzatılmış çalışma saatleri" bildirimini gönderdi.'
      },
      {
        at: atDay(-3, 9, 40),
        text: 'Ayşe Demir "Proje sunum günleri" bildirimini gönderdi.'
      },
      {
        at: atDay(-4, 16, 20),
        text: 'Cem Yıldız hesabı onaylandı.'
      },
      {
        at: atDay(-6, 8, 15),
        text: 'Mehmet Kaya "Okul servis saatleri değişti" acil bildirimini gönderdi.'
      },
      {
        at: atDay(-9, 11, 0),
        text: 'Orhan Bilgin hesabı pasif duruma alındı.'
      }
    ];

    return {
      v: VERSION,
      users,
      courses,
      grades,
      assignments,
      attendance,
      notifications,
      activity,
      reports: []
    };
  }

  function seedNotifications(users) {
    const UNREAD = {
      s1: ['n8', 'n9'],
      t1: ['n6']
    };

    const defs = [
      {
        id: 'n1',
        d: -13,
        h: 10,
        by: 't1',
        aud: { kind: 'class', value: '11-A' },
        type: 'sinav',
        p: 0.9,
        title: 'Matematik vize hazırlık oturumu',
        body: 'Cuma günü 15:30\'da A-204 sınıfında vize hazırlık oturumu yapılacaktır. Türev ve limit konularına çalışarak gelin.'
      },
      {
        id: 'n2',
        d: -12,
        h: 9,
        by: 'a1',
        aud: { kind: 'students' },
        type: 'duyuru',
        p: 0.8,
        title: 'Dönem sonu takvimi yayınlandı',
        body: 'Dönem sonu sınav takvimi öğrenci panelinde yayınlanmıştır. Çakışma durumunda rehberlik servisine başvurunuz.'
      },
      {
        id: 'n3',
        d: -10,
        h: 13,
        by: 't2',
        aud: { kind: 'class', value: '10-A' },
        type: 'odev',
        p: 0.85,
        title: 'Fizik laboratuvar föyü',
        body: 'Laboratuvar föyünü inceleyip deney öncesi soruları cevaplayarak gelmeniz gerekmektedir.'
      },
      {
        id: 'n4',
        d: -9,
        h: 15,
        by: 'a1',
        aud: { kind: 'teachers' },
        type: 'duyuru',
        p: 0.75,
        title: 'Öğretmenler kurulu toplantısı',
        body: 'Öğretmenler kurulu toplantısı perşembe günü 16:00\'da toplantı salonunda yapılacaktır.'
      },
      {
        id: 'n5',
        d: -7,
        h: 11,
        by: 't1',
        aud: { kind: 'class', value: '11-B' },
        type: 'odev',
        p: 0.7,
        title: 'Ödev teslim hatırlatması',
        body: 'Limit çalışma kağıdının teslim tarihi yaklaşmaktadır. Lütfen zamanında teslim ediniz.'
      },
      {
        id: 'n6',
        d: -6,
        h: 8,
        by: 'a1',
        aud: { kind: 'all' },
        type: 'acil',
        p: 0.65,
        title: 'Okul servis saatleri değişti',
        body: 'Yarından itibaren sabah servisleri 07:45\'te hareket edecektir. Lütfen servis saatlerine dikkat ediniz.'
      },
      {
        id: 'n7',
        d: -5,
        h: 12,
        by: 't2',
        aud: { kind: 'class', value: '11-A' },
        type: 'sinav',
        p: 0.6,
        title: 'Fizik quiz duyurusu',
        body: 'Önümüzdeki hafta kuvvet ve hareket konusundan 20 dakikalık quiz yapılacaktır.'
      },
      {
        id: 'n8',
        d: -3,
        h: 9,
        by: 't1',
        aud: { kind: 'class', value: '11-A' },
        type: 'duyuru',
        p: 0.5,
        title: 'Proje sunum günleri',
        body: 'Dönem projesi sunumları gelecek hafta salı ve çarşamba günleri yapılacaktır. Sunum sırası ilan edilecektir.'
      },
      {
        id: 'n9',
        d: -2,
        h: 14,
        by: 'a1',
        aud: { kind: 'students' },
        type: 'duyuru',
        p: 0.4,
        title: 'Kütüphane uzatılmış çalışma saatleri',
        body: 'Sınav haftasında kütüphane 19:00\'a kadar açık olacaktır.'
      },
      {
        id: 'n10',
        d: -1,
        h: 16,
        by: 't2',
        aud: { kind: 'class', value: '10-A' },
        type: 'acil',
        p: 0.3,
        title: 'Yarınki ders odası değişikliği',
        body: 'Yarınki Fizik dersi B-101 yerine laboratuvarda yapılacaktır.'
      },
      {
        id: 'n11',
        d: 1,
        h: 8,
        by: 't1',
        aud: { kind: 'class', value: '11-A' },
        type: 'sinav',
        status: 'scheduled',
        title: 'Matematik quiz hatırlatması',
        body: 'Bugün 3. derste kısa quiz yapılacaktır. Hesap makinesi getirmeyiniz.'
      },
      {
        id: 'n12',
        d: 3,
        h: 10,
        by: 'a1',
        aud: { kind: 'all' },
        type: 'duyuru',
        status: 'scheduled',
        title: 'Veli-öğretmen görüşmesi',
        body: 'Veli-öğretmen görüşmeleri bu cuma 14:00-18:00 arasında yapılacaktır.'
      },
      {
        id: 'n13',
        d: -1,
        h: 17,
        by: 't1',
        aud: { kind: 'myclasses' },
        type: 'odev',
        status: 'draft',
        title: 'Dönem projesi konuları',
        body: 'Dönem projesi konu listesi ve değerlendirme ölçütleri ektedir.'
      },
      {
        id: 'n14',
        d: -1,
        h: 18,
        by: 'a1',
        aud: { kind: 'students' },
        type: 'duyuru',
        status: 'draft',
        title: 'Anket: okul etkinlikleri',
        body: 'Okul etkinlikleri hakkındaki görüşlerinizi paylaşır mısınız?'
      },
      {
        id: 'n15',
        d: -8,
        h: 10,
        by: 'a1',
        aud: { kind: 'teachers' },
        type: 'duyuru',
        status: 'cancelled',
        title: 'Yanlış tarihli toplantı duyurusu',
        body: 'Bu duyuru yanlış tarihle hazırlandığı için iptal edilmiştir.'
      }
    ];

    return defs.map((def, idx) => {
      const status = def.status || 'sent';

      const created = atDay(
        def.d - (status === 'scheduled' ? 1 : 0),
        def.h - 1 > 0 ? def.h - 1 : def.h
      );

      const n = {
        id: def.id,
        title: def.title,
        body: def.body,
        type: def.type,
        audience: def.aud,
        senderId: def.by,
        createdAt: created,
        scheduledAt: null,
        sentAt: null,
        status,
        recipients: [],
        reads: {}
      };

      if (status === 'scheduled') {
        n.scheduledAt = atDay(def.d, def.h);
      }

      if (status === 'sent') {
        n.sentAt = atDay(def.d, def.h);
        n.recipients = resolve(users, def.aud, def.by);

        const sentMs = new Date(n.sentAt).getTime();

        n.recipients.forEach((rid, i) => {
          const forced = (UNREAD[rid] || []).includes(def.id);
          const roll = ((i * 7 + idx * 13) % 10) / 10;

          if (!forced && roll < def.p) {
            const t = Math.min(
              Date.now() - 60000,
              sentMs + (((i * 5 + idx * 3) % 36) + 1) * HOUR
            );

            n.reads[rid] = new Date(t).toISOString();
          }
        });
      }

      if (status === 'cancelled') {
        n.cancelledAt = atDay(def.d + 1, 9);
      }

      return n;
    });
  }

  /* ---------- Depo ---------- */

  let db = null;

  function load() {
    if (db) return db;

    try {
      const raw = localStorage.getItem(DB_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (parsed && parsed.v === VERSION) {
          db = parsed;

          let changed = false;

          if (!Array.isArray(db.reports)) {
            db.reports = [];
            changed = true;
          }

          if (!Array.isArray(db.activity)) {
            db.activity = [];
            changed = true;
          }

          if (!Array.isArray(db.notifications)) {
            db.notifications = [];
            changed = true;
          }

          if (!Array.isArray(db.users)) {
            db.users = [];
            changed = true;
          }

          if (changed) save();

          return db;
        }
      }
    } catch (e) {
      /* localStorage kapalı olabilir; bellekte devam edilir */
    }

    db = seed();
    save();
    return db;
  }

  function save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      /* yoksay */
    }
  }

  function reset() {
    db = seed();
    save();
  }

  const store = {
    load,
    save,
    reset,
    db: () => load(),
    uid,
    dateKey,
    resolve,

    user(id) {
      return load().users.find(u => u.id === id) || null;
    },

    currentUser() {
      let id = null;

      try {
        id = sessionStorage.getItem(SESSION_KEY);
      } catch (e) {
        /* yoksay */
      }

      return id ? this.user(id) : null;
    },

    setSession(id) {
      try {
        sessionStorage.setItem(SESSION_KEY, id);
      } catch (e) {
        /* yoksay */
      }
    },

    logout() {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (e) {
        /* yoksay */
      }
    },

    /* Demo girişi: yalnızca e-posta eşleşmesi. Şifre doğrulanmaz ve saklanmaz. */
    login(email) {
      const u = load().users.find(
        x => x.email.toLowerCase() === String(email).trim().toLowerCase()
      );

      if (!u) {
        return {
          ok: false,
          error: 'Bu e-posta ile kayıtlı bir demo hesabı bulunamadı.'
        };
      }

      if (u.status === 'pending') {
        return {
          ok: false,
          error: 'Hesabınız yönetici onayı bekliyor.'
        };
      }

      if (u.status !== 'active') {
        return {
          ok: false,
          error: 'Hesabınız pasif durumda. Lütfen yöneticiyle iletişime geçin.'
        };
      }

      this.setSession(u.id);

      return { ok: true, user: u };
    },

    register(info) {
      const d = load();
      const email = String(info.email || '').trim().toLowerCase();
      const name = String(info.name || '').trim();
      const role = String(info.role || '');

      if (!name || !email) {
        return {
          ok: false,
          error: 'Ad soyad ve e-posta alanları zorunludur.'
        };
      }

      if (!['student', 'teacher'].includes(role)) {
        return {
          ok: false,
          error: 'Geçerli bir hesap türü seçmelisin.'
        };
      }

      if (d.users.some(u => u.email.toLowerCase() === email)) {
        return {
          ok: false,
          error: 'Bu e-posta adresi zaten kayıtlı.'
        };
      }

      const u = {
        id: uid('u'),
        name,
        email,
        role,
        status: role === 'teacher' ? 'pending' : 'active'
      };

      if (role === 'student') {
        if (!info.class) {
          return {
            ok: false,
            error: 'Sınıf ve şube seçmelisin.'
          };
        }

        u.class = info.class;
      }

      if (role === 'teacher') {
        u.branch = String(info.branch || '').trim();
        u.classes = [];
      }

      d.users.push(u);

      this.log(
        u.name + ' kayıt oldu' +
        (u.status === 'pending' ? ' (onay bekliyor).' : '.')
      );

      save();

      return { ok: true, user: u };
    },

    log(text) {
      load().activity.unshift({
        at: new Date().toISOString(),
        text
      });

      load().activity.length = Math.min(load().activity.length, 60);
      save();
    },

    /* ---------- Kullanıcı yönetimi ---------- */

    setUserStatus(id, status) {
      const u = this.user(id);
      if (!u) return;

      u.status = status;

      this.log(
        u.name +
        (status === 'active'
          ? ' hesabı etkinleştirildi.'
          : ' hesabı pasif duruma alındı.')
      );

      save();
    },

    deleteUser(id) {
      const d = load();
      const u = this.user(id);
      if (!u) return;

      d.users = d.users.filter(x => x.id !== id);

      this.log(u.name + ' hesabı silindi.');
      save();
    },

    addUser(info) {
      return this.register(info);
    },

    approveTeacher(id, classes) {
      const d = load();
      const u = this.user(id);

      if (!u || u.role !== 'teacher') return;

      u.status = 'active';
      u.classes = Array.isArray(classes) ? classes.slice() : [];

      let c = d.courses.find(x => x.teacherId === id);

      if (!c) {
        c = {
          id: uid('c'),
          name: u.branch || 'Ders',
          teacherId: id,
          classes: []
        };

        d.courses.push(c);
      }

      c.classes = u.classes.slice();

      this.log(u.name + ' hesabı onaylandı.');
      save();
    },

    /* ---------- Genel bildirimler ---------- */

    recipients(aud, senderId) {
      return resolve(load().users, aud, senderId);
    },

    audienceLabel(aud) {
      if (!aud) return '—';

      switch (aud.kind) {
        case 'all':
          return 'Herkes';

        case 'students':
          return 'Tüm öğrenciler';

        case 'teachers':
          return 'Tüm öğretmenler';

        case 'class':
          return 'Sınıf ' + aud.value;

        case 'myclasses':
          return 'Sınıflarımdaki öğrenciler';

        case 'user': {
          const u = this.user(aud.value);
          return u ? u.name : 'Silinmiş kullanıcı';
        }

        case 'users':
          return (aud.value || []).length + ' kişi (seçili)';

        default:
          return '—';
      }
    },

    recipientCount(n) {
      return n.status === 'sent'
        ? n.recipients.length
        : this.recipients(n.audience, n.senderId).length;
    },

    notification(id) {
      return load().notifications.find(n => n.id === id) || null;
    },

    createNotification(data) {
      const n = Object.assign({
        id: uid('n'),
        createdAt: new Date().toISOString(),
        scheduledAt: null,
        sentAt: null,
        status: 'draft',
        recipients: [],
        reads: {}
      }, data);

      load().notifications.push(n);
      save();

      return n;
    },

    sendNow(n) {
      n.recipients = this.recipients(n.audience, n.senderId);
      n.reads = {};
      n.sentAt = new Date().toISOString();
      n.status = 'sent';

      const s = this.user(n.senderId);

      this.log(
        (s ? s.name : 'Bilinmeyen') +
        ' "' + n.title + '" bildirimini gönderdi.'
      );

      save();
    },

    processScheduled() {
      let changed = false;

      load().notifications.forEach(n => {
        if (
          n.status === 'scheduled' &&
          n.scheduledAt &&
          new Date(n.scheduledAt).getTime() <= Date.now()
        ) {
          const when = n.scheduledAt;

          n.recipients = this.recipients(n.audience, n.senderId);
          n.reads = {};
          n.sentAt = when;
          n.status = 'sent';

          changed = true;
        }
      });

      if (changed) save();
    },

    deleteNotification(id) {
      const d = load();

      d.notifications = d.notifications.filter(n => n.id !== id);

      save();
    },

    inboxFor(userId) {
      return load().notifications
        .filter(n =>
          n.status === 'sent' &&
          (n.recipients || []).includes(userId)
        )
        .sort((a, b) =>
          new Date(b.sentAt) - new Date(a.sentAt)
        )
        .map(n => ({
          n,
          read: !!(n.reads || {})[userId]
        }));
    },

    markRead(nid, userId) {
      const n = this.notification(nid);

      if (
        n &&
        (n.recipients || []).includes(userId) &&
        !(n.reads || {})[userId]
      ) {
        n.reads = n.reads || {};
        n.reads[userId] = new Date().toISOString();
        save();
      }
    },

    markAllRead(userId) {
      this.inboxFor(userId).forEach(x => {
        if (!x.read) {
          x.n.reads = x.n.reads || {};
          x.n.reads[userId] = new Date().toISOString();
        }
      });

      save();
    },

    /* ---------- Sorun bildirim sistemi ---------- */

    reportById(id) {
      return load().reports.find(r => r.id === id) || null;
    },

    reportsForStudent(studentId) {
      return load().reports
        .filter(r =>
          (r.reporterId || r.studentId) === studentId
        )
        .sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    reportsForTeacher(teacherId) {
      const teacher = this.user(teacherId);

      if (
        !teacher ||
        teacher.role !== 'teacher' ||
        teacher.status !== 'active'
      ) {
        return [];
      }

      const classes = teacher.classes || [];

      return load().reports
        .filter(r =>
          r.anonymous || classes.includes(r.class)
        )
        .sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        .map(r => {
          const item = Object.assign({}, r);

          if (item.anonymous) {
            item.studentId = null;
            item.studentName = 'Anonim öğrenci';
            item.reporterId = undefined;
          }

          return item;
        });
    },

    allReports() {
      return load().reports
        .slice()
        .sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
    },

    adminReports(adminId) {
      const admin = this.user(adminId);

      if (
        !admin ||
        admin.role !== 'admin' ||
        admin.status !== 'active'
      ) {
        return [];
      }

      return this.allReports();
    },

    reportsVisibleTo(userId) {
      const user = this.user(userId);

      if (!user || user.status !== 'active') return [];

      let reports = [];

      if (user.role === 'admin') {
        reports = this.allReports();
      } else if (user.role === 'teacher') {
        reports = this.reportsForTeacher(userId);
      } else if (user.role === 'student') {
        reports = load().reports.filter(r =>
          r.anonymous ||
          (r.reporterId || r.studentId) === userId
        );
      }

      return reports.map(r => {
        const item = Object.assign({}, r);

        if (item.anonymous && user.role !== 'admin') {
          item.studentId = null;
          item.studentName = 'Anonim öğrenci';
          item.reporterId = undefined;
        }

        return item;
      });
    },

    createReport(info) {
      info = info || {};

      const student = this.user(info.studentId);

      if (
        !student ||
        student.role !== 'student' ||
        student.status !== 'active'
      ) {
        return {
          ok: false,
          error: 'Aktif bir öğrenci hesabı gerekli.'
        };
      }

      const title = String(info.title || '').trim();
      const description = String(info.description || '').trim();
      const category = String(info.category || 'other');
      const location = String(info.location || '').trim();
      const severity = String(info.severity || 'medium');
      const frequency = String(info.frequency || 'once');
      const anonymous = info.anonymous === true ||
        info.anonymous === 'true' ||
        info.anonymous === 'on';

      if (!title || !description) {
        return {
          ok: false,
          error: 'Başlık ve açıklama alanlarını doldurmalısın.'
        };
      }

      if (!REPORT_CATEGORIES[category]) {
        return {
          ok: false,
          error: 'Geçerli bir bildirim kategorisi seçmelisin.'
        };
      }

      if (!location || !SCHOOL_LOCATIONS.includes(location)) {
        return {
          ok: false,
          error: 'Geçerli bir okul konumu seçmelisin.'
        };
      }

      if (!REPORT_SEVERITIES[severity]) {
        return {
          ok: false,
          error: 'Geçerli bir önem derecesi seçmelisin.'
        };
      }

      if (!REPORT_FREQUENCIES[frequency]) {
        return {
          ok: false,
          error: 'Geçerli bir sıklık seçmelisin.'
        };
      }

      const now = new Date().toISOString();

      const report = {
        id: uid('r'),

        // Yönetici için gerçek gönderen kimliği.
        reporterId: student.id,

        // Anonim bildirimde görünür kimlik alanları boş tutulur.
        studentId: anonymous ? null : student.id,
        studentName: anonymous ? 'Anonim öğrenci' : student.name,

        class: student.class || '—',
        anonymous,

        title: title.slice(0, 100),
        description: description.slice(0, 2000),

        category,
        location,
        severity,
        frequency,

        status: 'new',
        assignedTeacherId: null,

        createdAt: now,
        updatedAt: now,

        history: [{
          status: 'new',
          actorId: anonymous ? null : student.id,
          actorName: anonymous ? 'Anonim öğrenci' : student.name,
          note: 'Bildirim oluşturuldu.',
          at: now
        }]
      };

      const d = load();

      d.reports.unshift(report);
      save();

      /*
       * Anonim bildirim:
       * Bütün aktif kullanıcılara iletilir.
       * Bildirimde gönderen kimliği kullanılmaz.
       *
       * Kimlikli bildirim:
       * Yöneticilere ve öğrencinin sınıfından sorumlu
       * öğretmenlere iletilir.
       */

      let recipients;

      if (anonymous) {
        recipients = d.users
          .filter(u => u.status === 'active')
          .map(u => u.id);
      } else {
        recipients = d.users
          .filter(u =>
            u.status === 'active' &&
            (
              u.role === 'admin' ||
              (
                u.role === 'teacher' &&
                (u.classes || []).includes(student.class)
              )
            )
          )
          .map(u => u.id);
      }

      const notification = this.createNotification({
        title: 'Yeni okul güvenliği bildirimi',

        body:
          location +
          ' konumunda yeni bir sorun bildirimi oluşturuldu.',

        type: 'duyuru',

        audience: {
          kind: 'users',
          value: recipients
        },

        // Anonim bildirimde gerçek göndereni bildirimden gizle.
        senderId: anonymous ? null : student.id
      });

      this.sendNow(notification);

      // Anonim bildirimlerde etkinlik kaydına öğrenci adı yazılmaz.
      this.log(
        anonymous
          ? 'Anonim bir okul güvenliği bildirimi oluşturuldu.'
          : student.name + ' yeni bir okul güvenliği bildirimi oluşturdu.'
      );

      return {
        ok: true,
        report: Object.assign({}, report, {
          studentId: anonymous ? null : student.id,
          studentName: anonymous ? 'Anonim öğrenci' : student.name,
          reporterId: undefined
        })
      };
    },

    updateReportStatus(reportId, status, actorId, note) {
      const report = this.reportById(reportId);
      const actor = this.user(actorId);

      if (!report) {
        return {
          ok: false,
          error: 'Bildirim bulunamadı.'
        };
      }

      if (
        !actor ||
        actor.status !== 'active' ||
        (actor.role !== 'teacher' && actor.role !== 'admin')
      ) {
        return {
          ok: false,
          error: 'Bu işlem için yetkili hesap gerekli.'
        };
      }

      if (!REPORT_STATUSES[status]) {
        return {
          ok: false,
          error: 'Geçersiz bildirim durumu.'
        };
      }

      if (
        actor.role === 'teacher' &&
        !report.anonymous &&
        !(actor.classes || []).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Bu sınıfa ait bildirim üzerinde işlem yapamazsın.'
        };
      }

      const now = new Date().toISOString();
      const cleanNote = String(note || '').trim().slice(0, 500);

      report.status = status;
      report.updatedAt = now;

      if (actor.role === 'teacher') {
        report.assignedTeacherId = actor.id;
      }

      report.history = report.history || [];

      report.history.push({
        status,
        actorId: actor.id,
        actorName: actor.name,
        note: cleanNote || REPORT_STATUSES[status] + ' olarak güncellendi.',
        at: now
      });

      save();

      // Anonim bildirimin sahibine bildirim gönderilmez.
      // Kimlikli bildirimin sahibine durum bilgisi gönderilir.
      if (!report.anonymous && report.reporterId) {
        const notification = this.createNotification({
          title: 'Bildirimin güncellendi',

          body:
            '"' + report.title +
            '" başlıklı bildiriminin durumu "' +
            REPORT_STATUSES[status] +
            '" olarak değiştirildi.',

          type: 'duyuru',

          audience: {
            kind: 'user',
            value: report.reporterId
          },

          senderId: actor.id
        });

        this.sendNow(notification);
      }

      this.log(
        actor.name +
        ', "' + report.title +
        '" bildirimini "' +
        REPORT_STATUSES[status] +
        '" yaptı.'
      );

      return { ok: true, report };
    },

    assignReport(reportId, teacherId, actorId) {
      const report = this.reportById(reportId);
      const teacher = this.user(teacherId);
      const actor = this.user(actorId);

      if (!report || !teacher || teacher.role !== 'teacher' ||
          teacher.status !== 'active') {
        return {
          ok: false,
          error: 'Bildirim veya öğretmen bulunamadı.'
        };
      }

      if (
        !actor ||
        actor.status !== 'active' ||
        (actor.role !== 'admin' && actor.role !== 'teacher')
      ) {
        return {
          ok: false,
          error: 'Bu işlem için yetkili hesap gerekli.'
        };
      }

      if (
        actor.role === 'teacher' &&
        !report.anonymous &&
        !(actor.classes || []).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Bu bildirim üzerinde işlem yapamazsın.'
        };
      }

      if (
        !report.anonymous &&
        !(teacher.classes || []).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Seçilen öğretmen bu sınıftan sorumlu değil.'
        };
      }

      report.assignedTeacherId = teacher.id;
      report.updatedAt = new Date().toISOString();

      report.history = report.history || [];

      report.history.push({
        status: report.status,
        actorId: actor.id,
        actorName: actor.name,
        note: teacher.name + ' bildirimden sorumlu öğretmen olarak atandı.',
        at: report.updatedAt
      });

      save();

      this.log(
        teacher.name +
        ' bir okul güvenliği bildirimi için sorumlu öğretmen olarak atandı.'
      );

      return { ok: true, report };
    },

    reportStats() {
      const reports = load().reports;

      return {
        total: reports.length,
        new: reports.filter(r => r.status === 'new').length,
        reviewing: reports.filter(r => r.status === 'reviewing').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        closed: reports.filter(r => r.status === 'closed').length
      };
    },

    /* ---------- Akademik yardımcılar (eski modüllerle uyumluluk) ---------- */

    students(cls) {
      return load().users.filter(u =>
        u.role === 'student' &&
        u.status === 'active' &&
        (!cls || u.class === cls)
      );
    },

    courseName(cid) {
      const c = load().courses.find(x => x.id === cid);
      return c ? c.name : '—';
    },

    coursesOfTeacher(tid) {
      return load().courses.filter(c => c.teacherId === tid);
    },

    assignmentsFor(user) {
      return load().assignments
        .filter(a => a.class === user.class)
        .map(a => Object.assign({}, a, {
          isDone: !!(a.done && a.done[user.id]),
          courseName: this.courseName(a.courseId)
        }))
        .sort((a, b) =>
          new Date(a.due) - new Date(b.due)
        );
    },

    toggleAssignment(aid, userId) {
      const a = load().assignments.find(x => x.id === aid);
      if (!a) return;

      a.done = a.done || {};

      if (a.done[userId]) {
        delete a.done[userId];
      } else {
        a.done[userId] = true;
      }

      save();
    },

    scheduleFor(cls) {
      const base = [
        [1, '09:00', 'c1'],
        [1, '10:00', 'c2'],
        [1, '11:00', 'c3'],
        [2, '09:00', 'c3'],
        [2, '10:00', 'c1'],
        [2, '13:00', 'c2'],
        [3, '09:00', 'c2'],
        [3, '10:00', 'c3'],
        [3, '11:00', 'c1'],
        [4, '09:00', 'c1'],
        [4, '10:00', 'c3'],
        [4, '12:00', 'c2'],
        [5, '09:00', 'c2'],
        [5, '10:00', 'c1'],
        [5, '11:00', 'c3']
      ];

      const room = {
        '10-A': 'B-101',
        '11-A': 'A-204',
        '11-B': 'A-205'
      }[cls] || 'A-100';

      return base
        .map(b => ({
          day: b[0],
          time: b[1],
          course: load().courses.find(c => c.id === b[2])
        }))
        .filter(x =>
          x.course && x.course.classes.includes(cls)
        )
        .map(x => ({
          day: x.day,
          time: x.time,
          courseName: x.course.name,
          teacher: (store.user(x.course.teacherId) || {}).name || '—',
          room
        }));
    },

    weighted(g) {
      return g
        ? Math.round((
          g.vize * 0.4 +
          g.quiz * 0.2 +
          g.proje * 0.4
        ) * 10) / 10
        : null;
    },

    gradesFor(sid) {
      const u = this.user(sid);
      const d = load();

      return d.courses
        .filter(c => u && c.classes.includes(u.class))
        .map(c => {
          const g = (d.grades[sid] || {})[c.id] || null;

          return {
            course: c,
            g,
            avg: this.weighted(g)
          };
        });
    },

    overallAvg(sid) {
      const a = this.gradesFor(sid)
        .map(x => x.avg)
        .filter(x => x != null);

      return a.length
        ? Math.round(
          a.reduce((s, x) => s + x, 0) / a.length * 10
        ) / 10
        : null;
    },

    absences(sid) {
      return Object.values(load().attendance)
        .filter(rec => rec[sid] === 'absent')
        .length;
    },

    getAttendance(date, cls) {
      return Object.assign(
        {},
        load().attendance[date + '|' + cls] || {}
      );
    },

    setAttendance(date, cls, rec) {
      load().attendance[date + '|' + cls] = rec;
      save();
    },

    hasAttendance(date, cls) {
      return !!load().attendance[date + '|' + cls];
    }
  };

  global.ODES = {
    store,
    TYPES,
    STATUSES,
    REPORT_STATUSES,
    REPORT_CATEGORIES,
    REPORT_SEVERITIES,
    REPORT_FREQUENCIES,
    SCHOOL_LOCATIONS,
    ROLES,
    CLASSES,
    DAYS,
    DAY,
    HOUR
  };

})(window);
