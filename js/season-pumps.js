/* SEASON PUMPS: the Kids Club "Season pumps standard" (/home/box/.config/kids-club/shared.md, Danny 21:47 AWST 25 Oct 2026),
   which Dial 3 of js/phi-dials.js points to. The SAME file is rebella js/season-pumps.js and simmie-chat js/season-pumps.js.
   js/ratio-pump.js loads it at idle after js/phi-adapt.js and before js/phi-dials.js; data-dials="off" skips all three.
   Inputs: the date, the time and the one coarse city point (shared layer location standard). No feed, no network call, no storage,
   nothing about the kid.

   CLOCKS (timing anchors only; no physical coupling is claimed). Every value comes from a cited method and is
   ASSERTED, NOT VERIFIED until it has been checked against JPL Horizons.
     sun's height    NOAA General Solar Position equations (https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
     day length      NOAA sunrise/sunset (zenith 90.833 deg), at the city point
     year            Sun's true longitude, Meeus, Astronomical Algorithms (2nd ed.) ch. 25, linear terms
     M2, S2 tides    equilibrium tide clocks, Doodson arguments 2*tau and 2*t (NOAA CO-OPS constituent periods)
     spring-neap     their beat, 2*D, half the synodic month (Meeus 47.2 mean elongation D, 49.1 synodic month)
     perigee         anomalistic month, Moon's mean anomaly M' (Meeus 47.4, ch. 50)
   Left out as too slow to notice: evection and the lunar apsidal and nodal cycles. Schumann resonance is excluded.

   ONE SHARED FORMULA for every output:
     out = base x PRODUCT over pumps of  S ^ (w x cos(2*pi*phase) / 2)
     S      the pump's own swing ratio (cited data, below)
     phase  the clock's position in its own cycle (a ratio), so cos(2*pi*phase) is +1 at the clock's peak
     w      PHI ^ -(phi-steps between the pump's period and the output's own timescale) = PHI ^ -|log_PHI(P_pump / P_out)|
   The 2*pi and the halving are the shape of a cycle swinging either side of the base, not tuning values.
   The base is Dial 3's live rung (Danny's strength, a phi rung between floor and ceiling); it is the output's PEAK, so the product
   is read as a share of its own peak: out = base x PRODUCT S ^ (w x (cos - 1) / 2). Nothing ever exceeds the rung.
   After the formula the WCAG safe-side floor applies (wcagFloor): the tint steps down by PHI until the page's own text/background pair
   keeps the contrast it had, up to the WCAG 2.2 AA 4.5:1 line (SC 1.4.3).

   OUTPUTS (Dial 3 scope only: palette on background layers)
     warmth  timescale = the year (it is the season pump). Sepia on the background layer.
     calm    timescale = the day. Comes on with rest (sun below the horizon, smoothly through civil dusk, lifting through dawn)
             and softens the background layer's colour (saturation), strongest at night near a spring tide's equilibrium high water. */
(function (root) {
  "use strict";
  var PHI = (1 + Math.sqrt(5)) / 2, IP = 1 / PHI, LNPHI = Math.log(PHI);          // phi: the golden ratio, the sole scaling factor
  var TAU = 2 * Math.PI, RAD = Math.PI / 180, DEG = 360, HDEG = 15, HOURS = 24;    // unit: one turn = 360 deg; Earth turns 15 deg/h; 24 h/day
  var MS_DAY = 864e5, JD_UNIX = 2440587.5, JD_2000 = 2451545, CENTURY = 36525;     // unit/cite: SI day in ms; Meeus ch. 7 (JD 1970-01-01 0h UT, J2000.0, Julian century in days)

  // ---- measured anchors (location standard) ----
  var POINT = { lat: -32.0, lon: 115.9 };                                          // anchor: shared layer's one coarse city point (Perth, 0.1 deg), set by Danny

  // ---- cited clock data ----
  var P = {                                                                        // clock periods, in days
    day: 1,
    m2: 12.4206012 / HOURS,                                                        // cite: M2 period 12.4206012 h (NOAA CO-OPS harmonic constituents)
    s2: 12 / HOURS,                                                                // cite: S2 period 12.0000 h (NOAA CO-OPS harmonic constituents)
    syn: 29.530588861,                                                             // cite: mean synodic month, Meeus 49.1
    anom: 27.554549886,                                                            // cite: anomalistic month, Meeus ch. 50
    year: 365.242189                                                               // cite: mean tropical year (J2000), Meeus ch. 27
  };
  var L_MOON = [218.3164477, 481267.88123421];                                     // cite: Meeus 47.1, Moon's mean longitude L' (deg, deg per century)
  var D_ELONG = [297.8501921, 445267.1114034];                                     // cite: Meeus 47.2, Moon's mean elongation D
  var M_MOON = [134.9633964, 477198.8675055];                                      // cite: Meeus 47.4, Moon's mean anomaly M'
  var L_SUN = [280.46646, 36000.76983];                                            // cite: Meeus 25.2, Sun's geometric mean longitude L0
  var M_SUN = [357.52911, 35999.05029];                                            // cite: Meeus 25.3, Sun's mean anomaly M
  var C_SUN = [1.914602, 0.019993, 0.000289];                                      // cite: Meeus 25.4, equation of the centre (T terms dropped)
  var NOAA_EQT = [229.18, 0.000075, 0.001868, -0.032077, -0.014615, -0.040849];   // cite: NOAA equation of time (minutes)
  var NOAA_DECL = [0.006918, -0.399912, 0.070257, -0.006758, 0.000907, -0.002697, 0.00148]; // cite: NOAA solar declination (radians)
  var Z_RISE = 90.833, H_CIVIL = -6;                                               // cite: NOAA sunrise/sunset zenith; civil twilight = sun's centre 6 deg below the horizon (NOAA/USNO)
  var MIN_PER_DEG = 4, MIN_PER_HOUR = 60, SEC_PER_MIN = 60;                        // unit: 4 min of time per deg of longitude; 60 min/h; 60 s/min

  // ---- cited swing ratios (each clock's own physical ratio) ----
  var MOON_PERI = 363300, MOON_APO = 405500;                                       // cite: NASA Moon Fact Sheet, perigee/apogee distance (km)
  var SUN_PERI = 147.095, SUN_APHE = 152.100;                                      // cite: NASA Earth Fact Sheet, perihelion/aphelion (10^6 km)
  var EQ_M2 = 0.242334, EQ_S2 = 0.112841;                                          // cite: equilibrium tide amplitudes M2, S2 (m), Cartwright & Tayler 1971
  var CUBE = 3;                                                                    // cite: tide-raising force goes as distance^-3 (Newton; equilibrium tide theory)
  var SWING = {
    lunarTide: Math.pow(MOON_APO / MOON_PERI, CUBE),                               // perigee / apogee lunar tide, about 1.39
    solarTide: Math.pow(SUN_APHE / SUN_PERI, CUBE),                                // perihelion / aphelion solar tide, about 1.105
    springNeap: (EQ_M2 + EQ_S2) / (EQ_M2 - EQ_S2)                                  // spring / neap range, about 2.74
  };

  function norm(d) { return ((d % DEG) + DEG) % DEG; }
  function lin(c, t) { return norm(c[0] + c[1] * t); }
  function jd(date) { return date.getTime() / MS_DAY + JD_UNIX; }

  // NOAA: fractional year (radians), declination, equation of time
  function noaaYear(date) {
    var y = date.getUTCFullYear(), y0 = Date.UTC(y, 0, 1), n = (Date.UTC(y + 1, 0, 1) - y0) / MS_DAY;
    return TAU / n * ((date.getTime() - y0) / MS_DAY - 1 / 2);                    // = 2pi/n x (doy - 1 + (hour - 12)/24)
  }
  function decl(g) {
    var a = NOAA_DECL;
    return a[0] + a[1] * Math.cos(g) + a[2] * Math.sin(g) + a[3] * Math.cos(2 * g) + a[4] * Math.sin(2 * g) + a[5] * Math.cos(CUBE * g) + a[6] * Math.sin(CUBE * g);
  }
  function eqTime(g) {
    var a = NOAA_EQT;
    return a[0] * (a[1] + a[2] * Math.cos(g) + a[3] * Math.sin(g) + a[4] * Math.cos(2 * g) + a[5] * Math.sin(2 * g));
  }
  // sun's height above the horizon, degrees (NOAA, true solar time at the city point's longitude)
  function sunHeight(date) {
    var g = noaaYear(date), d = decl(g), lat = POINT.lat * RAD;
    var utcMin = date.getUTCHours() * MIN_PER_HOUR + date.getUTCMinutes() + date.getUTCSeconds() / SEC_PER_MIN;
    var tst = utcMin + eqTime(g) + MIN_PER_DEG * POINT.lon, ha = (tst / MIN_PER_DEG - DEG / 2) * RAD;
    var cz = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(ha);
    return DEG / 4 - Math.acos(Math.max(-1, Math.min(1, cz))) / RAD;              // 90 deg - zenith
  }
  // local day length, hours (NOAA sunrise/sunset)
  function dayLength(date) {
    var d = decl(noaaYear(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) + MS_DAY / 2)));
    var lat = POINT.lat * RAD, c = Math.cos(Z_RISE * RAD) / (Math.cos(lat) * Math.cos(d)) - Math.tan(lat) * Math.tan(d);
    return 2 * Math.acos(Math.max(-1, Math.min(1, c))) / RAD / HDEG;
  }
  var yearCache = {};
  function yearSpan(y) {                                                           // shortest and longest day of that year at the point
    if (yearCache[y]) return yearCache[y];
    var lo = Infinity, hi = 0;
    for (var t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += MS_DAY) { var h = dayLength(new Date(t)); if (h < lo) lo = h; if (h > hi) hi = h; }
    return (yearCache[y] = { lo: lo, hi: hi });
  }
  // rest share from the sun's height: 0 by day, 1 once civil dusk ends; a half-cosine in between (free-wheel, no hard switch)
  function restShare(h) {
    var hRise = DEG / 4 - Z_RISE, x = (h - H_CIVIL) / (hRise - H_CIVIL);
    x = Math.max(0, Math.min(1, x));
    return (1 + Math.cos(Math.PI * x)) / 2;
  }

  // the pumps: each clock's period (days), swing ratio and cos(2*pi*phase), at this moment
  function pumps(date) {
    date = date || new Date();
    var T = (jd(date) - JD_2000) / CENTURY;
    var h = lin(L_SUN, T), s = lin(L_MOON, T), D = lin(D_ELONG, T), Mm = lin(M_MOON, T), Ms = lin(M_SUN, T) * RAD;
    var lam = norm(h + C_SUN[0] * Math.sin(Ms) + C_SUN[1] * Math.sin(2 * Ms) + C_SUN[2] * Math.sin(CUBE * Ms));   // Sun's true longitude
    var utH = (date.getTime() / MS_DAY % 1) * HOURS;
    var t = norm(HDEG * utH + DEG / 2 + POINT.lon);                                // local mean solar hour angle (Doodson t)
    var tau = norm(t + h - s);                                                     // local mean lunar hour angle (Doodson tau)
    var span = yearSpan(date.getUTCFullYear()), hemi = POINT.lat < 0 ? -1 : 1;
    return [
      { id: "m2",         P: P.m2,      S: SWING.lunarTide,     c: Math.cos(2 * tau * RAD) },  // lunar tide clock: +1 at equilibrium high water
      { id: "s2",         P: P.s2,      S: SWING.solarTide,     c: Math.cos(2 * t * RAD) },    // solar tide clock
      { id: "springNeap", P: P.syn / 2, S: SWING.springNeap,    c: Math.cos(2 * D * RAD) },    // +1 at new and full Moon (springs)
      { id: "perigee",    P: P.anom,    S: SWING.lunarTide,     c: Math.cos(Mm * RAD) },       // +1 at perigee
      { id: "year",       P: P.year,    S: span.hi / span.lo,   c: hemi * Math.sin(lam * RAD) } // +1 at this hemisphere's longest day
    ];
  }
  function weight(p, pOut) { return Math.pow(PHI, -Math.abs(Math.log(p / pOut)) / LNPHI); }
  var OUT = { warmth: P.year, calm: P.day };                                       // each output's own timescale
  // the one shared formula, as a share of its own peak (0 < share <= 1)
  function share(name, date) {
    var pOut = OUT[name], f = 1;
    pumps(date).forEach(function (p) { f *= Math.pow(p.S, weight(p.P, pOut) * (p.c - 1) / 2); });
    return f;
  }
  function output(name, base, date) {
    date = date || new Date();
    var v = base * share(name, date);
    if (name === "calm") v *= restShare(sunHeight(date));
    return v;
  }

  // ---- WCAG safe-side floor ----
  // CSS Filter Effects 1 matrices for sepia() and saturate(); WCAG 2.2 relative luminance and contrast ratio.
  var SEPIA = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]; // cite: W3C Filter Effects Level 1, sepia() matrix at amount 1
  var LUMA = [0.2126, 0.7152, 0.0722];                                             // cite: WCAG 2.2 relative luminance (sRGB / Rec. 709)
  var SRGB = [0.04045, 12.92, 0.055, 1.055, 2.4], FLARE = 0.05, AA = 4.5;          // cite: WCAG 2.2 / IEC 61966-2-1 sRGB transfer; contrast-ratio flare term; SC 1.4.3 AA
  var CH = 255;                                                                    // unit: 8-bit colour channel full scale
  function mat(m, c) { return [0, 1, 2].map(function (i) { return m[i][0] * c[0] + m[i][1] * c[1] + m[i][2] * c[2]; }); }
  function sepiaM(a) {                                                             // Filter Effects: identity blended toward SEPIA by a
    return [0, 1, 2].map(function (i) { return [0, 1, 2].map(function (j) { return (i === j ? 1 - a : 0) + a * SEPIA[i][j]; }); });
  }
  function satM(s) {                                                               // Filter Effects saturate(): luma rows + s x (identity - luma)
    return [0, 1, 2].map(function (i) { return [0, 1, 2].map(function (j) { return LUMA[j] + s * ((i === j ? 1 : 0) - LUMA[j]); }); });
  }
  function lum(c) {
    return [0, 1, 2].reduce(function (L, i) { var v = Math.max(0, Math.min(1, c[i] / CH));
      v = v <= SRGB[0] ? v / SRGB[1] : Math.pow((v + SRGB[2]) / SRGB[3], SRGB[4]); return L + LUMA[i] * v; }, 0);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + FLARE) / (Math.min(x, y) + FLARE); }
  function tinted(bg, warm, calm) { return mat(satM(1 - calm), mat(sepiaM(warm), bg)); }
  // steps warm and calm down together by PHI until the pair keeps min(its own contrast, AA); closed after the last rung
  function wcagFloor(bg, fg, warm, calm, rungs) {
    if (!bg || !fg) return { warm: warm, calm: calm, k: 0 };
    var need = Math.min(contrast(bg, fg), AA);
    for (var k = 0; k <= rungs; k++) {
      var f = Math.pow(IP, k);
      if (contrast(tinted(bg, warm * f, calm * f), fg) >= need) return { warm: warm * f, calm: calm * f, k: k };
    }
    return { warm: 0, calm: 0, k: rungs + 1 };
  }

  function clocks(date) {
    date = date || new Date();
    var h = sunHeight(date), span = yearSpan(date.getUTCFullYear()), hrs = dayLength(date), ps = pumps(date);
    var o = { asserted: "asserted, not verified", point: POINT, sunHeight: h, rest: restShare(h), dayHours: hrs,
              dayRatio: span.hi > span.lo ? (hrs - span.lo) / (span.hi - span.lo) : 0, swing: SWING, pumps: {} };
    ps.forEach(function (p) { o.pumps[p.id] = { periodDays: p.P, swing: p.S, cos: p.c, wWarmth: weight(p.P, OUT.warmth), wCalm: weight(p.P, OUT.calm) }; });
    o.warmthShare = share("warmth", date); o.calmShare = share("calm", date);
    return o;
  }

  var WHITE = [CH, CH, CH];                                                        // cite: CSS Backgrounds, the canvas is white when nothing paints it
  var api = { PHI: PHI, POINT: POINT, WHITE: WHITE, clocks: clocks, pumps: pumps, weight: weight, share: share, output: output,
              sunHeight: sunHeight, dayLength: dayLength, restShare: restShare, contrast: contrast, tinted: tinted, wcagFloor: wcagFloor };
  if (root && !root.SeasonPumps) root.SeasonPumps = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : this);
