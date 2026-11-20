(function () {
  'use strict';
  const { $, $$, esc, icon, store, typeBadge, toast, flash } = ODES;

  const TEMPLATES = [
    { label: 'Ödev hatırlatma', type: 'odev', title: 'Ödev teslim hatırlatması', body: 'Ödevinizin teslim tarihi yaklaşmaktadır. Lütfen zamanında teslim ediniz.' },
    { label: 'Sınav duyurusu', type: 'sinav', title: 'Sınav duyurusu', body: 'Sınav tarihi ve kapsamı aşağıdaki gibidir. Hazırlıklı gelmeniz önemle rica olunur.' },
    { label: 'Genel duyuru', type: 'duyuru', title: 'Genel duyuru', body: 'Okulumuzla ilgili önemli bir duyuru paylaşılmıştır.' },
    { label: 'Acil bilgilendirme', type: 'acil', title: 'Acil bilgilendirme', body: 'Lütfen bu bildirimi dikkatle okuyunuz.' }
  ];

  ODES.pages['notification-create'] = function (root, user) {
    const isAdmin = user.role === 'admin';
    const me = store.user(user.id);
    const myClasses = isAdmin ? ODES.CLASSES : (me.classes || []);
    const myStudents = isAdmin ? store.students() : store.students().filter(s => myClasses.includes(s.class));

    const params = new URLSearchParams(location.search);
    let src = null, editing = false;
    if (params.get('edit')) {
      const n = store.notification(params.get('edit'));
      if (n && n.status === 'draft' && (isAdmin || n.senderId === user.id)) { src = n; editing = true; } else toast('Düzenlenecek taslak bulunamadı.', 'error');
    } else if (params.get('dup')) {
      const n = store.notification(params.get('dup'));
      if (n && (isAdmin || n.senderId === user.id)) src = n;
    }
    const preUser = params.get('user');

    const kinds = isAdmin
      ? [['all', 'Herkes (aktif kullanıcılar)'], ['students', 'Tüm öğrenciler'], ['teachers', 'Tüm öğretmenler'], ['class', 'Belirli bir sınıf'], ['user', 'Tek bir kişi']]
      : [['myclasses', 'Sınıflarımdaki tüm öğrenciler'], ['class', 'Belirli bir sınıfım'], ['user', 'Tek bir öğrenci']];

    const initial = {
      title: src ? (editing ? src.title : src.title + ' (kopya)') : '',
      body: src ? src.body : '',
      type: src ? src.type : 'duyuru',
      kind: src ? (src.audience.kind === 'users' ? 'students' : src.audience.kind) : (preUser ? 'user' : kinds[0][0]),
      value: src ? (typeof src.audience.value === 'string' ? src.audience.value : '') : (preUser || '')
    };
    if (!kinds.some(k => k[0] === initial.kind)) initial.kind = kinds[0][0];

    root.innerHTML =
      '<div class="page"><div class="page-head"><div><h1>' + (editing ? 'Taslağı düzenle' : 'Bildirim oluştur') + '</h1><p class="muted">Mesajı yazın, hedef kitleyi seçin; hemen gönderin, zamanlayın ya da taslak olarak saklayın.</p></div></div>' +
      '<div class="split"><form class="card" id="nForm" novalidate>' +
        '<div class="chips" aria-label="Hazır şablonlar">' + TEMPLATES.map((t, i) => '<button type="button" class="chip" data-tpl="' + i + '">' + esc(t.label) + '</button>').join('') + '</div>' +
        '<div class="field"><label for="title">Başlık</label><input class="input" id="title" maxlength="80" autocomplete="off" value="' + esc(initial.title) + '"><div class="counter"><span id="titleC">0</span>/80</div><span class="err" id="titleErr"></span></div>' +
        '<div class="field"><label for="body">Mesaj</label><textarea class="textarea" id="body" maxlength="500">' + esc(initial.body) + '</textarea><div class="counter"><span id="bodyC">0</span>/500</div><span class="err" id="bodyErr"></span></div>' +
        '<div class="row"><div class="field"><label for="type">Tür</label><select class="select" id="type">' + Object.keys(ODES.TYPES).map(k => '<option value="' + k + '"' + (k === initial.type ? ' selected' : '') + '>' + esc(ODES.TYPES[k]) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label for="kind">Hedef kitle</label><select class="select" id="kind">' + kinds.map(k => '<option value="' + k[0] + '"' + (k[0] === initial.kind ? ' selected' : '') + '>' + esc(k[1]) + '</option>').join('') + '</select></div></div>' +
        '<div class="field" id="valueF" hidden><label for="value" id="valueL">Seçim</label><select class="select" id="value"></select><span class="err" id="valueErr"></span></div>' +
        '<div class="field"><span class="lbl">Gönderim zamanı</span><div class="radio-cards" role="radiogroup" aria-label="Gönderim zamanı">' +
          '<label class="radio-card"><input type="radio" name="when" value="now" checked><span><b>Hemen gönder</b><br><small class="muted">Alıcılar anında görür.</small></span></label>' +
          '<label class="radio-card"><input type="radio" name="when" value="later"><span><b>Zamanla</b><br><small class="muted">Seçtiğiniz tarih ve saatte gönderilir.</small></span></label></div></div>' +
        '<div class="field" id="whenF" hidden><label for="when">Tarih ve saat</label><input class="input" type="datetime-local" id="whenInput"><span class="err" id="whenErr"></span></div>' +
        '<div class="page-actions" style="justify-content:flex-end"><a class="btn btn-ghost" href="notification-history.html">Vazgeç</a><button type="button" class="btn" id="saveDraft">' + icon('edit', 16) + 'Taslak kaydet</button><button type="button" class="btn btn-primary" id="submitBtn">' + icon('send', 16) + '<span id="submitLbl">Gönder</span></button></div>' +
      '</form>' +
      '<aside class="card sticky" aria-label="Önizleme"><div class="card-h"><h3>Önizleme</h3></div><div class="preview"><div id="pvType"></div><h3 id="pvTitle"></h3><p id="pvBody"></p><hr style="border:0;border-top:1px solid var(--border);margin:14px 0"><small class="muted" id="pvMeta"></small></div>' +
      '<p class="muted small" style="margin-top:12px">Demo: bildirimler gerçek e-posta/SMS/push olarak iletilmez; yalnızca bu uygulamadaki gelen kutularında görünür.</p></aside></div></div>';

    const f = { title: $('#title'), body: $('#body'), type: $('#type'), kind: $('#kind'), value: $('#value'), whenInput: $('#whenInput') };
    const when = () => ($$('input[name="when"]').find(r => r.checked) || {}).value || 'now';

    function fillValue() {
      const k = f.kind.value;
      const wrap = $('#valueF');
      if (k === 'class') {
        wrap.hidden = false; $('#valueL').textContent = 'Sınıf';
        f.value.innerHTML = '<option value="">Seçin</option>' + myClasses.map(c => '<option value="' + esc(c) + '">' + esc(c) + '</option>').join('');
      } else if (k === 'user') {
        wrap.hidden = false; $('#valueL').textContent = isAdmin ? 'Kişi' : 'Öğrenci';
        const pool = isAdmin ? store.db().users.filter(u => u.status === 'active' && u.id !== user.id) : myStudents;
        f.value.innerHTML = '<option value="">Seçin</option>' + pool.map(u => '<option value="' + esc(u.id) + '">' + esc(u.name) + ' (' + esc(u.role === 'student' ? u.class : ODES.ROLES[u.role]) + ')</option>').join('');
      } else { wrap.hidden = true; f.value.innerHTML = ''; }
      if (initial.value && [...f.value.options].some(o => o.value === initial.value)) f.value.value = initial.value;
    }

    const audience = () => {
      const k = f.kind.value;
      return (k === 'class' || k === 'user') ? { kind: k, value: f.value.value } : { kind: k };
    };

    function preview() {
      $('#titleC').textContent = f.title.value.length; $('#bodyC').textContent = f.body.value.length;
      $('#pvType').innerHTML = typeBadge(f.type.value);
      $('#pvTitle').textContent = f.title.value.trim() || 'Başlık burada görünecek';
      $('#pvBody').textContent = f.body.value.trim() || 'Mesaj metni burada görünecek.';
      const a = audience();
      const needs = (a.kind === 'class' || a.kind === 'user') && !a.value;
      const ids = needs ? [] : store.recipients(a, user.id);
      const names = ids.slice(0, 3).map(id => (store.user(id) || {}).name).filter(Boolean);
      $('#pvMeta').textContent = needs ? 'Alıcı seçimi bekleniyor.' : 'Alıcı: ' + ids.length + ' kişi' + (names.length ? ' (' + names.join(', ') + (ids.length > 3 ? ' +' + (ids.length - 3) : '') + ')' : '');
      $('#submitLbl').textContent = when() === 'later' ? 'Zamanla' : 'Gönder';
      $('#whenF').hidden = when() !== 'later';
    }

    function setErr(id, inp, msg) { $('#' + id).textContent = msg || ''; if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); } }

    function validate(forDraft) {
      let ok = true;
      const t = f.title.value.trim(), b = f.body.value.trim();
      if (t.length < 3) { setErr('titleErr', f.title, 'Başlık en az 3 karakter olmalı.'); ok = false; } else setErr('titleErr', f.title, '');
      if (forDraft) { setErr('bodyErr', f.body, ''); }
      else if (b.length < 5) { setErr('bodyErr', f.body, 'Mesaj en az 5 karakter olmalı.'); ok = false; } else setErr('bodyErr', f.body, '');
      const a = audience();
      if (!forDraft) {
        if ((a.kind === 'class' || a.kind === 'user') && !a.value) { setErr('valueErr', f.value, 'Lütfen bir seçim yapın.'); ok = false; }
        else {
          setErr('valueErr', f.value, '');
          // İstemci tarafı kapsam kontrolü (gerçek yetkilendirme sunucuda yapılmalıdır)
          if (!isAdmin) {
            if (a.kind === 'class' && !myClasses.includes(a.value)) { setErr('valueErr', f.value, 'Yalnızca kendi sınıflarınıza gönderebilirsiniz.'); ok = false; }
            if (a.kind === 'user' && !myStudents.some(s => s.id === a.value)) { setErr('valueErr', f.value, 'Yalnızca kendi öğrencilerinize gönderebilirsiniz.'); ok = false; }
          }
          if (ok && store.recipients(a, user.id).length === 0) { setErr('valueErr', f.value.parentNode.hidden ? null : f.value, 'Seçilen hedef kitlede alıcı bulunamadı.'); if (f.value.parentNode.hidden) toast('Seçilen hedef kitlede alıcı bulunamadı.', 'error'); ok = false; }
        }
        if (when() === 'later') {
          const v = f.whenInput.value;
          if (!v) { setErr('whenErr', f.whenInput, 'Gönderim tarihi ve saati seçin.'); ok = false; }
          else if (new Date(v).getTime() < Date.now() + 60000) { setErr('whenErr', f.whenInput, 'Zaman, şu andan en az 1 dakika sonrası olmalı.'); ok = false; }
          else setErr('whenErr', f.whenInput, '');
        }
      }
      if (!ok) { const bad = $('[aria-invalid="true"]'); if (bad) bad.focus(); }
      return ok;
    }

    function persist(mode) {
      const data = { title: f.title.value.trim(), body: f.body.value.trim(), type: f.type.value, audience: audience(), senderId: user.id };
      let n;
      if (editing) { n = src; Object.assign(n, data); store.save(); } else { n = store.createNotification(data); }
      if (mode === 'draft') { n.status = 'draft'; n.scheduledAt = null; store.save(); flash('Taslak kaydedildi.'); }
      else if (when() === 'later') { n.status = 'scheduled'; n.scheduledAt = new Date(f.whenInput.value).toISOString(); store.save(); store.log(user.name + ' "' + n.title + '" bildirimini zamanladı.'); flash('Bildirim ' + ODES.fmtDT(n.scheduledAt) + ' için zamanlandı.'); }
      else { store.sendNow(n); flash('Bildirim gönderildi: ' + n.recipients.length + ' alıcı.'); }
      location.href = 'notification-history.html';
    }

    $$('[data-tpl]').forEach(b => b.addEventListener('click', () => {
      const t = TEMPLATES[Number(b.dataset.tpl)];
      f.title.value = t.title; f.body.value = t.body; f.type.value = t.type; preview();
    }));
    ['input', 'change'].forEach(ev => root.addEventListener(ev, e => { if (e.target === f.kind) { initial.value = ''; fillValue(); } preview(); }));
    $('#saveDraft').addEventListener('click', () => { if (validate(true)) persist('draft'); });
    $('#submitBtn').addEventListener('click', () => { if (validate(false)) persist('send'); });
    $('#nForm').addEventListener('submit', e => e.preventDefault());

    if (src && src.status === 'scheduled') { /* düzenleme yalnızca taslaklarda */ }
    const minDT = new Date(Date.now() + 60000); minDT.setSeconds(0, 0);
    f.whenInput.min = new Date(minDT.getTime() - minDT.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    fillValue(); preview();
  };
})();
