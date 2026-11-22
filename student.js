
/* =========================================
   ODES — ÖĞRENCİ PANELİ
   Okul güvenliği, risk bildirimi ve takip
========================================= */

(function () {
  'use strict';

  const {
    $, esc, icon, store, sections, statCard,
    emptyState, fmtDT, fmtLong, renderInbox, toast
  } = ODES;

  const REPORT_STATUS = ODES.REPORT_STATUSES || {
    new: 'Yeni',
    reviewing: 'İnceleniyor',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı'
  };

  const REPORT_CATEGORY = ODES.REPORT_CATEGORIES || {
    bullying: 'Akran zorbalığı',
    safety: 'Güvenlik',
    facility: 'Fiziksel ortam',
    communication: 'İletişim sorunu',
    other: 'Diğer'
  };

  const REPORT_SEVERITY = ODES.REPORT_SEVERITIES || {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik'
  };

  const REPORT_FREQUENCY = ODES.REPORT_FREQUENCIES || {
    once: 'İlk kez',
    sometimes: 'Ara sıra',
    often: 'Sık sık',
    constant: 'Sürekli'
  };

  const SCHOOL_LOCATIONS = ODES.SCHOOL_LOCATIONS || [];

  const STATUS_CLASS = {
    new: 'b-info',
    reviewing: 'b-warning',
    resolved: 'b-success',
    closed: 'b-neutral'
  };

  ODES.pages.student = function (root, user) {

    /* =====================================
       ORTAK YARDIMCILAR
    ===================================== */

    // Yalnızca öğrencinin kendi bildirimleri.
    function getMyReports() {
      return store.reportsForStudent(user.id) || [];
    }

    // Öğrencinin kendi bildirimleri + tüm anonim bildirimler.
    function getVisibleReports() {
      if (typeof store.reportsVisibleTo === 'function') {
        return store.reportsVisibleTo(user.id) || [];
      }

      return getMyReports();
    }

    function isMyReport(report) {
      return getMyReports().some(r => r.id === report.id);
    }

    function statusBadge(status) {
      return '<span class="badge ' +
        (STATUS_CLASS[status] || 'b-neutral') + '">' +
        esc(REPORT_STATUS[status] || 'Bilinmiyor') +
        '</span>';
    }

    function categoryName(category) {
      return REPORT_CATEGORY[category] || 'Diğer';
    }

    function reportCard(report) {
      const history = (report.history || []).slice().reverse();
      const mine = isMyReport(report);

      return '<article class="card" style="margin-top:12px">' +

        '<div class="card-h">' +
          '<div class="grow">' +
            '<h3>' + esc(report.title) + '</h3>' +
            '<small class="muted">' +
              esc(categoryName(report.category)) +
              ' · ' + esc(fmtDT(report.createdAt)) +
            '</small>' +
          '</div>' +
          statusBadge(report.status) +
        '</div>' +

        '<div style="margin:8px 0">' +
          (mine
            ? '<span class="badge b-primary">Senin bildirimin</span>'
            : '<span class="badge b-neutral">Anonim bildirim</span>'
          ) +
        '</div>' +

        '<p>' + esc(report.description) + '</p>' +

        '<div class="grid g2" style="margin-top:12px">' +

          '<div class="muted small">' +
            '<b>Konum:</b> ' +
            esc(report.location || 'Belirtilmedi') +
          '</div>' +

          '<div class="muted small">' +
            '<b>Önem:</b> ' +
            esc(REPORT_SEVERITY[report.severity] || 'Belirtilmedi') +
          '</div>' +

          '<div class="muted small">' +
            '<b>Sıklık:</b> ' +
            esc(REPORT_FREQUENCY[report.frequency] || 'Belirtilmedi') +
          '</div>' +

          '<div class="muted small">' +
            '<b>Bildirim türü:</b> ' +
            (report.anonymous ? 'Anonim' : 'Kimlikli') +
          '</div>' +

        '</div>' +

        '<div class="muted small" style="margin-top:10px">' +
          'Bildirim numarası: ' + esc(report.id) +
        '</div>' +

        '<details style="margin-top:12px">' +
          '<summary>İşlem geçmişi (' + history.length + ')</summary>' +

          '<div class="list" style="margin-top:10px">' +

            (history.length
              ? history.map(h =>
                  '<div class="li">' +
                    '<div class="grow">' +
                      '<b>' +
                        esc(REPORT_STATUS[h.status] || 'Güncelleme') +
                      '</b>' +

                      '<small class="muted">' +
                        esc(h.actorName || 'ODES') +
                        ' · ' + esc(fmtDT(h.at)) +
                      '</small>' +

                      '<small>' + esc(h.note || '') + '</small>' +
                    '</div>' +
                  '</div>'
                ).join('')

              : '<p class="muted small">Henüz işlem yapılmamış.</p>'
            ) +

          '</div>' +
        '</details>' +

      '</article>';
    }

    /* =====================================
       GENEL BAKIŞ
    ===================================== */

    function overview(el) {
      const inbox = store.inboxFor(user.id) || [];
      const unread = inbox.filter(x => !x.read).length;

      const reports = getMyReports();

      const active = reports.filter(r =>
        r.status === 'new' || r.status === 'reviewing'
      ).length;

      const resolved = reports.filter(r =>
        r.status === 'resolved' || r.status === 'closed'
      ).length;

      const latestReports = reports.slice(0, 3);

      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="card hero">' +
            '<div>' +
              '<h2>Merhaba, ' +
                esc((user.name || 'Öğrenci').split(' ')[0]) +
              '</h2>' +

              '<p>' +
                esc(user.class || '') +
                ' sınıfı · ' + esc(fmtLong()) +
              '</p>' +
            '</div>' +

            '<a class="btn btn-light" href="#inbox">' +
              icon('bell', 16) +
              (unread
                ? unread + ' okunmamış bildirim'
                : 'Bildirimlerim'
              ) +
            '</a>' +
          '</div>' +

          '<div class="grid g4">' +

            statCard({
              label: 'Bildirimlerim',
              value: reports.length,
              icon: 'clipboard-list',
              tone: 'primary',
              href: '#reports'
            }) +

            statCard({
              label: 'İnceleme bekleyen',
              value: active,
              icon: 'clock',
              tone: active ? 'warning' : 'success',
              href: '#reports'
            }) +

            statCard({
              label: 'Sonuçlanan',
              value: resolved,
              icon: 'check-circle',
              tone: 'success',
              href: '#reports'
            }) +

            statCard({
              label: 'Okunmamış bildirim',
              value: unread,
              icon: 'bell',
              tone: unread ? 'warning' : 'info',
              href: '#inbox'
            }) +

          '</div>' +

          '<div class="grid g-main">' +

            '<div class="stack-v">' +

              '<div class="card">' +

                '<div class="card-h">' +
                  '<div>' +
                    '<h3>Okul güvenliği</h3>' +
                    '<p class="muted small">' +
                      'Karşılaştığın sorunları güvenli okul ortamı için bildir.' +
                    '</p>' +
                  '</div>' +

                  icon('shield-check', 22) +
                '</div>' +

                '<p class="muted">' +
                  'Okulun herhangi bir bölümünde karşılaştığın ' +
                  'güvenlik sorunlarını, fiziksel ortam problemlerini ' +
                  've diğer riskleri ODES üzerinden iletebilirsin.' +
                '</p>' +

                '<button type="button" class="btn btn-primary" id="overviewReportBtn">' +
                  icon('plus', 16) +
                  ' Sorun bildir' +
                '</button>' +

              '</div>' +

              '<div class="card">' +

                '<div class="card-h">' +
                  '<h3>Son bildirimlerim</h3>' +
                  '<a href="#reports">Tümünü gör</a>' +
                '</div>' +

                (latestReports.length
                  ? '<div class="list">' +
                      latestReports.map(r =>
                        '<div class="li">' +
                          '<div class="grow">' +
                            '<b>' + esc(r.title) + '</b>' +
                            '<small class="muted">' +
                              esc(categoryName(r.category)) +
                              ' · ' + esc(fmtDT(r.createdAt)) +
                            '</small>' +
                          '</div>' +
                          statusBadge(r.status) +
                        '</div>'
                      ).join('') +
                    '</div>'

                  : emptyState(
                      'Henüz bir sorun bildirimi oluşturmadın.',
                      'clipboard-list'
                    )
                ) +

              '</div>' +

            '</div>' +

            '<div class="card">' +

              '<div class="card-h">' +
                '<h3>Son okul bildirimleri</h3>' +
                '<a href="#inbox">Tümünü gör</a>' +
              '</div>' +

              (inbox.slice(0, 5).map(x =>
                '<div class="li">' +
                  '<div class="grow">' +

                    (x.read
                      ? ''
                      : '<span class="badge b-primary" style="margin-right:6px">Yeni</span>'
                    ) +

                    '<b>' + esc(x.n.title) + '</b>' +

                    '<small class="muted">' +
                      esc(fmtDT(x.n.sentAt)) +
                    '</small>' +

                  '</div>' +
                '</div>'
              ).join('') || emptyState('Henüz bildirim yok.', 'bell')) +

            '</div>' +

          '</div>' +
        '</div>';

      $('#overviewReportBtn', el).addEventListener('click', () => {
        reportCreate(el);
      });
    }

    /* =====================================
       YENİ SORUN BİLDİRİMİ
    ===================================== */

    function reportCreate(el) {
      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="card">' +

            '<div class="card-h">' +
              '<div>' +
                '<h3>Yeni sorun bildirimi</h3>' +
                '<p class="muted small">' +
                  'Okul ortamındaki riskleri ve sorunları bize ilet.' +
                '</p>' +
              '</div>' +

              '<span class="badge b-primary">Öğrenci</span>' +
            '</div>' +

            '<form id="reportForm" class="stack-v">' +

              '<div>' +
                '<label for="reportTitle">Bildirim başlığı</label>' +
                '<input id="reportTitle" class="input" type="text" ' +
                  'maxlength="100" required ' +
                  'placeholder="Sorunu kısaca ifade et...">' +
              '</div>' +

              '<div>' +
                '<label for="reportCategory">Sorun kategorisi</label>' +
                '<select id="reportCategory" class="input" required>' +

                  Object.keys(REPORT_CATEGORY).map(key =>
                    '<option value="' + esc(key) + '">' +
                      esc(REPORT_CATEGORY[key]) +
                    '</option>'
                  ).join('') +

                '</select>' +
              '</div>' +

              '<div>' +
                '<label for="reportLocation">Sorunun bulunduğu konum</label>' +
                '<select id="reportLocation" class="input" required>' +

                  '<option value="">Konum seç</option>' +

                  SCHOOL_LOCATIONS.map(location =>
                    '<option value="' + esc(location) + '">' +
                      esc(location) +
                    '</option>'
                  ).join('') +

                '</select>' +
              '</div>' +

              '<div>' +
                '<label for="reportSeverity">Sorunun önem derecesi</label>' +

                '<select id="reportSeverity" class="input" required>' +
                  '<option value="low">Düşük</option>' +
                  '<option value="medium" selected>Orta</option>' +
                  '<option value="high">Yüksek</option>' +
                  '<option value="critical">Kritik</option>' +
                '</select>' +

                '<small class="muted">' +
                  'Sorunun okul güvenliği açısından ne kadar önemli olduğunu belirt.' +
                '</small>' +
              '</div>' +

              '<div>' +
                '<label for="reportFrequency">Ne sıklıkla yaşanıyor?</label>' +

                '<select id="reportFrequency" class="input" required>' +
                  '<option value="once">İlk kez</option>' +
                  '<option value="sometimes" selected>Ara sıra</option>' +
                  '<option value="often">Sık sık</option>' +
                  '<option value="constant">Sürekli</option>' +
                '</select>' +
              '</div>' +

              '<div>' +
                '<label for="reportDescription">Sorunun açıklaması</label>' +

                '<textarea id="reportDescription" class="input" rows="6" ' +
                  'maxlength="2000" required ' +
                  'placeholder="Sorunun ne olduğunu, nerede ve nasıl yaşandığını anlat..."></textarea>' +
              '</div>' +

              '<div class="card" style="background:var(--pale);border:1px solid var(--border)">' +

                '<h3>Gizlilik tercihi</h3>' +

                '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">' +

                  '<input type="checkbox" id="reportAnonymous" style="margin-top:4px">' +

                  '<span>' +
                    '<b>Anonim olarak bildirmek istiyorum</b>' +

                    '<small class="muted" style="display:block">' +
                      'Anonim bildirimler diğer kullanıcılar tarafından ' +
                      'kimlik bilgileri olmadan görüntülenebilir. ' +
                      'Bu prototipte gönderenin kimliğini yalnızca yönetici ' +
                      'panelinde görüntüleme hedeflenmiştir.' +
                    '</small>' +
                  '</span>' +

                '</label>' +

              '</div>' +

              '<div class="card" style="background:var(--surface)">' +
                '<p class="muted small">' +
                  '<b>Önemli:</b> Bildiriminde şifre, telefon numarası, ' +
                  'adres veya gereksiz kişisel bilgiler paylaşma. ' +
                  'Bu sürüm bir demo prototipidir; gerçek ve güvenli ' +
                  'bir gizli başvuru sistemi değildir.' +
                '</p>' +
              '</div>' +

              '<div class="row" style="justify-content:space-between;flex-wrap:wrap">' +

                '<button type="button" class="btn btn-ghost" id="cancelReportBtn">' +
                  'Vazgeç' +
                '</button>' +

                '<button type="submit" class="btn btn-primary" id="submitReportBtn">' +
                  icon('send', 16) +
                  ' Bildirimi gönder' +
                '</button>' +

              '</div>' +

            '</form>' +
          '</div>' +
        '</div>';

      $('#cancelReportBtn', el).addEventListener('click', () => {
        reports(el);
      });

      $('#reportForm', el).addEventListener('submit', e => {
        e.preventDefault();

        const button = $('#submitReportBtn', el);
        button.disabled = true;

        const result = store.createReport({
          studentId: user.id,
          title: $('#reportTitle', el).value,
          category: $('#reportCategory', el).value,
          location: $('#reportLocation', el).value,
          severity: $('#reportSeverity', el).value,
          frequency: $('#reportFrequency', el).value,
          description: $('#reportDescription', el).value,
          anonymous: $('#reportAnonymous', el).checked
        });

        if (!result || !result.ok) {
          button.disabled = false;

          toast(
            result && result.error
              ? result.error
              : 'Bildirim oluşturulamadı.',
            'error'
          );

          return;
        }

        toast('Bildirimin başarıyla oluşturuldu.', 'success');
        reports(el);
      });
    }

    /* =====================================
       BİLDİRİM TAKİBİ
    ===================================== */

    function reports(el) {
      const items = getVisibleReports();

      const active = items.filter(r =>
        r.status === 'new' || r.status === 'reviewing'
      ).length;

      const resolved = items.filter(r =>
        r.status === 'resolved' || r.status === 'closed'
      ).length;

      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="grid g4">' +

            statCard({
              label: 'Görüntülenebilen bildirim',
              value: items.length,
              icon: 'clipboard-list',
              tone: 'primary'
            }) +

            statCard({
              label: 'Yeni',
              value: items.filter(r => r.status === 'new').length,
              icon: 'plus-circle',
              tone: 'info'
            }) +

            statCard({
              label: 'İnceleniyor',
              value: items.filter(r => r.status === 'reviewing').length,
              icon: 'clock',
              tone: 'warning'
            }) +

            statCard({
              label: 'Sonuçlanan',
              value: resolved,
              icon: 'check-circle',
              tone: 'success'
            }) +

          '</div>' +

          '<div class="card">' +

            '<div class="card-h">' +
              '<div>' +
                '<h3>Bildirimler</h3>' +
                '<p class="muted small">' +
                  'Kendi bildirimlerini ve anonim olarak paylaşılan ' +
                  'okul güvenliği bildirimlerini görüntüleyebilirsin.' +
                '</p>' +
              '</div>' +

              '<button type="button" class="btn btn-primary" id="newReportBtn">' +
                icon('plus', 16) +
                ' Yeni bildirim' +
              '</button>' +

            '</div>' +

            '<div id="reportList"></div>' +

          '</div>' +

        '</div>';

      $('#newReportBtn', el).addEventListener('click', () => {
        reportCreate(el);
      });

      const list = $('#reportList', el);

      if (!items.length) {
        list.innerHTML =
          emptyState(
            'Henüz görüntülenebilecek bir bildirim yok.',
            'clipboard-list'
          ) +

          '<p class="muted small">' +
            'Okul ortamında karşılaştığın bir sorunu bildirmek için ' +
            '"Yeni bildirim" butonunu kullanabilirsin.' +
          '</p>';

        return;
      }

      list.innerHTML =
        '<div class="stack-v">' +
          items.map(reportCard).join('') +
        '</div>';
    }

    /* =====================================
       GELEN BİLDİRİMLER
    ===================================== */

    function inbox(el) {
      renderInbox(el, user);
    }

    /* =====================================
       ÖĞRENCİ MENÜSÜ
    ===================================== */

    sections(root, {

      overview: {
        title: 'Genel bakış',
        sub: 'Okul güvenliği ve bildirim merkezi.',
        render: overview
      },

      createReport: {
        title: 'Sorun bildir',
        sub: 'Okul ortamındaki riskleri ve sorunları ilet.',
        render: reportCreate
      },

      reports: {
        title: 'Bildirim takibi',
        sub: 'Kendi bildirimlerini ve anonim bildirimleri görüntüle.',
        render: reports
      },

      inbox: {
        title: 'Bildirimlerim',
        sub: 'Okul yönetiminden gelen bildirimler.',
        render: inbox
      }

    }, 'overview');
  };

})();
