
(function () {
  'use strict';

  const { $, $$, esc, icon, store, homeOf } = ODES;

  ODES.pages.login = function () {
    const existing = store.currentUser();

    if (existing && existing.status === 'active') {
      location.replace(homeOf(existing.role));
      return;
    }

    // ODES güvenlik logosu
    $('#logoIc').innerHTML = icon('shield-check', 24);
    $('#warnIc').innerHTML = icon('info', 18);

    const form = $('#loginForm');
    const alertBox = $('#formAlert');
    const togglePassword = $('#togglePassword');

    // Şifreyi göster / gizle
    if (togglePassword) {
      togglePassword.addEventListener('click', () => {
        const pass = $('#password');
        const reveal = pass.type === 'password';

        pass.type = reveal ? 'text' : 'password';
        togglePassword.textContent = reveal ? 'Gizle' : 'Göster';

        togglePassword.setAttribute(
          'aria-label',
          reveal ? 'Şifreyi gizle' : 'Şifreyi göster'
        );
      });
    }

    // Başka sayfadan gelen mesajları göster
    try {
      const raw = sessionStorage.getItem('odes.flash');

      if (raw) {
        sessionStorage.removeItem('odes.flash');

        const f = JSON.parse(raw);

        alertBox.innerHTML =
          '<div class="alert ' +
          (f.type === 'error' ? 'err' : 'ok') +
          '">' +
          esc(f.msg) +
          '</div>';
      }
    } catch (e) {
      // Geçersiz mesaj verisini yoksay
    }

    // Alan hata mesajları
    function setErr(id, input, msg) {
      $('#' + id).textContent = msg || '';

      if (msg) {
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.removeAttribute('aria-invalid');
      }
    }

    // Giriş işlemi
    function attempt(email) {
      const res = store.login(email);

      if (!res.ok) {
        alertBox.innerHTML =
          '<div class="alert err">' +
          esc(res.error) +
          '</div>';

        return;
      }

      location.href = homeOf(res.user.role);
    }

    // Form gönderimi
    form.addEventListener('submit', e => {
      e.preventDefault();

      alertBox.innerHTML = '';

      const email = $('#email');
      const pass = $('#password');

      let ok = true;

      if (!email.value.trim()) {
        setErr('emailErr', email, 'E-posta adresi gerekli.');
        ok = false;
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
      ) {
        setErr('emailErr', email, 'Geçerli bir e-posta adresi girin.');
        ok = false;
      } else {
        setErr('emailErr', email, '');
      }

      if (!pass.value) {
        setErr('passErr', pass, 'Şifre gerekli.');
        ok = false;
      } else {
        setErr('passErr', pass, '');
      }

      if (!ok) return;

      attempt(email.value);
    });

    // Hızlı demo girişleri
    $$('[data-demo]').forEach(button => {
      button.addEventListener('click', () => {
        $('#email').value = button.dataset.demo;
        $('#password').value = 'demo';

        alertBox.innerHTML = '';

        attempt(button.dataset.demo);
      });
    });
  };
})();
