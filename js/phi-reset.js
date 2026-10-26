/* PHI-RESET: "Reset what this page learned" (Kids Club Rule phi pending item 'usage ladder reset'; Danny's go 10:06 AWST 26 Oct 2026).
   Shared module: the SAME file is rebella js/phi-reset.js and simmie-chat js/phi-reset.js.
   Clears ONLY the on-device usage record (localStorage 'phiAdapt.v1', which also holds the golden-ratio dials and their private move
   log in its x slot) and the session flag (sessionStorage 'phiAdapt.session'), then reloads. Nothing else: not the visitor name,
   the sound switch, the passcode session, saved boards or anything typed. Nothing is sent anywhere.
   Asks once (window.confirm) so a stray tap can't wipe it.
   Placement, on this script tag: data-after="<selector>" puts the button right after that element; data-in="<selector>" appends it
   inside; data-class="<class>" styles it like the page's own small controls; data-short="1" shows the label to screen readers only
   (icon + title on screen). Any element with [data-phi-reset] already on the page is wired instead. */
(function () {
  'use strict';
  if (window.PhiReset) return;
  var me = document.currentScript, KEY = 'phiAdapt.v1', SKEY = 'phiAdapt.session', LABEL = 'Reset what this page learned';
  var ASK = 'Reset what this page learned about how you use it? It only clears this device, and the page will reload.';
  function attr(n) { return me && me.getAttribute(n); }
  function run() {
    try { if (window.PhiAdapt && window.PhiAdapt.reset) window.PhiAdapt.reset(); } catch (e) {}
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { sessionStorage.removeItem(SKEY); } catch (e) {}
    location.reload();
  }
  function wire(b) {
    if (!b || b._phiReset) return; b._phiReset = true;
    b.addEventListener('click', function (e) { e.preventDefault(); if (window.confirm(ASK)) run(); });
  }
  function make() {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-phi-reset', '');
    b.className = 'phi-reset' + (attr('data-class') ? ' ' + attr('data-class') : ''); b.title = LABEL;
    var i = document.createElement('span'); i.className = 'phi-reset-i'; i.setAttribute('aria-hidden', 'true'); i.textContent = '\u21BA';
    var l = document.createElement('span'); l.className = 'phi-reset-l' + (attr('data-short') === '1' ? ' sr-only' : ''); l.textContent = LABEL;
    b.appendChild(i); b.appendChild(l); return b;
  }
  function place() {
    var have = document.querySelectorAll('[data-phi-reset]');
    if (!have.length) {
      var after = attr('data-after'), into = attr('data-in'), t = null;
      try { t = after ? document.querySelector(after) : into ? document.querySelector(into) : null; } catch (e) {}
      if (t) { var b = make(); if (after) t.parentNode.insertBefore(b, t.nextSibling); else t.appendChild(b); }
      have = document.querySelectorAll('[data-phi-reset]');
    }
    Array.prototype.forEach.call(have, wire);
  }
  window.PhiReset = { run: run, place: place };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); else place();
})();
