(function () {
  'use strict';
  const { $, $$, esc, icon, store, sections, statCard, emptyState, fmtDT, fmtD, relDue, statusBadge, typeBadge, avatar, renderInbox, modal, confirmDialog, toast, pct } = ODES;

  ODES.pages.teacher = function (root, user) {
    const myClasses = () => (store.user(user.id).classes || []).slice();
    const myCourses = () => store.coursesOfTeacher(user.id);
    const mySent = () => store.db().notifications.filter(n => n.senderId === user.id);
    const myAssignments = () => store.db().assignments.filter(a => a.createdBy === user.id).sort((a, b) => new Date(a.due) - new Date(b.due));

    function noClassNotice() {
      return '<div class="card">' + emptyState('Henüz size atanmış sınıf yok. Hesabınız onaylandığında sınıflar yönetici tarafından atanır.', 'users') + '</div>';
    }

    function overview(el) {
      const classes = myClasses();
      const studentCount = classes.reduce((s, c) => s + store.students(c).length, 0);
      const open = myAssignments().filter(a => new Date(a.due) >= new Date(new Date().setHours(0, 0, 0, 0)));
      const sent = mySent();
      const unread = store.inboxFor(user.id).filter(x => !x.read).length;
      el.innerHTML = '<div class="stack-v">' +
        '<div class="card hero"><div><h2>Merhaba, ' + esc(user.name.split(' ')[0]) + '</h2><p>' + esc(user.branch || 'Öğretmen') + ' · ' + classes.length + ' sınıf</p></div>' +
        '<div class="page-actions"><a class="btn btn-light" href="notification-create.html">' + icon('plus', 16) + 'Bildirim oluştur</a><a class="btn btn-light" href="#attendance">' + icon('clipboard', 16) + 'Yoklama al</a></div></div>' +
        '<div class="grid g4">' +
          statCard({ label: 'Sınıf', value: classes.length, icon: 'users', tone: 'primary', href: '#classes' }) +
          statCard({ label: 'Öğrenci', value: studentCount, icon: 'user', tone: 'info', href: '#classes' }) +
          statCard({ label: 'Açık ödev', value: open.length, icon: 'book', tone: 'warning', href: '#assignments' }) +
          statCard({ label: 'Gönderdiğim bildirim', value: sent.filter(n => n.status === 'sent').length, icon: 'send', tone: 'success', href: 'notification-history.html' }) +
        '</div>' +
        '<div class="grid g2">' +
          '<div class="card"><div class="card-h"><h3>Yaklaşan ödevler</h3><a href="#assignments">Yönet</a></div>' +
            (open.slice(0, 4).map(a => { const d = relDue(a.due); return '<div class="li"><div class="grow"><b>' + esc(a.title) + '</b><small class="muted">' + esc(a.class) + ' · ' + esc(store.courseName(a.courseId)) + '</small></div><span class="badge ' + d.cls + '">' + esc(d.text) + '</span></div>'; }).join('') || emptyState('Açık ödev yok.', 'book')) + '</div>' +
          '<div class="card"><div class="card-h"><h3>Son bildirimlerim</h3><a href="notification-history.html">Geçmiş</a></div>' +
            (sent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4).map(n => {
              const total = store.recipientCount(n), read = Object.keys(n.reads).length;
              return '<div class="li"><div class="grow"><b>' + esc(n.title) + '</b><small class="muted">' + (n.status === 'sent' ? read + '/' + total + ' okudu' : esc(store.audienceLabel(n.audience))) + '</small></div>' + statusBadge(n.status) + '</div>';
            }).join('') || emptyState('Henüz bildirim göndermediniz.', 'send')) + '</div>' +
        '</div>' + (unread ? '<div class="alert info">' + icon('bell') + '<span>' + unread + ' okunmamış bildiriminiz var. <a href="#inbox">Görüntüle</a></span></div>' : '') +
        '</div>';
    }

    function classes(el) {
      const cls = myClasses();
      if (!cls.length) { el.innerHTML = noClassNotice(); return; }
      let cur = cls[0], q = '';
      function draw() {
        const courseIds = myCourses().map(c => c.id);
        const list = store.students(cur).filter(s => s.name.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')));
        el.innerHTML = '<div class="card flush"><div class="card-h"><div class="tabs">' + cls.map(c => '<button type="button" class="tab ' + (c === cur ? 'active' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '<small>' + store.students(c).length + '</small></button>').join('') + '</div>' +
          '<div class="search" style="position:relative;min-width:220px">' + '<input class="input" id="q" type="search" placeholder="Öğrenci ara" aria-label="Öğrenci ara" value="' + esc(q) + '"></div></div>' +
          '<div class="table-wrap"><table class="table stack"><thead><tr><th>Öğrenci</th><th>Ortalama (dersim)</th><th>Devamsızlık</th><th></th></tr></thead><tbody>' +
          (list.map(s => {
            const rows = store.gradesFor(s.id).filter(r => courseIds.includes(r.course.id) && r.avg != null);
            const avg = rows.length ? Math.round(rows.reduce((t, r) => t + r.avg, 0) / rows.length * 10) / 10 : null;
            const abs = store.absences(s.id);
            return '<tr><td data-label="Öğrenci"><div class="person">' + avatar(s.name, 'sm') + '<div><b>' + esc(s.name) + '</b><small>' + esc(s.email) + '</small></div></div></td>' +
              '<td data-label="Ortalama"><span class="badge ' + (avg == null ? 'b-neutral' : avg >= 70 ? 'b-success' : 'b-warning') + '">' + (avg == null ? '—' : avg) + '</span></td>' +
              '<td data-label="Devamsızlık"><span class="badge ' + (abs > 1 ? 'b-danger' : 'b-neutral') + '">' + abs + ' gün</span></td>' +
              '<td class="actions"><a class="btn btn-sm" href="notification-create.html?user=' + esc(s.id) + '">' + icon('send', 14) + 'Mesaj gönder</a></td></tr>';
          }).join('') || '<tr><td colspan="4">' + emptyState('Öğrenci bulunamadı.', 'search') + '</td></tr>') +
          '</tbody></table></div></div>';
        $$('[data-c]', el).forEach(b => b.addEventListener('click', () => { cur = b.dataset.c; draw(); }));
        const qi = $('#q', el);
        qi.addEventListener('input', () => { q = qi.value; const pos = qi.selectionStart; draw(); const n = $('#q', el); n.focus(); n.setSelectionRange(pos, pos); });
      }
      draw();
    }

    function attendance(el) {
      const cls = myClasses();
      if (!cls.length) { el.innerHTML = noClassNotice(); return; }
      let cur = cls[0];
      let date = store.dateKey();
      let rec = {};
      function load() {
        const students = store.students(cur);
        const saved = store.getAttendance(date, cur);
        rec = {};
        students.forEach(s => { rec[s.id] = saved[s.id] || 'present'; });
      }
      function draw() {
        const students = store.students(cur);
        const absent = students.filter(s => rec[s.id] === 'absent').length;
        const saved = store.hasAttendance(date, cur);
        el.innerHTML = '<div class="card"><div class="toolbar"><div class="filters">' +
          '<select class="select" id="selC" aria-label="Sınıf">' + cls.map(c => '<option ' + (c === cur ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select>' +
          '<input class="input" type="date" id="selD" max="' + store.dateKey() + '" value="' + date + '" aria-label="Tarih" style="width:auto"></div>' +
          '<div><span class="badge b-success">Var: ' + (students.length - absent) + '</span> <span class="badge b-danger">Yok: ' + absent + '</span> ' + (saved ? '<span class="badge b-info">Kayıtlı</span>' : '<span class="badge b-neutral">Kaydedilmedi</span>') + '</div></div>' +
          (students.length ? '<div class="list">' + students.map(s => '<div class="li"><div class="person grow">' + avatar(s.name, 'sm') + '<b>' + esc(s.name) + '</b></div><div class="seg" role="group" aria-label="' + esc(s.name) + ' yoklama">' +
            '<button type="button" data-s="' + esc(s.id) + '" data-v="present" class="' + (rec[s.id] === 'present' ? 'on-ok' : '') + '" aria-pressed="' + (rec[s.id] === 'present') + '">Var</button>' +
            '<button type="button" data-s="' + esc(s.id) + '" data-v="absent" class="' + (rec[s.id] === 'absent' ? 'on-no' : '') + '" aria-pressed="' + (rec[s.id] === 'absent') + '">Yok</button></div></div>').join('') + '</div>' : emptyState('Bu sınıfta öğrenci yok.')) +
          '<div class="modal-f" style="padding:16px 0 0;border:0"><button class="btn" type="button" id="allP">Hepsini var işaretle</button><button class="btn btn-primary" type="button" id="saveA"' + (students.length ? '' : ' disabled') + '>' + icon('check', 16) + 'Yoklamayı kaydet</button></div></div>';
        $('#selC', el).addEventListener('change', e => { cur = e.target.value; load(); draw(); });
        $('#selD', el).addEventListener('change', e => { if (e.target.value) { date = e.target.value; load(); draw(); } });
        $$('[data-s]', el).forEach(b => b.addEventListener('click', () => { rec[b.dataset.s] = b.dataset.v; draw(); }));
        $('#allP', el).addEventListener('click', () => { Object.keys(rec).forEach(k => { rec[k] = 'present'; }); draw(); });
        $('#saveA', el).addEventListener('click', () => {
          store.setAttendance(date, cur, Object.assign({}, rec));
          store.log(user.name + ' ' + cur + ' sınıfı için ' + date + ' yoklamasını kaydetti.');
          toast('Yoklama kaydedildi.', 'success'); draw();
        });
      }
      load(); draw();
    }

    function assignments(el, refresh) {
      const cls = myClasses();
      function draw() {
        const list = myAssignments();
        el.innerHTML = '<div class="card flush"><div class="card-h"><h3>Verdiğim ödevler</h3><button class="btn btn-primary btn-sm" type="button" id="newA"' + (cls.length && myCourses().length ? '' : ' disabled') + '>' + icon('plus', 14) + 'Yeni ödev</button></div>' +
          '<div class="table-wrap"><table class="table stack"><thead><tr><th>Ödev</th><th>Sınıf</th><th>Teslim</th><th>Tamamlayan</th><th></th></tr></thead><tbody>' +
          (list.map(a => {
            const total = store.students(a.class).length, done = Object.keys(a.done || {}).filter(id => { const u = store.user(id); return u && u.status === 'active' && u.class === a.class; }).length;
            const d = relDue(a.due);
            return '<tr><td data-label="Ödev"><b>' + esc(a.title) + '</b><br><small class="muted">' + esc(store.courseName(a.courseId)) + '</small></td><td data-label="Sınıf">' + esc(a.class) + '</td>' +
              '<td data-label="Teslim">' + esc(fmtD(a.due)) + ' <span class="badge ' + d.cls + '">' + esc(d.text) + '</span></td>' +
              '<td data-label="Tamamlayan"><div class="prog-cell"><div class="progress"><i style="width:' + pct(done, total) + '%"></i></div><span>' + done + '/' + total + '</span></div></td>' +
              '<td class="actions"><button type="button" class="btn btn-sm btn-ghost" data-del="' + esc(a.id) + '" aria-label="' + esc(a.title) + ' ödevini sil">' + icon('trash', 14) + '</button></td></tr>';
          }).join('') || '<tr><td colspan="5">' + emptyState('Henüz ödev eklemediniz.', 'book') + '</td></tr>') + '</tbody></table></div></div>';
        const nb = $('#newA', el); if (nb) nb.addEventListener('click', openForm);
        $$('[data-del]', el).forEach(b => b.addEventListener('click', async () => {
          const ok = await confirmDialog({ title: 'Ödevi sil', message: 'Bu ödev öğrencilerin listesinden de kaldırılır. Devam edilsin mi?', confirmLabel: 'Sil', danger: true });
          if (!ok) return;
          const d = store.db(); d.assignments = d.assignments.filter(x => x.id !== b.dataset.del); store.save(); toast('Ödev silindi.', 'success'); draw();
        }));
      }
      function openForm() {
        const courses = myCourses();
        const minDate = store.dateKey();
        const html = '<form id="aForm" novalidate>' +
          '<div class="field"><label for="aTitle">Ödev başlığı</label><input class="input" id="aTitle" maxlength="80"><span class="err" id="aTitleErr"></span></div>' +
          '<div class="row"><div class="field"><label for="aCourse">Ders</label><select class="select" id="aCourse">' + courses.map(c => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('') + '</select></div>' +
          '<div class="field"><label for="aClass">Sınıf</label><select class="select" id="aClass">' + cls.map(c => '<option>' + esc(c) + '</option>').join('') + '</select></div></div>' +
          '<div class="field"><label for="aDue">Teslim tarihi</label><input class="input" type="date" id="aDue" min="' + minDate + '"><span class="err" id="aDueErr"></span></div>' +
          '<label class="check-row"><input type="checkbox" id="aNotify" checked><span>Sınıfa bildirim gönder</span></label></form>';
        modal({
          title: 'Yeni ödev', html,
          actions: [{ label: 'Vazgeç' }, {
            label: 'Ödevi ekle', kind: 'primary',
            onClick: (close, box) => {
              const t = $('#aTitle', box), due = $('#aDue', box);
              let ok = true;
              if (t.value.trim().length < 3) { $('#aTitleErr', box).textContent = 'Başlık en az 3 karakter olmalı.'; t.setAttribute('aria-invalid', 'true'); ok = false; } else { $('#aTitleErr', box).textContent = ''; t.removeAttribute('aria-invalid'); }
              if (!due.value || due.value < minDate) { $('#aDueErr', box).textContent = 'Bugün veya sonrası bir tarih seçin.'; due.setAttribute('aria-invalid', 'true'); ok = false; } else { $('#aDueErr', box).textContent = ''; due.removeAttribute('aria-invalid'); }
              if (!ok) return false;
              const courseId = $('#aCourse', box).value, klass = $('#aClass', box).value;
              const dueDate = new Date(due.value + 'T23:59:00');
              store.db().assignments.push({ id: store.uid('as'), title: t.value.trim(), courseId, class: klass, due: dueDate.toISOString(), createdBy: user.id, done: {} });
              store.save();
              if ($('#aNotify', box).checked) {
                const n = store.createNotification({ title: 'Yeni ödev: ' + t.value.trim(), body: store.courseName(courseId) + ' dersi için yeni ödev eklendi. Teslim tarihi: ' + fmtD(dueDate.toISOString()) + '.', type: 'odev', audience: { kind: 'class', value: klass }, senderId: user.id });
                store.sendNow(n);
              }
              toast('Ödev eklendi.', 'success'); draw();
            }
          }]
        });
      }
      if (!cls.length) { el.innerHTML = noClassNotice(); return; }
      draw();
    }

    sections(root, {
      overview: { title: 'Genel bakış', render: overview },
      classes: { title: 'Sınıflarım', render: classes },
      attendance: { title: 'Yoklama', sub: 'Sınıf ve tarih seçip yoklamayı kaydedin.', render: attendance },
      assignments: { title: 'Ödevler', render: assignments },
      inbox: { title: 'Gelen bildirimler', render: (el) => renderInbox(el, user) }
    }, 'overview');
  };
})();
