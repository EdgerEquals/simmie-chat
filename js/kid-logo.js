/* KID LOGO: tap-to-open logo view + editor loader (Kids Club "Logo sound and motion standard (global)", "One start, independent per
   site", "Logo grows with the page"; Danny 13:08 AWST 26 Oct 2026, Simmie's chat). Shared module: the SAME file is rebella js/kid-logo.js
   and simmie-chat js/kid-logo.js. Light (rule 1): this file only (a) applies the saved look to the page's logo and (b) makes the logo
   tappable; the view, the editor, the engine and Tone.js load on the first tap only.
   Script tag: <script src=".../js/kid-logo.js" data-site="rebella|dashboard|chat" data-logo="CSS selector of the logo <svg>s"
                data-tone="path of Tone.js from the repo root" defer>
   State: ONE localStorage key per site, 'kidlogo.v1.<site>' (Stream 1, this device only; never sent, no names, kept out of phiAdapt.v1).
   Every site starts from the same logo (the vector file on her dashboard, img/bonnies-logo.svg) and then keeps its own state.
   Sound: no audio and no AudioContext until the first tap; the context is created INSIDE that tap (iOS-safe), never on load.
   Keep alive (Kids Club 'Rhythms keep going while you're away'): inside that same tap the logo sound joins js/rhythm-continuity.js's
   media bridge (hidden <audio> + Media Session), so it keeps playing when she switches apps and resumes on return.
   Second way in (Ask your bot to edit the logo): a link ending in #edit-logo opens this site's editor once the logo is on screen.
   API: window.KidLogo = {site, key, cfg, read(), write(s), apply(), open(edit), logos()}. */
(function (root) {
  'use strict';
  var doc = root.document; if (!doc || root.KidLogo) return;
  var me = doc.currentScript || doc.querySelector('script[src*="kid-logo.js"]');
  if (!me) return;
  var SRC = me.src, DIR = SRC.replace(/[^\/]*$/, ''), BASE = DIR.replace(/js\/$/, '');
  var SITE = me.getAttribute('data-site') || 'site', SEL = me.getAttribute('data-logo') || '';
  var KEY = 'kidlogo.v1.' + SITE, PHI = (1 + Math.sqrt(5)) / 2;                       // phi: the golden ratio, the only scaling factor
  var V = (/[?&]v=([^&#]+)/.exec(SRC) || [])[1] || '';
  var cfg = { site: SITE, base: BASE, dir: DIR, v: V, tone: BASE + (me.getAttribute('data-tone') || 'vendor/tone/Tone.js') };
  // name check on logo words: a SEPARATE switch, OFF unless the tag says data-name-check-logo="on" (Danny 13:27 AWST 26 Oct 2026: the logo
  // editor has no name filter, only the gentle heart note; the 14:51 "name check on every word" standard would cover logo words, so this
  // waits for Danny to choose). data-name-list = where the salted hash list lives (relative to the page).
  cfg.nameLogo = me.getAttribute('data-name-check-logo') === 'on'; cfg.nameList = me.getAttribute('data-name-list') || '';
  root.KidLogoCfg = cfg;

  // the colour of each spot's original logo, read once from the page before anything is applied (the safe-side reference)
  var orig = new WeakMap();
  function logos() { return SEL ? [].slice.call(doc.querySelectorAll(SEL)) : []; }
  function read() { try { var s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : { v: 1 }; } catch (e) { return { v: 1 }; } }
  function write(s) { s.v = 1; try { root.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} return s; }

  // ---- colour: her palette tiles, stepped by phi toward the safe side until the spot keeps the contrast its original logo had ----
  function rgb(c) { var m = /rgba?\(([^)]+)\)/.exec(c || ''); if (m) { var p = m[1].split(',').map(parseFloat); return p.length > 3 && p[3] === 0 ? null : p.slice(0, 3); }   // unit: rgb() channels + alpha (CSS Color 4)
    m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return null; var n = parseInt(m[1], 16);   // unit: hex digits
    return [n >> 16 & 255, n >> 8 & 255, n & 255]; }                                   // unit: 8-bit sRGB channels
  function lum(c) { return c.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })   // cite: WCAG 2.2 relative luminance (sRGB)
      .reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }                                              // cite: WCAG 2.2 relative luminance weights
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }                    // cite: WCAG 2.2 contrast ratio
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }   // unit: hex digits
  function bgOf(el) { for (var n = el; n && n.nodeType === 1; n = n.parentNode) { var c = rgb(getComputedStyle(n).backgroundColor); if (c) return c; }
    return [255, 255, 255]; }                                                            // cite: CSS Backgrounds, the canvas is white when nothing paints it
  function safeColour(el, want) {
    var w = rgb(want); if (!w) return null;
    var o = orig.get(el), bg = bgOf(el), need = o ? contrast(o, bg) : 0;
    var toward = lum(bg) > lum(w) ? [0, 0, 0] : [255, 255, 255];                          // unit: black / white ends of sRGB
    for (var k = 0; k < 13; k++) {                                                        // phi: at most 13 (Fibonacci) phi steps
      var f = k ? 1 - Math.pow(PHI, -k) : 0, c = w.map(function (v, i) { return v + (toward[i] - v) * f; });
      if (contrast(c, bg) >= need) return hex(c);
    }
    return hex(toward);
  }

  // ---- apply the saved look to every logo on this page (colour, glow, own art, size). Size only steps DOWN from the original, with the CSS
  //      `scale` property (no layout change), so header and footer silhouettes never change ----
  var NS = 'http://www.w3.org/2000/svg';   // unit: the SVG namespace URI
  function glowCss(g) {
    if (g === 'off') return 'none';
    var a = g === 'soft' ? Math.pow(PHI, -1) : 1;
    return 'drop-shadow(0 0 ' + Math.pow(PHI, -1) + 'px rgba(248,207,219,' + a + ')) drop-shadow(0 0 ' + Math.pow(PHI, 3) + 'px rgba(229,138,166,' + Math.pow(PHI, -1) * a + '))';   // anchor: the dashboard neon colours (core #F8CFDB, glow #E58AA6)
  }
  function setArt(svg, art) {
    if (!svg.__kl) svg.__kl = { vb: svg.getAttribute('viewBox'), use: svg.querySelector('use') };
    var keep = svg.__kl, old = svg.querySelector('.kl-art'); if (old) old.parentNode.removeChild(old);
    if (!art) { svg.setAttribute('viewBox', keep.vb); if (keep.use && !keep.use.parentNode) svg.appendChild(keep.use); return; }
    if (keep.use && keep.use.parentNode) keep.use.parentNode.removeChild(keep.use);
    svg.setAttribute('viewBox', art.vb); svg.appendChild(artNode(art));
  }
  function artNode(art) {
    var g = doc.createElementNS(NS, 'g'); g.setAttribute('class', 'kl-art');
    if (art.kind === 'type') { var t = doc.createElementNS(NS, 'text'); t.textContent = art.text || '';
      t.setAttribute('x', '50%'); t.setAttribute('y', '50%'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');   // unit: centre of the box (the halving)
      t.setAttribute('font-size', art.fs); t.setAttribute('fill', 'currentColor'); t.setAttribute('font-family', "'Segoe Script','Brush Script MT','Snell Roundhand','Apple Chancery',cursive");
      g.appendChild(t); }
    else (art.paths || []).forEach(function (p) { var e = doc.createElementNS(NS, 'path'); e.setAttribute('d', p.d);
      if (p.stroke) { e.setAttribute('fill', 'none'); e.setAttribute('stroke', 'currentColor'); e.setAttribute('stroke-width', p.stroke); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); }
      else { e.setAttribute('fill', 'currentColor'); if (p.rule) e.setAttribute('fill-rule', p.rule); }
      g.appendChild(e); });
    return g;
  }
  function apply() {
    var s = read();
    logos().forEach(function (el) {
      if (!orig.has(el)) orig.set(el, rgb(getComputedStyle(el).color));
      el.style.color = s.colour ? (safeColour(el, s.colour) || '') : '';
      el.style.filter = s.glow ? glowCss(s.glow) : '';
      el.style.scale = s.size ? String(Math.pow(PHI, s.size)) : '';                     // phi: whole steps, never above the original (bars keep their shape)
      setArt(el, s.art || null);
    });
  }

  // ---- tap to open (the logo itself is the way back in; keyboard Enter/Space too) ----
  var AC = null, loading = null;
  function audio() {                                                                     // only ever called inside a tap
    if (read().sound === false) return AC;
    try { var C = root.AudioContext || root.webkitAudioContext; if (!C) return null; if (!AC) AC = new C(); if (AC.state !== 'running') AC.resume(); } catch (e) { AC = null; }
    try { if (AC && root.RhythmContinuity) RhythmContinuity.media(AC).play('logo', { pause: function () { root.KidLogoView && root.KidLogoView.close(); } }); } catch (e) {}   // keep alive: the media bridge starts inside this tap (iOS)
    return AC;
  }
  function css(href) { if (doc.querySelector('link[data-kl]')) return; var l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-kl', ''); doc.head.appendChild(l); }
  function load() {
    if (root.KidLogoView) return Promise.resolve();
    if (!loading) { css(BASE + 'css/kid-logo.css' + (V ? '?v=' + V : ''));
      loading = new Promise(function (res) { var s = doc.createElement('script'); s.src = DIR + 'kid-logo-view.js' + (V ? '?v=' + V : ''); s.async = true; s.onload = s.onerror = res; doc.head.appendChild(s); }); }
    return loading;
  }
  function open(el, edit) { el = el || logos().filter(function (x) { return x.getClientRects().length; })[0]; if (!el) return;
    var ac = audio(); load().then(function () { if (root.KidLogoView) root.KidLogoView.open(el, { ac: ac, edit: !!edit }); }); }
  function hostOf(el) { var a = el.closest ? el.closest('a') : null; return a || el; }
  function wire(el) {
    if (el.__klWired) return; el.__klWired = true;
    var h = hostOf(el);
    if (h === el) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('focusable', 'true'); }
    h.setAttribute('aria-haspopup', 'dialog'); h.setAttribute('aria-label', 'Rebella logo: open it, tap again to edit');
    h.classList.add('kl-tap');
    h.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(el, false); }, true);
    h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el, false); } });
  }
  function wireAll() { logos().forEach(wire); apply(); }
  function deepLink() {
    if (root.location.hash !== '#edit-logo') return;
    var tries = 0, t = setInterval(function () {
      var el = logos().filter(function (x) { return x.getClientRects().length; })[0];
      if (el) { clearInterval(t); load().then(function () { root.KidLogoView && root.KidLogoView.open(el, { ac: null, edit: true }); }); }
      else if (++tries > 89) clearInterval(t);                                            // phi: 89 (Fibonacci) checks, then stop
    }, root.PhiB && PhiB.ms(-5) || Math.pow(PHI, 13));                                   // phi: B x PHI^-5 (or PHI^13 ms without B)
  }
  root.KidLogo = { site: SITE, key: KEY, cfg: cfg, read: read, write: write, apply: apply, open: function (edit) { open(null, edit); }, logos: logos, safeColour: safeColour, artNode: artNode, glowCss: glowCss };
  function boot() { wireAll(); deepLink();
    // pages that swap content (Rebella nav) or reveal the logo after a gate keep working: re-wire when nodes change
    if ('MutationObserver' in root) new MutationObserver(function () { logos().forEach(function (el) { if (!el.__klWired) { wire(el); apply(); } }); }).observe(doc.body, { childList: true, subtree: true });
    root.addEventListener('hashchange', deepLink); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
