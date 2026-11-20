(function () {
  'use strict';
  const { $, $$, esc, icon, store, statusBadge, typeBadge, avatar, fmtDT, pct, emptyState, modal, confirmDialog, toast } = ODES;

  ODES.pages['notification-history'] = function (root, user) {
    const isAdmin = user.role === 'admin';
    let q = '', status = 'all', type = 'all';

    const mine = () => store.db().notifications.filter(n => isAdmin || n.senderId === user.id)
      .sort((a, b) => new Date(b.sentAt || b.scheduledAt || b.createdAt) - new Date(a.sentAt || a.scheduledAt || a.createdAt));
    const stats = n => { const total = store.recipientCount(n); const read = Object.keys(n.reads || {}).filter(id => (n.recipients || []).includes(id)).length; return { total, read, rate: pct(read, total) }; };
    const when = n => n.status === 'sent' ? fmtDT(n.sentAt) : n.status === 'scheduled' ? fmtDT(n.scheduledAt) : n.status === 'cancelled' ? fmtDT(n.cancelledAt) : fmtDT(n.createdAt);
    const whenLabel = n => ({ sent: 'Gönderildi', scheduled: 'Planlanan', cancelled: 'İptal', draft: 'Oluşturuldu' }[n.status]);

    root.innerHTML = '<div class="page"><div class="page-head"><div><h1>Bildirim geçmişi ve durum takibi</h1><p class="muted">' + (isAdmin ? 'Tüm bildirimlerin' : 'Gönderdiğiniz bildirimlerin') + ' durumunu, okunma oranlarını ve alıcı detaylarını izleyin.</p></div>' +
      '<div class="page-actions"><a class="btn btn-primary" href="notification-create.html">' + icon('plus', 16) + 'Yeni bildirim</a></div></div><div id="hist"></div></div>';

    function draw() {
      const all = mine();
      const norm = s => s.toLocaleLowerCase('tr-TR');
      const list = all.filter(n => (status === 'all' || n.status === status) && (type === 'all' || n.type === type) && (norm(n.title).includes(norm(q))));
      const counts = s => all.filter(n => s === 'all' || n.status === s).length;
      const el = $('#hist');
      el.innerHTML = '<div class="card flush"><div class="card-h"><div class="tabs">' +
        [['all', 'Tümü']].concat(Object.keys(ODES.STATUSES).map(k => [k, ODES.STATUSES[k]])).map(t => '<button type="button" class="tab ' + (status === t[0] ? 'active' : '') + '" data-st="' + t[0] + '">' + esc(t[1]) + '<small>' + counts(t[0]) + '</small></button>').join('') + '</div>' +
        '<div class="filters"><div class="search" style="position:relative"><span style="position:absolute;left:12px;top:12px;color:var(--muted)">' + icon('search', 16) + '</span><input class="input" style="padding-left:38px" type="search" id="q" placeholder="Başlıkta ara" aria-label="Başlıkta ara" value="' + esc(q) + '"></div>' +
        '<select class="select" id="fType" aria-label="Tür filtresi"><option value="all">Tüm türler</option>' + Object.keys(ODES.TYPES).map(k => '<option value="' + k + '">' + esc(ODES.TYPES[k]) + '</option>').join('') + '</select></div></div>' +
        '<div class="table-wrap"><table class="table stack"><thead><tr><th>Bildirim</th><th>Hedef</th><th>Durum</th><th>Okunma</th><th>Zaman</th><th></th></tr></thead><tbody>' +
        (list.map(n => {
          const s = stats(n);
          const a = [];
          a.push('<button type="button" class="btn btn-sm" data-act="detail" data-id="' + esc(n.id) + '">Detay</button>');
          if (n.status === 'draft') a.push('<a class="btn btn-sm" href="notification-create.html?edit=' + esc(n.id) + '">' + icon('edit', 14) + 'Düzenle</a>');
          if (n.status === 'draft' || n.status === 'scheduled') a.push('<button type="button" class="btn btn-sm btn-primary" data-act="send" data-id="' + esc(n.id) + '">Şimdi gönder</button>');
          if (n.status === 'scheduled') a.push('<button type="button" class="btn btn-sm" data-act="cancel" data-id="' + esc(n.id) + '">İptal et</button>');
          a.push('<a class="btn btn-sm btn-ghost" href="notification-create.html?dup=' + esc(n.id) + '" title="Kopyala" aria-label="' + esc(n.title) + ' bildirimini kopyala">' + icon('copy', 14) + '</a>');
          if (n.status === 'draft' || n.status === 'cancelled') a.push('<button type="button" class="btn btn-sm btn-ghost" data-act="delete" data-id="' + esc(n.id) + '" aria-label="' + esc(n.title) + ' bildirimini sil">' + icon('trash', 14) + '</button>');
          const sender = store.user(n.senderId);
          return '<tr data-row="' + esc(n.id) + '"><td data-label="Bildirim"><b>' + esc(n.title) + '</b><br>' + typeBadge(n.type) + (isAdmin ? ' <small class="muted">' + esc(sender ? sender.name : '—') + '</small>' : '') + '</td>' +
            '<td data-label="Hedef">' + esc(store.audienceLabel(n.audience)) + '<br><small class="muted">' + s.total + ' alıcı</small></td><td data-label="Durum">' + statusBadge(n.status) + '</td>' +
            '<td data-label="Okunma">' + (n.status === 'sent' ? '<div class="prog-cell"><div class="progress"><i style="width:' + s.rate + '%"></i></div><span>' + s.read + '/' + s.total + ' (' + s.rate + '%)</span></div>' : '<span class="muted">—</span>') + '</td>' +
            '<td data-label="' + whenLabel(n) + '">' + esc(when(n)) + '</td><td class="actions">' + a.join('') + '</td></tr>';
        }).join('') || '<tr><td colspan="6">' + emptyState('Bu filtrelerle eşleşen bildirim yok.', 'history') + '</td></tr>') + '</tbody></table></div></div>';

      $('#fType', el).value = type;
      $$('[data-st]', el).forEach(b => b.addEventListener('click', () => { status = b.dataset.st; draw(); }));
      $('#fType', el).addEventListener('change', e => { type = e.target.value; draw(); });
      const qi = $('#q', el);
      qi.addEventListener('input', () => { q = qi.value; const p = qi.selectionStart; draw(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); });
      $$('[data-act]', el).forEach(b => b.addEventListener('click', () => act(b.dataset.act, b.dataset.id)));
    }

    async function act(kind, id) {
      const n = store.notification(id); if (!n) return;
      if (kind === 'detail') return detail(n);
      if (kind === 'send') {
        const cnt = store.recipients(n.audience, n.senderId).length;
        if (!cnt) { toast('Hedef kitlede alıcı bulunamadı.', 'error'); return; }
        const ok = await confirmDialog({ title: 'Şimdi gönder', message: '"' + n.title + '" bildirimi ' + cnt + ' alıcıya hemen gönderilecek.', confirmLabel: 'Gönder' });
        if (!ok) return; n.scheduledAt = null; store.sendNow(n); toast('Bildirim gönderildi.', 'success'); draw();
      } else if (kind === 'cancel') {
        const ok = await confirmDialog({ title: 'Gönderimi iptal et', message: '"' + n.title + '" için planlanan gönderim iptal edilecek.', confirmLabel: 'İptal et', danger: true });
        if (!ok) return; n.status = 'cancelled'; n.cancelledAt = new Date().toISOString(); store.save(); store.log('"' + n.title + '" zamanlanmış bildirimi iptal edildi.'); toast('Gönderim iptal edildi.', 'success'); draw();
      } else if (kind === 'delete') {
        const ok = await confirmDialog({ title: 'Bildirimi sil', message: '"' + n.title + '" kalıcı olarak silinecek.', confirmLabel: 'Sil', danger: true });
        if (!ok) return; store.deleteNotification(n.id); toast('Bildirim silindi.', 'success'); draw();
      }
    }

    function detail(n) {
      const s = stats(n);
      const sender = store.user(n.senderId);
      const tl = [];
      tl.push('<li class="done"><span class="dot"></span><b>Oluşturuldu</b><small>' + esc(fmtDT(n.createdAt)) + '</small></li>');
      if (n.scheduledAt || n.status === 'scheduled') tl.push('<li class="' + (n.status === 'scheduled' ? 'wait' : 'done') + '"><span class="dot"></span><b>Zamanlandı</b><small>' + esc(fmtDT(n.scheduledAt)) + (n.status === 'scheduled' ? ' · bekliyor' : '') + '</small></li>');
      if (n.status === 'cancelled') tl.push('<li class="bad"><span class="dot"></span><b>İptal edildi</b><small>' + esc(fmtDT(n.cancelledAt)) + '</small></li>');
      else if (n.status === 'sent') tl.push('<li class="done"><span class="dot"></span><b>Gönderildi</b><small>' + esc(fmtDT(n.sentAt)) + ' · ' + s.total + ' alıcı</small></li>' +
        '<li class="' + (s.read ? 'done' : 'wait') + '"><span class="dot"></span><b>Okunma</b><small>' + s.read + '/' + s.total + ' kişi okudu (%' + s.rate + ')</small></li>');
      else tl.push('<li><span class="dot"></span><b>' + (n.status === 'draft' ? 'Taslak: henüz gönderilmedi' : 'Gönderim bekliyor') + '</b></li>');

      const recips = (n.status === 'sent' ? n.recipients : store.recipients(n.audience, n.senderId));
      let filter = 'all';
      const html = '<dl class="kv"><dt>Başlık</dt><dd>' + esc(n.title) + '</dd><dt>Tür</dt><dd>' + typeBadge(n.type) + '</dd><dt>Gönderen</dt><dd>' + esc(sender ? sender.name : '—') + '</dd><dt>Hedef</dt><dd>' + esc(store.audienceLabel(n.audience)) + '</dd><dt>Durum</dt><dd>' + statusBadge(n.status) + '</dd><dt>Mesaj</dt><dd style="white-space:pre-wrap">' + esc(n.body) + '</dd></dl>' +
        '<h4 style="margin-bottom:10px">Durum akışı</h4><ul class="timeline">' + tl.join('') + '</ul>' +
        '<h4 style="margin:6px 0 10px">Alıcılar (' + recips.length + ')</h4>' +
        (n.status === 'sent' ? '<div class="tabs" style="margin-bottom:10px" id="rf"></div>' : '') + '<div id="rl"></div>';

      modal({
        title: 'Bildirim detayı', size: 'lg', html,
        onOpen: (box, close) => {
          function drawR() {
            const rows = recips.map(id => ({ u: store.user(id), at: (n.reads || {})[id] })).filter(r => r.u)
              .filter(r => filter === 'all' || (filter === 'unread' ? !r.at : !!r.at));
            if (n.status === 'sent') {
              const rd = recips.filter(id => n.reads[id]).length;
              $('#rf', box).innerHTML = [['all', 'Tümü', recips.length], ['unread', 'Okumadı', recips.length - rd], ['read', 'Okudu', rd]].map(t => '<button type="button" class="tab ' + (filter === t[0] ? 'active' : '') + '" data-f="' + t[0] + '">' + t[1] + '<small>' + t[2] + '</small></button>').join('');
              $$('[data-f]', box).forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; drawR(); }));
            }
            $('#rl', box).innerHTML = rows.length ? '<div class="list">' + rows.map(r => '<div class="li"><div class="person grow">' + avatar(r.u.name, 'sm') + '<div><b>' + esc(r.u.name) + '</b><small>' + esc(r.u.role === 'student' ? r.u.class : ODES.ROLES[r.u.role]) + '</small></div></div>' +
              (n.status === 'sent' ? (r.at ? '<span class="badge b-success">Okudu · ' + esc(fmtDT(r.at)) + '</span>' : '<span class="badge b-warning">Okumadı</span>') : '<span class="badge b-neutral">Bekliyor</span>') + '</div>').join('') + '</div>' : emptyState('Bu filtrede alıcı yok.', 'users');
          }
          drawR();
          const unread = recips.filter(id => store.user(id) && !n.reads[id]);
          if (n.status === 'sent' && unread.length && (isAdmin || n.senderId === user.id)) {
            const foot = $('.modal-f', box.parentNode ? box : box);
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'btn btn-primary'; b.innerHTML = icon('send', 16) + 'Okumayanlara hatırlat (' + unread.length + ')';
            b.addEventListener('click', () => {
              const r = store.createNotification({ title: 'Hatırlatma: ' + n.title.slice(0, 70), body: n.body, type: n.type, audience: { kind: 'users', value: unread }, senderId: user.id });
              store.sendNow(r); toast('Hatırlatma ' + unread.length + ' kişiye gönderildi.', 'success'); close(); draw();
            });
            foot.prepend(b);
          }
          const fb = document.createElement('button');
          fb.type = 'button'; fb.className = 'btn btn-ghost'; fb.textContent = 'Kapat'; fb.addEventListener('click', close);
          $('.modal-f', box).appendChild(fb);
        }
      });
    }

    draw();
  };
})();
