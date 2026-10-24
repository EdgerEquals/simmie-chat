/* Rebella footer (live). The safe items from Bonnie's Dashboard footer, adapted for the public and personalised ON
   THIS DEVICE ONLY: status lights (Sky, Time, Radio, Device), a waveform that follows the radio's beat, a time-of-day
   gauge, a critters strip (moon phase), the fun-fact ticker (#bar-line, which is also the help orb's footer slot), an animal lane and Pause motion.
   The nickname controls inside the footer are run by js/bars.js, unchanged.
   PRIVACY: no accounts, no cookies, nothing is sent anywhere. The only request is the Perth forecast from Open-Meteo
   (fixed Perth coordinates, never the device location, no credentials, no referrer), cached for 30 minutes.
   localStorage: 'rebella.footer.weather' (that cache) and 'rebella.footer.pause' (only if Pause motion is pressed).
   It only READS the nickname via window.RebellaVisitor and listens to the radio's own 'rebella:station' / 'rebella:radio'
   events. It never reads Bonnie's Dashboard, the age dial, the queue, messages, simmie-chat data or ntfy.
   TIMING (/home/box/.config/phi-timing-rules.md, Bonnie ladder): light blinks PHI^2, facts PHI^4 (PHI^5 for long ones),
   animals every PHI^5 crossing in PHI^4, wave breathes PHI^5 (4 beats when the radio plays), golden-angle offsets,
   weather sweep s read at each cycle boundary. Reduced motion: nothing moves, facts swap in place. */
(function () {
  'use strict';
  var foot = document.getElementById('app-foot');
  if (!foot || !foot.querySelector('.fb-row') || foot.getAttribute('data-fb')) return;
  foot.setAttribute('data-fb', '1');
  var KEYS = { wx: 'rebella.footer.weather', pause: 'rebella.footer.pause' };
  var PHI = 1.6180339887, G = 0.6180339887, TTL = 30 * 60 * 1000;
  var WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-31.95&longitude=115.86&current=weather_code,temperature_2m,is_day&timezone=Australia%2FPerth';
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var $ = function (s) { return foot.querySelector(s); };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function frac(x) { return x - Math.floor(x); }

  /* weather sweep (rule 6): only once weather is known; deep night 00:00-05:00 Perth = +2 */
  var SWEEP = { hot: -1, sun: -0.5, storm: 0, cloud: 0, rain: 0.5, fog: 1, night: 1.5 };
  var wxKey = null, wxState = 'loading', wxTemp = null;
  function perthHour() { try { return Number(new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', hourCycle: 'h23' }).format(new Date())); } catch (e) { return new Date().getHours(); } }
  function sweep() { if (RM.matches || !wxKey) return 0; return perthHour() < 5 ? 2 : (SWEEP[wxKey] || 0); }
  function period(n) { return Math.pow(PHI, n + sweep()); }

  function myName() { try { var r = window.RebellaVisitor && window.RebellaVisitor.load(); return r && r.name ? r.name : ''; } catch (e) { return ''; } }
  function light(name, state, label) { var L = foot.querySelector('[data-l="' + name + '"]'); if (!L) return; L.className = 'fb-light ' + state; L.setAttribute('aria-label', label); }
  function partOfDay(h) { return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; }

  var SETS = { sun: ['\u2600\uFE0F', 'sunny'], hot: ['\uD83C\uDF1E', 'hot'], cloud: ['\u26C5', 'cloudy'], fog: ['\uD83C\uDF2B\uFE0F', 'foggy'],
               rain: ['\uD83C\uDF27\uFE0F', 'raining'], storm: ['\u26C8\uFE0F', 'stormy'], night: ['\uD83C\uDF19', 'a clear night'] };
  function mood(code, isDay, temp) {
    code = Number(code);
    if (code >= 95) return 'storm';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 45 || code === 48) return 'fog';
    if (code <= 1) return isDay === 0 ? 'night' : (temp >= 30 ? 'hot' : 'sun');
    return 'cloud';
  }
  // the Sky light left the footer (24 Oct 2026: weather in the header only); the forecast is still fetched here for the header + sweep
  function lightSky() {
    light('sky', wxState === 'ok' ? 'ok' : wxState === 'fail' ? 'warn' : 'idle',
      wxState === 'ok' ? 'Sky: Perth is ' + SETS[wxKey][1] + ', ' + wxTemp + ' degrees' : wxState === 'fail' ? 'Sky: the Perth weather couldn\u2019t load' : 'Sky: loading the Perth weather');
  }
  function applyWx(c) { wxState = 'ok'; wxTemp = Math.round(c.temp); wxKey = mood(c.code, c.isDay, c.temp); lightSky(); document.dispatchEvent(new CustomEvent('rebella:weather', { detail: { key: wxKey, temp: wxTemp } })); }
  function loadWx() {
    var c = null; try { c = JSON.parse(get(KEYS.wx)); } catch (e) {}
    if (c && Date.now() - c.t < TTL) { applyWx(c); return; }
    if (!window.fetch) { wxState = 'fail'; lightSky(); return; }
    fetch(WX_URL, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var cur = j && j.current; if (!cur) throw 0; var d = { t: Date.now(), code: cur.weather_code, temp: cur.temperature_2m, isDay: cur.is_day }; set(KEYS.wx, JSON.stringify(d)); applyWx(d); })
      .catch(function () { wxState = 'fail'; lightSky(); });
  }

  function clock() {
    var d = new Date(), p = partOfDay(d.getHours()), f = (d.getHours() * 60 + d.getMinutes()) / 1440;
    light('time', 'ok t-' + p, 'Time: it\u2019s ' + p + ' where you are');
    var n = $('.g-needle'); if (n) n.setAttribute('transform', 'rotate(' + (-90 + f * 180).toFixed(1) + ' 16 16)');
    var g = $('.fb-gauge'); if (g) g.setAttribute('aria-label', 'Time of day gauge: ' + Math.round(f * 100) + '% through your day');
  }
  var radio = { on: false, label: '', bpm: 0 };
  function lightRadio() { light('radio', radio.on ? 'ok' : 'idle', radio.on ? 'Radio: playing' + (radio.label ? ' ' + radio.label : '') : 'Radio: off' + (radio.label ? ', tuned to ' + radio.label : '')); }
  function lightDevice() { var n = myName(); light('device', n ? 'ok' : 'idle', n ? 'Device: your name is kept on this device only' : 'Device: nothing saved'); }
  function wave() {
    var w = $('.fb-wave'); if (!w) return;
    var p = radio.on && radio.bpm ? (60 / radio.bpm) * 4 : period(5);
    w.style.setProperty('--fb-wave-t', p.toFixed(3) + 's'); w.classList.toggle('beat', radio.on && !!radio.bpm);
  }
  document.addEventListener('rebella:station', function (e) { var d = e.detail || {}; radio.label = d.label || ''; radio.bpm = Number(d.bpm) || 0; lightRadio(); wave(); });
  document.addEventListener('rebella:radio', function (e) { radio.on = !!(e.detail && e.detail.playing); lightRadio(); wave(); });

  // light blinks: PHI^2, golden-angle offsets k=1..4; a new sweep lands at the next cycle boundary
  var bs = foot.querySelectorAll('.fb-light b');
  function blinkT() { var p = period(2); Array.prototype.forEach.call(bs, function (b) { b.style.animationDuration = p + 's'; }); }
  Array.prototype.forEach.call(bs, function (b, i) { var p = period(2); b.style.animationDuration = p + 's'; b.style.animationDelay = -(p * frac((i + 1) * G)) + 's'; });
  if (bs[0]) bs[0].addEventListener('animationiteration', blinkT);

  /* fun-fact ticker in #bar-line (the help orb borrows this line; never write while it is busy) */
  var FACTS = [
    'A teaspoon of neutron star would weigh about a billion tonnes',
    'Octopuses can taste with their suckers',
    'Quokkas live on Rottnest Island, just off Perth',
    'Sunlight takes about 8 minutes 20 seconds to reach you',
    'Crows can recognise human faces and remember them for years',
    'Shark Bay\u2019s stromatolites are living relatives of some of Earth\u2019s oldest life',
    'There are more ways to shuffle a deck of cards than atoms on Earth',
    'Your brain releases dopamine at the best bit of a favourite song',
    'About half the oxygen you breathe comes from tiny ocean plankton',
    'Teen brains keep rewiring until the mid-20s, and that\u2019s totally normal',
    'Zircon crystals from WA\u2019s Jack Hills are about 4.4 billion years old',
    'A group of flamingos is called a flamboyance',
    'Honey can stay edible for thousands of years',
    'Saturn is less dense than water, so it would float in a giant bath'
  ];
  var tick = $('.fb-tick'), tt = document.getElementById('bar-line');
  var FIRST = tt ? tt.textContent : '';
  var fi = Math.floor(Date.now() / 864e5) % FACTS.length, step = 0, tickTimer = null, laneTimer = null;
  var paused = get(KEYS.pause) === '1';
  function busy() { return !tt || tt.hasAttribute('data-help-busy') || foot.classList.contains('help-answering'); }
  function nextLine() {
    step++;
    var n = myName();
    if (step % 5 === 0 && radio.label) return 'Tuned to ' + radio.label + (radio.bpm ? ' \u00B7 ' + radio.bpm + ' BPM' : '');
    if (step % 11 === 0) return (n ? n + ', you' : 'You') + '\u2019re made for curious things';
    return 'Fun fact: ' + FACTS[(fi++) % FACTS.length];
  }
  function showLine(s) {
    tt.classList.remove('fb-pan'); tt.style.removeProperty('--fb-pan');
    tt.textContent = s;
    var over = tt.scrollWidth - tick.clientWidth;
    if (over > 4 && !RM.matches && !paused) {
      tt.style.setProperty('--fb-pan', -over + 'px'); tt.style.setProperty('--fb-pan-t', Math.max(period(3), over / 24).toFixed(2) + 's');
      void tt.offsetWidth; tt.classList.add('fb-pan');
    }
  }
  function cycle() {
    clearTimeout(tickTimer);
    if (paused) return;
    var long = false;
    if (!document.hidden && !busy()) {
      var s = nextLine(); long = s.length > 48;
      if (RM.matches) showLine(s);
      else { tt.classList.add('fading'); setTimeout(function () { if (!busy()) showLine(s); tt.classList.remove('fading'); }, 618); }
    }
    tickTimer = setTimeout(cycle, period(long ? 5 : 4) * 1000);
  }

  /* critters strip (24 Oct 2026): animals and critters only, in the spot the Sky light had. Header emoji = Perth weather + time of
     day; this one uses a different source: the Moon's phase (days since a known new moon, 29.53-day cycle, worked out here from
     the date, no request) picks the order, and the phi clock scrolls it: PHI^8 s (46.98 s) per loop, golden-angle start, not
     swept (it's the marquee slot of the weather loop family, like the dashboard's). New order lands at the next loop boundary.
     Pause motion / reduced motion: still. */
  var CRITTERS = ['\uD83E\uDD8A', '\uD83D\uDC28', '\uD83E\uDD98', '\uD83D\uDC19', '\uD83E\uDD8E', '\uD83D\uDC1E', '\uD83D\uDC38', '\uD83E\uDD94', '\uD83D\uDC0C', '\uD83E\uDD89'];
  function moonStep() { var age = ((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853; if (age < 0) age += 29.530588853; return Math.floor(age / 29.530588853 * CRITTERS.length); }
  var crit = $('.fb-crit-track'), critStep = -1;
  function critters() {
    if (!crit) return;
    var m = moonStep(); if (m === critStep) return; critStep = m;
    var row = CRITTERS.slice(m).concat(CRITTERS.slice(0, m)).join(' ');
    crit.textContent = '';
    for (var k = 0; k < 2; k++) { var h = document.createElement('span'); h.className = 'fb-crit-half'; h.textContent = row + ' '; crit.appendChild(h); }
  }
  if (crit) {
    var CT = Math.pow(PHI, 8);
    crit.style.animationDuration = CT.toFixed(2) + 's'; crit.style.animationDelay = -(CT * frac(1 * G)).toFixed(2) + 's';
    crit.addEventListener('animationiteration', critters);
    critters();
  }

  /* animal lane: one crosses every PHI^5 s, in PHI^4 s (transform only, decorative) */
  var ANIMALS = ['\uD83D\uDC07', '\uD83E\uDD8B', '\uD83D\uDC22', '\uD83D\uDC26', '\uD83D\uDC1E', '\uD83E\uDD94'], ai = 0, lane = $('.fb-lane');
  function animal() {
    clearTimeout(laneTimer);
    if (paused) return;
    if (!RM.matches && !document.hidden && lane && lane.offsetWidth) {
      var a = document.createElement('span'), rtl = ai % 2 === 1, w = lane.offsetWidth;
      a.className = 'fb-actor'; a.textContent = ANIMALS[ai % ANIMALS.length]; ai++;
      a.style.setProperty('--from', (rtl ? w + 24 : -24) + 'px'); a.style.setProperty('--to', (rtl ? -24 : w + 24) + 'px');
      a.style.setProperty('--flip', rtl ? '1' : '-1'); a.style.animationDuration = period(4).toFixed(3) + 's';
      a.addEventListener('animationend', function () { a.remove(); });
      lane.appendChild(a);
    }
    laneTimer = setTimeout(animal, period(5) * 1000);
  }

  /* Pause motion (WCAG 2.2.2), remembered on this device only if pressed */
  var pb = $('.fb-pause');
  function applyPause() {
    foot.classList.toggle('fb-paused', paused);
    pb.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pb.querySelector('.fb-pl').textContent = paused ? 'Play motion' : 'Pause motion';
    pb.setAttribute('aria-label', paused ? 'Play motion in the footer' : 'Pause motion in the footer');
    if (paused) { clearTimeout(tickTimer); clearTimeout(laneTimer); if (lane) lane.innerHTML = ''; tt.classList.remove('fb-pan', 'fading'); }
  }
  pb.addEventListener('click', function () {
    paused = !paused; set(KEYS.pause, paused ? '1' : null); applyPause();
    if (!paused) { tickTimer = setTimeout(cycle, period(4) * 1000 * frac(G)); laneTimer = setTimeout(animal, period(5) * 1000 * frac(G)); }
  });

  /* start */
  clock(); lightSky(); lightRadio(); lightDevice(); wave(); applyPause();
  if (!paused) { tickTimer = setTimeout(cycle, period(4) * 1000); laneTimer = setTimeout(animal, period(5) * 1000 * frac(G)); }
  loadWx();
  setTimeout(function () { clock(); setInterval(clock, 60000); }, (60 - new Date().getSeconds()) * 1000);
  foot.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#vn-save,#vn-forget')) setTimeout(lightDevice, 50); });
  var vin = document.getElementById('vn-in'); if (vin) vin.addEventListener('keydown', function (e) { if (e.key === 'Enter') setTimeout(lightDevice, 50); });
  window.addEventListener('storage', function (e) { if (e.key === 'rebella-visitor' || e.key === null) lightDevice(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !paused) { cycle(); animal(); } });
  window.RebellaFooter = { keys: KEYS, first: FIRST };
})();
