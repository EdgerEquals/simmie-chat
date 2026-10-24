/* Rebella header in the dashboard layout (live 24 Oct 2026, Danny 03:01-03:03 AWST). Markup: _bars.py visitor_header,
   styles: css/dashbars.css. Everything here talks to the reader ("you") and uses their nickname once they've given one.
   - Fun-fact ticker (ticker band, like the dashboard's): "Fun fact for you, <name>: ...", plus a Perth weather line.
     It scrolls slowly on a PHI^10 s loop (weather sweep s added, new s at the next loop boundary, golden-angle start).
     Footer "Pause motion" and reduced motion stop it (reduced motion: still text you can swipe along).
   - Emoji set: one still state from the Perth weather mood + the time of day. Only changes when that state changes.
   - Perth weather chip: links to the Bureau of Meteorology Perth forecast (new tab). Wide screens get a sentence for you
     ("Sam, it's 10° and a clear night in Perth · jacket weather"). No request of its own: it reuses the footer's Perth
     forecast (js/footbar.js 'rebella:weather' event + its 30-minute cache 'rebella.footer.weather').
   - Time chip (wide screens): good morning/afternoon/evening + the time on your device.
   - Occasional name prompt, INLINE in the bottom row (not a pop-up): first visit, then no more than once every PHI^18 s
     (about 96 minutes); after "No thanks" it stays away for PHI^28 s (about 8 days); never once a name is set.
     It saves through window.RebellaVisitor (js/bars.js): the same on-device key 'rebella-visitor' and checks as the footer.
     'rebella.header.ask' keeps only times ({t, no}), never the name.
   - Phone menu: "Hi <name>! change / forget my name", or "Want me to call you something?".
   The name is only ever put on the page with textContent. Nothing is sent anywhere. No cookies. No location. */
(function () {
  'use strict';
  var head = document.getElementById('app-head');
  if (!head || head.getAttribute('data-audience') !== 'visitor' || head.getAttribute('data-hd-ready')) return;
  var hud = head.querySelector('.wx-hud'); if (!hud) return;
  head.setAttribute('data-hd-ready', '1');
  var PHI = 1.6180339887, G = 0.6180339887;
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var $ = function (s) { return head.querySelector(s); };
  var emo = $('.hd-emoji'), hello = $('.db-hello'), wx = $('.db-wx'), greet = document.getElementById('bar-greet');
  var tick = $('#hd-ticker'), track = $('#hd-tick-track');
  var ask = $('#hd-ask'), askQ = $('#hd-ask-q'), askIn = $('#hd-ask-in'), mast = $('.masthead');
  var drYou = document.getElementById('dr-you');
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function frac(x) { return x - Math.floor(x); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function name() { try { var r = window.RebellaVisitor && window.RebellaVisitor.load(); return r && r.name ? r.name : ''; } catch (e) { return ''; } }

  // same sets as the dashboard header (icon, label, faces x3, gifts) + the words used in sentences for you
  var SETS = {
    sun:   ['\u2600\uFE0F', 'Sunny', ['\uD83D\uDE04', '\uD83E\uDD29', '\uD83D\uDE0E'], ['\uD83D\uDD76\uFE0F', '\uD83C\uDF66'], 'and sunny'],
    hot:   ['\uD83C\uDF1E', 'Hot', ['\uD83D\uDE04', '\uD83E\uDD29', '\uD83D\uDE0E'], ['\uD83C\uDFD6\uFE0F', '\uD83C\uDF66'], 'and hot'],
    cloud: ['\u26C5', 'Cloudy', ['\uD83D\uDE10', '\uD83E\uDDD0', '\uD83D\uDE34'], ['\uD83C\uDFA7', '\uD83E\uDDE6'], 'and cloudy'],
    fog:   ['\uD83C\uDF2B\uFE0F', 'Foggy', ['\uD83D\uDE0C', '\uD83E\uDD14', '\uD83D\uDE34'], ['\uD83E\uDDE3', '\uD83D\uDD26'], 'and foggy'],
    rain:  ['\uD83C\uDF27\uFE0F', 'Rain', ['\uD83E\uDD7A', '\uD83E\uDD14', '\uD83E\uDD79'], ['\u2602\uFE0F', '\u2615'], 'and rainy'],
    storm: ['\u26C8\uFE0F', 'Storm', ['\uD83E\uDD17', '\uD83E\uDEE3', '\uD83D\uDE2E'], ['\uD83E\uDEC2', '\uD83C\uDF6B'], 'and stormy'],
    night: ['\uD83C\uDF19', 'Clear night', ['\uD83D\uDE0C', '\uD83E\uDD70', '\uD83E\uDD29'], ['\u2728', '\uD83E\uDD89'], 'on a clear night']
  };
  function mood(code, isDay, temp) { code = Number(code); if (code >= 95) return 'storm'; if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 45 || code === 48) return 'fog'; if (code <= 1) return isDay === 0 ? 'night' : (temp >= 30 ? 'hot' : 'sun'); return 'cloud'; }
  function advice(key, t) {
    if (key === 'storm') return 'stay-in-and-get-cosy weather';
    if (key === 'rain') return 'umbrella weather';
    if (t <= 12) return 'jacket weather'; if (t <= 18) return 'hoodie weather'; if (t <= 26) return 't-shirt weather';
    if (t <= 32) return 'hat and water bottle weather'; return 'stay-in-the-shade weather';
  }
  var wxKey = null, wxTemp = null, emoState = '';
  function wxLine(n) {   // "Sam, it's 10° on a clear night in Perth · jacket weather"
    if (!wxKey) return '';
    return (n ? n + ', it\u2019s ' : 'It\u2019s ') + wxTemp + '\u00B0 ' + SETS[wxKey][4] + ' in Perth \u00B7 ' + advice(wxKey, wxTemp);
  }

  /* ---------- emoji set (still) ---------- */
  function slot(h) { return h < 12 ? 0 : h < 18 ? 1 : 2; }   // morning / afternoon / evening+night face
  function paintEmoji() {
    if (!emo || !wxKey) return;
    var s = SETS[wxKey], f = slot(new Date().getHours()), state = wxKey + ':' + f;
    if (state === emoState) return;
    emoState = state; emo.textContent = '';
    [s[2][f], s[3][0], s[3][1], s[0]].forEach(function (ch, i) { emo.appendChild(el('span', i === 0 ? 'f' : i === 3 ? 'w' : 'g' + i, ch)); });
    emo.hidden = false;
  }
  /* ---------- time chip ---------- */
  function paintClock() {
    var d = new Date(), h = d.getHours();
    var w = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    if (hello) { hello.textContent = w + ' \u00B7 ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }); hello.hidden = false; }
    paintEmoji();
  }
  /* ---------- weather chip ---------- */
  var wxPainted = '';
  function paintWx() {
    if (!wx || !wxKey) return;
    var n = name(), s = SETS[wxKey], line = wxLine(n), sig = line + '|' + n;
    if (sig === wxPainted) return; wxPainted = sig;
    wx.textContent = '';
    var c = el('span', 'db-wx-c'); c.appendChild(el('span', null, s[0])); c.setAttribute('aria-hidden', 'true');
    c.appendChild(el('span', 'db-wx-p', 'Perth')); c.appendChild(document.createTextNode(' ' + wxTemp + '\u00B0')); c.appendChild(el('span', 'db-wx-l', ' ' + s[1]));
    var w = el('span', 'db-wx-s', s[0] + ' ' + line); w.setAttribute('aria-hidden', 'true');
    wx.appendChild(c); wx.appendChild(w); wx.appendChild(el('span', 'db-wx-go', ' \u2197')).setAttribute('aria-hidden', 'true');
    wx.setAttribute('aria-label', line + '. Opens the Bureau of Meteorology Perth forecast in a new tab');
    wx.hidden = false;
  }
  function onWx(key, temp) {
    if (!SETS[key]) return;
    if (key === wxKey && temp === wxTemp) return;
    wxKey = key; wxTemp = temp; paintWx(); paintEmoji(); queueTicker();
  }

  /* ---------- fun-fact ticker ---------- */
  var FACTS = [   // same facts as the footer ticker (js/footbar.js)
    'a teaspoon of neutron star would weigh about a billion tonnes',
    'octopuses can taste with their suckers',
    'quokkas live on Rottnest Island, just off Perth',
    'sunlight takes about 8 minutes 20 seconds to reach you',
    'crows can recognise human faces and remember them for years',
    'Shark Bay\u2019s stromatolites are living relatives of some of Earth\u2019s oldest life',
    'there are more ways to shuffle a deck of cards than atoms on Earth',
    'your brain releases dopamine at the best bit of a favourite song',
    'about half the oxygen you breathe comes from tiny ocean plankton',
    'teen brains keep rewiring until the mid-20s, and that\u2019s totally normal',
    'zircon crystals from WA\u2019s Jack Hills are about 4.4 billion years old',
    'a group of flamingos is called a flamboyance',
    'honey can stay edible for thousands of years',
    'Saturn is less dense than water, so it would float in a giant bath'
  ];
  var SWEEP = { hot: -1, sun: -0.5, storm: 0, cloud: 0, rain: 0.5, fog: 1, night: 1.5 };
  function perthHour() { try { return Number(new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Perth', hour: 'numeric', hourCycle: 'h23' }).format(new Date())); } catch (e) { return new Date().getHours(); } }
  function sweep() { if (RM.matches || !wxKey) return 0; return perthHour() < 5 ? 2 : (SWEEP[wxKey] || 0); }
  function loopT() { return Math.pow(PHI, 10 + sweep()); }   // PHI^10 = 122.99 s per loop at s = 0
  function lines() {
    var n = name(), start = Math.floor(Date.now() / 864e5) % FACTS.length, out = [];
    for (var i = 0; i < 8; i++) {
      var f = FACTS[(start + i) % FACTS.length];
      out.push((n && i % 3 === 0 ? 'Fun fact for you, ' + n + ': ' : 'Fun fact for you: ') + f);
      if (i === 2 && wxKey) out.push(wxLine(n));
    }
    if (!RM.matches) out.push((n ? n + ', you\u2019re' : 'You\u2019re') + ' made for curious things');
    return out;
  }
  function half(ls, hidden) {
    var h = el('span', 'hd-tick-half'); if (hidden) h.setAttribute('aria-hidden', 'true');
    ls.forEach(function (l, i) { if (i) h.appendChild(el('span', 'hd-tick-sep', ' \u2726 ')).setAttribute('aria-hidden', 'true'); h.appendChild(el('span', /^Fun fact/.test(l) ? 'hd-tick-f' : 'hd-tick-w', l)); });
    return h;
  }
  var tickSig = '', pending = false, curT = 0;
  function buildTicker() {
    if (!track) return;
    pending = false;
    var ls = lines(), sig = ls.join('|') + (RM.matches ? '|rm' : '');
    if (sig === tickSig) return; tickSig = sig;
    track.textContent = '';
    track.appendChild(half(ls, false));
    if (!RM.matches) track.appendChild(half(ls, true));     // seamless loop: second copy, hidden from screen readers
    timeTicker(true);
  }
  function timeTicker(first) {
    var t = loopT();
    if (first || Math.abs(t - curT) > 0.01) {
      curT = t; track.style.setProperty('--hd-tick-t', t.toFixed(2) + 's');
      if (first) track.style.setProperty('--hd-tick-d', (-t * frac(1 * G)).toFixed(2) + 's');   // golden-angle start, k = 1
    }
  }
  // new text / new sweep land at the next loop boundary, so the line never jumps mid-read
  function queueTicker() { if (RM.matches || paused()) buildTicker(); else pending = true; }
  if (track) track.addEventListener('animationiteration', function () { if (pending) { tickSig = ''; buildTicker(); } else timeTicker(false); });
  function paused() { return get('rebella.footer.pause') === '1'; }
  function syncPause() { head.classList.toggle('hd-paused', paused()); }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.fb-pause')) setTimeout(syncPause, 0); });
  if (RM.addEventListener) RM.addEventListener('change', function () { tickSig = ''; buildTicker(); });

  /* ---------- occasional inline name prompt ---------- */
  var ASK_KEY = 'rebella.header.ask', EVERY = Math.pow(PHI, 18) * 1000, QUIET = Math.pow(PHI, 28) * 1000;   // ~96 min, ~8.2 days
  var askOn = false;
  function askRec() { try { var o = JSON.parse(get(ASK_KEY)); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function note(fields) { var o = askRec(); for (var k in fields) o[k] = fields[k]; return set(ASK_KEY, JSON.stringify({ t: o.t || 0, no: o.no || 0 })); }
  function due() {
    if (name() || !window.RebellaVisitor) return false;
    var o = askRec(), now = Date.now();
    if (o.no && now - o.no < QUIET) return false;
    if (o.t && now - o.t < EVERY) return false;
    return true;
  }
  var Q0 = askQ ? askQ.innerHTML : '';
  function showAsk(prefill, focus) {
    if (!ask) return;
    askQ.innerHTML = Q0; askQ.classList.remove('err'); askIn.value = prefill || ''; askIn.removeAttribute('aria-invalid');
    ask.hidden = false; mast.classList.add('asking'); askOn = true;
    if (focus) { try { askIn.focus({ preventScroll: true }); } catch (e) { askIn.focus(); } }
  }
  function hideAsk() { if (!ask) return; ask.hidden = true; mast.classList.remove('asking'); askOn = false; }
  function saveAsk() {
    var why = window.RebellaVisitor ? window.RebellaVisitor.set(askIn.value) : 'empty';
    if (why === 'empty') { askIn.focus(); return; }
    if (why) { askQ.textContent = why; askQ.classList.add('err'); askIn.setAttribute('aria-invalid', 'true'); return; }
    note({ t: Date.now() }); hideAsk();
    try { greet.setAttribute('tabindex', '-1'); greet.focus({ preventScroll: true }); } catch (e) {}
  }
  if (ask) {
    $('#hd-ask-save').addEventListener('click', saveAsk);
    $('#hd-ask-no').addEventListener('click', function () { note({ no: Date.now(), t: Date.now() }); hideAsk(); });
    askIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); saveAsk(); }
      else if (e.key === 'Escape') { e.preventDefault(); note({ t: Date.now() }); hideAsk(); }
    });
    askIn.addEventListener('input', function () { if (askQ.classList.contains('err')) { askQ.innerHTML = Q0; askQ.classList.remove('err'); askIn.removeAttribute('aria-invalid'); } });
    // first visit, then now and then: only if this device can remember that it asked (so it never nags on every page)
    if (due() && note({ t: Date.now() })) showAsk('', false);
  }

  /* ---------- phone menu line ---------- */
  function closeDrawer() { var d = document.getElementById('drawer'); if (d && d.classList.contains('open')) { var c = d.querySelector('[data-close-drawer]'); if (c) c.click(); } }
  function btn(text, fn) { var b = el('button', 'dr-you-b', text); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function paintDrawer() {
    if (!drYou || !window.RebellaVisitor) return;
    var n = name(); drYou.textContent = '';
    if (n) {
      drYou.appendChild(document.createTextNode('Hi ' + n + '! '));
      drYou.appendChild(btn('change', function () { closeDrawer(); showAsk(name(), true); }));
      drYou.appendChild(document.createTextNode(' / '));
      drYou.appendChild(btn('forget my name', function () { window.RebellaVisitor.forget(); }));
    } else drYou.appendChild(btn('Want me to call you something?', function () { closeDrawer(); showAsk('', true); }));
    drYou.hidden = false;
  }

  /* ---------- wiring ---------- */
  function onName() { if (name() && askOn && document.activeElement !== askIn) hideAsk(); paintWx(); paintDrawer(); queueTicker(); }
  document.addEventListener('rebella:visitor', onName);
  window.addEventListener('storage', function (e) { if (e.key === 'rebella-visitor' || e.key === null) onName(); if (e.key === 'rebella.footer.pause') syncPause(); });
  document.addEventListener('rebella:weather', function (e) { if (e.detail) onWx(e.detail.key, e.detail.temp); });
  try { var c = JSON.parse(get('rebella.footer.weather')); if (c && Date.now() - c.t < 30 * 60 * 1000) { wxKey = mood(c.code, c.isDay, c.temp); wxTemp = Math.round(c.temp); paintWx(); } } catch (e) {}
  syncPause(); buildTicker(); paintClock(); paintDrawer();
  setTimeout(function () { paintClock(); setInterval(paintClock, 60000); }, (60 - new Date().getSeconds()) * 1000);
})();
