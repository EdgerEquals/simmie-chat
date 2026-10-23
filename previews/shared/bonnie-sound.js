/* Bonnie's sounds: a generated sound layer (Web Audio, synthesised in the browser: no audio files, no fetches).
   Fully separate from the YouTube player (bonnie-music.js): its own gain node and on/off switch, it never calls the
   player. It only watches <html data-bm="..."> and ducks itself to 30% while the YouTube player is playing.
   Cues: the press model / meters, the message-status glow, Ask Dad open/close, plus a soft ambient bed.
   Timing follows /home/box/.config/phi-timing-rules.md: every repeat is PHI^n s (swept by the weather when the page has
   PhiTiming), first ticks at golden-angle offsets, Simmie-palette sounds 1.5 steps faster (x PHI^-1.5).
   Nothing sounds until the first tap or key press (autoplay rules). Choices are saved in localStorage (preview keys).
   Hook: <link rel="stylesheet" href=".../bonnie-sound.css"> + <script src=".../bonnie-sound.js" data-page="chat|dash"></script> */
(function () {
  'use strict';
  var PHI = 1.6180339887, G = 0.6180339887, SIMMIE = -1.5;
  var me = document.currentScript || document.querySelector('script[src*="bonnie-sound.js"]');
  var PAGE = (me && me.getAttribute('data-page')) || 'chat';
  var K_ON = 'preview.bonnieSound.on', K_FLAV = 'preview.bonnieSound.flavour';
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
  var on = store(K_ON) !== '0';                       // default on, but silent until the first tap
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
    i.addEventListener('change', function () { if (!i.checked) return; flavour = id; store(K_FLAV, id); rebuildBed(); cue('press', 0.55); });
  });
  row.appendChild(tog); row.appendChild(fs);
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
  function cue(kind, level) {
    if (!ensure() || !on) return;
    var now = performance.now();
    if (kind === 'press' && now - lastCue < per(-3) * 1000) return;    // PHI^-3 s between press cues
    lastCue = now;
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
    if (!on || ctx) return;
    if (ensure()) { try { ctx.resume && ctx.resume(); } catch (e) {} startBed(); }
  }
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);

  // press model / meters: the chat preview reports levels as 'simmie:meter'; the dashboard gets a light local model
  var meterSeen = 0;
  window.addEventListener('simmie:meter', function (e) {
    meterSeen = performance.now(); var lv = +(e && e.detail && e.detail.level) || 0;
    cue(lv > 1 ? 'peak' : 'press', lv);
  });
  var downAt = new WeakMap();
  var PRESS_SEL = PAGE === 'dash' ? '#app button, #ask-dad, #app .btn, .pl-play input, .pl-play [role="slider"]' : 'button, .ft-chat, #play input';
  document.addEventListener('pointerdown', function (e) { var b = e.target.closest && e.target.closest(PRESS_SEL); if (b) downAt.set(b, { t: performance.now(), p: e.pressure }); }, true);
  document.addEventListener('pointerup', function (e) {
    var b = e.target.closest && e.target.closest(PRESS_SEL); var d = b && downAt.get(b); if (!d) return; downAt.delete(b);
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
    new MutationObserver(watchAskDad).observe(document.body, { childList: true, subtree: true });
    document.documentElement.classList.add('bs-ready');
    window.BonnieSound = { cue: cue, get flavour() { return flavour; }, get on() { return on; }, get running() { return !!(ctx && ctx.state === 'running'); }, FLAVOURS: ORDER.slice() };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
