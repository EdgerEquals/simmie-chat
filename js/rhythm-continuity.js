/* RHYTHM CONTINUITY: KIDS CLUB COPY for Bonnie's sites (rebella js/rhythm-continuity.js = simmie-chat js/rhythm-continuity.js; the SAME file).
   Kids Club standard "Rhythms keep going while you're away" (shared.md; Danny 13:47 / 13:48 / 13:51 AWST 26 Oct 2026), built from the
   copy-ready pattern note (rhythm-continuity-pattern.md, model build ad9b687). This is the kid's OWN copy: it links, imports and loads
   nothing from any other site. "Your own radio" (the opt-in playlist part of the standard) is NOT built here yet.
   Every cascading rhythm on the page (the pump tree and the logo nodes on it, dials, sky and season clocks, every looping CSS animation,
   the dashboard music, the logo sound) registers here once. This module owns the storage key, the save cadence, the page-lifecycle hooks,
   the catch-up and the daily restart, so a reload, an iOS tab discard or a trip to another app never resets anything.

   Script tag (sync, in <head>, right after js/ratio-pump.js, before anything that registers):
     <script src=".../js/rhythm-continuity.js?v=2" data-site="rebella|dashboard|chat" data-title="what the lock screen shows"></script>
   API  RhythmContinuity.register(name, { save(), catchUp(elapsedSec, state, mode), reset() })   mode 'cold' (page load with today's
          snapshot) | 'return' (back from hidden / bfcache) | 'restart' (first load of a new solar day: yesterday's state, carry choices only)
        .phase(name, get, set)  a scalar clock in seconds: set(saved + elapsed)
        .css(name, elOrSelector) Web Animations under one element: currentTime += elapsed x rate
        .peek(name)  today's stored snapshot before its owner has loaded     .sun(ms?)  { elev, depth, day, season, moon, moonLit }
        .media(ctx)  the keep-alive bridge for one AudioContext: { input, play(owner, meta), rest(owner), wake(), info() }
        .tap(fn)     one gentle "tap anywhere to resume" (never during the passcode gate); fn runs inside that tap
        .loud        loudness relations (logo = music x PHI^-1; music dips x PHI^-1 under the logo): music({level(), dip(f, tau)}),
                     logoOut(ctx) (the logo engine's output), logo(on), changed(), info()
        .saveNow(), .names(), .info()        Events on document: 'rhythm:restart' (daily restart), 'rhythm:sky' (on return).
   LOOPING CSS (the whole page, no per-layer list): the first page load of the solar day sets an origin; every later page load (any page of
   the same site, a reload or an iOS discard) moves each infinite CSS animation forward by (this page's time origin - that origin), so it
   carries on as if the page had stayed open. Animations keep their own golden-angle offsets; one-shot animations and script (Web Animations API)
   loops, such as the logo view's, are never touched.
   Storage: localStorage 'kidRhythm.<site>.v1' only, on this device (Stream 1). No network, no names, no typed text, nothing sent.
   Cadence: one save every B x PHI^-1 (js/phi-b.js, Rule phi B; without B the pump tree's fastest mode PHI^4 s), plus every hide.
   DAILY RESTART (no clock time): local apparent solar time = UT days + longitude / one turn + equation of time / one turn; its whole part
   counts solar days and ticks over at local solar midnight, where the Sun's height is lowest. Meeus ch. 7, 22, 25, 28. Place = the shared
   layer's one coarse city point (location standard; never device GPS).
   SOUND: nothing sounds before a tap (unchanged). No master volume: the bridge passes the engine's own level through untouched. */
(function (root) {
  'use strict';
  if (root.RhythmContinuity) return;
  var doc = root.document, PHI = (1 + Math.sqrt(5)) / 2;                           // phi: the golden ratio, the sole scaling factor
  var TAU = 2 * Math.PI, RAD = Math.PI / 180, DEG = 360;                           // unit: one turn = 360 deg
  var MS = 1e3, MS_DAY = 864e5, JD_UNIX = 2440587.5, JD_2000 = 2451545, CENTURY = 36525;   // unit/cite: ms per s, SI day; Meeus ch. 7
  var POINT = { lat: -32.0, lon: 115.9 };                                          // anchor: shared layer's one coarse city point (0.1 deg)
  var SYN = 29.530588853, NEW0 = Date.UTC(2000, 0, 6, 18, 14);                     // cite: Meeus 49.1 synodic month; new moon 2000-01-06 18:14 UT
  var me = doc.currentScript || doc.querySelector('script[src*="rhythm-continuity.js"]');
  var SITE = String((me && me.getAttribute('data-site')) || 'page').replace(/[^a-z]/g, ''), TITLE = (me && me.getAttribute('data-title')) || '';
  var KEY = 'kidRhythm.' + SITE + '.v1';
  function cadence() { try { var B = root.PhiB, r = B && B.rung ? +B.rung(-1) : NaN; if (r > 0 && isFinite(r)) return r; } catch (e) {}
    return Math.pow(PHI, 4); }                                                     // phi: B x PHI^-1, or the pump tree's fastest mode PHI^4 s

  // ---------- sky clocks (sun height, solar day, season, moon) ----------
  function sun(ms) {
    ms = ms == null ? Date.now() : ms;
    var d = ms / MS_DAY, T = (d + JD_UNIX - JD_2000) / CENTURY;
    var L0 = (280.46646 + 36000.76983 * T) * RAD, M = (357.52911 + 35999.05029 * T) * RAD;        // cite: Meeus 25.2, 25.3
    var e = 0.016708634 - 0.000042037 * T, eps = (23.439291 - 0.0130042 * T) * RAD;             // cite: Meeus 25.4, 22.2
    var C = (1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M)) * RAD, lam = L0 + C;           // cite: Meeus 25 equation of centre
    var y = Math.pow(Math.tan(eps / 2), 2);
    var eot = y * Math.sin(2 * L0) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L0) - y * y / 2 * Math.sin(4 * L0) - 5 / 4 * e * e * Math.sin(2 * M);   // cite: Meeus 28.3 (radians)
    var las = d + POINT.lon / DEG + eot / TAU;                                     // local apparent solar time in days (0 = solar midnight)
    var dec = Math.asin(Math.sin(eps) * Math.sin(lam)), H = TAU * (las - Math.floor(las)) - Math.PI, la = POINT.lat * RAD;
    var elev = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
    var moon = (((ms - NEW0) / MS_DAY / SYN) % 1 + 1) % 1;
    return { elev: elev / RAD, depth: (1 - Math.cos(H)) / 2, day: Math.floor(las), solarDays: las,   // depth: 1 at solar noon .. 0 at deepest night
             season: ((lam / TAU) % 1 + 1) % 1, moon: moon, moonLit: (1 - Math.cos(TAU * moon)) / 2 };
  }

  // ---------- store ----------
  var R = {}, order = [], stored = null, hideAt = 0, snaps = {}, today = sun().day, timer = 0;
  try { stored = JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { stored = null; }
  var fresh = !stored || stored.day !== today, prev = fresh && stored && stored.r ? stored.r : null;   // a new solar day since the last save
  if (fresh) stored = { day: today, at: Date.now(), r: {}, t: {} };
  if (!stored.t) stored.t = {};                                                    // per-rhythm save time: a late-loading rhythm counts its own time away
  function snapAll() { var o = {}; order.forEach(function (n) { try { var s = R[n].save && R[n].save(); if (s != null) o[n] = s; } catch (e) {} }); return o; }
  function write() {
    var o = snapAll(), r = (stored && stored.r) || {}, t = (stored && stored.t) || {}, now = Date.now();
    Object.keys(o).forEach(function (n) { r[n] = o[n]; t[n] = now; });          // keep snapshots (and their times) of rhythms not loaded on this page
    stored = { day: today, at: now, r: r, t: t };
    try { root.localStorage.setItem(KEY, JSON.stringify(stored)); } catch (e) {}  // private mode / full quota: the page simply starts fresh
  }
  function restart() {
    order.forEach(function (n) { try { R[n].reset && R[n].reset(); } catch (e) {} });
    stored = { day: today, at: Date.now(), r: {}, t: {} }; write();
    try { doc.dispatchEvent(new CustomEvent('rhythm:restart', { detail: { day: today } })); } catch (e) {}
  }
  function beat() {
    clearTimeout(timer); timer = 0;
    var d = sun().day; if (d !== today) { today = d; restart(); } else if (!doc.hidden) { loopsAll(); write(); }
    timer = setTimeout(beat, cadence() * MS);
  }

  // ---------- register ----------
  function register(name, h) {
    if (!R[name]) order.push(name); R[name] = h;
    var s = stored && stored.r && stored.r[name], at = (stored.t && stored.t[name]) || stored.at;
    if (s != null && h.catchUp) { try { h.catchUp(Math.max(0, (Date.now() - at) / MS), s, 'cold'); } catch (e) {} }
    else if (prev && prev[name] != null && h.catchUp) { try { h.catchUp(0, prev[name], 'restart'); } catch (e) {} }   // yesterday: only choices carry
    return { save: write };
  }
  function phase(name, get, set) {
    return register(name, { save: function () { return { t: get() }; },
      catchUp: function (e, s, mode) { if (mode !== 'restart' && s && isFinite(s.t)) set(s.t + e); }, reset: function () { set(0); } });
  }
  function el(x) { return typeof x === 'string' ? doc.querySelector(x) : x; }
  function anims(x) { var n = el(x); return n && n.getAnimations ? n.getAnimations({ subtree: true }) : []; }
  function css(name, x) {
    return register(name, { save: function () { var A = anims(x); return A.length ? { t: A.map(function (a) { return a.currentTime; }) } : null; },
      catchUp: function (e, s, mode) { if (mode === 'restart' || !s || !s.t) return; var at = Date.now();
        function apply() { var k = e + (Date.now() - at) / MS; anims(x).forEach(function (a, i) {
          var t = s.t[i]; if (t == null || !isFinite(t)) return; try { a.currentTime = t + k * MS * (a.playbackRate || 1); } catch (er) {} }); }
        if (anims(x).length) apply(); else requestAnimationFrame(function () { requestAnimationFrame(apply); }); },
      reset: function () { anims(x).forEach(function (a) { try { a.currentTime = 0; } catch (er) {} }); } });
  }

  // ---------- looping CSS, page-wide (index-free: one origin per solar day) ----------
  var PERF = root.performance, T_ORIGIN = PERF && PERF.timeOrigin ? PERF.timeOrigin : Date.now() - (PERF && PERF.now ? PERF.now() : 0);
  var origin = T_ORIGIN, seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  function isLoop(a) {                                                             // CSS animations only: script animations (the logo view) keep their own clocks
    try { var cssAnim = root.CSSAnimation ? a instanceof root.CSSAnimation : typeof a.animationName === 'string';
      return cssAnim && a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity; } catch (e) { return false; } }
  function loopOne(a) {
    if (!seen || seen.has(a) || !isLoop(a)) return; seen.add(a);
    var s = T_ORIGIN - origin; if (!(s > 0)) return;                               // the first page of the day (or after the restart): nothing to move
    try { var t = a.currentTime; if (t != null && isFinite(t)) a.currentTime = t + s * (a.playbackRate || 1); } catch (e) {}
  }
  function loopsAll() { if (doc.getAnimations) try { doc.getAnimations().forEach(loopOne); } catch (e) {} }
  doc.addEventListener('animationstart', function (ev) { var n = ev.target; if (!n || !n.getAnimations) return;
    try { n.getAnimations().forEach(function (a) { if (a.animationName === ev.animationName) loopOne(a); }); } catch (e) {} }, true);
  register('scene:css', { save: function () { return { o: origin }; },
    catchUp: function (e, s, mode) { if (mode === 'cold' && s && isFinite(s.o) && s.o <= T_ORIGIN) { origin = s.o; loopsAll(); } },   // return: the timeline kept running
    reset: function () { origin = Date.now(); if (doc.getAnimations) doc.getAnimations().forEach(function (a) { if (isLoop(a)) try { a.currentTime = 0; } catch (e) {} }); } });

  // ---------- one gentle tap to resume (never while the passcode gate is up) ----------
  var waits = [], GEST = ['touchstart', 'pointerdown', 'touchend', 'click'];   // a press is a resume try too: a scrolling touch ends in touchcancel with no lift (shared.md guard 17:31)
  function gated(t) {
    var b = doc.body; if (b && b.classList.contains('locked')) return true;
    if (t && t.closest && t.closest('#gate, #gate-form, #screen-login, #screen-loading')) return true;
    var c = doc.getElementById('screen-chat'); return !!(c && c.hidden);
  }
  function onTap(e) {
    if (gated(e.target)) return;
    if (e.type === 'touchstart' || e.type === 'pointerdown') { waits.slice().forEach(function (f) { try { f(e); } catch (er) {} }); return; }   // try now, keep waiting for the lift (iOS may only unlock there)
    var w = waits.splice(0); GEST.forEach(function (n) { doc.removeEventListener(n, onTap, true); });
    doc.documentElement.removeAttribute('data-rhythm-resume');
    w.forEach(function (f) { try { f(e); } catch (er) {} });
  }
  function tap(fn) {
    if (waits.indexOf(fn) < 0) waits.push(fn);
    if (waits.length === 1) GEST.forEach(function (n) { doc.addEventListener(n, onTap, true); });
    doc.documentElement.setAttribute('data-rhythm-resume', '');
  }

  // ---------- sound-back ladder timing + the one gentle button ----------
  var TOP = 5;                                                                     // phi: ladder exponents PHI^0 .. PHI^5 (dad-page df8d082)
  function beat() { try { var B = root.PhiB, r = B && B.rung ? +B.rung(-10) : NaN; if (r > 0 && isFinite(r)) return r; } catch (e) {} return Math.pow(PHI, -5); }   // phi: one tap-rung beat, B x PHI^-10
  var sbBtn = null;
  function showBack() {
    if (sbBtn || gated(null) || !doc.body) return;
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'sound-back'; b.textContent = 'tap to bring the sound back';
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top, 0px) + 1rem * ' + PHI + ');z-index:60;font:inherit;font-size:1rem;' +   // unit: 50% = centring (half the width); anchor: z 60 = dad-page's sound-back layer (df8d082)
      'color:CanvasText;background:Canvas;border:1px solid currentColor;border-radius:1rem;padding:calc(1rem / ' + PHI + ') 1rem;min-height:44px;' +   // unit: 44 px minimum tap target (Apple HIG, cited)
      'cursor:pointer;white-space:nowrap;max-width:calc(100vw - 2rem);overflow:hidden;text-overflow:ellipsis';
    b.addEventListener('click', function () { hideBack(); });                       // the tap itself resumes through tap() (touchend / click)
    doc.body.appendChild(b); sbBtn = b;
  }
  function hideBack() { if (!sbBtn) return; try { sbBtn.remove(); } catch (e) {} sbBtn = null; }

  // ---------- keep alive while sound plays: WebAudio -> MediaStream -> hidden <audio>, with a Media Session ----------
  var hubs = [];
  function media(ctx) {
    for (var i = 0; i < hubs.length; i++) if (hubs[i].ctx === ctx) return hubs[i].api;
    var H = { ctx: ctx, owners: {}, last: null, direct: true, el: null }, inp = ctx.createGain();   // a pass-through: no level of its own
    inp.connect(ctx.destination);
    if (ctx.createMediaStreamDestination && root.HTMLAudioElement) try {
      var msd = ctx.createMediaStreamDestination(); inp.connect(msd);
      H.el = doc.createElement('audio'); H.el.setAttribute('playsinline', ''); H.el.setAttribute('aria-hidden', 'true'); H.el.srcObject = msd.stream;
      H.el.addEventListener('pause', function () { if (!H.direct) { try { inp.connect(ctx.destination); } catch (e) {} H.direct = true; } });
    } catch (e) { H.el = null; }
    function busy() { return Object.keys(H.owners).length > 0; }
    function elPlay() {                                                            // once the element really plays, it is the only path out
      if (!H.el) return; var p; try { p = H.el.play(); } catch (e) { return; }
      if (p && p.then) p.then(function () { if (H.direct && !H.el.paused && busy()) { try { inp.disconnect(ctx.destination); H.direct = false; } catch (e) {} } }, function () {});
    }
    function session(state) {
      var m = navigator.mediaSession, o = H.last && H.owners[H.last]; if (!m) return;
      try {
        ['play', 'pause', 'stop'].forEach(function (k) { m.setActionHandler(k, function () { var x = H.last && H.owners[H.last];
          if (k === 'play') { if (x && x.play) x.play(); else wake(); } else if (x && x.pause) x.pause(); }); });
        if (state === 'playing' && o && root.MediaMetadata) m.metadata = new MediaMetadata({ title: o.title || TITLE, artist: o.artist || '' });
        m.playbackState = state;
      } catch (e) {}
    }
    function play(owner, meta) {
      H.owners[owner] = meta || {}; H.last = owner; if (owner === 'logo') setLogo(true);
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // Safari 16.4+
      try { if (ctx.state !== 'running') ctx.resume(); } catch (e) {}
      elPlay(); session('playing');
    }
    function rest(owner) {
      delete H.owners[owner]; if (H.last === owner) H.last = Object.keys(H.owners)[0] || null; if (owner === 'logo') setLogo(false);
      if (busy()) return;
      if (H.el) try { H.el.pause(); } catch (e) {}
      session('paused');
    }
    function wake() {                                                              // back on the page: resume what was playing, never reset
      if (!busy()) return;
      var p = null; try { p = ctx.resume && ctx.resume(); } catch (e) {}
      elPlay();
      var check = function () { if (busy() && ctx.state !== 'running') { tap(function () { try { ctx.resume(); } catch (e) {} elPlay(); session('playing'); }); later('wake refused'); } };
      if (p && p.then) p.then(check, check); else check();
    }
    // Sound comes back after another app borrows it (shared.md, Danny 15:51 + 16:16 AWST 26 Oct; dad-page df8d082 is the model).
    // iPhone dictation, a call or Siri can interrupt the context while the page stays in view, so no visibilitychange arrives. The
    // context's statechange and the bridge's pause start a ladder: one tap-rung beat first (B x PHI^-10), then tries at beat x PHI^k,
    // k = 0 .. 5 (repeating at the top), each calling ctx.resume() and the bridge's play(), until the context runs and the bridge plays.
    // A refused try shows the one gentle 'tap to bring the sound back' button (and any tap resumes, via tap()). Never undoes her own pause.
    var L = { t: 0, k: 0, n: 0 };
    function ok() { return ctx.state === 'running' && (!H.el || H.direct || !H.el.paused); }
    function later(why) { if (L.t || !busy()) return; L.t = setTimeout(function () { L.t = 0; tryNow(why); }, beat() * MS * Math.pow(PHI, Math.min(L.k, TOP))); }
    function tryNow(why) {
      if (!busy() || doc.hidden) { L.k = 0; return; }
      if (ok()) { L.k = 0; hideBack(); return; }
      L.n++; try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      var p = null; try { p = ctx.resume(); } catch (e) {} elPlay();
      var after = function () { if (ok()) { L.k = 0; hideBack(); session('playing'); return; }
        tap(function () { try { ctx.resume(); } catch (e) {} elPlay(); session('playing'); hideBack(); }); showBack(); L.k++; later(why); };
      if (p && p.then) p.then(after, after); else setTimeout(after, 0);
    }
    try { ctx.addEventListener('statechange', function () { if (ctx.state !== 'running' && busy()) { L.k = 0; later('state ' + ctx.state); } }); } catch (e) {}
    if (H.el) H.el.addEventListener('pause', function () { if (busy()) { L.k = 0; later('bridge pause'); } });
    H.api = { input: inp, play: play, rest: rest, wake: wake, retry: function () { L.k = 0; tryNow('manual'); }, tries: function () { return L.n; },
      info: function () { return { state: ctx.state, owners: Object.keys(H.owners), bridged: !H.direct, el: !!H.el, paused: H.el ? H.el.paused : null }; } };
    hubs.push(H); return H.api;
  }

  // ---------- loudness relations (shared.md "Loudness", Danny 14:23 and 14:26 AWST 26 Oct 2026) ----------
  // 1  Logo a bit louder than the radio (Danny 16:42 AWST 26 Oct, replaces 14:23 'logo quieter'): logo level = the page music's
  //    UNDIPPED level x PHI, re-read live while the logo sounds, and the level the music would have now when it isn't playing.
  //    Loudness ceiling rail: the trim never goes past unity (the logo engine's own level; no boost, no master volume), so near the
  //    top of the music range the step shrinks rather than clipping. Opening glides up from the radio level, closing glides back
  //    down to it (free-wheel glide timed from B), never a jump. A page with no music engine (the chat) reads the music level as the
  //    identity, so its logo sits at the ceiling.
  // 2  Page music dips a little under the logo: while the logo sounds, the page music's own dip stage glides to x PHI^-1 and back
  //    (free-wheel glide, rule 6: exponential, no clicks). The trim reads the undipped level, so the two never chase each other.
  //    Glide time constant: B x PHI^-5 (Rule phi B; the logo view's own close timing), PHI^0 s without B. No master volume anywhere.
  var music = null, logoOn = false, trims = [], ltimer = 0;
  function musicLevel() { try { var v = music && music.level ? +music.level() : NaN; if (v >= 0 && isFinite(v)) return v; } catch (e) {} return 1; }
  function glideTau() { try { var B = root.PhiB, r = B && B.rung ? +B.rung(-5) : NaN; if (r > 0 && isFinite(r)) return r; } catch (e) {} return Math.pow(PHI, 0); }   // phi: B x PHI^-5
  function trimTarget() { return Math.min(musicLevel() * PHI, 1); }              // phi: one rung over the music; anchor: unity = the loudness ceiling rail
  function retrim() { var tau = glideTau(), v = logoOn ? trimTarget() : musicLevel(); trims.forEach(function (T) { try { T.gain.setTargetAtTime(v, T.context.currentTime, tau); } catch (e) {} }); }
  function logoOut(ctx) {
    for (var i = 0; i < trims.length; i++) if (trims[i].context === ctx) return trims[i];
    var T = ctx.createGain(); T.gain.value = musicLevel(); T.connect(media(ctx).input); trims.push(T); if (logoOn) retrim(); return T;   // starts at the radio level, retrim() glides it up
  }
  function setLogo(on) {
    on = !!on; if (on === logoOn) return; logoOn = on;
    try { if (music && music.dip) music.dip(on ? 1 / PHI : 1, glideTau()); } catch (e) {}
    clearInterval(ltimer); ltimer = 0;
    trims.forEach(function (T) { try { var t = T.context.currentTime; T.gain.cancelScheduledValues(t); T.gain.setValueAtTime(T.gain.value, t); } catch (e) {} });   // glide on from where it is now
    retrim();
    if (on) ltimer = setInterval(retrim, glideTau() * MS);                         // follow the music live while the logo sounds
  }
  var loud = { music: function (src) { music = src || null; retrim(); if (logoOn && music && music.dip) try { music.dip(1 / PHI, glideTau()); } catch (e) {} },
    logoOut: logoOut, logo: setLogo, changed: retrim, glideTau: glideTau,
    info: function () { return { music: musicLevel(), hasMusic: !!music, logoOn: logoOn, trim: trimTarget(), dip: logoOn ? 1 / PHI : 1,
      trims: trims.map(function (T) { return T.gain.value; }) }; } };

  // ---------- lifecycle ----------
  function away() { if (!hideAt) { hideAt = Date.now(); snaps = snapAll(); } write(); }
  function back(ev) {
    if (ev && ev.type === 'pageshow' && !ev.persisted) return;
    hubs.forEach(function (H) { try { H.api.wake(); } catch (e) {} });
    var d = sun().day; if (d !== today) { today = d; hideAt = 0; restart(); return; }
    if (!hideAt) return;
    var now = Date.now(), e = Math.max(0, (now - hideAt) / MS), s = snaps; hideAt = 0; snaps = {};
    order.forEach(function (n) { try { if (!R[n].catchUp) return;
      if (s[n] != null) R[n].catchUp(e, s[n], 'return'); else if (stored.r[n] != null) R[n].catchUp(Math.max(0, (now - ((stored.t && stored.t[n]) || now)) / MS), stored.r[n], 'return'); } catch (er) {} });
    write();
  }
  doc.addEventListener('visibilitychange', function () { if (doc.hidden) away(); else back(); });
  root.addEventListener('pagehide', away);
  root.addEventListener('pageshow', back);
  doc.addEventListener('freeze', away);
  doc.addEventListener('resume', back);
  timer = setTimeout(beat, cadence() * MS);

  root.RhythmContinuity = { register: register, phase: phase, css: css, sun: sun, media: media, tap: tap, loud: loud, saveNow: write,
    peek: function (n) { return stored && stored.r ? stored.r[n] : undefined; }, names: function () { return order.slice(); },
    info: function () { return { key: KEY, site: SITE, day: today, restartedToday: fresh, savedAt: stored && stored.at, cadence: cadence(), origin: origin,
      rhythms: order.slice(), waiting: waits.length, media: hubs.map(function (H) { return H.api.info(); }) }; } };

  // ---------- page-owned rhythms that need no file of their own ----------
  // sky + season clocks: computed from the date itself, so catching up is a re-read; on a return, the page's feeds refresh
  register('sky', { save: function () { var s = sun(); return { elev: s.elev, season: s.season, moon: s.moon }; },
    catchUp: function (e, st, mode) { if (mode !== 'return') return; try { var P = root.RatioPump; if (P && P.refresh) P.refresh(); doc.dispatchEvent(new CustomEvent('rhythm:sky', { detail: sun() })); } catch (er) {} },
    reset: function () {} });
  // dials: Danny's dial settings stay as set (js/phi-dials.js keeps them); the live rate they feed is re-read on return
  register('dials', { save: function () { var P = root.RatioPump; return { rate: P && P.rate ? P.rate() : null }; },
    catchUp: function (e, st, mode) { var P = root.RatioPump; if (mode === 'return' && P && P.refresh) P.refresh(); }, reset: function () { var P = root.RatioPump; if (P && P.refresh) P.refresh(); } });
  function late() { loopsAll(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', late); else late();
  root.addEventListener('load', late);
})(window);
