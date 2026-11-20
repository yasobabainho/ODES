(function () {
  'use strict';
  const { $, $$, esc, icon, store, homeOf } = ODES;

  ODES.pages.login = function () {
    const existing = store.currentUser();
    if (existing && existing.status === 'active') { location.replace(homeOf(existing.role)); return; }

    $('#logoIc').innerHTML = icon('school', 22);
    $('#warnIc').innerHTML = icon('info', 18);

    const form = $('#loginForm');
    const alertBox = $('#formAlert');

    // Başka sayfadan gelen mesaj (ör. hesap pasife alındı)
    try {
      const raw = sessionStorage.getItem('odes.flash');
      if (raw) {
        sessionStorage.removeItem('odes.flash');
        const f = JSON.parse(raw);
        alertBox.innerHTML = '<div class="alert ' + (f.type === 'error' ? 'err' : 'ok') + '">' + esc(f.msg) + '</div>';
      }
    } catch (e) { /* yoksay */ }

    function setErr(id, input, msg) {
      $('#' + id).textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }

    function attempt(email) {
      const res = store.login(email);
      if (!res.ok) {
        alertBox.innerHTML = '<div class="alert err">' + esc(res.error) + '</div>';
        return;
      }
      location.href = homeOf(res.user.role);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      alertBox.innerHTML = '';
      const email = $('#email'), pass = $('#password');
      let ok = true;
      if (!email.value.trim()) { setErr('emailErr', email, 'E-posta adresi gerekli.'); ok = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setErr('emailErr', email, 'Geçerli bir e-posta adresi girin.'); ok = false; }
      else setErr('emailErr', email, '');
      if (!pass.value) { setErr('passErr', pass, 'Şifre gerekli.'); ok = false; } else setErr('passErr', pass, '');
      if (!ok) return;
      attempt(email.value);
    });

    $$('[data-demo]').forEach(b => b.addEventListener('click', () => {
      $('#email').value = b.dataset.demo;
      $('#password').value = 'demo';
      alertBox.innerHTML = '';
      attempt(b.dataset.demo);
    }));
  };
})();
