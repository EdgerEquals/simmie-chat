/* HelpOrb: ONE site-wide help orb (every Rebella page, including music/ and music/playground/).
   API: HelpOrb.init({dict, targets, headerSlot, footerSlot})
     dict: {key: {title, text, try}} from help.json; targets: [[cssSelector, key], ...] (adds data-help at runtime).
     headerSlot/footerSlot are accepted for compatibility; answers now open in a small anchored help pop-up instead
     (Danny's one exception to Rebella's no-pop-ups rule, 24 Oct 2026, for the help orb only).
   Home: fixed bottom-right, just above the Get me out button, which sits above the locked footer (--app-foot-h), with
   safe-area insets; lifts above any YouTube player.
   Drag (pointer events, touch-action:none, no page scroll while dragging): every target glows; the one under the orb gets
   a pink outline and a small name label. Drop on a target -> pop-up anchored to it (title, text, "try this", Close;
   Esc or a tap outside closes; focus is trapped inside and returned). Drop on nothing -> nothing. The orb springs home.
   Tap (no drag) -> pick mode: the next tap on a glowing element opens its help. Keyboard: Enter on the orb, then Tab /
   Shift+Tab (or arrows) through targets, Enter to open, Escape to stop.
   Timings (PHI^n s): glow 2.618 (golden-angle offsets), hot 1.618, spring home 0.618. Reduced motion: no pulse, instant. */
(function () {
  'use strict';
  if (window.HelpOrb) return;
  var GA = 0.6180339887, HOME = 618;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = null;

  function css() {
    var s = document.createElement('style'); s.id = 'help-orb-css';
    s.textContent =
      '.help-orb{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));bottom:calc(var(--app-foot-h,82px) + 84px + env(safe-area-inset-bottom,0px));z-index:960;width:48px;height:48px;border-radius:50%;border:2px solid #fff;' +
      'background:radial-gradient(circle at 35% 30%,#FDEEF2,#F48FB1 60%,#8E2350);color:#3D1226;font:700 1.5rem/1 "Alegreya Sans",sans-serif;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;' +
      'box-shadow:0 2px 10px rgba(61,18,38,.35);padding:0;-webkit-tap-highlight-color:transparent}' +
      '.help-orb.springing{transition:left .618s cubic-bezier(.34,1.4,.64,1),top .618s cubic-bezier(.34,1.4,.64,1)}' +
      '.help-orb.dragging{cursor:grabbing;opacity:.92}.help-orb[aria-pressed=true]{outline:3px solid #8E2350;outline-offset:3px}' +
      '.help-orb:focus-visible{outline:3px solid #8E2350;outline-offset:3px}' +
      'html.help-seeking [data-help]{box-shadow:inset 0 0 0 999px rgba(246,201,212,.28);animation:helpGlow 2.618s ease-in-out infinite;animation-delay:var(--help-d,0s)}' +
      'html.help-seeking [data-help].help-hot{outline:3px solid #8E2350;outline-offset:2px;box-shadow:inset 0 0 0 999px rgba(244,143,177,.38),0 0 0 6px rgba(244,143,177,.55);animation:none}' +
      '@keyframes helpGlow{0%,100%{box-shadow:inset 0 0 0 999px rgba(246,201,212,.22),0 0 0 0 rgba(244,143,177,0)}50%{box-shadow:inset 0 0 0 999px rgba(246,201,212,.34),0 0 10px 2px rgba(244,143,177,.55)}}' +
      '.help-label{position:fixed;z-index:2147483100;pointer-events:none;background:#3D1226;color:#fff;font:700 .78rem/1.2 "Alegreya Sans",sans-serif;padding:.2rem .5rem;border-radius:999px;white-space:nowrap;max-width:70vw;overflow:hidden;text-overflow:ellipsis}' +
      '.help-pop{position:fixed;z-index:2147483200;width:min(320px,calc(100vw - 24px));box-sizing:border-box;background:#FFFFFF;color:#3D1226;border:2px solid #8E2350;border-radius:12px;padding:.8rem .9rem .7rem;' +
      'box-shadow:0 10px 30px rgba(61,18,38,.3);font:1rem/1.45 "Alegreya Sans",sans-serif}' +
      '.help-pop h2{font:700 1.05rem/1.25 "Alegreya Sans",sans-serif;margin:0 2rem .35rem 0;color:#8E2350}.help-pop p{margin:0 0 .45rem}.help-pop .hp-try{font-style:italic;color:#5B3A50}' +
      '.help-pop .hp-close{position:absolute;top:.4rem;right:.4rem;min-width:44px;min-height:36px;border:2px solid #8E2350;border-radius:999px;background:#FDEEF2;color:#3D1226;font:700 .85rem/1 "Alegreya Sans",sans-serif;cursor:pointer}' +
      '.help-pop .hp-close:focus-visible{outline:3px solid #8E2350;outline-offset:2px}' +
      '@media (prefers-reduced-motion:reduce){html.help-seeking [data-help]{animation:none!important}.help-orb.springing{transition:none}}';
    document.head.appendChild(s);
  }
  function visible(el) { if (!el.getClientRects().length) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }
  function targets() { return Array.prototype.filter.call(document.querySelectorAll('[data-help]'), function (el) { return el !== st.orb && !el.closest('.help-pop') && visible(el); }); }
  function entry(el) { var k = el && el.getAttribute('data-help'); return k && st.dict[k] ? st.dict[k] : null; }
  function seek(on) {
    document.documentElement.classList.toggle('help-seeking', on);
    if (on) targets().forEach(function (el, k) { el.style.setProperty('--help-d', (-2.618 * (((k + 1) * GA) % 1)).toFixed(3) + 's'); });
    else { hot(null); }
  }
  function hot(el) {
    if (st.hot === el) return;
    if (st.hot) st.hot.classList.remove('help-hot');
    st.hot = el;
    var lab = st.label;
    if (!el) { lab.hidden = true; return; }
    el.classList.add('help-hot');
    var e = entry(el); lab.textContent = e ? e.title : 'Help';
    lab.hidden = false;
    var r = el.getBoundingClientRect(), lw = lab.offsetWidth, top = r.top - lab.offsetHeight - 6;
    if (top < 4) top = r.bottom + 6;
    lab.style.left = Math.max(4, Math.min(innerWidth - lw - 4, r.left)) + 'px'; lab.style.top = top + 'px';
  }
  function under(x, y) {
    var list = document.elementsFromPoint(x, y);
    for (var i = 0; i < list.length; i++) { if (list[i] === st.orb || list[i] === st.label) continue; var t = list[i].closest('[data-help]'); if (t && t !== st.orb) return t; if (list[i].tagName !== 'HTML') return null; }
    return null;
  }
  // ---- the one help pop-up ----
  function close(refocus) {
    var p = st.pop; if (!p) return;
    st.pop = null; p.remove(); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', popKeys, true);
    var back = st.returnTo; st.returnTo = null;
    if (refocus !== false && back && back.focus) try { back.focus({ preventScroll: true }); } catch (e) {}
  }
  function outside(e) { if (st.pop && !st.pop.contains(e.target)) close(false); }
  function popKeys(e) {
    if (!st.pop) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { var f = st.pop.querySelectorAll('button,a[href]'); if (!f.length) return; var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!st.pop.contains(document.activeElement)) { e.preventDefault(); a.focus(); } }
  }
  function open(el) {
    var e = entry(el); if (!e) return;
    close(false);
    var p = document.createElement('div'); p.className = 'help-pop'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'false');
    var id = 'help-pop-t'; p.setAttribute('aria-labelledby', id);
    var h = document.createElement('h2'); h.id = id; h.textContent = e.title || 'Help'; p.appendChild(h);
    var t = document.createElement('p'); t.textContent = e.text || ''; p.appendChild(t);
    if (e.try) { var tr = document.createElement('p'); tr.className = 'hp-try'; tr.textContent = 'Try this: ' + e.try; p.appendChild(tr); }
    var c = document.createElement('button'); c.type = 'button'; c.className = 'hp-close'; c.textContent = 'Close'; c.setAttribute('aria-label', 'Close help'); c.addEventListener('click', function () { close(); });
    p.appendChild(c); document.body.appendChild(p); st.pop = p; st.returnTo = st.orb;
    // anchor: below the element if it fits, else above, kept inside the window between the bars
    var r = el.getBoundingClientRect(), ph = p.offsetHeight, pw = p.offsetWidth;
    var hb = 0, fb = innerHeight; try { hb = document.getElementById('app-head').getBoundingClientRect().bottom; fb = document.getElementById('app-foot').getBoundingClientRect().top; } catch (x) {}
    if (hb > innerHeight * 0.6) hb = 0; if (fb < innerHeight * 0.4) fb = innerHeight;
    var top = r.bottom + 8; if (top + ph > fb - 4) top = r.top - ph - 8; top = Math.max(4, Math.min(innerHeight - ph - 4, top));
    p.style.top = top + 'px'; p.style.left = Math.max(12, Math.min(innerWidth - pw - 12, r.left)) + 'px';
    setTimeout(function () { document.addEventListener('pointerdown', outside, true); }, 0);
    document.addEventListener('keydown', popKeys, true);
    try { c.focus({ preventScroll: true }); } catch (x) { c.focus(); }
  }
  function home(animate) {
    var o = st.orb; o.classList.remove('dragging');
    if (animate && !reduce && o.style.left) {
      var r0 = o.getBoundingClientRect(); o.style.left = ''; o.style.top = ''; o.style.bottom = ''; avoid();
      var r1 = o.getBoundingClientRect();
      o.style.left = r0.left + 'px'; o.style.top = r0.top + 'px'; o.style.bottom = 'auto'; void o.offsetWidth;
      o.classList.add('springing'); o.style.left = r1.left + 'px'; o.style.top = r1.top + 'px';
      setTimeout(function () { o.classList.remove('springing'); o.style.left = ''; o.style.top = ''; o.style.bottom = ''; avoid(); }, HOME + 20);
    } else { o.style.left = ''; o.style.top = ''; o.style.bottom = ''; avoid(); }
    o.classList.remove('dragging');
  }
  // never sit on a YouTube player or the header radio dial: lift the dock above any it would cover
  function avoid() {
    var o = st.orb; if (o.classList.contains('dragging') || o.classList.contains('springing') || o.style.left) return;
    o.style.bottom = '';
    var esc = document.querySelector('.escape'), er = esc && esc.getBoundingClientRect();
    if (er && er.width) o.style.bottom = Math.round(window.innerHeight - er.top + 10) + 'px';
    var r = o.getBoundingClientRect();
    document.querySelectorAll('iframe[src*="youtube"], .br-panel:not([hidden])').forEach(function (f) {
      var p = f.getBoundingClientRect();
      if (r.left < p.right && r.right > p.left && r.top < p.bottom && r.bottom > p.top) o.style.bottom = (window.innerHeight - p.top + 12) + 'px';
    });
  }
  function pick(on) { st.picking = on; st.orb.setAttribute('aria-pressed', on ? 'true' : 'false'); seek(on); if (!on) st.kb = false; }

  function init(opt) {
    if (st) return window.HelpOrb; // exactly one orb
    opt = opt || {};
    document.querySelectorAll('.help-orb').forEach(function (x) { x.remove(); });
    st = { dict: opt.dict || {}, targets: opt.targets || [], hot: null, kb: false, picking: false, pop: null, returnTo: null };
    (opt.targets || []).forEach(function (p) { try { document.querySelectorAll(p[0]).forEach(function (el) { if (!el.hasAttribute('data-help')) el.setAttribute('data-help', p[1]); }); } catch (e) {} });
    css();
    var lab = st.label = document.createElement('span'); lab.className = 'help-label'; lab.hidden = true; lab.setAttribute('aria-hidden', 'true'); document.body.appendChild(lab);
    var o = st.orb = document.createElement('button');
    o.type = 'button'; o.className = 'help-orb'; o.id = 'help-orb'; o.textContent = '?'; o.setAttribute('data-help', 'help-orb'); o.setAttribute('aria-pressed', 'false');
    o.setAttribute('aria-label', 'Help orb. Drag me onto anything to find out what it does, or press Enter and then Tab through the things I can explain.');
    document.body.appendChild(o); avoid();
    window.addEventListener('resize', avoid); window.addEventListener('scroll', function () { avoid(); if (st.hot && st.picking) hot(st.hot); }, { passive: true });
    var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    function noScroll(e) { if (down) e.preventDefault(); }
    document.addEventListener('touchmove', noScroll, { passive: false });
    o.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return; e.preventDefault(); close(false);
      try { o.setPointerCapture(e.pointerId); } catch (x) {}
      var r = o.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; moved = false; down = true;
    });
    o.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) { moved = true; o.classList.add('dragging'); pick(false); seek(true); }
      if (!moved) return;
      o.style.left = (ox + dx) + 'px'; o.style.top = (oy + dy) + 'px'; o.style.bottom = 'auto';
      hot(under(e.clientX, e.clientY));
    });
    function end(e) {
      if (!down) return; down = false;
      try { o.releasePointerCapture(e.pointerId); } catch (x) {}
      if (!moved) { pick(!st.picking); return; }            // a tap: toggle pick mode
      var t = under(e.clientX, e.clientY); seek(false); home(true);
      if (t && entry(t)) open(t);                             // dropping on nothing shows nothing
    }
    o.addEventListener('pointerup', end);
    o.addEventListener('pointercancel', function () { down = false; seek(false); home(false); });
    // pick mode: the next tap on a glowing element opens its help (and does not follow the link / press the button)
    document.addEventListener('click', function (e) {
      if (!st.picking || st.kb || e.target === o) return;
      var t = e.target.closest && e.target.closest('[data-help]');
      e.preventDefault(); e.stopPropagation(); pick(false);
      if (t && t !== o && entry(t)) open(t);
    }, true);
    document.addEventListener('pointermove', function (e) { if (st.picking && !st.kb && e.pointerType === 'mouse') hot(under(e.clientX, e.clientY)); }, { passive: true });
    // keyboard: Enter on the orb, Tab / Shift+Tab (or arrows) through targets, Enter to open, Escape to stop
    o.addEventListener('keydown', function (e) {
      var list = targets();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!st.kb) { pick(true); st.kb = true; hot(list[0] || null); if (list[0]) list[0].scrollIntoView({ block: 'nearest' }); }
        else { var t = st.hot; pick(false); if (t) open(t); }
      } else if (st.kb && (e.key === 'Tab' || /^Arrow/.test(e.key))) {
        e.preventDefault(); var i = list.indexOf(st.hot), d = (e.key === 'Tab' ? !e.shiftKey : (e.key === 'ArrowDown' || e.key === 'ArrowRight')) ? 1 : -1;
        var n = list[(i + d + list.length) % list.length]; if (n) { n.scrollIntoView({ block: 'nearest' }); hot(n); }
      } else if (st.kb && e.key === 'Escape') { e.preventDefault(); pick(false); }
    });
    o.addEventListener('blur', function () { if (st.kb) setTimeout(function () { if (document.activeElement !== o && !st.pop) pick(false); }, 0); });
    return window.HelpOrb;
  }
  // js/nav.js swapped in new page content: close any pop-up, leave pick mode, re-apply the help.json targets
  function refresh() { if (!st) return; close(false); pick(false); (st.targets || []).forEach(function (p) { try { document.querySelectorAll(p[0]).forEach(function (el) { if (!el.hasAttribute('data-help')) el.setAttribute('data-help', p[1]); }); } catch (e) {} }); home(false); }
  window.HelpOrb = { init: init, refresh: refresh, close: function () { if (st) close(); } };
})();
