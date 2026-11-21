
(function () {
  'use strict';

  const { $, esc, icon, store, homeOf } = ODES;

  ODES.pages.register = function () {
    $('#logoIc').innerHTML = icon('school', 22);
    $('#warnIc').innerHTML = icon('info', 18);

    const role = $('#role');
    const grade = $('#grade');
    const classBranch = $('#classBranch');
    const branch = $('#branch');
    const pass = $('#password');

    const GRADES = ['9', '10', '11', '12'];
    const BRANCHES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    ODES.CLASSES = GRADES.flatMap(g =>
      BRANCHES.map(b => `${g}-${b}`)
    );

    // Öğrenci ve öğretmen alanlarını yönet.
    function updateRoleFields() {
      const isTeacher = role.value === 'teacher';

      $('#studentClassFields').hidden = isTeacher;
      $('#branchField').hidden = !isTeacher;

      if (isTeacher) {
        grade.value = '';
        classBranch.value = '';
        branch.value = '';
      }
    }

    role.addEventListener('change', updateRoleFields);

    // Şifre gücünü hesapla.
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

      $('#meterBar').style.width = (s * 25) + '%';

      $('#meterBar').style.background =
        ['#dc2626', '#dc2626', '#d97706', '#059669', '#047857'][s];

      $('#meterTxt').textContent = pass.value
        ? ['Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü'][s]
        : 'En az 8 karakter; harf ve rakam içermeli.';
    });

    // Hata mesajlarını yönet.
    function setErr(id, input, msg) {
      $('#' + id).textContent = msg || '';

      if (input) {
        if (msg) {
          input.setAttribute('aria-invalid', 'true');
        } else {
          input.removeAttribute('aria-invalid');
        }
      }
    }

    // Kayıt formu.
    $('#regForm').addEventListener('submit', e => {
      e.preventDefault();

      $('#formAlert').innerHTML = '';

      const name = $('#name');
      const email = $('#email');
      const p2 = $('#password2');
      const terms = $('#terms');

      let ok = true;

      const check = (cond, id, input, msg) => {
        if (cond) {
          setErr(id, input, msg);
          ok = false;
        } else {
          setErr(id, input, '');
        }
      };

      // Ad soyad kontrolü.
      check(
        name.value.trim().length < 3,
        'nameErr',
        name,
        'Ad soyad en az 3 karakter olmalı.'
      );

      // E-posta kontrolü.
      const em = email.value.trim();

      check(
        !em,
        'emailErr',
        email,
        'E-posta adresi gerekli.'
      );

      if (em) {
        check(
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em),
          'emailErr',
          email,
          'Geçerli bir e-posta adresi girin.'
        );
      }

      // Öğrenci veya öğretmen bilgileri.
      let selectedClass = '';

      if (role.value === 'student') {
        check(
          !grade.value,
          'gradeErr',
          grade,
          'Sınıf seçin.'
        );

        check(
          !classBranch.value,
          'classErr',
          classBranch,
          'Şube seçin.'
        );

        if (grade.value && classBranch.value) {
          selectedClass = `${grade.value}-${classBranch.value}`;
        }
      } else {
        check(
          branch.value.trim().length < 2,
          'branchErr',
          branch,
          'Branşınızı yazın.'
        );
      }

      // Şifre kontrolü.
      check(
        pass.value.length < 8 ||
        !/\d/.test(pass.value) ||
        !/[a-zçğıöşü]/i.test(pass.value),
        'passErr',
        pass,
        'Şifre en az 8 karakter olmalı ve harf ile rakam içermeli.'
      );

      // Şifre tekrar kontrolü.
      check(
        p2.value !== pass.value,
        'pass2Err',
        p2,
        'Şifreler eşleşmiyor.'
      );

      // Kullanım koşulları.
      check(
        !terms.checked,
        'termsErr',
        null,
        'Devam etmek için koşulları kabul etmelisiniz.'
      );

      // Hata varsa kayıt işlemini durdur.
      if (!ok) {
        const bad = document.querySelector('[aria-invalid="true"]');

        if (bad) bad.focus();

        return;
      }

      // Kullanıcıyı kaydet.
      const res = store.register({
        name: name.value.trim(),
        email: em,
        role: role.value,
        class: selectedClass,
        branch: branch.value.trim()
      });

      // Kayıt hatası.
      if (!res.ok) {
        $('#formAlert').innerHTML =
          '<div class="alert err">' + esc(res.error) + '</div>';

        setErr('emailErr', email, res.error);

        return;
      }

      // Formu gizle.
      $('#formWrap').hidden = true;

      const done = $('#doneWrap');

      done.hidden = false;

      // Öğretmen hesabı: yönetici onayı bekler.
      if (res.user.status === 'pending') {
        done.innerHTML =
          '<h1>Kaydınız alındı</h1>' +
          '<div class="alert info" style="margin-top:16px">' +
          icon('info') +
          '<span><b>' + esc(res.user.name) +
          '</b>, öğretmen hesabınız yönetici onayına gönderildi. ' +
          'Onaylanana kadar giriş yapamazsınız.</span></div>' +
          '<a class="btn btn-primary btn-block" href="login.html">' +
          'Giriş ekranına dön</a>';

      } else {
        // Öğrenci hesabı: doğrudan panele geçebilir.
        done.innerHTML =
          '<h1>Hesabınız oluşturuldu</h1>' +
          '<div class="alert ok" style="margin-top:16px">' +
          icon('check') +
          '<span>Hoş geldiniz, <b>' + esc(res.user.name) +
          '</b>. Demo hesabınız hazır.</span></div>' +
          '<button class="btn btn-primary btn-block" id="goPanel" ' +
          'type="button">Panele git</button>';

        $('#goPanel').addEventListener('click', () => {
          store.setSession(res.user.id);
          location.href = homeOf(res.user.role);
        });
      }
    });

    // İlk açılışta hesap türüne göre alanları göster.
    updateRoleFields();
  };
})();
