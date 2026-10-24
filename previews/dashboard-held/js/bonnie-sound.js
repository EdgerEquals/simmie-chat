/* Bonnie's sounds: a generated sound layer (Web Audio, synthesised in the browser: no audio files, no fetches).
   Fully separate from the YouTube player (bonnie-music.js): its own gain node and on/off switch, it never calls the
   player. It only watches <html data-bm="..."> and ducks itself to 30% while the YouTube player is playing.
   Cues: the press model / meters, the message-status glow, Ask Dad open/close, plus a soft ambient bed; and simmie
   (FM chime), send-whoosh, biplane-buzz, passcode-tick + unlock + nope, dial-click, approve / reject.
   Timing follows /home/box/.config/phi-timing-rules.md: every repeat is PHI^n s (swept by the weather when the page has
   PhiTiming), first ticks at golden-angle offsets, Simmie-palette sounds 1.5 steps faster (x PHI^-1.5).
   Nothing sounds until the first tap or key press (autoplay rules). Choices are saved in localStorage (preview keys).
   Hook: <link rel="stylesheet" href=".../bonnie-sound.css"> + <script src=".../bonnie-sound.js" data-page="chat|dash|quiz"></script>
   data-default="off" (questionnaire): off until the first tap on the switch, remembered under its own key.
   data-slot="#id": put the switch row inside that element. Test hook: every played cue dispatches
   'bonnie-sound:cue' on document with {kind} only (never any typed text). */
(function () {
  'use strict';
  var PHI = 1.6180339887, G = 0.6180339887, SIMMIE = -1.5;
  var me = document.currentScript || document.querySelector('script[src*="bonnie-sound.js"]');
  var PAGE = (me && me.getAttribute('data-page')) || 'chat';
  var DEF_OFF = !!(me && me.getAttribute('data-default') === 'off'), SLOT = me && me.getAttribute('data-slot');
  var K_ON = 'preview.bonnieSound.on' + (DEF_OFF ? '.' + PAGE : ''), K_FLAV = 'preview.bonnieSound.flavour';
  function store(k, v) { try { if (v != null) localStorage.setItem(k, v); return localStorage.getItem(k); } catch (e) { return null; } }
  function sweep() { try { var T = window.PhiTiming; var s = T && T.sweep ? +T.sweep() : 0; return isFinite(s) ? s : 0; } catch (e) { return 0; } }
  function per(n, simmie) { return Math.pow(PHI, n + (simmie ? SIMMIE : 0) + sweep()); }      // seconds
  function frac(k) { return (k * G) % 1; }
  // repeating timer on PHI^n; re-reads the sweep every cycle; first tick at the golden-angle offset of element k
  function every(n, simmie, k, fn) {
    var t = setTimeout(function tick() { try { fn(); } catch (e) {} t = setTimeout(tick, per(n, simmie) * 1000); }, per(n, simmie) * frac(k) * 1000);
    return function () { clearTimeout(t); };
  }

  // ---------- flavours: waveform, scale, filter, envelope, bed ----------
  var FLAV = {
    lofi:    { label: 'Lo-fi',    wave: 'triangle', root: 220.0, scale: [0, 3, 5, 7, 10],        filt: ['lowpass', 1400, 0.7],  env: [0.012, 0.28, 0.40], bed: 'pad',   bedWave: 'triangle', bedCut: 620,  crackle: true },
    chip:    { label: 'Chiptune', wave: 'square',   root: 440.0, scale: [0, 2, 4, 7, 9],         filt: ['lowpass', 4800, 1.0],  env: [0.002, 0.09, 0.07], bed: 'pulse', bedWave: 'square',   bedCut: 900 },
    ambient: { label: 'Ambient',  wave: 'sine',     root: 261.6, scale: [0, 2, 4, 6, 7, 9, 11],  filt: ['lowpass', 2200, 0.5],  env: [0.090, 0.70, 1.30], bed: 'pad',   bedWave: 'sine',     bedCut: 1100 },
    pop:     { label: 'Pop',      wave: 'sawtooth', root: 329.6, scale: [0, 2, 4, 5, 7, 9, 11],  filt: ['lowpass', 2600, 2.0],  env: [0.006, 0.18, 0.22], bed: 'pad',   bedWave: 'sawtooth', bedCut: 700 },
    nature:  { label: 'Nature',   wave: 'sine',     root: 523.3, scale: [0, 2, 4, 7, 9],         filt: ['bandpass', 1800, 1.4], env: [0.006, 0.12, 0.26], bed: 'wind',  chirp: true }
  };
  var ORDER = ['lofi', 'chip', 'ambient', 'pop', 'nature'];
  var flavour = FLAV[store(K_FLAV)] ? store(K_FLAV) : 'lofi';
  var NO_TOG = !!(me && me.getAttribute('data-toggle') === 'none');   // chat preview (Danny 01:55): no on/off pill on the page
  var on = NO_TOG ? true : DEF_OFF ? store(K_ON) === '1' : store(K_ON) !== '0';   // chat/dash: default on, silent until the first tap; quiz: off until the switch
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, duck = null, cueBus = null, bedBus = null, bed = null, stops = [], lastCue = 0;

  // ---------- UI: on/off switch + flavour radios (native inputs, fieldset + legend) ----------
  var row = document.createElement('div');
  row.id = 'bs-row'; row.className = 'bs-row bs-' + PAGE;
  row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Sounds');
  var tog = document.createElement('button');
  tog.type = 'button'; tog.className = 'bs-toggle';
  var fs = document.createElement('fieldset'); fs.className = 'bs-flav';
  var lg = document.createElement('legend'); lg.textContent = 'Sound flavour'; fs.appendChild(lg);
  ORDER.forEach(function (id) {
    var l = document.createElement('label'), i = document.createElement('input'), s = document.createElement('span');
    i.type = 'radio'; i.name = 'bs-flavour-' + PAGE; i.value = id; i.checked = id === flavour;
    s.textContent = FLAV[id].label; l.appendChild(i); l.appendChild(s); fs.appendChild(l);
    i.addEventListener('change', function () { if (!i.checked) return; flavour = id; store(K_FLAV, id); rebuildBed(); cue('dial-click', 0.55); });
  });
  if (!NO_TOG) row.appendChild(tog);   // without the pill a saved 'off' is ignored (no way to turn it back on); still silent until her first tap / key
  row.appendChild(fs);
  function paintToggle() {
    var avail = !!AC;
    tog.disabled = !avail;
    tog.setAttribute('aria-pressed', on && avail ? 'true' : 'false');
    tog.textContent = !avail ? '\uD83D\uDD07 no sound here' : on ? '\uD83D\uDD08 sounds on' : '\uD83D\uDD07 sounds off';
    tog.title = !avail ? 'This browser has no Web Audio' : on ? 'Turn the generated sounds off' : 'Turn the generated sounds on';
  }
  tog.addEventListener('click', function () {
    on = !on; store(K_ON, on ? '1' : '0'); paintToggle();
    if (on) { ensure(); if (ctx) { ctx.resume && ctx.resume(); master.gain.setTargetAtTime(1, ctx.currentTime, 0.05); startBed(); cue('press', 0.5); } }
    else if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); stopBed(); }
  });

  // ---------- audio graph ----------
  function ensure() {
    if (ctx || !AC || !on) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1;             // this layer's own on/off gain
      duck = ctx.createGain(); duck.gain.value = playing() ? 0.3 : 1; // ducks under the YouTube player
      var comp = ctx.createDynamicsCompressor();
      cueBus = ctx.createGain(); cueBus.gain.value = 0.5;
      bedBus = ctx.createGain(); bedBus.gain.value = 0.5;
      cueBus.connect(master); bedBus.connect(master); master.connect(duck); duck.connect(comp); comp.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function noiseBuf(sec) {
    var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b;
  }
  function freq(step) { var F = FLAV[flavour], L = F.scale.length, o = Math.floor(step / L), i = ((step % L) + L) % L; return F.root * Math.pow(2, (F.scale[i] + 12 * o) / 12); }
  function note(step, vel, when, opt) {
    if (!ctx || !on || ctx.state === 'closed') return;
    opt = opt || {};
    var F = FLAV[flavour], t = ctx.currentTime + (when || 0), a = F.env[0], d = F.env[1], r = F.env[2];
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = F.wave; o.frequency.setValueAtTime(freq(step), t);
    if (F.chirp || opt.chirp) o.frequency.exponentialRampToValueAtTime(freq(step) * 1.5, t + a + d);
    f.type = F.filt[0]; f.frequency.value = F.filt[1]; f.Q.value = F.filt[2];
    var peak = Math.max(0.0002, (vel || 0.4) * (F.wave === 'square' || F.wave === 'sawtooth' ? 0.10 : 0.22));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r);
    o.connect(f); f.connect(g); g.connect(cueBus);
    o.start(t); o.stop(t + a + d + r + 0.05);
  }
  function trace(kind) { try { document.dispatchEvent(new CustomEvent('bonnie-sound:cue', { detail: { kind: kind } })); } catch (e) {} }
  var gest = false;                                   // nothing sounds (or is even built) before her first tap / key press
  function cue(kind, level) {
    if (!gest || !ensure() || !on) return;
    var now = performance.now();
    if (kind === 'press' && now - lastCue < per(-3) * 1000) return;    // PHI^-3 s between press cues
    var gap = GAP[kind]; if (gap != null && lastBy[kind] && now - lastBy[kind] < Math.pow(PHI, gap[0] + (gap[1] ? SIMMIE : 0)) * 1000) return;   // per-cue rate limit (fixed, not swept)
    lastBy[kind] = now; lastCue = now; trace(kind);
    if (NEW[kind]) { NEW[kind](Math.max(0, Math.min(1, level == null ? 0.5 : level))); return; }
    var lv = Math.max(0, Math.min(1.25, level || 0.4)), L = FLAV[flavour].scale.length, sp = per(-4, kind === 'askdad');
    if (kind === 'press') note(Math.round(lv * (L * 2 - 1)), 0.25 + 0.5 * Math.min(1, lv));
    else if (kind === 'peak') { note(L * 2, 0.5); note(L * 2 + 2, 0.35, sp); }
    else if (kind === 'idle') note(0, 0.25);
    else if (kind === 'new') { note(L, 0.4); note(L + 2, 0.4, sp); }
    else if (kind === 'dad') { note(L - 3, 0.45); note(L, 0.45, sp); note(L + 2, 0.45, sp * 2); }
    else if (kind === 'urgent') { note(L + 4, 0.45); note(L + 2, 0.45, sp); note(L + 4, 0.45, sp * 2); }
    else if (kind === 'askdad') { note(L, 0.4); note(L + 2, 0.4, sp); note(L + 4, 0.45, sp * 2); }   // Simmie palette: faster spacing
    else if (kind === 'askdad-close') { note(L + 2, 0.35); note(L - 1, 0.3, sp); }
    else if (kind === 'sparkle') note(L * 2 + Math.floor(Math.random() * L), 0.12, 0, { chirp: flavour === 'nature' });
  }

  // ---------- the newer cues (all synthesised, quiet, short) ----------
  // per-cue minimum gap: [phi exponent, simmie palette]
  var lastBy = {}, GAP = { simmie: [1, true], 'send-whoosh': [-1, false], 'biplane-buzz': [2, false], 'passcode-tick': [-5, false],
    unlock: [1, false], nope: [0, false], 'dial-click': [-4.5, false], approve: [-1.5, false], reject: [-1.5, false],
    dad: [-1, false], new: [-1, false], askdad: [-2, true], 'askdad-close': [-2, true], urgent: [0, false], peak: [-2.5, false] };
  function semi(n) { return FLAV[flavour].root * Math.pow(2, n / 12); }
  function inScale(n) { return FLAV[flavour].scale.indexOf(((n % 12) + 12) % 12) >= 0; }
  function env(g, t, peak, a, len) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + len); }
  // soft FM bell (sine carrier, sine modulator at 2x with a decaying index)
  function bell(hz, vel, when, len) {
    var t = ctx.currentTime + (when || 0), c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.type = 'sine'; m.type = 'sine'; c.frequency.value = hz; m.frequency.value = hz * 2;
    mg.gain.setValueAtTime(hz * 1.2, t); mg.gain.exponentialRampToValueAtTime(hz * 0.05, t + len);
    m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(cueBus); env(g, t, 0.16 * vel, 0.006, len);
    c.start(t); m.start(t); c.stop(t + len + 0.05); m.stop(t + len + 0.05);
  }
  // a plain soft tone (sine or triangle) for the passcode / decision notes
  function tone(hz, vel, when, len, type, glide) {
    var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type || 'sine'; o.frequency.setValueAtTime(hz, t); if (glide) o.frequency.exponentialRampToValueAtTime(hz * glide, t + len);
    f.type = 'lowpass'; f.frequency.value = 2400; f.Q.value = 0.5;
    o.connect(f); f.connect(g); g.connect(cueBus); env(g, t, 0.18 * vel, 0.01, len); o.start(t); o.stop(t + len + 0.05);
  }
  function noise(sec, when, filt, f0, f1, q, peak, a) {
    var t = ctx.currentTime + (when || 0), src = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf(sec + 0.02); bf.type = filt; bf.frequency.setValueAtTime(f0, t); if (f1) bf.frequency.exponentialRampToValueAtTime(f1, t + sec); bf.Q.value = q;
    src.connect(bf); bf.connect(g); g.connect(cueBus); env(g, t, peak, a, Math.max(0.001, sec - a)); src.start(t); src.stop(t + sec + 0.02);
  }
  var NEW = {
    // Simmie chime: two soft FM bells rising a major sixth (a fifth when the scale has no sixth), Simmie-palette spacing
    simmie: function (v) { var up = inScale(9) ? 9 : 7, sp = per(-3, true); bell(semi(12), 0.5 + 0.4 * v, 0, 0.5); bell(semi(12 + up), 0.45 + 0.4 * v, sp, 0.7); },
    // send whoosh: white noise through a bandpass sweeping 400 Hz -> 4 kHz over PHI^-1.8 s (0.42 s)
    'send-whoosh': function (v) { noise(per(-1.8), 0, 'bandpass', 400, 4000, 1.1, 0.10 + 0.08 * v, per(-1.8) * 0.45); },
    // biplane buzz: 110 Hz sawtooth, 18 Hz tremolo, lowpassed, pitch bends down (doppler-ish) and fades as it flies away, ~1.6 s
    'biplane-buzz': function (v) {
      var t = ctx.currentTime, L = per(1), o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), trem = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(118, t); o.frequency.linearRampToValueAtTime(112, t + L * 0.35); o.frequency.exponentialRampToValueAtTime(96, t + L);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(420, t + L); lp.Q.value = 0.8;
      lfo.frequency.value = 18; lg.gain.value = 0.45; trem.gain.value = 0.55; lfo.connect(lg); lg.connect(trem.gain);
      o.connect(lp); lp.connect(trem); trem.connect(g); g.connect(cueBus);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 + 0.03 * v, t + 0.12); g.gain.setTargetAtTime(0.0001, t + L * 0.3, L * 0.22);
      o.start(t); lfo.start(t); o.stop(t + L + 0.1); lfo.stop(t + L + 0.1);
    },
    // passcode tick: a 2 ms noise burst through a 3.5 kHz highpass; identical for every key (the key is never read)
    'passcode-tick': function () { noise(0.002, 0, 'highpass', 3500, 0, 0.7, 0.16, 0.0004); },
    unlock: function () { var sp = per(-3); tone(semi(12), 0.6, 0, 0.35); tone(semi(19), 0.6, sp, 0.5); },
    nope: function () { tone(semi(-12), 0.7, 0, 0.32, 'triangle', 0.94); },
    // dial click: a tiny bandpassed click plus a short resonant tick (a mechanical detent)
    'dial-click': function (v) { noise(0.004, 0, 'bandpass', 2600, 0, 3.5, 0.12 + 0.08 * v, 0.0005); tone(1700 + 300 * v, 0.35, 0.002, 0.03, 'sine'); },
    // approve: bright rising root -> fifth; reject: soft falling minor third (in scale), never harsh
    approve: function () { var sp = per(-2.5); tone(semi(12), 0.7, 0, 0.28, 'triangle'); tone(semi(19), 0.7, sp, 0.42, 'triangle'); },
    reject: function () { var sp = per(-2), hi = inScale(3) ? 3 : 7; tone(semi(hi), 0.45, 0, 0.3, 'sine'); tone(semi(hi - 3), 0.4, sp, 0.42, 'sine'); }
  };

  // ambient bed: a quiet pad (or wind for Nature) that breathes on PHI^8 s (slow drift slot), swept by the weather
  function startBed() {
    if (!ctx || !on || bed) return;
    var F = FLAV[flavour], out = ctx.createGain(); out.gain.value = 0.0001; out.connect(bedBus);
    var nodes = [], t = ctx.currentTime;
    if (F.bed === 'wind') {
      var src = ctx.createBufferSource(); src.buffer = noiseBuf(4); src.loop = true;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
      src.connect(bp); bp.connect(out); src.start(); nodes.push(src);
    } else {
      [0, 4, 7].forEach(function (st, i) {
        var o = ctx.createOscillator(), lp = ctx.createBiquadFilter();
        o.type = F.bedWave; o.frequency.value = F.root / 2 * Math.pow(2, (F.scale[Math.min(i * 2, F.scale.length - 1)]) / 12);
        o.detune.value = (i - 1) * 6; lp.type = 'lowpass'; lp.frequency.value = F.bedCut;
        o.connect(lp); lp.connect(out); o.start(); nodes.push(o);
      });
      if (F.crackle) {
        var cr = ctx.createBufferSource(); cr.buffer = noiseBuf(2); cr.loop = true;
        var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
        var cg = ctx.createGain(); cg.gain.value = 0.06; cr.connect(hp); hp.connect(cg); cg.connect(out); cr.start(); nodes.push(cr);
      }
    }
    var level = F.bed === 'wind' ? 0.05 : F.bedWave === 'sine' ? 0.05 : 0.022;
    out.gain.setTargetAtTime(level, t, 1.2);
    bed = { out: out, nodes: nodes, level: level, high: true };
    // breathing: swaps between full and 55% every PHI^7 s (29.03 s, swept), golden offset k = 11
    bed.stop = every(8 - 1, false, 11, function () {
      if (!bed || !ctx) return; bed.high = !bed.high;
      bed.out.gain.setTargetAtTime(bed.level * (bed.high ? 1 : 0.55), ctx.currentTime, per(8) / 6);
    });
  }
  function stopBed() {
    if (!bed) return; var b = bed; bed = null; try { b.stop(); } catch (e) {}
    if (!ctx) return;
    b.out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    setTimeout(function () { b.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); try { b.out.disconnect(); } catch (e) {} }, 1500);
  }
  function rebuildBed() { if (bed) { stopBed(); setTimeout(startBed, 300); } }

  // ---------- inputs ----------
  function firstGesture() {
    gest = true;
    if (!on || ctx) return;
    if (ensure()) { try { ctx.resume && ctx.resume(); } catch (e) {} startBed(); }
  }
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);

  // press model / meters: the chat preview reports levels as 'simmie:meter'; the dashboard gets a light local model
  var meterSeen = 0;
  window.addEventListener('simmie:meter', function (e) {
    meterSeen = performance.now(); if (dialBusy()) return; var lv = +(e && e.detail && e.detail.level) || 0;
    cue(lv > 1 ? 'peak' : 'press', lv);
  });
  // dials and radios: detent clicks instead of the generic press note
  var dialHeld = false, dialKey = 0, DIAL_SEL = '.pl-dial, .bs-flav input, input[type="radio"], .ad-step'   /* .ad-step: age dial -/+ play their own dial-click (js/agedial.js) */;
  function dialBusy() { return dialHeld || performance.now() - dialKey < 200; }
  document.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.pl-dial')) dialHeld = true; }, true);
  ['pointerup', 'pointercancel'].forEach(function (k) { document.addEventListener(k, function () { if (dialHeld) setTimeout(function () { dialHeld = false; }, 120); }, true); });
  document.addEventListener('keydown', function (e) { if (e.target.closest && e.target.closest('.pl-dial')) dialKey = performance.now(); }, true);
  document.addEventListener('change', function (e) { var t = e.target; if (t && t.type === 'radio' && !(t.closest && t.closest('.bs-flav'))) cue('dial-click', 0.5); }, true);
  var dialStep = new WeakMap();
  function watchDials() {
    Array.prototype.forEach.call(document.querySelectorAll('.pl-dial'), function (d) {
      if (d._bs) return; d._bs = true; dialStep.set(d, Math.floor((+d.getAttribute('aria-valuenow') || 0) / 10));
      new MutationObserver(function () {
        var st = Math.floor((+d.getAttribute('aria-valuenow') || 0) / 10); if (st === dialStep.get(d)) return;
        dialStep.set(d, st); cue('dial-click', st / 10);                // one detent per 10 units
      }).observe(d, { attributes: true, attributeFilter: ['aria-valuenow'] });
    });
  }
  var downAt = new WeakMap();
  var PRESS_SEL = PAGE === 'dash' ? '#app button, #ask-dad, #app .btn, .pl-play input, .pl-play [role="slider"]'
    : PAGE === 'quiz' ? 'button:not(.tile):not(.bs-toggle)' : 'button, .ft-chat, #play input';
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest(PRESS_SEL); if (b) downAt.set(b, { t: performance.now(), p: e.pressure }); }, true);
  document.addEventListener('pointerup', function (e) {
    var b = e.target.closest && e.target.closest(PRESS_SEL); var d = b && downAt.get(b); if (!d) return; downAt.delete(b);
    if (b.closest(DIAL_SEL) || b.closest('#passcode')) return;   // dials click; the passcode field ticks
    setTimeout(function () {
      if (performance.now() - meterSeen < 120) return;      // the page's own meter already reported this press
      var held = (performance.now() - d.t) / 1000, x = d.p && d.p !== 0.5 ? d.p : Math.min(1, held / per(1));
      var v = x < 0.15 ? 0.2 : 1 - Math.pow(1 - x, PHI);       // ease-out rise, soft floor (rule 8 shape)
      cue('press', v);
    }, 40);
  }, true);

  // message-status glow: chat dispatches 'simmie:msgpulse'; the dashboard exposes PhiTiming.msg()
  var status = null, remind = null;
  function setStatus(st, silent) {
    if (!st || st === status) return; status = st; if (!silent) cue(st);
    if (remind) { remind(); remind = null; }
    if (st === 'urgent' || st === 'dad') remind = every(7, false, 7, function () { cue(status); });   // soft reminder each PHI^7 s
  }
  window.addEventListener('simmie:msgpulse', function (e) { setStatus(e && e.detail && e.detail.state); });
  if (PAGE === 'dash') every(3, false, 3, function () { try { var T = window.PhiTiming; if (T && T.msg) setStatus(T.msg(), status === null); } catch (e) {} });
  else setStatus(document.documentElement.dataset.msg || window.SimmieMsgStatus, true);

  // passcode field: one identical tick per edit (never reads, logs, stores or varies by the key); unlock / wrong passcode
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'passcode') cue('passcode-tick'); }, true);
  function watchGate() {
    var msg = document.getElementById('gate-msg');
    if (msg && !msg._bs) { msg._bs = true; new MutationObserver(function () { if (/didn.t work/i.test(msg.textContent)) cue('nope'); }).observe(msg, { childList: true, characterData: true, subtree: true }); }
    if (PAGE === 'dash' && !document.body._bsLock) {
      document.body._bsLock = true; var wasLocked = document.body.classList.contains('locked');
      new MutationObserver(function () { var l = document.body.classList.contains('locked'); if (wasLocked && !l) cue('unlock'); wasLocked = l; })
        .observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
  }
  // Approve / Reject decisions
  document.addEventListener('rebella:decision', function (e) {
    var st = String((e && e.detail && e.detail.status) || '');
    if (/^approv/i.test(st)) cue('approve'); else if (/^reject/i.test(st)) cue('reject');
  });
  // send whoosh: Bonnie sends a message or transmits to Dad (any form submit with text, except the passcode gate);
  // capture phase, so it runs before the page clears the box. Only checks the box isn't empty.
  function hasText(f) { return Array.prototype.some.call(f.querySelectorAll('textarea, input[type="text"], input:not([type])'), function (x) { return x.value && x.value.trim(); }); }
  document.addEventListener('submit', function (e) { var f = e.target; if (!f || f.id === 'gate-form' || (f.querySelector && f.querySelector('#passcode'))) return; if (hasText(f)) cue('send-whoosh', 0.6); }, true);
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !t || !t.closest) return;
    if (t.closest('form')) return;                                   // forms are covered by submit
    if (t.closest('.tty, .tty-dock, .sct, [class*="tty"]') && t.value && t.value.trim()) cue('send-whoosh', 0.5);
  }, true);
  // biplane buzz: synced to the dashboard's biplane send animation (the plane element is added to <body> as it takes off)
  // Simmie chime: a new Simmie bubble in the chat list (after the page has drawn its starting messages)
  var bootAt = 0, seenSim = {};
  function onAdded(muts) {
    for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) {
      var n = muts[i].addedNodes[j]; if (n.nodeType !== 1) continue;
      if (n.classList.contains('biplane') || (n.querySelector && n.querySelector(':scope > svg.biplane'))) cue('biplane-buzz', 0.6);
      else if (n.classList.contains('msg') && n.classList.contains('them') && !n.classList.contains('dad')) {
        var id = n.getAttribute('data-id') || n.textContent.slice(0, 40); if (seenSim[id]) continue; seenSim[id] = 1;   // re-renders don't chime again
        if (performance.now() - bootAt > 1500) cue('simmie', 0.5);
      }
    }
  }

  // Ask Dad: watch aria-expanded on its button
  function watchAskDad() {
    var b = document.querySelector('#ask-dad, .ad-key, [aria-controls="dad-panel"], [aria-controls="ad-panel"]');
    if (!b || b._bs) return; b._bs = true;
    new MutationObserver(function () { cue(b.getAttribute('aria-expanded') === 'true' ? 'askdad' : 'askdad-close'); })
      .observe(b, { attributes: true, attributeFilter: ['aria-expanded'] });
  }

  // Simmie sparkle: a tiny high note on the space-set slot (PHI^6 x PHI^-1.5 = 8.72 s), golden offset k = 8
  stops.push(every(6, true, 8, function () { if (ctx && on && bed && !document.hidden) cue('sparkle'); }));

  // duck under YouTube; suspend when hidden
  function playing() { return document.documentElement.getAttribute('data-bm') === 'playing'; }
  new MutationObserver(function () { if (duck && ctx) duck.gain.setTargetAtTime(playing() ? 0.3 : 1, ctx.currentTime, per(-1) / 3); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-bm'] });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return; try { if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); } catch (e) {}
  });

  // ---------- placement: with the footer controls; in the landscape scroll row when that row exists ----------
  function placeRow() {
    var slot = SLOT && document.querySelector(SLOT);
    if (slot) { if (row.parentNode !== slot) slot.appendChild(row); return; }
    if (PAGE === 'chat') {
      var strip = document.getElementById('ls-strip'), ft = document.getElementById('fact-ticker'), scr = document.getElementById('screen-chat');
      if (strip && strip.isConnected) { if (row.parentNode !== strip) { row.classList.add('ls-seg'); strip.appendChild(row); } }
      else if (scr) { row.classList.remove('ls-seg'); if (row.nextSibling !== ft || row.parentNode !== scr) scr.insertBefore(row, ft || null); }
    } else {
      var fr = document.getElementById('ft-row') || document.getElementById('wx-foot');
      if (fr && row.parentNode !== fr) fr.appendChild(row);
    }
  }
  function boot() {
    paintToggle(); placeRow(); watchAskDad();
    var scr = document.getElementById('screen-chat');
    if (scr) new MutationObserver(placeRow).observe(scr, { attributes: true, attributeFilter: ['class'] });
    bootAt = performance.now(); watchGate(); watchDials();
    new MutationObserver(function (m) { watchAskDad(); watchDials(); onAdded(m); }).observe(document.body, { childList: true, subtree: true });
    document.documentElement.classList.add('bs-ready');
    window.BonnieSound = { cue: cue, get flavour() { return flavour; }, get on() { return on; }, get running() { return !!(ctx && ctx.state === 'running'); }, FLAVOURS: ORDER.slice(), CUES: ['press', 'peak', 'idle', 'new', 'dad', 'urgent', 'askdad', 'askdad-close', 'sparkle', 'simmie', 'send-whoosh', 'biplane-buzz', 'passcode-tick', 'unlock', 'nope', 'dial-click', 'approve', 'reject'] };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
