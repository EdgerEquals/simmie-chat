/* Front orbit layer (Danny 13:22-13:24 AWST 24 Oct, t641u/t642u/t643u/t644u); styles + notes in css/quiz-front-orbit.css.
   Ellipses are anchored to the greeting block (#start h1, .from, avatar, intro row) in DOCUMENT coordinates, so they scroll
   with the content; the layer sits under the pinned header / fixed footer (z-order) and is clip-path'd to the band between
   them. Periods are CSS animation durations, so RatioPump (rate() = Dad's dial 0.75 x pump) scales them; QuizFrontOrbit.info()
   reports base and effective seconds. No network, no storage. */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var start = document.getElementById('start'); if (!start) return;
  var PHI = 1.6180339887, G = 0.6180339887;
  //         emoji          target selector        tilt  travel exp  pulse exp  ellipse sizing
  var SET = [['\u2B50',      '#start .from',         -20, 8.125, 5.04, 'reachUp'],    // star: tall sweep across "from Dad", up under the header
             ['\uD83D\uDE80', '#start h1',             25, 8.375, 5.10, 'wide'],       // rocket: around the heading
             ['\u2728',      '#start .simmie',       -20, 8.625, 5.16, 'reachDown'],  // sparkles: through the avatar, down under the footer
             ['\uD83C\uDF0D', '#start .leadrow',       25, 8.875, 5.22, 'row']];       // globe: around avatar + intro row
  var head = document.getElementById('q-head'), foot = document.getElementById('foot') || document.querySelector('.foot');
  var L = document.createElement('div'); L.className = 'qf-layer wx-seq'; L.setAttribute('aria-hidden', 'true');
  var items = SET.map(function (d, j) {
    var k = j + 1, o = document.createElement('div'), x = document.createElement('span'), y = document.createElement('span'),
        u = document.createElement('span'), op = document.createElement('span');
    o.className = 'qf-orb'; x.className = 'qf-x'; y.className = 'qf-y'; u.className = 'qf-up'; op.className = 'qf-op';
    op.textContent = d[0]; u.appendChild(op); y.appendChild(u); x.appendChild(y); o.appendChild(x); L.appendChild(o);
    var T = Math.pow(PHI, d[3]), H = T / 2, Tp = Math.pow(PHI, d[4]), ph = (k * G) % 1;   // golden-angle phase of the orbit
    o.style.setProperty('--tilt', d[2] + 'deg'); u.style.setProperty('--untilt', (-d[2]) + 'deg');
    // x(t) and y(t) each swing -r..+r every T/2 (alternate) with a sine ease; y runs a quarter period behind -> ellipse
    x.style.setProperty('--qf-half', H.toFixed(3) + 's'); y.style.setProperty('--qf-half', H.toFixed(3) + 's');
    x.style.setProperty('--dx', (-T * ph).toFixed(3) + 's'); y.style.setProperty('--dy', (-T * ((ph + 0.25) % 1)).toFixed(3) + 's');
    op.style.setProperty('--qf-pulse', Tp.toFixed(3) + 's'); op.style.setProperty('--pdel', (-Tp * ((k * G * G) % 1)).toFixed(3) + 's');
    return { d: d, o: o, T: T, Tp: Tp };
  });
  document.body.appendChild(L);
  var hd0 = null;   // header bottom at scroll 0 (document coords)
  function layout() {
    L.hidden = start.hidden; if (start.hidden) return;
    var sy = window.scrollY || 0, sr = start.getBoundingClientRect();
    if (hd0 == null || (head && !head.classList.contains('is-scrolled'))) hd0 = head ? head.getBoundingClientRect().bottom + sy : 0;
    var ftTop = foot ? foot.getBoundingClientRect().top : innerHeight;   // fixed: same in document coords at scroll 0
    var docH = document.documentElement.scrollHeight;
    L.style.setProperty('--qf-h', Math.round(Math.min(docH, Math.max(ftTop, sr.bottom + sy) + 40)) + 'px');
    items.forEach(function (it) {
      var t = document.querySelector(it.d[1]); if (!t) return;
      var r = t.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + sy + r.height / 2, rx, ry;
      switch (it.d[5]) {
        case 'reachUp':   rx = Math.max(40, Math.min(110, r.width * 0.3)); ry = Math.max(60, cy - hd0 + 26); break;
        case 'wide':      rx = r.width * 0.52; ry = r.height * 0.5 + 26; break;
        case 'reachDown': rx = 42; ry = Math.max(60, ftTop - cy + 26); break;
        default:          rx = r.width * 0.5; ry = r.height * 0.5 + 22;
      }
      it.o.style.setProperty('--cx', Math.round(cx) + 'px'); it.o.style.setProperty('--cy', Math.round(cy) + 'px');
      it.o.firstChild.style.setProperty('--rx', Math.round(rx) + 'px'); it.o.firstChild.firstChild.style.setProperty('--ry', Math.round(ry) + 'px');
    });
    clip();
  }
  var THR = 0, away = false;
  function clip() {   // clip-path inset = header bottom edge / footer top edge, in layer coords
    var lr = L.getBoundingClientRect(), hb = head ? head.getBoundingClientRect().bottom : 0, ft = foot ? foot.getBoundingClientRect().top : innerHeight;
    L.style.setProperty('--qf-ct', Math.max(0, Math.round(hb - lr.top)) + 'px');
    L.style.setProperty('--qf-cb', Math.max(0, Math.round(lr.bottom - ft)) + 'px');
    THR = Math.round(innerHeight / 12);   // t644u: one third of the ~1/4-viewport point Danny saw them vanish
    var a = (window.scrollY || 0) > THR; if (a !== away) { away = a; document.documentElement.classList.toggle('qorb-away', a); }
  }
  var r1 = 0, r2 = 0;
  function qL() { if (!r1) r1 = requestAnimationFrame(function () { r1 = 0; layout(); }); }
  function qC() { if (!r2) r2 = requestAnimationFrame(function () { r2 = 0; clip(); }); }
  addEventListener('resize', qL); addEventListener('orientationchange', qL); addEventListener('scroll', qC, { passive: true });
  if (window.ResizeObserver) { var ro = new ResizeObserver(qL); ro.observe(start); if (head) ro.observe(head); if (foot) ro.observe(foot); }
  if (window.MutationObserver) new MutationObserver(qL).observe(start, { attributes: true, attributeFilter: ['hidden'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(qL);
  addEventListener('load', qL);
  document.addEventListener('visibilitychange', function () { L.classList.toggle('qf-paused', document.hidden); });
  layout();
  window.QuizFrontOrbit = { info: function () {
    var rate = 1; try { rate = window.RatioPump ? window.RatioPump.rate() : 1; } catch (e) {}
    return { rate: rate, fadeThresholdPx: THR, viewportH: innerHeight, items: items.map(function (it) {
      return { e: it.d[0], around: it.d[1], tilt: it.d[2], travelExp: it.d[3], travelS: +it.T.toFixed(2), travelEffS: +(it.T / rate).toFixed(2),
        pulseExp: it.d[4], pulseS: +it.Tp.toFixed(2), pulseEffS: +(it.Tp / rate).toFixed(2),
        rx: it.o.firstChild.style.getPropertyValue('--rx'), ry: it.o.firstChild.firstChild.style.getPropertyValue('--ry') }; }) }; } };
})();
