/* Space orbit layer (Danny 13:01-13:03 AWST 24 Oct, t626u/t628u/t629u); styles + period table in css/quiz-space-sweep.css.
   4 slow space emojis on two tilted rings (-20deg, +25deg) in the middle band (header bottom -> footer top).
   Feeds from js/ratio-pump.js (RatioPump.feeds(), no new requests): ORBIT speed <- moon (illumination 0..1), OPACITY pulse <-
   day (Perth time of day 0..1). Re-read on 'ratiopump:change' and once a minute; a new period keeps each animation's progress
   (currentTime re-seeked), so nothing jumps. Golden-angle start offsets. Pauses while the tab is hidden. No network, no storage. */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var PHI = 1.6180339887, G = 0.6180339887;
  // t658u (Danny 13:40 AWST 24 Oct): the straight passes along the two tilted rings became tilted ELLIPSES centred near (not in) the
  // top-right corner of the band: cx = [6] x band width, cy = [7] x band height. Size = 1.3x the old pass: semi-major 1.3 x half
  // the band width (0.65 W), semi-minor 1.3 x the old ring offset (|offset| x H). Rings keep their tilt (-20 / +25 deg).
  //        emoji                ring  offset  rotation keyframes + ease           rotation exponent  cx    cy
  var SET = [['\uD83E\uDE90',      0,   -0.30, 'qsSpin', 'linear',      7.125,             0.75, 0.27],    // ringed planet: spins 360
             ['\uD83D\uDEF0\uFE0F', 1,   0.28, 'qsFlip', 'ease-in-out', 7.375,             0.77, 0.29],    // satellite: flips (rotateY 0 -> 180 -> 360)
             ['\u2604\uFE0F',       0,   0.32, 'qsHalf', 'ease-in-out', 7.625,             0.73, 0.26],    // comet: 180 and back
             ['\uD83C\uDF19',       1,  -0.26, 'qsRock', 'ease-in-out', 7.875,             0.76, 0.30]];   // moon: gentle rock +-20deg
  var GROW = 1.3;
  var RINGS = [-20, 25];
  function orbitExp(ring, moon) { return ring === 0 ? 10 - 0.5 * moon : 9.5 - 0.25 * moon; }
  function pulseExp(j, day) { return 5.25 + 0.5 * day + j / 8; }
  function feeds() { try { return window.RatioPump ? window.RatioPump.feeds() : {}; } catch (e) { return {}; } }
  // 'wx-seq' opts this layer out of the page's PhiTiming weather sweep (it would re-time these loops at iteration boundaries);
  // the layer runs on its own moon/day feeds instead. The ratio pump + Dad's dial still apply (they skip only [data-phi-js]).
  var L = document.createElement('div'); L.className = 'qs-layer wx-seq'; L.setAttribute('aria-hidden', 'true');
  var f0 = feeds(), moon0 = f0.moon != null ? f0.moon : 0.5, day0 = f0.day != null ? f0.day : 0.5;
  var items = SET.map(function (d, j) {
    var k = j + 1, o = document.createElement('div'), e = document.createElement('span'), y = document.createElement('span'), c = document.createElement('span'),
        rot = document.createElement('span'), op = document.createElement('span');
    o.className = 'qs-orb'; o.style.setProperty('--ring', RINGS[d[1]] + 'deg');
    e.className = 'qs'; y.className = 'qs-y'; c.className = 'qs-c'; rot.className = 'qs-rot'; op.className = 'qs-op'; op.textContent = d[0];
    rot.appendChild(op); c.appendChild(rot); y.appendChild(c); e.appendChild(y); o.appendChild(e); L.appendChild(o);
    var To = Math.pow(PHI, orbitExp(d[1], moon0)), Tr = Math.pow(PHI, d[5]), Tp = Math.pow(PHI, pulseExp(j, day0));
    // ellipse = x and y each swinging -r..+r every T/2 (alternate, sine ease), y a quarter period behind; golden-angle phase
    var ph = (k * G) % 1;
    e.style.setProperty('--qs-half', (To / 2).toFixed(3) + 's'); e.style.setProperty('--del', (-To * ph).toFixed(3) + 's');
    y.style.setProperty('--qs-half', (To / 2).toFixed(3) + 's'); y.style.setProperty('--ydel', (-To * ((ph + 0.25) % 1)).toFixed(3) + 's');
    rot.style.setProperty('--qs-rot', Tr.toFixed(3) + 's'); rot.style.setProperty('--rdel', (-Tr * ((k * G * G) % 1)).toFixed(3) + 's');
    rot.style.setProperty('--rot-kf', d[3]); rot.style.setProperty('--rot-ease', d[4]);
    op.style.setProperty('--qs-pulse', Tp.toFixed(3) + 's'); op.style.setProperty('--pdel', (-Tp * ((k * G * G * G) % 1)).toFixed(3) + 's');
    return { d: d, j: j, o: o, e: e, y: y, op: op };
  });
  document.body.appendChild(L);
  // change a duration var but keep the animation's progress (no jump)
  function retime(el, name, prop, secs) {
    var a = el.getAnimations ? el.getAnimations().filter(function (x) { return x.animationName === name; })[0] : null, p = null;
    // progress kept in whole iterations too (not mod 1), so alternate-direction animations keep their direction (no jump)
    if (a && a.currentTime != null) { var t = a.effect.getTiming(); p = (a.currentTime - t.delay) / t.duration; }
    el.style.setProperty(prop, secs.toFixed(3) + 's');   // record of the current period (and the value if the animation restarts)
    if (a && p != null) { var ms = secs * 1000, d = a.effect.getTiming().delay; a.effect.updateTiming({ duration: ms }); a.currentTime = d + p * ms; }
  }
  var last = { moon: moon0, day: day0 };
  function update() {
    var f = feeds(); if (f.moon == null || f.day == null) return;
    if (Math.abs(f.moon - last.moon) < 0.002 && Math.abs(f.day - last.day) < 0.002) return;
    last = { moon: f.moon, day: f.day };
    items.forEach(function (it) {
      var h = Math.pow(PHI, orbitExp(it.d[1], f.moon)) / 2;
      retime(it.e, 'qsX', '--qs-half', h); retime(it.y, 'qsY', '--qs-half', h);
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
    items.forEach(function (it) {
      it.o.style.setProperty('--cx', Math.round(it.d[6] * W) + 'px'); it.o.style.setProperty('--cy', Math.round(it.d[7] * H) + 'px');
      it.e.style.setProperty('--rx', Math.round(GROW * 0.5 * W) + 'px'); it.y.style.setProperty('--ry', Math.round(GROW * Math.abs(it.d[2]) * H) + 'px');
    });
  }
  var r = 0; function q() { if (!r) r = requestAnimationFrame(function () { r = 0; band(); }); }
  addEventListener('resize', q); addEventListener('scroll', q, { passive: true });
  if (window.ResizeObserver) { var ro = new ResizeObserver(q), hh = document.getElementById('q-head'), ff = document.querySelector('.foot'); if (hh) ro.observe(hh); if (ff) ro.observe(ff); }
  document.addEventListener('visibilitychange', function () { L.classList.toggle('qs-paused', document.hidden); });
  band();
  window.QuizSpaceOrbit = { info: function () { var f = feeds(); return { moon: f.moon, day: f.day, items: items.map(function (it) {
    return { e: it.d[0], ring: RINGS[it.d[1]], cx: it.o.style.getPropertyValue('--cx'), cy: it.o.style.getPropertyValue('--cy'), rx: it.e.style.getPropertyValue('--rx'), ry: it.y.style.getPropertyValue('--ry'), orbitExp: +orbitExp(it.d[1], f.moon).toFixed(4), rotExp: it.d[5], rot: it.d[3], pulseExp: +pulseExp(it.j, f.day).toFixed(4) }; }) }; } };
})();
