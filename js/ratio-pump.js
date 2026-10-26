/* RATIO PUMP + SITE FREQUENCY DIAL (shared module; the SAME file is rebella js/ratio-pump.js and simmie-chat js/ratio-pump.js).
   Danny, 12:15 AWST 24 Oct 2026: wire ALL motion to one ratio-pump regime driven by the LOWEST incoming feed as the master
   ratio, with one site-wide frequency dial. Rule phi build B (Danny, 26 Oct 2026): every table below is a whole phi rung,
   the dial is a rung, and the pump's timers are rungs of B (js/phi-b.js). Sits on top of js/phi-timing.js.

   1. Feeds (only what the page already has; no new requests, no storage, no network). Each is a 0..1 ratio, PHI^rung:
        weather  - the mood the page reports: storm PHI^0, hot PHI^0, sun PHI^-1, cloud PHI^-1, rain PHI^-2, fog PHI^-2,
                   night PHI^-3; deep night (sun below civil twilight, js/season-pumps.js; storms excepted) PHI^-5.
        moon     - Moon illumination 0 (new) .. 1 (full), from the date (cited synodic month).
        day      - the sun's own height: 1 by day, 0 once civil dusk ends (js/season-pumps.js rest share); no clock hours.
        messages - only where messages exist (PhiTiming.setMsg): urgent PHI^0, unread from Dad PHI^-1, new PHI^-1, idle PHI^-3.
      MASTER = the lowest feed (calmest wins), not rounded.
   2. Pump = PHI^(master - 1): 1 when every feed is lively, down to one phi step slower (0.618) when the calmest feed is at 0.
      It only ever slows things.
   3. Site frequency dial, one per site, a whole rung: data-rung="k" on this script tag (rate PHI^k), default PHI^-1 = 0.618
      (was 0.75; every period x1.618 instead of x1.333). data-freq / ?freq= still work and snap to the nearest rung; ?rung=k.
      Rungs accepted: PHI^-3 .. PHI^1. Rate = SITE_DIAL x pump x kid-pace dial. One rate for every element.
   4. Applied to: every CSS animation (playbackRate via updatePlaybackRate, so nothing jumps), decorative muted looping videos,
      and JS motion timed through PhiTiming (s/ms/off/offMs divided by the rate). Tickers whose CSS duration comes from
      PhiTiming (#wx-tick-track, #ttrack, [data-phi-js]) are skipped. data-slow=".sel=f" factors snap to a rung too.
      Pause motion (html.phi-paused, js/phi-pause.js): every running animation and video is held paused here.
   5. CSS transitions, network polls and one-shot UI feedback are not "activity" and are not pumped.
   6. prefers-reduced-motion: pump fixed at 1; the dial still applies to anything that still moves.
   Preview overrides: ?freq= / ?rung=, ?pump=off. Re-read every B x PHI^3 and on each weather/message change.
   Read-only API: window.RatioPump.{rate(), dial, rung, pump(), master(), feeds(), info()}. */
(function (root) {
  "use strict";
  if (root.RatioPump) return;
  var PHI = (1 + Math.sqrt(5)) / 2, LN = Math.log(PHI), SEC = 1000, doc = root.document, SCRIPT = doc && doc.currentScript;   // phi: the golden ratio; unit: ms per second
  var RUNG_LO = -3, RUNG_HI = 1, RUNG_DEF = -1;                                                         // phi: dial rungs PHI^-3 .. PHI^1, default PHI^-1
  function B() { var b = root.PhiB && root.PhiB.value; return b > 0 ? b : 1; }                         // unit: B from js/phi-b.js, or the SI second if none was measured
  function bms(k) { return B() * Math.pow(PHI, k) * SEC; }
  function snap(f) { return Math.round(Math.log(f) / LN); }
  // one dial PER SITE (Danny: separate dials for Dad's palette, Bonnie's Dashboard, Rebella and the chat), set on this script tag:
  //   data-site="dashboard|chat|dad|rebella"  data-rung="-1" (rate PHI^-1). Tune one site without touching the others.
  var SITE = (SCRIPT && SCRIPT.getAttribute("data-site")) || "site";
  function okRung(k) { return isFinite(k) && k === Math.round(k) && k >= RUNG_LO && k <= RUNG_HI; }
  var RUNG = RUNG_DEF, a0 = SCRIPT && SCRIPT.getAttribute("data-rung"), f0 = parseFloat(SCRIPT && SCRIPT.getAttribute("data-freq"));
  if (a0 != null && okRung(+a0)) RUNG = +a0; else if (f0 > 0 && okRung(snap(f0))) RUNG = snap(f0);
  var pumpOn = true;
  try { var q = new URLSearchParams(location.search), f = parseFloat(q.get("freq")), qr = q.get("rung");
    if (qr != null && okRung(+qr)) RUNG = +qr; else if (f > 0 && okRung(snap(f))) RUNG = snap(f); if (q.get("pump") === "off") pumpOn = false; } catch (e) {}
  var SITE_FREQ = Math.pow(PHI, RUNG);
  var RM = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var WX = { storm: 0, hot: 0, sun: -1, cloud: -1, rain: -2, fog: -2, night: -3, deep: -5 };          // phi: whole rungs (feed = PHI^rung)
  var MSGR = { urgent: 0, dad: -1, "new": -1, idle: -3 };                                               // phi: whole rungs (feed = PHI^rung)
  var SKIP = "#wx-tick-track,#ttrack,[data-phi-js]";
  var slow = [];   // [[selector, factor]]
  (SCRIPT && SCRIPT.getAttribute("data-slow") || "").split(";").forEach(function (p) {
    var m = p.split("="); var k = parseFloat(m[1]); if (m[0] && m[0].trim() && k > 0) slow.push([m[0].trim(), Math.pow(PHI, snap(k))]); });
  var wxKey = null, msgKey = null, master = 1, masterFeed = null, rate = SITE_FREQ;
  var userK = 1;   // Kids Club dial 2 (kid-pace retune, js/phi-dials.js): a phi-rung factor inside Danny's range; 1 without dials

  function moonIllum() { var days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, age = ((days % 29.530588853) + 29.530588853) % 29.530588853;   // cite: reference new moon 2000-01-06 18:14 UTC and mean synodic month 29.530588853 d (Meeus, Astronomical Algorithms ch. 49); 864e5 ms per day
    return (1 - Math.cos(2 * Math.PI * age / 29.530588853)) / 2; }   // cite: mean synodic month 29.530588853 d (Meeus ch. 49); illuminated fraction (1 - cos(phase angle)) / 2 (Meeus ch. 48)
  function rest() { try { var SP = root.SeasonPumps; return SP ? SP.restShare(SP.sunHeight(new Date())) : null; } catch (e) { return null; } }
  function feeds() {
    var r = rest(), o = { moon: moonIllum() };
    if (r != null) o.day = 1 - r;
    if (wxKey && wxKey in WX) o.weather = Math.pow(PHI, (r != null && r >= 1 && wxKey !== "storm") ? WX.deep : WX[wxKey]);
    if (msgKey && msgKey in MSGR) o.messages = Math.pow(PHI, MSGR[msgKey]);
    return o;
  }
  function pumpOf(m) { return (!pumpOn || RM.matches) ? 1 : Math.pow(PHI, m - 1); }
  function compute() {
    var o = feeds(), lo = Infinity, who = null;
    Object.keys(o).forEach(function (k) { if (o[k] < lo) { lo = o[k]; who = k; } });
    master = isFinite(lo) ? lo : 1; masterFeed = who;
    rate = SITE_FREQ * pumpOf(master) * userK;
    if (doc) { var r = doc.documentElement; r.style.setProperty("--site-freq", String(SITE_FREQ)); r.style.setProperty("--pump-rate", String(rate)); r.style.setProperty("--pump", String(rate / SITE_FREQ));
      r.style.setProperty("--pump-master", String(master)); r.setAttribute("data-site-freq", SITE + ":" + SITE_FREQ);
      r.setAttribute("data-pump-master", who || ""); }
    return rate;
  }

  // ---------- applying the rate ----------
  function extra(t) { var k = 1; if (!t || !t.closest) return k; for (var i = 0; i < slow.length; i++) { try { if (t.closest(slow[i][0])) k *= slow[i][1]; } catch (e) {} } return k; }
  function target(a) { return a.effect && a.effect.target; }
  function want(a) {
    if (!a || a.animationName == null) return null;          // CSS animations only (not transitions, not JS element.animate)
    var t = target(a); if (t && t.closest && t.closest(SKIP)) return null;
    if (t && t.closest && t.closest(".fb-wave.beat")) return 1;   // Rebella footer wave locked to the radio's beat: stays on the beat
    return rate * extra(t);
  }
  function setRate(a, r) { if (r == null || a.playbackRate === r) return;
    try { if (a.updatePlaybackRate && a.playState === "running") a.updatePlaybackRate(r); else a.playbackRate = r; } catch (e) { try { a.playbackRate = r; } catch (e2) {} } }
  // Pause motion (js/phi-pause.js): hold every running animation (CSS or JS, never a hover/press transition) and looping video
  function held() { return !!(doc && doc.documentElement.classList.contains("phi-paused")); }
  function hold(on) {
    if (!doc || !doc.getAnimations) return;
    doc.getAnimations().forEach(function (a) { if (a.transitionProperty != null) return;
      try { if (on && a.playState === "running") { a.pause(); a._phiHeld = true; } else if (!on && a._phiHeld) { a._phiHeld = false; a.play(); } } catch (e) {} });
    var v = doc.querySelectorAll("video"); for (var i = 0; i < v.length; i++) { try { if (on && !v[i].paused) { v[i].pause(); v[i]._phiHeld = true; } else if (!on && v[i]._phiHeld) { v[i]._phiHeld = false; v[i].play(); } } catch (e) {} }
  }
  function applyAll() {
    if (!doc) return;
    if (held()) { hold(true); return; }
    if (doc.getAnimations) doc.getAnimations().forEach(function (a) { setRate(a, want(a)); });
    var v = doc.querySelectorAll("video[loop]"); for (var i = 0; i < v.length; i++) { if (v[i].muted || v[i].hasAttribute("muted")) { var r = rate * extra(v[i]); if (v[i].playbackRate !== r) { try { v[i].defaultPlaybackRate = r; v[i].playbackRate = r; } catch (e) {} } } }
  }
  function onAnim(ev) { var el = ev.target; if (!el || !el.getAnimations) return; el.getAnimations().forEach(function (a) { if (a.animationName === ev.animationName) setRate(a, want(a)); }); }
  var subs = [];
  function refresh() { var before = rate; compute(); applyAll(); var inf = api.info();
    if (doc) try { doc.dispatchEvent(new CustomEvent("ratiopump:change", { detail: inf })); } catch (e) {}
    subs.forEach(function (fn) { try { fn(inf); } catch (e) {} }); return before; }

  // ---------- JS motion timed through PhiTiming ----------
  function wrapPT(PT) {
    if (!PT || PT.__pump) return; PT.__pump = true;
    var s0 = PT.s, off0 = PT.off;
    PT.s = function (n) { return s0(n) / rate; };
    PT.ms = function (n) { return Math.round(s0(n) / rate * SEC); };
    PT.off = function (n) { return off0(n) / rate; };
    PT.offMs = function (n) { return Math.round(off0(n) / rate * SEC); };
    var info0 = PT.info; if (info0) PT.info = function (n) { var o = info0(n); o.rate = rate; o.effective = o.s / rate; return o; };
    var sw0 = PT.setWeather; if (sw0) PT.setWeather = function (key) { var r = sw0.apply(PT, arguments); wxKey = key || null; refresh(); return r; };
    var sm0 = PT.setMsg; if (sm0) PT.setMsg = function (st) { var r = sm0.apply(PT, arguments); var m = PT.msg ? PT.msg() : st; if (m !== msgKey) { msgKey = m; refresh(); } return r; };
    PT.rate = function () { return rate; };
  }

  var api = {
    dial: SITE_FREQ, rung: RUNG, site: SITE, PHI: PHI,
    rate: function () { return rate; }, pump: function () { return rate / SITE_FREQ; },
    master: function () { return { feed: masterFeed, ratio: master }; }, feeds: feeds,
    info: function () { return { site: SITE, dial: SITE_FREQ, rung: RUNG, pumpOn: pumpOn && !RM.matches, feeds: feeds(), master: masterFeed, masterRatio: master, pump: rate / SITE_FREQ, rate: rate, slow: slow }; },
    refresh: refresh, hold: hold, held: held,
    // kid-pace factor from js/phi-dials.js (glided there, so no jumps); accepted only within PHI^-1 .. PHI
    user: function () { return userK; },
    setUser: function (k) { k = +k; if (!(k >= 1 / PHI && k <= PHI) || k === userK) return userK; userK = k; compute(); applyAll(); return userK; },
    // subscribe: fn(info) is called after every pump/feed change (and once now); returns an unsubscribe function
    on: function (fn) { subs.push(fn); try { fn(api.info()); } catch (e) {} return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
  };
  root.RatioPump = api;
  compute();
  wrapPT(root.PhiTiming);
  if (doc) {
    doc.addEventListener("animationstart", onAnim, true);
    doc.addEventListener("animationiteration", onAnim, true);
    doc.addEventListener("rebella:weather", function (e) { var k = e && e.detail && e.detail.key; if (k !== wxKey) { wxKey = k || null; refresh(); } });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) refresh(); });
    if (RM.addEventListener) RM.addEventListener("change", refresh);
    var go = function () { applyAll(); setInterval(function () { if (!doc.hidden) applyAll(); }, bms(-5)); setInterval(refresh, bms(3)); };   // phi: B x PHI^-5 (about a second), B x PHI^3
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", go); else go();
  }
  // Kids Club golden-ratio dials (Danny's go t816u 25 Oct 2026): at idle, load the shared usage record (js/phi-adapt.js) and the dials
  // (js/phi-dials.js) from this script's own folder, with js/season-pumps.js (sky clocks for Dial 3) before the dials. Three same-origin
  // static files, nothing else; data-dials="off" on this tag skips them all.
  if (doc && SCRIPT && SCRIPT.getAttribute("data-dials") !== "off" && SCRIPT.src) {
    var base = SCRIPT.src.replace(/[^\/]*$/, ""), ric2 = root.requestIdleCallback || function (f) { return setTimeout(f, bms(-6)); };   // phi: B x PHI^-6
    var add = function (src, then) { var s = doc.createElement("script"); s.src = base + src; s.async = true; if (then) s.onload = then; doc.head.appendChild(s); };
    var rest2 = function () { if (root.SeasonPumps) add("phi-dials.js?v=4"); else add("season-pumps.js?v=2", function () { add("phi-dials.js?v=4"); }); };   // Season pumps standard: sky clocks for Dial 3 (already in <head> with B), then the dials (anchor: ?v= are file version tags, not values)
    var dials = function () { ric2(function () { if (root.PhiAdapt) rest2(); else add("phi-adapt.js?v=3", rest2); }, { timeout: bms(-2) }); };   // phi: B x PHI^-2
    if (doc.readyState === "complete") dials(); else root.addEventListener("load", dials);
  }
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : this);
