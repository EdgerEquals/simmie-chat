/* PHI-DIALS: golden-ratio dials + ONE closed feedback loop (Kids Club core standard, /home/box/.config/kids-club/shared.md
   "Core standard: golden-ratio dials, one closed feedback loop", Danny 20:02 AWST 25 Oct 2026; built on his go t816u 20:20).
   The SAME file is rebella js/phi-dials.js and simmie-chat js/phi-dials.js. Loaded at idle by js/ratio-pump.js after js/phi-adapt.js and js/season-pumps.js.

   ONE DIAL SHAPE. A dial is a rung on the phi ladder: rung k has the value PHI^-k (1, .618, .382, .236, .146, .090, .056, .034),
   and the rung after the last one is closed (0). A dial moves one rung at a time, never to an invented value, and only between its
   floor and ceiling, which are rungs set by Danny (SPEC below; only Danny changes them). Every move glides (free-wheel rule 6: an
   exponential glide on golden steps, no snap) and is written to a private on-device move log for rollback.
   ONE RECORD, ONE LOOP. The only store is the existing usage record, localStorage 'phiAdapt.v1' (js/phi-adapt.js): component ids with
   open / tap / linger counts, never typed text, chat, passwords, names, positions, URLs or timestamps. The dials live in its
   extension slot x.dials. That record tunes the dials AND gives the level reading (pace band, depth, help); the next visit checks it.
   A move the loop wants beyond a floor or ceiling is NOT applied: it becomes an on-device proposal for Danny (x.dials.prop).
   OFF-DEVICE GATE: OFF (rule 3). This file makes no network request and sends nothing anywhere.
   NOT HERE: the new session path (excluded by Danny): nothing moves because a session starts; the loop reads a visit when it ends
   (page hidden) and, while visible, at most once per visit on a PHI^8 s check.

   Dial 1  filter  information filter. Live events stay in memory; the share of each component's events passed up into the long-term
                   profile is that component's rung (starts at the dial's rung; one rung up when the kid comes back to it on a later
                   visit, one rung down when a visit passes without it, so it also fades on phi-adapt's own per-visit decay). The dial's
                   own rung sets how much of the profile passes up to the ratio summary (the top PHI^-k share of components), and moves
                   up when the summary predicted the next visit well (hit share >= PHI^-1), down when it didn't (< PHI^-2).
   Dial 2  pace    kid-pace retune range. Speed factor = 1 + v - v(default rung) on the page's existing timing (js/ratio-pump.js
                   RatioPump.setUser), so the steps are phi powers too. The visit's own interaction rate vs her long-term rate
                   (a PHI^-2 moving average kept in the record, a ratio only): >= PHI x -> one rung quicker, <= PHI^-1 x -> one rung
                   gentler. Pages here have no tier list, so only animation speed follows it. Reduced motion: factor 1.
   Dial 3  season  season pump: follows the Season pumps standard in the shared layer (js/season-pumps.js; Danny 21:47 AWST 25 Oct).
                   Sky clocks worked out on the device from the date, the time and the one coarse city point (-32.0, 115.9): sun's
                   height and day length (NOAA), M2/S2 tide clocks and their spring-neap beat, synodic and anomalistic months, the year
                   (Meeus). Asserted, not verified. One shared formula, ratios only, phi the sole scaling factor. Two outputs, both on
                   the page's own background layer only (data-warm on js/ratio-pump.js; Rebella gets a backdrop layer behind its
                   content): warmth (sepia, the year's timescale) and rest calm (softer colour once the sun is down, smoothly through
                   dusk and dawn, the day's timescale). This dial's live rung is each output's peak, then the WCAG safe-side floor
                   steps the tint down by phi if the page's own text/background contrast would drop. PHI^5 s colour transition,
                   clocks re-read every PHI^8 s while visible (reduced motion: on load and on return only). The loop has no usage
                   signal for colour, so this dial rests at its rung until Danny moves it.
   API (read-only for the page; nudge/rollback are for Simmie's checks): window.PhiDials.{RUNGS, SPEC, pos(id), value(id), live(id),
   level(), season(), log(), proposals(), nudge(id, +1|-1), rollback(), gate}. */
(function () {
  "use strict";
  var root = window, doc = document;
  if (root.PhiDials || !root.PhiAdapt) return;
  var PA = root.PhiAdapt, PHI = 1.6180339887, IP = 1 / PHI, CLOSED = 8;   // phi: the golden ratio; anchor: Danny's ladder, 8 rungs then closed (t816u)
  var RUNGS = []; for (var k = 0; k < CLOSED; k++) RUNGS.push(val(k)); RUNGS.push(0);
  function val(r) { return r >= CLOSED ? 0 : Math.pow(IP, r); }
  // Danny's floor and ceiling per dial, as rungs (ceiling = the highest value allowed = the smaller rung index). Only Danny changes these.
  var SPEC = {
    filter: { def: 2, ceil: 1, floor: 4 },        // anchor: Danny's rungs. 0.382 ; up to 0.618, down to 0.146
    pace:   { def: 2, ceil: 1, floor: 3 },        // anchor: Danny's rungs. factor 1 ; up to 1.236 (quicker), down to 0.854 (gentler)
    season: { def: 4, ceil: 2, floor: CLOSED }    // anchor: Danny's rungs. 0.146 ; up to 0.382, down to closed
  };
  var MS = 1e3;                                    // unit: milliseconds per second (SI)
  var LOGMAX = 89, PROPMAX = 13;                    // phi: Fibonacci sizes for the private ring buffers
  var RM = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var SCRIPT = doc.querySelector("script[src*='ratio-pump.js']");
  var X = PA.ext("dials") || {};
  X.v = 1; X.pos = X.pos || {}; X.f = X.f || {}; X.log = X.log || []; X.prop = X.prop || []; X.seq = X.seq | 0; X.sum = X.sum || []; X.lvl = X.lvl || {};
  Object.keys(SPEC).forEach(function (id) { var s = SPEC[id], p = X.pos[id]; X.pos[id] = (p >= s.ceil && p <= s.floor) ? p : s.def; });
  function persist(now) { PA.ext("dials", X); if (now && PA.save) PA.save(); }
  persist();

  // ---------- moves: one rung, inside floor/ceiling, logged; outside -> proposal ----------
  function bounds(id) { return SPEC[id.split(":")[0]]; }
  function cur(id) { if (id.indexOf("filter:") === 0) { var c = X.f[id.slice("filter:".length)]; return c != null ? c : X.pos.filter; } return X.pos[id]; }
  function setPos(id, r) { if (id.indexOf("filter:") === 0) X.f[id.slice("filter:".length)] = r; else X.pos[id] = r; }
  function propose(id, dir, why) {
    var p = X.prop.filter(function (q) { return q.d === id && q.dir === dir; })[0];
    if (p) { p.c = (p.c | 0) + 1; p.s = PA.sessions(); } else X.prop.push({ d: id, dir: dir, w: why, c: 1, s: PA.sessions() });
    X.prop = X.prop.slice(-PROPMAX); persist(); return false;
  }
  function move(id, dir, why) {          // dir +1 = one rung up (more / quicker / warmer), -1 = one rung down
    var b = bounds(id); if (!b || (dir !== 1 && dir !== -1)) return false;
    var from = cur(id), to = from - dir;
    if (to < b.ceil || to > b.floor) return propose(id, dir, why);
    setPos(id, to); X.seq++;
    X.log.push({ n: X.seq, s: PA.sessions(), d: id, f: from, t: to, w: why }); X.log = X.log.slice(-LOGMAX);
    persist(true); glide(id.split(":")[0]); return true;
  }
  function rollback() {                 // undo the newest move (logged too, so it can be redone by hand)
    var m = X.log[X.log.length - 1]; if (!m || m.w === "rollback") return false;
    setPos(m.d, m.f); X.seq++; X.log.push({ n: X.seq, s: PA.sessions(), d: m.d, f: m.t, t: m.f, w: "rollback" });
    X.log = X.log.slice(-LOGMAX); persist(true); glide(m.d.split(":")[0]); return true;
  }

  // ---------- free-wheel glide (rule 6): exponential approach on golden steps, no snaps ----------
  var shown = {}, gT = {};
  function apply(id) {
    if (id === "pace" && root.RatioPump && RatioPump.setUser) RatioPump.setUser(RM.matches ? 1 : 1 + shown.pace - val(SPEC.pace.def));
    if (id === "season") paintSeason();
  }
  function glide(id) {
    if (!(id in SPEC)) return;
    var target = val(X.pos[id]); if (shown[id] == null) shown[id] = target;
    clearTimeout(gT[id]);
    (function step() {
      var dlt = target - shown[id];
      if (Math.abs(dlt) < val(CLOSED - 1) * val(CLOSED - 1) || RM.matches) shown[id] = target; else shown[id] += dlt * IP;   // done within the last rung squared; each PHI^-1 s step closes 61.8% of the gap
      apply(id); if (shown[id] !== target) gT[id] = setTimeout(step, Math.round(MS * IP));
    })();
  }

  // ---------- Dial 3: season pump (js/season-pumps.js, the Season pumps standard), background layers only ----------
  var SP = root.SeasonPumps || null, seasonV = { warm: 0, calm: 0, k: 0 }, warmEl = null, layerEl = null;
  function rgb(s) { s = String(s || ""); if (/rgba?\(/.test(s) && !/,\s*0\)$/.test(s)) { var m = s.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; } return null; }
  function pageColours() {               // the page's own background and text colour, measured on the screen, for the WCAG floor
    var bg = null, els = [layerEl, doc.body, doc.documentElement];
    for (var i = 0; i < els.length && !bg; i++) if (els[i] && els[i].nodeType) bg = rgb(getComputedStyle(els[i]).backgroundColor);
    return { bg: bg || SP.WHITE, fg: doc.body ? rgb(getComputedStyle(doc.body).color) : null };
  }
  function season() {
    if (!SP) return { warm: 0, calm: 0, k: 0 };
    var now = new Date(), base = shown.season || 0, pc = pageColours();
    return SP.wcagFloor(pc.bg, pc.fg, SP.output("warmth", base, now), SP.output("calm", base, now), CLOSED);
  }
  function paintSeason() {
    var v = season(), first = !warmEl; seasonV = v;
    if (first) {
      var sel = SCRIPT && SCRIPT.getAttribute("data-warm"), st = doc.createElement("style"), f = "sepia(var(--phi-season-warm,0)) saturate(var(--phi-season-sat,1))";
      var tr = "transition:filter " + Math.pow(PHI, 5) + "s linear,-webkit-backdrop-filter " + Math.pow(PHI, 5) + "s linear,backdrop-filter " + Math.pow(PHI, 5) + "s linear";
      if (sel) { st.textContent = sel + "{filter:" + f + ";" + tr + "}"; layerEl = doc.querySelector(sel); warmEl = layerEl || true; }
      else {     // no background layer of its own (Rebella): a backdrop layer behind the content
        st.textContent = ".phi-season{position:fixed;inset:0;z-index:-1;pointer-events:none;-webkit-backdrop-filter:" + f + ";backdrop-filter:" + f + ";" + tr + "}";
        warmEl = layerEl = doc.createElement("div"); warmEl.className = "phi-season"; warmEl.setAttribute("aria-hidden", "true"); doc.body.insertBefore(warmEl, doc.body.firstChild);
      }
      st.setAttribute("data-phi-dials", ""); doc.head.appendChild(st);
    }
    var set = function () { var s = doc.documentElement.style;
      s.setProperty("--phi-season-warm", String(v.warm)); s.setProperty("--phi-season-sat", String(1 - v.calm)); };
    if (first) setTimeout(set, Math.round(MS * IP)); else set();   // first paint at 0, then the slow transition: no snap
  }
  // the sky clocks move on their own: re-read every PHI^8 s while visible (reduced motion: only when she comes back to the page)
  setInterval(function () { if (!doc.hidden && !RM.matches && warmEl) paintSeason(); }, Math.round(MS * Math.pow(PHI, 8)));
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden && warmEl) paintSeason(); });

  // ---------- the loop: this visit's own usage -> dials + level reading ----------
  var visStart = doc.hidden ? 0 : Date.now(), visMs = 0, start = PA.snapshot(), checked = false, ended = false;
  function visible() { return visMs + (visStart ? Date.now() - visStart : 0); }
  function evaluate(final) {
    var ses = PA.session(), ids = Object.keys(ses), n = 0;
    ids.forEach(function (id) { n += ses[id].o + ses[id].t; });
    // Dial 2: pace (once per visit)
    if (!checked) {
      var V = visible() / MS;
      if (n >= Math.pow(PHI, 3) && V >= Math.pow(PHI, 6)) {
        checked = true; var rate = n / V;
        if (X.pace == null) X.pace = rate;
        else { var q = rate / X.pace; if (q >= PHI) move("pace", 1, "quicker than usual"); else if (q <= IP) move("pace", -1, "gentler than usual");
               X.pace = X.pace + (rate - X.pace) * IP * IP; }
      }
    }
    if (!final) { persist(); return; }
    // Dial 1: per-component pass share (returned to -> up; a visit without it -> down)
    var before = start.c || {};
    ids.forEach(function (id) { if (before[id]) move("filter:" + id, 1, "came back to it"); });
    Object.keys(X.f).forEach(function (id) { if (!ses[id]) move("filter:" + id, -1, "not used this visit"); });
    // Dial 1: summary share (did the last summary predict this visit?)
    if (X.sum.length && ids.length) {
      var hit = X.sum.filter(function (s) { return ses[s.id]; }).length / X.sum.length;
      if (hit >= IP) move("filter", 1, "summary matched the visit"); else if (hit < IP * IP) move("filter", -1, "summary missed the visit");
    }
    var all = Object.keys((PA.snapshot().c) || {}), tot = 0, sc = {};
    all.forEach(function (id) { sc[id] = PA.score(id); tot += sc[id]; });
    all.sort(function (a, b) { return sc[b] - sc[a]; });
    X.sum = tot ? all.slice(0, Math.ceil(val(X.pos.filter) * all.length)).map(function (id) {
      var r = sc[id] / tot, k = 0; while (k < CLOSED && val(k) > r) k++; return { id: id, r: k }; }) : [];   // ratios only, as rungs
    // level reading: how to pitch things for her at her own level (ratios only)
    var hs = tot ? (sc.help || 0) / tot : 0;
    X.lvl = { pace: X.pos.pace < SPEC.pace.def ? "quick" : X.pos.pace > SPEC.pace.def ? "gentle" : "steady",
              depth: X.sum.length, help: hs >= IP * IP ? "more" : hs > 0 && hs <= Math.pow(IP, 4) ? "less" : "usual" };
    persist(true);
  }
  function onHide() { if (doc.hidden) { if (visStart) { visMs += Date.now() - visStart; visStart = 0; } if (!ended) { ended = true; evaluate(true); } } else visStart = Date.now(); }
  doc.addEventListener("visibilitychange", onHide);
  root.addEventListener("pagehide", function () { if (!ended) { ended = true; if (visStart) { visMs += Date.now() - visStart; visStart = 0; } evaluate(true); } });
  var mid = setInterval(function () { if (checked || ended) return clearInterval(mid); if (!doc.hidden) evaluate(false); }, Math.round(MS * Math.pow(PHI, 8)));

  // passes the information filter share into phi-adapt (live event -> profile)
  PA.onPass(function (id) { return val(cur("filter:" + id)); });
  Object.keys(SPEC).forEach(glide);

  root.PhiDials = { RUNGS: RUNGS, SPEC: JSON.parse(JSON.stringify(SPEC)), gate: "off",
    pos: function (id) { return cur(id); }, value: function (id) { return val(cur(id)); }, live: function (id) { return shown[id]; },
    level: function () { return JSON.parse(JSON.stringify(X.lvl)); }, season: function () { var c = SP ? SP.clocks() : null; return c ? { ratio: c.dayRatio, hours: c.dayHours,
      sunHeight: c.sunHeight, rest: c.rest, warmth: seasonV.warm, calm: seasonV.calm, floorSteps: seasonV.k,
      pumps: c.pumps, note: c.asserted } : { ratio: 0, hours: 0, warmth: 0, calm: 0, note: "season-pumps.js not loaded" }; },
    log: function () { return X.log.slice(); }, proposals: function () { return X.prop.slice(); },
    nudge: function (id, dir) { return move(id, dir, "manual check"); }, rollback: rollback };
})();
