/* Rebella header chips (PREVIEW only, branch rebella-dashboard-bars). The safe, STATIC items from Bonnie's Dashboard
   header, personalised on this device only. Nothing in the header animates: no entrance motion, no transitions.
   - Greeting chip: time of day from the device clock + the on-device nickname (read via window.RebellaVisitor,
     js/bars.js). Text updates in place once a minute.
   - Perth weather chip: icon, temperature, label. It makes NO request of its own: it uses the footer's Perth
     forecast (js/footbar.js dispatches 'rebella:weather', and caches it in localStorage 'rebella.footer.weather').
   Also floats the help orb bottom-right above "Get me out" (preview CSS in css/dashbars.css).
   Nothing is sent anywhere. No cookies. */
(function () {
  'use strict';
  var head = document.getElementById('app-head');
  if (!head || head.getAttribute('data-audience') !== 'visitor' || head.querySelector('.db-chips')) return;
  var SETS = { sun: ['\u2600\uFE0F', 'Sunny'], hot: ['\uD83C\uDF1E', 'Hot'], cloud: ['\u26C5', 'Cloudy'], fog: ['\uD83C\uDF2B\uFE0F', 'Foggy'],
               rain: ['\uD83C\uDF27\uFE0F', 'Rain'], storm: ['\u26C8\uFE0F', 'Storm'], night: ['\uD83C\uDF19', 'Clear night'] };
  var chips = document.createElement('span'); chips.className = 'db-chips';
  var hello = document.createElement('span'); hello.className = 'db-chip db-hello'; hello.setAttribute('data-help', 'db-hello');
  var wx = document.createElement('span'); wx.className = 'db-chip db-wx'; wx.setAttribute('data-help', 'db-weather'); wx.setAttribute('role', 'img'); wx.hidden = true;
  chips.appendChild(hello); chips.appendChild(wx);
  var tb = head.querySelector('.topbar .container'); if (!tb) return;
  tb.insertBefore(chips, tb.querySelector('.bar-links'));
  function name() { try { var r = window.RebellaVisitor && window.RebellaVisitor.load(); return r && r.name ? r.name : ''; } catch (e) { return ''; } }
  function paint() {
    var d = new Date(), h = d.getHours(), n = name();
    var w = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    var t = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    hello.textContent = w + (n ? ', ' + n : '') + ' \u00B7 ' + t;
  }
  function paintWx(key, temp) {
    var s = SETS[key]; if (!s) return;
    wx.innerHTML = '<span aria-hidden="true">' + s[0] + '</span><span class="db-wx-p"> Perth</span> ' + temp + '\u00B0<span class="db-wx-l"> ' + s[1] + '</span>';
    wx.setAttribute('aria-label', 'Perth weather: ' + s[1] + ', ' + temp + ' degrees'); wx.hidden = false;
  }
  document.addEventListener('rebella:weather', function (e) { if (e.detail) paintWx(e.detail.key, e.detail.temp); });
  function mood(code, isDay, temp) { code = Number(code); if (code >= 95) return 'storm'; if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 45 || code === 48) return 'fog'; if (code <= 1) return isDay === 0 ? 'night' : (temp >= 30 ? 'hot' : 'sun'); return 'cloud'; }
  try { var c = JSON.parse(localStorage.getItem('rebella.footer.weather')); if (c && Date.now() - c.t < 30 * 60 * 1000) paintWx(mood(c.code, c.isDay, c.temp), Math.round(c.temp)); } catch (e) {}
  paint();
  setTimeout(function () { paint(); setInterval(paint, 60000); }, (60 - new Date().getSeconds()) * 1000);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#vn-save,#vn-forget')) setTimeout(paint, 50); });
  var vin = document.getElementById('vn-in'); if (vin) vin.addEventListener('keydown', function (e) { if (e.key === 'Enter') setTimeout(paint, 50); });
  window.addEventListener('storage', function () { paint(); });
  function esc() { var x = document.querySelector('.escape'); if (x && x.offsetHeight) document.documentElement.style.setProperty('--rb-escape-h', x.offsetHeight + 'px'); }
  esc(); window.addEventListener('resize', esc);
})();
