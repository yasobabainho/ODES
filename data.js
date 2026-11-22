
/*
 * ODES — VERİ YÖNETİM SİSTEMİ
 *
 * Bu sürüm:
 * - Demo ve gerçek kullanıcı verilerini ayırır.
 * - Eski kayıtları otomatik olarak korur.
 * - Öğrenci, öğretmen ve yönetici erişimlerini sınırlar.
 * - Anonim bildirimlerin kimliğini öğrenci ve öğretmenlerden gizler.
 *
 * ÖNEMLİ:
 * Bu sistem localStorage üzerinde çalışan bir prototiptir.
 * Gerçek güvenlik için sunucu taraflı kimlik doğrulama gerekir.
 */

(function (global) {
  'use strict';

  const DB_KEY = 'odes.demo.v1';
  const SESSION_KEY = 'odes.session.v1';
  const VERSION = 1;

  const DEMO_IDS = new Set([
    'a1',
    't1', 't2', 't3', 't4',
    's1', 's2', 's3', 's4', 's5',
    's6', 's7', 's8', 's9', 's10', 's11'
  ]);

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
    'Pazar',
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi'
  ];

  const DAY = 86400000;
  const HOUR = 3600000;

  const pad = n => String(n).padStart(2, '0');

  const dateKey = d => {
    d = d ? new Date(d) : new Date();

    return d.getFullYear() + '-' +
      pad(d.getMonth() + 1) + '-' +
      pad(d.getDate());
  };

  const uid = prefix =>
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getUserRealm(user) {
    if (!user) return 'demo';

    if (user.realm === 'real' || user.realm === 'demo') {
      return user.realm;
    }

    return DEMO_IDS.has(user.id) ? 'demo' : 'real';
  }

  function sameRealm(a, b) {
    return getUserRealm(a) === getUserRealm(b);
  }

  /* =====================================
     DEMO VERİLERİ
  ===================================== */

  function seed() {
    const users = [
      {
        id: 'a1',
        name: 'Mehmet Kaya',
        email: 'yonetici@odes.demo',
        role: 'admin',
        status: 'active',
        realm: 'demo'
      },
      {
        id: 't1',
        name: 'Ayşe Demir',
        email: 'ogretmen@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Matematik',
        classes: ['10-A', '11-A', '11-B'],
        realm: 'demo'
      },
      {
        id: 't2',
        name: 'Burak Şahin',
        email: 'burak.sahin@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Fizik',
        classes: ['10-A', '11-A'],
        realm: 'demo'
      },
      {
        id: 't3',
        name: 'Zeynep Arslan',
        email: 'zeynep.arslan@odes.demo',
        role: 'teacher',
        status: 'pending',
        branch: 'Kimya',
        classes: [],
        realm: 'demo'
      },
      {
        id: 't4',
        name: 'Cem Yıldız',
        email: 'cem.yildiz@odes.demo',
        role: 'teacher',
        status: 'active',
        branch: 'Edebiyat',
        classes: ['10-A', '11-A', '11-B'],
        realm: 'demo'
      },
      {
        id: 's1',
        name: 'Elif Yılmaz',
        email: 'ogrenci@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A',
        realm: 'demo'
      },
      {
        id: 's2',
        name: 'Can Öztürk',
        email: 'can.ozturk@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A',
        realm: 'demo'
      },
      {
        id: 's3',
        name: 'Deniz Acar',
        email: 'deniz.acar@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A',
        realm: 'demo'
      },
      {
        id: 's4',
        name: 'Selin Çelik',
        email: 'selin.celik@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B',
        realm: 'demo'
      },
      {
        id: 's5',
        name: 'Emre Koç',
        email: 'emre.koc@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B',
        realm: 'demo'
      },
      {
        id: 's6',
        name: 'Naz Aydın',
        email: 'naz.aydin@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A',
        realm: 'demo'
      },
      {
        id: 's7',
        name: 'Kerem Polat',
        email: 'kerem.polat@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A',
        realm: 'demo'
      },
      {
        id: 's8',
        name: 'Ada Güneş',
        email: 'ada.gunes@odes.demo',
        role: 'student',
        status: 'active',
        class: '10-A',
        realm: 'demo'
      },
      {
        id: 's9',
        name: 'Yusuf Tan',
        email: 'yusuf.tan@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-B',
        realm: 'demo'
      },
      {
        id: 's10',
        name: 'Mina Erdem',
        email: 'mina.erdem@odes.demo',
        role: 'student',
        status: 'active',
        class: '11-A',
        realm: 'demo'
      },
      {
        id: 's11',
        name: 'Orhan Bilgin',
        email: 'orhan.bilgin@odes.demo',
        role: 'student',
        status: 'inactive',
        class: '11-B',
        realm: 'demo'
      }
    ];

    return {
      v: VERSION,
      users,
      courses: [],
      grades: {},
      assignments: [],
      attendance: {},
      notifications: [],
      activity: [
        {
          at: new Date().toISOString(),
          text: 'ODES demo sistemi başlatıldı.',
          realm: 'demo'
        }
      ],
      reports: []
    };
  }

  /* =====================================
     DEPO VE ESKİ VERİLERİ KORUMA
  ===================================== */

  let db = null;

  function migrateDatabase(data) {
    let changed = false;

    data.users = safeArray(data.users);
    data.reports = safeArray(data.reports);
    data.notifications = safeArray(data.notifications);
    data.activity = safeArray(data.activity);
    data.courses = safeArray(data.courses);
    data.assignments = safeArray(data.assignments);

    if (!data.grades || typeof data.grades !== 'object') {
      data.grades = {};
      changed = true;
    }

    if (!data.attendance || typeof data.attendance !== 'object') {
      data.attendance = {};
      changed = true;
    }

    data.users.forEach(user => {
      if (!user.realm) {
        user.realm = DEMO_IDS.has(user.id) ? 'demo' : 'real';
        changed = true;
      }

      if (!Array.isArray(user.classes)) {
        user.classes = [];
        changed = true;
      }
    });

    const userById = id =>
      data.users.find(user => user.id === id) || null;

    data.reports.forEach(report => {
      if (!report.realm) {
        const owner = userById(
          report.reporterId || report.studentId
        );

        report.realm = owner
          ? getUserRealm(owner)
          : 'demo';

        changed = true;
      }

      if (!Array.isArray(report.history)) {
        report.history = [];
        changed = true;
      }

      if (!report.status || !REPORT_STATUSES[report.status]) {
        report.status = 'new';
        changed = true;
      }
    });

    data.notifications.forEach(notification => {
      if (!notification.realm) {
        const sender = userById(notification.senderId);

        if (sender) {
          notification.realm = getUserRealm(sender);
        } else {
          notification.realm = 'demo';
        }

        changed = true;
      }

      notification.recipients = safeArray(
        notification.recipients
      );

      notification.reads =
        notification.reads &&
        typeof notification.reads === 'object'
          ? notification.reads
          : {};

      const allowedIds = new Set(
        data.users
          .filter(user =>
            getUserRealm(user) === notification.realm
          )
          .map(user => user.id)
      );

      const filteredRecipients = notification.recipients
        .filter(id => allowedIds.has(id));

      if (
        filteredRecipients.length !==
        notification.recipients.length
      ) {
        notification.recipients = filteredRecipients;
        changed = true;
      }
    });

    data.activity.forEach(item => {
      if (!item.realm) {
        item.realm = 'demo';
        changed = true;
      }
    });

    if (data.v !== VERSION) {
      data.v = VERSION;
      changed = true;
    }

    return changed;
  }

  function load() {
    if (db) return db;

    try {
      const raw = localStorage.getItem(DB_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (parsed && typeof parsed === 'object') {
          db = parsed;

          const changed = migrateDatabase(db);

          if (changed) save();

          return db;
        }
      }
    } catch (error) {
      console.warn('ODES veri deposu okunamadı:', error);
    }

    db = seed();
    save();

    return db;
  }

  function save() {
    if (!db) return;

    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (error) {
      console.error('ODES verileri kaydedilemedi:', error);
    }
  }

  function getSessionId() {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch (error) {
      return null;
    }
  }

  function currentRealm() {
    const id = getSessionId();

    if (!id) return 'demo';

    const user = load().users.find(item => item.id === id);

    return user ? getUserRealm(user) : 'demo';
  }

  function scopedDatabase(realm) {
    const data = load();

    return Object.assign({}, data, {
      users: data.users.filter(user =>
        getUserRealm(user) === realm
      ),

      reports: data.reports.filter(report =>
        report.realm === realm
      ),

      notifications: data.notifications.filter(notification =>
        notification.realm === realm
      ),

      activity: data.activity.filter(item =>
        item.realm === realm
      ),

      courses: data.courses.filter(course => {
        const teacher = data.users.find(
          user => user.id === course.teacherId
        );

        return teacher && getUserRealm(teacher) === realm;
      })
    });
  }

  /* =====================================
     KULLANICI VE OTURUM
  ===================================== */

  const store = {
    uid,
    dateKey,
    DAY,
    HOUR,

    load() {
      return scopedDatabase(currentRealm());
    },

    db() {
      return scopedDatabase(currentRealm());
    },

    save,

    reset() {
      const data = load();

      // Gerçek kullanıcı alanı hiçbir zaman sıfırlanmaz.
      const realUsers = data.users.filter(
        user => getUserRealm(user) === 'real'
      );

      const realReports = data.reports.filter(
        report => report.realm === 'real'
      );

      const realNotifications = data.notifications.filter(
        notification => notification.realm === 'real'
      );

      const realActivity = data.activity.filter(
        item => item.realm === 'real'
      );

      const fresh = seed();

      fresh.users = fresh.users.concat(realUsers);
      fresh.reports = realReports;
      fresh.notifications = fresh.notifications.concat(
        realNotifications
      );
      fresh.activity = fresh.activity.concat(realActivity);

      db = fresh;
      save();

      return true;
    },

    user(id) {
      const user = load().users.find(item => item.id === id);

      if (!user) return null;

      if (getUserRealm(user) !== currentRealm()) {
        return null;
      }

      return user;
    },

    currentUser() {
      const id = getSessionId();

      return id ? this.user(id) : null;
    },

    setSession(id) {
      try {
        sessionStorage.setItem(SESSION_KEY, id);
      } catch (error) {
        console.warn('Oturum kaydedilemedi.');
      }
    },

    logout() {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (error) {
        // Oturum zaten kapalı olabilir.
      }
    },

    login(email) {
      const normalized = normalizeEmail(email);

      const user = load().users.find(item =>
        normalizeEmail(item.email) === normalized
      );

      if (!user) {
        return {
          ok: false,
          error: 'Bu e-posta ile kayıtlı hesap bulunamadı.'
        };
      }

      if (user.status === 'pending') {
        return {
          ok: false,
          error: 'Hesabınız yönetici onayı bekliyor.'
        };
      }

      if (user.status !== 'active') {
        return {
          ok: false,
          error: 'Hesabınız pasif durumda.'
        };
      }

      this.setSession(user.id);

      return {
        ok: true,
        user
      };
    },

    register(info) {
      info = info || {};

      const data = load();

      const email = normalizeEmail(info.email);
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

      if (data.users.some(user =>
        normalizeEmail(user.email) === email
      )) {
        return {
          ok: false,
          error: 'Bu e-posta adresi zaten kayıtlı.'
        };
      }

      const user = {
        id: uid('u'),
        name,
        email,
        role,
        status: role === 'teacher' ? 'pending' : 'active',
        realm: 'real',
        createdAt: new Date().toISOString()
      };

      if (role === 'student') {
        if (!CLASSES.includes(info.class)) {
          return {
            ok: false,
            error: 'Geçerli bir sınıf seçmelisin.'
          };
        }

        user.class = info.class;
        user.classes = [];
      }

      if (role === 'teacher') {
        user.branch = String(info.branch || '').trim();
        user.classes = [];
      }

      data.users.push(user);

      this.log(
        user.name +
        ' kayıt oldu' +
        (user.status === 'pending'
          ? ' (onay bekliyor).'
          : '.'),
        'real'
      );

      save();

      return {
        ok: true,
        user
      };
    },

    log(message, realm) {
      const data = load();

      data.activity.unshift({
        at: new Date().toISOString(),
        text: String(message || ''),
        realm: realm || currentRealm()
      });

      data.activity = data.activity.slice(0, 150);

      save();
    },

    /* =====================================
       KULLANICI YÖNETİMİ
    ===================================== */

    setUserStatus(id, status) {
      const actor = this.currentUser();
      const user = this.user(id);

      if (
        !actor ||
        actor.role !== 'admin' ||
        !user ||
        !['active', 'inactive', 'pending'].includes(status)
      ) {
        return {
          ok: false,
          error: 'Bu işlem için yetkili yönetici hesabı gerekli.'
        };
      }

      user.status = status;

      this.log(
        user.name +
        (status === 'active'
          ? ' hesabı etkinleştirildi.'
          : ' hesabının durumu güncellendi.'),
        getUserRealm(user)
      );

      save();

      return { ok: true };
    },

    deleteUser(id) {
      const actor = this.currentUser();
      const user = this.user(id);

      if (
        !actor ||
        actor.role !== 'admin' ||
        !user ||
        user.role === 'admin'
      ) {
        return {
          ok: false,
          error: 'Bu kullanıcı silinemez.'
        };
      }

      const data = load();

      data.users = data.users.filter(
        item => item.id !== id
      );

      this.log(user.name + ' hesabı silindi.');

      save();

      return { ok: true };
    },

    addUser(info) {
      return this.register(info);
    },

    approveTeacher(id, classes) {
      const actor = this.currentUser();
      const user = this.user(id);

      if (
        !actor ||
        actor.role !== 'admin' ||
        !user ||
        user.role !== 'teacher'
      ) {
        return {
          ok: false,
          error: 'Öğretmen onaylanamadı.'
        };
      }

      const selected = safeArray(classes)
        .filter(item => CLASSES.includes(item));

      user.status = 'active';
      user.classes = selected;

      const data = load();

      let course = data.courses.find(item =>
        item.teacherId === id
      );

      if (!course) {
        course = {
          id: uid('c'),
          name: user.branch || 'Ders',
          teacherId: id,
          classes: []
        };

        data.courses.push(course);
      }

      course.classes = selected.slice();

      this.log(user.name + ' hesabı onaylandı.');

      save();

      return { ok: true };
    },

    /* =====================================
       BİLDİRİM ALICILARI
    ===================================== */

    resolve(audience, senderId, realm) {
      const data = load();

      const selectedRealm = realm || currentRealm();

      const sender = data.users.find(
        user => user.id === senderId
      );

      const active = data.users.filter(user =>
        user.status === 'active' &&
        user.id !== senderId &&
        getUserRealm(user) === selectedRealm
      );

      switch (audience && audience.kind) {
        case 'all':
          return active.map(user => user.id);

        case 'students':
          return active
            .filter(user => user.role === 'student')
            .map(user => user.id);

        case 'teachers':
          return active
            .filter(user => user.role === 'teacher')
            .map(user => user.id);

        case 'class':
          return active
            .filter(user =>
              user.role === 'student' &&
              user.class === audience.value
            )
            .map(user => user.id);

        case 'myclasses':
          return active
            .filter(user =>
              user.role === 'student' &&
              sender &&
              sameRealm(sender, user) &&
              (sender.classes || []).includes(user.class)
            )
            .map(user => user.id);

        case 'user':
          return active
            .filter(user => user.id === audience.value)
            .map(user => user.id);

        case 'users':
          return active
            .filter(user =>
              safeArray(audience.value).includes(user.id)
            )
            .map(user => user.id);

        default:
          return [];
      }
    },

    recipients(audience, senderId, realm) {
      return this.resolve(audience, senderId, realm);
    },

    audienceLabel(audience) {
      if (!audience) return '—';

      switch (audience.kind) {
        case 'all':
          return 'Herkes';

        case 'students':
          return 'Tüm öğrenciler';

        case 'teachers':
          return 'Tüm öğretmenler';

        case 'class':
          return 'Sınıf ' + audience.value;

        case 'myclasses':
          return 'Sınıflarımdaki öğrenciler';

        case 'user': {
          const user = this.user(audience.value);
          return user ? user.name : 'Kullanıcı';
        }

        case 'users':
          return safeArray(audience.value).length +
            ' kişi (seçili)';

        default:
          return '—';
      }
    },

    recipientCount(notification) {
      if (notification.status === 'sent') {
        return safeArray(notification.recipients).length;
      }

      return this.recipients(
        notification.audience,
        notification.senderId,
        notification.realm
      ).length;
    },

    notification(id) {
      const notification = load().notifications.find(
        item => item.id === id
      );

      if (
        !notification ||
        notification.realm !== currentRealm()
      ) {
        return null;
      }

      return notification;
    },

    createNotification(info) {
      info = info || {};

      const realm = info.realm || currentRealm();

      const notification = Object.assign({
        id: uid('n'),
        createdAt: new Date().toISOString(),
        scheduledAt: null,
        sentAt: null,
        status: 'draft',
        recipients: [],
        reads: {},
        realm
      }, info);

      notification.realm = realm;

      load().notifications.push(notification);

      save();

      return notification;
    },

    sendNow(notification) {
      if (
        !notification ||
        notification.realm !== currentRealm()
      ) {
        return {
          ok: false,
          error: 'Bildirim alanı doğrulanamadı.'
        };
      }

      notification.recipients = this.recipients(
        notification.audience,
        notification.senderId,
        notification.realm
      );

      notification.reads = {};
      notification.sentAt = new Date().toISOString();
      notification.status = 'sent';

      const sender = notification.senderId
        ? this.user(notification.senderId)
        : null;

      this.log(
        (sender ? sender.name : 'ODES') +
        ' "' + notification.title +
        '" bildirimini gönderdi.',
        notification.realm
      );

      save();

      return { ok: true };
    },

    processScheduled() {
      const data = load();
      let changed = false;

      data.notifications.forEach(notification => {
        if (
          notification.status === 'scheduled' &&
          notification.scheduledAt &&
          new Date(notification.scheduledAt).getTime() <= Date.now()
        ) {
          notification.recipients = this.recipients(
            notification.audience,
            notification.senderId,
            notification.realm
          );

          notification.reads = {};
          notification.sentAt = notification.scheduledAt;
          notification.status = 'sent';

          changed = true;
        }
      });

      if (changed) save();
    },

    deleteNotification(id) {
      const notification = this.notification(id);

      if (!notification) return;

      const data = load();

      data.notifications = data.notifications.filter(
        item => item.id !== id
      );

      save();
    },

    inboxFor(userId) {
      const user = this.user(userId);

      if (!user || user.status !== 'active') {
        return [];
      }

      return load().notifications
        .filter(notification =>
          notification.realm === getUserRealm(user) &&
          notification.status === 'sent' &&
          safeArray(notification.recipients).includes(userId)
        )
        .sort((a, b) =>
          new Date(b.sentAt) - new Date(a.sentAt)
        )
        .map(notification => ({
          n: notification,
          read: !!notification.reads[userId]
        }));
    },

    markRead(notificationId, userId) {
      const user = this.user(userId);
      const notification = this.notification(notificationId);

      if (
        !user ||
        !notification ||
        !safeArray(notification.recipients).includes(userId)
      ) {
        return;
      }

      notification.reads = notification.reads || {};
      notification.reads[userId] = new Date().toISOString();

      save();
    },

    markAllRead(userId) {
      const user = this.user(userId);

      if (!user) return;

      this.inboxFor(userId).forEach(item => {
        if (!item.read) {
          item.n.reads = item.n.reads || {};
          item.n.reads[userId] = new Date().toISOString();
        }
      });

      save();
    },

    /* =====================================
       SORUN BİLDİRİM SİSTEMİ
    ===================================== */

    reportById(id) {
      const report = load().reports.find(
        item => item.id === id
      );

      if (!report || report.realm !== currentRealm()) {
        return null;
      }

      return report;
    },

    reportsForStudent(studentId) {
      const student = this.user(studentId);

      if (!student || student.role !== 'student') {
        return [];
      }

      return load().reports
        .filter(report =>
          report.realm === getUserRealm(student) &&
          (report.reporterId || report.studentId) === studentId
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

      const classes = safeArray(teacher.classes);

      return load().reports
        .filter(report =>
          report.realm === getUserRealm(teacher) &&
          (
            report.anonymous ||
            report.assignedTeacherId === teacherId ||
            classes.includes(report.class)
          )
        )
        .sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        .map(report => {
          const item = Object.assign({}, report);

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
        .filter(report =>
          report.realm === currentRealm()
        )
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

      if (!user || user.status !== 'active') {
        return [];
      }

      let reports = [];

      if (user.role === 'admin') {
        reports = this.allReports();
      } else if (user.role === 'teacher') {
        reports = this.reportsForTeacher(userId);
      } else if (user.role === 'student') {
        // Öğrenci yalnızca kendi bildirimlerini görebilir.
        reports = this.reportsForStudent(userId);
      }

      return reports.map(report => {
        const item = Object.assign({}, report);

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

      const anonymous =
        info.anonymous === true ||
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

      if (!SCHOOL_LOCATIONS.includes(location)) {
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
      const realm = getUserRealm(student);

      const report = {
        id: uid('r'),
        realm,

        // Kimlik, yönetici tarafından gerektiğinde incelenebilir.
        reporterId: student.id,

        studentId: anonymous ? null : student.id,
        studentName: anonymous
          ? 'Anonim öğrenci'
          : student.name,

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
          actorName: anonymous
            ? 'Anonim öğrenci'
            : student.name,
          note: 'Bildirim oluşturuldu.',
          at: now
        }]
      };

      const data = load();

      data.reports.unshift(report);

      // Yalnızca aynı veri alanındaki yönetici ve öğretmenler.
      const recipients = data.users
        .filter(user =>
          user.status === 'active' &&
          getUserRealm(user) === realm &&
          (
            user.role === 'admin' ||
            (
              user.role === 'teacher' &&
              (
                anonymous ||
                safeArray(user.classes).includes(student.class)
              )
            )
          )
        )
        .map(user => user.id);

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

        senderId: null,
        realm
      });

      this.sendNow(notification);

      this.log(
        anonymous
          ? 'Anonim bir okul güvenliği bildirimi oluşturuldu.'
          : student.name +
            ' yeni bir okul güvenliği bildirimi oluşturdu.',
        realm
      );

      save();

      const visibleReport = Object.assign({}, report, {
        studentId: anonymous ? null : student.id,
        studentName: anonymous
          ? 'Anonim öğrenci'
          : student.name,
        reporterId: undefined
      });

      return {
        ok: true,
        report: visibleReport
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
        !['teacher', 'admin'].includes(actor.role) ||
        report.realm !== getUserRealm(actor)
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
        report.assignedTeacherId !== actor.id &&
        !safeArray(actor.classes).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Bu bildirim üzerinde işlem yapamazsın.'
        };
      }

      const now = new Date().toISOString();
      const cleanNote = String(note || '').trim().slice(0, 500);

      report.status = status;
      report.updatedAt = now;

      if (actor.role === 'teacher') {
        report.assignedTeacherId = actor.id;
      }

      report.history = safeArray(report.history);

      report.history.push({
        status,
        actorId: actor.id,
        actorName: actor.name,
        note: cleanNote ||
          REPORT_STATUSES[status] + ' olarak güncellendi.',
        at: now
      });

      save();

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

          senderId: actor.id,
          realm: report.realm
        });

        this.sendNow(notification);
      }

      this.log(
        actor.name +
        ', "' + report.title +
        '" bildirimini "' +
        REPORT_STATUSES[status] +
        '" yaptı.',
        report.realm
      );

      return {
        ok: true,
        report
      };
    },

    assignReport(reportId, teacherId, actorId) {
      const report = this.reportById(reportId);
      const teacher = this.user(teacherId);
      const actor = this.user(actorId);

      if (
        !report ||
        !teacher ||
        teacher.role !== 'teacher' ||
        teacher.status !== 'active' ||
        report.realm !== getUserRealm(teacher)
      ) {
        return {
          ok: false,
          error: 'Bildirim veya öğretmen bulunamadı.'
        };
      }

      if (
        !actor ||
        actor.status !== 'active' ||
        !['admin', 'teacher'].includes(actor.role) ||
        report.realm !== getUserRealm(actor)
      ) {
        return {
          ok: false,
          error: 'Bu işlem için yetkili hesap gerekli.'
        };
      }

      if (
        actor.role === 'teacher' &&
        !report.anonymous &&
        !safeArray(actor.classes).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Bu bildirim üzerinde işlem yapamazsın.'
        };
      }

      if (
        !report.anonymous &&
        !safeArray(teacher.classes).includes(report.class)
      ) {
        return {
          ok: false,
          error: 'Seçilen öğretmen bu sınıftan sorumlu değil.'
        };
      }

      report.assignedTeacherId = teacher.id;
      report.updatedAt = new Date().toISOString();

      report.history = safeArray(report.history);

      report.history.push({
        status: report.status,
        actorId: actor.id,
        actorName: actor.name,
        note:
          teacher.name +
          ' bildirimden sorumlu öğretmen olarak atandı.',
        at: report.updatedAt
      });

      save();

      this.log(
        teacher.name +
        ' bir okul güvenliği bildirimi için sorumlu öğretmen olarak atandı.',
        report.realm
      );

      return { ok: true, report };
    },

    reportStats() {
      const reports = this.allReports();

      return {
        total: reports.length,
        new: reports.filter(r => r.status === 'new').length,
        reviewing: reports.filter(r => r.status === 'reviewing').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        closed: reports.filter(r => r.status === 'closed').length
      };
    },

    /* =====================================
       YARDIMCI FONKSİYONLAR
    ===================================== */

    students(className) {
      return load().users.filter(user =>
        user.role === 'student' &&
        user.status === 'active' &&
        getUserRealm(user) === currentRealm() &&
        (!className || user.class === className)
      );
    },

    coursesOfTeacher(teacherId) {
      const teacher = this.user(teacherId);

      if (!teacher || teacher.role !== 'teacher') {
        return [];
      }

      return load().courses.filter(course =>
        course.teacherId === teacherId
      );
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
