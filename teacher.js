
/* =========================================
   ODES — ÖĞRETMEN PANELİ
   Güvenlik bildirimleri ve risk yönetimi
========================================= */

(function () {
  'use strict';

  const {
    $,
    $$,
    esc,
    icon,
    store,
    sections,
    statCard,
    emptyState,
    fmtDT,
    renderInbox,
    modal,
    toast
  } = ODES;

  ODES.pages.teacher = function (root, user) {

    const STATUS = {
      new: 'Yeni',
      reviewing: 'İnceleniyor',
      resolved: 'Çözüldü',
      closed: 'Kapatıldı'
    };

    const CATEGORY = {
      bullying: 'Akran zorbalığı',
      safety: 'Güvenlik',
      facility: 'Fiziksel ortam',
      communication: 'İletişim',
      other: 'Diğer'
    };

    const SEVERITY = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik'
    };

    const FREQUENCY = {
      once: 'Bir kez',
      sometimes: 'Bazen',
      often: 'Sık sık',
      constant: 'Sürekli'
    };

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

    let searchText = '';
    let statusFilter = 'all';
    let severityFilter = 'all';
    let categoryFilter = 'all';

    function reports() {
      return store.reportsForTeacher(user.id) || [];
    }

    function statusBadge(status) {
      return `
        <span class="badge ${STATUS_CLASS[status] || 'b-neutral'}">
          ${esc(STATUS[status] || status || 'Bilinmiyor')}
        </span>
      `;
    }

    function severityBadge(severity) {
      return `
        <span class="badge ${SEVERITY_CLASS[severity] || 'b-neutral'}">
          ${esc(SEVERITY[severity] || severity || 'Belirtilmemiş')}
        </span>
      `;
    }

    function categoryName(category) {
      return CATEGORY[category] || 'Diğer';
    }

    function dateText(value) {
      return value ? fmtDT(value) : 'Tarih belirtilmemiş';
    }

    function historyItems(report) {
      const history = Array.isArray(report.history)
        ? report.history
        : [];

      if (!history.length) {
        return `
          <div class="empty-state">
            Henüz işlem geçmişi bulunmuyor.
          </div>
        `;
      }

      return `
        <div class="odes-timeline">
          ${history.map(item => `
            <div class="odes-timeline-item">
              <div class="odes-timeline-dot"></div>
              <div class="odes-timeline-content">
                <strong>${esc(
                  STATUS[item.status] ||
                  item.action ||
                  'Güncelleme'
                )}</strong>

                <div class="muted small">
                  ${esc(dateText(item.createdAt || item.date))}
                </div>

                ${
                  item.note
                    ? `<p>${esc(item.note)}</p>`
                    : ''
                }
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function reportCard(report) {
      return `
        <article class="card odes-report-card">
          <div class="card-body">

            <div class="row align-center justify-between gap-2">
              <div class="row align-center gap-2 wrap">
                ${statusBadge(report.status)}
                ${severityBadge(report.severity)}
              </div>

              <span class="muted small">
                ${esc(dateText(report.createdAt))}
              </span>
            </div>

            <h3 class="mt-3">
              ${esc(report.title)}
            </h3>

            <p class="muted">
              ${esc(
                (report.description || '').length > 150
                  ? report.description.slice(0, 150) + '...'
                  : report.description || ''
              )}
            </p>

            <div class="row wrap gap-2 small muted mt-2">
              <span>
                ${icon('map-pin', 14)}
                ${esc(report.location || 'Konum belirtilmemiş')}
              </span>

              <span>
                ${icon('tag', 14)}
                ${esc(categoryName(report.category))}
              </span>
            </div>

            <div class="row align-center justify-between mt-3">
              <span class="muted small">
                ${report.anonymous
                  ? 'Anonim bildirim'
                  : 'Kimliği görülebilen bildirim'}
              </span>

              <button
                class="btn btn-primary btn-sm"
                type="button"
                data-open-report="${esc(report.id)}">
                İncele
                ${icon('arrow-right', 15)}
              </button>
            </div>

          </div>
        </article>
      `;
    }

    function openReport(reportId) {
      // Yalnızca öğretmenin erişebildiği raporlar arasından bul.
      // Ham veriyi getiren reportById/allReports kullanılmaz.
      const report = reports().find(
        item => String(item.id) === String(reportId)
      );

      if (!report) {
        toast('Bu bildirime erişim izniniz bulunmuyor.', 'error');
        return;
      }

      const anonymous = report.anonymous === true;

      const html = `
        <div class="odes-report-detail">

          <div class="row wrap gap-2 mb-3">
            ${statusBadge(report.status)}
            ${severityBadge(report.severity)}
          </div>

          <h2>${esc(report.title)}</h2>

          <div class="muted small mb-3">
            ${esc(dateText(report.createdAt))}
          </div>

          <div class="detail-section">
            <h4>Bildirim açıklaması</h4>
            <p>${esc(report.description || 'Açıklama bulunmuyor.')}</p>
          </div>

          <div class="detail-grid mt-3">
            <div class="detail-item">
              <span class="muted small">Bildirim türü</span>
              <strong>${esc(categoryName(report.category))}</strong>
            </div>

            <div class="detail-item">
              <span class="muted small">Konum</span>
              <strong>${esc(report.location || 'Belirtilmemiş')}</strong>
            </div>

            <div class="detail-item">
              <span class="muted small">Sıklık</span>
              <strong>${esc(FREQUENCY[report.frequency] || 'Belirtilmemiş')}</strong>
            </div>

            <div class="detail-item">
              <span class="muted small">Bildirim yapan</span>
              <strong>
                ${anonymous
                  ? 'Anonim öğrenci'
                  : esc(report.studentName || 'Öğrenci')}
              </strong>
            </div>

            ${
              !anonymous && report.class
                ? `
                  <div class="detail-item">
                    <span class="muted small">Sınıf</span>
                    <strong>${esc(report.class)}</strong>
                  </div>
                `
                : ''
            }
          </div>

          <div class="detail-section mt-4">
            <h4>İşlem geçmişi</h4>
            ${historyItems(report)}
          </div>

          <div class="detail-section mt-4">
            <h4>Bildirim durumunu güncelle</h4>

            <label class="form-label" for="odesReportStatus">
              Yeni durum
            </label>

            <select id="odesReportStatus" class="form-control">
              ${Object.entries(STATUS).map(([key, value]) => `
                <option
                  value="${key}"
                  ${report.status === key ? 'selected' : ''}>
                  ${esc(value)}
                </option>
              `).join('')}
            </select>

            <label class="form-label mt-3" for="odesReportNote">
              İşlem notu
            </label>

            <textarea
              id="odesReportNote"
              class="form-control"
              rows="3"
              placeholder="Yapılan işlem veya değerlendirme hakkında not..."></textarea>

          </div>
        </div>
      `;

      modal({
        title: 'Bildirim Detayı',
        html,
        actions: [
          {
            label: 'Kaydet',
            className: 'btn-primary',
            onClick: function (close, box) {
              const statusEl = $('#odesReportStatus', box);
              const noteEl = $('#odesReportNote', box);

              if (!statusEl) return false;

              const newStatus = statusEl.value;
              const note = noteEl ? noteEl.value.trim() : '';

              const result = store.updateReportStatus(
                report.id,
                newStatus,
                user.id,
                note
              );

              if (!result || !result.ok) {
                toast(
                  result?.error || 'Durum güncellenemedi.',
                  'error'
                );
                return false;
              }

              toast('Bildirim durumu güncellendi.', 'success');

              if (typeof close === 'function') close();

              drawReports();
              drawOverview();
              return true;
            }
          }
        ]
      });
    }

    function drawOverview() {
      const el = $('#teacherOverview', root);
      if (!el) return;

      const list = reports();

      const counts = {
        total: list.length,
        new: list.filter(r => r.status === 'new').length,
        reviewing: list.filter(r => r.status === 'reviewing').length,
        resolved: list.filter(r => r.status === 'resolved').length,
        urgent: list.filter(
          r => r.severity === 'critical' || r.severity === 'high'
        ).length
      };

      const recent = [...list]
        .sort((a, b) => {
          return new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0);
        })
        .slice(0, 5);

      el.innerHTML = `
        <div class="page-heading">
          <div>
            <h2>Güvenlik Özeti</h2>
            <p class="muted">
              Erişebildiğiniz okul güvenliği bildirimlerinin genel durumu.
            </p>
          </div>
        </div>

        <div class="stats-grid">
          ${statCard(
            'Erişilebilir Bildirim',
            counts.total,
            'clipboard',
            'primary'
          )}

          ${statCard(
            'Yeni Bildirim',
            counts.new,
            'alert-circle',
            'info'
          )}

          ${statCard(
            'İncelenen',
            counts.reviewing,
            'clock',
            'warning'
          )}

          ${statCard(
            'Çözülen',
            counts.resolved,
            'check-circle',
            'success'
          )}
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <h3>Öncelikli Bildirimler</h3>
            <span class="badge b-danger">${counts.urgent}</span>
          </div>

          <div class="card-body">
            ${
              counts.urgent
                ? `<p>
                    Yüksek veya kritik önem düzeyinde
                    ${counts.urgent} bildirim bulunuyor.
                  </p>`
                : `<p class="muted">
                    Şu anda yüksek veya kritik önem düzeyinde
                    erişilebilir bildirim bulunmuyor.
                  </p>`
            }
          </div>
        </div>

        ${
          !Array.isArray(user.classes) || !user.classes.length
            ? `
              <div class="notice notice-info mt-3">
                <strong>Sınıf görevlendirmesi bulunmuyor.</strong>
                Şu anda anonim bildirimleri görüntüleyebilirsiniz.
                Sınıf görevlendirmeniz yapıldığında ilgili sınıfların
                kimlik bilgisi içeren bildirimlerine de erişebilirsiniz.
              </div>
            `
            : ''
        }

        <div class="card mt-4">
          <div class="card-header">
            <h3>Son Bildirimler</h3>
            <button
              class="btn btn-sm btn-ghost"
              type="button"
              data-go-reports>
              Tümünü Gör
            </button>
          </div>

          <div class="card-body">
            ${
              recent.length
                ? recent.map(reportCard).join('')
                : emptyState(
                    'Henüz bildirim bulunmuyor.',
                    'inbox'
                  )
            }
          </div>
        </div>
      `;

      bindReportButtons(el);
    }

    function drawReports() {
      const el = $('#teacherReports', root);
      if (!el) return;

      let list = reports();

      if (searchText) {
        const q = searchText.toLocaleLowerCase('tr');

        list = list.filter(report => {
          return [
            report.title,
            report.description,
            report.location,
            report.studentName,
            report.class
          ].some(value =>
            String(value || '')
              .toLocaleLowerCase('tr')
              .includes(q)
          );
        });
      }

      if (statusFilter !== 'all') {
        list = list.filter(r => r.status === statusFilter);
      }

      if (severityFilter !== 'all') {
        list = list.filter(r => r.severity === severityFilter);
      }

      if (categoryFilter !== 'all') {
        list = list.filter(r => r.category === categoryFilter);
      }

      list.sort((a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );

      el.innerHTML = `
        <div class="page-heading">
          <div>
            <h2>Güvenlik Bildirimleri</h2>
            <p class="muted">
              Yetkiniz dahilindeki bildirimleri inceleyin ve
              durumlarını güncelleyin.
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-body">

            <div class="form-group">
              <input
                id="odesReportSearch"
                class="form-control"
                type="search"
                placeholder="Bildirimlerde ara..."
                value="${esc(searchText)}">
            </div>

            <div class="filter-grid">
              <select id="odesStatusFilter" class="form-control">
                <option value="all">Tüm durumlar</option>
                ${Object.entries(STATUS).map(([key, value]) => `
                  <option
                    value="${key}"
                    ${statusFilter === key ? 'selected' : ''}>
                    ${esc(value)}
                  </option>
                `).join('')}
              </select>

              <select id="odesSeverityFilter" class="form-control">
                <option value="all">Tüm önem düzeyleri</option>
                ${Object.entries(SEVERITY).map(([key, value]) => `
                  <option
                    value="${key}"
                    ${severityFilter === key ? 'selected' : ''}>
                    ${esc(value)}
                  </option>
                `).join('')}
              </select>

              <select id="odesCategoryFilter" class="form-control">
                <option value="all">Tüm bildirim türleri</option>
                ${Object.entries(CATEGORY).map(([key, value]) => `
                  <option
                    value="${key}"
                    ${categoryFilter === key ? 'selected' : ''}>
                    ${esc(value)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="muted small mt-3">
              ${list.length} bildirim listeleniyor.
            </div>

          </div>
        </div>

        <div class="odes-report-list mt-3">
          ${
            list.length
              ? list.map(reportCard).join('')
              : emptyState(
                  'Filtrelere uygun bildirim bulunamadı.',
                  'search'
                )
          }
        </div>
      `;

      const search = $('#odesReportSearch', el);
      const status = $('#odesStatusFilter', el);
      const severity = $('#odesSeverityFilter', el);
      const category = $('#odesCategoryFilter', el);

      if (search) {
        search.addEventListener('input', function () {
          searchText = this.value;
          drawReports();

          const input = $('#odesReportSearch', el);
          if (input) {
            input.focus();
            input.setSelectionRange(
              input.value.length,
              input.value.length
            );
          }
        });
      }

      if (status) {
        status.addEventListener('change', function () {
          statusFilter = this.value;
          drawReports();
        });
      }

      if (severity) {
        severity.addEventListener('change', function () {
          severityFilter = this.value;
          drawReports();
        });
      }

      if (category) {
        category.addEventListener('change', function () {
          categoryFilter = this.value;
          drawReports();
        });
      }

      bindReportButtons(el);
    }

    function bindReportButtons(container) {
      $$('[data-open-report]', container).forEach(button => {
        button.addEventListener('click', function () {
          openReport(this.dataset.openReport);
        });
      });

      $$('[data-go-reports]', container).forEach(button => {
        button.addEventListener('click', function () {
          location.hash = '#reports';
        });
      });
    }

    function overview(rootEl) {
      rootEl.innerHTML = `
        <div id="teacherOverview"></div>
      `;

      drawOverview();
    }

    function reportPage(rootEl) {
      rootEl.innerHTML = `
        <div id="teacherReports"></div>
      `;

      drawReports();
    }

    function inboxPage(rootEl) {
      renderInbox(rootEl, user);
    }

    sections(root, {
      overview,
      reports: reportPage,
      inbox: inboxPage
    }, 'overview');
  };

})();
