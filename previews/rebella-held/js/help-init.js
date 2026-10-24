/* Site-wide: load help.json (same site, no personal data) and start the one help orb. */
(function () {
  var me = document.currentScript, url = new URL('../help.json', me ? me.src : location.href);
  function go() {
    fetch(url, { credentials: 'omit', cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !window.HelpOrb) return;
      window.HelpOrb.init({ dict: j.entries, targets: j.targets, headerSlot: document.querySelector('[data-help-slot="header"]'), footerSlot: document.querySelector('[data-help-slot="footer"]') });
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
