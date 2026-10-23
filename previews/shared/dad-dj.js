/* Dad's auto-DJ (chat review preview only; rule 10 in /home/box/.config/phi-timing-rules.md). Design preview, not live.
   While Dad's messages are on screen and the music player is on, it picks Dad's genre from the message MOOD TAG only
   (never the text), and sets crossfade length, BPM target and volume from four phi pumps: time of day, weather,
   message urgency and mood. Dad's music sits on Simmie's faster ladder (base x PHI^-1.5): crossfade = PHI^(3.5 + s).
   Layout choice: ONE visible player (the page's single compliant mini-player from bonnie-music.js). A crossfade is an
   equal-power fade-out, load, fade-in through setVolume with the same total length. Playback speed is never changed.
   Testing: ?mood=calm|warm|proud|playful|excited|serious overrides the tag; ?djlist=<playlist id> stands in for every
   genre playlist below until Dad sends real links; ?weather= is read through PhiTiming like the rest of the page. */
(function () {
  'use strict';
  // ===== Dad's genre playlists: placeholders until Dad sends Public or Unlisted playlist links. =====
  // Each genre can hold several playlists; give one a bpm (its typical tempo) and the DJ prefers the closest to target.
  var DAD_PLAYLISTS = {
    ambient:      [{ list: 'REPLACE_WITH_DAD_AMBIENT_PLAYLIST',     bpm: null }],
    acoustic:     [{ list: 'REPLACE_WITH_DAD_ACOUSTIC_PLAYLIST',    bpm: null }],
    soul:         [{ list: 'REPLACE_WITH_DAD_SOUL_PLAYLIST',        bpm: null }],
    folk:         [{ list: 'REPLACE_WITH_DAD_FOLK_PLAYLIST',        bpm: null }],
    cinematic:    [{ list: 'REPLACE_WITH_DAD_CINEMATIC_PLAYLIST',   bpm: null }],
    'indie-pop':  [{ list: 'REPLACE_WITH_DAD_INDIE_POP_PLAYLIST',   bpm: null }],
    'upbeat-pop': [{ list: 'REPLACE_WITH_DAD_UPBEAT_POP_PLAYLIST',  bpm: null }],
    electronic:   [{ list: 'REPLACE_WITH_DAD_ELECTRONIC_PLAYLIST',  bpm: null }],
    piano:        [{ list: 'REPLACE_WITH_DAD_PIANO_PLAYLIST',       bpm: null }]
  };
  // ===================================================================================================
  var PHI = 1.6180339887;
  var MOOD = { calm: 1, warm: 0.5, proud: 0, playful: -0.5, excited: -1, serious: 0.5 };
  var GENRES = { calm: ['ambient', 'acoustic'], warm: ['soul', 'folk'], proud: ['cinematic'], playful: ['indie-pop'],
                 excited: ['upbeat-pop', 'electronic'], serious: ['piano'] };
  var URG = { idle: 0, new: -0.5, dad: -0.5, urgent: -1.5 };
  var WX = { hot: -1, sun: -0.5, storm: 0, cloud: 0, rain: 0.5, fog: 1 };   // rule 6 rows; night is the time-of-day pump
  var ID_RE = /^[A-Za-z0-9_-]{12,64}$/;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function qp(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
  var forcedMood = MOOD.hasOwnProperty(qp('mood')) ? qp('mood') : null;
  var testList = ID_RE.test(qp('djlist') || '') ? qp('djlist') : null;

  function perthHour() { try { return +new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', hourCycle: 'h23' }).format(new Date()) % 24; } catch (e) { return new Date().getHours(); } }
  function timePump() { var h = perthHour(); return h < 5 ? 2 : h >= 21 ? 1.5 : h >= 18 ? 0.5 : 0; }   // day 0 | evening +0.5 | clear night +1.5 | deep night +2
  function weatherPump() {
    var T = window.PhiTiming, st = null;
    try { st = T && T.sweepState ? T.sweepState() : null; } catch (e) {}
    if (!WX.hasOwnProperty(st)) { var c = document.getElementById('wx'); st = c && c.dataset ? c.dataset.state : null; }
    return WX.hasOwnProperty(st) ? WX[st] : 0;
  }
  function urgency() { var m = document.documentElement.dataset.msg || window.SimmieMsgStatus || 'idle'; return URG.hasOwnProperty(m) ? m : 'idle'; }

  // which Dad messages are on screen (IntersectionObserver on .msg.dad); the newest visible one gives the mood tag
  var visible = new Set();
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0.3) visible.add(e.target); else visible.delete(e.target); });
  }, { threshold: [0, 0.3, 0.6] }) : null;
  function scan() { document.querySelectorAll('#log .msg.dad').forEach(function (m) { if (!m._dj) { m._dj = 1; if (io) io.observe(m); else visible.add(m); } }); }
  function dadShowing() { visible.forEach(function (m) { if (!m.isConnected) visible.delete(m); }); return visible.size > 0; }
  function moodTag() {
    if (forcedMood) return forcedMood;
    var last = null; document.querySelectorAll('#log .msg.dad').forEach(function (m) { if (visible.has(m)) last = m; });
    var t = last && last.dataset.mood; return MOOD.hasOwnProperty(t) ? t : null;
  }

  // ---- the numbers (rule 10) ----
  function compute(mood, urg, tp, wp) {
    var s = tp + wp + (URG[urg] || 0) + (mood ? MOOD[mood] : 0);
    var fade = clamp(Math.pow(PHI, 3.5 + s), 2.06, 22.83);
    var bpm = clamp(60 / Math.pow(PHI, -1 + s / 2), 62, 157);
    var vol = clamp(0.55 * Math.pow(PHI, -s / 4), 0.25, 0.8);
    if (mood === 'serious' || urg === 'urgent') vol = 0.3;
    var genres = GENRES[mood || 'proud'];
    return { mood: mood || 'unknown', urg: urg, s: s, fade: fade, bpm: bpm, vol: vol, genres: genres };
  }
  function pick(c) {
    var g = c.genres[Math.floor(Math.random() * c.genres.length)], pool = DAD_PLAYLISTS[g] || [];
    var ok = pool.filter(function (e) { return ID_RE.test(e.list) && e.list.indexOf('REPLACE_') !== 0; });
    if (testList) return { genre: g, list: testList, placeholder: !ok.length };
    if (!ok.length) return { genre: g, list: null, placeholder: true };
    var tagged = ok.filter(function (e) { return e.bpm; });
    var best = tagged.length ? tagged.sort(function (a, b) { return Math.abs(a.bpm - c.bpm) - Math.abs(b.bpm - c.bpm); })[0] : ok[Math.floor(Math.random() * ok.length)];
    return { genre: g, list: best.list, placeholder: false };
  }

  // ---- readout in the preview strip ----
  var band = document.querySelector('.pv-band'), out = document.createElement('span');
  out.className = 'dj-readout'; out.setAttribute('aria-live', 'off');
  out.style.cssText = 'display:block;font:600 .6rem/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  if (band) band.appendChild(out);
  function sign(v) { return (v > 0 ? '+' : v < 0 ? '\u2212' : '\u00B1') + Math.abs(+v.toFixed(2)); }
  function show(c, p, live) {
    out.textContent = 'DJ ' + (live ? 'on' : 'idle') + ': mood ' + c.mood + ', s ' + sign(c.s) + ', ' + Math.round(c.bpm) + ' BPM, fade ' +
      c.fade.toFixed(1) + ' s, vol ' + Math.round(c.vol * 100) + '%' + (p ? ', ' + p.genre + (p.placeholder ? ' (placeholder)' : '') : '');
  }

  // ---- the clock: pumps re-read only at crossfade boundaries; a new track starts at the next boundary ----
  var cur = compute(null, 'idle', timePump(), weatherPump()), playingGenre = null, onDad = false, busy = false, lastMood = null;
  function boundary() {
    scan();
    var M = window.BonnieMusic, live = !!(M && M.playing);
    var c = compute(moodTag(), urgency(), timePump(), weatherPump());
    if (busy) { schedule(cur.fade); return; }                 // never mid-fade
    cur = c;
    var want = live && dadShowing(), p = null;
    if (want) {
      var pos = M.position(), nearEnd = pos && pos.d > 0 && pos.d - pos.t < c.fade * 2;
      if (!onDad || c.mood !== lastMood || nearEnd) {
        p = pick(c);
        if (p.list) { busy = true; M.swap(p.list, c.fade, c.vol, function () { busy = false; }); playingGenre = p.genre; onDad = true; lastMood = c.mood; }
      } else p = { genre: playingGenre, placeholder: false };
    } else if (onDad && live && M.defaultList) {                // Dad's messages scrolled away: back to Bonnie's playlist
      busy = true; M.swap(M.defaultList, c.fade, 1, function () { busy = false; }); onDad = false; playingGenre = null; lastMood = null;
    }
    show(c, p || (want ? null : { genre: c.genres.join('/'), placeholder: !testList }), want && onDad);
    schedule(c.fade);
  }
  var timer = 0;
  function schedule(period) {
    clearTimeout(timer);
    var T0 = (window.PhiTiming && window.PhiTiming.T0) || 0, now = Date.now(), P = period * 1000;
    timer = setTimeout(boundary, P - ((now - T0) % P) + 5);       // next multiple of the current crossfade period
  }
  function boot() { scan(); new MutationObserver(scan).observe(document.getElementById('log') || document.body, { childList: true, subtree: true }); show(cur, null, false); boundary(); }
  window.DadDJ = { compute: compute, get now() { return cur; }, pumps: function () { return { time: timePump(), weather: weatherPump(), urgency: urgency(), mood: moodTag() }; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
