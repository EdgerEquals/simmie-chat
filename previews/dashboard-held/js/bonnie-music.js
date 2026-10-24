/* Bonnie's music (dashboard): the music button at the top of Bonnie's Dashboard plays music generated in the browser
   with plain Web Audio. No audio files, no YouTube or streaming, no API, no key, no network request of any kind.
   (Danny 24 Oct 2026 03:20 AWST: "get the music button working so that when pressed it plays something audible".)
   The old YouTube mini-player (commit 0f3607d) is HELD and kept, unloaded, in js/bonnie-music-youtube.js; the restore
   note is at the top of that file.
   Engine: ported from Dad's generated auto-DJ (simmie-chat 124550d, previews/shared/dad-autodj-quiz.js), retuned to
   Bonnie's side: ONE KEY, C major / A minor (the music-layer key of simmie-chat 175e3b0), so it sits with the sound layer.
   Timing (/home/box/.config/phi-timing-rules.md), Bonnie's ladder (not Simmie's faster one):
     s           = the page's weather sweep (PhiTiming.sweep(), rule 6); with no weather state, the Perth time of day
                   (day 0 | evening 18-21 +0.5 | night 21-24 +1.5 | deep night 00-05 +2)
     BPM         = 60 / PHI^(-1 + s/2), clamped 62-130         crossfade = PHI^(5 + s) s (loop-effect slot), 6.85-29.03 s
     track       = PHI^(9 + s) s, then a new piece crossfades in   volume = 0.5 x PHI^(-s/4), clamped 0.25-0.6 (quieter at night)
     first tap   = PHI^1 s fade-in; tap again = PHI^0 s fade-out    boundaries on multiples of the crossfade period from
                   PhiTiming.T0; s is re-read only at a boundary, never mid-fade.
   Starts only from a tap on the button (autoplay rules); pauses while the tab is hidden; nothing is stored.
   While it plays <html data-bm="playing"> is set, so the generated sound layer (bonnie-sound.js) ducks under it.
   Test hook: window.BonnieMusic.level() (output RMS), .graph, .playing. */
(function () {
  'use strict';
  var PHI = 1.6180339887;
  var me = document.currentScript || document.querySelector('script[src*="bonnie-music.js"]');
  var PAGE = (me && me.getAttribute('data-page')) || 'dash';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------- pumps ----------
  function perthHour() { try { return +new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', hourCycle: 'h23' }).format(new Date()) % 24; } catch (e) { return new Date().getHours(); } }
  function timePump() { var h = perthHour(); return h < 5 ? 2 : h >= 21 ? 1.5 : h >= 18 ? 0.5 : 0; }
  function sweep() { try { var T = window.PhiTiming, v = T && T.sweep ? +T.sweep() : 0; return isFinite(v) && v !== 0 ? v : timePump(); } catch (e) { return timePump(); } }
  function compute() {
    var s = sweep();
    return { s: s, bpm: clamp(60 / Math.pow(PHI, -1 + s / 2), 62, 130), fade: clamp(Math.pow(PHI, 5 + s), 6.854, 29.03),
             trackLen: Math.pow(PHI, 9 + s), vol: clamp(0.5 * Math.pow(PHI, -s / 4), 0.25, 0.6),
             pool: s >= 1.5 ? ['lofi', 'piano', 'ambient'] : s >= 0.5 ? ['lofi', 'ambient', 'pop'] : ['pop', 'lofi', 'ambient'] };
  }

  // ---------- one key: C major / A minor (every scale below uses only the white notes) ----------
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
  var GEN = {
    lofi:    { scale: 'minor', root: 45, progs: [[0, 5, 2, 6], [0, 3, 5, 4]], bars: 1, sev: 1, chords: 'ep', steps: [0, 6, 10], bass: 'walk', bwave: 'triangle', mel: 0.16, lead: 'ep',
               kick: 'x......o..x.....', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.', swing: 0.12, rev: 0.3 },
    ambient: { scale: 'major', root: 48, progs: [[0, 4, 5, 3], [0, 5, 3, 4]], bars: 2, chords: 'pad', wave: 'sine', cut: 1500, bass: 'hold', bwave: 'sine', mel: 0.12, lead: 'bell', rev: 0.55 },
    pop:     { scale: 'major', root: 48, progs: [[0, 4, 5, 3], [5, 3, 0, 4]], bars: 1, chords: 'stab', steps: [0, 3, 6, 10, 12], wave: 'square', cut: 1800, bass: 'eighths', bwave: 'triangle', mel: 0.26, lead: 'square',
               kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.', rev: 0.2 },
    piano:   { scale: 'minor', root: 45, progs: [[0, 5, 3, 4], [0, 3, 4, 0]], bars: 1, chords: 'arp', bass: 'hold', bwave: 'piano', mel: 0.22, lead: 'piano', rev: 0.4 }
  };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function chordNotes(sc, root, deg, sev) { var n = [], c = sev ? 4 : 3; for (var i = 0; i < c; i++) { var d = deg + i * 2; n.push(root + sc[d % 7] + 12 * Math.floor(d / 7)); } return n; }

  // ---------- audio graph (built on the first tap) ----------
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, bus = null, revIn = null, noise = null, meter = null;
  function ensure() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.8;                  // modest overall level
      bus = ctx.createGain(); bus.gain.value = 0.0001;                     // the pump volume
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      var conv = ctx.createConvolver(), L = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, L, ctx.sampleRate);
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3); }
      conv.buffer = ir; revIn = ctx.createGain(); revIn.gain.value = 0.35; revIn.connect(conv); conv.connect(bus);
      bus.connect(master); master.connect(comp); comp.connect(ctx.destination);
      meter = ctx.createAnalyser(); meter.fftSize = 2048; comp.connect(meter);                 // level read-out for tests only
      var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), nd = b.getChannelData(0); for (var j = 0; j < n; j++) nd[j] = Math.random() * 2 - 1; noise = b;
    } catch (e) { ctx = null; }
    return ctx;
  }

  // ---------- instruments ----------
  function env(g, t, a, peak, dur, rel) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur), rel); }
  function osc(type, f, t, end) { var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; }
  function voice(tr, type, f, t, dur, vel, opt) {
    opt = opt || {};
    var end = t + dur + (opt.rel || 0.2) * 5, g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(opt.cut || 2400, t); if (opt.sweep) lp.frequency.setTargetAtTime(opt.cut * 0.25, t, opt.sweep);
    var o = osc(type, f, t, end); o.connect(lp);
    if (opt.det) { var o2 = osc(type, f, t, end); o2.detune.value = opt.det; o2.connect(lp); }
    lp.connect(g); env(g, t, opt.a || 0.005, vel, opt.hold != null ? opt.hold : 0.01, opt.rel || 0.2); g.connect(tr.out);
    if (opt.rev) { var s = ctx.createGain(); s.gain.value = opt.rev; g.connect(s); s.connect(tr.rev); }
  }
  var INST = {
    pad:   function (tr, f, t, d, v) { voice(tr, tr.g.wave, f, t, d, v * 0.10, { a: d * 0.35, hold: d * 0.6, rel: d * 0.25, cut: tr.g.cut, det: 9, rev: 0.8 }); },
    pluck: function (tr, f, t, d, v) { voice(tr, tr.g.wave || 'triangle', f, t, d, v * 0.16, { a: 0.003, hold: 0.01, rel: 0.22, cut: (tr.g.cut || 2400) * 1.6, sweep: 0.08, rev: 0.4 }); },
    stab:  function (tr, f, t, d, v) { voice(tr, tr.g.wave, f, t, d, v * 0.07, { a: 0.004, hold: d * 0.5, rel: 0.06, cut: tr.g.cut, det: 7, rev: 0.25 }); },
    ep:    function (tr, f, t, d, v) {
      var end = t + d + 1.5, c = osc('sine', f, t, end), m = osc('sine', f * 2, t, end), mg = ctx.createGain(), g = ctx.createGain();
      mg.gain.setValueAtTime(f * 1.2, t); mg.gain.setTargetAtTime(f * 0.1, t, 0.25); m.connect(mg); mg.connect(c.frequency);
      c.connect(g); env(g, t, 0.004, v * 0.12, d * 0.7, 0.35); g.connect(tr.out); var s = ctx.createGain(); s.gain.value = 0.4; g.connect(s); s.connect(tr.rev); },
    piano: function (tr, f, t, d, v) { voice(tr, 'triangle', f, t, d, v * 0.14, { a: 0.003, hold: 0.02, rel: 0.6, cut: 3200, sweep: 0.5, rev: 0.6 });
                                       voice(tr, 'sine', f * 2, t, d, v * 0.04, { a: 0.003, hold: 0.01, rel: 0.3, cut: 5000 }); },
    bell:  function (tr, f, t, d, v) { voice(tr, 'sine', f, t, d, v * 0.08, { a: 0.01, hold: 0.02, rel: 0.9, cut: 6000, rev: 1 }); voice(tr, 'sine', f * 3.01, t, d, v * 0.015, { a: 0.005, rel: 0.4, cut: 8000, rev: 1 }); },
    square:function (tr, f, t, d, v) { voice(tr, 'square', f, t, d, v * 0.045, { a: 0.004, hold: d * 0.6, rel: 0.08, cut: 2600, rev: 0.3 }); },
    bass:  function (tr, f, t, d, v) { if (tr.g.bwave === 'piano') return INST.piano(tr, f, t, d, v * 1.2);
                                       voice(tr, tr.g.bwave, f, t, d, v * (tr.g.bwave === 'sine' ? 0.22 : 0.16), { a: 0.006, hold: d * 0.8, rel: 0.08, cut: 600 }); }
  };
  function hit(tr, kind, t, v) {
    var g = ctx.createGain(); g.connect(tr.out);
    if (kind === 'kick') {
      var o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(g);
      g.gain.setValueAtTime(v * 0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.start(t); o.stop(t + 0.36);
      return;
    }
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(); src.buffer = noise; src.connect(f); f.connect(g);
    var len = kind === 'snare' ? 0.16 : 0.035;
    f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7500;
    g.gain.setValueAtTime(v * (kind === 'snare' ? 0.22 : 0.06), t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.start(t, Math.random() * 0.5); src.stop(t + len + 0.02);
  }

  // ---------- a piece: genre + BPM + seed (always in the one key: no root shift) ----------
  function makeTrack(genre, bpm, seed) {
    var g = GEN[genre], r = rng(seed), sc = SCALES[g.scale], root = g.root;
    var prog = g.progs[Math.floor(r() * g.progs.length)], mel = [], deg = 7 + Math.floor(r() * 3);
    for (var i = 0; i < 32; i++) {
      var strong = i % 4 === 0, p = strong ? g.mel * 2.2 : (i % 2 ? g.mel * 0.6 : g.mel);
      if (r() < p) { deg = clamp(deg + [-2, -1, -1, 0, 1, 1, 2, 3][Math.floor(r() * 8)], 4, 13); mel.push(deg); } else mel.push(null);
    }
    var out = ctx.createGain(); out.gain.value = 0.0001; out.connect(bus);
    var wet = ctx.createGain(); wet.gain.value = 0.0001; wet.connect(revIn);
    var rv = ctx.createGain(); rv.gain.value = g.rev; rv.connect(wet);
    return { genre: genre, bpm: bpm, g: g, sc: sc, root: root, prog: prog, mel: mel, r: r, out: out, wet: wet, rev: rv, step: 0, next: ctx.currentTime + 0.06, born: Date.now() };
  }
  function playStep(tr, t) {
    var g = tr.g, st = tr.step, s16 = st % 16, bar = Math.floor(st / 16), dur16 = 60 / tr.bpm / 4, v;
    var deg = tr.prog[Math.floor(bar / g.bars) % tr.prog.length], ch = chordNotes(tr.sc, tr.root, deg, g.sev);
    var barLen = dur16 * 16 * g.bars, first = s16 === 0 && bar % g.bars === 0;
    if (g.chords === 'pad' && first) ch.forEach(function (n) { INST.pad(tr, mtof(n + 12), t, barLen, 1); });
    if ((g.chords === 'stab' || g.chords === 'ep') && g.steps.indexOf(s16) >= 0)
      ch.forEach(function (n) { (g.chords === 'ep' ? INST.ep : INST.stab)(tr, mtof(n + 12), t, dur16 * (g.chords === 'ep' ? 5 : 2), s16 ? 0.8 : 1); });
    if (g.chords === 'arp' && s16 % 2 === 0) { var an = ch.concat([ch[0] + 12]); INST.piano(tr, mtof(an[(s16 / 2) % an.length] + 12), t, dur16 * 2, s16 % 8 ? 0.6 : 0.9); }
    var bn = ch[0] - 12;
    if (g.bass === 'hold' && first) INST.bass(tr, mtof(bn), t, barLen * 0.9, 1);
    if (g.bass === 'walk' && [0, 3, 6, 8, 11, 14].indexOf(s16) >= 0) INST.bass(tr, mtof(s16 === 0 ? bn : ch[[0, 1, 2, 1, 2, 0][[0, 3, 6, 8, 11, 14].indexOf(s16)]] - 12), t, dur16 * 2, 0.9);
    if (g.bass === 'eighths' && s16 % 2 === 0) INST.bass(tr, mtof(bn), t, dur16 * 1.5, s16 % 4 ? 0.7 : 1);
    var md = tr.mel[st % 32];
    if (md != null) { if (tr.r() < 0.12) md += tr.r() < 0.5 ? 1 : -1; md = Math.max(0, md); INST[g.lead](tr, mtof(tr.root + tr.sc[md % 7] + 12 * Math.floor(md / 7) + 12), t, dur16 * (g.lead === 'bell' ? 6 : 2), 0.8); }
    ['kick', 'snare', 'hat'].forEach(function (k) { var pat = g[k]; if (pat && (v = pat[s16]) !== '.') hit(tr, k, t, v === 'x' ? 1 : 0.55); });
  }
  function stepLen(tr) { var d = 60 / tr.bpm / 4, sw = tr.g.swing || 0; return tr.step % 2 ? d * (1 - sw) : d * (1 + sw); }

  // ---------- look-ahead scheduler + equal-power fades ----------
  var tracks = [], sched = 0;
  function tick() {
    if (!ctx) return;
    var horizon = ctx.currentTime + 0.15;
    tracks.forEach(function (tr) {
      if (tr.next < ctx.currentTime - 0.5) tr.next = ctx.currentTime + 0.02;   // resumed after being hidden
      while (tr.next < horizon && !tr.dead) { playStep(tr, tr.next); tr.next += stepLen(tr); tr.step++; }
    });
  }
  function curve(up) { var n = 64, a = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1); a[i] = Math.max(0.0001, up ? Math.sin(x * Math.PI / 2) : Math.cos(x * Math.PI / 2)); } return a; }
  function fadeGain(gn, up, t, len) { try { gn.gain.cancelScheduledValues(t); gn.gain.setValueCurveAtTime(curve(up), t, len); } catch (e) { gn.gain.setTargetAtTime(up ? 1 : 0.0001, t, len / 3); } }
  function fadeTrack(tr, up, t, len) { fadeGain(tr.out, up, t, len); fadeGain(tr.wet, up, t, len); }

  var playing = false, cur = null, fadingUntil = 0, clock = 0, flip = 0;
  function T0() { return (window.PhiTiming && window.PhiTiming.T0) || 0; }
  function kill(tr) { tr.dead = true; tracks = tracks.filter(function (x) { return x !== tr; }); setTimeout(function () { try { tr.out.disconnect(); tr.wet.disconnect(); tr.rev.disconnect(); } catch (e) {} }, 400); }
  function startTrack(c, fade) {
    var genre = c.pool[(flip++) % c.pool.length], tr = makeTrack(genre, c.bpm, (Math.random() * 1e9) | 0), t = ctx.currentTime + 0.05;
    var old = tracks.filter(function (x) { return !x.dead && !x.leaving; }), len = fade || c.fade;
    fadeTrack(tr, true, t, len);
    old.forEach(function (o) { o.leaving = true; fadeTrack(o, false, t, len); setTimeout(function () { kill(o); }, len * 1000 + 300); });
    tracks.push(tr); tr.trackLen = c.trackLen; fadingUntil = Date.now() + len * 1000;
    return tr;
  }
  function boundary() {
    var c = compute();
    if (!playing || !ctx) return;
    if (Date.now() < fadingUntil) { schedule(c.fade); return; }       // never mid-fade
    var tr = tracks.filter(function (x) { return !x.leaving && !x.dead; })[0];
    var changed = !tr || c.pool.indexOf(tr.genre) < 0 || Math.abs(tr.bpm - c.bpm) > 0.5;
    var old = tr && (Date.now() - tr.born) / 1000 >= tr.trackLen;
    if (changed || old) tr = startTrack(c);
    bus.gain.setTargetAtTime(c.vol, ctx.currentTime, c.fade / 3);
    cur = c; cur.genre = tr.genre; paint();
    schedule(c.fade);
  }
  function schedule(period) { clearTimeout(clock); var P = period * 1000, now = Date.now(); clock = setTimeout(boundary, P - ((now - T0()) % P) + 5); }

  function start() {
    if (!ensure()) { paint(); return; }
    try { if (ctx.resume) ctx.resume(); } catch (e) {}
    playing = true; var c = compute(), t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(c.vol, t);
    var tr = startTrack(c, PHI); cur = c; cur.genre = tr.genre;           // first tap: PHI^1 s fade-in
    if (!sched) sched = setInterval(tick, 25); tick();
    document.documentElement.setAttribute('data-bm', 'playing');          // the sound layer ducks under the music
    paint(); schedule(c.fade);
  }
  function stop() {
    playing = false; clearTimeout(clock);
    if (ctx) { var t = ctx.currentTime, len = Math.pow(PHI, 0); tracks.forEach(function (o) { o.leaving = true; fadeTrack(o, false, t, len); setTimeout(function () { kill(o); }, len * 1000 + 300); }); }
    document.documentElement.setAttribute('data-bm', 'idle');
    fadingUntil = 0; paint();
  }

  // ---------- the button (same .bm / .bm-pill markup and spot as before, so styling and the glow are unchanged) ----------
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  var root = el('div', 'bm bm-' + PAGE), pill = el('button', 'bm-pill'), ico = el('span', 'bm-pill-ico', '\u266A'), txt = el('span', 'bm-pill-txt');
  pill.type = 'button'; ico.setAttribute('aria-hidden', 'true'); pill.appendChild(ico); pill.appendChild(txt); root.appendChild(pill);
  function paint() {
    var label = !AC ? 'music: no sound in this browser' : playing ? "Bonnie's music on (tap to stop)" : "tap for Bonnie's music";
    root.setAttribute('data-state', !AC ? 'unset' : playing ? 'playing' : 'idle');
    if (cur && playing) root.setAttribute('data-genre', cur.genre); else root.removeAttribute('data-genre');
    txt.textContent = playing ? "Bonnie's music on" : !AC ? 'music: no sound here' : "tap for Bonnie's music";
    pill.setAttribute('aria-pressed', playing ? 'true' : 'false'); pill.setAttribute('aria-label', label); pill.title = label;
    pill.disabled = !AC;
  }
  pill.addEventListener('click', function () { if (playing) stop(); else start(); });
  document.addEventListener('visibilitychange', function () { if (!ctx) return; try { if (document.hidden) ctx.suspend(); else if (playing) ctx.resume(); } catch (e) {} });

  function mount() {
    var tb = document.querySelector('.tb-right'), lk = document.querySelector('#lock');
    if (!tb) return false;
    tb.insertBefore(root, lk && lk.parentNode === tb ? lk : tb.firstChild);
    return true;
  }
  function boot() {
    if (!mount()) return;
    paint();
    window.BonnieMusic = {
      open: start, close: stop, get playing() { return playing; }, get now() { return cur; }, compute: compute, GEN: Object.keys(GEN),
      level: function () { if (!meter) return 0; var a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); var q = 0; for (var i = 0; i < a.length; i++) q += a[i] * a[i]; return Math.sqrt(q / a.length); },
      get graph() { return ctx ? { state: ctx.state, tracks: tracks.length, bus: bus.gain.value, master: master.gain.value, sampleRate: ctx.sampleRate } : null; }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
