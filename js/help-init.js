/* Site-wide: load the help words (same site, no personal data) and start the one help orb (js/help-orb.js), on by default.
   SHARED: the SAME file is rebella js/help-init.js (Rebella + the dashboard) and simmie-chat js/help-init.js (the chat).
   Rebella pages: help.json next to this script's folder (../help.json). Any other page names its own words on this tag:
   data-dict="help.json" (relative to the page) and data-head="#dash-head" (the header the orb tucks under). */
(function () {
  var me = document.currentScript, dict = me && me.getAttribute('data-dict'), head = me && me.getAttribute('data-head');
  var url = dict ? new URL(dict, location.href) : new URL('../help.json', me ? me.src : location.href);
  function go() {
    fetch(url, { credentials: 'omit', cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !window.HelpOrb) return;
      window.HelpOrb.init({ dict: j.entries, targets: j.targets, head: head || null, headerSlot: document.querySelector('[data-help-slot="header"]'), footerSlot: document.querySelector('[data-help-slot="footer"]') });
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
