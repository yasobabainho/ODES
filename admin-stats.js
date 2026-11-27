
(function () {
  'use strict';

  const {
    $, esc, icon, store, statCard, emptyState,
    downloadCSV, toast, fmtDT
  } = ODES;

  ODES.pages['admin-stats'] = function (root, user) {

    const DEMO_IDS = new Set([
      'a1',
      't1', 't2', 't3', 't4',
      's1', 's2', 's3', 's4', 's5',
      's6', 's7', 's8', 's9', 's10', 's11'
    ]);

    const STATUS = ODES.REPORT_STATUSES || {};
    const CATEGORY = ODES.REPORT_CATEGORIES || {};
    const SEVERITY = ODES.REPORT_SEVERITIES || {};
    const FREQUENCY = ODES.REPORT_FREQUENCIES || {};
    const LOCATIONS = ODES.SCHOOL_LOCATIONS || [];

    const STATUS_COLORS = {
      new: '#527da8',
      reviewing: '#c28a3e',
      resolved: '#39866b',
      closed: '#8793a1'
    };

    const SEVERITY_COLORS = {
      low: '#8793a1',
      medium: '#527da8',
      high: '#c28a3e',
      critical: '#bd555b'
    };

    let range = 30;

    function getReports() {
      return (store.adminReports(user.id) || []).filter(report =>
        DEMO_IDS.has(report.reporterId)
      );
    }

    function inRange(report) {
      if (range === 0) return true;

      const date = new Date(report.createdAt).getTime();

      if (!Number.isFinite(date)) return false;

      return date >= Date.now() - range * ODES.DAY;
    }

    function countBy(items, key) {
      const result = {};

      items.forEach(item => {
        const value = item[key] || 'other';
        result[value] = (result[value] || 0) + 1;
      });

      return result;
    }

    function percent(value, total) {
      return total ? Math.round(value / total * 100) : 0;
    }

    function barRows(items, total, colors) {
      if (!items.length) {
        return emptyState('Henüz analiz edilecek veri yok.', 'chart');
      }

      return '<div class="stack-v">' +
        items.map(item => {
          const value = item.value || 0;
          const rate = percent(value, total);
          const color = colors && colors[item.key]
            ? colors[item.key]
            : 'var(--primary)';

          return '<div class="risk-stat-row">' +
            '<div class="row" style="justify-content:space-between;gap:12px;align-items:center">' +
              '<span>' + esc(item.label) + '</span>' +
              '<b>' + value + ' <small class="muted">(%' + rate + ')</small></b>' +
            '</div>' +
            '<div style="height:9px;background:var(--border);border-radius:20px;overflow:hidden;margin-top:8px">' +
              '<div style="height:100%;width:' + rate + '%;background:' + color + ';border-radius:20px"></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    function makeItems(dictionary, counts, colors) {
      return Object.keys(dictionary).map(key => ({
        key,
        label: dictionary[key],
        value: counts[key] || 0,
        color: colors && colors[key]
      })).sort((a, b) => b.value - a.value);
    }

    function card(title, subtitle, content) {
      return '<section class="card">' +
        '<div class="card-h">' +
          '<div>' +
            '<h3>' + esc(title) + '</h3>' +
            (subtitle
              ? '<p class="muted small">' + esc(subtitle) + '</p>'
              : '') +
          '</div>' +
        '</div>' +
        content +
      '</section>';
    }

    function draw() {
      const all = getReports();
      const reports = all.filter(inRange);

      const total = reports.length;

      const open = reports.filter(report =>
        report.status === 'new' ||
        report.status === 'reviewing'
      ).length;

      const critical = reports.filter(report =>
        report.severity === 'critical' &&
        report.status !== 'resolved' &&
        report.status !== 'closed'
      ).length;

      const resolved = reports.filter(report =>
        report.status === 'resolved' ||
        report.status === 'closed'
      ).length;

      const resolutionRate = percent(resolved, total);

      const statusCounts = countBy(reports, 'status');
      const categoryCounts = countBy(reports, 'category');
      const severityCounts = countBy(reports, 'severity');
      const frequencyCounts = countBy(reports, 'frequency');
      const locationCounts = countBy(reports, 'location');

      const statusItems = makeItems(STATUS, statusCounts);
      const categoryItems = makeItems(CATEGORY, categoryCounts);
      const severityItems = makeItems(SEVERITY, severityCounts);
      const frequencyItems = makeItems(FREQUENCY, frequencyCounts);

      const locationItems = LOCATIONS.map(location => ({
        key: location,
        label: location,
        value: locationCounts[location] || 0
      })).sort((a, b) => b.value - a.value);

      const highRisk = reports.filter(report =>
        (
          report.severity === 'high' ||
          report.severity === 'critical'
        ) &&
        report.status !== 'resolved' &&
        report.status !== 'closed'
      ).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      const recent = reports.slice().sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 8);

      const activeLocations = locationItems.filter(item =>
        item.value > 0
      ).length;

      const averagePerDay = range
        ? (total / range).toFixed(1).replace('.', ',')
        : '—';

      root.innerHTML =
        '<div class="page">' +

          '<div class="page-head">' +
            '<div>' +
              '<h1>Risk istatistikleri</h1>' +
              '<p class="muted">Okul güvenliği bildirimlerinin analiz ve değerlendirme özeti.</p>' +
            '</div>' +

            '<div class="page-actions">' +
              '<select class="select" id="statsRange" aria-label="İstatistik zaman aralığı">' +
                '<option value="7">Son 7 gün</option>' +
                '<option value="30" selected>Son 30 gün</option>' +
                '<option value="90">Son 90 gün</option>' +
                '<option value="0">Tüm zamanlar</option>' +
              '</select>' +

              '<button class="btn" type="button" id="statsCSV">' +
                icon('download', 16) + ' CSV indir' +
              '</button>' +
            '</div>' +
          '</div>' +

          '<div class="stack-v" id="statsContent">' +

            '<div class="grid g4">' +

              statCard({
                label: 'Toplam risk bildirimi',
                value: total,
                icon: 'clipboard-list',
                tone: 'primary'
              }) +

              statCard({
                label: 'İşlem bekleyen',
                value: open,
                icon: 'clock',
                tone: 'warning'
              }) +

              statCard({
                label: 'Açık kritik risk',
                value: critical,
                icon: 'alert-circle',
                tone: 'danger'
              }) +

              statCard({
                label: 'Çözüme ulaştırılan',
                value: '%' + resolutionRate,
                icon: 'check-circle',
                tone: 'success'
              }) +

            '</div>' +

            '<div class="grid g2">' +

              card(
                'Bildirim durumları',
                'Seçilen zaman aralığındaki işlem durumları.',
                barRows(
                  statusItems,
                  total,
                  STATUS_COLORS
                )
              ) +

              card(
                'Önem derecesi',
                'Risklerin önem seviyelerine göre dağılımı.',
                barRows(
                  severityItems,
                  total,
                  SEVERITY_COLORS
                )
              ) +

            '</div>' +

            '<div class="grid g2">' +

              card(
                'Risk kategorileri',
                'Bildirimlerin konu başlıklarına göre dağılımı.',
                barRows(categoryItems, total)
              ) +

              card(
                'Bildirim sıklığı',
                'Öğrencilerin bildirdiği tekrar sıklığı.',
                barRows(frequencyItems, total)
              ) +

            '</div>' +

            card(
              'Okul bölgelerine göre risk dağılımı',
              'Bildirimlerin oluşturulduğu okul bölümleri.',
              '<div class="muted small" style="margin-bottom:14px">' +
                activeLocations + ' farklı bölgede bildirim bulunuyor.' +
              '</div>' +
              barRows(locationItems, total)
            ) +

            card(
              'Öncelikli değerlendirme gerektiren bildirimler',
              'Çözülmemiş yüksek ve kritik önem dereceli bildirimler.',
              highRisk.length
                ? '<div class="table-wrap">' +
                    '<table class="table stack">' +
                      '<thead><tr>' +
                        '<th>Bildirim</th>' +
                        '<th>Bölge</th>' +
                        '<th>Önem</th>' +
                        '<th>Durum</th>' +
                      '</tr></thead>' +
                      '<tbody>' +
                        highRisk.slice(0, 10).map(report =>
                          '<tr>' +
                            '<td data-label="Bildirim">' +
                              '<b>' + esc(report.title) + '</b>' +
                              '<small class="muted" style="display:block">' +
                                esc(fmtDT(report.createdAt)) +
                              '</small>' +
                            '</td>' +
                            '<td data-label="Bölge">' +
                              esc(report.location) +
                            '</td>' +
                            '<td data-label="Önem">' +
                              esc(SEVERITY[report.severity] || '—') +
                            '</td>' +
                            '<td data-label="Durum">' +
                              esc(STATUS[report.status] || '—') +
                            '</td>' +
                          '</tr>'
                        ).join('') +
                      '</tbody>' +
                    '</table>' +
                  '</div>'
                : emptyState(
                    'Bu zaman aralığında açık yüksek veya kritik risk bulunmuyor.',
                    'check-circle'
                  )
            ) +

            card(
              'Son risk bildirimleri',
              'En son oluşturulan sekiz bildirim.',
              recent.length
                ? '<div class="table-wrap">' +
                    '<table class="table stack">' +
                      '<thead><tr>' +
                        '<th>Bildirim</th>' +
                        '<th>Kategori</th>' +
                        '<th>Bölge</th>' +
                        '<th>Tarih</th>' +
                      '</tr></thead>' +
                      '<tbody>' +
                        recent.map(report =>
                          '<tr>' +
                            '<td data-label="Bildirim"><b>' +
                              esc(report.title) +
                            '</b></td>' +
                            '<td data-label="Kategori">' +
                              esc(CATEGORY[report.category] || 'Diğer') +
                            '</td>' +
                            '<td data-label="Bölge">' +
                              esc(report.location) +
                            '</td>' +
                            '<td data-label="Tarih">' +
                              esc(fmtDT(report.createdAt)) +
                            '</td>' +
                          '</tr>'
                        ).join('') +
                      '</tbody>' +
                    '</table>' +
                  '</div>'
                : emptyState(
                    'Henüz risk bildirimi bulunmuyor.',
                    'clipboard-list'
                  )
            ) +

            '<div class="card">' +
              '<h3>Genel değerlendirme</h3>' +
              '<p class="muted small">' +
                'Seçilen dönemde günlük ortalama bildirim sayısı: <b>' +
                averagePerDay +
                '</b>. Risk dağılımları, mevcut demo bildirimlerinden hesaplanır. ' +
                'Bu istatistikler tek başına gerçek okul güvenliği düzeyini kanıtlamaz; ' +
                'bildirimlerin incelenmesi ve okul yönetiminin değerlendirmesi gerekir.' +
              '</p>' +
            '</div>' +

          '</div>' +
        '</div>';

      $('#statsRange', root).addEventListener('change', event => {
        range = Number(event.target.value);
        draw();
      });

      $('#statsCSV', root).addEventListener('click', () => {
        const rows = [
          [
            'Başlık',
            'Kategori',
            'Konum',
            'Önem derecesi',
            'Sıklık',
            'Durum',
            'Oluşturulma tarihi'
          ]
        ];

        reports.forEach(report => {
          rows.push([
            report.title,
            CATEGORY[report.category] || report.category,
            report.location,
            SEVERITY[report.severity] || report.severity,
            FREQUENCY[report.frequency] || report.frequency,
            STATUS[report.status] || report.status,
            report.createdAt
          ]);
        });

        if (!reports.length) {
          toast('Dışa aktarılacak risk bildirimi bulunamadı.', 'error');
          return;
        }

        downloadCSV('odes-risk-istatistikleri.csv', rows);
        toast('Risk istatistikleri CSV olarak indirildi.', 'success');
      });
    }

    draw();
  };
})();
