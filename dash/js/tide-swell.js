/* TIDE + SWELL STRIP (Danny 24 Oct 2026 03:43 AWST, LIVE: Danny 12:39 AWST 24 Oct 'push it all'). Same file on every Bonnie site footer
   (Rebella, Bonnie's Dashboard, the Simmie chat page, the questionnaire). Sits right after the Moon-phase critters strip.
   - A tiny inline SVG of TODAY's tide curve off Fremantle (Perth day, hourly) with a "now" marker, and 1-3 dolphins 🐬.
   - Source: Open-Meteo Marine API (keyless, CORS *, CC BY 4.0). One GET for fixed Fremantle coordinates (never the device's
     location), no credentials, no referrer, cached in localStorage for 60 min (refetched at most once an hour per device).
     Tide = sea_level_height_msl (model, ~8 km grid, datum = mean sea level, approximate: decoration, not for boating).
     Swell = swell_wave_height + swell_wave_period from the same response (swell comes bundled with the tide in one request).
   - Timing (/home/box/.config/phi-timing-rules.md): dolphins are an "animals" slot, PHI^5 = 11.09 s on Bonnie's ladder, and
     SWELL IS THEIR PUMP (bigger swell = faster leap): s = +1 (<0.5 m), +0.5 (<1 m), 0 (<1.5 m), -0.5 (<2 m), -1 (<3 m),
     -1.5 (3 m+); period = PHI^(5+s), from 17.94 s down to 5.39 s. Fast = small moves (leap height scales with the period).
     Count: 1 dolphin under 1 m, 2 under 2 m, 3 from 2 m. Dolphin k starts at period*frac(k*0.618) (negative delay).
     Not weather-swept (marked data-phi-js, like the critters marquee); a new period lands at the next cycle boundary.
   - Reduced motion / Pause motion: still. Fetch fails or bad data: the strip stays hidden, no errors, nothing else changes.
   - Attribution: in the strip's title + accessible name, and on Rebella's credits page (no link in the bars, by Danny's rule).
   Mount: <span class="tsw" data-ts-key="STORAGE_KEY" hidden></span>  (CSS: tide-swell.css; colours via --ts-* per site). */
(function () {
  'use strict';
  // ratio pump + site frequency dial (js/ratio-pump.js, Danny 12:15 AWST 24 Oct): the dolphins are data-phi-js (skipped by the
  // CSS pass), so their period is divided by RatioPump.rate() here; a new rate lands at the next repaint / cycle boundary.
  function rpRate() { var r = window.RatioPump && window.RatioPump.rate && window.RatioPump.rate(); return r > 0 ? r : 1; }
  var PHI = 1.6180339887, G = 0.6180339887;   // phi
  // Cache (Rule phi): U = the feed's own step, read from the reply (hourly.time[1] - hourly.time[0]) and stored with the cache as u.
  // Fresh for U x PHI^0; if a request fails, a stale copy is still used up to U x PHI^4. No u known: refetch.
  var URL = 'https://marine-api.open-meteo.com/v1/marine?latitude=-32.05&longitude=115.74' +
            '&hourly=sea_level_height_msl,swell_wave_height,swell_wave_period&timezone=Australia%2FPerth&forecast_days=2';
  var CREDIT = 'Data: Open-Meteo.com marine model, CC BY 4.0';
  var NS = 'http://www.w3.org/2000/svg', DOL = '\uD83D\uDC2C';
  var hosts = [].slice.call(document.querySelectorAll('.tsw[data-ts-key]'));
  if (!hosts.length || !window.fetch || !window.JSON) return;

  function frac(x) { return x - Math.floor(x); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function perthNow() {
    try {
      var p = {}, parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Perth', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      parts.forEach(function (x) { p[x.type] = x.value; });
      return { date: p.year + '-' + p.month + '-' + p.day, h: Number(p.hour) + Number(p.minute) / 60 };
    } catch (e) { return null; }
  }
  function valid(j) {
    var h = j && j.hourly; if (!h || !h.time || !h.sea_level_height_msl || !h.swell_wave_height) return false;
    return h.time.length > 24 && h.time.length === h.sea_level_height_msl.length && h.time.length === h.swell_wave_height.length;
  }
  function stepOf(j) { var t = j && j.hourly && j.hourly.time; var u = t && t.length > 1 ? Date.parse(t[1]) - Date.parse(t[0]) : 0; return u > 0 ? u : 0; }
  function load(key, cb) {
    var c = null; try { c = JSON.parse(get(key) || 'null'); } catch (e) { c = null; }
    var U = (c && +c.u) || stepOf(c && c.d);
    if (c && valid(c.d) && U > 0 && Date.now() - c.at < U) { cb(c.d); return; }
    fetch(URL, { credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (!valid(j)) throw 0; set(key, JSON.stringify({ at: Date.now(), u: stepOf(j) || U, d: j })); cb(j); })
      .catch(function () { cb(c && valid(c.d) && U > 0 && Date.now() - c.at < U * Math.pow(PHI, 4) ? c.d : null); });
  }
  /* today's curve: 00:00 .. 24:00 Perth (25 hourly points), plus swell at the current hour */
  function pick(j, now) {
    var h = j.hourly, i0 = h.time.indexOf(now.date + 'T00:00'); if (i0 < 0 || i0 + 24 >= h.time.length) return null;
    var t = h.sea_level_height_msl.slice(i0, i0 + 25);
    for (var k = 0; k < t.length; k++) if (typeof t[k] !== 'number') return null;
    var hi = i0 + Math.floor(now.h), sw = null, sp = null;
    for (var d = 0; d < 6 && sw == null; d++) { var a = h.swell_wave_height[hi + d], b = h.swell_wave_height[hi - d];
      if (typeof a === 'number') { sw = a; sp = (h.swell_wave_period || [])[hi + d]; } else if (typeof b === 'number') { sw = b; sp = (h.swell_wave_period || [])[hi - d]; } }
    return { tide: t, swell: sw, period: typeof sp === 'number' ? sp : null };
  }
  function at(t, x) { var i = Math.min(23, Math.floor(x)), f = x - i; return t[i] + (t[i + 1] - t[i]) * f; }
  function pump(m) { return m < 0.5 ? 1 : m < 1 ? 0.5 : m < 1.5 ? 0 : m < 2 ? -0.5 : m < 3 ? -1 : -1.5; }
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function mount(host) {
    var key = host.getAttribute('data-ts-key'), built = false, g, line, area, nowL, nowD, dol, per = 0;
    function build() {
      built = true; host.textContent = '';
      var s = svg('svg', { 'class': 'tsw-tide', viewBox: '0 0 48 16', 'aria-hidden': 'true', focusable: 'false' });
      area = svg('path', { 'class': 'tsw-area' }); line = svg('path', { 'class': 'tsw-line' });
      nowL = svg('line', { 'class': 'tsw-nowl', y1: '1', y2: '15' }); nowD = svg('circle', { 'class': 'tsw-nowd', r: '1.9' });
      s.appendChild(area); s.appendChild(line); s.appendChild(nowL); s.appendChild(nowD); host.appendChild(s);
      dol = document.createElement('span'); dol.className = 'tsw-dol'; dol.setAttribute('aria-hidden', 'true'); dol.setAttribute('data-phi-js', '');
      host.appendChild(dol);
      host.setAttribute('role', 'img');
    }
    function setDolphins(n, p) {
      var amp = Math.max(1.5, Math.min(4, p * 0.23));
      host.style.setProperty('--tsw-amp', -amp.toFixed(2) + 'px');
      if (dol.children.length !== n) {
        dol.textContent = '';
        for (var k = 1; k <= n; k++) { var d = document.createElement('span'); d.textContent = DOL;
          d.style.animationDuration = p.toFixed(3) + 's'; d.style.animationDelay = -(p * frac(k * G)).toFixed(3) + 's';
          d.addEventListener('animationiteration', boundary); dol.appendChild(d); }
        per = p; return;
      }
      if (Math.abs(p - per) > 0.01) { per = p; [].forEach.call(dol.children, function (d) { d._next = p; }); }
    }
    /* new swell period lands at the dolphin's next cycle boundary, phase kept (no jump) */
    function boundary(ev) {
      var d = ev.currentTarget, p = d._next; if (!p) return; d._next = 0;
      var a = d.getAnimations ? d.getAnimations()[0] : null, ms = p * 1000;
      if (a && a.effect && a.currentTime != null) { var t = a.effect.getTiming(), it = Math.round((a.currentTime - t.delay) / t.duration);
        a.effect.updateTiming({ duration: ms }); a.currentTime = t.delay + it * ms; }
      else d.style.animationDuration = p.toFixed(3) + 's';
    }
    function paint(j) {
      var now = perthNow(), v = j && now ? pick(j, now) : null;
      if (!v) { host.hidden = true; return; }
      if (!built) build();
      var t = v.tide, mn = Math.min.apply(null, t), mx = Math.max.apply(null, t), mid = (mn + mx) / 2, rg = Math.max(mx - mn, 0.3);
      var Y = function (h) { return (8 - (h - mid) / rg * 12).toFixed(2); }, d = '';
      for (var i = 0; i < t.length; i++) d += (i ? 'L' : 'M') + (i * 2) + ' ' + Y(t[i]);
      line.setAttribute('d', d); area.setAttribute('d', d + 'L48 16L0 16Z');
      var x = Math.min(48, now.h * 2), hv = at(t, now.h), rising = at(t, Math.min(24, now.h + 0.5)) >= hv;
      nowL.setAttribute('x1', x.toFixed(2)); nowL.setAttribute('x2', x.toFixed(2)); nowD.setAttribute('cx', x.toFixed(2)); nowD.setAttribute('cy', Y(hv));
      var label = 'Tide off Fremantle: ' + (rising ? 'rising' : 'falling') + ', about ' + (hv >= 0 ? '' : 'minus ') + Math.abs(hv).toFixed(1) +
        ' m from mean sea level';
      if (v.swell != null) {
        var p = Math.pow(PHI, 5 + pump(v.swell)) / rpRate(), n = v.swell < 1 ? 1 : v.swell < 2 ? 2 : 3;
        setDolphins(n, p); dol.hidden = false;
        label += '. Swell about ' + v.swell.toFixed(1) + ' m' + (v.period ? ' every ' + Math.round(v.period) + ' s' : '');
      } else dol.hidden = true;
      label += '. Approximate, not for boating. ' + CREDIT + '.';
      host.setAttribute('aria-label', label); host.title = label;
      host.hidden = false;
    }
    var data = null;
    function refresh() { load(key, function (j) { data = j; try { paint(j); } catch (e) { host.hidden = true; } }); }
    refresh();
    setInterval(function () { if (document.hidden) return; refresh(); }, 15 * 60 * 1000);   // cache keeps it to one request an hour
    setInterval(function () { if (!document.hidden && data) try { paint(data); } catch (e) {} }, 5 * 60 * 1000);   // move the "now" marker
  }
  hosts.forEach(function (h) { try { mount(h); } catch (e) { h.hidden = true; } });
})();
