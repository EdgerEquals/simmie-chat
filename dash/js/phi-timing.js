/* GENERATED copy of rebella moderation/js/phi-timing.js (tools/sync_dash_header.py): shared header/footer, chat-page scope. */
/* PHI TIMING (shared module; same file on every Bonnie site/preview).
   Standing rules: /home/box/.config/phi-timing-rules.md (Danny, 2026-10-23), moved onto Rule phi build B (Danny, 26 Oct 2026):
   1. Every timed interval is B x PHI^k seconds with k a WHOLE number. B is the anchor from js/phi-b.js (no typed term:
      the weather feed's update period and the sky clocks, moved by the Moon, the temperature's own daily range and
      Bonnie's measured rhythm). Fast elements make small moves, slow ones big moves.
   2. Start offsets: element number i (fixed order below) starts at period x frac(i / PHI), the golden angle.
      CSS uses a negative animation-delay (var(--phi-NAME-d)) so nothing waits blank on load.
   3. Bonnie's ladder (old PHI^n s -> rung k = n - 5, B is about PHI^5 s): blinks B x PHI^-3, weather faces PHI^-3..-1,
      facts PHI^-1, loop effect / animals B, offering story PHI^1, sticker sway PHI^2, slow drift PHI^3.
   4. Simmie's palette was 1.5 steps faster; whole steps only, so it is now ONE step faster (half steps round toward
      slower, the safe side). Golden-angle offsets still keep the two from starting together.
   5. Pulse floor: every blink / glow / breathe / ring / beacon / twinkle / bob / light (flag p) is never faster than
      B x PHI^-2, after the weather sweep. Walking gaits and typing pace are movement, not pulses, and are exempt.
   6. Weather sweep in whole steps: hot -1, sun 0, storm 0, cloud 0, rain +1, fog +1, clear night +2, deep night +2
      (deep night = the sun below civil twilight, from js/season-pumps.js; no clock hours). The weather loop (flag w)
      never sweeps. A new sweep lands at each element's next cycle boundary; reduced motion ignores it. No weather: 0.
      Preview override: ?weather=hot|sun|storm|cloud|rain|fog|night|deep.
   7. Message-status layer (own pump): urgent B x PHI^-2, unread from Dad PHI^-1, new B, idle PHI^1 (the pulse floor
      is the fastest). Only where messages exist; never reads or shows message text. Preview: ?msg=idle|new|dad|urgent.
   8. Pause motion (js/phi-pause.js, html.phi-paused): every() timers skip their ticks while paused.
   Functional timers (network polls, debounces, passcode back-off) are not animations and stay as they were. */
(function(root){
  "use strict";
  var PHI = (1 + Math.sqrt(5)) / 2, G = 1 / PHI, SEC = 1000;                     // phi: the golden ratio; unit: ms per second
  var PULSE_FLOOR = -2;                                                           // phi: Danny's pulse floor, B x PHI^-2
  // B from js/phi-b.js (seconds). unit: with no anchor measured at all (sky clocks unavailable) a rung is PHI^k SI seconds.
  function anchor(){ var b = root.PhiB && root.PhiB.value; return b > 0 ? b : 1; }
  // [name, whole rung k of B, flags: s Simmie palette, w weather loop (never swept), p pulse (floor)]  ORDER IS THE NUMBERING: append, never reorder.
  var E = [
    ["light-queue",-4,"sp"],["light-fresh",-4,"sp"],["light-link",-4,"sp"],["light-sky",-4,"sp"],["cursor",-4,"sp"],["face-a",-3,"w"],   // phi: whole rungs of B
    ["face-b",-2,"w"],["face-c",-1,"w"],["askdad-glow",-3,"sp"],["askdad-orbit",-2,"s"],["fact",-1],["loop-effect",0,"w"],   // phi: whole rungs of B
    ["mlog-ambient",-1,"s"],["animals",0],["space",0,"s"],["story",1,"w"],["sway",2,"w"],["cloud-orbit",2,"s"],   // phi: whole rungs of B
    ["bg-drift",2,"s"],["cloud-breathe",-4,"sp"],["cloud-blink",-2,"sp"],["cloud-shine",-1,"sp"],["cloud-bob",-6,"sp"],["wave",-2,"sp"],   // phi: whole rungs of B
    ["wave-busy",-5,"sp"],["marquee",3,"w"],["chip-drift",2,"w"],["panel-dot",-4,"sp"],["gait-trot",-7],["gait-hop",-6],   // phi: whole rungs of B
    ["gait-dog",-3],["gait-fly",-5],["gait-glow",-5],["animal-cross",-1],["space-cross",-1,"s"],["space-ring",-3,"sp"],   // phi: whole rungs of B
    ["space-ring-slow",-2,"sp"],["space-spark",-4,"sp"],["tty-hold",-2,"s"],["tty-hold-multi",-3,"s"],["tty-gap",-5,"s"],["mlog-pace",-4,"s"],   // phi: whole rungs of B
    ["band-sway",2,"w"],["askdad-breathe",-1,"sp"],["offer-cycle",-3,"w"],["cloud-wobble",-2,"s"],["beacon",-4,"sp"],["beacon-chk",-5,"sp"],   // phi: whole rungs of B
    ["beacon-down",-6,"sp"],["bg-fall",1],["bg-float",0],["bg-sail",2],["bg-twinkle",-3,"p"],["bg-cross",1],   // phi: whole rungs of B
    ["bg-spin",3],["bg-bob",-3,"p"],["bg-pulse",0,"p"],["rain",0],["code-panel",3,"s"],["askdad-remind",0,"wp"]   // phi: whole rungs of B
  ];
  var doc = (typeof document !== "undefined") ? document : null, rootStyle = doc && doc.documentElement.style;
  var T = {}, list = [];
  E.forEach(function(e, i){
    var fl = e[2] || "", f = ((i + 1) * G) % 1;
    T[e[0]] = {k:i + 1, n:e[1], simmie:fl.indexOf("s") >= 0, weather:fl.indexOf("w") >= 0, pulse:fl.indexOf("p") >= 0, base:anchor() * Math.pow(PHI, e[1]), frac:f};
    list.push(e[0]);
  });
  var SWEEP = {hot:-1, sun:0, storm:0, cloud:0, rain:1, fog:1, night:2, deep:2};   // phi: whole steps
  var MSG = {idle:1, "new":0, dad:-1, urgent:-2};                                   // phi: whole rungs of B
  var sw = 0, msgState = null, msgForced = null, wxForced = null;
  var RM = (typeof window !== "undefined" && window.matchMedia) ? window.matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  try{ var q = new URLSearchParams(location.search); wxForced = q.get("weather"); if(!(wxForced in SWEEP)) wxForced = null;
    msgForced = q.get("msg"); if(!(msgForced in MSG)) msgForced = null; }catch(e){}
  function g(name){ var t = T[name]; if(!t) throw new Error("phi-timing: unknown element " + name); return t; }
  function shift(t){ return (t.weather || RM.matches) ? 0 : sw; }
  function rungOf(t){ var k = t.n + shift(t); return t.pulse ? Math.max(k, PULSE_FLOOR) : k; }
  function per(name){ return anchor() * Math.pow(PHI, rungOf(g(name))); }
  // deep night: the sun's centre below civil twilight (js/season-pumps.js rest share reaches 1); no clock hours
  function deepNight(){ try{ var SP = root.SeasonPumps; return !!SP && SP.restShare(SP.sunHeight(new Date())) >= 1; }catch(e){ return false; } }
  function paused(){ return !!(doc && doc.documentElement.classList.contains("phi-paused")); }
  var weatherKey = null;   // last weather mood the page reported (null = no weather state on this page)
  function sweepFor(key){ if(wxForced) return SWEEP[wxForced];   // ?weather= preview wins exactly (use ?weather=deep for deep night)
    if(key == null) return 0; if(deepNight()) key = "deep"; return SWEEP[key] || 0; }
  var api = {
    PHI:PHI, list:list, SWEEP:SWEEP, MSG:MSG,
    B:anchor, s:per, ms:function(n){ return Math.round(per(n) * SEC); },
    base:function(n){ return g(n).base; },
    off:function(n){ return per(n) * g(n).frac; }, offMs:function(n){ return Math.round(api.off(n) * SEC); },
    info:function(n){ var t = g(n); return {k:t.k, n:t.n, rung:rungOf(t), simmie:t.simmie, weather:t.weather, pulse:t.pulse, base:t.base, s:per(n), off:api.off(n), shift:shift(t)}; },
    sweep:function(){ return RM.matches ? 0 : sw; },
    // repeating timer: first tick at the golden-angle offset, then one per period; re-reads the period every cycle,
    // so a new sweep lands at the next cycle boundary. returns {stop}
    every:function(n, fn){ var h = {t:null, dead:false};
      function tick(){ if(h.dead) return; if(!paused()) fn(); h.t = setTimeout(tick, api.ms(n)); }
      h.t = setTimeout(tick, api.offMs(n)); h.stop = function(){ h.dead = true; clearTimeout(h.t); }; return h; },
    // the page tells the module its weather mood (sun|hot|cloud|fog|rain|storm|night) or null when it has none
    setWeather:function(key){ weatherKey = key || null; setSweep(sweepFor(weatherKey)); },
    weatherOverride:function(){ return wxForced; },
    // message-status layer (rule 7): idle|new|dad|urgent; ?msg= wins
    setMsg:function(state){ setMsg(state); }, msg:function(){ return msgState; },
    // for JS-managed animations (mark the element data-phi-js): change the period at a cycle boundary without a jump
    retime:function(a, ms){ retime(a, ms); }
  };
  root.PhiTiming = api;

  // ---------- CSS side ----------
  function writeVars(){ list.forEach(function(n){ var t = T[n]; rootStyle.setProperty("--phi-" + n, per(n) + "s"); rootStyle.setProperty("--phi-" + n + "-d", (-api.off(n)) + "s"); }); }
  // which keyframes belong to the weather loop (never swept) or the message layer (own pump)
  var FIXED = /^(wx-drift|wx-sway|wx-fadein|wx-blip|bw-|msg-pulse)/;
  function sweepable(a){ return a && a.animationName && !FIXED.test(a.animationName) && a.effect && a.effect.getTiming().iterations === Infinity &&
    !(a.effect.target && a.effect.target.closest && a.effect.target.closest(".wx-mq-track,.wx-seq,.wx-icon,#wx-mq-track,.bw-sticker,[data-phi-js]")); }
  // retime a running CSS animation at an iteration boundary without a visible jump
  function retime(a, D){ var t = a.effect.getTiming(), ct = a.currentTime; if(ct == null || !t.duration) return;
    var it = Math.round((ct - t.delay) / t.duration); a.effect.updateTiming({duration:D, delay:t.delay}); a.currentTime = t.delay + it * D; }
  function setSweep(next){
    if(RM.matches) next = 0;
    if(next === sw) return; var f = Math.pow(PHI, next - sw);
    if(doc && doc.getAnimations){ doc.getAnimations().forEach(function(a){ if(!sweepable(a)) return;
      var t = a.effect.getTiming(); if(a._phiD == null){ a.effect.updateTiming({duration:t.duration, delay:t.delay}); a._phiD = t.duration; }   // pin to its current period
      a._phiNext = (a._phiNext || a._phiD) * f; }); }
    sw = next; if(rootStyle) writeVars();   // new elements start on the new periods
    if(doc) doc.documentElement.setAttribute("data-phi-sweep", String(sw));
  }
  if(doc){
    writeVars();
    doc.addEventListener("animationiteration", function(ev){
      var el = ev.target; if(!el.getAnimations) return;
      el.getAnimations().forEach(function(a){
        if(a.animationName !== ev.animationName) return;
        if(a._phiNext != null){ retime(a, a._phiNext); a._phiD = a._phiNext; a._phiNext = null; }
        if(a.animationName === "msg-pulse" && a._msgNext != null){ retime(a, a._msgNext); a._msgNext = null; }
      });
    }, true);
    // deep night starts/ends on the Perth clock (functional check once a minute, not an animation)
    setInterval(function(){ if(weatherKey || wxForced) setSweep(sweepFor(weatherKey)); }, anchor() * Math.pow(PHI, MSG.idle + MSG.idle + MSG.idle) * SEC);   // phi: re-check the sky every B x PHI^3
    if(wxForced) setTimeout(function(){ setSweep(sweepFor(null)); }, 0);
    if(RM.addEventListener) RM.addEventListener("change", function(){ setSweep(sweepFor(weatherKey)); });
  }
  // ---------- message-status layer ----------
  function msgPer(st){ return anchor() * Math.pow(PHI, Math.max(MSG[st], PULSE_FLOOR)); }
  function setMsg(state){
    if(msgForced) state = msgForced; if(!(state in MSG)) state = "idle";
    if(state === msgState || !doc) return; msgState = state; var D = msgPer(state) * SEC;
    rootStyle.setProperty("--phi-msg", (D / SEC) + "s");
    doc.documentElement.setAttribute("data-msg", state);
    if(doc.getAnimations) doc.getAnimations().forEach(function(a){ if(a.animationName === "msg-pulse"){
      var t = a.effect.getTiming(); if(!a._msgPinned){ a.effect.updateTiming({duration:t.duration, delay:t.delay}); a._msgPinned = true; } a._msgNext = D; } });
  }
  if(typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : this);
