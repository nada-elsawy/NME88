/* ============================================================
   NME Workforce — application (auth + payment + app + settings)
   Client-side only; persists to localStorage. No server required.
   ============================================================ */
(function () {
  'use strict';

  var K_DB = 'nme_app_v1';
  var K_SESSION = 'nme_session_v1';

  /* ---------- seeded super admin (for trying the app from inside) ---------- */
  var SUPER_ADMIN = {
    email: 'admin@nme.app',
    password: 'Admin@123',
    name: 'System Admin',
    role: 'super_admin',
    plan: 'Enterprise',
  };
  // Additional seeded super-admins (always ensured to exist on load).
  var COMPANY = 'NME Workforce';
  var SEED_ACCOUNTS = [
    { email: SUPER_ADMIN.email, password: SUPER_ADMIN.password, name: SUPER_ADMIN.name, role: 'super_admin', plan: 'Enterprise', company: COMPANY },
    { email: 'nada.melsawy@yahoo.com', password: '123@admin', name: 'Nada El Sawy', role: 'super_admin', plan: 'Enterprise', company: COMPANY },
    // registered managers under the same company (also grows when someone signs up as a manager)
    { email: 'layla.m@nme.app', password: 'demo123', name: 'Layla Mansour', role: 'manager', plan: 'Team', company: COMPANY },
    { email: 'tariq.a@nme.app', password: 'demo123', name: 'Tariq Aziz', role: 'manager', plan: 'Team', company: COMPANY },
    // registered employees under the same company, not yet assigned to the team
    { email: 'kareem@nme.app', password: 'demo123', name: 'Kareem Nabil', role: 'employee', plan: 'Free', company: COMPANY },
    { email: 'huda@nme.app', password: 'demo123', name: 'Huda Salim', role: 'employee', plan: 'Free', company: COMPANY },
    { email: 'yusuf@nme.app', password: 'demo123', name: 'Yusuf Adel', role: 'employee', plan: 'Free', company: COMPANY },
  ];

  /* ---------- date helpers ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function isoOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  var TODAY_ISO = isoOf(TODAY);
  var DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---------- default settings (customizable) ---------- */
  function defaultSettings() {
    return {
      companyName: 'NME Workforce',
      weekStart: 'monday',          // sunday | monday | saturday
      workingDays: [1, 2, 3, 4, 5], // 0=Sun..6=Sat
      timeFormat: '24h',            // 24h | 12h
      dateFormat: 'DMY',            // DMY | MDY | ISO
      currency: 'QAR',              // QAR | USD | EUR | GBP | AED
      overtimeAfter: 8,             // hours
      maxConcurrentBreaks: 3,
      defaultShift: { start: '08:00', end: '17:00' },
      country: 'Qatar',             // business country
      timezone: 'Asia/Qatar',       // clock time zone (from country)
      theme: 'system',              // light | dark | system
    };
  }
  var CUR_SYMBOL = { QAR: 'QAR ', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' };

  /* ---------- countries + international dial codes ---------- */
  var COUNTRIES = [
    { name: 'Qatar', code: '+974' }, { name: 'United Arab Emirates', code: '+971' }, { name: 'Saudi Arabia', code: '+966' },
    { name: 'Kuwait', code: '+965' }, { name: 'Bahrain', code: '+973' }, { name: 'Oman', code: '+968' },
    { name: 'Egypt', code: '+20' }, { name: 'Jordan', code: '+962' }, { name: 'Lebanon', code: '+961' },
    { name: 'Iraq', code: '+964' }, { name: 'Morocco', code: '+212' }, { name: 'Tunisia', code: '+216' },
    { name: 'United States', code: '+1' }, { name: 'United Kingdom', code: '+44' }, { name: 'Canada', code: '+1' },
    { name: 'India', code: '+91' }, { name: 'Pakistan', code: '+92' }, { name: 'Bangladesh', code: '+880' },
    { name: 'Philippines', code: '+63' }, { name: 'Germany', code: '+49' }, { name: 'France', code: '+33' },
    { name: 'Spain', code: '+34' }, { name: 'Italy', code: '+39' }, { name: 'Turkey', code: '+90' },
    { name: 'Australia', code: '+61' }, { name: 'South Africa', code: '+27' }, { name: 'Nigeria', code: '+234' },
    { name: 'Kenya', code: '+254' },
  ];

  /* promo code that grants a free account without payment */
  var PROMO_CODE = 'demofree123';

  /* country -> IANA time zone (drives the business clock) */
  var COUNTRY_TZ = {
    'Qatar': 'Asia/Qatar', 'United Arab Emirates': 'Asia/Dubai', 'Saudi Arabia': 'Asia/Riyadh',
    'Kuwait': 'Asia/Kuwait', 'Bahrain': 'Asia/Bahrain', 'Oman': 'Asia/Muscat', 'Egypt': 'Africa/Cairo',
    'Jordan': 'Asia/Amman', 'Lebanon': 'Asia/Beirut', 'Iraq': 'Asia/Baghdad', 'Morocco': 'Africa/Casablanca',
    'Tunisia': 'Africa/Tunis', 'United States': 'America/New_York', 'United Kingdom': 'Europe/London',
    'Canada': 'America/Toronto', 'India': 'Asia/Kolkata', 'Pakistan': 'Asia/Karachi', 'Bangladesh': 'Asia/Dhaka',
    'Philippines': 'Asia/Manila', 'Germany': 'Europe/Berlin', 'France': 'Europe/Paris', 'Spain': 'Europe/Madrid',
    'Italy': 'Europe/Rome', 'Turkey': 'Europe/Istanbul', 'Australia': 'Australia/Sydney',
    'South Africa': 'Africa/Johannesburg', 'Nigeria': 'Africa/Lagos', 'Kenya': 'Africa/Nairobi',
  };


  /* ---------- staff / workforce seed (from workforce_db_export.sql) ---------- */
  function seedData() {
    var departments = [{ id: 3, name: 'Travel Team', description: 'Customer-facing support team', manager_id: 9 }];
    var teams = [{ id: 4, name: 'Travel Team', department_id: 3, manager_id: 9, max_concurrent_breaks: 3 }];
    var users = [
      { id: 9,  employee_id: 'MGR-ABDO', first_name: 'Abdelrahman', last_name: 'Abdullah', email: 'abdel@nme.app', role: 'manager', department_id: 3, team_id: 4, manager_id: null, status: 'active', joining_date: '2026-06-05' },
      { id: 10, employee_id: 'EMP006', first_name: 'Nada',  last_name: 'Elsawy',  email: 'nada@nme.app',  role: 'employee', department_id: 3, team_id: 4, manager_id: 9, status: 'active', joining_date: '2026-06-15' },
      { id: 14, employee_id: 'EMP007', first_name: 'Sara',  last_name: 'Ahmed',   email: 'sara@nme.app',  role: 'employee', department_id: 3, team_id: 4, manager_id: 9, status: 'active', joining_date: '2026-06-18' },
      { id: 15, employee_id: 'EMP008', first_name: 'Omar',  last_name: 'Khaled',  email: 'omar@nme.app',  role: 'employee', department_id: 3, team_id: 4, manager_id: 9, status: 'active', joining_date: '2026-06-20' },
      { id: 16, employee_id: 'EMP009', first_name: 'Layla', last_name: 'Hassan',  email: 'layla@nme.app', role: 'employee', department_id: 3, team_id: 4, manager_id: 9, status: 'on_leave', joining_date: '2026-06-22' },
    ];
    var announcements = [
      { id: 1, title: 'New Break Policy Effective August 1', description: 'Starting August 1, all employees will have two 15-minute breaks per shift. Please review the updated break schedule with your manager.', priority: 'high', date: '2026-07-16', author: 'System Admin' },
      { id: 2, title: 'Company Picnic — July 25', description: 'Join us for the annual company picnic on July 25 at Riverside Park. Activities start at noon. Bring your family!', priority: 'medium', date: '2026-07-10', author: 'System Admin' },
      { id: 3, title: 'System Maintenance Window', description: 'The HR portal will be down for maintenance on Saturday July 20 from 2 AM to 6 AM. Please plan accordingly.', priority: 'urgent', date: '2026-07-12', author: 'System Admin' },
    ];
    var breakSettings = [
      { id: 1, label: 'Break 1', duration_min: 15, scheduled_time: '10:30' },
      { id: 2, label: 'Break 2', duration_min: 30, scheduled_time: '12:30' },
      { id: 3, label: 'Break 3', duration_min: 15, scheduled_time: '15:00' },
    ];
    var leaveRequests = [
      { id: 1, user_id: 10, start_date: '2026-07-28', end_date: '2026-07-30', leave_type: 'annual',   reason: 'Family vacation',     status: 'pending',  reviewed_by: null, created_at: '2026-07-15' },
      { id: 2, user_id: 14, start_date: '2026-07-29', end_date: '2026-07-31', leave_type: 'annual',   reason: 'Road trip',           status: 'pending',  reviewed_by: null, created_at: '2026-07-16' },
      { id: 3, user_id: 15, start_date: '2026-07-06', end_date: '2026-07-07', leave_type: 'personal', reason: 'Personal matter',     status: 'approved', reviewed_by: 'System Admin', reviewed_at: '2026-07-05', created_at: '2026-07-02' },
      { id: 4, user_id: 16, start_date: '2026-07-14', end_date: '2026-07-25', leave_type: 'sick',     reason: 'Recovery',            status: 'approved', reviewed_by: 'System Admin', reviewed_at: '2026-07-12', created_at: '2026-07-10' },
    ];
    var notifications = [
      { id: 1, title: 'Your shift starts soon', message: 'Your shift starts today. Please be ready.', type: 'shift', is_read: false },
      { id: 2, title: 'New Announcement: Break Policy', message: 'A new announcement about the break policy was posted.', type: 'announcement', is_read: false },
      { id: 3, title: 'Leave request pending', message: 'An annual leave request for Jul 28–30 is awaiting review.', type: 'leave', is_read: true },
    ];
    return {
      settings: defaultSettings(),
      accounts: SEED_ACCOUNTS.map(function (a) { return Object.assign({}, a); }),
      departments: departments, teams: teams, users: users, announcements: announcements,
      breakSettings: breakSettings, leaveRequests: leaveRequests, notifications: notifications,
      shiftSwaps: [
        { id: 1, requester_id: 14, date: TODAY_ISO, reason: 'Family commitment', status: 'pending', reviewed_by: null },
        { id: 2, requester_id: 15, date: TODAY_ISO, reason: 'Medical appointment', status: 'approved', reviewed_by: 9 },
      ],
      // generated below
      schedules: [], attendance: [],
    };
  }

  /* ---------- schedule & attendance generation (respects weekStart/workingDays) ---------- */
  function weekDays(settings) {
    // ordered 7 days of the current week starting from settings.weekStart
    var startIdx = { sunday: 0, monday: 1, saturday: 6 }[settings.weekStart];
    var diff = (TODAY.getDay() - startIdx + 7) % 7;
    var first = new Date(TODAY); first.setDate(TODAY.getDate() - diff);
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(first); d.setDate(first.getDate() + i);
      out.push({ date: isoOf(d), dow: d.getDay(), obj: d, working: settings.workingDays.indexOf(d.getDay()) !== -1 });
    }
    return out;
  }
  function regenerate(state) {
    var s = state.settings;
    var teamEmployees = state.users.filter(function (u) { return u.team_id === 4 && u.role === 'employee'; }).map(function (u) { return u.id; });
    if (!teamEmployees.length) teamEmployees = [10, 14, 15, 16];
    var days = weekDays(s);
    var SH = { break1_start: '10:30', break1_end: '10:45', lunch_start: '13:00', lunch_end: '14:00', break2_start: '15:30', break2_end: '15:45' };
    var schedules = [], attendance = [], sid = 1, aid = 1;
    teamEmployees.forEach(function (uid, idx) {
      days.forEach(function (day) {
        if (!day.working) return;
        schedules.push(Object.assign({ id: sid++, user_id: uid, date: day.date, shift_start: s.defaultShift.start, shift_end: s.defaultShift.end, published: true }, SH));
        if (day.obj <= TODAY && uid !== 16) {
          var status = 'present', ci = '07:5' + (5 - idx), co = '17:0' + idx, ot = '0';
          if (day.date === TODAY_ISO) co = null;
          if (day.dow === 2 && idx === 1) { status = 'late'; ci = '09:12'; }
          if (day.dow === 1 && idx === 2) { status = 'absent'; ci = null; co = null; }
          if (day.dow === 3 && idx === 0) { ot = '0.5'; co = '17:32'; }
          attendance.push({ id: aid++, user_id: uid, date: day.date, clock_in: ci, clock_out: co, status: status, overtime_hours: ot });
        }
      });
    });
    state.schedules = schedules; state.attendance = attendance;
    state._week = days;
  }

  /* ---------- Store ---------- */
  var Store = {
    state: null,
    load: function () {
      var raw = localStorage.getItem(K_DB);
      if (raw) { try { this.state = JSON.parse(raw); } catch (e) { this.state = null; } }
      if (!this.state) { this.state = seedData(); regenerate(this.state); this.save(); }
      else if (!this.state._week) { regenerate(this.state); }
      if (!this.state.shiftSwaps) this.state.shiftSwaps = [];
      if (!this.state.settings.theme) this.state.settings.theme = 'system';
      if (!this.state.settings.country) { this.state.settings.country = 'Qatar'; this.state.settings.timezone = 'Asia/Qatar'; }
      this.ensureAccounts();
    },
    ensureAccounts: function () {
      var self = this, changed = false;
      if (!this.state.accounts) this.state.accounts = [];
      SEED_ACCOUNTS.forEach(function (seed) {
        var existing = self.state.accounts.filter(function (a) { return a.email.toLowerCase() === seed.email.toLowerCase(); })[0];
        if (!existing) { self.state.accounts.push(Object.assign({}, seed)); changed = true; }
        else if (!existing.company && seed.company) { existing.company = seed.company; changed = true; } // backfill company
      });
      if (changed) this.save();
    },
    save: function () { localStorage.setItem(K_DB, JSON.stringify(this.state)); },
    resetDemo: function () {
      // preserve user-created accounts so a demo reset never deletes real sign-ups
      var created = (this.state && this.state.accounts) ? this.state.accounts.filter(function (a) {
        return !SEED_ACCOUNTS.some(function (s) { return s.email.toLowerCase() === a.email.toLowerCase(); });
      }) : [];
      this.state = seedData(); regenerate(this.state);
      var self = this;
      created.forEach(function (a) { if (!self.state.accounts.some(function (x) { return x.email.toLowerCase() === a.email.toLowerCase(); })) self.state.accounts.push(a); });
      this.save();
    },
    nextId: function (list) { return list.reduce(function (m, r) { return Math.max(m, r.id); }, 0) + 1; },
  };

  /* ---------- tiny DOM helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  var root = function () { return document.getElementById('root'); };
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) { t = el('div', 'toast'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = (window.NME_I18N ? NME_I18N.t(msg) : msg); t.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* localize current DOM (English -> Arabic + RTL) + wire theme buttons after any render */
  function loc() {
    if (window.NME_I18N) { NME_I18N.wire(); NME_I18N.apply(); }
    if (window.NME_THEME) NME_THEME.wire();
    enhancePasswordFields();
  }
  /* add a show/hide (eye) toggle next to every password field */
  function enhancePasswordFields(root) {
    (root || document).querySelectorAll('input[type="password"]').forEach(function (inp) {
      if (inp._pwEnhanced) return; inp._pwEnhanced = true;
      var wrap = document.createElement('span'); wrap.className = 'pw-wrap';
      inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pw-toggle'; btn.setAttribute('data-i18n-skip', '');
      btn.setAttribute('aria-label', 'Show password'); btn.textContent = '👁';
      btn.onclick = function () {
        if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; btn.setAttribute('aria-label', 'Hide password'); }
        else { inp.type = 'password'; btn.textContent = '👁'; btn.setAttribute('aria-label', 'Show password'); }
      };
      wrap.appendChild(btn);
    });
  }
  /* add floating theme + language toggles to a full-screen container (auth/payment/reset) */
  function addLangToggle(container) {
    var wrap = el('div', 'top-controls fixed');
    var tb = el('button', 'theme-btn', ''); tb.type = 'button'; tb.setAttribute('data-i18n-skip', ''); tb.setAttribute('aria-label', 'Theme');
    var lb = el('button', 'lang-btn', ''); lb.type = 'button'; lb.setAttribute('data-i18n-skip', '');
    wrap.appendChild(tb); wrap.appendChild(lb);
    (container || document.body).appendChild(wrap); return wrap;
  }

  /* ---------- settings-aware formatters ---------- */
  function S() { return Store.state.settings; }
  function fmtTime(hhmm) {
    if (!hhmm) return '—';
    var parts = hhmm.split(':'); var h = parseInt(parts[0], 10); var m = parts[1];
    if (S().timeFormat === '12h') { var ap = h < 12 ? 'AM' : 'PM'; var h12 = h % 12; if (h12 === 0) h12 = 12; return h12 + ':' + m + ' ' + ap; }
    return pad(h) + ':' + m;
  }
  function fmtRange(a, b) { return fmtTime(a) + ' – ' + fmtTime(b); }
  function fmtDate(iso) {
    if (!iso) return '—';
    var p = iso.split('-'); var y = p[0], mo = p[1], d = p[2];
    var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo, 10) - 1];
    if (S().dateFormat === 'ISO') return iso;
    if (S().dateFormat === 'MDY') return mon + ' ' + parseInt(d, 10) + ', ' + y;
    return parseInt(d, 10) + ' ' + mon + ' ' + y; // DMY
  }
  function fmtDateDow(iso) { var d = new Date(iso + 'T00:00:00'); return DOW_NAMES[d.getDay()].slice(0, 3) + ', ' + fmtDate(iso); }
  function money(n) { return (CUR_SYMBOL[S().currency] || '') + n; }

  /* ---------- session / auth ---------- */
  var currentUser = null;
  function setSession(email) { localStorage.setItem(K_SESSION, email); currentUser = findAccount(email); }
  function clearSession() { localStorage.removeItem(K_SESSION); currentUser = null; }
  function findAccount(email) { return Store.state.accounts.find(function (a) { return a.email.toLowerCase() === String(email).toLowerCase(); }); }
  function initials(name) { var p = name.trim().split(/\s+/); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  /* preset avatars: humans (male/female) + animals */
  var AVATARS = ['🧑‍💼', '👩‍💼', '🧔', '👱‍♀️', '👨', '👩', '🧑', '👧', '🐱', '🐶', '🦊', '🐼', '🦁', '🐯', '🐨', '🐵'];
  function setAvatarEl(elm, acc) {
    if (!elm) return;
    if (acc.photo) { elm.textContent = ''; elm.style.backgroundImage = 'url(' + acc.photo + ')'; elm.style.backgroundSize = 'cover'; elm.style.backgroundPosition = 'center'; }
    else if (acc.avatar) { elm.style.backgroundImage = ''; elm.textContent = acc.avatar; elm.style.fontSize = '20px'; }
    else { elm.style.backgroundImage = ''; elm.textContent = initials(acc.name); elm.style.fontSize = ''; }
  }

  /* =========================================================
     SCREEN: Auth (login / signup)
     ========================================================= */
  function screenAuth(mode) {
    mode = mode || 'login';
    var r = root(); r.innerHTML = '';
    var wrap = el('div', 'auth-wrap');

    // aside
    var aside = el('div', 'auth-aside');
    aside.innerHTML =
      '<a href="index.html" class="auth-brand" title="Back to home"><span class="mark">NME</span> NME Workforce</a>' +
      '<div><h2>Run every shift without the spreadsheet chaos.</h2>' +
      '<p>Scheduling, attendance, and leave — one workspace your whole team actually enjoys using.</p>' +
      '<ul class="auth-points">' +
        '<li><span class="ck">✓</span> Smart weekly scheduling &amp; breaks</li>' +
        '<li><span class="ck">✓</span> One-tap clock in / out &amp; overtime</li>' +
        '<li><span class="ck">✓</span> Leave requests &amp; approvals</li>' +
        '<li><span class="ck">✓</span> Fully customizable — week start, time format &amp; more</li>' +
      '</ul></div>' +
      '<div class="aside-foot">© 2026 NME Workforce · Demo environment</div>';
    wrap.appendChild(aside);

    // main
    var main = el('div', 'auth-main');
    var card = el('div', 'auth-card');
    var tabs = el('div', 'auth-tabs');
    tabs.innerHTML = '<button data-m="login">Log in</button><button data-m="signup">Create account</button>';
    card.appendChild(tabs);
    var body = el('div'); card.appendChild(body);
    main.appendChild(card); wrap.appendChild(main); addLangToggle(wrap); r.appendChild(wrap);

    function activate(m) {
      tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b.dataset.m === m); });
      m === 'signup' ? renderSignup(body) : renderLogin(body);
      history.replaceState(null, '', '#' + m);
      loc();
    }
    tabs.querySelectorAll('button').forEach(function (b) { b.onclick = function () { activate(b.dataset.m); }; });
    activate(mode);
  }

  function renderLogin(body) {
    var savedEmail = ''; var savedPw = ''; var rememberOn = false;
    try { savedEmail = localStorage.getItem('nme_remember_email') || ''; savedPw = localStorage.getItem('nme_remember_pw') || ''; rememberOn = !!savedEmail; } catch (e) {}
    body.innerHTML =
      '<h1>Welcome back</h1><p class="sub">Log in to your NME Workforce account.</p>' +
      '<form class="form" id="login-form">' +
        '<label>Email<input type="email" name="email" placeholder="you@company.com" value="' + esc(savedEmail) + '" required></label>' +
        '<label>Password<input type="password" name="password" placeholder="••••••••" value="' + esc(savedPw) + '" required></label>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:-4px">' +
          '<label style="display:flex;align-items:center;gap:7px;font-weight:500"><input type="checkbox" name="remember" style="width:auto"' + (rememberOn ? ' checked' : '') + '> Remember me</label>' +
          '<button type="button" class="link-btn" id="to-reset">Forgot password?</button></div>' +
        '<p class="form-error" id="login-err" hidden></p>' +
        '<button class="btn btn-primary btn-block btn-lg" type="submit">Log in</button>' +
      '</form>' +
      '<p class="auth-alt">No account yet? <button class="link-btn" id="to-signup">Create one</button></p>';
    $('#login-form', body).onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      try {
        if (f.get('remember')) { localStorage.setItem('nme_remember_email', f.get('email')); localStorage.setItem('nme_remember_pw', f.get('password')); }
        else { localStorage.removeItem('nme_remember_email'); localStorage.removeItem('nme_remember_pw'); }
      } catch (e2) {}
      doLogin(f.get('email'), f.get('password'), $('#login-err', body));
    };
    $('#to-signup', body).onclick = function () { screenAuth('signup'); };
    $('#to-reset', body).onclick = function () { screenReset(); };
  }

  function doLogin(email, password, errEl) {
    var acc = findAccount(email);
    if (!acc || acc.password !== password) {
      if (errEl) { errEl.textContent = 'Incorrect email or password.'; errEl.hidden = false; }
      return;
    }
    setSession(acc.email); enterApp();
  }

  /* create the account + sign in (used by promo path and after payment) */
  function finalizeAccount(pending, plan) {
    Store.state.accounts.push({
      email: pending.email, password: pending.password, name: pending.name,
      role: pending.role || 'employee', plan: plan, company: pending.company,
    });
    Store.save(); setSession(pending.email);
    toast('Welcome to NME, ' + pending.name.split(' ')[0] + '!'); enterApp();
  }

  function renderSignup(body) {
    var role = 'employee';
    body.innerHTML =
      '<h1>Create your account</h1><p class="sub">Start your NME Workforce workspace in minutes.</p>' +
      '<form class="form" id="signup-form">' +
        '<label>I am a…</label>' +
        '<div class="seg" id="role-seg"><button type="button" data-r="manager">Manager</button><button type="button" data-r="employee" class="active">Employee</button></div>' +
        '<label>Full name<input name="name" placeholder="Jane Doe" required></label>' +
        '<label>Work email<input type="email" name="email" placeholder="you@company.com" required></label>' +
        '<label>Company<input name="company" placeholder="Company name" required></label>' +
        '<label>Company size<select name="size"><option value="1-10">1–10 employees (free)</option><option value="11-50">11–50 employees</option><option value="51-200">51–200 employees</option><option value="200+">200+ employees</option></select></label>' +
        '<div class="row"><label>Password<input type="password" name="password" placeholder="Create a password" minlength="6" required></label>' +
        '<label>Confirm<input type="password" name="confirm" placeholder="Repeat password" required></label></div>' +
        '<label>Promo code (optional)<input name="promo" placeholder="Enter a promo code" autocomplete="off"></label>' +
        '<p class="form-error" id="promo-err" hidden></p>' +
        '<p class="form-error" id="signup-err" hidden></p>' +
        '<button class="btn btn-primary btn-block btn-lg" type="submit" id="signup-submit">Continue to payment →</button>' +
      '</form>' +
      '<p class="auth-alt">Already have an account? <button class="link-btn" id="to-login">Log in</button></p>';
    var seg = $('#role-seg', body);
    seg.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); role = b.dataset.r; };
    });
    var promoInput = body.querySelector('input[name=promo]');
    var sizeSel = body.querySelector('select[name=size]');
    var submitBtn = $('#signup-submit', body);
    function updateBtn() {
      var free = promoInput.value.trim() !== '' || sizeSel.value === '1-10';
      submitBtn.textContent = free ? 'Create free account' : 'Continue to payment →'; loc();
    }
    promoInput.oninput = updateBtn; sizeSel.onchange = updateBtn; updateBtn();
    $('#to-login', body).onclick = function () { screenAuth('login'); };
    $('#signup-form', body).onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target); var errEl = $('#signup-err', body); var promoErr = $('#promo-err', body);
      errEl.hidden = true; promoErr.hidden = true;
      if (f.get('password') !== f.get('confirm')) { errEl.textContent = 'Passwords do not match.'; errEl.hidden = false; return; }
      if (findAccount(f.get('email'))) { errEl.textContent = 'An account with this email already exists.'; errEl.hidden = false; return; }
      var pending = { name: f.get('name'), email: f.get('email'), company: f.get('company'), password: f.get('password'), role: role, size: f.get('size') };
      var promo = (f.get('promo') || '').trim();
      if (promo) {
        // promo entered: must be valid
        if (promo.toLowerCase() === PROMO_CODE) { finalizeAccount(pending, 'Free (Promo)'); }
        else { promoErr.textContent = 'This promo code isn’t active. Please check the code and try again.'; promoErr.hidden = false; }
        return;
      }
      // 1–10 employees is free — create the account right away, no payment
      if (pending.size === '1-10') { finalizeAccount(pending, 'Free (1–10)'); return; }
      screenPayment(pending);
    };
  }

  /* =========================================================
     SCREEN: Payment (demo checkout)
     ========================================================= */
  var PLANS = [
    { key: 'Starter', monthly: 0, annual: 0, note: 'Up to 10 employees' },
    { key: 'Team', monthly: 4, annual: 3, note: 'Per user / month' },
    { key: 'Enterprise', monthly: 9, annual: 7, note: 'Per user / month' },
  ];
  function screenPayment(pending) {
    var r = root(); r.innerHTML = '';
    var wrap = el('div', 'auth-wrap');
    var aside = el('div', 'auth-aside');
    aside.innerHTML =
      '<a href="index.html" class="auth-brand" title="Back to home"><span class="mark">NME</span> NME Workforce</a>' +
      '<div><h2>You\'re almost in, ' + esc(pending.name.split(' ')[0]) + '.</h2>' +
      '<p>Choose a plan and confirm to finish setting up <b>' + esc(pending.company) + '</b>.</p>' +
      '<ul class="auth-points"><li><span class="ck">✓</span> Cancel anytime</li>' +
      '<li><span class="ck">✓</span> Free plan available</li>' +
      '<li><span class="ck">✓</span> Set up in under an hour</li></ul></div>' +
      '<div class="aside-foot">Secure demo checkout</div>';
    wrap.appendChild(aside);

    var main = el('div', 'auth-main');
    var card = el('div', 'auth-card');
    var sel = { plan: 'Team', cycle: 'monthly' };

    function price() { var p = PLANS.find(function (x) { return x.key === sel.plan; }); return sel.cycle === 'annual' ? p.annual : p.monthly; }
    function render() {
      card.innerHTML =
        '<div class="pay-steps"><span class="st done"><span class="n">✓</span> Account</span><span class="sep"></span>' +
        '<span class="st active"><span class="n">2</span> Payment</span><span class="sep"></span>' +
        '<span class="st"><span class="n">3</span> Done</span></div>' +
        '<h1>Choose your plan</h1><p class="sub">Billed to ' + esc(pending.email) + '</p>' +
        '<div class="cycle-toggle"><button data-c="monthly">Monthly</button><button data-c="annual">Annual · save 25%</button></div>' +
        '<div class="plans">' + PLANS.map(function (p) {
          var pr = sel.cycle === 'annual' ? p.annual : p.monthly;
          return '<button type="button" class="plan" data-plan="' + p.key + '"><h4>' + p.key + '</h4>' +
            '<div class="p">' + (pr === 0 ? 'Free' : money(pr)) + '</div><div class="pnote">' + p.note + '</div></button>';
        }).join('') + '</div>' +
        '<form class="form" id="pay-form">' +
          '<label>Name on card<input name="cardname" placeholder="Full name" required></label>' +
          '<label>Card number<input name="cardnum" placeholder="4242 4242 4242 4242" inputmode="numeric" maxlength="19" required></label>' +
          '<div class="row"><label>Expiry<input name="exp" placeholder="MM/YY" maxlength="5" required></label>' +
          '<label>CVC<input name="cvc" placeholder="123" maxlength="4" inputmode="numeric" required></label></div>' +
          '<div class="pay-summary"><div class="prow"><span>' + sel.plan + ' plan (' + sel.cycle + ')</span><span>' + (price() === 0 ? 'Free' : money(price()) + '/user') + '</span></div>' +
            '<div class="prow total"><span>Due today</span><span>' + (price() === 0 ? money(0) : money(price())) + '</span></div></div>' +
          '<div class="pay-note">⚠ Demo checkout — this does not process real payments. Please do <b>not</b> enter real card details. Any values are accepted.</div>' +
          '<button class="btn btn-primary btn-block btn-lg" type="submit" style="margin-top:16px">Complete sign up</button>' +
        '</form>' +
        '<p class="auth-alt"><button class="link-btn" id="pay-back">← Back</button></p>';

      card.querySelectorAll('.cycle-toggle button').forEach(function (b) {
        b.classList.toggle('active', b.dataset.c === sel.cycle);
        b.onclick = function () { sel.cycle = b.dataset.c; render(); };
      });
      card.querySelectorAll('.plan').forEach(function (b) {
        b.classList.toggle('sel', b.dataset.plan === sel.plan);
        b.onclick = function () { sel.plan = b.dataset.plan; render(); };
      });
      $('#pay-back', card).onclick = function () { screenAuth('signup'); };
      $('#pay-form', card).onsubmit = function (e) {
        e.preventDefault();
        finalizeAccount(pending, sel.plan);
      };
      loc();
    }
    main.appendChild(card); wrap.appendChild(main); addLangToggle(wrap); r.appendChild(wrap);
    render();
  }

  /* =========================================================
     SCREEN: Forgot / reset password
     ========================================================= */
  function screenReset() {
    var r = root(); r.innerHTML = '';
    var wrap = el('div', 'auth-wrap');
    var aside = el('div', 'auth-aside');
    aside.innerHTML =
      '<a href="index.html" class="auth-brand" title="Back to home"><span class="mark">NME</span> NME Workforce</a>' +
      '<div><h2>Reset your password</h2>' +
      '<p>We\'ll help you get back into your account in a couple of steps.</p>' +
      '<ul class="auth-points"><li><span class="ck">✓</span> Verify with an emailed code</li>' +
      '<li><span class="ck">✓</span> Set a new password</li>' +
      '<li><span class="ck">✓</span> Log in as usual</li></ul></div>' +
      '<div class="aside-foot">© 2026 NME Workforce · Demo environment</div>';
    wrap.appendChild(aside);

    var main = el('div', 'auth-main');
    var card = el('div', 'auth-card');
    var st = { step: 1, email: '', code: '' };

    function render() {
      if (st.step === 1) {
        card.innerHTML =
          '<h1>Reset your password</h1><p class="sub">Enter your account email and we\'ll send you a verification code.</p>' +
          '<form class="form" id="rf1"><label>Email<input type="email" name="email" placeholder="you@company.com" required></label>' +
          '<p class="form-error" id="re" hidden></p>' +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Send code</button></form>' +
          '<p class="auth-alt"><button class="link-btn" id="rback">Back to log in</button></p>';
        $('#rback', card).onclick = function () { screenAuth('login'); };
        $('#rf1', card).onsubmit = function (e) {
          e.preventDefault();
          var email = new FormData(e.target).get('email').trim();
          if (!findAccount(email)) { var er = $('#re', card); er.textContent = 'No account found with that email.'; er.hidden = false; return; }
          st.email = email; st.code = String(Math.floor(100000 + Math.random() * 900000));
          st.step = 2; render();
        };
      } else if (st.step === 2) {
        card.innerHTML =
          '<h1>Check your email</h1><p class="sub">Enter the 6-digit code we sent to your email.</p>' +
          '<div class="demo-hint">Demo — normally this code is emailed to you: <b style="font-size:18px;letter-spacing:3px">' + st.code + '</b></div>' +
          '<form class="form" id="rf2" style="margin-top:14px"><label>Verification code<input name="code" inputmode="numeric" maxlength="6" placeholder="123456" required></label>' +
          '<p class="form-error" id="re" hidden></p>' +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Verify code</button></form>' +
          '<p class="auth-alt"><button class="link-btn" id="rback">Back to log in</button></p>';
        $('#rback', card).onclick = function () { screenAuth('login'); };
        $('#rf2', card).onsubmit = function (e) {
          e.preventDefault();
          if (new FormData(e.target).get('code').trim() !== st.code) { var er = $('#re', card); er.textContent = 'Incorrect code. Please try again.'; er.hidden = false; return; }
          st.step = 3; render();
        };
      } else {
        card.innerHTML =
          '<h1>Create a new password</h1><p class="sub">Choose a new password for ' + esc(st.email) + '.</p>' +
          '<form class="form" id="rf3"><label>New password<input type="password" name="np" minlength="6" placeholder="At least 6 characters" required></label>' +
          '<label>Confirm new password<input type="password" name="cp" placeholder="Repeat password" required></label>' +
          '<p class="form-error" id="re" hidden></p>' +
          '<button class="btn btn-primary btn-block btn-lg" type="submit">Update password</button></form>';
        $('#rf3', card).onsubmit = function (e) {
          e.preventDefault();
          var f = new FormData(e.target); var er = $('#re', card);
          if (f.get('np').length < 6) { er.textContent = 'New password must be at least 6 characters.'; er.hidden = false; return; }
          if (f.get('np') !== f.get('cp')) { er.textContent = 'New passwords do not match.'; er.hidden = false; return; }
          var acc = findAccount(st.email); acc.password = f.get('np'); Store.save();
          toast('Password updated — you can now log in.');
          screenAuth('login');
        };
      }
      loc();
    }
    main.appendChild(card); wrap.appendChild(main); addLangToggle(wrap); r.appendChild(wrap);
    render();
  }

  /* =========================================================
     SCREEN: App
     ========================================================= */
  var ALL = ['employee', 'manager', 'super_admin'];
  var MGR = ['manager', 'super_admin'];
  var NAV = [
    { id: 'dashboard', label: 'Dashboard', ico: '🏠', roles: ALL },
    { id: 'schedule', label: 'Schedule', ico: '📅', roles: ALL },
    { id: 'attendance', label: 'Attendance', ico: '⏱️', roles: ALL },
    { id: 'leave', label: 'Leave', ico: '🌴', roles: ALL },
    { id: 'swaps', label: 'Shift Swaps', ico: '🔁', roles: ALL },
    { id: 'reminders', label: 'Break Reminders', ico: '⏰', roles: ALL },
    { id: 'announcements', label: 'Announcements', ico: '📣', roles: ALL },
    { id: 'team', label: 'Team', ico: '👥', roles: MGR },
    { id: 'profile', label: 'My Profile', ico: '👤', roles: ALL },
    { id: 'settings', label: 'Settings', ico: '⚙️', roles: ALL },
    { id: 'billing', label: 'Account & Billing', ico: '💳', roles: MGR },
  ];
  var TITLES = {};
  NAV.forEach(function (n) { TITLES[n.id] = n.label; });
  function canSee(route) {
    for (var i = 0; i < NAV.length; i++) if (NAV[i].id === route) return NAV[i].roles.indexOf(currentUser.role) !== -1;
    return true;
  }
  var isManager = function () { return currentUser.role !== 'employee'; };

  function enterApp() {
    var r = root(); r.innerHTML = '';
    var app = el('div', 'app'); app.id = 'app';
    app.innerHTML =
      '<aside class="sidebar"><a href="index.html" class="sidebar-brand" title="Back to home"><span class="mark">NME</span> ' + esc(S().companyName) + '</a>' +
        '<nav class="nav" id="nav"></nav>' +
        '<div class="sidebar-foot">Signed in as<br><b style="color:#fff">' + esc(currentUser.name) + '</b></div></aside>' +
      '<div class="main"><header class="topbar">' +
        '<button class="icon-btn" id="menu-toggle">☰</button><h2 id="page-title">Dashboard</h2>' +
        '<div class="topbar-right">' +
          '<button class="theme-btn" data-i18n-skip aria-label="Theme"></button>' +
          '<button class="lang-btn" data-i18n-skip title="Language"></button>' +
          '<button class="icon-btn" id="notif-btn" title="Notifications">🔔<span class="badge-count" id="notif-badge" hidden>0</span></button>' +
          '<div class="user-chip"><div class="avatar" id="u-av"></div><div class="user-chip-meta"><b>' + esc(currentUser.name) + '</b><span>' + esc(currentUser.role.replace('_', ' ')) + '</span></div></div>' +
          '<button class="btn btn-ghost btn-sm" id="logout">Sign out</button>' +
        '</div></header><main class="view" id="view"></main></div>';
    r.appendChild(app);

    setAvatarEl($('#u-av'), currentUser);
    var nav = $('#nav');
    NAV.filter(function (n) { return n.roles.indexOf(currentUser.role) !== -1; }).forEach(function (n) {
      var a = el('a', '', '<span class="nav-ico">' + n.ico + '</span><span>' + n.label + '</span>');
      a.dataset.route = n.id;
      a.onclick = function (e) { e.preventDefault(); navigate(n.id); $('#app').classList.remove('nav-open'); };
      nav.appendChild(a);
    });
    $('#menu-toggle').onclick = function () { $('#app').classList.toggle('nav-open'); };
    $('#logout').onclick = function () { clearSession(); screenAuth('login'); };
    $('#notif-btn').onclick = openNotif;
    var chip = document.querySelector('.user-chip');
    if (chip) { chip.style.cursor = 'pointer'; chip.title = 'My profile'; chip.onclick = function () { navigate('profile'); }; }
    applyUserPrefs();
    updateNotifBadge();
    startClock();
    startReminderScheduler();
    navigate('dashboard');
  }
  /* per-user theme + language: remember on this account and re-apply on every login */
  function applyUserPrefs() {
    if (!currentUser) return;
    if (window.NME_THEME) {
      NME_THEME.onChange = function (m) { if (currentUser) { currentUser.theme = m; Store.save(); } };
      if (currentUser.theme) NME_THEME.set(currentUser.theme);        // re-apply saved preference
      else { currentUser.theme = NME_THEME.mode; Store.save(); }      // first time: adopt current & remember
    }
    if (window.NME_I18N) {
      NME_I18N.onChange = function (l) { if (currentUser) { currentUser.lang = l; Store.save(); } };
      if (currentUser.lang) NME_I18N.setLang(currentUser.lang);
      else { currentUser.lang = NME_I18N.lang; Store.save(); }
    }
  }

  var ROUTES = {
    dashboard: viewDashboard, schedule: viewSchedule, attendance: viewAttendance,
    leave: viewLeave, swaps: viewSwaps, reminders: viewReminders, announcements: viewAnnouncements, team: viewTeam,
    profile: viewProfile, settings: viewSettings, billing: viewBilling,
  };
  function navigate(route) {
    if (!ROUTES[route] || !canSee(route)) route = 'dashboard';
    $('#page-title').textContent = TITLES[route];
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.route === route); });
    var v = $('#view'); v.innerHTML = ''; ROUTES[route](v); v.scrollTop = 0;
    loc();
  }

  /* ---------- selectors ---------- */
  function userById(id) { return Store.state.users.find(function (u) { return u.id === id; }); }
  function fullName(u) { return u.first_name + ' ' + u.last_name; }
  function uInitials(u) { return (u.first_name[0] + (u.last_name[0] || '')).toUpperCase(); }
  function avatarEl(u, cls) { return '<div class="avatar ' + (cls || '') + '">' + esc(uInitials(u)) + '</div>'; }
  function badge(text, cls) {
    var map = { present: 'b-green', late: 'b-amber', absent: 'b-red', on_leave: 'b-blue', active: 'b-green', pending: 'b-amber', approved: 'b-green', rejected: 'b-red' };
    return '<span class="badge ' + (cls || map[text] || 'b-muted') + '">' + esc(String(text).replace(/_/g, ' ')) + '</span>';
  }
  function priorityCls(p) { return { low: 'b-muted', medium: 'b-blue', high: 'b-amber', urgent: 'b-red' }[p] || 'b-muted'; }
  function priorityTint(p) { return { low: 'tint-blue', medium: 'tint-blue', high: 'tint-amber', urgent: 'tint-red' }[p] || 'tint-blue'; }
  var week = function () { return Store.state._week; };
  var schedFor = function (uid) { return Store.state.schedules.filter(function (s) { return s.user_id === uid; }).sort(function (a, b) { return a.date.localeCompare(b.date); }); };
  var attFor = function (uid) { return Store.state.attendance.filter(function (a) { return a.user_id === uid; }).sort(function (a, b) { return b.date.localeCompare(a.date); }); };
  var leaveFor = function (uid) { return Store.state.leaveRequests.filter(function (l) { return l.user_id === uid; }).sort(function (a, b) { return b.start_date.localeCompare(a.start_date); }); };
  // "acting" employee for personal views (super admin views the first employee)
  function actingEmployeeId() { return 10; }

  /* ---------- Dashboard ---------- */
  function viewDashboard(v) {
    v.appendChild(el('p', 'muted', 'Welcome back, <b>' + esc(currentUser.name.split(' ')[0]) + '</b> · ' + esc(fmtDateDow(TODAY_ISO))));
    var ids = Store.state.users.filter(function (u) { return u.role === 'employee'; }).map(function (u) { return u.id; });
    var todayAtt = Store.state.attendance.filter(function (a) { return a.date === TODAY_ISO && ids.indexOf(a.user_id) !== -1; });
    var present = todayAtt.filter(function (a) { return a.status === 'present' || a.status === 'late'; }).length;
    var onLeave = Store.state.users.filter(function (u) { return u.status === 'on_leave'; }).length;
    var pending = Store.state.leaveRequests.filter(function (l) { return l.status === 'pending'; }).length;
    var todaySched = Store.state.schedules.filter(function (s) { return s.date === TODAY_ISO; })[0];

    var myLeaves = leaveFor(actingEmployeeId());
    var cards = el('div', 'cards'); cards.style.marginTop = '16px';
    var statDefs = isManager() ? [
      { l: 'Team size', val: ids.length, ico: '👥', t: 'tint-primary', go: 'team' },
      { l: 'Present today', val: present, ico: '✅', t: 'tint-green', go: 'attendance' },
      { l: 'On leave', val: onLeave, ico: '🌴', t: 'tint-blue', go: 'leave' },
      { l: 'Pending approvals', val: pending, ico: '📨', t: 'tint-amber', go: 'leave' },
    ] : [
      { l: 'My leaves', val: myLeaves.length, ico: '🌴', t: 'tint-blue', go: 'leave' },
      { l: 'My shift swaps', val: Store.state.shiftSwaps.filter(function (s) { return s.requester_id === actingEmployeeId(); }).length, ico: '🔁', t: 'tint-primary', go: 'swaps' },
      { l: 'Attendance', val: attFor(actingEmployeeId()).length, ico: '⏱️', t: 'tint-green', go: 'attendance' },
      { l: 'Announcements', val: Store.state.announcements.length, ico: '📣', t: 'tint-amber', go: 'announcements' },
    ];
    statDefs.forEach(function (s) {
      var c = el('div', 'card stat-clickable', '<div class="stat-row"><div><div class="stat-label">' + s.l + '</div><div class="stat-value">' + s.val + '</div></div><div class="stat-ico ' + s.t + '">' + s.ico + '</div></div>');
      c.onclick = function () { navigate(s.go); };
      cards.appendChild(c);
    });
    v.appendChild(cards);

    var grid = el('div', 'grid'); grid.style.gridTemplateColumns = '1fr 1fr'; grid.style.marginTop = '8px';
    grid.appendChild(clockCard());
    var ann = el('div', 'card');
    ann.innerHTML = '<div class="card-head"><h3>Latest announcements</h3></div>';
    var list = el('div', 'list');
    Store.state.announcements.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 3).forEach(function (a) {
      list.appendChild(el('div', 'list-item', '<div class="li-ico ' + priorityTint(a.priority) + '">📣</div><div class="li-body"><div class="li-title">' + esc(a.title) + ' ' + badge(a.priority, priorityCls(a.priority)) + '</div><div class="li-desc">' + esc(a.description) + '</div><div class="li-meta">' + esc(fmtDate(a.date)) + '</div></div>'));
    });
    ann.appendChild(list); grid.appendChild(ann); v.appendChild(grid);
  }

  function nowHM() {
    var tz = S().timezone;
    if (tz) {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
        var h = '', m = ''; parts.forEach(function (p) { if (p.type === 'hour') h = p.value; if (p.type === 'minute') m = p.value; });
        if (h !== '') return (h === '24' ? '00' : h) + ':' + m;
      } catch (e) {}
    }
    var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  /* live time string with seconds, in the business time zone + chosen format */
  function clockString() {
    var tz = S().timezone, d = new Date(), h, m, s;
    if (tz) {
      try {
        var p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d);
        p.forEach(function (x) { if (x.type === 'hour') h = x.value; if (x.type === 'minute') m = x.value; if (x.type === 'second') s = x.value; });
      } catch (e) {}
    }
    if (h == null) { h = pad(d.getHours()); m = pad(d.getMinutes()); s = pad(d.getSeconds()); }
    if (h === '24') h = '00';
    if (S().timeFormat === '12h') { var H = parseInt(h, 10), ap = H < 12 ? 'AM' : 'PM', h12 = H % 12; if (h12 === 0) h12 = 12; return h12 + ':' + m + ':' + s + ' ' + ap; }
    return h + ':' + m + ':' + s;
  }
  var clockTimer = null;
  function startClock() { if (clockTimer) clearInterval(clockTimer); clockTimer = setInterval(function () { document.querySelectorAll('.clock-now').forEach(function (e) { e.textContent = clockString(); }); }, 1000); }

  /* ---------- Break reminders ---------- */
  var TONES = [
    { v: 'chime', label: 'Chime' }, { v: 'bell', label: 'Bell' }, { v: 'ding', label: 'Ding' },
    { v: 'digital', label: 'Digital' }, { v: 'none', label: 'Silent' },
  ];
  function reminderPrefs() {
    var r = currentUser.reminders || {};
    return { enabled: r.enabled !== false, leadMinutes: r.leadMinutes || 10, tone: r.tone || 'chime', snoozeMinutes: r.snoozeMinutes || 5 };
  }
  var _audio;
  function playTone(name) {
    if (name === 'none') return;
    try {
      _audio = _audio || new (window.AudioContext || window.webkitAudioContext)();
      var ctx = _audio; var now = ctx.currentTime;
      var seq = { chime: [[880, 0], [1108, 0.16], [1318, 0.32]], bell: [[660, 0]], ding: [[1046, 0], [1046, 0.14]], digital: [[440, 0], [440, 0.12], [440, 0.24]] }[name] || [[880, 0]];
      seq.forEach(function (pair) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = name === 'digital' ? 'square' : 'sine'; o.frequency.value = pair[0];
        o.connect(g); g.connect(ctx.destination);
        var t = now + pair[1];
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        o.start(t); o.stop(t + 0.45);
      });
    } catch (e) {}
  }
  function minusMinutes(hhmm, m) { var p = hhmm.split(':'); var t = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) - m; if (t < 0) t += 1440; return pad(Math.floor(t / 60)) + ':' + pad(t % 60); }
  function showBreakReminder(brk) {
    var p = reminderPrefs();
    playTone(p.tone);
    pushNotif('Break reminder', brk.label + ' starts at ' + brk.scheduled_time + ' — ' + p.leadMinutes + ' min away.', 'system');
    var ex = document.getElementById('break-reminder'); if (ex) ex.remove();
    var box = el('div', 'reminder-pop'); box.id = 'break-reminder'; box.setAttribute('data-i18n-skip', '');
    box.innerHTML = '<div class="rp-ico">☕</div><div class="rp-body"><b>' + esc(brk.label) + ' in ' + p.leadMinutes + ' min</b><div class="muted">Scheduled at ' + esc(brk.scheduled_time) + '</div></div>';
    var acts = el('div', 'rp-acts');
    var snz = el('button', 'btn btn-ghost btn-sm', 'Snooze ' + p.snoozeMinutes + 'm');
    snz.onclick = function () { box.remove(); toast('Snoozed ' + p.snoozeMinutes + ' min'); setTimeout(function () { showBreakReminder(brk); }, p.snoozeMinutes * 60000); };
    var ok = el('button', 'btn btn-primary btn-sm', 'Got it'); ok.onclick = function () { box.remove(); };
    acts.appendChild(snz); acts.appendChild(ok); box.appendChild(acts);
    document.body.appendChild(box);
  }
  var reminderTimer = null, _fired = {};
  function startReminderScheduler() {
    if (reminderTimer) clearInterval(reminderTimer);
    reminderTimer = setInterval(checkReminders, 15000);
  }
  function checkReminders() {
    var p = reminderPrefs(); if (!p.enabled) return;
    var now = nowHM();
    Store.state.breakSettings.forEach(function (brk) {
      var rt = minusMinutes(brk.scheduled_time, p.leadMinutes);
      var key = TODAY_ISO + '-' + brk.id;
      if (now === rt && !_fired[key]) { _fired[key] = true; showBreakReminder(brk); }
    });
  }
  function clockCard() {
    var uid = actingEmployeeId();
    var todaySched = schedFor(uid).find(function (s) { return s.date === TODAY_ISO; });
    var todayAtt = attFor(uid).find(function (a) { return a.date === TODAY_ISO; });
    var card = el('div', 'card');
    card.innerHTML = '<div class="card-head"><h3>Time clock</h3><span class="muted">' + esc(fmtDateDow(TODAY_ISO)) + '</span></div>';
    var panel = el('div', 'clock-panel');
    panel.innerHTML = '<div class="clock-now">' + clockString() + '</div>';
    var right = el('div'); right.style.flex = '1';
    if (!todaySched) { right.innerHTML = '<p class="muted">No shift scheduled today.</p>'; }
    else if (!todayAtt || (!todayAtt.clock_in && todayAtt.status !== 'absent')) {
      right.innerHTML = '<p class="muted">Scheduled ' + fmtRange(todaySched.shift_start, todaySched.shift_end) + '. Not clocked in yet.</p>';
      var b = el('button', 'btn btn-primary', 'Clock in'); b.onclick = function () { clockIn(uid); navigate('dashboard'); }; right.appendChild(b);
    } else if (todayAtt.clock_in && !todayAtt.clock_out) {
      right.innerHTML = '<p class="muted">Clocked in at <b>' + fmtTime(todayAtt.clock_in) + '</b>.</p>';
      var b2 = el('button', 'btn btn-danger', 'Clock out'); b2.onclick = function () { clockOut(uid); navigate('dashboard'); }; right.appendChild(b2);
    } else { right.innerHTML = '<p class="muted">Done — ' + fmtTime(todayAtt.clock_in) + ' → ' + fmtTime(todayAtt.clock_out) + ' ' + badge(todayAtt.status) + '</p>'; }
    panel.appendChild(right); card.appendChild(panel); return card;
  }
  function clockIn(uid) {
    var att = Store.state.attendance.find(function (a) { return a.user_id === uid && a.date === TODAY_ISO; });
    var sched = schedFor(uid).find(function (s) { return s.date === TODAY_ISO; });
    var late = sched && nowHM() > sched.shift_start;
    if (att) { att.clock_in = nowHM(); att.status = late ? 'late' : 'present'; }
    else Store.state.attendance.push({ id: Store.nextId(Store.state.attendance), user_id: uid, date: TODAY_ISO, clock_in: nowHM(), clock_out: null, status: late ? 'late' : 'present', overtime_hours: '0' });
    Store.save(); toast('Clocked in at ' + fmtTime(nowHM()));
  }
  function clockOut(uid) { var att = Store.state.attendance.find(function (a) { return a.user_id === uid && a.date === TODAY_ISO; }); if (att) { att.clock_out = nowHM(); Store.save(); toast('Clocked out at ' + fmtTime(nowHM())); } }

  /* ---------- Schedule ---------- */
  function viewSchedule(v) {
    var mgr = isManager();
    v.appendChild(el('p', 'muted', (mgr ? 'Team schedule' : 'My schedule') + ' for this week · week starts <b>' + esc(S().weekStart) + '</b> · <button class="link-btn" id="go-set">change in Settings</button>'));
    $('#go-set', v).onclick = function () { navigate('settings'); };
    var uid = actingEmployeeId();
    var mine = schedFor(uid);
    var grid = el('div', 'week-grid'); grid.style.marginTop = '16px';
    week().forEach(function (day) {
      var sched = mine.find(function (s) { return s.date === day.date; });
      var card = el('div', 'day-card' + (day.date === TODAY_ISO ? ' today' : '') + (sched ? '' : ' off'));
      card.innerHTML = '<div class="day-card-head"><div class="dow">' + DOW_NAMES[day.dow].slice(0, 3) + (day.date === TODAY_ISO ? ' · Today' : '') + '</div><div class="dom">' + fmtDate(day.date).replace(/,?\s*\d{4}$/, '') + '</div></div>';
      var body = el('div', 'day-card-body');
      if (sched) body.innerHTML = '<div class="shift-time">' + fmtRange(sched.shift_start, sched.shift_end) + '</div>' +
        '<div class="break-line"><span>Break 1</span><span>' + fmtRange(sched.break1_start, sched.break1_end) + '</span></div>' +
        '<div class="break-line"><span>Lunch</span><span>' + fmtRange(sched.lunch_start, sched.lunch_end) + '</span></div>' +
        '<div class="break-line"><span>Break 2</span><span>' + fmtRange(sched.break2_start, sched.break2_end) + '</span></div>';
      else body.innerHTML = '<div class="day-off">Day off</div>';
      if (mgr) { var eb = el('button', 'btn btn-ghost btn-sm', 'Edit'); eb.style.marginTop = '4px'; eb.onclick = (function (d) { return function () { openDayEdit(d); }; })(day.date); body.appendChild(eb); }
      card.appendChild(body); grid.appendChild(card);
    });
    v.appendChild(grid);

    // Company break schedule (everyone can view; managers can edit)
    v.appendChild(el('h3', 'section-title', 'Company break schedule'));
    var bcard = el('div', 'card');
    var list = el('div', 'list');
    Store.state.breakSettings.forEach(function (b) {
      var row = el('div', 'list-item');
      row.innerHTML = '<div class="li-ico tint-blue">☕</div><div class="li-body"><div class="li-title">' + esc(b.label) + ' ' + badge(b.duration_min + ' min', 'b-muted') + '</div><div class="li-meta">Scheduled at ' + esc(b.scheduled_time) + '</div></div>';
      if (mgr) { var eb = el('button', 'btn btn-ghost btn-sm', 'Edit'); eb.onclick = (function (br) { return function () { var t = prompt('Scheduled time (HH:MM):', br.scheduled_time); if (t) { br.scheduled_time = t; Store.save(); toast('Break updated'); navigate('schedule'); } }; })(b); row.appendChild(eb); }
      list.appendChild(row);
    });
    bcard.appendChild(list); v.appendChild(bcard);
  }
  function openDayEdit(date) {
    var existing = Store.state.schedules.filter(function (s) { return s.date === date; });
    var base = existing[0] || { shift_start: S().defaultShift.start, shift_end: S().defaultShift.end, break1_start: '10:30', break1_end: '10:45', lunch_start: '13:00', lunch_end: '14:00', break2_start: '15:30', break2_end: '15:45' };
    function tf(lbl, name) { return '<label>' + lbl + '<input type="time" name="' + name + '" value="' + base[name] + '"></label>'; }
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3>Edit day — ' + esc(fmtDate(date)) + '</h3><form class="form" id="def">' +
      '<div class="row">' + tf('Shift start', 'shift_start') + tf('Shift end', 'shift_end') + '</div>' +
      '<div class="row">' + tf('Break 1 start', 'break1_start') + tf('Break 1 end', 'break1_end') + '</div>' +
      '<div class="row">' + tf('Lunch start', 'lunch_start') + tf('Lunch end', 'lunch_end') + '</div>' +
      '<div class="row">' + tf('Break 2 start', 'break2_start') + tf('Break 2 end', 'break2_end') + '</div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $('#def', ov).onsubmit = function (e) {
      e.preventDefault(); var f = new FormData(e.target);
      var fields = ['shift_start', 'shift_end', 'break1_start', 'break1_end', 'lunch_start', 'lunch_end', 'break2_start', 'break2_end'];
      var targets = existing;
      if (!targets.length) { // create for the whole team on this day
        teamIds().forEach(function (uid) { var rec = { id: Store.nextId(Store.state.schedules), user_id: uid, date: date, published: true }; Store.state.schedules.push(rec); targets.push(rec); });
      }
      targets.forEach(function (s) { fields.forEach(function (k) { s[k] = f.get(k); }); s.published = true; });
      Store.save(); close(); toast('Schedule updated');
      pushNotif('Schedule updated', 'Your shift/breaks on ' + fmtDate(date) + ' were updated by ' + currentUser.name + '.', 'shift');
      navigate('schedule');
    };
  }

  /* ---------- Attendance ---------- */
  function lateMinutes(att) {
    if (!att || !att.clock_in) return 0;
    var sched = Store.state.schedules.find(function (s) { return s.user_id === att.user_id && s.date === att.date; });
    if (!sched) return 0;
    var toMin = function (t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); };
    return Math.max(0, toMin(att.clock_in) - toMin(sched.shift_start));
  }
  function viewAttendance(v) {
    var mgr = isManager();
    v.appendChild(clockCard());
    v.appendChild(el('h3', 'section-title', mgr ? 'Team attendance' : 'My attendance'));
    var rows = Store.state.attendance.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || a.user_id - b.user_id; });
    if (!mgr) rows = rows.filter(function (a) { return a.user_id === actingEmployeeId(); });
    var card = el('div', 'card'); card.style.padding = '0';
    if (!rows.length) { card.innerHTML = '<div class="empty"><div class="empty-ico">⏱️</div>No records.</div>'; }
    else {
      var w = el('div', 'table-wrap'); w.style.border = 'none';
      w.innerHTML = '<table><thead><tr><th>Employee</th><th>Date</th><th>Clock in</th><th>Clock out</th><th>Status</th><th>Overtime</th></tr></thead><tbody>' +
        rows.map(function (a) { var u = userById(a.user_id); var lm = lateMinutes(a); return '<tr data-att="' + a.id + '" style="cursor:pointer"><td>' + (u ? esc(fullName(u)) : '—') + '</td><td>' + esc(fmtDateDow(a.date)) + '</td><td>' + fmtTime(a.clock_in) + (lm > 0 ? ' <span class="badge b-amber">+' + lm + 'm</span>' : '') + '</td><td>' + fmtTime(a.clock_out) + '</td><td>' + badge(a.status) + '</td><td>' + (a.overtime_hours && a.overtime_hours !== '0' ? esc(a.overtime_hours) + ' h' : '—') + '</td></tr>'; }).join('') + '</tbody></table>';
      card.appendChild(w);
    }
    v.appendChild(card);
    v.querySelectorAll('[data-att]').forEach(function (r) { r.onclick = function () { openAttendanceDetail(Store.state.attendance.find(function (x) { return x.id === +r.dataset.att; })); }; });
  }
  function openAttendanceDetail(a) {
    var u = userById(a.user_id); var mgr = isManager();
    var sched = Store.state.schedules.find(function (s) { return s.user_id === a.user_id && s.date === a.date; });
    var lm = lateMinutes(a);
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3>Attendance ' + badge(a.status) + '</h3><div class="detail">' +
      '<div class="det-row"><span>Employee</span><b>' + (u ? esc(fullName(u)) : '—') + '</b></div>' +
      '<div class="det-row"><span>Date</span><b>' + esc(fmtDateDow(a.date)) + '</b></div>' +
      '<div class="det-row"><span>Original shift</span><b>' + (sched ? fmtRange(sched.shift_start, sched.shift_end) : '—') + '</b></div>' +
      '<div class="det-row"><span>Actual clock in</span><b>' + fmtTime(a.clock_in) + '</b></div>' +
      '<div class="det-row"><span>Actual clock out</span><b>' + fmtTime(a.clock_out) + '</b></div>' +
      '<div class="det-row"><span>Late by</span><b>' + (lm > 0 ? lm + ' minutes' : 'On time') + '</b></div>' +
      '<div class="det-row"><span>Overtime</span><b>' + (a.overtime_hours && a.overtime_hours !== '0' ? esc(a.overtime_hours) + ' h' : '—') + '</b></div>' +
      '</div>' +
      '<div class="form-actions" style="margin-top:16px">' +
        (mgr && lm > 0 ? '<button class="btn btn-primary" data-notify>Notify employee (late ' + lm + 'm)</button>' : '') +
        '<button class="btn btn-ghost" data-x>Close</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    if (ov.querySelector('[data-notify]')) ov.querySelector('[data-notify]').onclick = function () {
      pushNotif('Late arrival', (u ? u.first_name : 'You') + ' clocked in ' + lm + ' minutes late on ' + fmtDate(a.date) + '.', 'system');
      close(); toast('Late notification sent');
    };
    loc();
  }

  /* ---------- Leave ---------- */
  function leaveOverlaps() {
    var live = Store.state.leaveRequests.filter(function (l) { return l.status !== 'rejected'; });
    var pairs = [];
    for (var i = 0; i < live.length; i++) for (var j = i + 1; j < live.length; j++) {
      var a = live[i], b = live[j];
      if (a.user_id !== b.user_id && a.start_date <= b.end_date && b.start_date <= a.end_date) pairs.push([a, b]);
    }
    return pairs;
  }
  function viewLeave(v) {
    var mgr = isManager();
    var tb = el('div', 'toolbar', '<div class="spacer"></div>');
    var add = el('button', 'btn btn-primary', '+ Request leave'); add.onclick = openLeaveModal; tb.appendChild(add); v.appendChild(tb);

    if (mgr) {
      var ov = leaveOverlaps();
      if (ov.length) {
        var names = {};
        ov.forEach(function (p) { p.forEach(function (l) { var u = userById(l.user_id); names[l.user_id] = u ? fullName(u) : 'Employee'; }); });
        var banner = el('div', 'pay-note'); banner.style.margin = '0 0 16px';
        banner.innerHTML = '⚠ <b>Overlapping leave:</b> ' + ov.length + ' overlap' + (ov.length > 1 ? 's' : '') + ' detected between ' + Object.keys(names).map(function (k) { return esc(names[k]); }).join(', ') + '. Review before approving.';
        v.appendChild(banner);
      }
    }

    var rows = Store.state.leaveRequests.slice().sort(function (a, b) { return b.start_date.localeCompare(a.start_date); });
    if (!mgr) rows = rows.filter(function (l) { return l.user_id === actingEmployeeId(); });
    var card = el('div', 'card'); card.style.padding = '0';
    if (!rows.length) card.innerHTML = '<div class="empty"><div class="empty-ico">🌴</div>No leave requests.</div>';
    else {
      var w = el('div', 'table-wrap'); w.style.border = 'none';
      w.innerHTML = '<table><thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Status</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
        rows.map(function (l) {
          var u = userById(l.user_id);
          var act = mgr && l.status === 'pending' ? '<button class="btn btn-success btn-sm" data-ok="' + l.id + '">Approve</button> <button class="btn btn-ghost btn-sm" data-no="' + l.id + '">Reject</button>' : '';
          return '<tr data-row="' + l.id + '" style="cursor:pointer"><td>' + (u ? esc(fullName(u)) : 'You') + '</td><td style="text-transform:capitalize">' + esc(l.leave_type) + '</td><td>' + esc(fmtDate(l.start_date)) + '</td><td>' + esc(fmtDate(l.end_date)) + '</td><td>' + badge(l.status) + '</td>' + (mgr ? '<td>' + act + '</td>' : '') + '</tr>';
        }).join('') + '</tbody></table>';
      card.appendChild(w);
    }
    v.appendChild(card);
    v.querySelectorAll('[data-row]').forEach(function (r) { r.onclick = function (e) { if (e.target.closest('[data-ok],[data-no]')) return; openLeaveDetail(Store.state.leaveRequests.find(function (x) { return x.id === +r.dataset.row; })); }; });
    v.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); decide(+b.dataset.ok, 'approved'); }; });
    v.querySelectorAll('[data-no]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); decide(+b.dataset.no, 'rejected'); }; });
  }
  function openLeaveDetail(l) {
    var u = userById(l.user_id); var mgr = isManager();
    var ov = el('div', 'modal-overlay');
    var rev = l.reviewed_at ? ('<div class="det-row"><span>Reviewed</span><b>' + esc(l.status) + ' by ' + esc(l.reviewed_by || '—') + ' on ' + esc(fmtDate(l.reviewed_at)) + '</b></div>') : '';
    ov.innerHTML = '<div class="modal"><h3>Leave request ' + badge(l.status) + '</h3><div class="detail">' +
      '<div class="det-row"><span>Employee</span><b>' + (u ? esc(fullName(u)) : 'You') + '</b></div>' +
      '<div class="det-row"><span>Type</span><b style="text-transform:capitalize">' + esc(l.leave_type) + '</b></div>' +
      '<div class="det-row"><span>From</span><b>' + esc(fmtDate(l.start_date)) + '</b></div>' +
      '<div class="det-row"><span>To</span><b>' + esc(fmtDate(l.end_date)) + '</b></div>' +
      '<div class="det-row"><span>Reason</span><b>' + esc(l.reason || '—') + '</b></div>' +
      '<div class="det-row"><span>Submitted</span><b>' + esc(l.created_at ? fmtDate(l.created_at) : '—') + '</b></div>' + rev +
      '</div>' +
      (mgr && l.status === 'pending' ? '<div class="form-actions" style="margin-top:16px"><button class="btn btn-success" data-a>Approve</button><button class="btn btn-ghost" data-r>Reject</button></div>'
        : '<div class="form-actions" style="margin-top:16px"><button class="btn btn-ghost" data-x>Close</button></div>') + '</div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    if (ov.querySelector('[data-x]')) ov.querySelector('[data-x]').onclick = close;
    if (ov.querySelector('[data-a]')) ov.querySelector('[data-a]').onclick = function () { close(); decide(l.id, 'approved'); };
    if (ov.querySelector('[data-r]')) ov.querySelector('[data-r]').onclick = function () { close(); decide(l.id, 'rejected'); };
    ov.onclick = function (e) { if (e.target === ov) close(); };
    loc();
  }

  /* ---------- Shift swaps ---------- */
  function viewSwaps(v) {
    var mgr = isManager();
    var tb = el('div', 'toolbar', '<div class="spacer"></div>');
    var add = el('button', 'btn btn-primary', mgr ? '+ New swap (no approval)' : '+ Request a swap');
    add.onclick = function () { openSwapModal(mgr); }; tb.appendChild(add); v.appendChild(tb);
    var rows = Store.state.shiftSwaps.slice().sort(function (a, b) { return b.id - a.id; });
    if (!mgr) rows = rows.filter(function (s) { return s.requester_id === actingEmployeeId(); });
    var card = el('div', 'card'); card.style.padding = '0';
    if (!rows.length) card.innerHTML = '<div class="empty"><div class="empty-ico">🔁</div>No shift swap requests.</div>';
    else {
      var w = el('div', 'table-wrap'); w.style.border = 'none';
      w.innerHTML = '<table><thead><tr><th>Employee</th><th>Shift date</th><th>Reason</th><th>Status</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
        rows.map(function (s) {
          var u = userById(s.requester_id);
          var act = mgr && s.status === 'pending' ? '<button class="btn btn-success btn-sm" data-ok="' + s.id + '">Confirm</button> <button class="btn btn-ghost btn-sm" data-no="' + s.id + '">Reject</button>' : '';
          return '<tr data-swap="' + s.id + '" style="cursor:pointer"><td>' + (u ? esc(fullName(u)) : 'You') + '</td><td>' + esc(fmtDate(s.date)) + '</td><td class="muted">' + esc(s.reason || '—') + '</td><td>' + badge(s.status) + '</td>' + (mgr ? '<td>' + act + '</td>' : '') + '</tr>';
        }).join('') + '</tbody></table>';
      card.appendChild(w);
    }
    v.appendChild(card);
    v.querySelectorAll('[data-swap]').forEach(function (r) { r.onclick = function (e) { if (e.target.closest('[data-ok],[data-no]')) return; openSwapDetail(Store.state.shiftSwaps.find(function (x) { return x.id === +r.dataset.swap; })); }; });
    v.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); decideSwap(+b.dataset.ok, 'approved'); }; });
    v.querySelectorAll('[data-no]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); decideSwap(+b.dataset.no, 'rejected'); }; });
  }
  /* push a global notification (shown in the bell drawer for all users) */
  function pushNotif(title, message, type) {
    Store.state.notifications.unshift({ id: Store.nextId(Store.state.notifications), title: title, message: message, type: type || 'system', is_read: false });
    Store.save(); updateNotifBadge();
  }
  function decideSwap(id, status) {
    var s = Store.state.shiftSwaps.find(function (x) { return x.id === id; });
    if (s) {
      s.status = status; s.reviewed_by = currentUser.name; s.reviewed_at = TODAY_ISO; Store.save();
      var u = userById(s.requester_id);
      pushNotif('Shift swap ' + status, (u ? u.first_name + "'s" : 'Your') + ' swap for ' + fmtDate(s.date) + ' was ' + status + ' by ' + currentUser.name + '.', 'shift');
      toast(status === 'approved' ? 'Swap confirmed' : 'Swap rejected'); navigate('swaps');
    }
  }
  function teamIds() { var ids = Store.state.users.filter(function (u) { return u.team_id === 4 && u.role === 'employee'; }).map(function (u) { return u.id; }); return ids.length ? ids : [10, 14, 15, 16]; }
  function empName(id) { var u = userById(id); return u ? fullName(u) : ('#' + id); }
  function openSwapModal(asManager) {
    var TEAM_IDS = teamIds();
    var st = { requester: asManager ? TEAM_IDS[0] : actingEmployeeId(), date: '', target: 0 };
    var ov = el('div', 'modal-overlay'); var card = el('div', 'modal');
    var close = function () { ov.remove(); };
    function render() {
      var mine = schedFor(st.requester);
      if (!st.date && mine[0]) st.date = mine[0].date;
      var mates = TEAM_IDS.filter(function (id) { return id !== st.requester; });
      if (!st.target) st.target = mates[0];
      var dateOpts = mine.map(function (s) { return '<option value="' + s.date + '"' + (s.date === st.date ? ' selected' : '') + '>' + fmtDateDow(s.date) + ' · ' + fmtRange(s.shift_start, s.shift_end) + '</option>'; }).join('') || '<option value="">No upcoming shifts</option>';
      var mateOpts = mates.map(function (id) { return '<option value="' + id + '"' + (id === st.target ? ' selected' : '') + '>' + esc(empName(id)) + '</option>'; }).join('');
      var rSch = schedFor(st.requester).find(function (s) { return s.date === st.date; });
      var tSch = schedFor(st.target).find(function (s) { return s.date === st.date; });
      var brk = function (s) { return s ? (fmtRange(s.break1_start, s.break1_end) + ', ' + fmtRange(s.lunch_start, s.lunch_end) + ', ' + fmtRange(s.break2_start, s.break2_end)) : '—'; };
      card.innerHTML = '<h3>' + (asManager ? 'Create shift swap' : 'Request a shift swap') + '</h3><form class="form" id="swf">' +
        (asManager ? '<label>Employee<select name="requester">' + TEAM_IDS.map(function (id) { return '<option value="' + id + '"' + (id === st.requester ? ' selected' : '') + '>' + esc(empName(id)) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label>Shift to swap<select name="date">' + dateOpts + '</select></label>' +
        '<label>Swap with (same team)<select name="target">' + mateOpts + '</select></label>' +
        '<div class="detail" style="background:var(--surface-2);border-radius:10px;padding:12px">' +
          '<div class="det-row"><span>' + esc(empName(st.requester)) + '</span><b>' + (rSch ? fmtRange(rSch.shift_start, rSch.shift_end) : '—') + '</b></div>' +
          '<div class="det-row"><span>Breaks</span><b style="font-weight:500">' + brk(rSch) + '</b></div>' +
          '<div class="det-row"><span>' + esc(empName(st.target)) + '</span><b>' + (tSch ? fmtRange(tSch.shift_start, tSch.shift_end) : '—') + '</b></div>' +
          '<div class="det-row"><span>Breaks</span><b style="font-weight:500">' + brk(tSch) + '</b></div>' +
        '</div>' +
        '<label>Reason<textarea name="reason" rows="2" placeholder="Optional"></textarea></label>' +
        '<div class="form-actions"><button class="btn btn-primary" type="submit">' + (asManager ? 'Create swap' : 'Submit') + '</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form>';
      if (asManager) card.querySelector('select[name=requester]').onchange = function (e) { st.requester = +e.target.value; st.date = ''; st.target = 0; render(); };
      card.querySelector('select[name=date]').onchange = function (e) { st.date = e.target.value; render(); };
      card.querySelector('select[name=target]').onchange = function (e) { st.target = +e.target.value; render(); };
      card.querySelector('[data-x]').onclick = close;
      card.querySelector('#swf').onsubmit = function (e) {
        e.preventDefault(); var f = new FormData(e.target);
        Store.state.shiftSwaps.push({ id: Store.nextId(Store.state.shiftSwaps), requester_id: st.requester, target_user_id: +st.target, date: st.date, reason: f.get('reason') || null, status: asManager ? 'approved' : 'pending', reviewed_by: asManager ? currentUser.name : null, reviewed_at: asManager ? TODAY_ISO : null, created_at: TODAY_ISO });
        Store.save(); close();
        if (asManager) { pushNotif('Shift swap created', empName(st.requester) + ' ↔ ' + empName(st.target) + ' swapped shifts on ' + fmtDate(st.date) + ' (by ' + currentUser.name + ').', 'shift'); toast('Swap created'); }
        else toast('Swap request submitted');
        navigate('swaps');
      };
      loc();
    }
    ov.appendChild(card); document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) close(); };
    render();
  }
  function openSwapDetail(s) {
    var r = userById(s.requester_id), t = s.target_user_id ? userById(s.target_user_id) : null;
    var rSch = schedFor(s.requester_id).find(function (x) { return x.date === s.date; });
    var tSch = s.target_user_id ? schedFor(s.target_user_id).find(function (x) { return x.date === s.date; }) : null;
    var brk = function (sc) { return sc ? (fmtRange(sc.break1_start, sc.break1_end) + ' / ' + fmtRange(sc.lunch_start, sc.lunch_end) + ' / ' + fmtRange(sc.break2_start, sc.break2_end)) : '—'; };
    var ov = el('div', 'modal-overlay');
    var rev = s.reviewed_at ? '<div class="det-row"><span>Decision</span><b>' + esc(s.status) + ' by ' + esc(s.reviewed_by || '—') + ' on ' + esc(fmtDate(s.reviewed_at)) + '</b></div>' : '';
    ov.innerHTML = '<div class="modal"><h3>Shift swap ' + badge(s.status) + '</h3><div class="detail">' +
      '<div class="det-row"><span>Date</span><b>' + esc(fmtDate(s.date)) + '</b></div>' +
      '<div class="det-row"><span>Requester</span><b>' + (r ? esc(fullName(r)) : '—') + '</b></div>' +
      '<div class="det-row"><span>' + (r ? esc(r.first_name) : '') + ' shift</span><b>' + (rSch ? fmtRange(rSch.shift_start, rSch.shift_end) : '—') + '</b></div>' +
      '<div class="det-row"><span>' + (r ? esc(r.first_name) : '') + ' breaks</span><b style="font-weight:500">' + brk(rSch) + '</b></div>' +
      (t ? '<div class="det-row"><span>Swap with</span><b>' + esc(fullName(t)) + '</b></div>' +
        '<div class="det-row"><span>' + esc(t.first_name) + ' shift</span><b>' + (tSch ? fmtRange(tSch.shift_start, tSch.shift_end) : '—') + '</b></div>' +
        '<div class="det-row"><span>' + esc(t.first_name) + ' breaks</span><b style="font-weight:500">' + brk(tSch) + '</b></div>' : '') +
      '<div class="det-row"><span>Reason</span><b>' + esc(s.reason || '—') + '</b></div>' + rev +
      '</div><div class="form-actions" style="margin-top:16px">' +
      (isManager() && s.status === 'pending' ? '<button class="btn btn-success" data-a>Confirm</button><button class="btn btn-ghost" data-r>Reject</button>' : '<button class="btn btn-ghost" data-x>Close</button>') + '</div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    if (ov.querySelector('[data-x]')) ov.querySelector('[data-x]').onclick = close;
    if (ov.querySelector('[data-a]')) ov.querySelector('[data-a]').onclick = function () { close(); decideSwap(s.id, 'approved'); };
    if (ov.querySelector('[data-r]')) ov.querySelector('[data-r]').onclick = function () { close(); decideSwap(s.id, 'rejected'); };
    ov.onclick = function (e) { if (e.target === ov) close(); };
    loc();
  }
  function decide(id, status) {
    var l = Store.state.leaveRequests.find(function (x) { return x.id === id; });
    if (l) {
      l.status = status; l.reviewed_by = currentUser.name; l.reviewed_at = TODAY_ISO; Store.save();
      var u = userById(l.user_id);
      pushNotif('Leave ' + status, (u ? u.first_name + "'s" : 'Your') + ' leave (' + fmtDate(l.start_date) + ' – ' + fmtDate(l.end_date) + ') was ' + status + ' by ' + currentUser.name + '.', 'leave');
      toast('Request ' + status); navigate('leave');
    }
  }
  function openLeaveModal() {
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3>Request leave</h3><form class="form" id="lf">' +
      '<label>Type<select name="leave_type"><option value="annual">Annual</option><option value="sick">Sick</option><option value="personal">Personal</option><option value="unpaid">Unpaid</option></select></label>' +
      '<div class="row"><label>Start<input type="date" name="start_date" required></label><label>End<input type="date" name="end_date" required></label></div>' +
      '<label>Reason<textarea name="reason" rows="2" placeholder="Optional"></textarea></label>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Submit</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $('#lf', ov).onsubmit = function (e) {
      e.preventDefault(); var f = new FormData(e.target);
      if (f.get('end_date') < f.get('start_date')) { toast('End must be after start'); return; }
      Store.state.leaveRequests.push({ id: Store.nextId(Store.state.leaveRequests), user_id: actingEmployeeId(), start_date: f.get('start_date'), end_date: f.get('end_date'), leave_type: f.get('leave_type'), reason: f.get('reason') || null, status: 'pending', reviewed_by: null, created_at: TODAY_ISO });
      Store.save(); close(); toast('Leave request submitted'); navigate('leave');
    };
  }

  /* ---------- Break reminders (customizable, tied to the break schedule) ---------- */
  function viewReminders(v) {
    var draft = Object.assign({}, reminderPrefs());
    v.appendChild(el('p', 'muted', 'Get a heads-up before each break. Reminders follow your company break schedule automatically (' + Store.state.breakSettings.length + ' breaks).'));

    // computed reminder times from the live break schedule
    var schedCard = el('div', 'card'); schedCard.style.marginTop = '16px';
    schedCard.innerHTML = '<div class="card-head"><h3>Your break reminders</h3></div>';
    var list = el('div', 'list');
    function renderList() {
      list.innerHTML = '';
      Store.state.breakSettings.forEach(function (b) {
        var rt = minusMinutes(b.scheduled_time, draft.leadMinutes);
        list.appendChild(el('div', 'list-item', '<div class="li-ico tint-blue">☕</div><div class="li-body"><div class="li-title">' + esc(b.label) + ' — ' + esc(b.scheduled_time) + '</div><div class="li-meta">Reminder at <b>' + esc(rt) + '</b> (' + draft.leadMinutes + ' min before)</div></div>'));
      });
      loc();
    }
    schedCard.appendChild(list); v.appendChild(schedCard);

    // settings
    var card = el('div', 'card'); card.style.marginTop = '16px';
    card.innerHTML = '<div class="card-head"><h3>Reminder settings</h3></div>';
    var g = el('div', 'settings-grid');
    function row(label, desc, ctrl) { var r = el('div', 'setting-row'); r.innerHTML = '<div><div class="s-label">' + label + '</div><div class="s-desc">' + desc + '</div></div>'; var c = el('div'); c.appendChild(ctrl); r.appendChild(c); return r; }
    function seg(opts, val, on) { var s = el('div', 'seg'); opts.forEach(function (o) { var b = el('button', String(o.v) === String(val) ? 'active' : '', o.label); b.onclick = function () { s.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); on(o.v); }; s.appendChild(b); }); return s; }

    g.appendChild(row('Reminders', 'Turn break reminders on or off.',
      seg([{ v: 'on', label: 'On' }, { v: 'off', label: 'Off' }], draft.enabled ? 'on' : 'off', function (val) { draft.enabled = val === 'on'; })));
    g.appendChild(row('Remind me before', 'How far ahead of each break to remind you.',
      seg([{ v: 5, label: '5 min' }, { v: 10, label: '10 min' }, { v: 15, label: '15 min' }], draft.leadMinutes, function (val) { draft.leadMinutes = +val; renderList(); })));
    g.appendChild(row('Notification tone', 'Sound played when a reminder fires.',
      (function () {
        var wrap = el('div'); wrap.style.display = 'flex'; wrap.style.gap = '8px';
        var sel = el('select'); TONES.forEach(function (t) { var o = el('option', '', t.label); o.value = t.v; if (t.v === draft.tone) o.selected = true; sel.appendChild(o); });
        sel.onchange = function () { draft.tone = sel.value; };
        var prev = el('button', 'btn btn-ghost btn-sm', '▶ Preview'); prev.type = 'button'; prev.onclick = function () { playTone(sel.value); };
        wrap.appendChild(sel); wrap.appendChild(prev); sel.style.flex = '1'; return wrap;
      })()));
    g.appendChild(row('Snooze time', 'How long “Snooze” postpones a reminder.',
      seg([{ v: 5, label: '5 min' }, { v: 10, label: '10 min' }, { v: 15, label: '15 min' }], draft.snoozeMinutes, function (val) { draft.snoozeMinutes = +val; })));

    card.appendChild(g); v.appendChild(card);

    var actions = el('div', 'form-actions'); actions.style.marginTop = '18px';
    var save = el('button', 'btn btn-primary', 'Save changes');
    save.onclick = function () { currentUser.reminders = Object.assign({}, draft); Store.save(); _fired = {}; startReminderScheduler(); toast('Reminder settings saved'); navigate('reminders'); };
    var test = el('button', 'btn btn-ghost', '🔔 Test reminder now');
    test.onclick = function () { var b = Store.state.breakSettings[0] || { label: 'Break', scheduled_time: '10:30' }; currentUser.reminders = Object.assign({}, draft); showBreakReminder(b); };
    actions.appendChild(save); actions.appendChild(test); v.appendChild(actions);

    renderList();
  }

  /* ---------- Announcements ---------- */
  function viewAnnouncements(v) {
    var mgr = isManager();
    if (mgr) {
      var tb = el('div', 'toolbar', '<div class="spacer"></div>');
      var add = el('button', 'btn btn-primary', '+ New announcement'); add.onclick = function () { openAnnModal(null); }; tb.appendChild(add); v.appendChild(tb);
    }
    var list = el('div', 'list');
    Store.state.announcements.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).forEach(function (a) {
      var item = el('div', 'list-item');
      item.style.cursor = 'pointer';
      var actions = mgr ? '<div class="li-actions"><button class="btn btn-ghost btn-sm" data-edit="' + a.id + '">Edit</button> <button class="btn btn-ghost btn-sm" data-del="' + a.id + '">Delete</button></div>' : '';
      item.innerHTML = '<div class="li-ico ' + priorityTint(a.priority) + '">📣</div><div class="li-body"><div class="li-title">' + esc(a.title) + ' ' + badge(a.priority, priorityCls(a.priority)) + '</div><div class="li-desc">' + esc(a.description) + '</div><div class="li-meta">' + esc(fmtDate(a.date)) + ' · ' + esc(a.author) + '</div></div>' + actions;
      item.onclick = function (e) { if (e.target.closest('[data-edit],[data-del]')) return; openAnnDetail(a); };
      list.appendChild(item);
    });
    v.appendChild(list);
    v.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAnnModal(Store.state.announcements.find(function (x) { return x.id === +b.dataset.edit; })); }; });
    v.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); if (confirm('Delete this announcement?')) { Store.state.announcements = Store.state.announcements.filter(function (x) { return x.id !== +b.dataset.del; }); Store.save(); toast('Announcement deleted'); navigate('announcements'); } }; });
  }
  function openAnnDetail(a) {
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3>' + esc(a.title) + ' ' + badge(a.priority, priorityCls(a.priority)) + '</h3>' +
      '<p style="color:var(--ink-2);line-height:1.6">' + esc(a.description) + '</p>' +
      '<p class="muted" style="margin-top:14px;font-size:13px">Posted ' + esc(fmtDate(a.date)) + ' by ' + esc(a.author) + '</p>' +
      '<div class="form-actions" style="margin-top:16px"><button class="btn btn-ghost" type="button" data-x>Close</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    loc();
  }
  function openAnnModal(existing) {
    var ov = el('div', 'modal-overlay');
    var g = function (k, d) { return existing ? esc(existing[k]) : (d || ''); };
    ov.innerHTML = '<div class="modal"><h3>' + (existing ? 'Edit announcement' : 'New announcement') + '</h3><form class="form" id="af">' +
      '<label>Title<input name="title" value="' + g('title') + '" required></label><label>Description<textarea name="description" rows="3" required>' + g('description') + '</textarea></label>' +
      '<div class="row"><label>Priority<select name="priority">' + ['low', 'medium', 'high', 'urgent'].map(function (p) { return '<option' + (existing && existing.priority === p ? ' selected' : (!existing && p === 'medium' ? ' selected' : '')) + '>' + p + '</option>'; }).join('') + '</select></label>' +
      '<label>Date<input type="date" name="date" value="' + (existing ? existing.date : TODAY_ISO) + '" required></label></div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">' + (existing ? 'Save' : 'Post') + '</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $('#af', ov).onsubmit = function (e) {
      e.preventDefault(); var f = new FormData(e.target);
      if (existing) { existing.title = f.get('title'); existing.description = f.get('description'); existing.priority = f.get('priority'); existing.date = f.get('date'); }
      else { Store.state.announcements.push({ id: Store.nextId(Store.state.announcements), title: f.get('title'), description: f.get('description'), priority: f.get('priority'), date: f.get('date'), author: currentUser.name }); }
      Store.save(); close(); toast(existing ? 'Announcement updated' : 'Announcement posted'); navigate('announcements');
    };
    loc();
  }

  /* ---------- Team ---------- */
  function teamNameById(id) { var t = Store.state.teams.find(function (x) { return x.id === id; }); return t ? t.name : '—'; }
  function activeMemberEmails() { return Store.state.users.filter(function (u) { return u.team_id; }).map(function (u) { return (u.email || '').toLowerCase(); }); }
  // employees available to add: company accounts + unassigned roster members, not already on a team
  function teamCandidates() {
    var active = activeMemberEmails(); var out = [];
    Store.state.accounts.forEach(function (a) {
      if (a.role === 'employee' && (currentUser.company ? a.company === currentUser.company : true) && active.indexOf(a.email.toLowerCase()) === -1)
        out.push({ name: a.name, email: a.email, kind: 'account', ref: a });
    });
    Store.state.users.forEach(function (u) {
      if (!u.team_id && active.indexOf((u.email || '').toLowerCase()) === -1 && !out.some(function (c) { return c.email && u.email && c.email.toLowerCase() === u.email.toLowerCase(); }))
        out.push({ name: fullName(u), email: u.email, kind: 'user', ref: u });
    });
    return out;
  }
  function addCandidateToTeam(cand, teamId) {
    if (cand.kind === 'user') { cand.ref.team_id = teamId; }
    else {
      var parts = cand.name.trim().split(/\s+/);
      Store.state.users.push({ id: Store.nextId(Store.state.users), employee_id: (cand.ref && cand.ref.employee_id) || ('EMP' + (100 + Store.state.users.length)), first_name: parts[0] || cand.name, last_name: parts.slice(1).join(' ') || '', email: cand.email, role: 'employee', department_id: 3, team_id: teamId, manager_id: 9, status: 'active', joining_date: TODAY_ISO });
    }
    regenerate(Store.state); Store.save();
    pushNotif('Team updated', cand.name + ' was added to ' + teamNameById(teamId) + ' by ' + currentUser.name + '.', 'system');
    toast(cand.name.split(' ')[0] + ' added to ' + teamNameById(teamId));
  }
  function removeFromTeam(u) {
    u.team_id = null; regenerate(Store.state); Store.save();
    pushNotif('Team updated', fullName(u) + ' was removed from the team by ' + currentUser.name + '.', 'system');
    toast(u.first_name + ' removed from team');
  }
  function openEmployeeDetail(u) {
    var acc = Store.state.accounts.find(function (a) { return a.email && u.email && a.email.toLowerCase() === u.email.toLowerCase(); });
    var dept = Store.state.departments.find(function (d) { return d.id === u.department_id; });
    var team = Store.state.teams.find(function (t) { return t.id === u.team_id; });
    var mgrU = userById(u.manager_id);
    var mobile = acc && acc.mobile ? ((acc.mobileCode ? acc.mobileCode + ' ' : '') + acc.mobile) : '—';
    var country = acc && acc.country ? acc.country : '—';
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3><span class="cell-user">' + avatarEl(u) + esc(fullName(u)) + '</span></h3><div class="detail">' +
      '<div class="det-row"><span>Employee ID</span><b>' + esc(u.employee_id) + '</b></div>' +
      '<div class="det-row"><span>Email</span><b>' + esc(u.email || '—') + '</b></div>' +
      '<div class="det-row"><span>Mobile number</span><b>' + esc(mobile) + '</b></div>' +
      '<div class="det-row"><span>Country</span><b>' + esc(country) + '</b></div>' +
      '<div class="det-row"><span>Role</span><b style="text-transform:capitalize">' + esc(u.role) + '</b></div>' +
      '<div class="det-row"><span>Team</span><b>' + (team ? esc(team.name) : 'Unassigned') + '</b></div>' +
      '<div class="det-row"><span>Department</span><b>' + (dept ? esc(dept.name) : '—') + '</b></div>' +
      '<div class="det-row"><span>Manager</span><b>' + (mgrU ? esc(fullName(mgrU)) : '—') + '</b></div>' +
      '<div class="det-row"><span>Joined</span><b>' + esc(u.joining_date ? fmtDate(u.joining_date) : '—') + '</b></div>' +
      '<div class="det-row"><span>Status</span><b>' + badge(u.status) + '</b></div>' +
      '</div><div class="form-actions" style="margin-top:16px"><button class="btn btn-ghost" data-x>Close</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    loc();
  }
  // managers in the same company (grows automatically when someone signs up as a manager)
  function managerAccounts() {
    return Store.state.accounts.filter(function (a) {
      return (a.role === 'manager' || a.role === 'super_admin') && (currentUser.company ? a.company === currentUser.company : true);
    });
  }
  // ensure a manager account has a roster (users) record; returns its user id
  function ensureManagerUser(acc) {
    var u = Store.state.users.find(function (x) { return x.email && acc.email && x.email.toLowerCase() === acc.email.toLowerCase(); });
    if (u) { if (u.role === 'employee') u.role = 'manager'; return u.id; }
    var parts = acc.name.trim().split(/\s+/);
    var nu = { id: Store.nextId(Store.state.users), employee_id: acc.employee_id || ('MGR' + (100 + Store.state.users.length)), first_name: parts[0] || acc.name, last_name: parts.slice(1).join(' ') || '', email: acc.email, role: 'manager', department_id: 3, team_id: null, manager_id: null, status: 'active', joining_date: TODAY_ISO };
    Store.state.users.push(nu); return nu.id;
  }
  function openCreateTeam() {
    var mgrs = managerAccounts();
    var cands = teamCandidates();
    var ov = el('div', 'modal-overlay'); var card = el('div', 'modal');
    var close = function () { ov.remove(); };
    card.innerHTML = '<h3>Create team</h3><form class="form" id="ctf">' +
      '<label>Team name<input name="name" placeholder="e.g. Support Team" required></label>' +
      '<label>Manager<select name="manager">' + (mgrs.length ? mgrs.map(function (m) { return '<option value="' + esc(m.email) + '">' + esc(m.name) + ' · ' + esc(m.role.replace('_', ' ')) + '</option>'; }).join('') : '<option value="">No managers in your company</option>') + '</select></label>' +
      '<label>Employees under this manager (same company)</label>' +
      '<div class="check-grid">' + (cands.length ? cands.map(function (c) { return '<label class="chk"><input type="checkbox" value="' + esc(c.email) + '"> ' + esc(c.name) + '</label>'; }).join('') : '<span class="muted" style="font-size:13px">No unassigned employees available.</span>') + '</div>' +
      '<div class="form-actions"><button class="btn btn-primary" type="submit">Create team</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form>';
    ov.appendChild(card); document.body.appendChild(ov);
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $('#ctf', card).onsubmit = function (e) {
      e.preventDefault(); var f = new FormData(e.target);
      var name = (f.get('name') || '').trim(); if (!name) return;
      var mgrAcc = mgrs.find(function (m) { return m.email === f.get('manager'); });
      var mgrUserId = mgrAcc ? ensureManagerUser(mgrAcc) : null;
      var teamId = Store.nextId(Store.state.teams);
      Store.state.teams.push({ id: teamId, name: name, department_id: 3, manager_id: mgrUserId, manager_name: mgrAcc ? mgrAcc.name : null, max_concurrent_breaks: S().maxConcurrentBreaks });
      [].slice.call(card.querySelectorAll('.check-grid input:checked')).forEach(function (chk) {
        var c = cands.find(function (x) { return x.email === chk.value; }); if (!c) return;
        if (c.kind === 'user') { c.ref.team_id = teamId; c.ref.manager_id = mgrUserId; }
        else { var parts = c.name.trim().split(/\s+/); Store.state.users.push({ id: Store.nextId(Store.state.users), employee_id: (c.ref && c.ref.employee_id) || ('EMP' + (100 + Store.state.users.length)), first_name: parts[0] || c.name, last_name: parts.slice(1).join(' ') || '', email: c.email, role: 'employee', department_id: 3, team_id: teamId, manager_id: mgrUserId, status: 'active', joining_date: TODAY_ISO }); }
      });
      regenerate(Store.state); Store.save(); close();
      pushNotif('Team created', name + ' was created' + (mgrAcc ? ' under ' + mgrAcc.name : '') + ' by ' + currentUser.name + '.', 'system');
      toast('Team “' + name + '” created'); navigate('team');
    };
    loc();
  }
  function openRenameTeam(team) {
    var ov = el('div', 'modal-overlay');
    ov.innerHTML = '<div class="modal"><h3>Rename team</h3><form class="form" id="rtf"><label>Team name<input name="name" value="' + esc(team.name) + '" required></label><div class="form-actions"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-ghost" type="button" data-x>Cancel</button></div></form></div>';
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.querySelector('[data-x]').onclick = close; ov.onclick = function (e) { if (e.target === ov) close(); };
    $('#rtf', ov).onsubmit = function (e) {
      e.preventDefault(); var name = (new FormData(e.target).get('name') || '').trim(); if (!name) return;
      team.name = name; Store.save(); close(); toast('Team renamed'); navigate('team');
    };
    loc();
  }
  function openAddMember(teamId) {
    var ov = el('div', 'modal-overlay'); var card = el('div', 'modal');
    var close = function () { ov.remove(); };
    function render() {
      var cands = teamCandidates();
      card.innerHTML = '<h3>Add member to ' + esc(teamNameById(teamId)) + '</h3><p class="muted" style="margin-bottom:14px">Registered employees at <b>' + esc(currentUser.company || S().companyName) + '</b> who aren\'t on a team.</p>';
      if (!cands.length) { card.innerHTML += '<div class="empty"><div class="empty-ico">👤</div>No available employees to add.</div>'; }
      else {
        var list = el('div', 'list');
        cands.forEach(function (c) {
          var item = el('div', 'list-item');
          item.innerHTML = '<div class="avatar" style="width:36px;height:36px;font-size:13px">' + esc(initials(c.name)) + '</div><div class="li-body"><div class="li-title">' + esc(c.name) + '</div><div class="li-meta">' + esc(c.email || '—') + '</div></div>';
          var b = el('button', 'btn btn-primary btn-sm', 'Add'); b.onclick = function () { addCandidateToTeam(c, teamId); render(); };
          item.appendChild(b); list.appendChild(item);
        });
        card.appendChild(list);
      }
      var actions = el('div', 'form-actions'); actions.style.marginTop = '16px';
      var done = el('button', 'btn btn-ghost', 'Done'); done.onclick = function () { close(); navigate('team'); };
      actions.appendChild(done); card.appendChild(actions);
      loc();
    }
    ov.appendChild(card); document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) close(); };
    render();
  }
  function viewTeam(v) {
    var mgr = isManager();
    var tb = el('div', 'toolbar'); tb.innerHTML = '<div class="spacer"></div>';
    if (mgr) { var ct = el('button', 'btn btn-primary', '+ Create team'); ct.onclick = openCreateTeam; tb.appendChild(ct); }
    v.appendChild(tb);

    Store.state.teams.forEach(function (team) {
      var members = Store.state.users.filter(function (u) { return u.team_id === team.id; });
      var card = el('div', 'card'); card.style.marginBottom = '16px'; card.style.padding = '0';
      var head = el('div', 'card-head'); head.style.padding = '14px 16px'; head.style.margin = '0'; head.style.borderBottom = '1px solid var(--border)';
      var mgrU = team.manager_id ? userById(team.manager_id) : null;
      var mgrLabel = team.manager_name || (mgrU ? fullName(mgrU) : null);
      head.innerHTML = '<div><h3>' + esc(team.name) + ' <span class="badge b-muted">' + members.length + ' members</span></h3>' + (mgrLabel ? '<div class="muted" style="font-size:12.5px;margin-top:2px">Manager: ' + esc(mgrLabel) + '</div>' : '') + '</div>';
      if (mgr) {
        var ha = el('div', 'li-actions');
        var rn = el('button', 'btn btn-ghost btn-sm', 'Rename'); rn.onclick = function () { openRenameTeam(team); };
        var am = el('button', 'btn btn-primary btn-sm', '+ Add member'); am.onclick = function () { openAddMember(team.id); };
        ha.appendChild(rn); ha.appendChild(am); head.appendChild(ha);
      }
      card.appendChild(head);
      if (!members.length) { card.appendChild(el('div', 'empty', '<div class="empty-ico">👥</div>No members yet.')); }
      else {
        var w = el('div', 'table-wrap'); w.style.border = 'none';
        w.innerHTML = '<table><thead><tr><th>Employee</th><th>ID</th><th>Today</th><th>Status</th>' + (mgr ? '<th></th>' : '') + '</tr></thead><tbody>' +
          members.map(function (u) {
            var att = Store.state.attendance.find(function (a) { return a.user_id === u.id && a.date === TODAY_ISO; });
            var today = u.status === 'on_leave' ? badge('on leave', 'b-blue') : att ? badge(att.status) + ' <span class="muted" style="font-size:12px">' + (att.clock_in ? fmtTime(att.clock_in) : '') + '</span>' : '<span class="muted">Not in</span>';
            return '<tr data-emp="' + u.id + '" style="cursor:pointer"><td><div class="cell-user">' + avatarEl(u) + '<div><div style="font-weight:600">' + esc(fullName(u)) + '</div><div class="muted" style="font-size:12px">' + esc(u.email) + '</div></div></div></td><td>' + esc(u.employee_id) + '</td><td>' + today + '</td><td>' + badge(u.status) + '</td>' + (mgr ? '<td><button class="btn btn-ghost btn-sm" data-rm="' + u.id + '">Remove</button></td>' : '') + '</tr>';
          }).join('') + '</tbody></table>';
        card.appendChild(w);
      }
      v.appendChild(card);
      card.querySelectorAll('[data-emp]').forEach(function (r) { r.onclick = function (e) { if (e.target.closest('[data-rm]')) return; openEmployeeDetail(userById(+r.dataset.emp)); }; });
      card.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); if (confirm('Remove this member from the team?')) { removeFromTeam(userById(+b.dataset.rm)); navigate('team'); } }; });
    });

    var unassigned = Store.state.users.filter(function (u) { return !u.team_id; });
    if (mgr && unassigned.length) {
      var uc = el('div', 'card'); uc.style.padding = '0';
      uc.innerHTML = '<div class="card-head" style="padding:14px 16px;margin:0;border-bottom:1px solid var(--border)"><h3>Unassigned <span class="badge b-muted">' + unassigned.length + '</span></h3></div>';
      var w2 = el('div', 'table-wrap'); w2.style.border = 'none';
      w2.innerHTML = '<table><tbody>' + unassigned.map(function (u) { return '<tr data-emp2="' + u.id + '" style="cursor:pointer"><td><div class="cell-user">' + avatarEl(u) + '<div><div style="font-weight:600">' + esc(fullName(u)) + '</div><div class="muted" style="font-size:12px">' + esc(u.email) + '</div></div></div></td></tr>'; }).join('') + '</tbody></table>';
      uc.appendChild(w2); v.appendChild(uc);
      uc.querySelectorAll('[data-emp2]').forEach(function (r) { r.onclick = function () { openEmployeeDetail(userById(+r.dataset.emp2)); }; });
    }
  }

  /* ---------- Settings (customization) — draft with Save / Cancel ---------- */
  function viewSettings(v) {
    v.appendChild(el('p', 'muted', 'Customize how ' + esc(S().companyName) + ' works for your team. Click <b>Save changes</b> at the bottom to apply.'));
    var draft = JSON.parse(JSON.stringify(S()));
    var card = el('div', 'card'); card.style.marginTop = '16px';
    var g = el('div', 'settings-grid');

    function row(label, desc, control) {
      var r = el('div', 'setting-row');
      r.innerHTML = '<div><div class="s-label">' + label + '</div><div class="s-desc">' + desc + '</div></div>';
      var c = el('div'); c.appendChild(control); r.appendChild(c); return r;
    }
    function seg(options, value, onChange) {
      var s = el('div', 'seg');
      options.forEach(function (o) {
        var b = el('button', o.v === value ? 'active' : '', o.label);
        b.onclick = function () { s.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); onChange(o.v); };
        s.appendChild(b);
      });
      return s;
    }
    function select(options, value, onChange) {
      var s = el('select');
      options.forEach(function (o) { var op = el('option', '', o.label); op.value = o.v; if (String(o.v) === String(value)) op.selected = true; s.appendChild(op); });
      s.onchange = function () { onChange(s.value); };
      return s;
    }

    g.appendChild(row('Business country', 'Sets the business location and clock time zone.',
      select(COUNTRIES.map(function (c) { return { v: c.name, label: c.name }; }), draft.country, function (v) { draft.country = v; draft.timezone = COUNTRY_TZ[v] || ''; })));

    g.appendChild(row('Start day of the week', 'Which day your schedule week begins on.',
      seg([{ v: 'saturday', label: 'Sat' }, { v: 'sunday', label: 'Sun' }, { v: 'monday', label: 'Mon' }], draft.weekStart, function (v) { draft.weekStart = v; })));

    g.appendChild(row('Time format', 'Show times as 24-hour or 12-hour (AM/PM).',
      seg([{ v: '24h', label: '24-hour' }, { v: '12h', label: '12-hour' }], draft.timeFormat, function (v) { draft.timeFormat = v; })));

    g.appendChild(row('Date format', 'How dates are displayed throughout the app.',
      select([{ v: 'DMY', label: 'DD Mon YYYY (18 Jul 2026)' }, { v: 'MDY', label: 'Mon DD, YYYY (Jul 18, 2026)' }, { v: 'ISO', label: 'YYYY-MM-DD (2026-07-18)' }], draft.dateFormat, function (v) { draft.dateFormat = v; })));

    g.appendChild(row('Working days', 'Days that get a scheduled shift.',
      (function () {
        var box = el('div'); box.style.display = 'flex'; box.style.gap = '4px'; box.style.flexWrap = 'wrap';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (nm, i) {
          var b = el('button', 'btn btn-sm ' + (draft.workingDays.indexOf(i) !== -1 ? 'btn-primary' : 'btn-ghost'), nm);
          b.onclick = function () {
            var ix = draft.workingDays.indexOf(i);
            if (ix === -1) { draft.workingDays.push(i); draft.workingDays.sort(); b.className = 'btn btn-sm btn-primary'; }
            else { draft.workingDays.splice(ix, 1); b.className = 'btn btn-sm btn-ghost'; }
          };
          box.appendChild(b);
        });
        return box;
      })()));

    g.appendChild(row('Currency', 'Used for billing and pricing displays.',
      select([{ v: 'QAR', label: 'QAR — Qatari Riyal' }, { v: 'USD', label: 'USD — US Dollar' }, { v: 'EUR', label: 'EUR — Euro' }, { v: 'GBP', label: 'GBP — Pound' }, { v: 'AED', label: 'AED — Dirham' }], draft.currency, function (v) { draft.currency = v; })));

    g.appendChild(row('Default shift start', 'Start time used when generating schedules.',
      (function () { var i = el('input'); i.type = 'time'; i.value = draft.defaultShift.start; i.onchange = function () { draft.defaultShift.start = i.value; }; return i; })()));
    g.appendChild(row('Default shift end', 'End time used when generating schedules.',
      (function () { var i = el('input'); i.type = 'time'; i.value = draft.defaultShift.end; i.onchange = function () { draft.defaultShift.end = i.value; }; return i; })()));

    g.appendChild(row('Overtime after', 'Hours worked before overtime applies.',
      select([{ v: 6, label: '6 hours' }, { v: 8, label: '8 hours' }, { v: 9, label: '9 hours' }, { v: 10, label: '10 hours' }], draft.overtimeAfter, function (v) { draft.overtimeAfter = +v; })));

    g.appendChild(row('Max concurrent breaks', 'How many teammates can break at once.',
      select([{ v: 1, label: '1' }, { v: 2, label: '2' }, { v: 3, label: '3' }, { v: 4, label: '4' }, { v: 5, label: '5' }], draft.maxConcurrentBreaks, function (v) { draft.maxConcurrentBreaks = +v; })));

    g.appendChild(row('Workspace name', 'Shown in the sidebar and on screens.',
      (function () { var i = el('input'); i.value = draft.companyName; i.onchange = function () { draft.companyName = i.value || 'NME Workforce'; }; return i; })()));

    card.appendChild(g); v.appendChild(card);

    var actions = el('div', 'form-actions'); actions.style.marginTop = '18px';
    var save = el('button', 'btn btn-primary', 'Save changes');
    save.onclick = function () { Object.assign(Store.state.settings, draft); regenerate(Store.state); Store.save(); refreshChrome(); toast('Settings saved'); navigate('settings'); };
    var cancel = el('button', 'btn btn-ghost', 'Cancel');
    cancel.onclick = function () { navigate('settings'); };
    actions.appendChild(save); actions.appendChild(cancel); v.appendChild(actions);

    var reset = el('div', 'toolbar'); reset.style.marginTop = '24px';
    var rb = el('button', 'btn btn-ghost', 'Reset all demo data & settings');
    rb.onclick = function () { if (confirm('Reset everything to the original demo state?')) { Store.resetDemo(); refreshChrome(); toast('Demo reset'); navigate('settings'); } };
    reset.appendChild(rb); v.appendChild(reset);
  }

  /* ---------- My Profile — edit details & password, with Save / Cancel ---------- */
  function inputField(label, name, value, type) {
    var lbl = el('label', '', label); var inp = el('input'); if (type) inp.type = type; inp.name = name; inp.value = value == null ? '' : value; lbl.appendChild(inp); return { label: lbl, input: inp };
  }
  function viewProfile(v) {
    var acc = currentUser;
    v.appendChild(el('p', 'muted', 'Manage your personal account details. Click <b>Save changes</b> to apply.'));

    // ----- Avatar / photo (optional) -----
    var acard = el('div', 'card'); acard.style.marginTop = '16px'; acard.style.maxWidth = '640px';
    acard.innerHTML = '<div class="card-head"><h3>Picture &amp; avatar</h3></div>';
    var arow = el('div'); arow.style.display = 'flex'; arow.style.gap = '18px'; arow.style.alignItems = 'center'; arow.style.flexWrap = 'wrap';
    var preview = el('div', 'avatar'); preview.style.width = '72px'; preview.style.height = '72px'; preview.style.fontSize = '30px'; setAvatarEl(preview, acc);
    var controls = el('div'); controls.style.flex = '1'; controls.style.minWidth = '220px';
    var grid = el('div'); grid.style.display = 'flex'; grid.style.flexWrap = 'wrap'; grid.style.gap = '6px';
    AVATARS.forEach(function (em) {
      var b = el('button', 'avatar-choice' + (acc.avatar === em && !acc.photo ? ' sel' : ''), em); b.type = 'button';
      b.onclick = function () { acc.avatar = em; acc.photo = null; Store.save(); setAvatarEl(preview, acc); setAvatarEl($('#u-av'), acc); grid.querySelectorAll('.avatar-choice').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); toast('Avatar updated'); };
      grid.appendChild(b);
    });
    controls.appendChild(grid);
    var actions = el('div'); actions.style.marginTop = '12px'; actions.style.display = 'flex'; actions.style.gap = '10px'; actions.style.flexWrap = 'wrap';
    var upBtn = el('label', 'btn btn-ghost btn-sm', 'Upload photo'); upBtn.style.cursor = 'pointer';
    var fileIn = el('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.style.display = 'none';
    fileIn.onchange = function () {
      var file = fileIn.files[0]; if (!file) return;
      if (file.size > 1500000) { toast('Please choose an image under 1.5 MB'); return; }
      var reader = new FileReader();
      reader.onload = function () { acc.photo = reader.result; Store.save(); setAvatarEl(preview, acc); setAvatarEl($('#u-av'), acc); toast('Photo updated'); };
      reader.readAsDataURL(file);
    };
    upBtn.appendChild(fileIn);
    var clearBtn = el('button', 'btn btn-ghost btn-sm', 'Remove'); clearBtn.type = 'button';
    clearBtn.onclick = function () { acc.photo = null; acc.avatar = null; Store.save(); setAvatarEl(preview, acc); setAvatarEl($('#u-av'), acc); grid.querySelectorAll('.avatar-choice').forEach(function (x) { x.classList.remove('sel'); }); toast('Picture removed'); };
    actions.appendChild(upBtn); actions.appendChild(clearBtn);
    controls.appendChild(actions);
    controls.appendChild(el('p', 'form-hint', 'Optional — pick an avatar or upload a photo (kept in your browser only).'));
    arow.appendChild(preview); arow.appendChild(controls); acard.appendChild(arow); v.appendChild(acard);

    var card = el('div', 'card'); card.style.marginTop = '16px'; card.style.maxWidth = '640px';
    card.innerHTML = '<div class="card-head"><h3>Profile details</h3></div>';
    var form = el('div', 'form'); form.style.maxWidth = 'none';
    var nameI = inputField('Full name', 'name', acc.name);
    var emailI = inputField('Email', 'email', acc.email, 'email');
    var idI = inputField('Employee / Unique ID', 'uid', acc.employee_id || '');
    idI.input.placeholder = 'Choose your own ID, e.g. EMP123';
    var idHint = el('div', 'form-hint', 'Your own unique ID across the company. Leave blank for none.'); idI.label.appendChild(idHint);

    var countrySel = el('select');
    var none = el('option', '', 'Select country'); none.value = ''; countrySel.appendChild(none);
    COUNTRIES.forEach(function (c) { var o = el('option', '', c.name); o.value = c.name; if (c.name === acc.country) o.selected = true; countrySel.appendChild(o); });
    var countryLbl = el('label', '', 'Country'); countryLbl.appendChild(countrySel);

    var codeI = el('input'); codeI.readOnly = true; codeI.value = acc.mobileCode || ''; codeI.placeholder = '+—'; codeI.style.width = '92px'; codeI.style.flex = 'none'; codeI.title = 'Set automatically from your country';
    var phoneI = el('input'); phoneI.value = acc.mobile || ''; phoneI.placeholder = 'Mobile number'; phoneI.inputMode = 'tel'; phoneI.style.flex = '1';
    countrySel.onchange = function () { var c = COUNTRIES.find(function (x) { return x.name === countrySel.value; }); codeI.value = c ? c.code : ''; };
    var phoneRow = el('div'); phoneRow.style.display = 'flex'; phoneRow.style.gap = '8px'; phoneRow.appendChild(codeI); phoneRow.appendChild(phoneI);
    var phoneLbl = el('label', '', 'Mobile number'); phoneLbl.appendChild(phoneRow);

    form.appendChild(nameI.label); form.appendChild(idI.label); form.appendChild(emailI.label); form.appendChild(countryLbl); form.appendChild(phoneLbl);
    card.appendChild(form); v.appendChild(card);

    var pcard = el('div', 'card'); pcard.style.marginTop = '16px'; pcard.style.maxWidth = '640px';
    pcard.innerHTML = '<div class="card-head"><h3>Change password</h3></div>';
    var pform = el('div', 'form'); pform.style.maxWidth = 'none';
    var curP = inputField('Current password', 'cur', '', 'password'); curP.input.placeholder = 'Leave blank to keep current';
    var newP = inputField('New password', 'newp', '', 'password'); newP.input.placeholder = 'At least 6 characters';
    var conP = inputField('Confirm new password', 'con', '', 'password');
    pform.appendChild(curP.label);
    var prow = el('div', 'row'); prow.appendChild(newP.label); prow.appendChild(conP.label); pform.appendChild(prow);
    pcard.appendChild(pform); v.appendChild(pcard);

    var err = el('p', 'form-error'); err.hidden = true; err.style.maxWidth = '640px'; err.style.marginTop = '14px'; v.appendChild(err);
    function showErr(m) { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'center' }); }

    var actions = el('div', 'form-actions'); actions.style.marginTop = '16px';
    var save = el('button', 'btn btn-primary', 'Save changes');
    var cancel = el('button', 'btn btn-ghost', 'Cancel');
    cancel.onclick = function () { navigate('profile'); };
    save.onclick = function () {
      err.hidden = true;
      var newName = nameI.input.value.trim();
      var newEmail = emailI.input.value.trim();
      var newId = idI.input.value.trim();
      if (!newName) return showErr('Name cannot be empty.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return showErr('Enter a valid email address.');
      var clash = Store.state.accounts.find(function (a) { return a !== acc && a.email.toLowerCase() === newEmail.toLowerCase(); });
      if (clash) return showErr('That email is already used by another account.');
      // unique ID: must not collide with another account or a different roster member
      if (newId) {
        var idClashAcc = Store.state.accounts.some(function (a) { return a !== acc && (a.employee_id || '').toLowerCase() === newId.toLowerCase(); });
        var idClashUser = Store.state.users.some(function (u) { return (u.email || '').toLowerCase() !== acc.email.toLowerCase() && (u.employee_id || '').toLowerCase() === newId.toLowerCase(); });
        if (idClashAcc || idClashUser) return showErr('That ID is already taken. Please choose a different one.');
      }
      if (curP.input.value || newP.input.value || conP.input.value) {
        if (acc.password !== curP.input.value) return showErr('Current password is incorrect.');
        if (newP.input.value.length < 6) return showErr('New password must be at least 6 characters.');
        if (newP.input.value !== conP.input.value) return showErr('New passwords do not match.');
        acc.password = newP.input.value;
      }
      var oldEmail = acc.email;
      acc.name = newName; acc.email = newEmail; acc.employee_id = newId;
      acc.country = countrySel.value || ''; acc.mobileCode = codeI.value || ''; acc.mobile = phoneI.value.trim();
      // sync to the roster record (Team views) if this account is also a team member
      var rec = Store.state.users.find(function (u) { return (u.email || '').toLowerCase() === oldEmail.toLowerCase(); });
      if (rec) { if (newId) rec.employee_id = newId; rec.email = newEmail; var np = newName.split(/\s+/); rec.first_name = np[0] || newName; rec.last_name = np.slice(1).join(' ') || ''; }
      setSession(acc.email); Store.save(); refreshChrome();
      toast('Profile saved'); navigate('profile');
    };
    actions.appendChild(save); actions.appendChild(cancel); v.appendChild(actions);
  }

  /* keep sidebar / topbar in sync after edits */
  function refreshChrome() {
    var nm = document.querySelector('.user-chip-meta b'); if (nm) nm.textContent = currentUser.name;
    setAvatarEl(document.getElementById('u-av'), currentUser);
    var foot = document.querySelector('.sidebar-foot b'); if (foot) foot.textContent = currentUser.name;
    var brand = document.querySelector('.sidebar-brand'); if (brand) brand.innerHTML = '<span class="mark">NME</span> ' + esc(S().companyName);
  }

  /* ---------- Billing ---------- */
  function viewBilling(v) {
    var plan = currentUser.plan || 'Team';
    var card = el('div', 'card'); card.style.marginTop = '4px';
    card.innerHTML = '<div class="card-head"><h3>Your plan</h3><span class="plan-pill">⭐ ' + esc(plan) + '</span></div>' +
      '<p class="muted">Signed in as <b>' + esc(currentUser.name) + '</b> (' + esc(currentUser.email) + ')' + (currentUser.company ? ' · ' + esc(currentUser.company) : '') + '</p>' +
      '<div class="pay-summary" style="margin-top:14px"><div class="prow"><span>Plan</span><span>' + esc(plan) + '</span></div>' +
      '<div class="prow"><span>Billing currency</span><span>' + esc(S().currency) + '</span></div>' +
      '<div class="prow"><span>Status</span><span>' + badge('active') + '</span></div></div>';
    v.appendChild(card);
    var note = el('p', 'muted'); note.style.marginTop = '14px';
    note.innerHTML = 'This is a demo workspace — no real billing occurs. Payment details entered at sign-up are not stored or charged.';
    v.appendChild(note);
  }

  /* ---------- Notifications ---------- */
  function updateNotifBadge() { var u = Store.state.notifications.filter(function (n) { return !n.is_read; }).length; var b = $('#notif-badge'); if (b) { b.textContent = u; b.hidden = u === 0; } }
  function openNotif() {
    var drawer = el('div', 'drawer'); drawer.id = 'notif-drawer';
    var ov = el('div', 'drawer-overlay'); ov.id = 'notif-ov';
    var ICON = { shift: '⏰', announcement: '📣', leave: '🌴', system: 'ℹ️' };
    drawer.innerHTML = '<div class="drawer-header"><h3>Notifications</h3><button class="icon-btn" id="nx">✕</button></div><div class="drawer-body" id="nb"></div>';
    document.body.appendChild(ov); document.body.appendChild(drawer);
    var nb = $('#nb', drawer);
    Store.state.notifications.forEach(function (n) {
      nb.appendChild(el('div', 'notif' + (n.is_read ? '' : ' unread'), '<div>' + (ICON[n.type] || 'ℹ️') + '</div><div><div class="n-title">' + esc(n.title) + '</div><div class="n-msg">' + esc(n.message) + '</div><div class="n-time">' + esc(n.type) + '</div></div>'));
    });
    var close = function () { drawer.remove(); ov.remove(); };
    $('#nx', drawer).onclick = close; ov.onclick = close;
    Store.state.notifications.forEach(function (n) { n.is_read = true; }); Store.save();
    setTimeout(updateNotifBadge, 600);
  }

  /* ---------- boot ---------- */
  function init() {
    Store.load();
    var email = localStorage.getItem(K_SESSION);
    if (email && findAccount(email)) { currentUser = findAccount(email); enterApp(); }
    else { var m = (location.hash || '').replace('#', ''); screenAuth(m === 'signup' ? 'signup' : 'login'); }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
