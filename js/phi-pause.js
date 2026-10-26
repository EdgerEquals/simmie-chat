/* PHI-PAUSE: one "Pause motion" for the WHOLE page (WCAG 2.2.2 Pause, Stop, Hide; Rule phi build B, Danny 26 Oct 2026).
   Shared module: the SAME file is rebella js/phi-pause.js and simmie-chat js/phi-pause.js.
   - Rebella: the footer's existing Pause motion button (js/footbar.js) stays the control; this file follows its aria-pressed
     and makes it page-wide (its own footer tickers already stop) and says so in its label.
   - Dashboard and chat: any [data-phi-pause] button (a small link-style button in the 22 px footer line) is the control.
   - Same remembered choice everywhere on this device: localStorage 'rebella.footer.pause' = '1' (only while paused).
   Paused: html.phi-paused (CSS holds every animation, see the stylesheet), js/ratio-pump.js holds running CSS/JS animations
   and videos, PhiTiming.every() skips its ticks. Hover/press transitions are not motion loops and still work. */
(function (root) {
  'use strict';
  var doc = root.document; if (!doc || root.PhiPause) return;
  var KEY = 'rebella.footer.pause', html = doc.documentElement;
  function get() { try { return root.localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function put(on) { try { if (on) root.localStorage.setItem(KEY, '1'); else root.localStorage.removeItem(KEY); } catch (e) {} }
  function apply(on) {
    html.classList.toggle('phi-paused', on);
    try { if (root.RatioPump) { root.RatioPump.hold(on); if (!on) root.RatioPump.refresh(); } } catch (e) {}
    var bs = doc.querySelectorAll('[data-phi-pause]');
    for (var i = 0; i < bs.length; i++) {
      bs[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      bs[i].textContent = on ? 'Play motion' : 'Pause motion';
      bs[i].setAttribute('aria-label', on ? 'Play motion on this page' : 'Pause motion on this page');
    }
    var fb = doc.querySelector('#app-foot .fb-pause'); if (fb) fb.setAttribute('aria-label', on ? 'Play motion on this page' : 'Pause motion on this page');
  }
  function set(on) { put(on); apply(on); }
  root.PhiPause = { set: set, on: function () { return html.classList.contains('phi-paused'); } };
  if (get()) html.classList.add('phi-paused');   // in <head>: nothing starts moving first
  function wire() {
    var fb = doc.querySelector('#app-foot .fb-pause');
    if (fb) {   // Rebella footer: follow its own button (it stores the same key)
      var sync = function () { apply(fb.getAttribute('aria-pressed') === 'true'); };
      new MutationObserver(sync).observe(fb, { attributes: true, attributeFilter: ['aria-pressed'] }); sync();
    } else apply(get());
    doc.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('[data-phi-pause]'); if (!b) return;
      e.preventDefault(); set(!html.classList.contains('phi-paused'));
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', wire); else wire();
  root.addEventListener('storage', function (e) { if (e.key === KEY && !doc.querySelector('#app-foot .fb-pause')) apply(e.newValue === '1'); });
})(typeof window !== 'undefined' ? window : this);
