/* KID LOGO VIEW + EDITOR (loaded by js/kid-logo.js on the first tap only). Shared module: the SAME file is rebella js/kid-logo-view.js
   and simmie-chat js/kid-logo-view.js. Danny 13:08 AWST 26 Oct 2026 (Simmie's chat) + Kids Club logo standards (shared.md).
   VIEW    the logo large on a dark stage with its neon, life (shimmer, stars, bluebird in Dad's colours, wagtail) and its own music
           (own copies: js/rebella-zoom-life.js, js/logo-sound.js, js/phi-pumps.js, js/bird-ref-data.js; never dad-page files).
           A small "Edit" button sits NEXT TO the close X. Tapping the big logo again also opens the editor.
           The first time on this site the logo settles in once, piece by piece in her own writing order (R, e-b-e, l-l-a, the swash,
           the heart; boundaries measured from the ink of img/bonnies-logo.svg), each piece gliding in on B x PHI^-5.
   EDITOR  not a tutorial: each visit asks a short series (a Fibonacci 3) of "Which direction would you like to take it?" questions in
           the questionnaire's own shape (count line, question, two tiles, Roll, Back, Skip, Done for now). Which topic comes next is
           emergent: topics she has been asked least come first, and a tie goes to the topic she last picked in (keep going that way).
           Tiles only: colour from her palette, glow, size (one phi step), motion, sound, ways to start (draw by hand, type it, a vector
           file, or ask Simmie in chat), and "Back to my original" is always there. Every pick shows at once and is saved at once on this
           device only (localStorage 'kidlogo.v1.<site>'); closing saves and the page's logo glides to the new look.
           Typed text goes through the same word filter as Rebella's visitor nickname (js/bars.js check()). Where she can type, draw,
           bring a file or chat, a gentle heart note suggests keeping her own name out of a logo (Danny 13:13 AWST); text logos are allowed.
   SOUND   only after her tap (the AudioContext is made inside the tap in js/kid-logo.js). No master volume: the device volume is the one
           overall control. Quiet hours from the sun (js/season-pumps.js), no fixed root (see js/logo-sound.js). Sound off = no context at all.
   MOTION  reduced motion or Pause motion: no settle-in, no life, no glides; the logo just appears. All timings are B x PHI^k (js/phi-b.js).
   API: window.KidLogoView = {open(el, {ac, edit}), close(), isOpen()} */
(function (root) {
  'use strict';
  var doc = root.document, KL = root.KidLogo; if (!doc || !KL || root.KidLogoView) return;
  var PHI = (1 + Math.sqrt(5)) / 2, NS = 'http://www.w3.org/2000/svg', cfg = KL.cfg, V = cfg.v ? '?v=' + cfg.v : '';   // phi: the golden ratio
  var RM = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function ms(k) { return root.PhiB && PhiB.ms ? PhiB.ms(k) : null; }                   // every timing is B x PHI^k
  function still() { return RM.matches || (root.PhiPause && PhiPause.on()) || !ms(0); }
  function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(cls, text, label) { var b = el('button', cls, text); b.type = 'button'; if (label) b.setAttribute('aria-label', label); return b; }
  function inj(src) { return new Promise(function (res) { var s = doc.createElement('script'); s.src = src; s.async = true; s.onload = s.onerror = res; doc.head.appendChild(s); }); }

  // ---- her palette (anchor: css/styles.css of Rebella and the dashboard's neon; the page's own colours, nothing invented) ----
  var PAL = [['blush', 'Blush pink', '#F8CFDB', '\uD83C\uDF38'], ['peach', 'Peach', '#FCD9C0', '\uD83C\uDF51'], ['butter', 'Butter yellow', '#FBE7B0', '\uD83C\uDF3C'],
    ['mint', 'Mint', '#C8EBD5', '\uD83C\uDF3F'], ['aqua', 'Aqua', '#B5E3E0', '\uD83E\uDEE7'], ['lavender', 'Lavender', '#DCD0F2', '\uD83D\uDC9C'],
    ['raspberry', 'Raspberry', '#923658', '\uD83C\uDF53'], ['maker', "Maker's pink", '#B0275A', '\uD83D\uDC97'], ['neon', 'Neon pink', '#F48FB1', '\u2728']];
  var VIEW_COLOUR = '#B0275A', CORE = '#F8CFDB', HALO = '#E58AA6';                       // anchor: the logo view's approved raspberry + dashboard neon
  var HEART = '\uD83D\uDC97 A little heart note: logos are made to be seen by lots of people, so the kindest thing you can do for yourself is leave your own name out of it. ' +
    'Your colours, your swirls and your style already say it\u2019s you, and that\u2019s the safe kind of famous. \uD83D\uDC97';
  // the same word lists as Rebella's visitor nickname check (js/bars.js), so typed logo text meets the site's existing filter
  var BAD = ['fuck', 'shit', 'bitch', 'cunt', 'wank', 'twat', 'slut', 'whore', 'bastard', 'nigg', 'fag', 'retard', 'porn', 'nazi', 'rape', 'pussy', 'penis', 'vagina', 'boob', 'bollock', 'dickhead', 'arsehole', 'asshole', 'cock'];
  var BAD_WORD = ['ass', 'arse', 'tit', 'tits', 'cum', 'sex', 'sexy', 'piss', 'poo', 'poop', 'kill', 'die', 'hate'];
  var MAXLEN = 20;                                                                        // anchor: js/bars.js nickname limit (the existing filter)
  function check(n) {
    if (root.RebellaVisitor && RebellaVisitor.check) { var w = RebellaVisitor.check(n); return /different name/.test(w) ? "Let's pick different words" : w; }   // Rebella's own filter
    if (!n) return 'empty';
    if (n.length > MAXLEN) return 'Up to ' + MAXLEN + ' letters, please';
    if (!/^\p{L}[\p{L} -]*$/u.test(n) || /[ -]{2,}/.test(n)) return 'Letters, spaces and hyphens only';
    var flat = n.toLowerCase().replace(/[ -]/g, '');
    for (var i = 0; i < BAD.length; i++) if (flat.indexOf(BAD[i]) !== -1) return "Let's pick different words";
    var words = n.toLowerCase().split(/[ -]+/);
    for (var j = 0; j < words.length; j++) if (BAD_WORD.indexOf(words[j]) !== -1) return "Let's pick different words";
    return '';
  }

  // ---- the logo's pieces in writing order, as shares of the viewBox width (anchor: measured from the ink of img/bonnies-logo.svg:
  //      R ends x=850, e-b-e x=1240, l-l-a x=1910, swash x=2050, heart x=2195 of 413..2223) ----
  var CUTS = [(850 - 413) / 1810, (1240 - 413) / 1810, (1910 - 413) / 1810, (2050 - 413) / 1810, 1];   // anchor: her ink, measured

  // ---- DOM ----
  var ov = el('div', 'dmz kl'), bar = el('div', 'kl-btns'), edB = btn('kl-edit', 'Edit', 'Edit your logo'), x = btn('dmz-x', '\u00D7', 'Close and save');
  ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your logo');
  bar.appendChild(edB); bar.appendChild(x);
  var fig = el('figure', 'dmz-fig dmz--rebella'), art = el('div', 'dmz-art'), ed = el('section', 'kl-ed'), hint = el('div', 'kl-hint');
  ed.hidden = true; ed.setAttribute('aria-live', 'polite'); hint.setAttribute('role', 'status'); hint.hidden = true;
  fig.appendChild(art); ov.appendChild(bar); ov.appendChild(fig); ov.appendChild(ed); doc.body.appendChild(ov); doc.body.appendChild(hint);
  var cur = null, AC = null, eng = null, svg = null, lifeOn = false, acT = null;

  function S() { return KL.read(); }
  function save(s) { KL.write(s); paint(); }
  function glowFilter(s, svgEl, H) {
    var g = s.glow || 'neon'; if (g === 'off') return;
    var a = g === 'soft' ? Math.pow(PHI, -1) : 1, id = 'kl-glow-' + KL.site;
    var d = doc.createElementNS(NS, 'defs');
    d.innerHTML = '<filter id="' + id + '" x="-22%" y="-40%" width="144%" height="180%" color-interpolation-filters="sRGB">' +         // anchor: the approved neon frame (dashboard recipe)
      '<feGaussianBlur in="SourceAlpha" stdDeviation="' + H * Math.pow(PHI, -6) + '" result="b2"/><feFlood flood-color="' + HALO + '" flood-opacity="' + Math.pow(PHI, -1) * a + '"/><feComposite in2="b2" operator="in" result="h2"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="' + H * Math.pow(PHI, -8) + '" result="b"/><feFlood flood-color="' + HALO + '" flood-opacity="' + (1 - Math.pow(PHI, -5)) * a + '"/><feComposite in2="b" operator="in" result="h"/>' +
      '<feGaussianBlur in="SourceAlpha" stdDeviation="' + H * Math.pow(PHI, -12) + '" result="r"/><feFlood flood-color="' + CORE + '" flood-opacity="' + (1 - Math.pow(PHI, -3)) * a + '"/><feComposite in2="r" operator="in" result="rim"/>' +
      '<feMerge><feMergeNode in="h2"/><feMergeNode in="h"/><feMergeNode in="rim"/></feMerge></filter>';
    svgEl.insertBefore(d, svgEl.firstChild);
    var u = svgEl.querySelector('use'), g2;
    if (u) { g2 = u.cloneNode(false); svgEl.insertBefore(g2, u); }
    else { var a2 = svgEl.querySelector('.kl-art'); if (!a2) return; g2 = a2.cloneNode(true); g2.setAttribute('class', 'kl-art-glow'); svgEl.insertBefore(g2, a2); }
    g2.setAttribute('filter', 'url(#' + id + ')');
  }
  function build() {
    var s = S(); art.innerHTML = '';
    svg = cur.cloneNode(true);
    ['class', 'style', 'width', 'height', 'tabindex', 'role', 'aria-haspopup', 'aria-label', 'focusable'].forEach(function (a) { svg.removeAttribute(a); });
    svg.__klWired = true; svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var u = svg.querySelector('use'); if (u) u.setAttribute('href', new URL(u.getAttribute('href'), doc.baseURI).href);   // absolute, so the life file can read the path
    var vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    svg.style.color = s.colour || VIEW_COLOUR;
    glowFilter(s, svg, vb[3] || cur.getBBox().height);
    art.appendChild(svg); sizeArt(s);
  }
  function sizeArt(s) { art.style.transform = s.size ? 'scale(' + Math.pow(PHI, s.size) + ')' : ''; }
  function paint() { if (!cur) return; var keepLife = lifeOn; KL.apply(); build(); if (keepLife) { stopLife(); startLife(); } }

  // ---- settle-in, once per site: her pieces glide in, in writing order ----
  function settle(s) {
    if (s.settled) return; s.settled = Date.now(); KL.write(s);
    if (still() || !svg.animate) return;
    var kf = [{ clipPath: 'inset(0 100% 0 0)', opacity: Math.pow(PHI, -2), offset: 0 }];   // unit: percent of the logo's width
    CUTS.forEach(function (c, i) { kf.push({ clipPath: 'inset(0 ' + ((1 - c) * 100) + '% 0 0)', opacity: 1 - Math.pow(PHI, -(i + 2)), offset: (i + 1) / CUTS.length }); });   // unit: percent
    kf[kf.length - 1].opacity = 1;
    try { svg.animate(kf, { duration: ms(-5) * CUTS.length, easing: 'ease-in-out' }); } catch (e) {}   // phi: B x PHI^-5 per piece
  }

  // ---- life + sound (own copies; lazy) ----
  function outOf(ac) { try { if (root.RhythmContinuity) return RhythmContinuity.loud.logoOut(ac); } catch (e) {} return ac.destination; }   // logo trim (music x PHI^-1) -> keep-alive bridge (js/rhythm-continuity.js)
  function startLife() {
    var s = S(), motion = s.motion !== false && !still(), sound = s.sound !== false && AC;
    if (motion && !s.art) {
      lifeOn = true;
      var go = function () { if (!cur || !root.RebellaZoomLife) return; try { RebellaZoomLife.start(fig, sound ? AC : null); } catch (e) {} };
      if (root.RebellaZoomLife) return go();
      Promise.all([root.PhiPumps ? 0 : inj(cfg.dir + 'phi-pumps.js' + V)]).then(function () { return root.RebellaZoomLife ? 0 : inj(cfg.dir + 'rebella-zoom-life.js' + V); }).then(go);
    } else if (sound) {
      var go2 = function () { if (!cur || eng || !root.LogoSound) return;
        try { eng = LogoSound.create(AC, outOf(AC), { logo: 'kid-logo:' + KL.site, mood: s.mood || 'dreamy', events: { 'star-drop': Math.pow(PHI, -3), shimmer: Math.pow(PHI, -3) } }); } catch (e) { eng = null; } };
      if (root.LogoSound) return go2();
      (root.PhiPumps ? Promise.resolve() : inj(cfg.dir + 'phi-pumps.js' + V)).then(function () { return root.LogoSound ? 0 : inj(cfg.dir + 'logo-sound.js' + V); }).then(go2);
    }
  }
  function stopLife() { lifeOn = false; try { root.RebellaZoomLife && RebellaZoomLife.stop(); } catch (e) {} if (eng) { try { eng.stop(Math.pow(PHI, -2)); } catch (e) {} eng = null; } }

  // ---- open / close ----
  function open(el0, o) {
    o = o || {}; if (cur) { if (o.edit) editor(); return; }
    cur = el0; AC = o.ac || AC; var s = S();
    build(); ov.hidden = false; ed.hidden = true; ov.classList.remove('is-open', 'kl-editing');
    requestAnimationFrame(function () { ov.classList.add('is-open'); });
    settle(s); startLife();
    fit(); if (o.edit) editor(); else x.focus({ preventScroll: true });
  }
  function close() {
    if (!cur) return; var c = cur; stopLife(); KL.apply();
    ov.classList.remove('is-open', 'kl-editing'); ed.hidden = true;
    var done = function () { ov.hidden = true; art.innerHTML = ''; };
    if (still()) done(); else setTimeout(done, ms(-8));   // phi: B x PHI^-8
    try { if (AC && root.RhythmContinuity) RhythmContinuity.media(AC).rest('logo'); } catch (e) {}   // the media bridge rests with the view
    clearTimeout(acT); acT = setTimeout(function () { try { if (AC && !cur && AC.state === 'running') AC.suspend(); } catch (e) {} }, ms(-5) || 0);   // phi: B x PHI^-5 after close
    cur = null; if (root.location.hash === '#edit-logo') try { history.replaceState(null, '', root.location.pathname + root.location.search); } catch (e) {}
    var s = S(); if (!s.hinted) { s.hinted = Date.now(); KL.write(s); showHint(c); }
    var f = c.closest && c.closest('a') || c; try { f.focus({ preventScroll: true }); } catch (e) {}
  }
  function showHint(c) {
    hint.textContent = '\uD83D\uDC97 Tap your logo any time to bring it back, and tap it again to edit.';
    var r = c.getBoundingClientRect(); hint.style.top = Math.max(0, r.bottom) + 'px'; hint.style.left = Math.max(0, r.left) + 'px';
    hint.hidden = false; requestAnimationFrame(function () { hint.classList.add('on'); });
    setTimeout(function () { hint.classList.remove('on'); setTimeout(function () { hint.hidden = true; }, ms(-8) || 0); }, ms(-2) || 0);   // phi: B x PHI^-8 fade, shown for B x PHI^-2
  }

  // ---- editor: the questionnaire shape ----
  function opt(id, label, emo, set, now, sw, tint) { return { id: id, label: label, emo: emo, set: set, now: now || function () { return false; }, sw: sw, tint: tint }; }
  var TINT = {}; PAL.forEach(function (p) { TINT[p[0]] = p[2]; });   // her palette's pastels, by name
  var TOPICS = {
    colour: { name: 'Colour', opts: PAL.map(function (p) { return opt('c-' + p[0], p[1], p[3], function (s) { s.colour = p[2]; }, function (s) { return (s.colour || '') === p[2]; }, p[2]); }) },
    glow: { name: 'Glow', opts: [opt('g-neon', 'Neon glow', '\u2728', function (s) { s.glow = 'neon'; }, function (s) { return !s.glow || s.glow === 'neon'; }),
      opt('g-soft', 'Soft glow', '\uD83C\uDF19', function (s) { s.glow = 'soft'; }, function (s) { return s.glow === 'soft'; }),
      opt('g-off', 'No glow, crisp', '\u270F\uFE0F', function (s) { s.glow = 'off'; }, function (s) { return s.glow === 'off'; })] },
    size: { name: 'Size', opts: [opt('s-up', 'A step bigger', '\uD83D\uDD0D', function (s) { s.size = Math.min(0, (s.size || 0) + 1); }, function (s) { return !(s.size < 0); }),
      opt('s-down', 'A step smaller', '\uD83E\uDD0F', function (s) { s.size = Math.max(-2, (s.size || 0) - 1); }, function (s) { return (s.size || 0) <= -2; })] },   // phi: two whole steps down at most
    // SWEET (Danny 14:01 AWST): gentle motion and sweet, ethereal sound moods, on soft pastel tiles from her palette
    motion: { name: 'Motion', opts: [
      opt('m-drift', 'Slow, dreamy drift', '\u2601\uFE0F', function (s) { s.motion = true; s.drift = 1; }, function (s) { return s.motion !== false && s.drift !== 0; }, null, TINT.lavender),
      opt('m-float', 'Floaty sparkles', '\uD83E\uDD8B', function (s) { s.motion = true; s.drift = 0; }, function (s) { return s.motion !== false && s.drift === 0; }, null, TINT.blush),
      opt('m-still', 'Still as moonlight', '\uD83C\uDF19', function (s) { s.motion = false; }, function (s) { return s.motion === false; }, null, TINT.aqua)] },
    sound: { name: 'Sound', opts: [
      opt('a-dreamy', 'Dreamy', '\uD83E\uDDDA', function (s) { s.sound = true; s.mood = 'dreamy'; }, function (s) { return s.sound !== false && (!s.mood || s.mood === 'dreamy'); }, null, TINT.lavender),
      opt('a-sparkle', 'Sparkle', '\u2728', function (s) { s.sound = true; s.mood = 'sparkle'; }, function (s) { return s.sound !== false && s.mood === 'sparkle'; }, null, TINT.blush),
      opt('a-moon', 'Moonlight', '\uD83C\uDF19', function (s) { s.sound = true; s.mood = 'moonlight'; }, function (s) { return s.sound !== false && s.mood === 'moonlight'; }, null, TINT.aqua),
      opt('a-hush', 'Soft hush', '\uD83E\uDD2B', function (s) { s.sound = false; }, function (s) { return s.sound === false; }, null, TINT.mint)] },
    start: { name: 'A new way to make it', opts: [opt('w-draw', 'Draw it by hand', '\u270D\uFE0F', null), opt('w-type', 'Type it in', '\u2328\uFE0F', null),
      opt('w-file', 'Use a vector file', '\uD83D\uDCC1', null), opt('w-chat', 'Make it with Simmie in chat', '\uD83D\uDCAC', null)] }
  };
  var ORDER = ['colour', 'glow', 'size', 'motion', 'sound', 'start'];
  var ROUND = 3;                                                                          // phi: a Fibonacci 3 questions per series
  var q = null;   // {n, topic, roll, hist:[{topic, roll, before}]}
  function nextTopic(s) {
    var asked = s.asked || {}, last = s.lastTopic;
    return ORDER.slice().sort(function (a, b) {
      var d = (asked[a] || 0) - (asked[b] || 0); if (d) return d;
      return (b === last) - (a === last) || ORDER.indexOf(a) - ORDER.indexOf(b); })[0];
  }
  function pair(topic, roll, s) {
    var all = TOPICS[topic].opts.filter(function (o) { return !o.now(s); }); if (!all.length) return [];
    var k = (roll * 2) % all.length; return [all[k], all[(k + 1) % all.length]].filter(function (o, i, a) { return a.indexOf(o) === i; });
  }
  function editor() {
    if (!cur) return; ov.classList.add('kl-editing'); ed.hidden = false; stopLife();
    var s = S(); q = { n: 0, topic: nextTopic(s), roll: 0, hist: [] }; ask();
  }
  function frame(title) { ed.innerHTML = ''; var h = el('h2', 'kl-q', title); ed.appendChild(h); return h; }
  function foot(extra) {
    var r = el('div', 'kl-row kl-foot'); (extra || []).forEach(function (b) { r.appendChild(b); });
    var o = btn('kl-btn kl-orig', '\u21BA Back to my original'); o.addEventListener('click', original); r.appendChild(o);
    var d = btn('kl-btn kl-done', 'Done for now'); d.addEventListener('click', toView); r.appendChild(d);
    ed.appendChild(r);
  }
  function ask() {
    var s = S();
    if (q.n >= ROUND) return summary();
    var ps = pair(q.topic, q.roll, s);
    if (!ps.length) { q.topic = nextTopic(bump(s, q.topic)); return ask(); }
    ed.innerHTML = '';
    ed.appendChild(el('p', 'kl-count', 'Question ' + (q.n + 1) + ' of ' + ROUND + ' \u00B7 ' + TOPICS[q.topic].name));
    ed.appendChild(el('h2', 'kl-q', 'Which direction would you like to take it?'));
    var ch = el('div', 'kl-choices');
    ps.forEach(function (o) { var t = btn('kl-tile' + (o.tint ? ' kl-soft' : ''), null); t.setAttribute('data-opt', o.id); if (o.tint) t.style.setProperty('--kl-tint', o.tint);
      var e = el('span', 'kl-emo', o.emo); e.setAttribute('aria-hidden', 'true'); t.appendChild(e);
      if (o.sw) { var w = el('span', 'kl-sw'); w.style.background = o.sw; w.setAttribute('aria-hidden', 'true'); t.appendChild(w); }
      t.appendChild(el('span', 'kl-txt', o.label)); t.addEventListener('click', function () { pick(o); }); var c = el('div', 'kl-choice'); c.appendChild(t); ch.appendChild(c); });
    ed.appendChild(ch);
    var r = el('div', 'kl-row');
    if (q.hist.length) { var bk = btn('kl-btn kl-bk', '\u2190 Back'); bk.addEventListener('click', back); r.appendChild(bk); }
    if (TOPICS[q.topic].opts.length > 2) { var rl = btn('kl-btn kl-roll', '\uD83C\uDFB2 Roll', 'Roll for two other ideas'); rl.addEventListener('click', function () { q.roll++; ask(); }); r.appendChild(rl); }
    var sk = btn('kl-btn kl-skip', 'Skip'); sk.addEventListener('click', function () { step(null); }); r.appendChild(sk);
    ed.appendChild(r); foot();
    var f = ed.querySelector('.kl-tile'); if (f) f.focus({ preventScroll: true });
  }
  function bump(s, topic) { s.asked = s.asked || {}; s.asked[topic] = (s.asked[topic] || 0) + 1; return s; }
  function step(o) {
    var before = S(); q.hist.push({ topic: q.topic, roll: q.roll, before: JSON.stringify(before) });
    var s = bump(S(), q.topic);
    if (o) { s.lastTopic = q.topic; s.picks = s.picks || {}; s.picks[q.topic] = (s.picks[q.topic] || 0) + 1; o.set(s); }
    save(s); q.n++; q.topic = nextTopic(s); q.roll = 0; ask();
  }
  function pick(o) {
    if (!o.set) { var s0 = bump(S(), 'start'); s0.lastTopic = 'start'; KL.write(s0); return way(o.id); }
    step(o);
  }
  function back() { var h = q.hist.pop(); if (!h) return; KL.write(JSON.parse(h.before)); paint(); q.n = Math.max(0, q.n - 1); q.topic = h.topic; q.roll = h.roll; ask(); }
  function summary() {
    frame('Here\u2019s your logo now \u2728');
    ed.appendChild(el('p', 'kl-yay', 'It\u2019s saved on this device. Keep going, or come back any time by tapping your logo.'));
    var k = btn('kl-btn kl-big', 'Keep going'); k.addEventListener('click', function () { q.n = 0; q.hist = []; ask(); });
    foot([k]);
  }
  function original() {
    var s = S(), keep = { v: 1, settled: s.settled, hinted: s.hinted, asked: s.asked, picks: s.picks, lastTopic: s.lastTopic };
    q && q.hist.push({ topic: q.topic, roll: q.roll, before: JSON.stringify(s) });
    save(keep); if (q) ask();
  }
  function toView() { ov.classList.remove('kl-editing'); ed.hidden = true; startLife(); x.focus({ preventScroll: true }); }

  // ---- ways to make it: draw, type, vector file, chat ----
  function heart() { return el('p', 'kl-heart', HEART); }
  function useArt(a) { var s = S(); s.art = a; s.lastTopic = 'start'; save(s); q.n++; q.topic = nextTopic(s); q.roll = 0; ask(); }
  function backBtn() { var b = btn('kl-btn kl-bk', '\u2190 Back'); b.addEventListener('click', ask); return b; }
  function way(id) {
    if (id === 'w-draw') return drawPanel();
    if (id === 'w-type') return typePanel();
    if (id === 'w-file') return filePanel();
    frame('Make it with Simmie');
    ed.appendChild(el('p', 'kl-yay', 'Message Simmie in your chat and say \u201Cedit my logo\u201D. Simmie sends you a button that opens this editor, right here on this site, and you can build it together.'));
    ed.appendChild(heart()); foot([backBtn()]);
  }
  function drawPanel() {
    frame('Draw it by hand');
    var H = (svg && (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)[3]) || 0, W = H * PHI * PHI;   // phi: a PHI^2 wide canvas, her logo's height
    var cv = el('canvas', 'kl-pad'); cv.setAttribute('aria-label', 'Drawing pad: draw with your finger or a stylus'); ed.appendChild(cv);
    ed.appendChild(heart());
    var ctx = cv.getContext('2d'), strokes = [], curS = null, scale = 1;
    function fit() { var r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.width / (PHI * PHI); scale = W / (r.width || 1); redraw(); }
    function lw() { return cv.height * Math.pow(PHI, -5); }                              // phi: stroke = pad height x PHI^-5
    function redraw() { ctx.clearRect(0, 0, cv.width, cv.height); ctx.strokeStyle = S().colour || VIEW_COLOUR; ctx.lineWidth = lw(); ctx.lineCap = ctx.lineJoin = 'round';
      strokes.forEach(function (st) { ctx.beginPath(); st.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); if (st.length === 1) ctx.lineTo(st[0][0], st[0][1]); ctx.stroke(); }); }
    function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); curS = [pt(e)]; strokes.push(curS); redraw(); });
    cv.addEventListener('pointermove', function (e) { if (!curS) return; var p = pt(e), l = curS[curS.length - 1];
      if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= lw() * Math.pow(PHI, -2)) { curS.push(p); redraw(); } });   // phi: keep points PHI^-2 strokes apart
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cv.addEventListener(n, function () { curS = null; }); });
    var use = btn('kl-btn kl-big', 'Use my drawing'), clr = btn('kl-btn', 'Clear');
    clr.addEventListener('click', function () { strokes = []; redraw(); });
    use.addEventListener('click', function () { if (!strokes.length) return;
      var d = strokes.map(function (st) { return st.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] * scale).toFixed(1) + ' ' + (p[1] * scale).toFixed(1); }).join('') + (st.length === 1 ? 'l0 0' : ''); }).join('');
      useArt({ kind: 'draw', vb: '0 0 ' + W.toFixed(1) + ' ' + (W / (PHI * PHI)).toFixed(1), paths: [{ d: d, stroke: (lw() * scale).toFixed(1) }] }); });
    foot([backBtn(), clr, use]); requestAnimationFrame(fit);
  }
  function typePanel() {
    frame('Type it in');
    var f = el('form', 'kl-type'), lab = el('label', null, 'Your logo words'), inp = el('input'), msg = el('p', 'kl-msg');
    inp.type = 'text'; inp.maxLength = MAXLEN; inp.autocomplete = 'off'; inp.id = 'kl-type-in'; lab.htmlFor = inp.id; msg.setAttribute('role', 'alert');
    f.appendChild(lab); f.appendChild(inp); ed.appendChild(f); ed.appendChild(heart()); ed.appendChild(msg);
    var use = btn('kl-btn kl-big', 'Use these words');
    function go(e) { e = e || {}; if (e.preventDefault) e.preventDefault(); var n = inp.value.replace(/\s+/g, ' ').trim(), why = check(n);
      if (why === 'empty') return; if (why) { msg.textContent = why; return; }
      if (cfg.nameLogo && cfg.nameList && !e.nameChecked) return nameStep(n);
      var H = (svg && (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number)[3]) || PHI, fs = H * Math.pow(PHI, -1);   // phi: letters PHI^-1 of her logo's height
      useArt({ kind: 'type', text: n, fs: fs, vb: '0 0 ' + (fs * n.length * Math.pow(PHI, -1) + fs).toFixed(1) + ' ' + H.toFixed(1) }); }   // phi: a cursive letter is about PHI^-1 em wide
    // name check on every word (only when the separate logo switch is on): a kind line with Surprise me or Leave it out, never a no
    function nameStep(n) {
      var NC = function () { return root.NameCheck; };
      (NC() ? Promise.resolve() : inj(cfg.base + 'js/name-check.js' + V)).then(function () { return NC() && (NC().ready() || NC().load(new URL(cfg.nameList, location.href).href)); })
        .then(function () { return NC() ? NC().check(n) : { hit: false }; }).then(function (r) {
          if (!r.hit) return go({ preventDefault: function () {}, nameChecked: true });
          msg.textContent = ''; msg.appendChild(el('span', 'kl-heart', NC().LINE));
          var sb = btn('kl-btn', 'Surprise me'), lb = btn('kl-btn', 'Leave the name out');
          sb.addEventListener('click', function () { inp.value = NC().surprise(); msg.textContent = ''; });
          lb.addEventListener('click', function () { NC().omit(n).then(function (t) { inp.value = t; msg.textContent = ''; if (t) go({ preventDefault: function () {}, nameChecked: true }); }); });
          msg.appendChild(sb); msg.appendChild(lb);
        });
    }
    f.addEventListener('submit', go); use.addEventListener('click', go);
    foot([backBtn(), use]); inp.focus({ preventScroll: true });
  }
  function filePanel() {
    frame('Use a vector file');
    var f = el('input'), msg = el('p', 'kl-msg'); f.type = 'file'; f.accept = '.svg,image/svg+xml'; f.setAttribute('aria-label', 'Choose an SVG file');
    ed.appendChild(el('p', 'kl-yay', 'Pick an SVG drawing. Only its shapes are kept; nothing is uploaded, it stays on this device.'));
    ed.appendChild(f); ed.appendChild(heart()); ed.appendChild(msg); msg.setAttribute('role', 'alert');
    f.addEventListener('change', function () { var file = f.files && f.files[0]; if (!file) return;
      file.text().then(function (t) { var a = clean(t); if (typeof a === 'string') { msg.textContent = a; return; } useArt(a); }, function () { msg.textContent = 'That file could not be read.'; }); });
    foot([backBtn()]);
  }
  var MAXD = 75025;                                                                       // phi: Fibonacci cap on path characters kept on the device
  function clean(t) {   // the same rules as /workspace/logos/finish_bonnies_logo_swap.sh: shapes only, no scripts, images, links or text
    var low = t.toLowerCase(), bad = ['<image', 'base64', '<script', 'javascript:', 'onload', '<foreignobject', 'xlink:href', '<use', '<style', '<text'];
    for (var i = 0; i < bad.length; i++) if (low.indexOf(bad[i]) !== -1) return 'That file has parts we can\u2019t use. Try a simple drawing made of shapes.';
    var d; try { d = new DOMParser().parseFromString(t, 'image/svg+xml'); } catch (e) { return 'That doesn\u2019t look like an SVG file.'; }
    var r = d.documentElement; if (!r || r.nodeName.toLowerCase() !== 'svg' || d.getElementsByTagName('parsererror').length) return 'That doesn\u2019t look like an SVG file.';
    var ok = { svg: 1, g: 1, path: 1, title: 1, desc: 1 }, els = r.getElementsByTagName('*');
    for (var j = 0; j < els.length; j++) if (!ok[els[j].nodeName.toLowerCase()]) return 'Only drawings made of paths work here for now.';
    var vb = r.getAttribute('viewBox'); if (!/^\s*-?[\d.]+([\s,]+-?[\d.]+){3}\s*$/.test(vb || '')) return 'That file needs a viewBox (its drawing size).';
    var ps = [].slice.call(r.getElementsByTagName('path')).map(function (p) { return { d: p.getAttribute('d') || '', rule: p.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : '' }; })
      .filter(function (p) { return /^[\sMmLlHhVvCcSsQqTtAaZz\d.,eE+-]+$/.test(p.d); });
    if (!ps.length) return 'No drawing found in that file.';
    if (ps.reduce(function (a, p) { return a + p.d.length; }, 0) > MAXD) return 'That drawing is too detailed to keep on this device.';
    return { kind: 'file', vb: vb.trim(), paths: ps };
  }

  // ---- events ----
  x.addEventListener('click', function (e) { e.stopPropagation(); close(); });
  edB.addEventListener('click', function (e) { e.stopPropagation(); editor(); });
  fig.addEventListener('click', function (e) { e.stopPropagation(); if (!ov.classList.contains('kl-editing')) editor(); });
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  doc.addEventListener('keydown', function (e) { if (!cur) return;
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  doc.addEventListener('focusin', function (e) { if (cur && !ov.contains(e.target)) x.focus({ preventScroll: true }); });
  // ---- FIT (Kids Club 'every screen fits the smallest phone, in its measured space', Danny 15:41 AWST 26 Oct 2026) ----
  // The view sizes itself from the measured box: the visual viewport after the safe areas, below the Edit / X row, and clear of
  // Rebella's Get me out button (the safety exit never moves; the view keeps out of its way: under it when tall, beside it when wide).
  // Wider than tall: logo and editor sit side by side. Still too big: the sizes step down the phi ladder (--kl-k = PHI^-n) until
  // PHI^-3 of the box is left free; text never goes under the reader's 1em and taps never under the cited floor, so past the
  // floors the view scrolls from the top with the exit band kept clear. Re-fits on resize, rotation, Safari's bars and fonts loading.
  var fitProbe = null, fitRq = 0, FREE = 1 - Math.pow(PHI, -3), STEPS = 9;               // phi: PHI^-3 left free; unit: PHI^0..PHI^-4 in half rungs (PHI^-1/2 each, shared.md 17:20)
  function insets() {
    if (!fitProbe) { fitProbe = el('i'); fitProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; doc.body.appendChild(fitProbe); }
    var c = getComputedStyle(fitProbe); return { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
  }
  function px(v) { return v + 'px'; }                                                     // unit: CSS pixels
  function fit() {
    fitRq = 0; if (!cur || ov.hidden) return;
    var v = root.visualViewport, s = insets(), st = ov.style;
    var x0 = (v ? v.offsetLeft : 0) + s.l, y0 = (v ? v.offsetTop : 0) + s.t;
    var W = (v ? v.width : root.innerWidth) - s.l - s.r, H = (v ? v.height : root.innerHeight) - s.t - s.b;   // anchor: measured viewport after the safe areas
    var g = (bar.getBoundingClientRect().height || 1) * Math.pow(PHI, -3);              // phi: one gap = the button row's height x PHI^-3
    var top = bar.getBoundingClientRect().bottom - y0 + g, bot = g, rgt = g, lft = g;
    var wide = W > H, esc = doc.querySelector('.escape[data-escape], a.escape');
    if (esc && esc.getClientRects().length) {
      var e = esc.getBoundingClientRect();
      if (wide && e.left > x0 + W / 2) rgt = Math.max(rgt, x0 + W - e.left + g);         // wide: keep beside it
      else bot = Math.max(bot, y0 + H - e.top + g);                                       // tall: keep above it
    }
    var bw = Math.max(1, W - lft - rgt), bh = Math.max(1, H - top - bot);
    st.setProperty('--kl-pt', px(top + s.t)); st.setProperty('--kl-pb', px(bot + s.b)); st.setProperty('--kl-pr', px(rgt + s.r)); st.setProperty('--kl-pl', px(lft + s.l));
    st.setProperty('--kl-bw', px(bw)); st.setProperty('--kl-bh', px(bh));
    st.setProperty('--kl-p', String(wide ? 1 : 1 / PHI));                                 // phi: portrait sizes from the short side x PHI^-1 (shared.md 17:20); landscape keeps its own rule
    ov.classList.toggle('kl-wide', wide); if (ov.classList.contains('kl-scroll')) ov.classList.remove('kl-scroll');
    var parts = [fig].concat(ed.hidden ? [] : [ed]), n = 0;
    function fits() {
      var a = parts.map(function (p) { return { width: p.offsetWidth, height: p.offsetHeight }; });   // unit: layout boxes (the open glide's scale is not counted)
      var w = wide ? a.reduce(function (t, r) { return t + r.width; }, 0) : Math.max.apply(null, a.map(function (r) { return r.width; }));
      var h = wide ? Math.max.apply(null, a.map(function (r) { return r.height; })) : a.reduce(function (t, r) { return t + r.height; }, 0);
      return h <= bh * FREE && w <= bw;
    }
    ov.classList.add('kl-fitting');                                                       // measure the settled sizes, not a glide in progress
    for (n = 0; n < STEPS; n++) { st.setProperty('--kl-k', String(Math.pow(PHI, -n / 2))); if (fits()) break; }   // phi: step down by PHI^-1/2
    if (n >= STEPS) { st.setProperty('--kl-k', String(Math.pow(PHI, (1 - STEPS) / 2))); ov.classList.add('kl-scroll'); }   // past the floors: scroll, top first
    ov.setAttribute('data-fit', String(Math.min(n, STEPS - 1)));
    void ov.offsetWidth; ov.classList.remove('kl-fitting');
  }
  function refit() { if (cur && !fitRq) fitRq = requestAnimationFrame(fit); }
  root.addEventListener('resize', refit); root.addEventListener('orientationchange', refit);
  if (root.visualViewport) { visualViewport.addEventListener('resize', refit); visualViewport.addEventListener('scroll', refit); }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(refit);
  if (root.MutationObserver) new MutationObserver(refit).observe(ed, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(refit).observe(ov, { attributes: true, attributeFilter: ['hidden'] });

  root.KidLogoView = { open: open, close: close, isOpen: function () { return !!cur; }, editing: function () { return ov.classList.contains('kl-editing'); } };
})(window);
