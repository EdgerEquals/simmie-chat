/* Bonnie's music: a small, visible YouTube mini-player for Bonnie's playlist.
   Uses only the documented YouTube IFrame Player API on the privacy-enhanced host (www.youtube-nocookie.com).
   No API key, no OAuth, no Data API: the playlist must be Public or Unlisted.

   Rules this file keeps (YouTube API Terms, Developer Policies, Required Minimum Functionality):
   - the player is always on screen while it plays, 200x200 CSS px (the documented minimum), nothing is drawn over it
     (it sits on the top layer of the page), and it is never hidden, off-screen, see-through or audio-only;
   - it pauses whenever the tab or app is hidden (document.hidden), so it is never a background player;
   - one player per page; it only starts after a tap, and only once more than half of it is visible;
   - the random track and start point use only documented calls: setShuffle, setLoop, playVideoAt, getPlaylist,
     getPlaylistIndex, getDuration, seekTo;
   - the page keeps its no-referrer policy, but the player iframe itself sends the origin as Referer
     (strict-origin-when-cross-origin), which YouTube requires to identify the embedding site.

   Hook: <link rel="stylesheet" href=".../bonnie-music.css"> and
         <script src=".../bonnie-music.js" data-page="chat|dash|rebella" defer></script>
   Testing: add ?list=<playlist id> to the page URL to try any public playlist without editing this file. */
(function () {
  'use strict';

  // ===== THE ONE SETTING: Bonnie's playlist ID (the part after "list=" in the playlist link). =====
  var PLAYLIST_ID = 'REPLACE_WITH_BONNIE_PLAYLIST';
  // ================================================================================================

  var HOST = 'https://www.youtube-nocookie.com';
  var me = document.currentScript || document.querySelector('script[src*="bonnie-music.js"]');
  var PAGE = (me && me.getAttribute('data-page')) || 'chat';
  var BUTTON_MODE = PAGE === 'rebella';                    // Rebella: nothing until the listener presses play
  var STORE = 'preview.bonnieMusic.v1';                    // preview-only on/off memory (not used on Rebella)
  var SIZE = 200;                                          // documented minimum player viewport: 200 x 200
  var ID_RE = /^[A-Za-z0-9_-]{12,64}$/;

  function listId() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('list'); } catch (e) {}
    if (q && ID_RE.test(q)) return q;
    if (PLAYLIST_ID.indexOf('REPLACE_') === 0 || !ID_RE.test(PLAYLIST_ID)) return '';
    return PLAYLIST_ID;
  }
  function pref(v) {
    if (BUTTON_MODE) return null;
    try { if (v) localStorage.setItem(STORE, v); return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- UI ----------
  var root = el('div', 'bm bm-' + PAGE);
  root.setAttribute('data-state', 'idle');
  var pill = el('button', 'bm-pill');
  pill.type = 'button';
  pill.setAttribute('aria-expanded', 'false');
  pill.setAttribute('aria-controls', 'bm-panel');
  var pillIco = el('span', 'bm-pill-ico', BUTTON_MODE ? '\u25B6' : '\u266A');
  pillIco.setAttribute('aria-hidden', 'true');
  var pillTxt = el('span', 'bm-pill-txt');
  pill.appendChild(pillIco); pill.appendChild(pillTxt);

  var panel = el('section', 'bm-panel bm-p-' + PAGE);
  panel.id = 'bm-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', "Bonnie's music");
  var frame = el('div', 'bm-frame');
  var side = el('div', 'bm-side');
  var title = el('p', 'bm-title', "Bonnie's music");
  var status = el('p', 'bm-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  var ctl = el('div', 'bm-ctl'); ctl.setAttribute('role', 'group'); ctl.setAttribute('aria-label', 'Music controls');
  function cbtn(cls, label, glyph) { var b = el('button', 'bm-btn ' + cls); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; var g = el('span', '', glyph); g.setAttribute('aria-hidden', 'true'); b.appendChild(g); return b; }
  var bMute = cbtn('bm-mute', 'Mute', '\uD83D\uDD0A');
  var bNext = cbtn('bm-next', 'Next song (random)', '\u23ED');
  var bOff = cbtn('bm-off', 'Stop the music and close', '\u2715');
  ctl.appendChild(bMute); ctl.appendChild(bNext); ctl.appendChild(bOff);
  var legal = el('p', 'bm-legal');
  legal.appendChild(document.createTextNode('Plays from YouTube \u00B7 '));
  var aT = el('a', '', 'YouTube Terms'); aT.href = 'https://www.youtube.com/t/terms';
  var aP = el('a', '', 'Google Privacy'); aP.href = 'https://policies.google.com/privacy';
  [aT, aP].forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  legal.appendChild(aT); legal.appendChild(document.createTextNode(' \u00B7 ')); legal.appendChild(aP);
  side.appendChild(title); side.appendChild(status); side.appendChild(ctl); side.appendChild(legal);
  panel.appendChild(frame); panel.appendChild(side);

  function setState(s, msg) {
    root.setAttribute('data-state', s);
    document.documentElement.setAttribute('data-bm', s);
    if (msg != null) status.textContent = msg;
    var label;
    if (BUTTON_MODE) label = s === 'idle' ? "Play Bonnie's playlist (from YouTube)" : "Bonnie's playlist is on (YouTube)";
    else if (s === 'unset') label = 'music: playlist not linked yet';
    else if (s === 'idle') label = pref() === 'on' ? "tap for Bonnie's music" : "tap for Bonnie's music";
    else label = "Bonnie's music";
    pillTxt.textContent = label;
    pill.setAttribute('aria-label', label);
    pill.title = label;
  }

  // ---------- placement ----------
  // chat:  wide screens -> fixed in the empty right gutter; short landscape -> fixed right column, chat column shrinks
  //        to make room; portrait -> in the page flow just above the play row (the message list gets shorter).
  // dash:  wide screens -> fixed in the right gutter above the footer bar; otherwise sticky at the top of the queue,
  //        just under the preview band, so it stays fully on screen while the queue scrolls underneath it;
  //        short landscape -> fixed bottom-left just above the footer bar (Ask Dad stays clear at top right).
  // rebella: in the page flow, right under the play button.
  var mode = '';
  function q(s) { return document.querySelector(s); }
  function place() {
    if (panel.hidden && mode) return;
    var W = window.innerWidth, H = window.innerHeight, want, host = null, before = null;
    var PW = SIZE + 24;
    if (PAGE === 'chat') {
      var scr = q('#screen-chat'), sw = scr ? scr.getBoundingClientRect().width : 640;
      if (scr && scr.classList.contains('bm-side-room')) sw += 0;
      if (W - Math.min(sw, 640) >= 2 * (PW + 24)) want = 'gutter';
      else if (W > H && H < 560) want = 'side';
      else { want = 'flow'; host = scr; before = q('#typing') ? q('#typing').nextSibling : q('#send-form'); }
    } else if (PAGE === 'dash') {
      var main = q('#main'), mw = main ? Math.min(main.getBoundingClientRect().width, 980) : 980;
      if ((W - mw) / 2 >= 218 && H >= 600) want = 'gutter';
      else if (H < 560) want = 'dock';               // short landscape: fixed bottom-left, above the footer bar
      else { want = 'sticky'; host = main; before = main ? main.firstChild : null; }
    } else {
      want = 'flow';
    }
    var scrEl = q('#screen-chat');
    if (scrEl) scrEl.classList.toggle('bm-side-room', want === 'side' && !panel.hidden);
    if (want === mode && panel.parentNode) { measure(); return; }
    mode = want;
    panel.setAttribute('data-mode', mode);
    if ((mode === 'flow' || mode === 'sticky') && host) host.insertBefore(panel, before || null);
    else if (PAGE !== 'rebella') document.body.appendChild(panel);
    measure();
  }
  function measure() {
    // keep fixed placements clear of the sticky preview band, the chat header and the fixed footer bar
    var top = 8, bottom = 8, r;
    var band = q('.preview-band, .pv-band'); if (band && (r = band.getBoundingClientRect()).height && getComputedStyle(band).position !== 'static') top = Math.max(top, r.bottom + 8);
    if (PAGE === 'chat') { var hd = q('.chat-head'); if (hd) top = Math.max(top, hd.getBoundingClientRect().bottom + 8); }
    if (PAGE === 'dash') {
      var ft = q('#il-foot'), fb = q('#wx-foot'), t = window.innerHeight;
      [ft, fb].forEach(function (n) { if (n && n.getBoundingClientRect().height) t = Math.min(t, n.getBoundingClientRect().top); });
      bottom = Math.max(bottom, window.innerHeight - t + 10);
      if (band) panel.style.setProperty('--bm-sticky-top', Math.round(band.getBoundingClientRect().height + 6) + 'px');
    }
    panel.style.setProperty('--bm-top', Math.round(top) + 'px');
    panel.style.setProperty('--bm-bottom', Math.round(bottom) + 'px');
  }

  function mount() {
    if (PAGE === 'chat') {
      var head = q('.chat-head'), lock = q('#lock-btn');
      if (!head) return false;
      head.insertBefore(root, lock || null);
    } else if (PAGE === 'dash') {
      var tb = q('.tb-right'), lk = q('#lock');
      if (!tb) return false;
      tb.insertBefore(root, lk || tb.firstChild);
    } else {
      var spot = q('[data-bonnie-music]');
      if (!spot) return false;
      spot.appendChild(root);
    }
    root.appendChild(pill);
    if (PAGE === 'rebella') root.appendChild(panel);
    return true;
  }

  // ---------- player ----------
  var player = null, ready = false, wantPlay = false, randomized = {}, lastIdx = -1, visRatio = 0, pausedForHidden = false,
      blockTimer = 0, listLen = 0, started = false, reqIdx = -1, ID = listId();

  function loadApi(cb) {
    if (window.YT && window.YT.Player) return cb();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (typeof prev === 'function') try { prev(); } catch (e) {} cb(); };
    if (!document.getElementById('bm-yt-api')) {
      var s = document.createElement('script');
      s.id = 'bm-yt-api'; s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
      s.referrerPolicy = 'strict-origin-when-cross-origin';
      document.head.appendChild(s);
    }
  }

  function buildPlayer() {
    var src = HOST + '/embed/videoseries?list=' + encodeURIComponent(ID) +
      '&enablejsapi=1&playsinline=1&rel=0&origin=' + encodeURIComponent(location.origin);
    var f = document.createElement('iframe');
    f.id = 'bm-yt'; f.className = 'bm-yt';
    f.width = String(SIZE); f.height = String(SIZE);
    f.title = "Bonnie's music (YouTube player)";
    f.setAttribute('allow', 'autoplay; encrypted-media');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');  // YouTube needs the Referer; page stays no-referrer
    f.setAttribute('frameborder', '0');
    f.src = src;
    frame.appendChild(f);
    setState('loading', 'Loading the playlist\u2026');
    loadApi(function () {
      player = new window.YT.Player('bm-yt', {
        events: {
          onReady: function () { ready = true; prime(); },
          onStateChange: onState,
          onError: onErr,
          onAutoplayBlocked: function () { blocked(); }
        }
      });
    });
  }

  function playlist() { try { var p = player.getPlaylist(); return (p && p.length) ? p : null; } catch (e) { return null; } }

  var primeTries = 0;
  function prime() {
    var p = playlist();
    if (!p) {
      if (++primeTries < 16) return setTimeout(prime, 250);
      return setState('error', "This playlist can't play here. Check it is set to Public or Unlisted (not Private).");
    }
    listLen = p.length; curList = ID;
    try { player.setLoop(true); player.setShuffle(true); } catch (e) {}
    if (wantPlay) startWhenVisible();
  }

  function startWhenVisible() {
    if (!ready || !wantPlay) return;
    if (visRatio <= 0.5) { setState('waiting', 'Scroll so the player is on screen to start.'); return; }
    if (document.hidden) return;
    var p = playlist(); if (!p) return;
    lastIdx = -1; randomized = {};
    reqIdx = rnd(p.length);
    try { player.playVideoAt(reqIdx); } catch (e) {}
    clearTimeout(blockTimer);
    blockTimer = setTimeout(function () { if (!started) blocked(); }, 4000);
  }
  function blocked() {
    if (started) return;
    setState('blocked', 'Tap \u25B6 on the player to start the music.');
  }

  function randomSeek(tries) {
    if (!player) return;
    var idx = -1; try { idx = player.getPlaylistIndex(); } catch (e) {}
    var pl = playlist(), key = idx + ':' + (pl && pl[idx] ? pl[idx] : '');
    if (randomized[key]) return;
    var d = 0; try { d = player.getDuration(); } catch (e) {}
    if (!(d > 0)) { if ((tries || 0) < 12) setTimeout(function () { randomSeek((tries || 0) + 1); }, 250); return; }
    randomized[key] = true;
    var at = d * (0.10 + Math.random() * 0.60);              // somewhere between 10% and 70% of the song
    try { player.seekTo(at, true); } catch (e) {}
  }

  function onState(e) {
    var S = window.YT.PlayerState;
    if (e.data === S.PLAYING) {
      clearTimeout(blockTimer);
      if (!started) {
        started = true;
        if (!wantPlay) { wantPlay = true; }
        // first play came from YouTube's own play button (the browser blocked our scripted start): go to our random song once
        var idx0 = -1; try { idx0 = player.getPlaylistIndex(); } catch (x) {}
        if (listLen > 1 && (reqIdx === -1 || idx0 !== reqIdx)) {
          if (reqIdx === -1) reqIdx = rnd(listLen);
          try { player.playVideoAt(reqIdx); } catch (x) {}
          return;
        }
      }
      var idx = -1; try { idx = player.getPlaylistIndex(); } catch (x) {}
      lastIdx = idx;
      randomSeek(0);
      setState('playing', 'Playing from YouTube');
      syncMute();
    } else if (e.data === S.PAUSED) {
      if (!pausedForHidden) setState('paused', 'Paused');
    } else if (e.data === S.ENDED) {
      if (wantPlay) next();
    }
  }
  function onErr(e) {
    // 100 removed/private video, 101/150 owner blocks embedding, 2/5 bad id/HTML5 issue: try another song
    var code = e && e.data;
    if ((code === 100 || code === 101 || code === 150 || code === 5) && listLen > 1 && wantPlay) {
      setState('playing', 'Skipped a song that can\u2019t play here');
      return setTimeout(next, 600);
    }
    if (code === 153) return setState('error', 'YouTube needs this page\u2019s address (Referer) to play.');
    setState('error', "This playlist can't play here. Check it is set to Public or Unlisted (not Private).");
  }
  function next() {
    var p = playlist(); if (!p) return;
    var cur = -1; try { cur = player.getPlaylistIndex(); } catch (e) {}
    var i = rnd(p.length); if (p.length > 1 && i === cur) i = (i + 1 + rnd(p.length - 1)) % p.length;
    try { player.playVideoAt(i); } catch (e) {}
  }
  function syncMute() {
    var m = false; try { m = player.isMuted(); } catch (e) {}
    bMute.setAttribute('aria-pressed', m ? 'true' : 'false');
    bMute.setAttribute('aria-label', m ? 'Unmute' : 'Mute'); bMute.title = m ? 'Unmute' : 'Mute';
    bMute.firstChild.textContent = m ? '\uD83D\uDD07' : '\uD83D\uDD0A';
  }

  // ---------- single-player crossfade (used by dad-dj.js) ----------
  // Equal-power fade-out (cos) -> load the next random track -> fade-in (sin), via setVolume only, half the length each,
  // so the total equals the requested crossfade length. Playback speed is never touched.
  var curList = '', fadeT = 0, baseVol = 100;
  function ramp(sec, f, done) {
    clearInterval(fadeT);
    var t0 = performance.now(), ms = Math.max(50, sec * 1000);
    fadeT = setInterval(function () {
      var x = Math.min(1, (performance.now() - t0) / ms);
      try { player.setVolume(Math.round(Math.max(0, Math.min(100, f(x))))); } catch (e) {}
      if (x >= 1) { clearInterval(fadeT); if (done) done(); }
    }, 50);
  }
  function swap(list, sec, vol, cb) {
    if (!player || !ready || !ID_RE.test(list || '')) return false;
    var v0 = baseVol, v1 = Math.round(Math.max(0, Math.min(1, vol == null ? 1 : vol)) * 100), half = Math.max(0.5, sec / 2);
    ramp(half, function (x) { return v0 * Math.cos(x * Math.PI / 2); }, function () {
      var go = function () {
        var p = playlist(); if (!p) return;
        listLen = p.length; reqIdx = rnd(p.length); randomized = {};
        try { player.playVideoAt(reqIdx); } catch (e) {}
        baseVol = v1;
        ramp(half, function (x) { return v1 * Math.sin(x * Math.PI / 2); }, cb);
      };
      if (list === curList) return go();
      curList = list;
      var before = (playlist() || [])[0], tries = 0;
      try { player.cuePlaylist({ listType: 'playlist', list: list }); } catch (e) {}
      (function wait() {
        var p = playlist();
        if ((p && p[0] !== before) || ++tries > 20) return go();
        setTimeout(wait, 200);
      })();
    });
    return true;
  }

  // ---------- open / close ----------
  function open() {
    if (!ID) { setState('unset', BUTTON_MODE ? '' : "Bonnie's playlist isn't linked yet."); return; }
    panel.hidden = false;
    pill.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('bm-open');
    mode = ''; place();
    wantPlay = true; started = false;
    pref('on');
    if (!player) buildPlayer();
    else if (ready) startWhenVisible();
  }
  function close() {
    wantPlay = false;
    if (player) { try { player.pauseVideo(); } catch (e) {} }
    panel.hidden = true;
    pill.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('bm-open');
    var scr = q('#screen-chat'); if (scr) scr.classList.remove('bm-side-room');
    pref('off');
    setState('idle', '');
    pill.focus();
  }
  pill.addEventListener('click', function () { if (panel.hidden) open(); else if (started && root.getAttribute('data-state') === 'paused') { try { player.playVideo(); } catch (e) {} } else close(); });
  bOff.addEventListener('click', close);
  bNext.addEventListener('click', function () { if (ready) { wantPlay = true; next(); } });
  bMute.addEventListener('click', function () { if (!player) return; try { if (player.isMuted()) player.unMute(); else player.mute(); } catch (e) {} setTimeout(syncMute, 60); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // never a background player: pause when the tab/app is hidden, resume only if it was playing and is on screen
  document.addEventListener('visibilitychange', function () {
    if (!player || !ready) return;
    if (document.hidden) {
      var st = -1; try { st = player.getPlayerState(); } catch (e) {}
      if (st === 1 || st === 3) { pausedForHidden = true; try { player.pauseVideo(); } catch (e) {} setState('paused', 'Paused while the page was hidden'); }
    } else if (pausedForHidden) {
      pausedForHidden = false;
      if (wantPlay && !panel.hidden && visRatio > 0.5) { try { player.playVideo(); } catch (e) {} }
    }
  });
  // more-than-half-visible check before any start; pause if it ever leaves the screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        visRatio = en.isIntersecting ? en.intersectionRatio : 0;
        if (visRatio > 0.5 && wantPlay && ready && !started) startWhenVisible();
        if (visRatio < 0.5 && player && started) { var st = -1; try { st = player.getPlayerState(); } catch (e) {} if (st === 1) { try { player.pauseVideo(); } catch (e) {} } }
      });
    }, { threshold: [0, 0.25, 0.5, 0.51, 0.75, 1] }).observe(frame);
  } else visRatio = 1;

  var rt = 0;
  function relayout() { clearTimeout(rt); rt = setTimeout(function () { if (!panel.hidden) { place(); } }, 120); }
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', relayout);
  window.addEventListener('scroll', function () { if (!panel.hidden && mode === 'gutter') measure(); }, { passive: true });

  function boot() {
    if (!mount()) return;
    setState(ID ? 'idle' : 'unset', ID ? '' : "Bonnie's playlist isn't linked yet.");
    if (!BUTTON_MODE && ID && pref() === 'on') root.classList.add('bm-remembered');   // gentle "tap for music" nudge
    if (reduce && reduce.matches) root.classList.add('bm-still');
    window.BonnieMusic = {
      open: open, close: close, get mode() { return mode; },
      // for Dad's auto-DJ (dad-dj.js, chat preview): same single visible player, documented calls only
      get playing() { return !!(player && ready && started && wantPlay && root.getAttribute('data-state') === 'playing'); },
      get list() { return curList; }, get defaultList() { return ID; },
      position: function () { try { return { t: player.getCurrentTime(), d: player.getDuration() }; } catch (e) { return null; } },
      swap: swap
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
