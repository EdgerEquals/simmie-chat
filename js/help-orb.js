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
   Timings (PHI^n s): glow 2.618 (golden-angle offsets), hot 1.618, spring home 0.618. Reduced motion: no pulse, instant.
   SHARED: the SAME file is rebella js/help-orb.js (Rebella + the dashboard) and simmie-chat js/help-orb.js (the chat).
   Kids Club standard "help orb on by default, in the kid's own look" (Danny 14:30 AWST 26 Oct 2026) and the core "grow on drop"
   (Danny 16:29 AWST 25 Oct 2026), added here once so every caller gets them:
   - On by default: there is no off switch; every page that loads js/help-init.js gets the orb on its first screen (gate and login
     screens included; it explains the box and the button there and never reads what is typed).
   - Her own look: "Change how I look" in every help box opens a small picker (the orb, a help owl, car, moon, ... or any one emoji
     she types; no letters, so no names). Only the look changes: same drag, drop, grow and help text. Her pick is saved on this
     device only (localStorage 'helporb.look.v1'), nothing is sent, so it is live at once (auto-live for kids' own picks).
   - Grow on drop: the thing she drops it on scales up by one phi step of the page's text unit and moves PHI^-3 of the way toward
     the centre, in front of the orb, while the help box is open; it settles back on close (B x PHI^-7 in, B x PHI^-6 back, from
     js/phi-b.js). The same drop handler serves a virtual drop: HelpOrb.drop(el) (the questionnaire's auto-drop standard).
   - Every visible control explains itself: a control with no help entry gets the "_tuning" entry ("still being tuned") under its
     own name, so a drop never comes back empty while the real words are written.
   - Always gently alive (Danny 14:47 AWST 26 Oct 2026): at rest the orb breathes in time with breath B itself (animation period
     var(--b) from js/phi-b.js, marked data-phi-js so the ratio pump leaves its period alone), in every look. While dragged, in pick
     mode, springing home or with Pause motion on, the breath holds where it is (paused, never snapped off) and resumes from there.
   - First-screen nudge: once per device (localStorage 'helporb.nudge.v1'), a small bubble beside the orb says what it does; it goes
     when she uses the orb, taps the bubble, or after B x PHI^2. Tap the orb, then tap a control works as well as dragging (pick mode).
   Options: init({dict, targets, head}) - head = the header selector to tuck under (default '#app-head').
   API: HelpOrb.{init, refresh, close, drop(el), settle(), look([id or emoji]), looks(), dict(), has(key)}. */
(function () {
  'use strict';
  if (window.HelpOrb) return;
  var GA = 0.6180339887, HOME = 618;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = null;

  function css() {
    var s = document.createElement('style'); s.id = 'help-orb-css';
    s.textContent =
      '.help-orb{position:fixed;right:calc(14px + env(safe-area-inset-right,0px));top:calc(var(--app-head-h,120px) + var(--nav-h,0px) + 10px);bottom:auto;z-index:960;width:48px;height:48px;border-radius:50%;border:2px solid #fff;' +
      'background:radial-gradient(circle at 35% 30%,#FDEEF2,#F48FB1 60%,#8E2350);color:#3D1226;font:700 1.5rem/1 "Alegreya Sans",sans-serif;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;' +
      'box-shadow:0 2px 10px rgba(61,18,38,.35);padding:0;-webkit-tap-highlight-color:transparent;' +
      'transition:top .382s cubic-bezier(.2,.7,.2,1);animation:helpBreathe 6.854s ease-in-out -4.236s infinite}' +
      // gentle breath (t602u): scale + soft pink halo, PHI^4 = 6.854 s, golden-angle start (k=1); the ratio pump scales it
      '@keyframes helpBreathe{0%,100%{scale:1;box-shadow:0 2px 10px rgba(61,18,38,.35),0 0 0 0 rgba(244,143,177,0)}50%{scale:1.06;box-shadow:0 2px 12px rgba(61,18,38,.3),0 0 14px 4px rgba(244,143,177,.55)}}' +
      '.help-orb.dragging,.help-orb.springing,.help-orb[aria-pressed=true]{animation:none}' +
      'body:has(#app-foot.fb-paused) .help-orb{animation-play-state:paused}' +
      '.help-orb.springing{transition:left .618s cubic-bezier(.34,1.4,.64,1),top .618s cubic-bezier(.34,1.4,.64,1)}' +
      '.help-orb.dragging{cursor:grabbing;opacity:.92;transition:none}.help-orb[aria-pressed=true]{outline:3px solid #8E2350;outline-offset:3px}' +
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
      '@media (prefers-reduced-motion:reduce){html.help-seeking [data-help]{animation:none!important}.help-orb,.help-orb.springing{transition:none;animation:none}}';
    document.head.appendChild(s);
  }
  function visible(el) { if (!el.getClientRects().length) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }
  var PHI = 1 / GA, IP = GA;                                                              // phi: the golden ratio
  function bms(k) { var P = window.PhiB; return P && P.ms ? P.ms(k) || 0 : 0; }            // every timing is B x PHI^k (js/phi-b.js)
  function unit() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 0; }   // anchor: the page's own text unit, measured
  function tap() { return Math.min(innerWidth, innerHeight) * Math.pow(PHI, -4); }        // anchor: Rule phi tap target S x PHI^-4 (S = shorter screen side)
  var CONTROLS = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=slider], [role=tab], [role=switch], [role=checkbox], [role=radio]';
  function named(el) { return (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' '); }
  // targets from help.json, re-applied whenever she starts looking (pages swap content in), then any visible control still
  // without help gets the '_tuning' entry under its own name
  function apply() {
    (st.targets || []).forEach(function (p) { try { document.querySelectorAll(p[0]).forEach(function (el) { if (!el.hasAttribute('data-help')) el.setAttribute('data-help', p[1]); }); } catch (e) {} });
    Array.prototype.forEach.call(document.querySelectorAll(CONTROLS), function (el) {
      if (el === st.orb || el.closest('[data-help], .help-pop, .help-label') || !visible(el)) return;
      el.setAttribute('data-help', '_tuning');
    });
  }
  function targets() { return Array.prototype.filter.call(document.querySelectorAll('[data-help]'), function (el) { return el !== st.orb && !el.closest('.help-pop') && visible(el); }); }
  function entry(el) {
    var k = el && el.getAttribute('data-help'); if (!k) return null;
    if (k === '_tuning') { var t = st.dict._tuning || TUNING, n = named(el); return { title: n || t.title, text: t.text, try: t.try }; }
    return st.dict[k] || null;
  }
  var TUNING = { title: 'Still being tuned', text: "This one is still being tuned. Its proper help words are on the way. You can still try it, or ask Simmie what it does." };

  // ---- grow on drop (core standard): one element at a time, in front of the orb, settles back smoothly ----
  function grow(el) {
    settle();
    var r = el.getBoundingClientRect(), w = Math.max(r.width, r.height); if (!w) return;
    var s = (w + unit() * PHI) / w;                                                         // one phi step of the text unit bigger
    s = Math.max(1, Math.min(s, innerWidth / r.width, innerHeight / r.height));
    var dx = (innerWidth / 2 - (r.left + r.width / 2)) * Math.pow(IP, 3), dy = (innerHeight / 2 - (r.top + r.height / 2)) * Math.pow(IP, 3);   // PHI^-3 of the way to the centre
    var z = (+getComputedStyle(st.orb).zIndex || 0) + 1;                        // just in front of the orb
    el.style.setProperty('--hg-s', String(s)); el.style.setProperty('--hg-x', dx + 'px'); el.style.setProperty('--hg-y', dy + 'px'); el.style.setProperty('--hg-z', String(z));
    el.style.setProperty('--hg-in', bms(-7) + 'ms'); el.style.setProperty('--hg-out', bms(-6) + 'ms');   // phi: B x PHI^-7 in, B x PHI^-6 back
    if (getComputedStyle(el).position === 'static') el.classList.add('help-grow-rel');
    el.classList.remove('help-settle'); void el.offsetWidth; el.classList.add('help-grow'); st.grown = el;
  }
  // smallfit (15:53 AWST 26 Oct 2026): the rect a grown control settles at (its scale and its PHI^-3 step toward the centre, from grow())
  function grownRect(el) {
    var r = el.getBoundingClientRect(), k = parseFloat(el.style.getPropertyValue('--hg-s')) || 1, dx = parseFloat(el.style.getPropertyValue('--hg-x')) || 0, dy = parseFloat(el.style.getPropertyValue('--hg-y')) || 0;
    var w = r.width * k, h = r.height * k, cx = r.left + r.width / 2 + dx, cy = r.top + r.height / 2 + dy;
    return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2, width: w, height: h };
  }
  function settle() {
    var el = st && st.grown; if (!el) return; st.grown = null;
    el.classList.add('help-settle'); el.classList.remove('help-grow');
    setTimeout(function () { if (el.classList.contains('help-grow')) return; el.classList.remove('help-settle', 'help-grow-rel');
      ['--hg-s', '--hg-x', '--hg-y', '--hg-z', '--hg-in', '--hg-out'].forEach(function (k) { el.style.removeProperty(k); }); }, bms(-6));   // phi: B x PHI^-6
  }

  // ---- her own look (kid's own pick, this device only) ----
  var LOOK_KEY = 'helporb.look.v1';
  var LOOKS = [['orb', 'orb', '?'], ['owl', 'owl', '\uD83E\uDD89'], ['car', 'car', '\uD83D\uDE97'], ['moon', 'moon', '\uD83C\uDF19'], ['star', 'star', '\u2B50'],
    ['butterfly', 'butterfly', '\uD83E\uDD8B'], ['cat', 'cat', '\uD83D\uDC31'], ['unicorn', 'unicorn', '\uD83E\uDD84'], ['flower', 'flower', '\uD83C\uDF38'],
    ['rocket', 'rocket', '\uD83D\uDE80'], ['dolphin', 'dolphin', '\uD83D\uDC2C'], ['rainbow', 'rainbow', '\uD83C\uDF08'], ['heart', 'heart', '\uD83D\uDC97']];   // phi: a Fibonacci 13 looks (orb + 12)
  function lookOf(v) { for (var i = 0; i < LOOKS.length; i++) if (LOOKS[i][0] === v) return { id: v, name: LOOKS[i][1], glyph: LOOKS[i][2] }; return null; }
  function oneEmoji(t) {                                                                    // exactly one emoji, no letters or digits (so never a name)
    t = String(t || '').trim(); if (!t || /[\p{L}\p{N}]/u.test(t) || !/\p{Extended_Pictographic}/u.test(t)) return false;
    if (window.Intl && Intl.Segmenter) { var n = 0, it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t); for (var g of it) { n++; if (n > 1) return false; } return n === 1; }
    return /^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f]+$/u.test(t) && Array.from(t.replace(/[\u200d\ufe0f]/g, '')).length <= 2;
  }
  function readLook() { var o = null; try { o = JSON.parse(localStorage.getItem(LOOK_KEY) || 'null'); } catch (e) {} if (!o || o.v !== 1) return lookOf('orb');
    if (o.emoji && oneEmoji(o.emoji)) return { id: 'own', name: 'helper', glyph: o.emoji }; return lookOf(o.look) || lookOf('orb'); }
  function paintLook() {
    var o = st.orb, L = readLook(); o.textContent = L.glyph; o.setAttribute('data-look', L.id); o.classList.toggle('help-orb--look', L.id !== 'orb');
    o.setAttribute('aria-label', 'Help ' + L.name + '. Drag me onto anything to find out what it does, or press Enter and then Tab through the things I can explain.');
  }
  function setLook(v) {
    var rec = { v: 1 }; if (lookOf(v)) rec.look = v; else if (oneEmoji(v)) rec.emoji = String(v).trim(); else return false;
    try { if (rec.look === 'orb') localStorage.removeItem(LOOK_KEY); else localStorage.setItem(LOOK_KEY, JSON.stringify(rec)); } catch (e) {}
    paintLook(); return true;
  }
  function picker() {
    close(false);
    var p = document.createElement('div'); p.className = 'help-pop help-look'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'false'); p.setAttribute('aria-labelledby', 'help-look-t');
    var h = document.createElement('h2'); h.id = 'help-look-t'; h.textContent = 'Choose how your helper looks'; p.appendChild(h);
    var t = document.createElement('p'); t.textContent = 'It works the same in any look. Your pick stays on this device.'; p.appendChild(t);
    var g = document.createElement('div'); g.className = 'hl-grid'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Looks');
    var cur = readLook();
    LOOKS.forEach(function (L) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'hl-tile'; b.textContent = L[2]; b.setAttribute('aria-label', 'Help ' + L[1]); b.title = L[1];
      b.setAttribute('aria-pressed', cur.id === L[0] ? 'true' : 'false');
      b.addEventListener('click', function () { setLook(L[0]); g.querySelectorAll('.hl-tile').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
      g.appendChild(b);
    });
    p.appendChild(g);
    var f = document.createElement('form'); f.className = 'hl-own';
    var lab = document.createElement('label'); lab.textContent = 'Something else? Type or paste one emoji: '; var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'hl-in';
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('aria-describedby', 'help-look-m'); lab.appendChild(inp); f.appendChild(lab);
    var go = document.createElement('button'); go.type = 'submit'; go.className = 'hl-go'; go.textContent = 'Use it'; f.appendChild(go);
    var m = document.createElement('p'); m.id = 'help-look-m'; m.className = 'hp-try'; m.setAttribute('aria-live', 'polite'); f.appendChild(m);
    f.addEventListener('submit', function (e) { e.preventDefault(); if (setLook(inp.value)) { m.textContent = 'Done! That\u2019s your helper now.'; g.querySelectorAll('.hl-tile').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); } else m.textContent = 'Just one emoji, please (no letters).'; });
    p.appendChild(f);
    var c = document.createElement('button'); c.type = 'button'; c.className = 'hp-close'; c.textContent = 'Done'; c.setAttribute('aria-label', 'Done, close the look picker'); c.addEventListener('click', function () { close(); });
    p.appendChild(c); document.body.appendChild(p); st.pop = p; st.returnTo = st.orb;
    var r = st.orb.getBoundingClientRect(), ph = p.offsetHeight, pw = p.offsetWidth;
    p.style.top = Math.max(0, Math.min(innerHeight - ph, r.bottom)) + 'px'; p.style.left = Math.max(0, Math.min(innerWidth - pw, r.right - pw)) + 'px';
    setTimeout(function () { document.addEventListener('pointerdown', outside, true); }, 0);
    document.addEventListener('keydown', popKeys, true);
    try { g.querySelector('[aria-pressed=true]').focus({ preventScroll: true }); } catch (x) {}
  }
  function seek(on) {
    if (on) apply();
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
    for (var i = 0; i < list.length; i++) { if (list[i] === st.orb || list[i] === st.label || list[i].classList.contains('help-nudge')) continue; var t = list[i].closest('[data-help]'); if (t && t !== st.orb) return t; if (list[i].tagName !== 'HTML') return null; }
    return null;
  }
  // ---- the one help pop-up ----
  function close(refocus) {
    var p = st.pop; if (!p) return;
    st.pop = null; p.remove(); settle(); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', popKeys, true);
    var back = st.returnTo; st.returnTo = null;
    if (refocus !== false && back && back.focus) try { back.focus({ preventScroll: true }); } catch (e) {}
  }
  function outside(e) { if (st.pop && !st.pop.contains(e.target)) close(false); }
  function popKeys(e) {
    if (!st.pop) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { var f = st.pop.querySelectorAll('button,a[href],input'); if (!f.length) return; var a = f[0], z = f[f.length - 1];
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
    var lk = document.createElement('button'); lk.type = 'button'; lk.className = 'hp-look'; lk.textContent = 'Change how I look'; lk.addEventListener('click', function () { picker(); }); p.appendChild(lk);
    var c = document.createElement('button'); c.type = 'button'; c.className = 'hp-close'; c.textContent = 'Close'; c.setAttribute('aria-label', 'Close help'); c.addEventListener('click', function () { close(); });
    p.appendChild(c); grow(el); document.body.appendChild(p); st.pop = p; st.returnTo = st.orb;
    // anchor: below the element if it fits, else above, kept inside the window between the bars
    var r = grownRect(el), ph = p.offsetHeight, pw = p.offsetWidth;   // smallfit: where the control will be once it has grown, not where it starts
    var hb = 0, fb = innerHeight; try { hb = document.getElementById('app-head').getBoundingClientRect().bottom; fb = document.getElementById('app-foot').getBoundingClientRect().top; } catch (x) {}
    if (hb > innerHeight * 0.6) hb = 0; if (fb < innerHeight * 0.4) fb = innerHeight;
    var top = r.bottom + 8; if (top + ph > fb - 4) top = r.top - ph - 8; top = Math.max(4, Math.min(innerHeight - ph - 4, top));
    var left = Math.max(12, Math.min(innerWidth - pw - 12, r.left));
    // smallfit (15:53 AWST 26 Oct 2026): if it fits neither below nor above its control (short landscape phones), it sits beside it,
    // narrowed to the wider side; if no side is at least PHI^-1 of its width, it takes the taller of above / below and scrolls inside.
    // Gap = the control's own height x PHI^-3; heights are capped to the measured space between the bars.
    if (top < r.bottom && top + ph > r.top) {
      var g = r.height * Math.pow(IP, 3), sr = innerWidth - r.right - g * 2, sl = r.left - g * 2, sw = Math.max(sr, sl), band = fb - hb - g * 2;
      p.style.overflowY = 'auto'; p.style.maxHeight = band + 'px';
      if (sw >= pw * IP) {
        p.style.width = Math.min(pw, sw) + 'px'; pw = p.offsetWidth; ph = p.offsetHeight;
        left = sr >= sl ? r.right + g : r.left - pw - g; top = Math.max(hb + g, Math.min(fb - ph - g, r.top + r.height / 2 - ph / 2));
      } else {
        var below = fb - r.bottom - g * 2, above = r.top - hb - g * 2;
        if (below >= above) { p.style.maxHeight = below + 'px'; top = r.bottom + g; } else { p.style.maxHeight = above + 'px'; ph = p.offsetHeight; top = r.top - ph - g; }
      }
    }
    p.style.top = top + 'px'; p.style.left = left + 'px';
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
  // home (t600u): top-right, tucked just under the header; when the section menu/search bar is showing it sits just
  // below that bar instead, and follows it up/down (top transition PHI^-2 = 0.382 s, same as the bar's slide).
  // Never sits on a YouTube player or the open header radio dial: it drops just below any it would cover.
  function anchor() {
    var head = null; try { head = document.querySelector(st.head || '#app-head'); } catch (e) {} var y = head ? head.getBoundingClientRect().bottom : 0;
    var nb = window.RebellaNavbar, nav = document.querySelector('.mainnav');
    if (nav && (!nb || nb.shown())) { var nr = nav.getBoundingClientRect(); if (getComputedStyle(nav).position === 'fixed' || nr.top <= y + 1) y = Math.max(y, y + (nb ? nb.height() : nr.height)); }
    return Math.round(y + 10);
  }
  function avoid() {
    var o = st.orb; if (o.classList.contains('dragging') || o.classList.contains('springing') || o.style.left) return;
    o.style.bottom = 'auto';
    var top = anchor(); o.style.top = top + 'px';
    var h = o.offsetHeight || 48, w = o.offsetWidth || 48, right = window.innerWidth - 14, left = right - w;
    document.querySelectorAll('iframe[src*="youtube"], .br-panel:not([hidden])').forEach(function (f) {
      var p = f.getBoundingClientRect();
      if (left < p.right && right > p.left && top < p.bottom && top + h > p.top) { top = Math.round(p.bottom + 12); o.style.top = top + 'px'; }
    });
    clear(o);
  }
  // smallfit (Kids Club 'every screen fits the smallest phone', 15:53 AWST 26 Oct 2026): at home the orb never sits on another control.
  // It drops just below a header / section-bar control it would cover, and steps left of the Get me out button (the safety exit never
  // moves, so the orb does). Gap = the orb's own height x PHI^-3; at most a Fibonacci 3 passes.
  function clear(o) {
    o.style.right = '';
    var sel = '.escape, #app-head button, #app-head a[href], .mainnav button, .mainnav a[href], #dash-head button, #search-btn';
    for (var pass = 0; pass < 3; pass++) {                                               // unit: a Fibonacci 3 passes (a count)
      var r = o.getBoundingClientRect(), g = r.height * Math.pow(IP, 3), hit = null;
      document.querySelectorAll(sel).forEach(function (c) { if (hit || c === o || !visible(c)) return; var q = c.getBoundingClientRect();
        if (r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) hit = { c: c, q: q }; });
      if (!hit) return;
      if (hit.c.classList.contains('escape') || r.bottom + g + (hit.q.bottom - r.top) > innerHeight) o.style.right = Math.round(innerWidth - hit.q.left + g) + 'px';
      else o.style.top = Math.round(hit.q.bottom + g) + 'px';
    }
  }
  function pick(on) { st.picking = on; st.orb.setAttribute('aria-pressed', on ? 'true' : 'false'); seek(on); if (!on) st.kb = false; }

  function init(opt) {
    if (st) return window.HelpOrb; // exactly one orb
    opt = opt || {};
    document.querySelectorAll('.help-orb').forEach(function (x) { x.remove(); });
    st = { dict: opt.dict || {}, targets: opt.targets || [], head: opt.head || null, hot: null, kb: false, picking: false, pop: null, returnTo: null, grown: null };
    (opt.targets || []).forEach(function (p) { try { document.querySelectorAll(p[0]).forEach(function (el) { if (!el.hasAttribute('data-help')) el.setAttribute('data-help', p[1]); }); } catch (e) {} });
    css(); css2();
    var lab = st.label = document.createElement('span'); lab.className = 'help-label'; lab.hidden = true; lab.setAttribute('aria-hidden', 'true'); document.body.appendChild(lab);
    var o = st.orb = document.createElement('button');
    o.type = 'button'; o.className = 'help-orb'; o.id = 'help-orb'; o.textContent = '?'; o.setAttribute('data-help', 'help-orb'); o.setAttribute('aria-pressed', 'false');
    o.setAttribute('aria-label', 'Help orb. Drag me onto anything to find out what it does, or press Enter and then Tab through the things I can explain.');
    o.setAttribute('data-phi-js', '');
    document.body.appendChild(o); paintLook(); avoid(); nudge();
    window.addEventListener('storage', function (e) { if (e.key === LOOK_KEY) paintLook(); });
    document.addEventListener('help:refresh', function () { apply(); avoid(); });
    window.addEventListener('resize', avoid); document.addEventListener('rebella:navbar', avoid); window.addEventListener('scroll', function () { avoid(); if (st.hot && st.picking) hot(st.hot); }, { passive: true });
    var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    function noScroll(e) { if (down) e.preventDefault(); }
    document.addEventListener('touchmove', noScroll, { passive: false });
    o.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return; e.preventDefault(); close(false); unnudge();
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
  function refresh() { if (!st) return; close(false); pick(false); apply(); home(false); }
  // ---- one-time first-screen nudge ----
  var NUDGE_KEY = 'helporb.nudge.v1';
  function nudge() {
    var seen = false; try { seen = !!localStorage.getItem(NUDGE_KEY); } catch (e) { seen = true; } if (seen) return;
    var n = st.nudge = document.createElement('span'); n.className = 'help-nudge'; n.setAttribute('role', 'status');
    n.textContent = 'Drag me onto anything to ask what it does, or tap me and then tap it.';
    document.body.appendChild(n);
    var r = st.orb.getBoundingClientRect(), u = unit();
    n.style.top = (r.top + r.height / 2 - n.offsetHeight / 2) + 'px'; n.style.right = (innerWidth - r.left + u * IP) + 'px';
    requestAnimationFrame(function () { n.classList.add('on'); });
    n.addEventListener('click', unnudge);
    setTimeout(unnudge, bms(2) || bms(0));   // phi: B x PHI^2
  }
  function unnudge() {
    var n = st && st.nudge; if (!n) return; st.nudge = null; try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {}
    n.classList.remove('on'); setTimeout(function () { n.remove(); }, bms(-7));   // phi: B x PHI^-7
  }
  // the new look, picker and grow styles: every size a phi step of the page's text unit or the Rule phi tap target, colours the orb's own
  function css2() {
    var u = unit(), T = tap(), s = document.createElement('style'); s.id = 'help-orb-css2';
    s.textContent =
      '.help-orb.help-orb--look{font-size:' + u * PHI + 'px}' +
      '.help-grow,.help-settle{scale:var(--hg-s,1);translate:var(--hg-x,0) var(--hg-y,0);z-index:var(--hg-z,auto)}.help-settle{scale:1;translate:0 0}' +
      '.help-grow{transition:scale var(--hg-in) ease-out,translate var(--hg-in) ease-out}.help-settle{transition:scale var(--hg-out) ease-in-out,translate var(--hg-out) ease-in-out}' +
      '.help-grow-rel{position:relative}.help-settle{pointer-events:none}' +   // a control easing back down never swallows a grab meant for the orb
      '.help-pop .hp-look{display:block;margin:0;padding:0;min-height:' + T * IP + 'px;border:0;background:none;color:#8E2350;font:inherit;text-decoration:underline;cursor:pointer}' +
      '.help-look .hl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(' + T + 'px,1fr));gap:' + u * Math.pow(IP, 2) + 'px;margin:0 0 ' + u * Math.pow(IP, 2) + 'px}' +
      '.help-look .hl-tile{min-width:' + T + 'px;min-height:' + T + 'px;font-size:' + u * PHI + 'px;border:2px solid transparent;border-radius:' + T + 'px;background:#FDEEF2;cursor:pointer;padding:0}' +   // anchor: the orb pop-up's own 2px border and colours
      '.help-look .hl-tile[aria-pressed=true]{border-color:#8E2350}.help-look .hl-tile:focus-visible,.help-pop .hp-look:focus-visible{outline:3px solid #8E2350;outline-offset:2px}' +   // anchor: the orb's own focus ring (3px, offset 2px)
      '.help-look .hl-in{font-size:' + u * PHI + 'px;width:' + T * PHI + 'px;min-height:' + T * IP + 'px;margin:0 ' + u * Math.pow(IP, 2) + 'px}' +
      '.help-look .hl-go{min-height:' + T * IP + 'px;border:2px solid #8E2350;border-radius:' + T + 'px;background:#FDEEF2;color:#3D1226;font:inherit;cursor:pointer}' +   // anchor: the orb pop-up's own pill shape, border and colours
      '.help-orb[data-phi-js]{animation-duration:var(--b,6.854s)}' +   // phi: breath B itself (fallback PHI^4 s, the original breath, until B is known)
      '.help-orb[data-phi-js].dragging,.help-orb[data-phi-js].springing,.help-orb[data-phi-js][aria-pressed=true]{animation:helpBreathe var(--b,6.854s) ease-in-out -4.236s infinite;animation-play-state:paused}' +   // phi: the same breath and golden-angle start (PHI^3 s), held, not stopped
      'html.phi-paused .help-orb{animation-play-state:paused}' +
      '.help-nudge{position:fixed;z-index:961;max-width:' + T * Math.pow(PHI, 3) + 'px;padding:' + u * Math.pow(IP, 2) + 'px ' + u * IP + 'px;background:#3D1226;color:#fff;border-radius:' + u + 'px;font:700 ' + u * IP + 'px/' + PHI + ' "Alegreya Sans",sans-serif;cursor:pointer;opacity:0;transition:opacity var(--b-m7,0s) ease-out}' +   // anchor: the help label's own colours and font; z just in front of the orb (960)
      '.help-nudge.on{opacity:1}.help-nudge:not(.on){pointer-events:none}' +
      '@media (prefers-reduced-motion:reduce){.help-grow,.help-settle,.help-nudge{transition:none}}';
    document.head.appendChild(s);
  }
  // a virtual drop (the questionnaire's auto-drop standard): the same open + grow as a real drop
  function drop(el) { if (!st || !el) return false; if (!el.hasAttribute('data-help')) apply(); if (!entry(el)) return false; pick(false); open(el); return true; }
  window.HelpOrb = { init: init, refresh: refresh, close: function () { if (st) close(); }, drop: drop, settle: function () { if (st) settle(); },
    look: function (v) { if (!st) return null; if (v !== undefined) setLook(v); return readLook(); }, looks: function () { return LOOKS.map(function (L) { return L[0]; }); },
    dict: function () { return st ? JSON.parse(JSON.stringify(st.dict)) : {}; }, has: function (k) { return !!(st && (st.dict[k] || k === '_tuning')); } };
})();
