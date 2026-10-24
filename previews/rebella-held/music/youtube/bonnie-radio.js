/* Bonnie's radio (Rebella). THE one genre dial on the site: the home page and the Music Playground both mount it.
   A play button for Bonnie's playlist plus a radio-tuner GENRE DIAL. Nothing loads from YouTube and nothing plays until
   the listener presses Play. Then a visible mini-player (200x200, the documented minimum; youtube-nocookie.com; on the
   top layer so nothing covers it) appears in a free corner. It pauses whenever the page is hidden.
   Dial: role=slider, drag (touch/mouse) or arrow keys, 8 click detents. Between detents you hear filtered white-noise
   static (Web Audio, generated here) that fades as the needle nears a detent; each detent gives a soft click and, where
   the device supports it, a gentle haptic (rule 9: 8 ms, at most one per PHI^1 s; fails silently).
   The detent -> genre order is shuffled once per browser session, and again on a double-tap (or the R key).
   Landing on a detent loads that genre's station with cuePlaylist / loadPlaylist({list, listType:'playlist', index})
   at a random index, then seekTo a random point (10-70%). Stations come from stations.js, generated from channels.json
   (Dad-approved, age-checked entries only). No API key, no account, no social features.
   Phi timing (/home/box/.config/phi-timing-rules.md): static fade PHI^-3 s, snap PHI^-2 s, needle sway PHI^4 s
   (golden offset k = 1), haptic gap PHI^1 s, double-tap window PHI^-1 s. Reduced motion: no sway, no snap animation.
   No URL test overrides on the live site: only ids in stations.js (Dad-approved + age-checked) can ever load.
   Host options: data-variant="playground" (Playground intro wording). Events for the Playground band (no network):
   'rebella:station' {key,label,flavour,bpm,key_root,mode,initial} on every landing, 'rebella:radio' {playing}.
   API: window.BonnieRadio.{genre, station, order, reroll, land, playReading, setMuted}. */
(function () {
  'use strict';
  var PHI = 1.6180339887, G = 0.6180339887;
  function P(n) { return Math.pow(PHI, n); }
  var host = document.querySelector('[data-bonnie-radio]');
  var DATA = window.BONNIE_STATIONS || { genres: [], main: [], pools: {} };
  var ID_RE = /^[A-Za-z0-9_-]{12,64}$/, HOSTYT = 'https://www.youtube-nocookie.com';
  var PG = !!host && host.getAttribute('data-variant') === 'playground';
  function emit(n, d) { try { document.dispatchEvent(new CustomEvent(n, { detail: d })); } catch (e) {} }
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var GEN = (DATA.genres && DATA.genres.length) ? DATA.genres : [
    { key: 'pop', label: 'Pop' }, { key: 'indie-local', label: 'Indie / Local' }, { key: 'lofi', label: 'Lo-fi' }, { key: 'rock', label: 'Rock' },
    { key: 'hiphop', label: 'Hip-hop' }, { key: 'electronic', label: 'Electronic' }, { key: 'acoustic', label: 'Acoustic' }, { key: 'chill', label: 'Chill' }];
  var N = GEN.length, SWEEP = 270, A0 = -135, STEP = SWEEP / (N - 1);
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pool(key) {
    return ((DATA.pools && DATA.pools[key]) || []).filter(function (x) { return x && ID_RE.test(x.list || ''); });
  }
  function first(a) { var m = a && a[0]; return m && ID_RE.test(m.list || '') ? m.list : null; }
  function mainList() { return first(DATA.main); }
  function readingList() { return first(DATA.reading); }

  // ---- session shuffle of detent -> genre ----
  var KEY = 'rebella.radio.order';
  function shuffled() { var a = GEN.map(function (g, i) { return i; }); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var order = null;
  try { order = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!order || order.length !== N) { order = shuffled(); try { sessionStorage.setItem(KEY, JSON.stringify(order)); } catch (e) {} }

  // ---- Web Audio: static + clicks (separate from the player) ----
  var AC = window.AudioContext || window.webkitAudioContext, ac = null, sGain = null, master = null, muted = false;
  try { muted = localStorage.getItem('rebella.radio.muted') === '1'; } catch (e) {}
  function audio() {
    if (ac || !AC) return ac;
    try {
      ac = new AC();
      master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
      var n = Math.floor(ac.sampleRate * 2), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.8;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      sGain = ac.createGain(); sGain.gain.value = 0;
      src.connect(bp); bp.connect(lp); lp.connect(sGain); sGain.connect(master); src.start();
    } catch (e) { ac = null; }
    return ac;
  }
  function staticTo(v, n) { if (!ac || !sGain) return; try { sGain.gain.setTargetAtTime(v, ac.currentTime, P(n == null ? -3 : n) / 3); } catch (e) {} }
  function click() {
    if (!ac) return;
    try {
      var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(2100, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
      f.type = 'highpass'; f.frequency.value = 600;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
    } catch (e) {}
  }
  var lastBuzz = 0;
  function buzz(ms) { try { var now = Date.now(); if (navigator.vibrate && now - lastBuzz >= P(1) * 1000) { lastBuzz = now; navigator.vibrate(ms); } } catch (e) {} }

  // ---- shared dial face (main dial + header dial use the same drawing and classes) ----
  var svgNS = 'http://www.w3.org/2000/svg';
  function svgEl(t, at) { var n = document.createElementNS(svgNS, t); Object.keys(at).forEach(function (k) { n.setAttribute(k, String(at[k])); }); return n; }
  function face() {
    var svg = svgEl('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true', 'class': 'br-face' });
    svg.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 46, 'class': 'br-ring' }));
    for (var i = 0; i < N; i++) { var a = (A0 + i * STEP) * Math.PI / 180;
      svg.appendChild(svgEl('line', { x1: 60 + Math.sin(a) * 50, y1: 60 - Math.cos(a) * 50, x2: 60 + Math.sin(a) * 57, y2: 60 - Math.cos(a) * 57, 'class': 'br-tick' })); }
    svg.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 34, 'class': 'br-knob' }));
    var needleG = svgEl('g', { 'class': 'br-needle' }), sway = svgEl('g', { 'class': 'br-sway' });
    sway.appendChild(svgEl('line', { x1: 60, y1: 60, x2: 60, y2: 18, 'class': 'br-nd' })); needleG.appendChild(sway); svg.appendChild(needleG);
    svg.appendChild(svgEl('circle', { cx: 60, cy: 60, r: 5, 'class': 'br-hub' }));
    return { svg: svg, needle: needleG, sway: sway };
  }
  function idxOfKey(k) { for (var i = 0; i < N; i++) if (GEN[order[i]].key === k) return i; return -1; }
  var chParam = null; try { chParam = new URLSearchParams(location.search).get('ch'); } catch (e) {}
  if (chParam && !/^[a-z0-9-]{1,32}$/.test(chParam)) chParam = null;   // a genre key only; never an id, never loads anything

  // ---- header radio dial: a compact copy of the same dial in the shared header. Turning steps through the stations
  //      (detents, click + haptic); pressing goes to the radio on the Music Playground with that station picked.
  //      Never plays, never loads YouTube, no pop-up. ----
  (function mini() {
    var mh = document.querySelector('[data-radio-mini]'); if (!mh) return;
    var link = mh.querySelector('a'), dest = new URL(link ? link.getAttribute('href') : 'music/playground/#radio', location.href).href;   // absolute: the header stays mounted when js/nav.js swaps pages
    var d = el('span', 'br-mini'); d.tabIndex = 0;
    d.setAttribute('role', 'slider'); d.setAttribute('aria-label', 'Rebella radio'); d.setAttribute('aria-valuemin', '0'); d.setAttribute('aria-valuemax', String(N - 1));
    d.setAttribute('aria-describedby', 'br-mini-help'); d.setAttribute('data-help', 'radio-mini');
    var f = face(); f.sway.style.animation = 'none';
    var lab = el('span', 'br-mini-lab', 'Radio'); lab.setAttribute('aria-hidden', 'true');
    var hp = el('span', 'sr-only', 'Turn to choose a station, press Enter to go to the radio.'); hp.id = 'br-mini-help';
    d.appendChild(f.svg); mh.innerHTML = ''; mh.appendChild(d); mh.appendChild(lab); mh.appendChild(hp);
    var i0 = chParam ? idxOfKey(chParam) : -1, at = i0 >= 0 ? i0 : 0;
    try { var sv = +sessionStorage.getItem('rebella.radio.mini'); if (i0 < 0 && sv >= 0 && sv < N) at = sv; } catch (e) {}
    function paint() { f.needle.style.transform = 'rotate(' + (A0 + at * STEP) + 'deg)'; d.setAttribute('aria-valuenow', String(at)); d.setAttribute('aria-valuetext', GEN[order[at]].label); d.title = 'Rebella radio: ' + GEN[order[at]].label; }
    function step(n) { var j = Math.max(0, Math.min(N - 1, at + n)); if (j === at) return; at = j; audio(); if (ac && ac.resume) try { ac.resume(); } catch (x) {} click(); buzz(8); paint(); try { sessionStorage.setItem('rebella.radio.mini', String(at)); } catch (e) {} }
    function go() {
      var k = GEN[order[at]].key;
      if (window.BonnieRadio && document.querySelector('[data-bonnie-radio][data-variant=playground][data-mounted]')) { window.BonnieRadio.select(k, true); return; }        // already on the Playground: no reload
      var u = new URL(dest, location.href); u.searchParams.set('ch', k); u.hash = 'radio'; location.href = u.href;
    }
    var dr = null, wheelT = 0;
    d.addEventListener('pointerdown', function (e) { dr = { id: e.pointerId, y: e.clientY, x: e.clientX, acc: 0, moved: false }; try { d.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    d.addEventListener('pointermove', function (e) { if (!dr || e.pointerId !== dr.id) return; var v = (e.clientX - dr.x) - (e.clientY - dr.y); dr.x = e.clientX; dr.y = e.clientY; dr.acc += v;
      if (Math.abs(dr.acc) > 14) { dr.moved = true; step(dr.acc > 0 ? 1 : -1); dr.acc = 0; } });
    function up(e) { if (!dr || (e && e.pointerId !== dr.id)) return; var m = dr.moved; dr = null; if (!m && e.type === 'pointerup') go(); }
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
    d.addEventListener('wheel', function (e) { e.preventDefault(); var t = performance.now(); if (t - wheelT < 140) return; wheelT = t; step(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1); }, { passive: false });
    d.addEventListener('keydown', function (e) { var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') step(1); else if (k === 'ArrowLeft' || k === 'ArrowDown') step(-1);
      else if (k === 'Home') step(-N); else if (k === 'End') step(N); else if (k === 'Enter' || k === ' ') go(); else return; e.preventDefault(); });
    paint();
  })();

  // ---- main dial + player: mounted on pages that have [data-bonnie-radio] (home, Playground). js/nav.js swaps page
  //      content without a reload, so this can mount again; a previous player keeps playing unless the new page
  //      has its own radio, in which case it is paused and removed cleanly. ----
  var dead = null;
  function mountMain() {
  host = document.querySelector('[data-bonnie-radio]');
  if (!host || host.hasAttribute('data-mounted')) return;
  host.setAttribute('data-mounted', '');
  PG = host.getAttribute('data-variant') === 'playground';
  if (dead) dead();
  // ---- UI ----
  var wrap = el('div', 'br');
  var intro = el('p', 'br-intro', PG ? 'Turn the dial to pick a station. Your band below follows its tempo and key. Music plays from YouTube, only after you press play.' : 'Music picked by Bonnie. It plays from YouTube, only after you press play.');
  var play = el('button', 'br-play'); play.type = 'button';
  var pIco = el('span', 'br-play-ico', '\u25B6'); pIco.setAttribute('aria-hidden', 'true');
  var pTxt = el('span', 'br-play-txt', "Play Bonnie's playlist (from YouTube)");
  play.appendChild(pIco); play.appendChild(pTxt); play.setAttribute('data-help', 'radio-play');

  var tuner = el('div', 'br-tuner');
  var dial = el('div', 'br-dial');
  dial.tabIndex = 0;
  dial.setAttribute('role', 'slider'); dial.setAttribute('aria-label', 'Genre tuner');
  dial.setAttribute('aria-valuemin', '0'); dial.setAttribute('aria-valuemax', String(N - 1));
  dial.setAttribute('aria-describedby', 'br-dial-help'); dial.setAttribute('data-help', 'dial');
  var F = face(), svg = F.svg, needleG = F.needle, sway = F.sway;
  dial.appendChild(svg);
  var tside = el('div', 'br-tside');
  var tuned = el('p', 'br-tuned'); tuned.setAttribute('aria-live', 'polite');
  var help = el('p', 'br-help', 'Turn the dial to change station. Double-tap it (or press R) to shuffle the stations.'); help.id = 'br-dial-help';
  var mute = el('button', 'br-mute'); mute.type = 'button'; mute.setAttribute('data-help', 'radio-mute');
  tside.appendChild(tuned); tside.appendChild(help); tside.appendChild(mute);
  tuner.appendChild(dial); tuner.appendChild(tside);
  var status = el('p', 'br-status'); status.setAttribute('role', 'status');
  wrap.appendChild(intro); wrap.appendChild(play); wrap.appendChild(tuner); wrap.appendChild(status);
  host.appendChild(wrap);

  // the mini-player panel (only built on the first press)
  var panel = el('section', 'br-panel'); panel.hidden = true; panel.setAttribute('aria-label', "Bonnie's radio player"); panel.setAttribute('data-help', 'player');
  var frame = el('div', 'br-frame'), pside = el('div', 'br-pside');
  var ptitle = el('p', 'br-ptitle', "Bonnie's radio"), pnow = el('p', 'br-pnow');
  var ctl = el('div', 'br-ctl');
  function cb(cls, label, g) { var b = el('button', 'br-btn ' + cls); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; var s = el('span', '', g); s.setAttribute('aria-hidden', 'true'); b.appendChild(s); return b; }
  var bNext = cb('br-next', 'Next song (random)', '\u23ED'), bStop = cb('br-stop', 'Stop the music and close the player', '\u2715');
  ctl.appendChild(bNext); ctl.appendChild(bStop);
  var legal = el('p', 'br-legal'); legal.appendChild(document.createTextNode('Plays from YouTube \u00B7 '));
  var aT = el('a', '', 'YouTube Terms'); aT.href = 'https://www.youtube.com/t/terms';
  var aP = el('a', '', 'Google Privacy'); aP.href = 'https://policies.google.com/privacy';
  [aT, aP].forEach(function (x) { x.target = '_blank'; x.rel = 'noopener'; });
  legal.appendChild(aT); legal.appendChild(document.createTextNode(' \u00B7 ')); legal.appendChild(aP);
  pside.appendChild(ptitle); pside.appendChild(pnow); pside.appendChild(ctl); pside.appendChild(legal);
  panel.appendChild(frame); panel.appendChild(pside);
  document.body.appendChild(panel);

  function paintMute() {
    mute.textContent = muted ? '\uD83D\uDD07 Unmute' : '\uD83D\uDD08 Mute';
    mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    mute.setAttribute('aria-label', muted ? 'Unmute the radio' : 'Mute the radio');
  }
  function setMuted(m) {
    muted = !!m; try { localStorage.setItem('rebella.radio.muted', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.02);
    if (player && ready) { try { if (muted) player.mute(); else player.unMute(); } catch (e) {} }
    paintMute();
  }
  mute.addEventListener('click', function () { setMuted(!muted); });

  // ---- dial mechanics ----
  var angle = A0 + (rnd(N)) * STEP, landed = -1;
  function nearest(a) { return Math.max(0, Math.min(N - 1, Math.round((a - A0) / STEP))); }
  function setNeedle(a, animate) {
    needleG.style.transition = animate && !reduce.matches ? 'transform ' + P(-2).toFixed(3) + 's cubic-bezier(.2,.7,.3,1)' : 'none';
    needleG.style.transform = 'rotate(' + a.toFixed(2) + 'deg)';
  }
  function genreAt(i) { return GEN[order[i]]; }
  function paintTuned(i, between) {
    var g = genreAt(i);
    dial.setAttribute('aria-valuenow', String(i));
    dial.setAttribute('aria-valuetext', between ? 'between stations' : g.label);
    tuned.textContent = between ? '\u2026 static \u2026' : 'Tuned: ' + g.label;
  }
  function land(i, fromKey) {
    angle = A0 + i * STEP; setNeedle(angle, true);
    staticTo(0, -2);                                   // static fades out over ~PHI^-2 s
    if (i === landed) { paintTuned(i, false); return; }
    landed = i; click(); buzz(8); paintTuned(i, false);
    tune(genreAt(i));
  }
  function moveTo(a) {
    angle = Math.max(A0, Math.min(A0 + SWEEP, a)); setNeedle(angle, false);
    var i = nearest(angle), d = Math.abs(angle - (A0 + i * STEP)), x = Math.min(1, d / (STEP / 2));
    staticTo(muted ? 0 : 0.22 * Math.pow(x, 1 / PHI));  // loud midway, fading as the needle nears a detent
    if (d < 3.5) { if (i !== landed) { landed = i; click(); buzz(8); tune(genreAt(i)); } paintTuned(i, false); }
    else paintTuned(i, true);
  }
  function angleFrom(e) {
    var r = dial.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
  }
  var drag = null, lastTap = 0;
  dial.addEventListener('pointerdown', function (e) {
    audio(); if (ac && ac.resume) try { ac.resume(); } catch (x) {}
    drag = { id: e.pointerId, a0: angleFrom(e), ang0: angle, moved: false };
    try { dial.setPointerCapture(e.pointerId); } catch (x) {}
    e.preventDefault();
  });
  dial.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var da = angleFrom(e) - drag.a0; if (da > 180) da -= 360; if (da < -180) da += 360;
    if (Math.abs(da) > 2) drag.moved = true;
    if (drag.moved) moveTo(drag.ang0 + da);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var moved = drag.moved; drag = null;
    if (moved) { land(nearest(angle)); return; }
    var now = performance.now();
    if (now - lastTap < P(-1) * 1000) { reroll(); lastTap = 0; } else lastTap = now;
  }
  dial.addEventListener('pointerup', endDrag); dial.addEventListener('pointercancel', endDrag);
  dial.addEventListener('keydown', function (e) {
    var i = nearest(angle), k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageUp') i = Math.min(N - 1, i + 1);
    else if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageDown') i = Math.max(0, i - 1);
    else if (k === 'Home') i = 0; else if (k === 'End') i = N - 1;
    else if (k === 'r' || k === 'R') { e.preventDefault(); audio(); reroll(); return; }
    else return;
    e.preventDefault(); audio(); if (ac && ac.resume) try { ac.resume(); } catch (x) {}
    staticTo(muted ? 0 : 0.16, -4); setTimeout(function () { land(i, true); }, P(-3) * 1000);   // a short burst of static between stations
  });
  function reroll() {
    order = shuffled(); try { sessionStorage.setItem(KEY, JSON.stringify(order)); } catch (e) {}
    landed = -1; click(); setTimeout(click, P(-4) * 1000); buzz(20);
    status.textContent = 'Stations shuffled.';
    land(nearest(angle));
  }

  // ---- player ----
  var player = null, ready = false, started = false, want = false, curList = null, visRatio = 0, pausedHidden = false, seeked = {}, pendingIdx = -1;
  function loadApi(cb) {
    if (window.YT && window.YT.Player) return cb();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (typeof prev === 'function') try { prev(); } catch (e) {} cb(); };
    if (!document.getElementById('br-yt-api')) { var s = document.createElement('script'); s.id = 'br-yt-api'; s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.referrerPolicy = 'strict-origin-when-cross-origin'; document.head.appendChild(s); }
  }
  function build(list) {
    var f = document.createElement('iframe');
    f.id = 'br-yt'; f.className = 'br-yt'; f.width = '200'; f.height = '200';
    f.title = "Bonnie's radio (YouTube player)";
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');   // YouTube needs the Referer; the page itself stays no-referrer
    f.setAttribute('frameborder', '0');
    f.src = HOSTYT + '/embed/videoseries?list=' + encodeURIComponent(list) + '&enablejsapi=1&playsinline=1&rel=0&origin=' + encodeURIComponent(location.origin);
    frame.appendChild(f); curList = list;
    loadApi(function () {
      player = new window.YT.Player('br-yt', { events: {
        onReady: function () { ready = true; if (muted) try { player.mute(); } catch (e) {} startRandom(list, true); },
        onStateChange: onState,
        onError: function (e) { var c = e && e.data; if ((c === 100 || c === 101 || c === 150 || c === 5) && want) { status.textContent = 'Skipped a song that can\u2019t play here.'; setTimeout(next, 600); } else status.textContent = "This station can't play here (check the playlist is Public or Unlisted)."; },
        onAutoplayBlocked: function () { if (!started) status.textContent = 'Tap \u25B6 on the player to start.'; }
      } });
    });
  }
  function plist() { try { var p = player.getPlaylist(); return p && p.length ? p : null; } catch (e) { return null; } }
  // random track: cue the list, read its length, then loadPlaylist at a random index (seekTo picks the random start)
  function startRandom(list, firstLoad) {
    if (!ready) return;
    var before = (plist() || [])[0], tries = 0, same = list === curList && !firstLoad;
    if (!firstLoad && !same) { try { player.cuePlaylist({ listType: 'playlist', list: list }); } catch (e) {} }
    curList = list;
    (function wait() {
      var p = plist();
      if (!p || (!firstLoad && !same && p[0] === before && tries < 15)) { if (++tries < 25) return setTimeout(wait, 200); status.textContent = "This station can't play here (check the playlist is Public or Unlisted)."; return; }
      if (visRatio <= 0.5) { status.textContent = 'Scroll so the player is on screen.'; return setTimeout(wait, 400); }
      if (document.hidden) return setTimeout(wait, 600);
      pendingIdx = rnd(p.length); seeked = {};
      try { player.loadPlaylist({ list: list, listType: 'playlist', index: pendingIdx }); } catch (e) {}
    })();
  }
  function randomSeek(tries) {
    var idx = -1; try { idx = player.getPlaylistIndex(); } catch (e) {}
    var p = plist(), key = curList + ':' + idx + ':' + (p ? p[idx] : '');
    if (seeked[key]) return;
    var d = 0; try { d = player.getDuration(); } catch (e) {}
    if (!(d > 0)) { if ((tries || 0) < 12) setTimeout(function () { randomSeek((tries || 0) + 1); }, 250); return; }
    seeked[key] = true;
    try { player.seekTo(d * (0.10 + Math.random() * 0.60), true); } catch (e) {}
  }
  function onState(e) {
    var S = window.YT.PlayerState;
    if (e.data === S.PLAYING) {
      started = true; randomSeek(0); status.textContent = ''; emit('rebella:radio', { playing: true });
      pnow.textContent = 'Playing from YouTube';
      play.setAttribute('aria-pressed', 'true'); pTxt.textContent = "Bonnie's playlist is on (YouTube)";
    } else if (e.data === S.ENDED) { if (want) next(); else emit('rebella:radio', { playing: false }); }
    else if (e.data === S.PAUSED) { emit('rebella:radio', { playing: false }); if (!pausedHidden) pnow.textContent = 'Paused'; }
  }
  function next() { var p = plist(); if (!p) return; var cur = -1; try { cur = player.getPlaylistIndex(); } catch (e) {} var i = rnd(p.length); if (p.length > 1 && i === cur) i = (i + 1) % p.length; seeked = {}; try { player.playVideoAt(i); } catch (e) {} }

  var curGenre = null;
  function station(g, initial) { var d = { initial: !!initial }; Object.keys(g).forEach(function (k) { d[k] = g[k]; }); return d; }
  function tune(g) {
    curGenre = g; emit('rebella:station', station(g, false));
    if (PG) try { var u = new URL(location.href); u.searchParams.set('ch', g.key); history.replaceState(history.state, '', u.href); emit('rebella:urlstate', {}); } catch (e) {}   // shareable station URL, no extra Back steps
    var pl = pool(g.key);
    if (!pl.length) { status.textContent = g.label + ' is tuning in soon ✨ Try another station, or come back later.'; wrap.setAttribute('data-soon', g.key); return; }
    wrap.removeAttribute('data-soon');
    status.textContent = '';
    if (!player || panel.hidden) return;                 // nothing plays until the listener presses Play
    var pick = pl[rnd(pl.length)];
    want = true; ptitle.textContent = "Bonnie's radio \u00B7 " + g.label;
    startRandom(pick.list, false);
  }
  function openPlayer(list, label) {
    panel.hidden = false; place(); want = true; ptitle.textContent = label;
    if (!player) build(list); else startRandom(list, false);
  }
  function playReading() {
    audio(); if (ac && ac.resume) try { ac.resume(); } catch (x) {}
    var r = readingList();
    if (!r) { status.textContent = 'Reading music is tuning in soon \u2728 It will play here once Dad adds the playlist.'; wrap.setAttribute('data-soon', 'reading'); return false; }
    wrap.removeAttribute('data-soon'); openPlayer(r, 'Reading music'); return true;
  }
  play.addEventListener('click', function () {
    audio(); if (ac && ac.resume) try { ac.resume(); } catch (x) {}
    var m = mainList();
    if (!m) { status.textContent = "Bonnie's playlist is tuning in soon \u2728 Turn the dial while you wait."; wrap.setAttribute('data-soon', 'main'); return; }
    openPlayer(m, "Bonnie's playlist");
  });
  bNext.addEventListener('click', function () { if (ready) { want = true; next(); } });
  bStop.addEventListener('click', function () {
    want = false; if (player) try { player.pauseVideo(); } catch (e) {} emit('rebella:radio', { playing: false });
    panel.hidden = true; play.setAttribute('aria-pressed', 'false'); pTxt.textContent = "Play Bonnie's playlist (from YouTube)"; play.focus();
  });
  document.addEventListener('visibilitychange', function () {
    if (ac) try { if (document.hidden) ac.suspend(); else ac.resume(); } catch (e) {}
    if (!player || !ready) return;
    if (document.hidden) { var st = -1; try { st = player.getPlayerState(); } catch (e) {} if (st === 1 || st === 3) { pausedHidden = true; try { player.pauseVideo(); } catch (e) {} pnow.textContent = 'Paused while the page was hidden'; } }
    else if (pausedHidden) { pausedHidden = false; if (want && !panel.hidden && visRatio > 0.5) try { player.playVideo(); } catch (e) {} }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (en) { visRatio = en.isIntersecting ? en.intersectionRatio : 0; }); }, { threshold: [0, 0.5, 0.51, 1] }).observe(frame);
  else visRatio = 1;

  // fixed corner, clear of the sticky nav (top) and the Emergency-stop button (bottom right)
  function place() {
    if (panel.hidden) return;
    var W = window.innerWidth, H = window.innerHeight, nav = document.querySelector('.mainnav'), esc = document.querySelector('.escape');
    var top = nav ? nav.getBoundingClientRect().bottom + 8 : 8;
    panel.classList.toggle('br-vert', W >= 900);
    var pr = panel.getBoundingClientRect(), bottom = 8;
    if (esc) { var er = esc.getBoundingClientRect(); if (er.width && 8 + pr.width > er.left - 8) bottom = Math.max(bottom, H - er.top + 8); }
    if (W >= 900 && esc) { panel.style.left = 'auto'; panel.style.right = '12px'; var er2 = esc.getBoundingClientRect(); bottom = Math.max(8, H - er2.top + 8); }
    else { panel.style.right = 'auto'; panel.style.left = '8px'; }
    if (H - bottom - pr.height < top) bottom = Math.max(8, H - top - pr.height);
    panel.style.bottom = Math.round(bottom) + 'px';
  }
  window.addEventListener('resize', place); window.addEventListener('orientationchange', function () { setTimeout(place, 150); });

  // needle sway on PHI^4 s with a golden-angle start (k = 1); none with reduced motion
  sway.style.animationDuration = P(4).toFixed(3) + 's';
  sway.style.animationDelay = (-(P(4) * ((1 * G) % 1))).toFixed(3) + 's';
  if (reduce.matches) sway.style.animation = 'none';
  function select(k, focus) {
    var i = idxOfKey(k); if (i >= 0) { angle = A0 + i * STEP; setNeedle(angle, false); landed = i; paintTuned(i, false); tune(genreAt(i)); }
    if (focus) { var hb = 0, fb = innerHeight; try { hb = document.getElementById('app-head').getBoundingClientRect().bottom; fb = document.getElementById('app-foot').getBoundingClientRect().top; } catch (e) {}
      var r = dial.getBoundingClientRect(); window.scrollBy(0, r.top - (hb + Math.max(0, (fb - hb - r.height) / 2)));
      try { dial.focus({ preventScroll: true }); } catch (e) { dial.focus(); } }
  }
  if (PG) host.id = host.id || 'radio';
  var i1 = chParam ? idxOfKey(chParam) : -1; if (i1 >= 0) angle = A0 + i1 * STEP;
  setNeedle(angle, false); landed = nearest(angle); paintTuned(landed, false); paintMute(); curGenre = genreAt(landed);
  window.BonnieRadio = { get order() { return order.map(function (i) { return GEN[i].label; }); }, get genre() { return curGenre && curGenre.label; },
    get station() { return curGenre ? station(curGenre, true) : null; }, reroll: reroll, land: land, select: select, playReading: playReading, setMuted: setMuted };
  if (PG && location.hash === '#radio') { var foc = function () { select(curGenre.key, true); }; if (document.readyState === 'complete') setTimeout(foc, 50); else addEventListener('load', function () { setTimeout(foc, 50); }); }
  emit('rebella:station', station(curGenre, true));
  dead = function () { want = false; try { if (player) player.pauseVideo(); } catch (e) {} try { if (player && player.destroy) player.destroy(); } catch (e) {} panel.remove(); emit('rebella:radio', { playing: false }); };
  }
  mountMain();
  window.BonnieRadioMount = mountMain;
})();
