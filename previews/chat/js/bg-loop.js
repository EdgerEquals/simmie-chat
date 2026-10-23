/* PREVIEW ONLY: puts the animated background layers (css/bg-loop.css) behind the page and hands their periods to PhiTiming
   (weather sweep at cycle boundaries, golden-angle start offsets). Decorative only: no network, no storage, no pop-ups. */
(function () {
  'use strict';
  const d = document.createElement('div'); d.className = 'bgl'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<div class="bgl-glow"></div><div class="bgl-dots"></div><div class="bgl-code"></div>';
  document.body.insertBefore(d, document.body.firstChild);
  const P = window.PhiTiming; if (!P || !P.register) return;   // CSS fallbacks keep the base timings
  P.register('.bgl-glow', 6.75, { k: 13 });
  P.register('.bgl-dots', 7.75, { k: 14 });
  P.register('.bgl-code', 8.75, { k: 15 });
})();
