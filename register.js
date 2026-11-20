(function () {
  'use strict';
  const { $, esc, icon, store, homeOf } = ODES;

  ODES.pages.register = function () {
    $('#logoIc').innerHTML = icon('school', 22);
    $('#warnIc').innerHTML = icon('info', 18);

    const cls = $('#class');
    cls.innerHTML = '<option value="">Seçin</option>' + ODES.CLASSES.map(c => '<option value="' + c + '">' + c + '</option>').join('');

    const role = $('#role');
    role.addEventListener('change', () => {
      const t = role.value === 'teacher';
      $('#classField').hidden = t;
      $('#branchField').hidden = !t;
    });

    // Şifre gücü göstergesi (yalnızca istemci tarafı görsel geri bildirim)
    const pass = $('#password');
    function strength(v) {
      let s = 0;
      if (v.length >= 8) s++;
      if (/[a-zçğıöşü]/i.test(v) && /\d/.test(v)) s++;
      if (/[A-ZÇĞİÖŞÜ]/.test(v) && /[a-zçğıöşü]/.test(v)) s++;
      if (/[^\w\s]/.test(v) || v.length >= 12) s++;
      return s;
    }
    pass.addEventListener('input', () => {
      const s = strength(pass.value);
      const bar = $('#meterBar');
      bar.style.width = (s * 25) + '%';
      bar.style.background = ['#dc2626', '#dc2626', '#d97706', '#059669', '#047857'][s];
      $('#meterTxt').textContent = pass.value ? ['Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][s] : 'En az 8 karakter; harf ve rakam içermeli.';
    });

    function setErr(id, input, msg) {
      $('#' + id).textContent = msg || '';
      if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
    }

    $('#regForm').addEventListener('submit', e => {
      e.preventDefault();
      $('#formAlert').innerHTML = '';
      const name = $('#name'), email = $('#email'), p2 = $('#password2'), terms = $('#terms'), branch = $('#branch');
      let ok = true;
      const check = (cond, id, input, msg) => { if (cond) { setErr(id, input, msg); ok = false; } else setErr(id, input, ''); };

      check(name.value.trim().length < 3, 'nameErr', name, 'Ad soyad en az 3 karakter olmalı.');
      const em = email.value.trim();
      check(!em, 'emailErr', email, 'E-posta adresi gerekli.');
      if (em) check(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em), 'emailErr', email, 'Geçerli bir e-posta adresi girin.');
      if (role.value === 'student') check(!cls.value, 'classErr', cls, 'Sınıf seçin.');
      else check(branch.value.trim().length < 2, 'branchErr', branch, 'Branşınızı yazın.');
      check(pass.value.length < 8 || !/\d/.test(pass.value) || !/[a-zçğıöşü]/i.test(pass.value), 'passErr', pass, 'Şifre en az 8 karakter olmalı ve harf ile rakam içermeli.');
      check(p2.value !== pass.value, 'pass2Err', p2, 'Şifreler eşleşmiyor.');
      check(!terms.checked, 'termsErr', null, 'Devam etmek için koşulları kabul etmelisiniz.');
      if (!ok) { const bad = document.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }

      const res = store.register({ name: name.value, email: em, role: role.value, class: cls.value, branch: branch.value });
      if (!res.ok) { $('#formAlert').innerHTML = '<div class="alert err">' + esc(res.error) + '</div>'; setErr('emailErr', email, res.error); return; }

      $('#formWrap').hidden = true;
      const done = $('#doneWrap');
      done.hidden = false;
      if (res.user.status === 'pending') {
        done.innerHTML = '<h1>Kaydınız alındı</h1><div class="alert info" style="margin-top:16px">' + icon('info') + '<span><b>' + esc(res.user.name) + '</b>, öğretmen hesabınız yönetici onayına gönderildi. Onaylanana kadar giriş yapamazsınız. Demoda bu adımı yönetici hesabıyla <i>Onay bekleyenler</i> ekranından deneyebilirsiniz.</span></div><a class="btn btn-primary btn-block" href="login.html">Giriş ekranına dön</a>';
      } else {
        done.innerHTML = '<h1>Hesabınız oluşturuldu</h1><div class="alert ok" style="margin-top:16px">' + icon('check') + '<span>Hoş geldiniz, <b>' + esc(res.user.name) + '</b>. Demo hesabınız hazır.</span></div><button class="btn btn-primary btn-block" id="goPanel" type="button">Panele git</button>';
        $('#goPanel').addEventListener('click', () => { store.setSession(res.user.id); location.href = homeOf(res.user.role); });
      }
    });
  };
})();
