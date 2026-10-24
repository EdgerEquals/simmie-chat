/* Space orbit layer (Danny 13:01-13:03 AWST 24 Oct, t626u/t628u/t629u); styles + period table in css/quiz-space-sweep.css.
   4 slow space emojis on two tilted rings (-20deg, +25deg) in the middle band (header bottom -> footer top).
   Feeds from js/ratio-pump.js (RatioPump.feeds(), no new requests): ORBIT speed <- moon (illumination 0..1), OPACITY pulse <-
   day (Perth time of day 0..1). Re-read on 'ratiopump:change' and once a minute; a new period keeps each animation's progress
   (currentTime re-seeked), so nothing jumps. Golden-angle start offsets. Pauses while the tab is hidden. No network, no storage. */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var PHI = 1.6180339887, G = 0.6180339887;
  //        emoji                ring  offset  rotation keyframes + ease           rotation exponent
  var SET = [['\uD83E\uDE90',      0,   -0.30, 'qsSpin', 'linear',      7.125],    // ringed planet: spins 360
             ['\uD83D\uDEF0\uFE0F', 1,   0.28, 'qsFlip', 'ease-in-out', 7.375],    // satellite: flips (rotateY 0 -> 180 -> 360)
             ['\u2604\uFE0F',       0,   0.32, 'qsHalf', 'ease-in-out', 7.625],    // comet: 180 and back
             ['\uD83C\uDF19',       1,  -0.26, 'qsRock', 'ease-in-out', 7.875]];   // moon: gentle rock +-20deg
  var RINGS = [-20, 25];
  function orbitExp(ring, moon) { return ring === 0 ? 10 - 0.5 * moon : 9.5 - 0.25 * moon; }
  function pulseExp(j, day) { return 5.25 + 0.5 * day + j / 8; }
  function feeds() { try { return window.RatioPump ? window.RatioPump.feeds() : {}; } catch (e) { return {}; } }
  // 'wx-seq' opts this layer out of the page's PhiTiming weather sweep (it would re-time these loops at iteration boundaries);
  // the layer runs on its own moon/day feeds instead. The ratio pump + Dad's dial still apply (they skip only [data-phi-js]).
  var L = document.createElement('div'); L.className = 'qs-layer wx-seq'; L.setAttribute('aria-hidden', 'true');
  var rings = RINGS.map(function (deg) { var r = document.createElement('div'); r.className = 'qs-ring'; r.style.setProperty('--ring', deg + 'deg'); L.appendChild(r); return r; });
  var f0 = feeds(), moon0 = f0.moon != null ? f0.moon : 0.5, day0 = f0.day != null ? f0.day : 0.5;
  var items = SET.map(function (d, j) {
    var k = j + 1, e = document.createElement('span'), rot = document.createElement('span'), op = document.createElement('span');
    e.className = 'qs'; rot.className = 'qs-rot'; op.className = 'qs-op'; op.textContent = d[0]; rot.appendChild(op); e.appendChild(rot);
    var To = Math.pow(PHI, orbitExp(d[1], moon0)), Tr = Math.pow(PHI, d[5]), Tp = Math.pow(PHI, pulseExp(j, day0));
    e.style.setProperty('--qs-orbit', To.toFixed(3) + 's'); e.style.setProperty('--del', (-To * ((k * G) % 1)).toFixed(3) + 's');
    rot.style.setProperty('--qs-rot', Tr.toFixed(3) + 's'); rot.style.setProperty('--rdel', (-Tr * ((k * G * G) % 1)).toFixed(3) + 's');
    rot.style.setProperty('--rot-kf', d[3]); rot.style.setProperty('--rot-ease', d[4]);
    op.style.setProperty('--qs-pulse', Tp.toFixed(3) + 's'); op.style.setProperty('--pdel', (-Tp * ((k * G * G * G) % 1)).toFixed(3) + 's');
    rings[d[1]].appendChild(e);
    return { d: d, j: j, e: e, op: op };
  });
  document.body.appendChild(L);
  // change a duration var but keep the animation's progress (no jump)
  function retime(el, name, prop, secs) {
    var a = el.getAnimations ? el.getAnimations().filter(function (x) { return x.animationName === name; })[0] : null, p = null;
    if (a && a.currentTime != null) { var t = a.effect.getTiming(); p = ((a.currentTime - t.delay) / t.duration) % 1; }
    el.style.setProperty(prop, secs.toFixed(3) + 's');   // record of the current period (and the value if the animation restarts)
    if (a && p != null) { var ms = secs * 1000, d = a.effect.getTiming().delay; a.effect.updateTiming({ duration: ms }); a.currentTime = d + p * ms; }
  }
  var last = { moon: moon0, day: day0 };
  function update() {
    var f = feeds(); if (f.moon == null || f.day == null) return;
    if (Math.abs(f.moon - last.moon) < 0.002 && Math.abs(f.day - last.day) < 0.002) return;
    last = { moon: f.moon, day: f.day };
    items.forEach(function (it) {
      retime(it.e, 'qsOrbit', '--qs-orbit', Math.pow(PHI, orbitExp(it.d[1], f.moon)));
      retime(it.op, 'qsPulse', '--qs-pulse', Math.pow(PHI, pulseExp(it.j, f.day)));
    });
  }
  document.addEventListener('ratiopump:change', update);
  setInterval(function () { if (!document.hidden) update(); }, 60000);
  function band() {
    var h = document.getElementById('q-head'), ft = document.querySelector('.foot');
    var top = h ? Math.max(0, h.getBoundingClientRect().bottom) : 0, bot = ft ? ft.getBoundingClientRect().top : innerHeight;
    var H = Math.max(40, Math.round(bot - top - 16)), W = L.clientWidth || innerWidth;
    L.style.setProperty('--qs-top', Math.round(top + 8) + 'px'); L.style.setProperty('--qs-h', H + 'px');
    items.forEach(function (it) { it.e.style.setProperty('--off', Math.round(it.d[2] * H) + 'px'); it.e.style.setProperty('--len', Math.round(1.5 * W + 48) + 'px'); });
  }
  var r = 0; function q() { if (!r) r = requestAnimationFrame(function () { r = 0; band(); }); }
  addEventListener('resize', q); addEventListener('scroll', q, { passive: true });
  if (window.ResizeObserver) { var ro = new ResizeObserver(q), hh = document.getElementById('q-head'), ff = document.querySelector('.foot'); if (hh) ro.observe(hh); if (ff) ro.observe(ff); }
  document.addEventListener('visibilitychange', function () { L.classList.toggle('qs-paused', document.hidden); });
  band();
  window.QuizSpaceOrbit = { info: function () { var f = feeds(); return { moon: f.moon, day: f.day, items: items.map(function (it) {
    return { e: it.d[0], ring: RINGS[it.d[1]], orbitExp: +orbitExp(it.d[1], f.moon).toFixed(4), rotExp: it.d[5], rot: it.d[3], pulseExp: +pulseExp(it.j, f.day).toFixed(4) }; }) }; } };
})();
