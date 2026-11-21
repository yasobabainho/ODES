
(function () {
  'use strict';

  const {
    $, $$, esc, icon, store, sections, statCard, emptyState,
    fmtDT, fmtD, fmtLong, relDue, typeBadge, renderInbox, charts, toast
  } = ODES;

  const REPORT_STATUS = {
    new: 'Yeni',
    reviewing: 'İnceleniyor',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı'
  };

  const REPORT_CATEGORY = {
    bullying: 'Akran zorbalığı',
    safety: 'Güvenlik',
    facility: 'Fiziksel ortam',
    communication: 'İletişim sorunu',
    other: 'Diğer'
  };

  ODES.pages.student = function (root, user) {

    function overview(el) {
      const inbox = store.inboxFor(user.id);
      const unread = inbox.filter(x => !x.read).length;
      const asg = store.assignmentsFor(user);
      const pending = asg.filter(a => !a.isDone);
      const avg = store.overallAvg(user.id);
      const abs = store.absences(user.id);
      const today = new Date().getDay();
      const lessons = store.scheduleFor(user.class).filter(l => l.day === today);
      const reports = store.reportsForStudent(user.id);
      const activeReports = reports.filter(r => r.status !== 'resolved' && r.status !== 'closed');

      el.innerHTML =
        '<div class="stack-v">' +
        '<div class="card hero"><div><h2>Merhaba, ' + esc(user.name.split(' ')[0]) + '</h2><p>' + esc(user.class) + ' sınıfı · ' + esc(fmtLong()) + '</p></div>' +
        '<a class="btn btn-light" href="#inbox">' + icon('bell', 16) + (unread ? unread + ' okunmamış bildirim' : 'Bildirimlerim') + '</a></div>' +

        '<div class="grid g4">' +
          statCard({ label: 'Okunmamış bildirim', value: unread, icon: 'bell', tone: unread ? 'warning' : 'success', href: '#inbox' }) +
          statCard({ label: 'Bekleyen ödev', value: pending.length, icon: 'book', tone: 'primary', href: '#assignments' }) +
          statCard({ label: 'Not ortalaması', value: avg == null ? '—' : avg, icon: 'chart', tone: 'success', href: '#grades' }) +
          statCard({ label: 'Devamsızlık (gün)', value: abs, icon: 'clipboard', tone: abs > 2 ? 'danger' : 'info' }) +
        '</div>' +

        '<div class="grid g-main">' +
          '<div class="stack-v">' +
            '<div class="card"><div class="card-h"><h3>Bugünün dersleri</h3><a href="#schedule">Tüm program</a></div>' +
              (lessons.length ? '<div class="list">' + lessons.map(l =>
                '<div class="li"><span class="timecell">' + esc(l.time) + '</span><div class="grow"><b>' +
                esc(l.courseName) + '</b><small class="muted">' + esc(l.teacher) + ' · ' + esc(l.room) +
                '</small></div></div>'
              ).join('') + '</div>' : emptyState('Bugün ders görünmüyor.', 'calendar')) +
            '</div>' +

            '<div class="card"><div class="card-h"><h3>Yaklaşan ödevler</h3><a href="#assignments">Tümü</a></div><div id="ovAsg"></div></div>' +

            '<div class="card"><div class="card-h"><h3>Bildirimlerim</h3><a href="#reports">Tümünü takip et</a></div>' +
              '<p class="muted">Açık bildirim sayısı: <b>' + activeReports.length + '</b></p>' +
              '<a class="btn btn-primary" href="#reports">' + icon('clipboard-list', 16) + ' Bildirimlerimi takip et</a>' +
            '</div>' +
          '</div>' +

          '<div class="card"><div class="card-h"><h3>Son bildirimler</h3><a href="#inbox">Tümü</a></div>' +
            (inbox.slice(0, 4).map(x =>
              '<div class="li"><div class="grow"><b>' +
              (x.read ? '' : '<span class="badge b-primary" style="margin-right:6px">Yeni</span>') +
              esc(x.n.title) + '</b><small class="muted">' + esc(fmtDT(x.n.sentAt)) +
              '</small></div>' + typeBadge(x.n.type) + '</div>'
            ).join('') || emptyState('Bildirim yok.')) +
          '</div>' +
        '</div></div>';

      drawAssignmentList($('#ovAsg', el), pending.slice(0, 3), () => overview(el));
    }

    function drawAssignmentList(el, items, onChange) {
      if (!items.length) {
        el.innerHTML = emptyState('Gösterilecek ödev yok.', 'book');
        return;
      }

      el.innerHTML = '<div class="list">' + items.map(a => {
        const d = relDue(a.due, a.isDone);

        return '<div class="li"><button type="button" class="chk ' + (a.isDone ? 'on' : '') +
          '" data-aid="' + esc(a.id) + '" role="checkbox" aria-checked="' + a.isDone +
          '" aria-label="' + esc(a.title) + ' tamamlandı olarak işaretle">' +
          (a.isDone ? icon('check', 16) : '') + '</button>' +
          '<div class="grow"><b class="' + (a.isDone ? 'done-text' : '') + '">' +
          esc(a.title) + '</b><small class="muted">' + esc(a.courseName) +
          ' · Teslim: ' + esc(fmtD(a.due)) + '</small></div>' +
          '<span class="badge ' + d.cls + '">' + esc(d.text) + '</span></div>';
      }).join('') + '</div>';

      $$('[data-aid]', el).forEach(b => b.addEventListener('click', () => {
        store.toggleAssignment(b.dataset.aid, user.id);
        toast('Ödev durumu güncellendi.', 'success');
        onChange();
      }));
    }

    function assignments(el) {
      let filter = 'pending';

      function draw() {
        const all = store.assignmentsFor(user);
        const list = filter === 'pending'
          ? all.filter(a => !a.isDone)
          : filter === 'done'
            ? all.filter(a => a.isDone)
            : all;

        el.innerHTML = '<div class="card"><div class="toolbar"><div class="tabs">' +
          [['pending', 'Bekleyen', all.filter(a => !a.isDone).length],
           ['done', 'Tamamlanan', all.filter(a => a.isDone).length],
           ['all', 'Tümü', all.length]]
            .map(t => '<button type="button" class="tab ' + (filter === t[0] ? 'active' : '') +
              '" data-f="' + t[0] + '">' + t[1] + '<small>' + t[2] + '</small></button>')
            .join('') +
          '</div></div><div id="aList"></div></div>';

        $$('[data-f]', el).forEach(b => b.addEventListener('click', () => {
          filter = b.dataset.f;
          draw();
        }));

        drawAssignmentList($('#aList', el), list, draw);
      }

      draw();
    }

    function grades(el) {
      const rows = store.gradesFor(user.id);
      const avg = store.overallAvg(user.id);

      el.innerHTML = '<div class="stack-v"><div class="grid g-main">' +
        '<div class="card flush"><div class="card-h"><h3>Ders notları</h3><span class="badge b-primary">Genel ortalama: ' +
        (avg == null ? '—' : avg) + '</span></div>' +
        '<div class="table-wrap"><table class="table stack"><thead><tr><th>Ders</th><th>Vize (%40)</th><th>Quiz (%20)</th><th>Proje (%40)</th><th>Ortalama</th></tr></thead><tbody>' +
        (rows.map(r =>
          '<tr><td data-label="Ders"><b>' + esc(r.course.name) + '</b></td>' +
          '<td data-label="Vize">' + (r.g ? r.g.vize : '—') + '</td>' +
          '<td data-label="Quiz">' + (r.g ? r.g.quiz : '—') + '</td>' +
          '<td data-label="Proje">' + (r.g ? r.g.proje : '—') + '</td>' +
          '<td data-label="Ortalama"><span class="badge ' +
          (r.avg == null ? 'b-neutral' : r.avg >= 70 ? 'b-success' : r.avg >= 55 ? 'b-warning' : 'b-danger') +
          '">' + (r.avg == null ? '—' : r.avg) + '</span></td></tr>'
        ).join('') || '<tr><td colspan="5">' + emptyState('Not bilgisi yok.') + '</td></tr>') +
        '</tbody></table></div></div>' +
        '<div class="card"><div class="card-h"><h3>Ders ortalamaları</h3></div>' +
        charts.cols(rows.filter(r => r.avg != null).map(r => ({
          label: r.course.name.split(' ')[0],
          value: Math.round(r.avg)
        })), { max: 100, height: 200, label: 'Ders ortalamaları' }) +
        '</div></div><p class="muted small">Notlar demo verisidir.</p></div>';
    }

    function schedule(el) {
      const dow = new Date().getDay();
      let day = dow >= 1 && dow <= 5 ? dow : 1;

      const names = {
        1: 'Pazartesi',
        2: 'Salı',
        3: 'Çarşamba',
        4: 'Perşembe',
        5: 'Cuma'
      };

      function draw() {
        const items = store.scheduleFor(user.class)
          .filter(l => l.day === day)
          .sort((a, b) => a.time.localeCompare(b.time));

        el.innerHTML = '<div class="card"><div class="toolbar"><div class="tabs" role="tablist">' +
          [1, 2, 3, 4, 5].map(d =>
            '<button type="button" role="tab" aria-selected="' + (d === day) +
            '" class="tab ' + (d === day ? 'active' : '') +
            '" data-d="' + d + '">' + names[d] + '</button>'
          ).join('') +
          '</div><span class="badge b-info">' + esc(user.class) + ' sınıfı</span></div>' +
          (items.length
            ? '<div class="list">' + items.map(l =>
              '<div class="li"><span class="timecell">' + esc(l.time) +
              '</span><div class="grow"><b>' + esc(l.courseName) +
              '</b><small class="muted">' + esc(l.teacher) +
              '</small></div><span class="badge b-neutral">' + esc(l.room) +
              '</span></div>'
            ).join('') + '</div>'
            : emptyState('Bu gün için ders yok.', 'calendar')) +
          '</div>';

        $$('[data-d]', el).forEach(b => b.addEventListener('click', () => {
          day = Number(b.dataset.d);
          draw();
        }));
      }

      draw();
    }

    /* ---------- Sorun bildir ---------- */
    function reportCreate(el) {
      el.innerHTML =
        '<div class="card">' +
          '<div class="card-h"><h3>Yeni bildirim oluştur</h3><span class="badge b-primary">Öğrenci bildirimi</span></div>' +
          '<p class="muted">Okul ortamında karşılaştığın bir sorun veya iyileştirme önerisini buradan iletebilirsin.</p>' +
          '<form id="reportForm" class="stack-v">' +
            '<label for="reportCategory">Bildirim kategorisi</label>' +
            '<select id="reportCategory" class="input" required>' +
              '<option value="bullying">Akran zorbalığı</option>' +
              '<option value="safety">Güvenlik</option>' +
              '<option value="facility">Fiziksel ortam</option>' +
              '<option value="communication">İletişim sorunu</option>' +
              '<option value="other">Diğer</option>' +
            '</select>' +

            '<label for="reportTitle">Kısa başlık</label>' +
            '<input id="reportTitle" class="input" type="text" maxlength="100" placeholder="Örn. Sınıf ortamıyla ilgili bir sorun" required>' +

            '<label for="reportDescription">Açıklama</label>' +
            '<textarea id="reportDescription" class="input" rows="5" maxlength="2000" placeholder="Sorunu veya önerini genel hatlarıyla anlat..." required></textarea>' +

            '<p class="muted small">Gereksiz kişisel bilgi, şifre veya başka öğrencilerin özel bilgilerini yazma. Bu prototip gerçek ve gizli bir başvuru kanalı değildir.</p>' +
            '<div><button class="btn btn-primary" type="submit">' + icon('send', 16) + ' Bildirimi gönder</button></div>' +
          '</form>' +
        '</div>';

      const form = $('#reportForm', el);

      form.addEventListener('submit', e => {
        e.preventDefault();

        const result = store.createReport({
          studentId: user.id,
          category: $('#reportCategory', el).value,
          title: $('#reportTitle', el).value,
          description: $('#reportDescription', el).value
        });

        if (!result.ok) {
          toast(result.error || 'Bildirim oluşturulamadı.', 'error');
          return;
        }

        toast('Bildirimin başarıyla oluşturuldu.', 'success');
        reports(el);
      });
    }

    /* ---------- Bildirim geçmişi ve takip ---------- */
    function reports(el) {
      const items = store.reportsForStudent(user.id);

      const active = items.filter(r => r.status === 'new' || r.status === 'reviewing').length;
      const resolved = items.filter(r => r.status === 'resolved' || r.status === 'closed').length;

      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="grid g4">' +
            statCard({ label: 'Toplam bildirim', value: items.length, icon: 'clipboard-list', tone: 'primary' }) +
            statCard({ label: 'Yeni / İnceleniyor', value: active, icon: 'clock', tone: 'warning' }) +
            statCard({ label: 'Sonuçlanan', value: resolved, icon: 'check-circle', tone: 'success' }) +
          '</div>' +

          '<div class="card">' +
            '<div class="card-h"><div><h3>Bildirimlerim</h3><p class="muted small">Oluşturduğun bildirimlerin durumunu buradan takip edebilirsin.</p></div>' +
            '<button type="button" class="btn btn-primary" id="newReportBtn">' + icon('plus', 16) + ' Yeni bildirim</button></div>' +
            '<div id="reportList"></div>' +
          '</div>' +

        '</div>';

      $('#newReportBtn', el).addEventListener('click', () => reportCreate(el));

      const list = $('#reportList', el);

      if (!items.length) {
        list.innerHTML = emptyState('Henüz bir bildirim oluşturmadın.', 'clipboard-list') +
          '<p class="muted small">Bir sorun veya öneri iletmek için "Yeni bildirim" butonunu kullanabilirsin.</p>';
        return;
      }

      list.innerHTML = '<div class="stack-v">' + items.map(r => {
        const statusClass = {
          new: 'b-info',
          reviewing: 'b-warning',
          resolved: 'b-success',
          closed: 'b-neutral'
        }[r.status] || 'b-neutral';

        const history = (r.history || []).slice().reverse();

        return '<article class="card" style="margin-top:12px">' +
          '<div class="card-h">' +
            '<div class="grow"><h3>' + esc(r.title) + '</h3>' +
            '<small class="muted">' + esc(REPORT_CATEGORY[r.category] || 'Diğer') +
            ' · ' + esc(fmtDT(r.createdAt)) + '</small></div>' +
            '<span class="badge ' + statusClass + '">' + esc(REPORT_STATUS[r.status] || 'Bilinmiyor') + '</span>' +
          '</div>' +

          '<p>' + esc(r.description) + '</p>' +

          '<div class="muted small">Bildirim numarası: ' + esc(r.id) + '</div>' +

          '<details style="margin-top:12px">' +
            '<summary>İşlem geçmişini görüntüle (' + history.length + ')</summary>' +
            '<div class="list" style="margin-top:10px">' +
              history.map(h =>
                '<div class="li">' +
                  '<div class="grow"><b>' + esc(REPORT_STATUS[h.status] || 'Güncelleme') + '</b>' +
                  '<small class="muted">' + esc(h.actorName || 'ODES') + ' · ' + esc(fmtDT(h.at)) + '</small>' +
                  '<small>' + esc(h.note || '') + '</small></div>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</details>' +
        '</article>';
      }).join('') + '</div>';
    }

    function inbox(el) {
      renderInbox(el, user);
    }

    sections(root, {
      overview: {
        title: 'Genel bakış',
        render: overview
      },
      assignments: {
        title: 'Ödevlerim',
        sub: 'Tamamladığınız ödevleri işaretleyin.',
        render: assignments
      },
      grades: {
        title: 'Notlarım',
        render: grades
      },
      schedule: {
        title: 'Ders programı',
        render: schedule
      },
      inbox: {
        title: 'Bildirimlerim',
        sub: 'Okulunuzdan gelen duyurular ve hatırlatmalar.',
        render: inbox
      },
      createReport: {
        title: 'Sorun bildir',
        sub: 'Okul ortamıyla ilgili sorun veya önerilerini ilet.',
        render: reportCreate
      },
      reports: {
        title: 'Bildirim takibi',
        sub: 'Oluşturduğun bildirimlerin durumunu ve işlem geçmişini görüntüle.',
        render: reports
      }
    }, 'overview');
  };
})();
