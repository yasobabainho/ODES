
/* =========================================
   ODES — YÖNETİCİ PANELİ
   Okul güvenliği ve risk yönetimi
========================================= */

(function () {
  'use strict';

  const {
    $, $$, esc, icon, store, sections, statCard,
    emptyState, fmtDT, roleBadge, avatar,
    renderInbox, modal, confirmDialog, toast
  } = ODES;

  const STATUS = ODES.REPORT_STATUSES || {
    new: 'Yeni',
    reviewing: 'İnceleniyor',
    resolved: 'Çözüldü',
    closed: 'Kapatıldı'
  };

  const CATEGORY = ODES.REPORT_CATEGORIES || {};
  const SEVERITY = ODES.REPORT_SEVERITIES || {};
  const FREQUENCY = ODES.REPORT_FREQUENCIES || {};
  const LOCATIONS = ODES.SCHOOL_LOCATIONS || [];
  const CLASSES = ODES.CLASSES || [];

  const STATUS_CLASS = {
    new: 'b-info',
    reviewing: 'b-warning',
    resolved: 'b-success',
    closed: 'b-neutral'
  };

  const SEVERITY_CLASS = {
    low: 'b-neutral',
    medium: 'b-info',
    high: 'b-warning',
    critical: 'b-danger'
  };

  ODES.pages.admin = function (root, user) {

    /* =====================================
       ORTAK YARDIMCILAR
    ===================================== */

    const users = () => store.db().users;

    function reports() {
      return store.adminReports(user.id) || [];
    }

    function activeTeachers() {
      return users().filter(u =>
        u.role === 'teacher' && u.status === 'active'
      );
    }

    function statusBadge(status) {
      return '<span class="badge ' +
        (STATUS_CLASS[status] || 'b-neutral') + '">' +
        esc(STATUS[status] || 'Bilinmiyor') +
        '</span>';
    }

    function severityBadge(severity) {
      return '<span class="badge ' +
        (SEVERITY_CLASS[severity] || 'b-neutral') + '">' +
        esc(SEVERITY[severity] || 'Belirtilmedi') +
        '</span>';
    }

    function categoryName(category) {
      return CATEGORY[category] || 'Diğer';
    }

    function reportCountByLocation(location) {
      return reports().filter(r => r.location === location);
    }

    function refreshPage() {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    function reportRow(report) {
      const teacher = report.assignedTeacherId
        ? store.user(report.assignedTeacherId)
        : null;

      return '<tr>' +

        '<td data-label="Bildirim">' +
          '<b>' + esc(report.title) + '</b>' +
          '<small class="muted" style="display:block">' +
            esc(report.id) +
          '</small>' +
        '</td>' +

        '<td data-label="Kategori">' +
          esc(categoryName(report.category)) +
        '</td>' +

        '<td data-label="Konum">' +
          esc(report.location) +
        '</td>' +

        '<td data-label="Önem">' +
          severityBadge(report.severity) +
        '</td>' +

        '<td data-label="Durum">' +
          statusBadge(report.status) +
        '</td>' +

        '<td data-label="Gönderen">' +
          (report.anonymous
            ? '<span class="badge b-neutral">Anonim</span><small class="muted" style="display:block">Gönderen: ' +
                esc((store.user(report.reporterId) || {}).name || 'Bilinmiyor') +
              '</small>'
            : esc(report.studentName || 'Bilinmiyor')
          ) +
        '</td>' +

        '<td data-label="Sorumlu">' +
          esc(teacher ? teacher.name : 'Atanmadı') +
        '</td>' +

        '<td class="actions">' +
          '<button type="button" class="btn btn-sm btn-primary" data-detail="' +
            esc(report.id) + '">' +
            'Detay' +
          '</button>' +
        '</td>' +

      '</tr>';
    }

    /* =====================================
       GENEL BAKIŞ
    ===================================== */

    function overview(el) {
      const us = users();
      const all = reports();

      const students = us.filter(u =>
        u.role === 'student' && u.status === 'active'
      ).length;

      const teachers = us.filter(u =>
        u.role === 'teacher' && u.status === 'active'
      ).length;

      const pending = us.filter(u =>
        u.role === 'teacher' && u.status === 'pending'
      );

      const critical = all.filter(r =>
        r.severity === 'critical' &&
        r.status !== 'resolved' &&
        r.status !== 'closed'
      ).length;

      const unresolved = all.filter(r =>
        r.status === 'new' || r.status === 'reviewing'
      ).length;

      const resolved = all.filter(r =>
        r.status === 'resolved' || r.status === 'closed'
      ).length;

      const latest = all.slice(0, 5);

      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="card hero">' +
            '<div>' +
              '<h2>Merhaba, ' +
                esc((user.name || 'Yönetici').split(' ')[0]) +
              '</h2>' +
              '<p>Okul güvenliği yönetim merkezi</p>' +
            '</div>' +

            '<div class="page-actions">' +
              '<a class="btn btn-light" href="#reports">' +
                icon('clipboard-list', 16) +
                'Risk bildirimleri' +
              '</a>' +
              '<a class="btn btn-light" href="#riskMap">' +
                icon('map-pin', 16) +
                'Risk haritası' +
              '</a>' +
            '</div>' +
          '</div>' +

          '<div class="grid g4">' +

            statCard({
              label: 'Toplam risk bildirimi',
              value: all.length,
              icon: 'clipboard-list',
              tone: 'primary',
              href: '#reports'
            }) +

            statCard({
              label: 'İşlem bekleyen',
              value: unresolved,
              icon: 'clock',
              tone: unresolved ? 'warning' : 'success',
              href: '#reports'
            }) +

            statCard({
              label: 'Kritik risk',
              value: critical,
              icon: 'alert-circle',
              tone: critical ? 'danger' : 'success',
              href: '#reports'
            }) +

            statCard({
              label: 'Sonuçlanan',
              value: resolved,
              icon: 'check-circle',
              tone: 'success',
              href: '#reports'
            }) +

          '</div>' +

          '<div class="grid g4">' +

            statCard({
              label: 'Aktif öğrenci',
              value: students,
              icon: 'user',
              tone: 'info',
              href: '#users'
            }) +

            statCard({
              label: 'Aktif öğretmen',
              value: teachers,
              icon: 'users',
              tone: 'primary',
              href: '#users'
            }) +

            statCard({
              label: 'Onay bekleyen öğretmen',
              value: pending.length,
              icon: 'shield',
              tone: pending.length ? 'warning' : 'success',
              href: '#pending'
            }) +

            statCard({
              label: 'Okul bölgesi',
              value: LOCATIONS.length,
              icon: 'map-pin',
              tone: 'info',
              href: '#riskMap'
            }) +

          '</div>' +

          '<div class="grid g-main">' +

            '<div class="card flush">' +

              '<div class="card-h">' +
                '<div>' +
                  '<h3>Son risk bildirimleri</h3>' +
                  '<p class="muted small">En son oluşturulan kayıtlar</p>' +
                '</div>' +
                '<a href="#reports">Tümünü gör</a>' +
              '</div>' +

              '<div class="table-wrap">' +
                '<table class="table stack">' +
                  '<thead><tr>' +
                    '<th>Bildirim</th>' +
                    '<th>Konum</th>' +
                    '<th>Önem</th>' +
                    '<th>Durum</th>' +
                  '</tr></thead>' +

                  '<tbody>' +

                    (latest.map(r =>
                      '<tr>' +
                        '<td data-label="Bildirim">' +
                          '<b>' + esc(r.title) + '</b>' +
                          '<small class="muted" style="display:block">' +
                            esc(fmtDT(r.createdAt)) +
                          '</small>' +
                        '</td>' +
                        '<td data-label="Konum">' +
                          esc(r.location) +
                        '</td>' +
                        '<td data-label="Önem">' +
                          severityBadge(r.severity) +
                        '</td>' +
                        '<td data-label="Durum">' +
                          statusBadge(r.status) +
                        '</td>' +
                      '</tr>'
                    ).join('') ||

                    '<tr><td colspan="4">' +
                      emptyState('Henüz risk bildirimi yok.', 'clipboard-list') +
                    '</td></tr>') +

                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +

            '<div class="stack-v">' +

              '<div class="card">' +
                '<div class="card-h">' +
                  '<h3>Öğretmen onayları</h3>' +
                  '<a href="#pending">Yönet</a>' +
                '</div>' +

                (pending.slice(0, 4).map(u =>
                  '<div class="li">' +
                    '<div class="person grow">' +
                      avatar(u.name, 'sm') +
                      '<div>' +
                        '<b>' + esc(u.name) + '</b>' +
                        '<small>' + esc(u.branch || '') + '</small>' +
                      '</div>' +
                    '</div>' +
                  '</div>'
                ).join('') ||
                  emptyState('Bekleyen kayıt yok.', 'shield')
                ) +
              '</div>' +

              '<div class="card">' +
                '<div class="card-h">' +
                  '<h3>Son etkinlikler</h3>' +
                  '<a href="#log">Tümü</a>' +
                '</div>' +

                (store.db().activity.slice(0, 5).map(a =>
                  '<div class="li">' +
                    '<div class="grow">' +
                      '<span>' + esc(a.text) + '</span>' +
                      '<small class="muted" style="display:block">' +
                        esc(fmtDT(a.at)) +
                      '</small>' +
                    '</div>' +
                  '</div>'
                ).join('') ||
                  emptyState('Henüz etkinlik yok.', 'history')
                ) +
              '</div>' +

            '</div>' +

          '</div>' +
        '</div>';
    }

    /* =====================================
       RİSK BİLDİRİMLERİ
    ===================================== */

    function reportDetail(report) {
      if (!report) return;

      const teacherOptions = activeTeachers().map(t =>
        '<option value="' + esc(t.id) + '"' +
          (report.assignedTeacherId === t.id ? ' selected' : '') +
        '>' +
          esc(t.name) + ' · ' + esc(t.branch || 'Öğretmen') +
        '</option>'
      ).join('');

      const history = (report.history || []).slice().reverse();

      const html =
        '<div class="stack-v">' +

          '<div class="card">' +
            '<div class="row" style="justify-content:space-between;flex-wrap:wrap">' +
              '<div>' +
                '<small class="muted">Bildirim numarası</small>' +
                '<p><b>' + esc(report.id) + '</b></p>' +
              '</div>' +
              statusBadge(report.status) +
            '</div>' +

            '<h3>' + esc(report.title) + '</h3>' +
            '<p>' + esc(report.description) + '</p>' +
          '</div>' +

          '<div class="card">' +
            '<h3>Bildirim bilgileri</h3>' +

            '<div class="grid g2">' +

              '<div><small class="muted">Kategori</small><p>' +
                esc(categoryName(report.category)) +
              '</p></div>' +

              '<div><small class="muted">Konum</small><p>' +
                esc(report.location) +
              '</p></div>' +

              '<div><small class="muted">Önem derecesi</small><p>' +
                severityBadge(report.severity) +
              '</p></div>' +

              '<div><small class="muted">Sıklık</small><p>' +
                esc(FREQUENCY[report.frequency] || 'Belirtilmedi') +
              '</p></div>' +

              '<div><small class="muted">Sınıf</small><p>' +
                esc(report.class || '—') +
              '</p></div>' +

              '<div><small class="muted">Oluşturulma</small><p>' +
                esc(fmtDT(report.createdAt)) +
              '</p></div>' +

              '<div><small class="muted">Bildirim türü</small><p>' +
                (report.anonymous ? 'Anonim' : 'Kimlikli') +
              '</p></div>' +

              '<div><small class="muted">Gönderen</small><p>' +
                esc(
                  report.anonymous
                    ? ((store.user(report.reporterId) || {}).name || 'Bilinmiyor')
                    : (report.studentName || 'Bilinmiyor')
                ) +
              '</p></div>' +

            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>İşlem yönetimi</h3>' +

            '<div class="field">' +
              '<label for="adminReportStatus">Bildirim durumu</label>' +
              '<select class="select" id="adminReportStatus">' +
                Object.keys(STATUS).map(key =>
                  '<option value="' + esc(key) + '"' +
                    (report.status === key ? ' selected' : '') +
                  '>' +
                    esc(STATUS[key]) +
                  '</option>'
                ).join('') +
              '</select>' +
            '</div>' +

            '<div class="field">' +
              '<label for="adminReportTeacher">Sorumlu öğretmen</label>' +
              '<select class="select" id="adminReportTeacher">' +
                '<option value="">Atama yok</option>' +
                teacherOptions +
              '</select>' +
            '</div>' +

            '<div class="field">' +
              '<label for="adminReportNote">İşlem notu</label>' +
              '<textarea class="input" id="adminReportNote" rows="3" maxlength="500" placeholder="İşlem hakkında not ekleyin..."></textarea>' +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>İşlem geçmişi</h3>' +

            '<div class="list">' +

              (history.map(h =>
                '<div class="li">' +
                  '<div class="grow">' +
                    '<b>' + esc(STATUS[h.status] || 'Güncelleme') + '</b>' +
                    '<small class="muted">' +
                      esc(h.actorName || 'ODES') +
                      ' · ' + esc(fmtDT(h.at)) +
                    '</small>' +
                    '<small>' + esc(h.note || '') + '</small>' +
                  '</div>' +
                '</div>'
              ).join('') ||
                '<p class="muted small">Henüz işlem geçmişi yok.</p>'
              ) +

            '</div>' +
          '</div>' +

        '</div>';

      modal({
        title: 'Risk bildirimi detayları',
        html,

        actions: [
          { label: 'Kapat' },

          {
            label: 'Değişiklikleri kaydet',
            kind: 'primary',

            onClick: (close, box) => {
              const nextStatus = $('#adminReportStatus', box).value;
              const nextTeacher = $('#adminReportTeacher', box).value;
              const note = $('#adminReportNote', box).value;

              const current = store.reportById(report.id);

              if (!current) {
                toast('Bildirim bulunamadı.', 'error');
                return false;
              }

              if (nextStatus !== current.status || note.trim()) {
                const result = store.updateReportStatus(
                  report.id,
                  nextStatus,
                  user.id,
                  note
                );

                if (!result || !result.ok) {
                  toast(
                    result && result.error
                      ? result.error
                      : 'Durum güncellenemedi.',
                    'error'
                  );
                  return false;
                }
              }

              const latest = store.reportById(report.id);

              if (
                nextTeacher !== (latest.assignedTeacherId || '')
              ) {
                if (nextTeacher) {
                  const assigned = store.assignReport(
                    report.id,
                    nextTeacher,
                    user.id
                  );

                  if (!assigned || !assigned.ok) {
                    toast(
                      assigned && assigned.error
                        ? assigned.error
                        : 'Öğretmen atanamadı.',
                      'error'
                    );
                    return false;
                  }
                } else {
                  latest.assignedTeacherId = null;
                  latest.updatedAt = new Date().toISOString();

                  latest.history = latest.history || [];
                  latest.history.push({
                    status: latest.status,
                    actorId: user.id,
                    actorName: user.name,
                    note: 'Sorumlu öğretmen ataması kaldırıldı.',
                    at: latest.updatedAt
                  });

                  store.save();
                  store.log('Bir risk bildiriminin öğretmen ataması kaldırıldı.');
                }
              }

              toast('Bildirim güncellendi.', 'success');
              refreshPage();
            }
          }
        ]
      });
    }

    function reportsSection(el) {
      let q = '';
      let status = 'all';
      let severity = 'all';
      let category = 'all';
      let location = 'all';

      function draw() {
        const list = reports().filter(r => {
          const query = q.toLocaleLowerCase('tr-TR');

          const textMatch =
            !query ||
            [
              r.title,
              r.description,
              r.location,
              r.studentName,
              r.id
            ].some(value =>
              String(value || '').toLocaleLowerCase('tr-TR').includes(query)
            );

          return textMatch &&
            (status === 'all' || r.status === status) &&
            (severity === 'all' || r.severity === severity) &&
            (category === 'all' || r.category === category) &&
            (location === 'all' || r.location === location);
        });

        el.innerHTML =
          '<div class="stack-v">' +

            '<div class="grid g4">' +

              statCard({
                label: 'Toplam bildirim',
                value: reports().length,
                icon: 'clipboard-list',
                tone: 'primary'
              }) +

              statCard({
                label: 'Yeni',
                value: reports().filter(r => r.status === 'new').length,
                icon: 'plus-circle',
                tone: 'info'
              }) +

              statCard({
                label: 'İnceleniyor',
                value: reports().filter(r => r.status === 'reviewing').length,
                icon: 'clock',
                tone: 'warning'
              }) +

              statCard({
                label: 'Kritik',
                value: reports().filter(r =>
                  r.severity === 'critical' &&
                  r.status !== 'resolved' &&
                  r.status !== 'closed'
                ).length,
                icon: 'alert-circle',
                tone: 'danger'
              }) +

            '</div>' +

            '<div class="card flush">' +

              '<div class="card-h">' +
                '<div>' +
                  '<h3>Risk bildirimleri</h3>' +
                  '<p class="muted small">Okul güvenliği bildirimlerini inceleyin ve yönetin.</p>' +
                '</div>' +
              '</div>' +

              '<div class="toolbar" style="padding:14px;flex-wrap:wrap">' +

                '<div class="search">' +
                  '<span>' + icon('search', 16) + '</span>' +
                  '<input class="input" id="adminReportSearch" type="search" placeholder="Bildirim ara..." value="' + esc(q) + '">' +
                '</div>' +

                '<div class="filters" style="flex-wrap:wrap">' +

                  '<select class="select" id="adminStatusFilter">' +
                    '<option value="all">Tüm durumlar</option>' +
                    Object.keys(STATUS).map(k =>
                      '<option value="' + esc(k) + '">' + esc(STATUS[k]) + '</option>'
                    ).join('') +
                  '</select>' +

                  '<select class="select" id="adminSeverityFilter">' +
                    '<option value="all">Tüm önem dereceleri</option>' +
                    Object.keys(SEVERITY).map(k =>
                      '<option value="' + esc(k) + '">' + esc(SEVERITY[k]) + '</option>'
                    ).join('') +
                  '</select>' +

                  '<select class="select" id="adminCategoryFilter">' +
                    '<option value="all">Tüm kategoriler</option>' +
                    Object.keys(CATEGORY).map(k =>
                      '<option value="' + esc(k) + '">' + esc(CATEGORY[k]) + '</option>'
                    ).join('') +
                  '</select>' +

                  '<select class="select" id="adminLocationFilter">' +
                    '<option value="all">Tüm konumlar</option>' +
                    LOCATIONS.map(k =>
                      '<option value="' + esc(k) + '">' + esc(k) + '</option>'
                    ).join('') +
                  '</select>' +

                '</div>' +
              '</div>' +

              '<div class="table-wrap">' +
                '<table class="table stack">' +

                  '<thead><tr>' +
                    '<th>Bildirim</th>' +
                    '<th>Kategori</th>' +
                    '<th>Konum</th>' +
                    '<th>Önem</th>' +
                    '<th>Durum</th>' +
                    '<th>Gönderen</th>' +
                    '<th>Sorumlu</th>' +
                    '<th></th>' +
                  '</tr></thead>' +

                  '<tbody id="adminReportRows">' +
                    (list.map(reportRow).join('') ||
                      '<tr><td colspan="8">' +
                        emptyState('Filtrelere uygun bildirim bulunamadı.', 'search') +
                      '</td></tr>'
                    ) +
                  '</tbody>' +

                '</table>' +
              '</div>' +

              '<div class="card-h">' +
                '<small class="muted" id="adminReportCount">' +
                  list.length + ' bildirim gösteriliyor' +
                '</small>' +
              '</div>' +

            '</div>' +
          '</div>';

        $('#adminStatusFilter', el).value = status;
        $('#adminSeverityFilter', el).value = severity;
        $('#adminCategoryFilter', el).value = category;
        $('#adminLocationFilter', el).value = location;

        $('#adminReportSearch', el).addEventListener('input', e => {
          q = e.target.value;
          draw();
          const input = $('#adminReportSearch', el);
          input.focus();
          input.setSelectionRange(q.length, q.length);
        });

        $('#adminStatusFilter', el).addEventListener('change', e => {
          status = e.target.value;
          draw();
        });

        $('#adminSeverityFilter', el).addEventListener('change', e => {
          severity = e.target.value;
          draw();
        });

        $('#adminCategoryFilter', el).addEventListener('change', e => {
          category = e.target.value;
          draw();
        });

        $('#adminLocationFilter', el).addEventListener('change', e => {
          location = e.target.value;
          draw();
        });

        $$('[data-detail]', el).forEach(button => {
          button.addEventListener('click', () => {
            const report = store.reportById(button.dataset.detail);
            reportDetail(report);
          });
        });
      }

      draw();
    }

    /* =====================================
       RİSK HARİTASI
    ===================================== */

    function riskMap(el) {
      const all = reports();

      const locations = LOCATIONS.map(name => {
        const items = all.filter(r => r.location === name);

        const open = items.filter(r =>
          r.status === 'new' || r.status === 'reviewing'
        );

        const critical = items.filter(r =>
          r.severity === 'critical' &&
          r.status !== 'resolved' &&
          r.status !== 'closed'
        );

        const high = items.filter(r =>
          r.severity === 'high' &&
          r.status !== 'resolved' &&
          r.status !== 'closed'
        );

        return {
          name,
          total: items.length,
          open: open.length,
          critical: critical.length,
          high: high.length
        };
      });

      const max = Math.max(1, ...locations.map(x => x.total));

      const sorted = locations.slice().sort((a, b) =>
        b.total - a.total
      );

      el.innerHTML =
        '<div class="stack-v">' +

          '<div class="card">' +
            '<div class="card-h">' +
              '<div>' +
                '<h3>Okul risk haritası</h3>' +
                '<p class="muted small">' +
                  'Okulun iç bölümlerine göre risk bildirimlerinin dağılımı.' +
                '</p>' +
              '</div>' +
              icon('map-pin', 24) +
            '</div>' +

            '<div class="grid g4">' +

              statCard({
                label: 'Toplam bildirim',
                value: all.length,
                icon: 'clipboard-list',
                tone: 'primary'
              }) +

              statCard({
                label: 'Risk bulunan bölge',
                value: locations.filter(x => x.total > 0).length,
                icon: 'map-pin',
                tone: 'info'
              }) +

              statCard({
                label: 'Kritik risk',
                value: all.filter(r =>
                  r.severity === 'critical' &&
                  r.status !== 'resolved' &&
                  r.status !== 'closed'
                ).length,
                icon: 'alert-circle',
                tone: 'danger'
              }) +

              statCard({
                label: 'İşlem bekleyen',
                value: all.filter(r =>
                  r.status === 'new' || r.status === 'reviewing'
                ).length,
                icon: 'clock',
                tone: 'warning'
              }) +

            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-h">' +
              '<div>' +
                '<h3>Bölgelere göre risk yoğunluğu</h3>' +
                '<p class="muted small">Bildirim sayısına göre sıralanmıştır.</p>' +
              '</div>' +
            '</div>' +

            '<div class="stack-v">' +

              sorted.map(item => {
                const percent = Math.round(item.total / max * 100);

                return '<div class="card" style="padding:14px">' +

                  '<div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap">' +
                    '<b>' + esc(item.name) + '</b>' +
                    '<span class="badge ' +
                      (item.critical ? 'b-danger' :
                        item.open ? 'b-warning' :
                        item.total ? 'b-info' : 'b-neutral') +
                    '">' +
                      item.total + ' bildirim' +
                    '</span>' +
                  '</div>' +

                  '<div style="height:9px;background:var(--border);border-radius:20px;overflow:hidden;margin:12px 0">' +
                    '<div style="height:100%;width:' + percent + '%;background:var(--primary);border-radius:20px"></div>' +
                  '</div>' +

                  '<div class="row" style="gap:14px;flex-wrap:wrap">' +
                    '<small class="muted">İşlem bekleyen: ' + item.open + '</small>' +
                    '<small class="muted">Kritik: ' + item.critical + '</small>' +
                    '<small class="muted">Yüksek: ' + item.high + '</small>' +
                  '</div>' +

                  (item.total
                    ? '<button type="button" class="btn btn-sm" data-map-location="' +
                        esc(item.name) + '" style="margin-top:10px">Bildirimleri görüntüle</button>'
                    : ''
                  ) +

                '</div>';
              }).join('') +

            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<h3>Harita açıklaması</h3>' +
            '<p class="muted small">' +
              'Bu ekran mevcut bildirim verilerinden oluşturulan bölgesel risk dağılımını gösterir. ' +
              'Gerçek okul krokisi ve kat planı entegrasyonu sonraki geliştirme aşamasında eklenebilir.' +
            '</p>' +
          '</div>' +

        '</div>';

      $$('[data-map-location]', el).forEach(button => {
        button.addEventListener('click', () => {
          const selected = button.dataset.mapLocation;
          window.location.hash = '#reports';

          setTimeout(() => {
            const filter = $('#adminLocationFilter', root);
            if (filter) {
              filter.value = selected;
              filter.dispatchEvent(new Event('change'));
            }
          }, 0);
        });
      });
    }

    /* =====================================
       KULLANICI YÖNETİMİ
    ===================================== */

    function usersSection(el) {
      let q = '';
      let role = 'all';
      let status = 'all';

      const acts = $('#pageActions');

      if (acts) {
        acts.innerHTML =
          '<button class="btn btn-primary" type="button" id="addU">' +
            icon('plus', 16) +
            ' Kullanıcı ekle' +
          '</button>';

        $('#addU').addEventListener('click', openAdd);
      }

      function draw() {
        const norm = s =>
          String(s || '').toLocaleLowerCase('tr-TR');

        const list = users().filter(u =>
          (role === 'all' || u.role === role) &&
          (status === 'all' || u.status === status) &&
          (
            norm(u.name).includes(norm(q)) ||
            norm(u.email).includes(norm(q))
          )
        );

        el.innerHTML =
          '<div class="card flush">' +

            '<div class="card-h">' +
              '<h3>Kullanıcı yönetimi</h3>' +
            '</div>' +

            '<div class="toolbar" style="margin:0;padding:14px;flex-wrap:wrap">' +

              '<div class="search">' +
                '<span>' + icon('search', 16) + '</span>' +
                '<input class="input" id="q" type="search" placeholder="Ad veya e-posta ara" value="' + esc(q) + '">' +
              '</div>' +

              '<div class="filters" style="flex-wrap:wrap">' +

                '<select class="select" id="fRole">' +
                  '<option value="all">Tüm roller</option>' +
                  '<option value="student">Öğrenci</option>' +
                  '<option value="teacher">Öğretmen</option>' +
                  '<option value="admin">Yönetici</option>' +
                '</select>' +

                '<select class="select" id="fStatus">' +
                  '<option value="all">Tüm durumlar</option>' +
                  '<option value="active">Aktif</option>' +
                  '<option value="pending">Onay bekliyor</option>' +
                  '<option value="inactive">Pasif</option>' +
                '</select>' +

              '</div>' +
            '</div>' +

            '<div class="table-wrap">' +
              '<table class="table stack">' +

                '<thead><tr>' +
                  '<th>Kullanıcı</th>' +
                  '<th>Rol</th>' +
                  '<th>Sınıf / branş</th>' +
                  '<th>Durum</th>' +
                  '<th>İşlemler</th>' +
                '</tr></thead>' +

                '<tbody>' +

                  (list.map(u => {
                    const st =
                      u.status === 'active'
                        ? '<span class="badge b-success">Aktif</span>'
                        : u.status === 'pending'
                          ? '<span class="badge b-warning">Onay bekliyor</span>'
                          : '<span class="badge b-neutral">Pasif</span>';

                    const self = u.id === user.id;

                    let buttons = '';

                    if (u.role === 'teacher' && u.status === 'pending') {
                      buttons +=
                        '<button type="button" class="btn btn-sm btn-primary" data-ap="' +
                        esc(u.id) + '">Onayla</button>';
                    } else if (!self) {
                      buttons +=
                        '<button type="button" class="btn btn-sm" data-tg="' +
                        esc(u.id) + '">' +
                        (u.status === 'active' ? 'Pasife al' : 'Etkinleştir') +
                        '</button>';
                    }

                    if (!self) {
                      buttons +=
                        '<button type="button" class="btn btn-sm btn-ghost" data-rm="' +
                        esc(u.id) + '" aria-label="Kullanıcıyı sil">' +
                        icon('trash', 14) +
                        '</button>';
                    }

                    return '<tr>' +

                      '<td data-label="Kullanıcı">' +
                        '<div class="person">' +
                          avatar(u.name, 'sm') +
                          '<div>' +
                            '<b>' + esc(u.name) +
                              (self ? ' (siz)' : '') +
                            '</b>' +
                            '<small>' + esc(u.email) + '</small>' +
                          '</div>' +
                        '</div>' +
                      '</td>' +

                      '<td data-label="Rol">' +
                        roleBadge(u.role) +
                      '</td>' +

                      '<td data-label="Sınıf / branş">' +
                        esc(
                          u.role === 'student'
                            ? u.class
                            : u.role === 'teacher'
                              ? (u.branch || '—') +
                                ((u.classes || []).length
                                  ? ' · ' + u.classes.join(', ')
                                  : '')
                              : '—'
                        ) +
                      '</td>' +

                      '<td data-label="Durum">' + st + '</td>' +

                      '<td class="actions">' + buttons + '</td>' +

                    '</tr>';
                  }).join('') ||

                    '<tr><td colspan="5">' +
                      emptyState('Eşleşen kullanıcı yok.', 'search') +
                    '</td></tr>'
                  ) +

                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>';

        $('#fRole', el).value = role;
        $('#fStatus', el).value = status;

        const qi = $('#q', el);

        qi.addEventListener('input', () => {
          q = qi.value;
          const position = qi.selectionStart;
          draw();

          const next = $('#q', el);
          next.focus();
          next.setSelectionRange(position, position);
        });

        $('#fRole', el).addEventListener('change', e => {
          role = e.target.value;
          draw();
        });

        $('#fStatus', el).addEventListener('change', e => {
          status = e.target.value;
          draw();
        });

        $$('[data-tg]', el).forEach(button => {
          button.addEventListener('click', () => {
            const u = store.user(button.dataset.tg);
            if (!u) return;

            const next = u.status === 'active' ? 'inactive' : 'active';

            store.setUserStatus(u.id, next);

            toast(
              u.name + (next === 'active'
                ? ' etkinleştirildi.'
                : ' pasife alındı.'),
              'success'
            );

            draw();
          });
        });

        $$('[data-rm]', el).forEach(button => {
          button.addEventListener('click', async () => {
            const u = store.user(button.dataset.rm);
            if (!u) return;

            const ok = await confirmDialog({
              title: 'Kullanıcıyı sil',
              message: u.name +
                ' hesabı kalıcı olarak silinecek. Bu işlem kullanıcının eski bildirim kayıtlarını da etkileyebilir. Devam edilsin mi?',
              confirmLabel: 'Sil',
              danger: true
            });

            if (!ok) return;

            store.deleteUser(u.id);
            toast('Kullanıcı silindi.', 'success');
            draw();
          });
        });

        $$('[data-ap]', el).forEach(button => {
          button.addEventListener('click', () => {
            approveDialog(store.user(button.dataset.ap), draw);
          });
        });
      }

      draw();
    }

    function openAdd() {
      const html =
        '<form id="uForm" novalidate>' +

          '<div class="field">' +
            '<label for="uName">Ad soyad</label>' +
            '<input class="input" id="uName" maxlength="100">' +
            '<span class="err" id="uNameErr"></span>' +
          '</div>' +

          '<div class="field">' +
            '<label for="uEmail">E-posta</label>' +
            '<input class="input" id="uEmail" type="email">' +
            '<span class="err" id="uEmailErr"></span>' +
          '</div>' +

          '<div class="field">' +
            '<label for="uRole">Rol</label>' +
            '<select class="select" id="uRole">' +
              '<option value="student">Öğrenci</option>' +
              '<option value="teacher">Öğretmen</option>' +
            '</select>' +
          '</div>' +

          '<div class="field" id="uClassF">' +
            '<label for="uClass">Sınıf</label>' +
            '<select class="select" id="uClass">' +
              CLASSES.map(c =>
                '<option value="' + esc(c) + '">' + esc(c) + '</option>'
              ).join('') +
            '</select>' +
          '</div>' +

          '<div class="field" id="uBranchF" hidden>' +
            '<label for="uBranch">Branş</label>' +
            '<input class="input" id="uBranch">' +
            '<span class="err" id="uBranchErr"></span>' +
          '</div>' +

        '</form>';

      modal({
        title: 'Kullanıcı ekle',
        html,

        onOpen: box => {
          $('#uRole', box).addEventListener('change', e => {
            const teacher = e.target.value === 'teacher';
            $('#uClassF', box).hidden = teacher;
            $('#uBranchF', box).hidden = !teacher;
          });
        },

        actions: [
          { label: 'Vazgeç' },

          {
            label: 'Ekle',
            kind: 'primary',

            onClick: (close, box) => {
              const name = $('#uName', box);
              const email = $('#uEmail', box);
              const role = $('#uRole', box).value;
              const branch = $('#uBranch', box);

              let valid = true;

              const check = (bad, id, input, message) => {
                $('#' + id, box).textContent = bad ? message : '';

                if (input) {
                  if (bad) input.setAttribute('aria-invalid', 'true');
                  else input.removeAttribute('aria-invalid');
                }

                if (bad) valid = false;
              };

              check(
                name.value.trim().length < 3,
                'uNameErr',
                name,
                'Ad soyad en az 3 karakter olmalı.'
              );

              check(
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
                'uEmailErr',
                email,
                'Geçerli bir e-posta girin.'
              );

              if (role === 'teacher') {
                check(
                  branch.value.trim().length < 2,
                  'uBranchErr',
                  branch,
                  'Branş gerekli.'
                );
              }

              if (!valid) return false;

              const result = store.addUser({
                name: name.value,
                email: email.value,
                role,
                class: $('#uClass', box).value,
                branch: branch.value
              });

              if (!result || !result.ok) {
                check(
                  true,
                  'uEmailErr',
                  email,
                  result && result.error
                    ? result.error
                    : 'Kullanıcı eklenemedi.'
                );

                return false;
              }

              // Öğretmenler doğrudan aktif edilmez.
              // Önce sınıfları belirlenerek onay bekleyenlere eklenir.
              toast(
                role === 'teacher'
                  ? 'Öğretmen kaydı oluşturuldu. Onay bekliyor.'
                  : 'Öğrenci hesabı oluşturuldu.',
                'success'
              );

              refreshPage();
            }
          }
        ]
      });
    }

    /* =====================================
       ÖĞRETMEN ONAYI
    ===================================== */

    function approveDialog(u, after) {
      if (!u) return;

      const html =
        '<p style="margin-bottom:14px">' +
          '<b>' + esc(u.name) + '</b> (' +
          esc(u.branch || 'Branş belirtilmemiş') +
          ') hesabını onaylıyorsunuz.' +
        '</p>' +

        '<p class="muted small">Öğretmenin görev yapacağı sınıfları seçin:</p>' +

        '<div class="checks" id="clsChecks">' +

          CLASSES.map(c =>
            '<label>' +
              '<input type="checkbox" value="' + esc(c) + '"> ' +
              esc(c) +
            '</label>'
          ).join('') +

        '</div>' +

        '<span class="err" id="clsErr"></span>';

      modal({
        title: 'Öğretmen hesabını onayla',
        html,

        actions: [
          { label: 'Vazgeç' },

          {
            label: 'Onayla',
            kind: 'primary',

            onClick: (close, box) => {
              const selected = $$('#clsChecks input:checked', box)
                .map(input => input.value);

              if (!selected.length) {
                $('#clsErr', box).textContent =
                  'En az bir sınıf seçmelisiniz.';

                return false;
              }

              store.approveTeacher(u.id, selected);

              toast(u.name + ' onaylandı.', 'success');

              if (after) after();
              else refreshPage();
            }
          }
        ]
      });
    }

    function pending(el, refresh) {
      const list = users().filter(u =>
        u.role === 'teacher' && u.status === 'pending'
      );

      el.innerHTML =
        '<div class="card">' +

          '<div class="card-h">' +
            '<div>' +
              '<h3>Onay bekleyen öğretmenler</h3>' +
              '<p class="muted small">Öğretmen kayıtlarını inceleyip görev yapacakları sınıfları belirleyin.</p>' +
            '</div>' +
            '<span class="badge b-warning">' + list.length + ' bekleyen</span>' +
          '</div>' +

          (list.map(u =>
            '<div class="li">' +

              '<div class="person grow">' +
                avatar(u.name) +
                '<div>' +
                  '<b>' + esc(u.name) + '</b>' +
                  '<small>' + esc(u.email) + '</small>' +
                  '<small>' + esc(u.branch || 'Branş belirtilmemiş') + '</small>' +
                '</div>' +
              '</div>' +

              '<div class="end">' +
                '<button type="button" class="btn btn-sm btn-primary" data-ap="' +
                  esc(u.id) + '">Onayla</button>' +

                '<button type="button" class="btn btn-sm btn-ghost" data-rj="' +
                  esc(u.id) + '">Reddet</button>' +
              '</div>' +

            '</div>'
          ).join('') ||

            emptyState('Onay bekleyen öğretmen kaydı yok.', 'shield')
          ) +

        '</div>';

      $$('[data-ap]', el).forEach(button => {
        button.addEventListener('click', () => {
          approveDialog(store.user(button.dataset.ap), refresh);
        });
      });

      $$('[data-rj]', el).forEach(button => {
        button.addEventListener('click', async () => {
          const u = store.user(button.dataset.rj);
          if (!u) return;

          const ok = await confirmDialog({
            title: 'Öğretmen kaydını reddet',
            message: u.name +
              ' hesabı silinecek. Bu işlem geri alınamaz.',
            confirmLabel: 'Reddet',
            danger: true
          });

          if (!ok) return;

          store.deleteUser(u.id);
          toast('Öğretmen kaydı reddedildi.', 'success');
          refresh();
        });
      });
    }

    /* =====================================
       ETKİNLİK GÜNLÜĞÜ
    ===================================== */

    function log(el) {
      const activity = store.db().activity || [];

      el.innerHTML =
        '<div class="card">' +

          '<div class="card-h">' +
            '<div>' +
              '<h3>Etkinlik günlüğü</h3>' +
              '<p class="muted small">Sistemde gerçekleşen son işlemler.</p>' +
            '</div>' +
            '<span class="badge b-info">' + activity.length + ' kayıt</span>' +
          '</div>' +

          (activity.length
            ? '<ul class="timeline">' +

                activity.map(a =>
                  '<li class="done">' +
                    '<span class="dot"></span>' +
                    esc(a.text) +
                    '<small>' + esc(fmtDT(a.at)) + '</small>' +
                  '</li>'
                ).join('') +

              '</ul>'

            : emptyState('Henüz etkinlik kaydı yok.', 'history')
          ) +

        '</div>';
    }

    /* =====================================
       GELEN BİLDİRİMLER
    ===================================== */

    function inbox(el) {
      renderInbox(el, user);
    }

    /* =====================================
       YÖNETİCİ MENÜSÜ
    ===================================== */

    sections(root, {

      overview: {
        title: 'Genel bakış',
        sub: 'Okul güvenliği yönetim merkezi.',
        render: overview
      },

      reports: {
        title: 'Risk bildirimleri',
        sub: 'Okul güvenliği bildirimlerini inceleyin ve yönetin.',
        render: reportsSection
      },

      riskMap: {
        title: 'Risk haritası',
        sub: 'Okulun bölümlerine göre risk yoğunluğunu görüntüleyin.',
        render: riskMap
      },

      users: {
        title: 'Kullanıcılar',
        sub: 'Öğrenci ve öğretmen hesaplarını yönetin.',
        render: usersSection
      },

      pending: {
        title: 'Öğretmen onayları',
        sub: 'Öğretmen kayıtlarını onaylayın veya reddedin.',
        render: pending
      },

      log: {
        title: 'Etkinlik günlüğü',
        sub: 'Sistemde gerçekleşen işlemleri görüntüleyin.',
        render: log
      },

      inbox: {
        title: 'Gelen bildirimler',
        sub: 'Okul güvenliği bildirimleri ve sistem mesajları.',
        render: inbox
      }

    }, 'overview');
  };

})();
