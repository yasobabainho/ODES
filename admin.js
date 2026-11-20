(function () {
  'use strict';
  const { $, $$, esc, icon, store, sections, statCard, emptyState, fmtDT, statusBadge, roleBadge, avatar, renderInbox, modal, confirmDialog, toast } = ODES;

  ODES.pages.admin = function (root, user) {
    const users = () => store.db().users;

    function overview(el) {
      const us = users();
      const students = us.filter(u => u.role === 'student' && u.status === 'active').length;
      const teachers = us.filter(u => u.role === 'teacher' && u.status === 'active').length;
      const pending = us.filter(u => u.status === 'pending');
      const notifs = store.db().notifications.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const scheduled = notifs.filter(n => n.status === 'scheduled').length;
      el.innerHTML = '<div class="stack-v">' +
        '<div class="card hero"><div><h2>Merhaba, ' + esc(user.name.split(' ')[0]) + '</h2><p>Sistem durumu ve bekleyen işlemler</p></div>' +
        '<div class="page-actions"><a class="btn btn-light" href="notification-create.html">' + icon('plus', 16) + 'Bildirim oluştur</a><a class="btn btn-light" href="admin-stats.html">' + icon('chart', 16) + 'İstatistikler</a></div></div>' +
        '<div class="grid g4">' +
          statCard({ label: 'Aktif öğrenci', value: students, icon: 'user', tone: 'info', href: '#users' }) +
          statCard({ label: 'Aktif öğretmen', value: teachers, icon: 'users', tone: 'primary', href: '#users' }) +
          statCard({ label: 'Onay bekleyen', value: pending.length, icon: 'shield', tone: pending.length ? 'warning' : 'success', href: '#pending' }) +
          statCard({ label: 'Zamanlanmış bildirim', value: scheduled, icon: 'clock', tone: 'info', href: 'notification-history.html' }) +
        '</div>' +
        '<div class="grid g-main">' +
          '<div class="card flush"><div class="card-h"><h3>Son bildirimler</h3><a href="notification-history.html">Tümü</a></div><div class="table-wrap"><table class="table stack"><thead><tr><th>Bildirim</th><th>Hedef</th><th>Durum</th><th>Okunma</th></tr></thead><tbody>' +
          notifs.slice(0, 6).map(n => {
            const total = store.recipientCount(n), read = Object.keys(n.reads).length;
            return '<tr><td data-label="Bildirim"><b>' + esc(n.title) + '</b></td><td data-label="Hedef">' + esc(store.audienceLabel(n.audience)) + '</td><td data-label="Durum">' + statusBadge(n.status) + '</td><td data-label="Okunma">' + (n.status === 'sent' ? ODES.pct(read, total) + '%' : '—') + '</td></tr>';
          }).join('') + '</tbody></table></div></div>' +
          '<div class="stack-v">' +
            '<div class="card"><div class="card-h"><h3>Onay bekleyenler</h3><a href="#pending">Yönet</a></div>' +
              (pending.slice(0, 3).map(u => '<div class="li"><div class="person grow">' + avatar(u.name, 'sm') + '<div><b>' + esc(u.name) + '</b><small>' + esc(u.branch || '') + '</small></div></div></div>').join('') || emptyState('Bekleyen kayıt yok.', 'shield')) + '</div>' +
            '<div class="card"><div class="card-h"><h3>Son etkinlikler</h3><a href="#log">Tümü</a></div>' +
              store.db().activity.slice(0, 4).map(a => '<div class="li"><div class="grow"><span>' + esc(a.text) + '</span><small class="muted" style="display:block">' + esc(fmtDT(a.at)) + '</small></div></div>').join('') + '</div>' +
          '</div>' +
        '</div></div>';
    }

    function usersSection(el, refresh) {
      let q = '', role = 'all', status = 'all';
      const acts = $('#pageActions');
      if (acts) { acts.innerHTML = '<button class="btn btn-primary" type="button" id="addU">' + icon('plus', 16) + 'Kullanıcı ekle</button>'; $('#addU').addEventListener('click', openAdd); }

      function draw() {
        const norm = s => s.toLocaleLowerCase('tr-TR');
        const list = users().filter(u => (role === 'all' || u.role === role) && (status === 'all' || u.status === status) && (norm(u.name).includes(norm(q)) || norm(u.email).includes(norm(q))));
        el.innerHTML = '<div class="card flush"><div class="card-h"><div class="toolbar" style="margin:0;width:100%"><div class="search"><span>' + icon('search', 16) + '</span><input class="input" id="q" type="search" placeholder="Ad veya e-posta ara" aria-label="Kullanıcı ara" value="' + esc(q) + '"></div>' +
          '<div class="filters"><select class="select" id="fRole" aria-label="Rol filtresi"><option value="all">Tüm roller</option><option value="student">Öğrenci</option><option value="teacher">Öğretmen</option><option value="admin">Yönetici</option></select>' +
          '<select class="select" id="fStatus" aria-label="Durum filtresi"><option value="all">Tüm durumlar</option><option value="active">Aktif</option><option value="pending">Onay bekliyor</option><option value="inactive">Pasif</option></select></div></div></div>' +
          '<div class="table-wrap"><table class="table stack"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Sınıf / branş</th><th>Durum</th><th></th></tr></thead><tbody>' +
          (list.map(u => {
            const st = u.status === 'active' ? '<span class="badge b-success">Aktif</span>' : u.status === 'pending' ? '<span class="badge b-warning">Onay bekliyor</span>' : '<span class="badge b-neutral">Pasif</span>';
            const self = u.id === user.id;
            let btns = '';
            if (u.status === 'pending') btns += '<button type="button" class="btn btn-sm btn-primary" data-ap="' + esc(u.id) + '">Onayla</button>';
            else if (!self) btns += '<button type="button" class="btn btn-sm" data-tg="' + esc(u.id) + '">' + (u.status === 'active' ? 'Pasife al' : 'Etkinleştir') + '</button>';
            if (!self) btns += '<button type="button" class="btn btn-sm btn-ghost" data-rm="' + esc(u.id) + '" aria-label="' + esc(u.name) + ' kullanıcısını sil">' + icon('trash', 14) + '</button>';
            return '<tr><td data-label="Kullanıcı"><div class="person">' + avatar(u.name, 'sm') + '<div><b>' + esc(u.name) + (self ? ' (siz)' : '') + '</b><small>' + esc(u.email) + '</small></div></div></td><td data-label="Rol">' + roleBadge(u.role) + '</td>' +
              '<td data-label="Sınıf / branş">' + esc(u.role === 'student' ? u.class : u.role === 'teacher' ? (u.branch || '—') + ((u.classes || []).length ? ' · ' + u.classes.join(', ') : '') : '—') + '</td><td data-label="Durum">' + st + '</td><td class="actions">' + btns + '</td></tr>';
          }).join('') || '<tr><td colspan="5">' + emptyState('Eşleşen kullanıcı yok.', 'search') + '</td></tr>') + '</tbody></table></div></div>';
        $('#fRole', el).value = role; $('#fStatus', el).value = status;
        const qi = $('#q', el);
        qi.addEventListener('input', () => { q = qi.value; const p = qi.selectionStart; draw(); const n = $('#q', el); n.focus(); n.setSelectionRange(p, p); });
        $('#fRole', el).addEventListener('change', e => { role = e.target.value; draw(); });
        $('#fStatus', el).addEventListener('change', e => { status = e.target.value; draw(); });
        $$('[data-tg]', el).forEach(b => b.addEventListener('click', () => {
          const u = store.user(b.dataset.tg); const next = u.status === 'active' ? 'inactive' : 'active';
          store.setUserStatus(u.id, next); toast(u.name + (next === 'active' ? ' etkinleştirildi.' : ' pasife alındı.'), 'success'); draw();
        }));
        $$('[data-rm]', el).forEach(b => b.addEventListener('click', async () => {
          const u = store.user(b.dataset.rm);
          const ok = await confirmDialog({ title: 'Kullanıcıyı sil', message: u.name + ' hesabı kalıcı olarak silinecek. Devam edilsin mi?', confirmLabel: 'Sil', danger: true });
          if (!ok) return; store.deleteUser(u.id); toast('Kullanıcı silindi.', 'success'); draw();
        }));
        $$('[data-ap]', el).forEach(b => b.addEventListener('click', () => approveDialog(store.user(b.dataset.ap), draw)));
      }
      draw();
    }

    function openAdd() {
      const html = '<form id="uForm" novalidate>' +
        '<div class="field"><label for="uName">Ad soyad</label><input class="input" id="uName"><span class="err" id="uNameErr"></span></div>' +
        '<div class="field"><label for="uEmail">E-posta</label><input class="input" id="uEmail" type="email"><span class="err" id="uEmailErr"></span></div>' +
        '<div class="row"><div class="field"><label for="uRole">Rol</label><select class="select" id="uRole"><option value="student">Öğrenci</option><option value="teacher">Öğretmen</option></select></div>' +
        '<div class="field" id="uClassF"><label for="uClass">Sınıf</label><select class="select" id="uClass">' + ODES.CLASSES.map(c => '<option>' + c + '</option>').join('') + '</select></div>' +
        '<div class="field" id="uBranchF" hidden><label for="uBranch">Branş</label><input class="input" id="uBranch"><span class="err" id="uBranchErr"></span></div></div></form>';
      modal({
        title: 'Kullanıcı ekle', html,
        onOpen: box => { $('#uRole', box).addEventListener('change', e => { const t = e.target.value === 'teacher'; $('#uClassF', box).hidden = t; $('#uBranchF', box).hidden = !t; }); },
        actions: [{ label: 'Vazgeç' }, {
          label: 'Ekle', kind: 'primary', onClick: (close, box) => {
            const name = $('#uName', box), email = $('#uEmail', box), role = $('#uRole', box).value, branch = $('#uBranch', box);
            let ok = true;
            const chk = (bad, id, inp, msg) => { $('#' + id, box).textContent = bad ? msg : ''; if (inp) { if (bad) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); } if (bad) ok = false; };
            chk(name.value.trim().length < 3, 'uNameErr', name, 'Ad soyad en az 3 karakter olmalı.');
            chk(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'uEmailErr', email, 'Geçerli bir e-posta girin.');
            if (role === 'teacher') chk(branch.value.trim().length < 2, 'uBranchErr', branch, 'Branş gerekli.');
            if (!ok) return false;
            const res = store.addUser({ name: name.value, email: email.value, role, class: $('#uClass', box).value, branch: branch.value });
            if (!res.ok) { chk(true, 'uEmailErr', email, res.error); return false; }
            if (role === 'teacher') store.approveTeacher(res.user.id, []);
            toast('Kullanıcı eklendi.', 'success'); window.dispatchEvent(new HashChangeEvent('hashchange'));
          }
        }]
      });
    }

    function approveDialog(u, after) {
      const html = '<p style="margin-bottom:14px"><b>' + esc(u.name) + '</b> (' + esc(u.branch || 'Branş belirtilmemiş') + ') hesabını onaylıyorsunuz. Öğretmenin ders vereceği sınıfları seçin:</p>' +
        '<div class="checks" id="clsChecks">' + ODES.CLASSES.map(c => '<label><input type="checkbox" value="' + c + '"> ' + c + '</label>').join('') + '</div><span class="err" id="clsErr"></span>';
      modal({
        title: 'Öğretmen hesabını onayla', html,
        actions: [{ label: 'Vazgeç' }, {
          label: 'Onayla', kind: 'primary', onClick: (close, box) => {
            const sel = $$('#clsChecks input:checked', box).map(i => i.value);
            if (!sel.length) { $('#clsErr', box).textContent = 'En az bir sınıf seçin.'; return false; }
            store.approveTeacher(u.id, sel); toast(u.name + ' onaylandı.', 'success'); after();
          }
        }]
      });
    }

    function pending(el, refresh) {
      const list = users().filter(u => u.status === 'pending');
      el.innerHTML = '<div class="card">' + (list.map(u => '<div class="li"><div class="person grow">' + avatar(u.name) + '<div><b>' + esc(u.name) + '</b><small>' + esc(u.email) + ' · ' + esc(u.branch || '') + '</small></div></div><div class="end">' +
        '<button type="button" class="btn btn-sm btn-primary" data-ap="' + esc(u.id) + '">Onayla</button><button type="button" class="btn btn-sm" data-rj="' + esc(u.id) + '">Reddet</button></div></div>').join('') || emptyState('Onay bekleyen kayıt yok.', 'shield')) + '</div>';
      $$('[data-ap]', el).forEach(b => b.addEventListener('click', () => approveDialog(store.user(b.dataset.ap), refresh)));
      $$('[data-rj]', el).forEach(b => b.addEventListener('click', async () => {
        const u = store.user(b.dataset.rj);
        const ok = await confirmDialog({ title: 'Kaydı reddet', message: u.name + ' kaydı reddedilip silinecek. Devam edilsin mi?', confirmLabel: 'Reddet', danger: true });
        if (!ok) return; store.deleteUser(u.id); toast('Kayıt reddedildi.', 'success'); refresh();
      }));
    }

    function log(el) {
      el.innerHTML = '<div class="card"><ul class="timeline">' + store.db().activity.map(a => '<li class="done"><span class="dot"></span>' + esc(a.text) + '<small>' + esc(fmtDT(a.at)) + '</small></li>').join('') + '</ul></div>';
    }

    sections(root, {
      overview: { title: 'Genel bakış', render: overview },
      users: { title: 'Kullanıcılar', sub: 'Hesapları ara, filtrele ve yönet.', render: usersSection },
      pending: { title: 'Onay bekleyenler', sub: 'Öğretmen kayıtlarını onaylayın veya reddedin.', render: pending },
      log: { title: 'Etkinlik günlüğü', render: log },
      inbox: { title: 'Gelen bildirimler', render: el => renderInbox(el, user) }
    }, 'overview');
  };
})();
