/* Chat page side of the SHARED header/footer (Danny's shared-header rule, 24 Oct 2026). The dashboard's own scripts
   (dash/js/*, generated copies) do the header + footer; this file only gives them the chat page's scope:
   - start/stop: the dashboard scripts start on "rebella:status" and stop on "rebella:locked"; here those fire when the
     chat screen opens (after the password) and when it locks.
   - status lights (the dashboard's QUEUE/FRESH/LINK/SKY): SENT (her messages still waiting for Simmie), FRESH (when the
     thread last changed), LINK (browser online), DAD (an unanswered question from Dad). No weather in the footer.
   - message-status layer (phi rule 7): idle 11.09 s | new message 4.24 s | unread from Dad 2.62 s | urgent 1.62 s
     (Ask Dad window open, Simmie still replying in the terminal, or an unanswered question) via PhiTiming.setMsg.
   - footer emojis: Danny's shared critter list (03:18), minus the owl (it is in the header's night-weather gifts):
     ordered by the Moon's phase (computed from the date), scrolling on the PHI^8 marquee clock; never the weather (the header's source).
   Reads only page state (counts, classes), never message text. Sends nothing itself. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var CRITTERS = ['\uD83E\uDD8A', '\uD83D\uDC28', '\uD83E\uDD98', '\uD83D\uDC19', '\uD83E\uDD8E', '\uD83D\uDC1E', '\uD83D\uDC38', '\uD83E\uDD94', '\uD83D\uDC0C'];
  // 🦊 fox, 🐨 koala, 🦘 kangaroo, 🐙 octopus, 🦎 lizard, 🐞 ladybug, 🐸 frog, 🦔 hedgehog, 🐌 snail  (🦉 dropped: header uses it)
  var GAIT = ['il-trot', 'il-hop', 'il-hop', 'il-dog', 'il-trot', 'il-trot', 'il-hop', 'il-trot', 'il-trot'];
  var FACE = ['left', null, 'left', null, 'left', 'left', null, 'left', 'left'];
  var NAME = ['fox trot', 'koala hops', 'kangaroo hops', 'octopus bounce', 'lizard dash', 'ladybug scuttle', 'frog hops', 'hedgehog trot', 'snail glide'];
  // footer animal lane: the critters; the bird keeps flying in the header lane (its "glow" flag sends it there)
  window.ChatFootAnimals = function (orig) {
    var out = CRITTERS.map(function (e, i) { return { name: NAME[i], e: e, face: FACE[i], gait: GAIT[i] }; });
    (orig || []).forEach(function (a) { if (a.glow) out.splice(4, 0, a); });   // bird once per lap, in the header lane
    return out;
  };
  // footer emoji ticker: the Moon's phase, worked out on the device from the date (days since a known new moon, 29.53-day
  // cycle, no request), picks the starting critter; the strip scrolls on the existing --phi-marquee clock (PHI^8 = 46.98 s)
  // and a new order lands at the next loop boundary. Same source, epoch and loop as the Rebella + dashboard footers.
  function moonStep(n) { var a = ((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853; if (a < 0) a += 29.530588853; return Math.floor(a / 29.530588853 * n); }
  function paintCritters() {
    var tr = $('#wx-mq-track'); if (!tr) return;
    var k = moonStep(CRITTERS.length), row = CRITTERS.slice(k).concat(CRITTERS.slice(0, k)).join(' ') + '  \u00B7  ';
    if (tr.dataset.k === String(k) && tr.childNodes.length) return;
    tr.dataset.k = String(k); tr.textContent = '';
    for (var i = 0; i < 2; i++) { var s = document.createElement('span'); s.className = 'wx-mq-half'; s.textContent = new Array(3).join(row); tr.appendChild(s); }
  }
  document.addEventListener('animationiteration', function (ev) { if (ev.target && ev.target.id === 'wx-mq-track') paintCritters(); });

  // ---------- page state (counts and classes only) ----------
  var lastChange = Date.now(), fresh = 0;
  function state() {
    var log = $('#log'), mine = log ? log.querySelectorAll('.msg.me') : [], waiting = $('#typing') && !$('#typing').hidden;
    var pending = log ? log.querySelectorAll('.msg.me.pending').length : 0, failed = log ? log.querySelectorAll('.msg.me.failed').length : 0;
    var dadQ = log ? log.querySelectorAll('.msg.dad .choices:not(.done)').length : 0;
    var all = log ? log.querySelectorAll('.msg') : [], answered = 0;
    for (var i = 0; i < all.length; i++) if (all[i].classList.contains('me') && all[i + 1] && all[i + 1].classList.contains('them')) answered++;
    return { mine: mine.length, pending: pending + (waiting ? 1 : 0), failed: failed, dadQ: dadQ, answered: answered, waiting: waiting };
  }
  window.ChatDashStatus = function (d, setLight, blip) {
    var s = state();
    setLight('queue', s.failed ? 'warn' : s.waiting ? 'warn' : 'ok', s.failed ? 'SENT: ' + s.failed + " didn't send, tap Try again" : s.waiting ? 'SENT: waiting for Simmie\'s reply' : 'SENT: nothing waiting');
    var ago = Math.round((Date.now() - lastChange) / 60000);
    setLight('fresh', 'ok', 'FRESH: thread updated ' + (ago < 1 ? 'just now' : ago + ' min ago'));
    setLight('link', navigator.onLine === false ? 'warn' : 'ok', navigator.onLine === false ? 'LINK: offline, messages wait until you are back online' : 'LINK: online');
    setLight('dad', s.dadQ ? 'warn' : 'ok', s.dadQ ? 'DAD: a question from Dad is waiting for your answer' : 'DAD: nothing waiting');
    var g = $('#wx-gauge'); if (g && s.mine) { g.style.setProperty('--wx-g', (-90 + 180 * Math.min(1, s.answered / s.mine)).toFixed(1) + 'deg');
      g.setAttribute('aria-label', 'Simmie answered ' + s.answered + ' of ' + s.mine); g.title = 'ANSWERED: ' + s.answered + ' of ' + s.mine; }
    if (fresh++ && d && d.changed) blip('fresh');
  };
  window.ChatDashReport = function (perth, ago) {
    var s = state(), L = ['SYSTEM REPORT ' + perth(Date.now())];
    L.push('chat: ' + s.mine + ' sent by you \u00B7 ' + s.answered + ' answered' + (s.waiting ? ' \u00B7 waiting for Simmie' : ''));
    if (s.dadQ) L.push('dad: ' + s.dadQ + ' question' + (s.dadQ > 1 ? 's' : '') + ' waiting for you');
    L.push('link: ' + (navigator.onLine === false ? 'offline' : 'online'));
    // no weather (header only, Danny 03:15) and no age dial (not on this page) in the footer report
    return L;
  };
  // ---------- message-status layer ----------
  var seen = 0, unreadDad = false;
  function msgStatus() {
    var PT = window.PhiTiming; if (!PT || !PT.setMsg) return;
    var s = state(), panel = $('#dad-panel'), foot = $('#wx-foot');
    var urgent = (panel && !panel.hidden) || (foot && foot.classList.contains('tty-busy-on')) || s.dadQ > 0;
    PT.setMsg(urgent ? 'urgent' : unreadDad ? 'dad' : (Date.now() - lastChange < 60000 && seen) ? 'new' : 'idle');
  }
  function ring(host, cls) { if (!host || host.querySelector(':scope > .msg-ring')) return; var r = document.createElement('span'); r.className = 'msg-ring' + (cls ? ' ' + cls : ''); r.setAttribute('aria-hidden', 'true'); host.appendChild(r); }
  // ---------- start / stop ----------
  var open = false, tick = null;
  function status(changed) { document.dispatchEvent(new CustomEvent('rebella:status', { detail: { pending: state().pending, changed: !!changed } })); }
  function onScreen() {
    var scr = $('#screen-chat'), now = scr && !scr.hidden;
    if (now && !open) {
      open = true; paintCritters();
      var bar = $('.tty-bar'); if (bar && !bar.querySelector('.msg-led')) { var led = document.createElement('span'); led.className = 'msg-led'; led.setAttribute('aria-hidden', 'true'); bar.insertBefore(led, bar.querySelector('span')); ring(led); }
      ring($('#ask-dad')); ring($('#wx-ticker'), 'edge');
      status(false); msgStatus();
      tick = setInterval(function () { if (!document.hidden) { status(false); msgStatus(); } }, 60000);
    } else if (!now && open) {
      open = false; clearInterval(tick); document.dispatchEvent(new CustomEvent('rebella:locked'));
    }
  }
  function boot() {
    var scr = $('#screen-chat'), log = $('#log'); if (!scr) return;
    new MutationObserver(onScreen).observe(scr, { attributes: true, attributeFilter: ['hidden'] });
    if (log) new MutationObserver(function () {
      var n = log.querySelectorAll('.msg').length, dadN = log.querySelectorAll('.msg.dad').length;
      if (n !== seen) { if (seen && dadN > (log._dadN || 0)) unreadDad = true; lastChange = Date.now(); }
      seen = n; log._dadN = dadN; if (open) { status(true); msgStatus(); }
    }).observe(log, { childList: true });
    var mo = new MutationObserver(msgStatus);
    if ($('#dad-panel')) mo.observe($('#dad-panel'), { attributes: true, attributeFilter: ['hidden'] });
    if ($('#wx-foot')) mo.observe($('#wx-foot'), { attributes: true, attributeFilter: ['class'] });
    // Dad's message counts as read once she taps or types on the page
    ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { if (unreadDad) { unreadDad = false; msgStatus(); } }, true); });
    window.addEventListener('online', function () { if (open) status(false); }); window.addEventListener('offline', function () { if (open) status(false); });
    onScreen();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
