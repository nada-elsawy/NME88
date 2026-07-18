/* Progressive enhancement — the site works fully without JS. */
(function () {
  'use strict';

  // Contact form: show a friendly confirmation instead of navigating.
  var form = document.querySelector('.cta-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[name="email"]');
      if (email && !email.value) { email.focus(); return; }
      form.innerHTML =
        '<div style="text-align:center;padding:20px 6px">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:#dcfce7;color:#16a34a;' +
        'font-size:28px;display:grid;place-items:center;margin:0 auto 16px">✓</div>' +
        '<h3 style="margin-bottom:8px">You\'re on the list!</h3>' +
        '<p style="color:#6b7288;font-size:15px">Thanks' +
        (email && email.value ? ' — we\'ll reach out to <b>' +
          email.value.replace(/[<>&]/g, '') + '</b> shortly.' : '.') +
        ' (Demo site — nothing was actually sent.)</p></div>';
    });
  }

  // Close the mobile menu after tapping a nav link.
  var toggle = document.getElementById('nav-toggle');
  document.querySelectorAll('.main-nav a').forEach(function (a) {
    a.addEventListener('click', function () { if (toggle) toggle.checked = false; });
  });

  // Subtle header shadow once the page is scrolled.
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 8 ? '0 4px 18px rgba(16,24,40,.06)' : 'none';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
