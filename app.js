
/* ODES demo prototipi - ortak çekirdek:
   kabuk, menü, modal, toast, gelen kutusu, grafikler */

(function (global) {
  'use strict';

  const ODES = global.ODES;
  const store = ODES.store;
  ODES.pages = {};

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  /* ---------- Biçimleme ---------- */

  const fmtDT = iso => iso
    ? new Date(iso).toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

  const fmtD = iso => iso
    ? new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '—';

  const fmtLong = d => (d || new Date()).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const startOfDay = d => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };

  function relDue(iso, done) {
    if (done) return { text: 'Tamamlandı', cls: 'b-success' };

    const days = Math.round(
      (startOfDay(iso) - startOfDay(Date.now())) / ODES.DAY
    );

    if (days < 0) {
      return { text: Math.abs(days) + ' gün gecikti', cls: 'b-danger' };
    }

    if (days === 0) return { text: 'Bugün', cls: 'b-warning' };
    if (days === 1) return { text: 'Yarın', cls: 'b-warning' };

    return { text: days + ' gün kaldı', cls: 'b-neutral' };
  }

  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toLocaleUpperCase('tr-TR');
  }

  function avatar(name, cls) {
    let h = 0;

    String(name).split('').forEach(c => {
      h = (h * 31 + c.charCodeAt(0)) % 360;
    });

    return '<span class="avatar ' + (cls || '') +
      '" style="--hue:' + h + '" aria-hidden="true">' +
      esc(initials(name)) +
      '</span>';
  }

  const typeBadge = t =>
    '<span class="badge ' +
    ({
      duyuru: 'b-info',
      odev: 'b-primary',
      sinav: 'b-warning',
      acil: 'b-danger'
    }[t] || 'b-neutral') +
    '">' + esc(ODES.TYPES[t] || t) + '</span>';

  const statusBadge = s =>
    '<span class="badge ' +
    ({
      draft: 'b-neutral',
      scheduled: 'b-info',
      sent: 'b-success',
      cancelled: 'b-danger'
    }[s] || 'b-neutral') +
    '">' + esc(ODES.STATUSES[s] || s) + '</span>';

  const roleBadge = r =>
    '<span class="badge ' +
    ({
      student: 'b-info',
      teacher: 'b-primary',
      admin: 'b-warning'
    }[r] || 'b-neutral') +
    '">' + esc(ODES.ROLES[r] || r) + '</span>';

  const homeOf = role => ({
    student: 'student.html',
    teacher: 'teacher.html',
    admin: 'admin.html'
  }[role] || 'login.html');

  /* ---------- Simgeler ---------- */

  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',

    book: '<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h12"/>',

    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',

    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',

    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/>',

    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.2.7 3.5 2.7 3.5 5.5"/>',

    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',

    plus: '<path d="M12 5v14M5 12h14"/>',

    'plus-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',

    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',

    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',

    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',

    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',

    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',

    x: '<path d="M6 6l12 12M18 6L6 18"/>',

    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',

    'shield-check': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m8.5 12 2.3 2.3 4.7-4.8"/>',

    send: '<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',

    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',

    'clipboard-list': '<rect x="6" y="4" width="15" height="17" rx="2"/><path d="M9 4h6v3H9zM10 12h7M10 16h7M3 8v10"/>',

    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',

    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',

    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',

    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',

    download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',

    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/>',

    school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',

    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',

    'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/>',

    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',

    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',

    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',

    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',

    'map-pin': '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',

    tag: '<path d="M20 13 13 20 3 10V3h7z"/><circle cx="7.5" cy="7.5" r="1"/>',

    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };

  const icon = (name, size) =>
    '<svg class="ic" width="' + (size || 18) +
    '" height="' + (size || 18) +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' +
    (ICONS[name] || '') +
    '</svg>';

  /* ---------- Toast / modal ---------- */

  function toast(msg, type) {
    let wrap = $('.toasts');

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toasts';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }

    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML =
      icon(type === 'error' ? 'alert' : 'check') +
      '<span>' + esc(msg) + '</span>';

    wrap.appendChild(t);

    setTimeout(() => {
      t.remove();
    }, 3800);
  }

  function flash(msg, type) {
    try {
      sessionStorage.setItem(
        'odes.flash',
        JSON.stringify({ msg, type: type || 'success' })
      );
    } catch (e) { }
  }

  function showFlash() {
    try {
      const raw = sessionStorage.getItem('odes.flash');

      if (raw) {
        sessionStorage.removeItem('odes.flash');
        const f = JSON.parse(raw);
        toast(f.msg, f.type);
      }
    } catch (e) { }
  }

  function modal(opt) {
    const back = document.createElement('div');
    back.className = 'modal-back';

    back.innerHTML =
      '<div class="modal ' + (opt.size || '') +
      '" role="dialog" aria-modal="true" aria-label="' +
      esc(opt.title) + '">' +

        '<div class="modal-h">' +
          '<h3>' + esc(opt.title) + '</h3>' +
          '<button class="icon-btn" type="button" data-close aria-label="Kapat">' +
            icon('x') +
          '</button>' +
        '</div>' +

        '<div class="modal-b"></div>' +
        '<div class="modal-f"></div>' +

      '</div>';

    const box = $('.modal', back);
    const body = $('.modal-b', back);
    const foot = $('.modal-f', back);

    if (typeof opt.html === 'string') {
      body.innerHTML = opt.html;
    } else if (opt.html) {
      body.appendChild(opt.html);
    }

    const prevFocus = document.activeElement;
    let closed = false;

    function close() {
      if (closed) return;

      closed = true;
      document.removeEventListener('keydown', onKey);
      back.remove();

      if (
        prevFocus &&
        prevFocus.focus &&
        document.body.contains(prevFocus)
      ) {
        prevFocus.focus();
      }

      if (opt.onClose) opt.onClose();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    (opt.actions || []).forEach(a => {
      const b = document.createElement('button');

      b.type = 'button';

      b.className = 'btn ' + (
        a.className ||
        (
          a.kind === 'primary'
            ? 'btn-primary'
            : a.kind === 'danger'
              ? 'btn-danger'
              : 'btn-ghost'
        )
      );

      b.textContent = a.label;

      b.addEventListener('click', () => {
        const r = a.onClick ? a.onClick(close, box) : undefined;
        if (r !== false) close();
      });

      foot.appendChild(b);
    });

    back.addEventListener('mousedown', e => {
      if (e.target === back) close();
    });

    $('[data-close]', back).addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);

    const first =
      $('input,select,textarea,button.btn-primary', body) ||
      $('[data-close]', back);

    if (first) first.focus();
    if (opt.onOpen) opt.onOpen(box, close);

    return close;
  }

  function confirmDialog(opt) {
    return new Promise(resolve => {
      let answered = false;

      const done = v => {
        if (!answered) {
          answered = true;
          resolve(v);
        }
      };

      modal({
        title: opt.title,
        html: '<p>' + esc(opt.message) + '</p>',

        actions: [
          {
            label: 'Vazgeç',
            onClick: () => {
              done(false);
            }
          },
          {
            label: opt.confirmLabel || 'Onayla',
            kind: opt.danger ? 'danger' : 'primary',
            onClick: () => {
              done(true);
            }
          }
        ],

        onClose: () => done(false)
      });
    });
  }

  /* ---------- Menü ---------- */

  const NAV = {
    student: [
      {
        label: 'Genel bakış',
        page: 'student',
        hash: 'overview',
        icon: 'home'
      },
      {
        label: 'Sorun bildir',
        page: 'student',
        hash: 'createReport',
        icon: 'alert'
      },
      {
        label: 'Bildirim takibi',
        page: 'student',
        hash: 'reports',
        icon: 'clipboard-list'
      },
      {
        label: 'Gelen kutusu',
        page: 'student',
        hash: 'inbox',
        icon: 'bell'
      }
    ],

    teacher: [
      {
        label: 'Genel bakış',
        page: 'teacher',
        hash: 'overview',
        icon: 'home'
      },
      {
        label: 'Güvenlik bildirimleri',
        page: 'teacher',
        hash: 'reports',
        icon: 'shield'
      },
      {
        label: 'Gelen kutusu',
        page: 'teacher',
        hash: 'inbox',
        icon: 'inbox'
      }
    ],

    admin: [
      {
        label: 'Genel bakış',
        page: 'admin',
        hash: 'overview',
        icon: 'home'
      },
      {
        label: 'Güvenlik bildirimleri',
        page: 'admin',
        hash: 'reports',
        icon: 'shield'
      },
      {
        label: 'Risk haritası',
        page: 'admin',
        hash: 'riskMap',
        icon: 'map-pin'
      },
      {
        label: 'Risk İstatistikleri',
        page: 'admin-stats',
        icon: 'chart'
      },
      {
        label: 'Kullanıcılar',
        page: 'admin',
        hash: 'users',
        icon: 'users'
      },
      {
        label: 'Onay bekleyenler',
        page: 'admin',
        hash: 'pending',
        icon: 'clock'
      },
      {
        label: 'Etkinlik günlüğü',
        page: 'admin',
        hash: 'log',
        icon: 'list'
      },
      {
        label: 'Gelen kutusu',
        page: 'admin',
        hash: 'inbox',
        icon: 'inbox'
      }
    ]
  };

  const state = {
    page: '',
    defaultHash: ''
  };

  function updateNav() {
    const cur = (location.hash || '').slice(1) || state.defaultHash;

    $$('.nav a').forEach(a => {
      const on =
        a.dataset.page === state.page &&
        (!a.dataset.hash || a.dataset.hash === cur);

      a.classList.toggle('active', on);

      if (on) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function buildShell(user, title) {
    const nav = NAV[user.role] || [];

    const navHtml = nav.map(i => {
      if (i.group) {
        return '<div class="nav-label">' + esc(i.group) + '</div>';
      }

      return '<a href="' + i.page + '.html' +
        (i.hash ? '#' + i.hash : '') +
        '" data-page="' + i.page + '"' +
        (i.hash ? ' data-hash="' + i.hash + '"' : '') +
        '>' +
        icon(i.icon) +
        '<span>' + esc(i.label) + '</span>' +
        '</a>';
    }).join('');

    const html =
      '<div class="layout">' +

        '<div class="scrim" id="scrim"></div>' +

        '<aside class="sidebar" id="sidebar" aria-label="Ana menü">' +

          '<a class="brand" href="' + homeOf(user.role) + '">' +
            '<span class="logo">' + icon('shield-check', 24) + '</span>' +
            '<span>' +
              '<b>ODES</b>' +
              '<small>' + esc(ODES.ROLES[user.role]) + ' paneli</small>' +
            '</span>' +
          '</a>' +

          '<nav class="nav" id="nav">' + navHtml + '</nav>' +

          '<div class="side-foot">' +
            '<div class="side-user">' +
              avatar(user.name) +
              '<div>' +
                '<b>' + esc(user.name) + '</b>' +
                '<small>' + esc(user.email) + '</small>' +
              '</div>' +
            '</div>' +

            '<button class="btn btn-sm" type="button" id="logoutBtn">' +
              icon('logout', 16) +
              'Çıkış yap' +
            '</button>' +
          '</div>' +

        '</aside>' +

        '<div class="main">' +

          '<div class="demo-strip">' +
            'Demo prototipi: veriler yalnızca bu tarayıcıda tutulur. ' +
            'Gerçek kimlik doğrulama ve sunucu tarafı yetkilendirme yoktur.' +
          '</div>' +

          '<header class="topbar">' +

            '<button class="icon-btn hamburger" type="button" id="menuBtn" ' +
              'aria-label="Menüyü aç" aria-controls="sidebar" aria-expanded="false">' +
              icon('menu', 22) +
            '</button>' +

            '<span class="crumb">' + esc(title || '') + '</span>' +
            '<span class="grow"></span>' +

            '<div class="dd" id="bellDD">' +

              '<button class="icon-btn" type="button" id="bellBtn" ' +
                'aria-label="Bildirimler" aria-haspopup="true" aria-expanded="false">' +
                icon('bell', 20) +
                '<span class="badge-dot" id="bellBadge" hidden>0</span>' +
              '</button>' +

              '<div class="dd-panel" id="bellPanel" hidden>' +
                '<div class="dd-h">' +
                  '<span>Bildirimler</span>' +
                  '<button class="btn btn-sm btn-ghost" type="button" id="bellReadAll">' +
                    'Tümünü okundu say' +
                  '</button>' +
                '</div>' +
                '<div id="bellList"></div>' +
                '<div class="dd-foot">' +
                  '<a href="' + homeOf(user.role) + '#inbox">Tümünü gör</a>' +
                '</div>' +
              '</div>' +

            '</div>' +

            '<div class="dd" id="userDD">' +

              '<button class="icon-btn" type="button" id="userBtn" ' +
                'aria-label="Hesap menüsü" aria-haspopup="true" aria-expanded="false">' +
                avatar(user.name, 'sm') +
              '</button>' +

              '<div class="dd-panel" id="userPanel" hidden style="width:260px">' +

                '<div class="dd-h">' +
                  '<span>' + esc(user.name) + '</span>' +
                  roleBadge(user.role) +
                '</div>' +

                '<div class="dd-menu">' +
                  '<button type="button" id="resetBtn">' +
                    icon('refresh', 16) +
                    'Demo verilerini sıfırla' +
                  '</button>' +

                  '<button type="button" id="logoutBtn2">' +
                    icon('logout', 16) +
                    'Çıkış yap' +
                  '</button>' +
                '</div>' +

              '</div>' +

            '</div>' +

          '</header>' +

          '<main id="content" tabindex="-1"></main>' +

        '</div>' +

      '</div>';

    document.body.insertAdjacentHTML('afterbegin', html);

    const sidebar = $('#sidebar');
    const scrim = $('#scrim');
    const menuBtn = $('#menuBtn');

    const setMenu = open => {
      sidebar.classList.toggle('open', open);
      scrim.classList.toggle('show', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };

    menuBtn.addEventListener('click', () => {
      setMenu(!sidebar.classList.contains('open'));
    });

    scrim.addEventListener('click', () => {
      setMenu(false);
    });

    $('#nav').addEventListener('click', e => {
      if (e.target.closest('a')) setMenu(false);
    });

    const doLogout = () => {
      store.logout();
      location.href = 'login.html';
    };

    $('#logoutBtn').addEventListener('click', doLogout);
    $('#logoutBtn2').addEventListener('click', doLogout);

    $('#resetBtn').addEventListener('click', async () => {
      closeDDs();

      const ok = await confirmDialog({
        title: 'Demo verilerini sıfırla',
        message:
          'Bu tarayıcıdaki tüm demo verileri başlangıç haline döner. Devam edilsin mi?',
        confirmLabel: 'Sıfırla',
        danger: true
      });

      if (!ok) return;

      store.reset();
      flash('Demo verileri sıfırlandı.');
      location.href = homeOf(user.role);
    });

    function closeDDs() {
      ['bell', 'user'].forEach(k => {
        $('#' + k + 'Panel').hidden = true;
        $('#' + k + 'Btn').setAttribute('aria-expanded', 'false');
      });
    }

    ['bell', 'user'].forEach(k => {
      $('#' + k + 'Btn').addEventListener('click', e => {
        e.stopPropagation();

        const p = $('#' + k + 'Panel');
        const open = p.hidden;

        closeDDs();
        p.hidden = !open;

        $('#' + k + 'Btn').setAttribute('aria-expanded', String(open));
      });
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.dd')) closeDDs();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDDs();
    });

    $('#bellReadAll').addEventListener('click', () => {
      store.markAllRead(user.id);
      refreshBell();
      window.dispatchEvent(new Event('odes:inbox'));
    });

    $('#bellList').addEventListener('click', e => {
      const it = e.target.closest('[data-nid]');
      if (!it) return;

      store.markRead(it.dataset.nid, user.id);
      refreshBell();

      window.dispatchEvent(new Event('odes:inbox'));
      location.href = homeOf(user.role) + '#inbox';
    });

    refreshBell();
    window.addEventListener('hashchange', updateNav);
  }

  /* ---------- Üst bildirim menüsü ---------- */

  function refreshBell() {
    const user = store.currentUser();
    if (!user) return;

    const list = store.inboxFor(user.id);
    const unread = list.filter(x => !x.read).length;
    const badge = $('#bellBadge');

    if (badge) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.hidden = !unread;
    }

    const panel = $('#bellList');

    if (panel) {
      panel.innerHTML = list.slice(0, 5).map(x =>
        '<button type="button" class="dd-item ' +
          (x.read ? '' : 'unread') +
          '" data-nid="' + esc(x.n.id) + '">' +

          '<b>' + esc(x.n.title) + '</b>' +
          '<small>' + esc(fmtDT(x.n.sentAt)) + '</small>' +

        '</button>'
      ).join('') || '<p class="empty-sm">Henüz bildiriminiz yok.</p>';
    }
  }

  /* ---------- Hash tabanlı bölümler ---------- */

  function sections(root, defs, def) {
    state.defaultHash = def;
    let first = true;

    function show() {
      const id = (location.hash || '').slice(1);
      const key = typeof defs[id] === 'function' || defs[id]
        ? id
        : def;

      const section = defs[key];
      const isFunction = typeof section === 'function';

      const titles = {
        overview: 'Genel Bakış',
        reports: 'Güvenlik Bildirimleri',
        riskMap: 'Risk Haritası',
        users: 'Kullanıcı Yönetimi',
        pending: 'Onay Bekleyenler',
        log: 'Etkinlik Günlüğü',
        inbox: 'Gelen Kutusu',
        createReport: 'Sorun Bildir'
      };

      const title = isFunction
        ? (titles[key] || key)
        : section.title;

      const sub = isFunction ? '' : section.sub;

      root.innerHTML =
        '<div class="page">' +

          '<div class="page-head">' +
            '<div>' +
              '<h1>' + esc(title) + '</h1>' +
              (sub
                ? '<p class="muted">' + esc(sub) + '</p>'
                : '') +
            '</div>' +
            '<div class="page-actions" id="pageActions"></div>' +
          '</div>' +

          '<div class="page-body"></div>' +

        '</div>';

      const body = $('.page-body', root);

      if (isFunction) {
        section(body, show);
      } else if (section && typeof section.render === 'function') {
        section.render(body, show);
      }

      updateNav();

      if (!first) window.scrollTo(0, 0);
      first = false;
    }

    window.addEventListener('hashchange', show);
    show();

    return show;
  }

  /* ---------- Paylaşılan bileşenler ---------- */

  function statCard(o, value, ic, tone) {
    if (typeof o !== 'object' || o === null) {
      o = {
        label: o,
        value: value,
        icon: ic,
        tone: tone
      };
    }

    const tag = o.href ? 'a' : 'div';

    return '<' + tag +
      ' class="card stat"' +
      (o.href ? ' href="' + o.href + '"' : '') +
      '>' +

        '<span class="ico tone-' + (o.tone || 'primary') + '">' +
          icon(o.icon, 22) +
        '</span>' +

        '<div>' +
          '<b>' + esc(o.value) + '</b>' +
          '<span>' + esc(o.label) + '</span>' +
        '</div>' +

      '</' + tag + '>';
  }

  function emptyState(text, ic) {
    return '<div class="empty">' +
      icon(ic || 'inbox', 32) +
      '<p>' + esc(text) + '</p>' +
    '</div>';
  }

  /* ---------- Gelen kutusu ---------- */

  function renderInbox(el, user) {
    let filter = 'all';
    let openId = null;

    function draw() {
      const all = store.inboxFor(user.id);
      const unread = all.filter(x => !x.read).length;
      const urgent = all.filter(x => x.n.type === 'acil').length;

      const items = filter === 'unread'
        ? all.filter(x => !x.read)
        : filter === 'urgent'
          ? all.filter(x => x.n.type === 'acil')
          : all;

      el.innerHTML =
        '<div class="toolbar">' +

          '<div class="tabs" role="tablist">' +

            [
              ['all', 'Tümü', all.length],
              ['unread', 'Okunmamış', unread],
              ['urgent', 'Acil', urgent]
            ].map(t =>
              '<button type="button" class="tab ' +
                (filter === t[0] ? 'active' : '') +
                '" data-f="' + t[0] + '">' +
                t[1] +
                '<small>' + t[2] + '</small>' +
              '</button>'
            ).join('') +

          '</div>' +

          '<button class="btn btn-sm" type="button" id="readAll"' +
            (unread ? '' : ' disabled') + '>' +
            icon('check', 16) +
            'Tümünü okundu işaretle' +
          '</button>' +

        '</div>' +

        (
          items.map(x => {
            const n = x.n;
            const sender = store.user(n.senderId);
            const open = openId === n.id;

            return '<article class="msg ' +
              (x.read ? '' : 'unread') +
              ' ' + n.type + '">' +

                '<button type="button" class="msg-head" data-id="' +
                  esc(n.id) + '" aria-expanded="' + open + '">' +

                  '<span class="grow">' +
                    '<b>' + esc(n.title) + '</b>' +
                    '<small class="muted">' +
                      esc(sender ? sender.name : 'Bilinmeyen gönderen') +
                      ' · ' + esc(fmtDT(n.sentAt)) +
                    '</small>' +
                  '</span>' +

                  typeBadge(n.type) +

                '</button>' +

                (open
                  ? '<div class="msg-body">' + esc(n.body) + '</div>'
                  : '') +

              '</article>';
          }).join('') || emptyState('Bu filtrede bildirim yok.')
        );

      $$('[data-f]', el).forEach(b => {
        b.addEventListener('click', () => {
          filter = b.dataset.f;
          draw();
        });
      });

      $$('.msg-head', el).forEach(b => {
        b.addEventListener('click', () => {
          const id = b.dataset.id;

          openId = openId === id ? null : id;

          store.markRead(id, user.id);
          refreshBell();
          draw();
        });
      });

      const ra = $('#readAll', el);

      if (ra) {
        ra.addEventListener('click', () => {
          store.markAllRead(user.id);
          refreshBell();
          draw();

          toast(
            'Tüm bildirimler okundu olarak işaretlendi.',
            'success'
          );
        });
      }
    }

    window.addEventListener('odes:inbox', () => {
      if (document.body.contains(el)) draw();
    });

    draw();
  }

  /* ---------- Grafikler (kütüphanesiz) ---------- */

  const charts = {
    cols(items, o) {
      o = o || {};

      const max = o.max ||
        Math.max.apply(
          null,
          items.map(i => i.value).concat([1])
        );

      return '<div class="cols" style="--h:' +
        (o.height || 200) +
        'px" role="img" aria-label="' +
        esc(o.label || 'Sütun grafik') + '">' +

        items.map(i =>
          '<div class="col" title="' +
            esc(i.label + ': ' + i.value) + '">' +

            '<div class="col-bar-wrap">' +
              '<span class="col-val">' + esc(i.value) + '</span>' +

              '<div class="col-bar" style="height:' +
                Math.max(pct(i.value, max), i.value ? 3 : 0) +
                '%;background:' + (o.color || 'var(--c1)') +
              '"></div>' +

            '</div>' +

            '<span class="col-lab">' + esc(i.label) + '</span>' +

          '</div>'
        ).join('') +

      '</div>';
    },

    hbars(items, o) {
      o = o || {};

      if (!items.length) {
        return emptyState('Gösterilecek veri yok.', 'chart');
      }

      return '<div class="hbars">' +

        items.map((i, k) =>
          '<div>' +

            '<div class="hbar-top">' +
              '<span>' + esc(i.label) + '</span>' +
              '<b>' + esc(i.text != null ? i.text : i.value + '%') + '</b>' +
            '</div>' +

            '<div class="hbar-track">' +
              '<i style="width:' +
                Math.min(100, Math.max(0, i.value)) +
                '%;background:' +
                (i.color || o.color || 'var(--c' + ((k % 5) + 1) + ')') +
              '"></i>' +
            '</div>' +

          '</div>'
        ).join('') +

      '</div>';
    },

    donut(items, o) {
      o = o || {};

      const total = items.reduce((s, i) => s + i.value, 0);

      if (!total) {
        return emptyState('Gösterilecek veri yok.', 'chart');
      }

      let acc = 0;

      const segs = items
        .filter(i => i.value > 0)
        .map(i => {
          const p = i.value / total * 100;

          const s =
            '<circle r="15.915" cx="21" cy="21" fill="none" ' +
              'stroke="' + i.color + '" stroke-width="6" ' +
              'stroke-dasharray="' + p.toFixed(3) + ' ' +
              (100 - p).toFixed(3) +
              '" stroke-dashoffset="' + (25 - acc).toFixed(3) +
            '"/>';

          acc += p;
          return s;
        }).join('');

      return '<div class="donut-wrap">' +

        '<svg class="donut" viewBox="0 0 42 42" role="img" aria-label="' +
          esc(o.label || 'Dağılım') + '">' +

          '<circle r="15.915" cx="21" cy="21" fill="none" ' +
            'stroke="#e2e8f0" stroke-width="6"/>' +

          segs +

          '<text x="21" y="21.6" text-anchor="middle" ' +
            'font-size="7" font-weight="700">' +
            total +
          '</text>' +

          '<text x="21" y="27" text-anchor="middle" font-size="2.6" ' +
            'fill="#64748b" style="fill:#64748b">' +
            esc(o.center || 'toplam') +
          '</text>' +

        '</svg>' +

        '<div class="legend">' +

          items.map(i =>
            '<span>' +
              '<i style="background:' + i.color + '"></i>' +
              esc(i.label) +
              ': <b>' + i.value + '</b>' +
            '</span>'
          ).join('') +

        '</div>' +

      '</div>';
    }
  };

  /* ---------- CSV ---------- */

  function downloadCSV(filename, rows) {
    const csv = rows.map(r =>
      r.map(c =>
        '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'
      ).join(';')
    ).join('\r\n');

    const blob = new Blob(
      ['﻿' + csv],
      { type: 'text/csv;charset=utf-8' }
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Önyükleme ---------- */

  function boot() {
    store.load();
    store.processScheduled();

    const body = document.body;
    const page = body.dataset.page;
    const roles = (body.dataset.roles || '')
      .split(',')
      .filter(Boolean);

    state.page = page;

    const fn = ODES.pages[page];

    if (!roles.length) {
      if (fn) fn();
      showFlash();
      return;
    }

    const user = store.currentUser();

    if (!user) {
      location.replace('login.html');
      return;
    }

    if (user.status !== 'active') {
      store.logout();
      flash('Hesabınız artık aktif değil.', 'error');
      location.replace('login.html');
      return;
    }

    if (!roles.includes(user.role)) {
      location.replace(homeOf(user.role));
      return;
    }

    buildShell(user, body.dataset.title);

    document.title = (body.dataset.title || 'ODES') + ' · ODES';

    if (fn) fn($('#content'), user);

    showFlash();
  }

  /* ---------- ODES dışa aktarımları ---------- */

  Object.assign(ODES, {
    $,
    $$,
    esc,
    icon,
    avatar,
    fmtDT,
    fmtD,
    fmtLong,
    relDue,
    pct,
    initials,
    typeBadge,
    statusBadge,
    roleBadge,
    homeOf,
    toast,
    flash,
    modal,
    confirmDialog,
    sections,
    statCard,
    emptyState,
    renderInbox,
    refreshBell,
    charts,
    downloadCSV
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
