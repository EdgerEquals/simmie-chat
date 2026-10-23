/* Landscape strip (chat review preview only). Phones and tablets held sideways: nothing moves into the header.
   The weather chip, animal lane, fact feed, space lane, a thin one-line terminal and the play controls go into ONE row
   just above the full-width typing box. The row scrolls sideways (snap, no visible scrollbar), so nothing is clipped at
   the edges after a rotation. Rotating back to portrait puts every element back exactly where it was. */
(function () {
  'use strict';
  const chat = document.getElementById('screen-chat'), composer = document.getElementById('send-form');
  if (!chat || !composer || !window.matchMedia) return;
  const mq = window.matchMedia('(orientation: landscape) and (pointer: coarse)');
  const IDS = ['wx', 'lane-h', 'fact-ticker', 'lane-f', 'tty-dock', 'play'];   // order along the row
  const strip = document.createElement('div');
  strip.id = 'ls-strip'; strip.className = 'ls-strip'; strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Simmie strip: weather, feed, terminal and play');
  const marks = new Map(); let on = false;
  function apply() {
    const want = mq.matches;
    if (want === on) return; on = want;
    if (on) {
      composer.parentNode.insertBefore(strip, composer);
      IDS.forEach((id) => {
        const el = document.getElementById(id); if (!el) return;
        const m = document.createComment('ls:' + id); el.parentNode.insertBefore(m, el); marks.set(id, m);
        el.classList.add('ls-seg'); strip.appendChild(el);
      });
      chat.classList.add('ls'); strip.scrollLeft = 0;
    } else {
      IDS.forEach((id) => { const el = document.getElementById(id), m = marks.get(id); if (el && m) { m.parentNode.insertBefore(el, m); m.remove(); el.classList.remove('ls-seg'); } });
      marks.clear(); strip.remove(); chat.classList.remove('ls');
    }
    window.dispatchEvent(new CustomEvent('simmie:log', { detail: on ? 'layout: landscape strip' : 'layout: portrait' }));
  }
  if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 0));
  apply();
})();
