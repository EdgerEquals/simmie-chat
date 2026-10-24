/* Rebella: minimal JS. Everything works without it except the drawer, search toggle and sticky shadow. */
(function () {
  document.documentElement.classList.add('js');

  // EMERGENCY STOP: jump straight to the homepage and replace the current history entry,
  // so "Back" doesn't return to the page being escaped. Without JS it's a plain link.
  // Uses the link's own (relative) href, resolved by the browser, so it works under a subpath like /rebella/.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-escape]');
    if (!a) return;
    e.preventDefault();
    window.location.replace(a.href || new URL('index.html', document.baseURI).href);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var drawer = document.getElementById('drawer');
    var overlay = document.getElementById('overlay');
    var burger = document.getElementById('burger');
    function setDrawer(open) {
      if (!drawer) return;
      drawer.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
      if (open) { var f = drawer.querySelector('a,button'); if (f) f.focus(); }
    }
    if (burger) burger.addEventListener('click', function () { setDrawer(true); });
    document.querySelectorAll('[data-close-drawer]').forEach(function (el) {
      el.addEventListener('click', function () { setDrawer(false); burger.focus(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) { setDrawer(false); burger.focus(); }
    });

    var sbtn = document.getElementById('search-btn');
    var sbar = document.getElementById('searchbar');
    if (sbtn && sbar) sbtn.addEventListener('click', function () {
      var open = !sbar.classList.contains('open');
      sbar.classList.toggle('open', open);
      sbtn.setAttribute('aria-expanded', String(open));
      if (open) sbar.querySelector('input').focus();
    });

    var nav = document.querySelector('.mainnav');
    if (nav) {
      var onScroll = function () { nav.classList.toggle('stuck', nav.getBoundingClientRect().top <= 0 && window.scrollY > 0); };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }

    window.RebellaForms(document);
  });
  // Demo-only: stop placeholder forms from submitting anywhere. js/nav.js calls this again for swapped-in content.
  window.RebellaForms = function (root) {
    root.querySelectorAll('form[data-demo]:not([data-bound])').forEach(function (f) {
      f.setAttribute('data-bound', '');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = f.querySelector('.form-msg');
        if (msg) msg.textContent = 'Example form: nothing was sent.';
      });
    });
  };
})();
