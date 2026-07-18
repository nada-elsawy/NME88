/* ============================================================
   theme.js — global light / dark / system switcher.
   Shared by the marketing site and the app (works logged-out).
   A `.theme-btn` shows the current mode's icon; clicking opens a
   3-option menu. Preference is stored in localStorage.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'nme_theme';
  var ICON = { light: '☀️', dark: '🌙', system: '🖥️' };
  var LABEL = { light: 'Light', dark: 'Dark', system: 'System' };

  var T = {
    mode: 'system',
    _menu: null,
    tr: function (s) { return window.NME_I18N ? NME_I18N.t(s) : s; },
    resolved: function () {
      if (this.mode === 'system') return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      return this.mode;
    },
    apply: function () { document.documentElement.setAttribute('data-theme', this.resolved()); this.refresh(); },
    set: function (m) { this.mode = m; try { localStorage.setItem(KEY, m); } catch (e) {} this.closeMenu(); this.apply(); if (this.onChange) this.onChange(m); },
    refresh: function () {
      var self = this;
      document.querySelectorAll('.theme-btn').forEach(function (b) { b.textContent = ICON[self.mode]; b.setAttribute('aria-label', 'Theme: ' + LABEL[self.mode]); });
    },
    wire: function () {
      var self = this;
      document.querySelectorAll('.theme-btn').forEach(function (b) {
        if (b._tw) return; b._tw = 1;
        b.setAttribute('data-i18n-skip', ''); b.type = 'button';
        b.onclick = function (e) { e.stopPropagation(); self.toggleMenu(b); };
      });
      this.refresh();
    },
    toggleMenu: function (anchor) {
      if (this._menu) { this.closeMenu(); return; }
      this.openMenu(anchor);
    },
    openMenu: function (anchor) {
      var self = this;
      var m = document.createElement('div');
      m.className = 'theme-menu'; m.setAttribute('data-i18n-skip', '');
      ['light', 'dark', 'system'].forEach(function (mode) {
        var it = document.createElement('button');
        it.className = 'theme-item' + (self.mode === mode ? ' active' : ''); it.type = 'button';
        it.innerHTML = '<span class="ti-ico">' + ICON[mode] + '</span><span>' + self.tr(LABEL[mode]) + '</span>';
        it.onclick = function (ev) { ev.stopPropagation(); self.set(mode); };
        m.appendChild(it);
      });
      document.body.appendChild(m);
      var r = anchor.getBoundingClientRect();
      m.style.position = 'fixed';
      m.style.top = (r.bottom + 6) + 'px';
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      if (rtl) m.style.left = Math.max(8, r.left) + 'px';
      else m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      this._menu = m;
      setTimeout(function () {
        document.addEventListener('click', self._onDoc = function () { self.closeMenu(); }, { once: true });
      }, 0);
    },
    closeMenu: function () { if (this._menu) { this._menu.remove(); this._menu = null; } if (this._onDoc) { document.removeEventListener('click', this._onDoc); this._onDoc = null; } },
    init: function () {
      try { this.mode = localStorage.getItem(KEY) || 'system'; } catch (e) { this.mode = 'system'; }
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)'); var self = this;
        var f = function () { if (self.mode === 'system') self.apply(); };
        mq.addEventListener ? mq.addEventListener('change', f) : (mq.addListener && mq.addListener(f));
      }
      this.wire(); this.apply();
    },
  };

  window.NME_THEME = T;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { T.init(); });
  else T.init();
})();
