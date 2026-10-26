/* PHI-B: the anchor B for every timing on Bonnie's pages (Kids Club Rule phi, build B; Danny's design, voice/chat 10:11 AWST 26 Oct 2026).
   Shared module: the SAME file is rebella js/phi-b.js and simmie-chat js/phi-b.js. Load it in <head>, right after js/season-pumps.js.
   B has NO typed term or seed (not 10 s, not 0.1 Hz). It is worked out on the device from reference periods related by whole phi steps,
   then moved by three pumps, each a ratio, with phi the only scaling factor:
     reference  U = the weather feed's own update period (Open-Meteo current.interval, stored with the weather caches by build A) and the
                solar day (a sky clock, js/season-pumps.js). B0 sits as many whole phi steps below U as U sits below the day:
                  m = round(log_phi(day / U)),  B0 = U x PHI^-m          (U = 900 s: m = 9, B0 = 11.84 s)
                Before this device has ever seen the feed (very first page view) U is unknown, so only sky clocks relate:
                  B0 = day x PHI^-(round(log_phi(year / day)) + round(log_phi(synodic month / day)))   (= day x PHI^-19 = 9.24 s)
     pump 1     the Moon's position: the spring-neap clock from js/season-pumps.js (1 at new and full Moon, 0 at the quarters).
     pump 2     the local temperature as a share of its own measured daily range: every reading the pages already fetch is kept (time +
                temperature only, this device, last day only); share = (now - min) / (max - min). Needs two different readings in the last
                day, so it joins from about the second visit. No new request.
                Sky + weather:  Bs = B0 x PHI^(1/2 - mean(pump shares))  -> livelier (shorter) when the Moon is at springs and it is warm,
                calmer when it's neap and cool; always within half a phi step of B0. (The 1/2 is the halving: the centre of a 0..1 share.)
     pump 3     Bonnie's own rhythm R: the typical gap between her taps, scroll starts and lingers (median per visit, kept in the one usage
                record phiAdapt.v1, slot x.rhythm; never what she taps, where, or any text). r = her recent rhythm (each visit moves it
                PHI^-1 of the way), rl = her long-term rhythm (each visit moves it only PHI^-8 of the way, the deep rung).
                Mirror within sky limits (Rule phi update, Danny 14:27 AWST 26 Oct 2026, from Steve's review): she moves B by whole rungs,
                as far as she is quicker or slower than her own usual, and only between sky-B x PHI^-n and sky-B x PHI^n:
                  k = round(log_phi(r / rl)) held to -n..n,   Br = Bs x PHI^k
                so an excited kid is mirrored (the page speeds up with her) up to the limit, a slow kid is held at the slow limit.
                n = REACH, Danny's floor and ceiling as rungs (the pace dial's own range in js/phi-dials.js: one rung either side).
                (Before: Br = R x PHI^round(log_phi(Bs / R)) always landed within half a step of Bs, so her rhythm never really moved B.)
                It takes over in phi steps per visit with her rhythm: w = 1 - PHI^-visits (0, 0.382, 0.618, 0.764, ...);
                B = Bs^(1 - w) x Br^w.
     pause      the longest gap that still counts as rhythm (B0 x PHI^4) is taken from the sky reference, never from the kid-moved B,
                so a long pause never counts as rhythm.
   B is set once per page view (in <head>, before anything moves) so nothing jumps mid-visit; the next visit glides on.
   Every timing is then B x PHI^k with k whole: rung(k) / ms(k), and CSS custom properties --b-m10 .. --b-p8 (seconds) for CSS.
   data-dials="off" on the ratio-pump script: no rhythm pump. Reduced motion, Pause motion and the WCAG floors act after this formula.
   Read-only API: window.PhiB.{value, B0, rung(k), ms(k), parts()}. Nothing is sent anywhere. */
(function (root) {
  'use strict';
  if (root.PhiB) return;
  var PHI = (1 + Math.sqrt(5)) / 2, LN = Math.log(PHI);                                   // phi: the golden ratio, the only scaling factor
  var SEC = 1000;                                                                            // unit: ms per second
  var KEY = 'phiAdapt.v1', TKEY = 'phi.b.temps', WX = ['rebella.footer.weather', 'rebella-mod-weather-v1'];
  var KMIN = -10, KMAX = 8;                                                                  // phi: rungs published as CSS (B x PHI^-10 .. B x PHI^8)
  var doc = root.document, SP = root.SeasonPumps;
  function logPhi(x) { return Math.log(x) / LN; }
  function get(k) { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function put(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var P = null; try { P = SP && SP.pumps(new Date()); } catch (e) { P = null; }
  var sky = { day: 1, year: null, syn: null };                                               // periods in days (season-pumps' own clock table)
  if (P) P.forEach(function (p) { if (p.id === 'year') sky.year = p.P; if (p.id === 'springNeap') sky.syn = p.P * 2; });   // spring-neap beats twice a synodic month
  var DAY = (function () { var d = new Date(0); d.setUTCDate(2); return d.getTime(); })();   // unit: one solar day in ms, by calendar arithmetic (no typed number)

  // ---- reference: U and the day ----
  var U = 0;   // seconds
  WX.forEach(function (k) { var c = get(k); if (c && +c.u > U) U = +c.u; });
  var B0, how;
  if (U > 0) { var m = Math.round(logPhi(DAY / SEC / U)); B0 = U * Math.pow(PHI, -m); how = 'U x PHI^-' + m; }
  else if (sky.year && sky.syn) { var n = Math.round(logPhi(sky.year / sky.day)) + Math.round(logPhi(sky.syn / sky.day)); B0 = DAY / SEC * Math.pow(PHI, -n); how = 'day x PHI^-' + n; }
  else { B0 = null; how = 'no reference yet'; }

  // ---- pump 1: the Moon (spring-neap clock) ----
  var moon = null; if (P) P.forEach(function (p) { if (p.id === 'springNeap') moon = (1 + p.c) / 2; });

  // ---- pump 2: temperature as a share of its own measured daily range ----
  function readTemps() {
    var ring = get(TKEY); ring = Array.isArray(ring) ? ring : [];
    WX.forEach(function (k) { var c = get(k); if (c && isFinite(c.t) && isFinite(c.temp) && !ring.some(function (r) { return r[0] === c.t; })) ring.push([c.t, +c.temp]); });
    var now = Date.now(); ring = ring.filter(function (r) { return now - r[0] < DAY; }).sort(function (a, b) { return a[0] - b[0]; });
    return ring;
  }
  var ring = readTemps(), temp = null;
  if (ring.length) {
    var lo = Math.min.apply(null, ring.map(function (r) { return r[1]; })), hi = Math.max.apply(null, ring.map(function (r) { return r[1]; }));
    if (hi > lo) temp = (ring[ring.length - 1][1] - lo) / (hi - lo);
  }
  put(TKEY, ring);

  // ---- sky + weather ----
  var shares = [moon, temp].filter(function (v) { return v != null; });
  var mean = shares.length ? shares.reduce(function (a, b) { return a + b; }, 0) / shares.length : null;
  var Bs = B0 && mean != null ? B0 * Math.pow(PHI, 1 / 2 - mean) : B0;

  // ---- pump 3: Bonnie's own rhythm ----
  function dialsOff() { return !!(doc && doc.querySelector('script[src*="ratio-pump.js"][data-dials="off"]')); }
  var REACH = 1;                                                                             // anchor: Danny's floor and ceiling, as rungs (phi-dials SPEC.pace: def 2, ceil 1, floor 3)
  var DEEP = Math.pow(PHI, -8);                                                              // phi: the deep rung, weight of her long-term rhythm
  var rec = get(KEY), rh = rec && rec.v === 1 && rec.x && rec.x.rhythm, R = rh && +rh.r > 0 ? +rh.r : null, visits = rh ? (+rh.s || 0) : 0;
  var RL = rh && +rh.rl > 0 ? +rh.rl : R;
  var w = 0, Br = null, B = Bs, kMirror = 0;
  if (Bs && R && !dialsOff()) {
    kMirror = Math.max(-REACH, Math.min(REACH, Math.round(logPhi(R / RL))));
    Br = Bs * Math.pow(PHI, kMirror);
    w = 1 - Math.pow(PHI, -visits);
    B = Math.exp((1 - w) * Math.log(Bs) + w * Math.log(Br));
  }

  function rung(k) { return B ? B * Math.pow(PHI, k) : null; }
  var api = {
    PHI: PHI, value: B, B0: B0,
    rung: rung,
    ms: function (k) { var s = rung(k); return s == null ? null : s * SEC; },
    parts: function () { return { how: how, U: U || null, B0: B0, moon: moon, temp: temp, tempReadings: ring.length, Bs: Bs, rhythm: R, longRhythm: RL, mirror: kMirror, reach: REACH, visits: visits, w: w, Br: Br, B: B }; }
  };
  root.PhiB = api;

  // ---- CSS: --b-m10 .. --b-p8 in seconds, and --b (B itself) ----
  if (doc && B) {
    var st = doc.documentElement.style;
    for (var k = KMIN; k <= KMAX; k++) st.setProperty('--b-' + (k < 0 ? 'm' + -k : 'p' + k), rung(k) + 's');
    st.setProperty('--b', B + 's');
    doc.documentElement.setAttribute('data-phi-b', how);
  }

  // ---- measuring the rhythm for next time (gaps only: never what, where or any text) ----
  if (!doc || !B0) return;
  var LO = B0 * Math.pow(PHI, -6), HI = B0 * Math.pow(PHI, 4), QUIET = B0 * Math.pow(PHI, -6);   // phi: accepted gaps B0 x PHI^-6 .. B0 x PHI^4
  var last = 0, lastScroll = 0, gaps = [], saved = false;
  function shielded(t) { return t && t.closest && t.closest('#gate, #gate-form, #screen-login, #login-form, input[type=password]'); }
  function mark(now) {
    if (doc.hidden || dialsOff()) { last = 0; return; }
    if (last) { var g = (now - last) / SEC; if (g >= LO && g <= HI) gaps.push(g); }
    last = now;
  }
  doc.addEventListener('pointerdown', function (e) { if (!shielded(e.target)) mark(Date.now()); }, { capture: true, passive: true });
  root.addEventListener('scroll', function () { var now = Date.now(); if (now - lastScroll > QUIET * SEC) mark(now); lastScroll = now; }, { capture: true, passive: true });
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) { save(); last = 0; } });
  root.addEventListener('pagehide', save);
  var FIB = 5;                                                                               // phi: a Fibonacci count of gaps before a visit counts
  function save() {
    readTemps().length && put(TKEY, readTemps());
    if (saved || gaps.length < FIB || dialsOff()) return;
    var s = gaps.slice().sort(function (a, b) { return a - b; }), med = s[Math.floor(s.length / 2)];
    var cur = null; try { cur = root.PhiAdapt ? root.PhiAdapt.ext('rhythm') : (get(KEY) && get(KEY).x && get(KEY).x.rhythm); } catch (e) { cur = null; }
    var r = cur && +cur.r > 0 ? Math.exp(Math.log(cur.r) * (1 - 1 / PHI) + Math.log(med) / PHI) : med;   // phi: each visit moves it PHI^-1 of the way
    var rl0 = cur && +cur.rl > 0 ? +cur.rl : (cur && +cur.r > 0 ? +cur.r : med);
    var rl = Math.exp(Math.log(rl0) * (1 - DEEP) + Math.log(med) * DEEP);                    // phi: each visit moves it only PHI^-8 of the way
    var next = { r: r, rl: rl, s: (cur ? +cur.s || 0 : 0) + 1 };
    saved = true;
    try {
      if (root.PhiAdapt && root.PhiAdapt.ext) { root.PhiAdapt.ext('rhythm', next); if (root.PhiAdapt.save) root.PhiAdapt.save(); }
      else { var d = get(KEY); if (d && d.v === 1) { d.x = d.x && typeof d.x === 'object' ? d.x : {}; d.x.rhythm = next; put(KEY, d); } }
    } catch (e) {}
  }
})(typeof window !== 'undefined' ? window : this);
