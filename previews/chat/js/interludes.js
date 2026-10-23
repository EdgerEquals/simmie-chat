/* Interludes (same rhythm as the questionnaire + dashboard previews): Bonnie's animals 🐎🐇🐕🐦 every 9 s and
   Simmie's space crew 🛰️🚀☄️🌙 every 12 s (3 against 4, they coincide every 36 s and then split the two lanes).
   Explicit per-emoji facing: each glyph's native heading is listed, and it is flipped / rotated to face its travel.
   Transform + opacity only; skipped while the tab is hidden; off entirely under reduced motion. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // native heading of each glyph in common emoji fonts (Apple, Noto): 'left' = faces left; deg = direction it points
  const FACING = {
    '🐎': { faces: 'left' }, '🐇': { faces: 'left' }, '🐕': { faces: 'left' }, '🐦': { faces: 'left' },
    '🚀': { deg: -45 },    // points up-right
    '☄️': { deg: 135 },    // head lower-left, so it travels toward lower-left
    '🛰️': { deg: null }, '🌙': { deg: null },   // orbiters: no heading
  };
  const ANIMALS = [{ e: '🐎', n: 'horse', g: 'trot' }, { e: '🐇', n: 'rabbit', g: 'hop' }, { e: '🐕', n: 'dog', g: 'collie' }, { e: '🐦', n: 'bird', g: 'fly' }];
  const SPACE = ['sat', 'rocket', 'comet', 'moon'];
  const log = (t) => window.dispatchEvent(new CustomEvent('simmie:log', { detail: t }));
  const lanes = { header: document.getElementById('lane-h'), footer: document.getElementById('lane-f') };
  if (!lanes.header || !lanes.footer) return;
  const W = (l) => l.clientWidth || 300;
  const face = (e, dirRight) => { const f = FACING[e]; return f && f.faces === 'left' ? (dirRight ? 'scaleX(-1)' : 'scaleX(1)') : f && f.faces === 'right' ? (dirRight ? 'scaleX(1)' : 'scaleX(-1)') : 'none'; };
  const turn = (e, travelDeg) => { const f = FACING[e]; return f && typeof f.deg === 'number' ? 'rotate(' + (travelDeg - f.deg) + 'deg)' : 'none'; };
  function item(lane, html) { const d = document.createElement('span'); d.className = 'il-it'; d.innerHTML = html; lane.appendChild(d); return d; }
  function run(d, frames, ms) { const a = d.animate(frames, { duration: ms, easing: 'linear', fill: 'forwards' }); a.onfinish = () => d.remove(); return a; }
  let aN = 0, sN = 0, dir = 1, satN = 0;
  function animal(band) {
    const A = ANIMALS[aN++ % ANIMALS.length], lane = lanes[band]; dir = -dir;
    const right = dir > 0, w = W(lane), from = right ? -24 : w + 8, to = right ? w + 8 : -24;
    const d = item(lane, '<span class="il-g"><span class="il-f" style="transform:' + face(A.e, right) + '">' + A.e + '</span></span>');
    if (A.g === 'fly') d.classList.add('il-bird');
    const g = d.firstChild, jit = 0.85 + Math.random() * 0.3, ms = Math.round((A.g === 'fly' ? 7000 : 6000) * jit);
    const X = (x) => ({ transform: 'translateX(' + x + 'px)' });
    if (A.g === 'collie') {   // low trot, a bound, a look-back pause
      run(d, [X(from), { ...X(from + (to - from) * .45), offset: .4 }, { ...X(from + (to - from) * .55), offset: .5 }, { ...X(from + (to - from) * .55), offset: .66 }, X(to)], Math.round(ms * 1.2));
      g.animate([{ transform: 'translateY(1px)' }, { transform: 'translateY(-1px)' }, { transform: 'translateY(1px)' }], { duration: 300, iterations: Infinity });
      const f = g.firstChild, a = face(A.e, right), b = face(A.e, !right);
      setTimeout(() => { if (f.isConnected) f.animate([{ transform: a }, { transform: b, offset: .2 }, { transform: b, offset: .8 }, { transform: a }], { duration: 900 }); }, Math.round(ms * 1.2 * .52));
    } else {
      run(d, [X(from), X(to)], ms);
      const bob = A.g === 'hop' ? [{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)', offset: .45 }, { transform: 'translateY(0)', offset: .9 }, { transform: 'translateY(0)' }]
        : A.g === 'fly' ? [{ transform: 'translateY(0) scaleY(1)' }, { transform: 'translateY(-3px) scaleY(.8)', offset: .25 }, { transform: 'translateY(0) scaleY(1)', offset: .5 }, { transform: 'translateY(2px) scaleY(.9)', offset: .75 }, { transform: 'translateY(0) scaleY(1)' }]
        : [{ transform: 'translateY(0)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(0)' }];
      g.animate(bob, { duration: A.g === 'hop' ? 560 : A.g === 'fly' ? 900 : 380, iterations: Infinity });
    }
    log(A.e + ' ' + A.n + ' crossing ' + band);
  }
  function orbit(lane, center, sat, r, ms) {
    const w = W(lane), x = Math.round(w * (.3 + Math.random() * .4));
    const c = item(lane, center); c.style.transform = 'translateX(' + x + 'px)';
    const s = item(lane, sat); s.style.fontSize = '9px'; const fr = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * 2 * Math.PI; fr.push({ transform: 'translate(' + (x + 3 + Math.cos(a) * r) + 'px,' + (-2 + Math.sin(a) * 4) + 'px)' }); }
    s.animate(fr, { duration: ms, iterations: 2 }).onfinish = () => { s.remove(); c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 }).onfinish = () => c.remove(); };
  }
  function space(band) {
    const k = SPACE[sN++ % SPACE.length], lane = lanes[band], w = W(lane);
    if (k === 'sat') { satN++; orbit(lane, '🪐', '🛰️', 16, 2600); log('🛰️ sat orbit ' + satN + ' (' + band + ')'); }
    else if (k === 'moon') { orbit(lane, '🌍', '🌙', 15, 3000); log('🌙 moon circling earth (' + band + ')'); }
    else if (k === 'rocket') {   // travels left to right, nose turned to face the way it's going
      const r = item(lane, '<span class="il-f" style="display:inline-block;transform:' + turn('🚀', 0) + '">🚀</span>');
      run(r, [{ transform: 'translate(-20px,2px)' }, { transform: 'translate(' + w / 2 + 'px,-3px)' }, { transform: 'translate(' + (w + 20) + 'px,2px)' }], 4200);
      log('🚀 rocket across ' + band);
    } else {   // comet travels right to left, head first, sparkle tail behind it
      const c = item(lane, '<span class="il-f" style="display:inline-block;transform:' + turn('☄️', 180) + '">☄️</span><span style="opacity:.6;font-size:9px">✨</span>');
      run(c, [{ transform: 'translateX(' + (w + 10) + 'px)', opacity: 0 }, { transform: 'translateX(' + w * .8 + 'px)', opacity: 1, offset: .1 }, { transform: 'translateX(-40px)', opacity: .9 }], 4800);
      log('☄️ comet through ' + band);
    }
  }
  const t0 = Date.now(); let lastA = -1, lastS = -1;
  setInterval(() => {
    if (document.hidden) return;
    const t = (Date.now() - t0) / 1000, ka = Math.floor(t / 9), ks = Math.floor(t / 12), fa = ka > lastA && ka > 0, fs = ks > lastS && ks > 0;
    if (fa) lastA = ka; if (fs) lastS = ks;
    if (fa && fs) { animal('footer'); space('header'); return; }   // they meet every 36 s: split the lanes
    if (fa) animal(ka % 2 ? 'header' : 'footer');
    if (fs) setTimeout(() => space(ks % 2 ? 'footer' : 'header'), 1000);
  }, 250);
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('.il-lane *').forEach((n) => n.getAnimations().forEach((a) => (document.hidden ? a.pause() : a.play())));
  });
})();
