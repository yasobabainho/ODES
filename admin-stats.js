
(function () {
  'use strict';

  const {
    $, esc, icon, store, statCard, emptyState,
    downloadCSV, toast, fmtDT
  } = ODES;

  ODES.pages['admin-stats'] = function (root, user) {

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
      if (!user || !user.id) return [];

      // Yönetici yetkisini ve veri alanını store kontrol eder.
      return store.adminReports(user.id) || [];
    }

    function getTimestamp(report) {
      const value = new Date(report.createdAt).getTime();
      return Number.isFinite(value) ? value : null;
    }

    function inRange(report, now) {
      const timestamp = getTimestamp(report);

      if (timestamp === null || timestamp > now) {
        return false;
      }

      if (range === 0) {
        return true;
      }

      return timestamp >= now - range * ODES.DAY;
    }

    function sortNewest(items) {
      return items.slice().sort((a, b) => {
        return (getTimestamp(b) || 0) -
          (getTimestamp(a) || 0);
      });
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
      return total
        ? Math.round(value / total * 100)
        : 0;
    }

    function makeItems(dictionary, counts, colors) {
      const keys = new Set([
        ...Object.keys(dictionary),
        ...Object.keys(counts)
      ]);

      return Array.from(keys).map(key => ({
        key,
        label: dictionary[key] ||
          (key === 'other' ? 'Diğer / Belirtilmemiş' : 'Tanımsız'),
        value: counts[key] || 0,
        color: colors && colors[key]
      })).sort((a, b) => b.value - a.value);
    }

    function makeLocationItems(counts) {
      const keys = new Set([
        ...LOCATIONS,
        ...Object.keys(counts)
      ]);

      return Array.from(keys).map(key => ({
        key,
        label: key === 'other'
          ? 'Diğer / Belirtilmemiş'
          : key,
        value: counts[key] || 0
      })).sort((a, b) => b.value - a.value);
    }

    function barRows(items, total, colors) {
      if (!total || !items.length) {
        return emptyState(
          'Henüz analiz edilecek veri yok.',
          'chart'
        );
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
              '<b>' + value +
                ' <small class="muted">(%' + rate + ')</small>' +
              '</b>' +
            '</div>' +

            '<div style="height:9px;background:var(--border);border-radius:20px;overflow:hidden;margin-top:8px">' +
              '<div style="height:100%;width:' + rate +
                '%;background:' + color +
                ';border-radius:20px"></div>' +
            '</div>' +

          '</div>';
        }).join('') +
      '</div>';
    }

    function card(title, subtitle, content) {
      return '<section class="card">' +

        '<div class="card-h">' +
          '<div>' +
            '<h3>' + esc(title) + '</h3>' +
            (subtitle
              ? '<p class="muted small">' +
                  esc(subtitle) +
                '</p>'
              : '') +
          '</div>' +
        '</div>' +

        content +

      '</section>';
    }

    function safeValue(value, fallback) {
      if (value === null || value === undefined || value === '') {
        return fallback || '—';
      }

      return String(value);
    }

    function csvSafe(value) {
      const text = safeValue(value, '');

      // Elektronik tablo formül çalıştırma riskini önler.
      if (/^[=+\-@\t\r]/.test(text)) {
        return "'" + text;
      }

      return text;
    }

    function draw() {
      const now = Date.now();

      const all = getReports();
      const reports = all.filter(report =>
        inRange(report, now)
      );

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

      const statusItems = makeItems(
        STATUS,
        statusCounts,
        STATUS_COLORS
      );

      const categoryItems = makeItems(
        CATEGORY,
        categoryCounts
      );

      const severityItems = makeItems(
        SEVERITY,
        severityCounts,
        SEVERITY_COLORS
      );

      const frequencyItems = makeItems(
        FREQUENCY,
        frequencyCounts
      );

      const locationItems = makeLocationItems(
        locationCounts
      );

      const highRisk = sortNewest(reports.filter(report =>
        (
          report.severity === 'high' ||
          report.severity === 'critical'
        ) &&
        report.status !== 'resolved' &&
        report.status !== 'closed'
      ));

      const recent = sortNewest(reports).slice(0, 8);

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
              '<p class="muted">' +
                'Okul güvenliği bildirimlerinin analiz ve değerlendirme özeti.' +
              '</p>' +
            '</div>' +

            '<div class="page-actions">' +

              '<select class="select" id="statsRange" aria-label="İstatistik zaman aralığı">' +
                '<option value="7"' +
                  (range === 7 ? ' selected' : '') +
                '>Son 7 gün</option>' +

                '<option value="30"' +
                  (range === 30 ? ' selected' : '') +
                '>Son 30 gün</option>' +

                '<option value="90"' +
                  (range === 90 ? ' selected' : '') +
                '>Son 90 gün</option>' +

                '<option value="0"' +
                  (range === 0 ? ' selected' : '') +
                '>Tüm zamanlar</option>' +
              '</select>' +

              '<button class="btn" type="button" id="statsCSV">' +
                icon('download', 16) +
                ' CSV indir' +
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
                barRows(statusItems, total, STATUS_COLORS)
              ) +

              card(
                'Önem derecesi',
                'Risklerin önem seviyelerine göre dağılımı.',
                barRows(severityItems, total, SEVERITY_COLORS)
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
                activeLocations +
                ' farklı bölgede bildirim bulunuyor.' +
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
                              '<b>' +
                                esc(safeValue(report.title)) +
                              '</b>' +

                              '<small class="muted" style="display:block">' +
                                esc(fmtDT(report.createdAt)) +
                              '</small>' +
                            '</td>' +

                            '<td data-label="Bölge">' +
                              esc(safeValue(report.location)) +
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

                            '<td data-label="Bildirim">' +
                              '<b>' +
                                esc(safeValue(report.title)) +
                              '</b>' +
                            '</td>' +

                            '<td data-label="Kategori">' +
                              esc(CATEGORY[report.category] || 'Diğer') +
                            '</td>' +

                            '<td data-label="Bölge">' +
                              esc(safeValue(report.location)) +
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
                'Seçilen dönemde günlük ortalama bildirim sayısı: ' +

                '<b>' + averagePerDay + '</b>. ' +

                'Risk dağılımları, mevcut bildirim kayıtlarından hesaplanır. ' +

                'Bu istatistikler tek başına gerçek okul güvenliği düzeyini kanıtlamaz; ' +
                'bildirimlerin incelenmesi ve okul yönetiminin değerlendirmesi gerekir.' +

              '</p>' +

            '</div>' +

          '</div>' +

        '</div>';

      // Zaman aralığı değiştiğinde seçimi koru.
      $('#statsRange', root).addEventListener('change', event => {
        range = Number(event.target.value);
        draw();
      });

      // CSV dışa aktarma.
      $('#statsCSV', root).addEventListener('click', () => {

        if (!reports.length) {
          toast(
            'Dışa aktarılacak risk bildirimi bulunamadı.',
            'error'
          );
          return;
        }

        const rows = [[
          'Başlık',
          'Kategori',
          'Konum',
          'Önem derecesi',
          'Sıklık',
          'Durum',
          'Oluşturulma tarihi'
        ]];

        reports.forEach(report => {
          rows.push([
            csvSafe(report.title),
            csvSafe(CATEGORY[report.category] || report.category),
            csvSafe(report.location),
            csvSafe(SEVERITY[report.severity] || report.severity),
            csvSafe(FREQUENCY[report.frequency] || report.frequency),
            csvSafe(STATUS[report.status] || report.status),
            csvSafe(report.createdAt)
          ]);
        });

        downloadCSV(
          'odes-risk-istatistikleri.csv',
          rows
        );

        toast(
          'Risk istatistikleri CSV olarak indirildi.',
          'success'
        );
      });
    }

    draw();
  };

})();
