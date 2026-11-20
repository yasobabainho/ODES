(function () {
  'use strict';
  const { $, $$, esc, icon, store, statCard, emptyState, charts, pct, fmtDT, downloadCSV, toast } = ODES;

  ODES.pages['admin-stats'] = function (root) {
    let range = 14;

    root.innerHTML = '<div class="page"><div class="page-head"><div><h1>İstatistikler</h1><p class="muted">Gönderim hacmi, okunma oranları ve etkileşim özetleri.</p></div>' +
      '<div class="page-actions"><select class="select" id="range" aria-label="Zaman aralığı"><option value="7">Son 7 gün</option><option value="14" selected>Son 14 gün</option><option value="30">Son 30 gün</option></select>' +
      '<button class="btn" type="button" id="csv">' + icon('download', 16) + 'CSV indir</button></div></div><div id="stats"></div></div>';

    function sentInRange() {
      const from = Date.now() - range * ODES.DAY;
      return store.db().notifications.filter(n => n.status === 'sent' && new Date(n.sentAt).getTime() >= from);
    }
    const readCount = n => Object.keys(n.reads || {}).filter(id => n.recipients.includes(id)).length;

    function draw() {
      const db = store.db();
      const sent = sentInRange();
      const deliveries = sent.reduce((s, n) => s + n.recipients.length, 0);
      const reads = sent.reduce((s, n) => s + readCount(n), 0);
      let delays = [];
      sent.forEach(n => Object.keys(n.reads).forEach(id => { if (n.recipients.includes(id)) delays.push((new Date(n.reads[id]) - new Date(n.sentAt)) / ODES.HOUR); }));
      const avgDelay = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;

      // Günlük gönderim
      const days = [];
      for (let i = range - 1; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); days.push(d); }
      const perDay = days.map(d => {
        const k = store.dateKey(d);
        const value = sent.filter(n => store.dateKey(n.sentAt) === k).length;
        return { label: range <= 14 ? String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') : String(d.getDate()), value };
      });

      // Durum dağılımı (tüm zamanlar)
      const stColors = { sent: 'var(--c2)', scheduled: 'var(--c1)', draft: 'var(--c5)', cancelled: 'var(--c4)' };
      const statusItems = Object.keys(ODES.STATUSES).map(k => ({ label: ODES.STATUSES[k], value: db.notifications.filter(n => n.status === k).length, color: stColors[k] }));

      // Tür bazında okunma
      const byType = Object.keys(ODES.TYPES).map(t => {
        const ns = sent.filter(n => n.type === t);
        const d = ns.reduce((s, n) => s + n.recipients.length, 0), r = ns.reduce((s, n) => s + readCount(n), 0);
        return { label: ODES.TYPES[t], value: pct(r, d), text: d ? pct(r, d) + '% (' + r + '/' + d + ')' : 'Veri yok' };
      });

      // Sınıf bazında okunma (öğrenciler)
      const byClass = ODES.CLASSES.map(c => {
        let d = 0, r = 0;
        sent.forEach(n => n.recipients.forEach(id => { const u = store.user(id); if (u && u.role === 'student' && u.class === c) { d++; if (n.reads[id]) r++; } }));
        return { label: 'Sınıf ' + c, value: pct(r, d), text: d ? pct(r, d) + '% (' + r + '/' + d + ')' : 'Veri yok' };
      });

      // Gönderen bazında hacim
      const senders = {};
      sent.forEach(n => { senders[n.senderId] = (senders[n.senderId] || 0) + 1; });
      const maxS = Math.max.apply(null, Object.values(senders).concat([1]));
      const bySender = Object.keys(senders).map(id => ({ label: (store.user(id) || { name: 'Silinmiş kullanıcı' }).name, value: pct(senders[id], maxS), text: senders[id] + ' bildirim' })).sort((a, b) => b.value - a.value);

      // En az okunanlar
      const lowest = sent.map(n => ({ n, rate: pct(readCount(n), n.recipients.length) })).sort((a, b) => a.rate - b.rate).slice(0, 5);

      // Okunmamış bildirimi en çok olan kullanıcılar
      const unreadBy = {};
      sent.forEach(n => n.recipients.forEach(id => { if (!n.reads[id]) unreadBy[id] = (unreadBy[id] || 0) + 1; }));
      const topUnread = Object.keys(unreadBy).filter(id => store.user(id)).map(id => ({ u: store.user(id), c: unreadBy[id] })).sort((a, b) => b.c - a.c).slice(0, 5);

      const el = $('#stats');
      el.innerHTML = '<div class="stack-v">' +
        '<div class="grid g4">' +
          statCard({ label: 'Gönderilen bildirim', value: sent.length, icon: 'send', tone: 'primary' }) +
          statCard({ label: 'Toplam teslimat', value: deliveries, icon: 'users', tone: 'info' }) +
          statCard({ label: 'Okunma oranı', value: deliveries ? '%' + pct(reads, deliveries) : '—', icon: 'check', tone: 'success' }) +
          statCard({ label: 'Ort. okunma süresi', value: avgDelay == null ? '—' : (avgDelay < 1 ? Math.round(avgDelay * 60) + ' dk' : avgDelay.toFixed(1) + ' sa'), icon: 'clock', tone: 'warning' }) +
        '</div>' +
        '<div class="grid g-main"><div class="card"><div class="card-h"><h3>Günlük gönderim</h3><span class="muted small">Son ' + range + ' gün</span></div>' + charts.cols(perDay, { height: 210, label: 'Günlük gönderilen bildirim sayısı' }) + '</div>' +
          '<div class="card"><div class="card-h"><h3>Durum dağılımı</h3><span class="muted small">Tüm zamanlar</span></div>' + charts.donut(statusItems, { label: 'Bildirim durumu dağılımı', center: 'bildirim' }) + '</div></div>' +
        '<div class="grid g2"><div class="card"><div class="card-h"><h3>Türe göre okunma oranı</h3></div>' + charts.hbars(byType) + '</div>' +
          '<div class="card"><div class="card-h"><h3>Sınıfa göre okunma oranı</h3><span class="muted small">Öğrenciler</span></div>' + charts.hbars(byClass) + '</div></div>' +
        '<div class="grid g2"><div class="card"><div class="card-h"><h3>Gönderen bazında hacim</h3></div>' + charts.hbars(bySender) + '</div>' +
          '<div class="card flush"><div class="card-h"><h3>En az okunan bildirimler</h3></div><div class="table-wrap"><table class="table stack"><thead><tr><th>Bildirim</th><th>Okunma</th></tr></thead><tbody>' +
          (lowest.map(x => '<tr><td data-label="Bildirim"><b>' + esc(x.n.title) + '</b><br><small class="muted">' + esc(fmtDT(x.n.sentAt)) + '</small></td><td data-label="Okunma"><div class="prog-cell"><div class="progress"><i style="width:' + x.rate + '%"></i></div><span>%' + x.rate + '</span></div></td></tr>').join('') || '<tr><td colspan="2">' + emptyState('Bu aralıkta gönderim yok.', 'chart') + '</td></tr>') + '</tbody></table></div></div></div>' +
        '<div class="card flush"><div class="card-h"><h3>Okunmamış bildirimi en çok olanlar</h3></div><div class="table-wrap"><table class="table stack"><thead><tr><th>Kullanıcı</th><th>Rol / sınıf</th><th>Okunmamış</th></tr></thead><tbody>' +
          (topUnread.map(x => '<tr><td data-label="Kullanıcı"><div class="person">' + ODES.avatar(x.u.name, 'sm') + '<b>' + esc(x.u.name) + '</b></div></td><td data-label="Rol / sınıf">' + esc(x.u.role === 'student' ? x.u.class : ODES.ROLES[x.u.role]) + '</td><td data-label="Okunmamış"><span class="badge b-warning">' + x.c + '</span></td></tr>').join('') || '<tr><td colspan="3">' + emptyState('Okunmamış bildirim yok.', 'check') + '</td></tr>') + '</tbody></table></div></div>' +
        '<p class="muted small">Tüm değerler demo verisinden hesaplanır; okunma süresi, bildirimin gönderiminden ilk okunmaya kadar geçen süredir.</p></div>';
    }

    $('#range').addEventListener('change', e => { range = Number(e.target.value); draw(); });
    $('#csv').addEventListener('click', () => {
      const sent = sentInRange();
      if (!sent.length) { toast('Bu aralıkta dışa aktarılacak veri yok.', 'error'); return; }
      const rows = [['Başlık', 'Tür', 'Gönderen', 'Hedef', 'Gönderim zamanı', 'Alıcı', 'Okuyan', 'Okunma oranı (%)']]
        .concat(sent.map(n => [n.title, ODES.TYPES[n.type], (store.user(n.senderId) || { name: '—' }).name, store.audienceLabel(n.audience), new Date(n.sentAt).toLocaleString('tr-TR'), n.recipients.length, readCount(n), pct(readCount(n), n.recipients.length)]));
      downloadCSV('odes-bildirim-istatistikleri.csv', rows);
      toast('CSV dosyası indirildi.', 'success');
    });
    draw();
  };
})();
