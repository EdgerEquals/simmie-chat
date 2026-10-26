/* OWN COPY for Bonnie's sites (rebella js/phi-axes.js = simmie-chat js/phi-axes.js), ported from dad-page js/phi-axes.js (b8048ff) per the
   logo standard ('kids' pages keep their own copies of the engine files rather than linking to dad-page'). Kids Club standard 'motion rides
   two corner-to-corner axes' (Danny 15:56 AWST 26 Oct 2026). Unchanged below apart from this note. */
/* PHI AXES (Danny 15:56 / 15:59 AWST 26 Oct 2026; shared standard 'motion rides two corner-to-corner axes'). The scene's base frame:
   the four corners of the measured visual viewport (after safe-area insets) give axis A (top-left -> bottom-right) and axis B
   (top-right -> bottom-left), crossing at C. A point is (a, b): ratios along A and along B, each -1 .. 1 from C to the corners:
     P = C + a * hA * uA + b * hB * uB      (hA, hB = half-diagonals, uA, uB = unit vectors)
   so a = -1 is the top-left corner, a = 1 bottom-right, b = -1 top-right, b = 1 bottom-left. Nothing is in px until at().
   The axes turn slowly about C on one pump node ('axes', 3 pumps): angle = PHI^-7 turn x (pump - 1), so at rest they are the true
   diagonals. Recomputed on load, resize, rotation and visualViewport changes; subscribers re-place on change (PhiAxes.on).
   ?axes=1 draws both axes and C as a debug overlay. Tiny, deferred, no layout reads per frame (corners measured on change only). */
(function () {
  'use strict';
  var doc = document, root = window;
  var PHI = (1 + Math.sqrt(5)) / 2, IP = 1 / PHI, TAU = 2 * Math.PI;   // phi; unit: a turn
  var F = { cx: 0, cy: 0, a: { x: 1, y: 0, h: 0 }, b: { x: -1, y: 0, h: 0 }, rot: 0, w: 0, h: 0, x0: 0, y0: 0 }, subs = [];
  var probe = null;
  function inset() {                                                    // safe-area insets via env(), read from one probe element
    if (!probe) { probe = doc.createElement('i'); probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; doc.body.appendChild(probe); }
    var c = getComputedStyle(probe); return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
  }
  var pump = null;
  function turn() { var P = root.PhiPumps; if (P && !pump) pump = P.node('axes', 3, 8, Math.pow(IP, 4), P.page, 34); var k = 1; try { k = pump ? pump.out() : 1; } catch (e) {} return TAU * Math.pow(IP, 7) * (k - 1); }   // phi: 3 pumps, rungs 8.., depth PHI^-4; tilt PHI^-7 turn per unit of swing
  function measure() {
    var v = root.visualViewport, s = inset();
    var x0 = (v ? v.offsetLeft : 0) + s.l, y0 = (v ? v.offsetTop : 0) + s.t;
    var w = (v ? v.width : innerWidth) - s.l - s.r, h = (v ? v.height : innerHeight) - s.t - s.b;   // anchor: measured viewport
    F.x0 = x0; F.y0 = y0; F.w = w; F.h = h; F.cx = x0 + w / 2; F.cy = y0 + h / 2; orient(); emit();
  }
  function orient() {
    var r = turn(), c = Math.cos(r), s = Math.sin(r), w = F.w, h = F.h, L = Math.sqrt(w * w + h * h) || 1;   // unit: Pythagoras
    var ax = w / L, ay = h / L, bx = -w / L, by = h / L;                     // unit: TL->BR and TR->BL directions
    F.rot = r; F.a = { x: ax * c - ay * s, y: ax * s + ay * c, h: L / 2 }; F.b = { x: bx * c - by * s, y: bx * s + by * c, h: L / 2 };   // unit: half-diagonals
  }
  function at(a, b) { return { x: F.cx + a * F.a.h * F.a.x + b * F.b.h * F.b.x, y: F.cy + a * F.a.h * F.a.y + b * F.b.h * F.b.y }; }
  function dir(a, b) { return { x: a * F.a.h * F.a.x + b * F.b.h * F.b.x, y: a * F.a.h * F.a.y + b * F.b.h * F.b.y }; }   // a displacement, not a point
  function emit() { subs.forEach(function (f) { try { f(F); } catch (e) {} }); if (dbg) draw(); }
  var rq = 0; function soon() { if (!rq) rq = requestAnimationFrame(function () { rq = 0; measure(); }); }
  addEventListener('resize', soon); addEventListener('orientationchange', soon);
  if (root.visualViewport) { visualViewport.addEventListener('resize', soon); visualViewport.addEventListener('scroll', soon); }
  setInterval(function () { if (!doc.hidden) { orient(); emit(); } }, Math.pow(PHI, 5) * 1e3);   // phi: re-tilt once per PHI^5 s (slow drift); unit: ms
  // ---------- ?axes=1 debug overlay ----------
  var dbg = /[?&]axes=1\b/.test(location.search), svg = null;
  function draw() {
    if (!svg) { var NS = 'http://www.w3.org/2000/svg'; svg = doc.createElementNS(NS, 'svg'); svg.setAttribute('style', 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646;pointer-events:none'); doc.body.appendChild(svg); svg._ns = NS; }   // unit: full screen, one under the launcher
    var p = function (a, b) { var q = at(a, b); return q.x + ',' + q.y; }, c = at(0, 0);
    svg.innerHTML = '<line x1="' + p(-1, 0).split(',')[0] + '" y1="' + p(-1, 0).split(',')[1] + '" x2="' + p(1, 0).split(',')[0] + '" y2="' + p(1, 0).split(',')[1] + '" stroke="#0AF2FF" stroke-width="2"/>' +
      '<line x1="' + p(0, -1).split(',')[0] + '" y1="' + p(0, -1).split(',')[1] + '" x2="' + p(0, 1).split(',')[0] + '" y2="' + p(0, 1).split(',')[1] + '" stroke="#2ECC71" stroke-width="2"/>' +
      '<circle cx="' + c.x + '" cy="' + c.y + '" r="6" fill="#F2A541"/><text x="' + p(-IP, 0).split(',')[0] + '" y="' + p(-IP, 0).split(',')[1] + '" fill="#0AF2FF" font-size="14">A</text>' +   // unit: debug dot radius and label size in px
      '<text x="' + p(0, -IP).split(',')[0] + '" y="' + p(0, -IP).split(',')[1] + '" fill="#2ECC71" font-size="14">B</text>';   // unit: debug strokes and labels in px
  }
  root.PhiAxes = { frame: F, at: at, dir: dir, on: function (f) { subs.push(f); f(F); }, measure: measure };
  if (doc.body) measure(); else doc.addEventListener('DOMContentLoaded', measure);
})();
