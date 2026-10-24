/* Dad's auto-DJ, generated in the browser (questionnaire preview only; phi rule 10 in /home/box/.config/phi-timing-rules.md).
   Music is synthesised with plain Web Audio (no audio files, no YouTube or streaming, no keys, no copyrighted tracks).
   Dad's side runs on Simmie's faster ladder (every base period x PHI^-1.5). Four pumps add phi steps to s:
     time of day  day 0 | evening (18-21) +0.5 | clear night (21-24) +1.5 (cloudy/wet night counts as evening +0.5) | deep night 00-05 +2
     weather      from the page's own cached Open-Meteo state (window.SIM_WX, 'simwx' event; no new calls):
                  hot -1 | sun -0.5 | storm 0 | cloud 0 | rain +0.5 | fog +1 | (clear night is counted by the time pump) | none 0
     urgency      idle 0 | new -0.5 | urgent -1.5   (no message feed here: idle unless the demo chips change it)
     mood tag     calm +1 | warm +0.5 | proud 0 | playful -0.5 | excited -1 | serious +0.5 | neutral/unknown 0
   From s:  crossfade = PHI^(3.5+s) s, clamped 2.06-22.83, equal-power   BPM = 60 / PHI^(-1+s/2), clamped 62-157
            volume = 0.55 x PHI^(-s/4), clamped 0.25-0.8 (serious or urgent duck to 0.3)
            track length = PHI^(7.5+s) s (Bonnie slot PHI^9 x PHI^-1.5)   genre from mood (neutral plays the proud genre).
   Clock: boundaries fall on multiples of the current crossfade period; pumps are re-read only there, never mid-fade,
   and a new track starts at a boundary. Nothing plays before a tap; the page's sound switch is the master mute.
   The page never reads any message text (there is none here); the demo chips only stand in for Simmie's tags.
   Storage: localStorage 'preview.dadDJ.vol' only. Test hooks: ?mood= ?urgency= ?hour=0-23 ; window.DadAutoDJ. */
(function () {
  'use strict';
  var PHI = 1.6180339887;
  var MOOD = { neutral: 0, calm: 1, warm: 0.5, proud: 0, playful: -0.5, excited: -1, serious: 0.5 };
  var GENRES = { neutral: ['cinematic'], calm: ['ambient', 'acoustic'], warm: ['soul', 'folk'], proud: ['cinematic'], playful: ['indie-pop'],
                 excited: ['upbeat-pop', 'electronic'], serious: ['piano'] };
  var URG = { idle: 0, 'new': -0.5, urgent: -1.5 };
  var WX = { hot: -1, sun: -0.5, storm: 0, cloud: 0, rain: 0.5, fog: 1, night: 0, snow: 0 };
  var TIME = { day: 0, evening: 0.5, night: 1.5, deep: 2 };
  var K_VOL = 'preview.dadDJ.vol';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function qp(k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } }
  function store(k, v) { try { if (v != null) localStorage.setItem(k, v); return localStorage.getItem(k); } catch (e) { return null; } }
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  // ---------- pumps ----------
  var demo = { mood: MOOD.hasOwnProperty(qp('mood')) ? qp('mood') : 'neutral', urgency: URG.hasOwnProperty(qp('urgency')) ? qp('urgency') : 'idle',
               sky: 'live', time: 'live' };
  var hourOverride = /^\d{1,2}$/.test(qp('hour') || '') ? (+qp('hour')) % 24 : null;
  function perthHour() {
    if (hourOverride != null) return hourOverride;
    try { return +new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', hourCycle: 'h23' }).format(new Date()) % 24; } catch (e) { return new Date().getHours(); }
  }
  function sky() { if (demo.sky !== 'live') return demo.sky; var w = window.SIM_WX; return w && WX.hasOwnProperty(w.cond) ? w.cond : null; }
  function timeSlot() {
    if (demo.time !== 'live') return demo.time;
    var h = perthHour(), k = sky();
    if (h < 5) return 'deep';
    if (h >= 21) return (k == null || k === 'night' || k === 'sun' || k === 'hot') ? 'night' : 'evening';
    if (h >= 18) return 'evening';
    return 'day';
  }
  function pumps() {
    var t = timeSlot(), k = sky();
    return { time: t, tp: TIME[t], sky: k || 'none', wp: k ? WX[k] : 0, urgency: demo.urgency, up: URG[demo.urgency], mood: demo.mood, mp: MOOD[demo.mood] };
  }
  function compute(p) {
    p = p || pumps();
    var s = p.tp + p.wp + p.up + p.mp;
    var vol = clamp(0.55 * Math.pow(PHI, -s / 4), 0.25, 0.8);
    if (p.mood === 'serious' || p.urgency === 'urgent') vol = 0.3;
    return { p: p, s: s, fade: clamp(Math.pow(PHI, 3.5 + s), 2.06, 22.83), bpm: clamp(60 / Math.pow(PHI, -1 + s / 2), 62, 157),
             vol: vol, trackLen: Math.pow(PHI, 7.5 + s), genres: GENRES[p.mood] || GENRES.neutral };
  }

  // ---------- music theory + genre table ----------
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
  //  chords: pad | strum | stab | ep | arp ; bass: hold | roots | walk | eighths | octave ; drums: 16-step strings (x loud, o soft)
  var GEN = {
    ambient:     { scale: 'lydian', root: 50, progs: [[0, 4, 5, 3], [0, 5, 3, 4]], bars: 2, chords: 'pad', wave: 'sine', cut: 1500, bass: 'hold', bwave: 'sine', mel: 0.10, lead: 'bell', rev: 0.55 },
    acoustic:    { scale: 'major', root: 55, progs: [[0, 4, 5, 3], [0, 3, 4, 4]], bars: 1, chords: 'strum', steps: [0, 6, 8, 14], wave: 'triangle', cut: 2400, bass: 'roots', bwave: 'triangle', mel: 0.22, lead: 'pluck',
                   kick: 'x.......o.......', shaker: '..o...o...o...o.', rev: 0.3 },
    soul:        { scale: 'dorian', root: 50, progs: [[1, 4, 0, 5], [0, 3, 1, 4]], bars: 1, sev: 1, chords: 'ep', steps: [0, 6, 10], bass: 'walk', bwave: 'triangle', mel: 0.18, lead: 'ep',
                   kick: 'x......o..x.....', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.', swing: 0.12, rev: 0.25 },
    folk:        { scale: 'major', root: 52, progs: [[0, 3, 0, 4], [0, 5, 3, 4]], bars: 1, chords: 'strum', steps: [0, 4, 8, 12], wave: 'triangle', cut: 2000, bass: 'roots', bwave: 'triangle', mel: 0.28, lead: 'pluck',
                   tom: 'x.......x.......', shaker: 'o.o.o.o.o.o.o.o.', rev: 0.3 },
    cinematic:   { scale: 'minor', root: 45, progs: [[0, 5, 2, 6], [0, 3, 5, 4]], bars: 2, chords: 'pad', wave: 'sawtooth', cut: 900, ost: 1, bass: 'hold', bwave: 'sawtooth', mel: 0.08, lead: 'horn',
                   tom: 'x...........o...', rev: 0.55 },
    'indie-pop': { scale: 'major', root: 52, progs: [[0, 4, 5, 3], [5, 3, 0, 4]], bars: 1, chords: 'stab', steps: [0, 3, 6, 10, 12], wave: 'square', cut: 1800, bass: 'eighths', bwave: 'triangle', mel: 0.28, lead: 'square',
                   kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.o.x.o.x.o.x.o.', rev: 0.2 },
    'upbeat-pop':{ scale: 'major', root: 53, progs: [[0, 4, 5, 3], [3, 4, 0, 5]], bars: 1, chords: 'stab', steps: [2, 6, 10, 14], wave: 'sawtooth', cut: 2600, bass: 'octave', bwave: 'sawtooth', mel: 0.32, lead: 'saw',
                   kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', rev: 0.2 },
    electronic:  { scale: 'minor', root: 45, progs: [[0, 5, 3, 4], [0, 6, 5, 4]], bars: 1, chords: 'pad', wave: 'sawtooth', cut: 1200, arp: 1, bass: 'eighths', bwave: 'square', mel: 0.12, lead: 'square',
                   kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'oxoxoxoxoxoxoxox', rev: 0.25 },
    piano:       { scale: 'minor', root: 48, progs: [[0, 5, 3, 4], [0, 3, 4, 0]], bars: 1, chords: 'arp', bass: 'hold', bwave: 'piano', mel: 0.25, lead: 'piano', rev: 0.4 }
  };
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function chordNotes(sc, root, deg, sev) { var n = [], c = sev ? 4 : 3; for (var i = 0; i < c; i++) { var d = deg + i * 2; n.push(root + sc[d % 7] + 12 * Math.floor(d / 7)); } return n; }

  // ---------- audio graph ----------
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, bus = null, revIn = null, noise = null, meter = null;
  function ensure() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = sliderVol();           // the volume slider
      bus = ctx.createGain(); bus.gain.value = 0.55;                       // the pump volume
      var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      var conv = ctx.createConvolver(), L = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, L, ctx.sampleRate);
      for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3); }
      conv.buffer = ir; revIn = ctx.createGain(); revIn.gain.value = 0.35; revIn.connect(conv); conv.connect(bus);
      bus.connect(master); master.connect(comp); comp.connect(ctx.destination);
      meter = ctx.createAnalyser(); meter.fftSize = 2048; comp.connect(meter);              // level check for tests only
      var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), nd = b.getChannelData(0); for (var j = 0; j < n; j++) nd[j] = Math.random() * 2 - 1; noise = b;
    } catch (e) { ctx = null; }
    return ctx;
  }

  // ---------- instruments (each plays one note into a track's output) ----------
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
    horn:  function (tr, f, t, d, v) { voice(tr, 'sawtooth', f, t, d, v * 0.06, { a: 0.12, hold: d * 0.8, rel: 0.3, cut: 1100, det: 5, rev: 0.8 }); },
    square:function (tr, f, t, d, v) { voice(tr, 'square', f, t, d, v * 0.045, { a: 0.004, hold: d * 0.6, rel: 0.08, cut: 2600, rev: 0.3 }); },
    saw:   function (tr, f, t, d, v) { voice(tr, 'sawtooth', f, t, d, v * 0.045, { a: 0.004, hold: d * 0.6, rel: 0.08, cut: 3200, det: 6, rev: 0.3 }); },
    bass:  function (tr, f, t, d, v) { if (tr.g.bwave === 'piano') return INST.piano(tr, f, t, d, v * 1.2);
                                       voice(tr, tr.g.bwave, f, t, d, v * (tr.g.bwave === 'sine' ? 0.22 : 0.16), { a: 0.006, hold: d * 0.8, rel: 0.08, cut: 600 }); }
  };
  function hit(tr, kind, t, v) {
    var g = ctx.createGain(); g.connect(tr.out);
    if (kind === 'kick' || kind === 'tom') {
      var o = ctx.createOscillator(), f0 = kind === 'kick' ? 130 : 95, f1 = kind === 'kick' ? 42 : 62, dec = kind === 'kick' ? 0.12 : 0.35;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dec); o.connect(g);
      g.gain.setValueAtTime(v * (kind === 'kick' ? 0.55 : 0.4), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec * 2.5); o.start(t); o.stop(t + dec * 3);
      return;
    }
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(); src.buffer = noise; src.connect(f); f.connect(g);
    var len = kind === 'snare' ? 0.16 : kind === 'shaker' ? 0.06 : 0.035;
    f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : kind === 'shaker' ? 5200 : 7500;
    g.gain.setValueAtTime(v * (kind === 'snare' ? 0.22 : kind === 'shaker' ? 0.05 : 0.06), t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.start(t, Math.random() * 0.5); src.stop(t + len + 0.02);
  }

  // ---------- a track: one generated piece (genre + BPM + seed) ----------
  function makeTrack(genre, bpm, seed) {
    var g = GEN[genre], r = rng(seed), sc = SCALES[g.scale], root = g.root + [-2, 0, 0, 2, 3, -3][Math.floor(r() * 6)];
    var prog = g.progs[Math.floor(r() * g.progs.length)], mel = [], deg = 7 + Math.floor(r() * 3);
    for (var i = 0; i < 32; i++) {                                // a 2-bar motif, repeated with small variations
      var strong = i % 4 === 0, p = strong ? g.mel * 2.2 : (i % 2 ? g.mel * 0.6 : g.mel);
      if (r() < p) { deg = clamp(deg + [-2, -1, -1, 0, 1, 1, 2, 3][Math.floor(r() * 8)], 4, 13); mel.push(deg); } else mel.push(null);
    }
    var out = ctx.createGain(); out.gain.value = 0.0001; out.connect(bus);
    var wet = ctx.createGain(); wet.gain.value = 0.0001; wet.connect(revIn);                    // reverb send, faded with the track
    var rv = ctx.createGain(); rv.gain.value = g.rev; rv.connect(wet);
    return { genre: genre, bpm: bpm, g: g, sc: sc, root: root, prog: prog, mel: mel, r: r, out: out, wet: wet, rev: rv, step: 0, next: ctx.currentTime + 0.06, born: Date.now() };
  }
  function playStep(tr, t) {
    var g = tr.g, st = tr.step, s16 = st % 16, bar = Math.floor(st / 16), dur16 = 60 / tr.bpm / 4, v;
    var deg = tr.prog[Math.floor(bar / g.bars) % tr.prog.length], ch = chordNotes(tr.sc, tr.root, deg, g.sev);
    var barLen = dur16 * 16 * g.bars, first = s16 === 0 && bar % g.bars === 0;
    // chords
    if (g.chords === 'pad' && first) ch.forEach(function (n) { INST.pad(tr, mtof(n + 12), t, barLen, 1); });
    if ((g.chords === 'strum' || g.chords === 'stab' || g.chords === 'ep') && g.steps.indexOf(s16) >= 0)
      ch.forEach(function (n, k) { var inst = g.chords === 'ep' ? INST.ep : g.chords === 'stab' ? INST.stab : INST.pluck; inst(tr, mtof(n + 12), t + (g.chords === 'strum' ? k * 0.012 : 0), dur16 * (g.chords === 'ep' ? 5 : 2), s16 ? 0.8 : 1); });
    if (g.chords === 'arp' && s16 % 2 === 0) { var an = ch.concat([ch[0] + 12]); INST.piano(tr, mtof(an[(s16 / 2) % an.length] + 12), t, dur16 * 2, s16 % 8 ? 0.6 : 0.9); }
    if (g.arp) { var a2 = ch.concat([ch[0] + 12, ch[1] + 12]); INST.square(tr, mtof(a2[s16 % a2.length] + 24), t, dur16 * 0.8, 0.45); }
    if (g.ost && s16 % 2 === 0) INST.stab(tr, mtof(ch[s16 % 4 === 0 ? 0 : 2] + 12), t, dur16 * 1.6, 0.7);
    // bass
    var bn = ch[0] - 12;
    if (g.bass === 'hold' && first) INST.bass(tr, mtof(bn), t, barLen * 0.9, 1);
    if (g.bass === 'roots' && (s16 === 0 || s16 === 8)) INST.bass(tr, mtof(s16 ? ch[2] - 12 : bn), t, dur16 * 6, 1);
    if (g.bass === 'walk' && [0, 3, 6, 8, 11, 14].indexOf(s16) >= 0) INST.bass(tr, mtof(s16 === 0 ? bn : ch[[0, 1, 2, 1, 2, 0][[0, 3, 6, 8, 11, 14].indexOf(s16)]] - 12), t, dur16 * 2, 0.9);
    if (g.bass === 'eighths' && s16 % 2 === 0) INST.bass(tr, mtof(bn), t, dur16 * 1.5, s16 % 4 ? 0.7 : 1);
    if (g.bass === 'octave' && s16 % 2 === 0) INST.bass(tr, mtof(bn + (s16 % 4 ? 12 : 0)), t, dur16 * 1.5, 0.9);
    // melody (Dad's tune): motif from the seed, a note shifted now and then
    var md = tr.mel[st % 32];
    if (md != null) { if (tr.r() < 0.12) md += tr.r() < 0.5 ? 1 : -1; INST[g.lead](tr, mtof(tr.root + tr.sc[md % 7] + 12 * Math.floor(md / 7) + 12), t, dur16 * (g.lead === 'horn' || g.lead === 'bell' ? 6 : 2), 0.8); }
    // drums
    ['kick', 'snare', 'hat', 'shaker', 'tom'].forEach(function (k) { var pat = g[k]; if (pat && (v = pat[s16]) !== '.') hit(tr, k, t, v === 'x' ? 1 : 0.55); });
    if (s16 % 4 === 0) beat(t, s16 === 0);
  }
  function stepLen(tr) { var d = 60 / tr.bpm / 4, sw = tr.g.swing || 0; return tr.step % 2 ? d * (1 - sw) : d * (1 + sw); }

  // ---------- scheduler (look-ahead) ----------
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
  // ---------- the DJ ----------
  var playing = false, cur = null, fadingUntil = 0, clock = 0, T0 = Date.now(), lastMood = null, genreFlip = 0, setBm = false;
  function startTrack(c, fade) {
    var gs = c.genres, genre = gs[(genreFlip++) % gs.length], tr = makeTrack(genre, c.bpm, (Math.random() * 1e9) | 0), t = ctx.currentTime + 0.05;
    var old = tracks.filter(function (x) { return !x.dead && !x.leaving; }), len = fade || c.fade;
    fadeTrack(tr, true, t, len);
    old.forEach(function (o) { o.leaving = true; fadeTrack(o, false, t, len); setTimeout(function () { kill(o); }, len * 1000 + 300); });
    tracks.push(tr); fadingUntil = Date.now() + len * 1000; lastMood = c.p.mood;
    return tr;
  }
  function kill(tr) { tr.dead = true; tracks = tracks.filter(function (x) { return x !== tr; }); setTimeout(function () { try { tr.out.disconnect(); tr.wet.disconnect(); tr.rev.disconnect(); } catch (e) {} }, 400); }
  function applyVol(c, len) { if (bus) bus.gain.setTargetAtTime(c.vol, ctx.currentTime, Math.max(0.05, len / 3)); }
  function boundary() {
    var c = compute();
    if (Date.now() < fadingUntil) { schedule(c.fade); paint(c); return; }   // never mid-fade
    if (playing && ctx) {
      var tr = tracks.filter(function (x) { return !x.leaving && !x.dead; })[0];
      var changed = !tr || c.genres.indexOf(tr.genre) < 0 || Math.abs(tr.bpm - c.bpm) > 0.5 || c.p.mood !== lastMood;
      var old = tr && (Date.now() - tr.born) / 1000 >= tr.trackLen;
      if (changed || old) { tr = startTrack(c); tr.trackLen = c.trackLen; }
      applyVol(c, c.fade); cur = c; cur.genre = tr.genre;
    } else { cur = c; }
    paint(c); schedule(c.fade);
  }
  function schedule(period) { clearTimeout(clock); var P = period * 1000, now = Date.now(); clock = setTimeout(boundary, P - ((now - T0) % P) + 5); }
  function nextIn() { var c = compute(), P = c.fade * 1000; return (P - ((Date.now() - T0) % P)) / 1000; }

  function start() {
    if (!ensure()) { paint(compute()); return; }
    try { ctx.resume && ctx.resume(); } catch (e) {}
    playing = true; var c = compute(); bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(c.vol, ctx.currentTime);
    var tr = startTrack(c, PHI); tr.trackLen = c.trackLen; cur = c; cur.genre = tr.genre;   // first tap: a quick PHI^1 s fade-in (crossfades use PHI^(3.5+s))
    if (!sched) sched = setInterval(tick, 25); tick();
    if (!document.documentElement.hasAttribute('data-bm')) { document.documentElement.setAttribute('data-bm', 'playing'); setBm = true; }  // the generated cue layer ducks to 30% under the music
    paint(c); schedule(c.fade);
  }
  function stop() {
    playing = false;
    if (ctx) { var t = ctx.currentTime; tracks.forEach(function (o) { o.leaving = true; fadeTrack(o, false, t, 1); setTimeout(function () { kill(o); }, 1300); }); }
    if (setBm) { document.documentElement.removeAttribute('data-bm'); setBm = false; }
    fadingUntil = 0; paint(compute());
  }

  // ---------- UI (Dad header) ----------
  var $ = function (id) { return document.getElementById(id); };
  var btn, vol, read, readP, led, chips;
  function sliderVol() { var v = vol ? +vol.value : +(store(K_VOL) || 80); return clamp(isFinite(v) ? v : 80, 0, 100) / 100; }
  function sgn(v) { return (v > 0 ? '+' : v < 0 ? '\u2212' : '\u00B1') + Math.abs(v); }
  function paint(c) {
    if (!read) return;
    var shown = playing && cur ? cur : c, g = playing && cur && cur.genre ? cur.genre : c.genres.join(' / ');
    read.textContent = g + ' \u00B7 ' + Math.round(shown.bpm) + ' BPM \u00B7 fade ' + shown.fade.toFixed(1) + ' s \u00B7 vol ' + Math.round(shown.vol * 100) + '%';
    var p = c.p, pend = playing && cur && (Math.abs(cur.s - c.s) > 1e-9 || cur.p.mood !== c.p.mood);
    readP.textContent = 's ' + sgn(c.s) + ' = time ' + p.time + ' ' + sgn(p.tp) + ', sky ' + p.sky + ' ' + sgn(p.wp) + ', ' + p.urgency + ' ' + sgn(p.up) + ', ' + p.mood + ' ' + sgn(p.mp) +
      (pend ? ' \u2192 next: ' + c.genres.join('/') + ' ' + Math.round(c.bpm) + ' BPM in ' + Math.max(0, nextIn()).toFixed(1) + ' s' : '');
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    btn.querySelector('.dj-lbl').textContent = !AC ? 'no sound here' : playing ? 'Dad\u2019s DJ on' : 'Dad\u2019s DJ';
    btn.disabled = !AC;
  }
  var beatT = [];
  function beat(t, down) {
    if (RM.matches || !led || !ctx) return;
    var ms = Math.max(0, (t - ctx.currentTime) * 1000);
    beatT.push(setTimeout(function () { led.classList.add(down ? 'on2' : 'on'); setTimeout(function () { led.classList.remove('on', 'on2'); }, 90); }, ms));
    if (beatT.length > 64) beatT.splice(0, 32);
  }
  function soundSwitch() { return document.querySelector('#vol-sound .bs-toggle'); }
  function masterOn() { var b = window.BonnieSound; return !b || b.on; }
  var GROUPS = [['mood', 'Mood (Simmie\u2019s tag)', ['neutral', 'calm', 'warm', 'proud', 'playful', 'excited', 'serious']],
                ['urgency', 'Urgency', ['idle', 'new', 'urgent']],
                ['sky', 'Sky', ['live', 'sun', 'hot', 'cloud', 'rain', 'fog', 'storm']],
                ['time', 'Time', ['live', 'day', 'evening', 'night', 'deep']]];
  function buildChips() {
    GROUPS.forEach(function (gp) {
      var fs = document.createElement('fieldset'), lg = document.createElement('legend'); fs.className = 'dj-grp'; lg.textContent = gp[1]; fs.appendChild(lg);
      gp[2].forEach(function (v) {
        var l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span');
        i.type = 'radio'; i.name = 'dj-' + gp[0]; i.value = v; i.checked = demo[gp[0]] === v; s.textContent = v === 'deep' ? 'deep night' : v;
        i.addEventListener('change', function () { if (!i.checked) return; demo[gp[0]] = v; var c = compute(); if (!playing) cur = c; paint(c); });
        l.appendChild(i); l.appendChild(s); fs.appendChild(l);
      });
      chips.appendChild(fs);
    });
  }
  function boot() {
    btn = $('dj-play'); vol = $('dj-vol'); read = $('dj-read'); readP = $('dj-pumps'); chips = $('dj-chips'); led = btn && btn.querySelector('.dj-led');
    if (!btn || !read) return;
    vol.value = Math.round(sliderVol() * 100);
    vol.addEventListener('input', function () { store(K_VOL, vol.value); if (master) master.gain.setTargetAtTime(sliderVol(), ctx.currentTime, 0.03); });
    btn.addEventListener('click', function () {
      if (playing) { stop(); return; }
      if (!masterOn()) { var sw = soundSwitch(); if (sw) sw.click(); }        // the page's sound switch is the master: Dad's DJ turns it on
      start();
    });
    // the sound switch off = everything off (mute respected)
    var slot = $('vol-sound');
    if (slot) new MutationObserver(function () { if (playing && !masterOn()) stop(); }).observe(slot, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
    document.addEventListener('visibilitychange', function () { if (!ctx) return; try { if (document.hidden) ctx.suspend(); else if (playing) ctx.resume(); } catch (e) {} });
    document.addEventListener('simwx', function () { if (!playing) { cur = compute(); paint(cur); } });
    buildChips(); cur = compute(); paint(cur); schedule(cur.fade);
    setInterval(function () { if (!document.hidden) paint(compute()); }, 1000);
  }
  window.DadAutoDJ = { compute: compute, pumps: pumps, GEN: Object.keys(GEN), set: function (k, v) { demo[k] = v; paint(compute()); },
    get playing() { return playing; }, get now() { return cur; }, get tracks() { return tracks.length; },
    level: function () { if (!meter) return 0; var a = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(a); var q = 0; for (var i = 0; i < a.length; i++) q += a[i] * a[i]; return Math.sqrt(q / a.length); },
    get graph() { return ctx ? { state: ctx.state, tracks: tracks.length, busGain: bus.gain.value, master: master.gain.value } : null; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
