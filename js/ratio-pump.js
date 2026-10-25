/* RATIO PUMP + SITE FREQUENCY DIAL (shared module; the SAME file is rebella js/ratio-pump.js and simmie-chat js/ratio-pump.js).
   Danny, 12:15 AWST 24 Oct 2026: wire ALL motion to one ratio-pump regime driven by the LOWEST incoming feed as the master
   ratio, and dial all motion back 25% with a single site-wide frequency dial. Phi timing rules still apply
   (/home/box/.config/phi-timing-rules.md); this sits on top of js/phi-timing.js and never changes its ladder or the weather sweep.

   1. Feeds (only what the page already has; no new requests, no storage, no network):
        weather  - the mood the page already reports (PhiTiming.setWeather, or Rebella's 'rebella:weather' event):
                   storm 1, hot .9, sun .8, cloud .6, rain .5, fog .35, night .25 (00:00-05:00 Perth: deep .1). No weather: not used.
        moon     - Moon illumination 0 (new) .. 1 (full), computed from the date (synodic month 29.530588853 d).
        day      - Perth time of day, 0 at 03:00 .. 1 at 15:00 (cosine).
        messages - only where messages exist (PhiTiming.setMsg): urgent 1, unread from Dad .8, new .6, idle .3.
      Each feed is a 0..1 ratio. MASTER = the lowest feed (calmest wins), rounded to 0.05.
   2. Pump = PHI^((master - 1) / 4): 1 when every feed is lively, down to a quarter phi step slower (0.887) when the calmest
      feed is at 0. It only ever slows things, so with the dial everything is at least 25% slower (rate 0.665 .. 0.75).
   3. Site frequency dial, one per site (data-site + data-freq on this script tag, default 0.75: all motion 25% slower,
      periods / 0.75 = x1.333). Dashboard, chat, Dad's palette (questionnaire) and Rebella each carry their own value.
      Rate = SITE_FREQ x pump. One rate for every element, so the phi ratios between elements are kept.
   4. Applied to: every CSS animation (Animation.playbackRate, changed with updatePlaybackRate so nothing jumps),
      decorative muted looping videos (playbackRate), and JS motion timed through PhiTiming (s/ms/off/offMs/every are divided
      by the rate). JS Web Animations get their duration from those PhiTiming calls, so they are not rate-scaled twice;
      tickers whose CSS duration is set from PhiTiming (#wx-tick-track, #ttrack, [data-phi-js]) are skipped for the same reason.
      Other pages' own timers can read RatioPump.rate().
      Per-element extra: data-slow on this script tag, e.g. data-slow=".ad-orbit=0.5" (chat page Ask Dad rocket: 50% slower).
   5. CSS transitions (hover/press feedback), network polls and one-shot UI feedback are not "activity" and are unchanged.
   6. prefers-reduced-motion: pump fixed at 1 (no modulation); the dial still applies to anything that still moves.
   Preview/verify overrides: ?freq=0.25..2 (dial), ?pump=off. The pump is re-read once a minute and on each weather/message
   change. Read-only API: window.RatioPump.{rate(), dial, pump(), master(), feeds(), info()}. */
(function (root) {
  "use strict";
  if (root.RatioPump) return;
  var PHI = 1.6180339887, doc = root.document, SCRIPT = doc && doc.currentScript;
  // one dial PER SITE (Danny: separate dials for Dad's palette, Bonnie's Dashboard, Rebella and the chat), set on this script tag:
  //   data-site="dashboard|chat|dad|rebella"  data-freq="0.75"  (default 0.75 = 25% slower). Tune one site without touching the others.
  var SITE = (SCRIPT && SCRIPT.getAttribute("data-site")) || "site";
  // data-lite="1" (questionnaire, Danny 25 Oct 'smoother first load'): same rates, less work. No 1 s re-scan of every animation
  // (doc.getAnimations() forces a full style recalc each time); the rate is re-applied only when it changes (refresh), new animations
  // get it from animationstart, batched once per frame; animationiteration is ignored (playbackRate persists); first scan when idle.
  var LITE = !!(SCRIPT && SCRIPT.getAttribute("data-lite") === "1");
  var SITE_FREQ = parseFloat(SCRIPT && SCRIPT.getAttribute("data-freq")); if (!(SITE_FREQ >= 0.25 && SITE_FREQ <= 2)) SITE_FREQ = 0.75;
  var pumpOn = true;
  try { var q = new URLSearchParams(location.search), f = parseFloat(q.get("freq"));
    if (f >= 0.25 && f <= 2) SITE_FREQ = f; if (q.get("pump") === "off") pumpOn = false; } catch (e) {}
  var RM = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var WX = { storm: 1, hot: 0.9, sun: 0.8, cloud: 0.6, rain: 0.5, fog: 0.35, night: 0.25, deep: 0.1 };
  var MSGR = { urgent: 1, dad: 0.8, "new": 0.6, idle: 0.3 };
  var SKIP = "#wx-tick-track,#ttrack,[data-phi-js]";
  var slow = [];   // [[selector, factor]]
  (SCRIPT && SCRIPT.getAttribute("data-slow") || "").split(";").forEach(function (p) {
    var m = p.split("="); var k = parseFloat(m[1]); if (m[0] && m[0].trim() && k > 0) slow.push([m[0].trim(), k]); });
  var wxKey = null, msgKey = null, master = 1, masterFeed = null, rate = SITE_FREQ;

  function perthHour() { try { var s = new Date().toLocaleString("en-AU", { timeZone: "Australia/Perth", hour: "2-digit", minute: "2-digit", hour12: false }).split(":");
    return (+s[0] % 24) + (+s[1] || 0) / 60; } catch (e) { var d = new Date(); return d.getHours() + d.getMinutes() / 60; } }
  function moonIllum() { var days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5, age = ((days % 29.530588853) + 29.530588853) % 29.530588853;
    return (1 - Math.cos(2 * Math.PI * age / 29.530588853)) / 2; }
  function feeds() {
    var h = perthHour(), o = { moon: moonIllum(), day: (1 - Math.cos(2 * Math.PI * (h - 3) / 24)) / 2 };
    if (wxKey && wxKey in WX) o.weather = (h < 5 && wxKey !== "storm") ? WX.deep : WX[wxKey];
    if (msgKey && msgKey in MSGR) o.messages = MSGR[msgKey];
    return o;
  }
  function pumpOf(m) { return (!pumpOn || RM.matches) ? 1 : Math.pow(PHI, (m - 1) / 4); }
  function compute() {
    var o = feeds(), lo = 2, who = null;
    Object.keys(o).forEach(function (k) { if (o[k] < lo) { lo = o[k]; who = k; } });
    master = Math.round(lo * 20) / 20; masterFeed = who;
    rate = SITE_FREQ * pumpOf(master);
    if (doc) { var r = doc.documentElement; r.style.setProperty("--site-freq", String(SITE_FREQ)); r.style.setProperty("--pump-rate", rate.toFixed(4)); r.style.setProperty("--pump", (rate / SITE_FREQ).toFixed(4));
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
  function setRate(a, r) { if (r == null || Math.abs(a.playbackRate - r) < 1e-4) return;
    try { if (a.updatePlaybackRate && a.playState === "running") a.updatePlaybackRate(r); else a.playbackRate = r; } catch (e) { try { a.playbackRate = r; } catch (e2) {} } }
  function applyAll() {
    if (!doc) return;
    if (doc.getAnimations) doc.getAnimations().forEach(function (a) { setRate(a, want(a)); });
    var v = doc.querySelectorAll("video[loop]"); for (var i = 0; i < v.length; i++) { if (v[i].muted || v[i].hasAttribute("muted")) { var r = rate * extra(v[i]); if (Math.abs(v[i].playbackRate - r) > 1e-3) { try { v[i].defaultPlaybackRate = r; v[i].playbackRate = r; } catch (e) {} } } }
  }
  function onAnim(ev) { var el = ev.target; if (!el || !el.getAnimations) return; el.getAnimations().forEach(function (a) { if (a.animationName === ev.animationName) setRate(a, want(a)); }); }
  var pend = [], pendRaf = 0;
  function onAnimLite(ev) { if (ev.type !== "animationstart") return; pend.push(ev); if (!pendRaf) pendRaf = requestAnimationFrame(function () { var q = pend; pend = []; pendRaf = 0; q.forEach(onAnim); }); }
  var subs = [];
  function refresh() { var before = rate; compute(); applyAll(); var inf = api.info();
    if (doc) try { doc.dispatchEvent(new CustomEvent("ratiopump:change", { detail: inf })); } catch (e) {}
    subs.forEach(function (fn) { try { fn(inf); } catch (e) {} }); return before; }

  // ---------- JS motion timed through PhiTiming ----------
  function wrapPT(PT) {
    if (!PT || PT.__pump) return; PT.__pump = true;
    var s0 = PT.s, off0 = PT.off;
    PT.s = function (n) { return s0(n) / rate; };
    PT.ms = function (n) { return Math.round(s0(n) / rate * 1000); };
    PT.off = function (n) { return off0(n) / rate; };
    PT.offMs = function (n) { return Math.round(off0(n) / rate * 1000); };
    var info0 = PT.info; if (info0) PT.info = function (n) { var o = info0(n); o.rate = rate; o.effective = o.s / rate; return o; };
    var sw0 = PT.setWeather; if (sw0) PT.setWeather = function (key) { var r = sw0.apply(PT, arguments); wxKey = key || null; refresh(); return r; };
    var sm0 = PT.setMsg; if (sm0) PT.setMsg = function (st) { var r = sm0.apply(PT, arguments); var m = PT.msg ? PT.msg() : st; if (m !== msgKey) { msgKey = m; refresh(); } return r; };
    PT.rate = function () { return rate; };
  }

  var api = {
    dial: SITE_FREQ, site: SITE, PHI: PHI,
    rate: function () { return rate; }, pump: function () { return rate / SITE_FREQ; },
    master: function () { return { feed: masterFeed, ratio: master }; }, feeds: feeds,
    info: function () { return { site: SITE, dial: SITE_FREQ, pumpOn: pumpOn && !RM.matches, feeds: feeds(), master: masterFeed, masterRatio: master, pump: rate / SITE_FREQ, rate: rate, slow: slow }; },
    refresh: refresh,
    // subscribe: fn(info) is called after every pump/feed change (and once now); returns an unsubscribe function
    on: function (fn) { subs.push(fn); try { fn(api.info()); } catch (e) {} return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
  };
  root.RatioPump = api;
  compute();
  wrapPT(root.PhiTiming);
  if (doc) {
    doc.addEventListener("animationstart", LITE ? onAnimLite : onAnim, true);
    if (!LITE) doc.addEventListener("animationiteration", onAnim, true);
    doc.addEventListener("rebella:weather", function (e) { var k = e && e.detail && e.detail.key; if (k !== wxKey) { wxKey = k || null; refresh(); } });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) refresh(); });
    if (RM.addEventListener) RM.addEventListener("change", refresh);
    var go = function () { applyAll(); if (!LITE) setInterval(function () { if (!doc.hidden) applyAll(); }, 1000); setInterval(refresh, 60000); };
    if (LITE) { var ric = root.requestIdleCallback || function (f) { return setTimeout(f, 300); }; var goIdle = function () { ric(go, { timeout: 1500 }); };
      if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", goIdle); else goIdle(); }
    else if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", go); else go();
  }
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : this);
