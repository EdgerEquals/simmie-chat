/* GENERATED copy of rebella moderation/js/sticky-head.js (tools/sync_dash_header.py): shared header/footer, chat-page scope. */
/* PREVIEW ONLY: sticky black header helper (see css/sticky-head.css). Measures the preview band and header heights into
   CSS vars (for top + scroll-margin-top) and toggles the compact state with hysteresis, so it never flickers at the edge. */
(function () {
  'use strict';
  var band = document.querySelector('.preview-band'), head = document.getElementById('dash-head'), root = document.documentElement;
  if (!head) return;
  var ON_AT = 72, OFF_AT = 8, compact = false, raf = 0;
  function measure() {
    var bh = band ? band.getBoundingClientRect().height : 0;
    root.style.setProperty('--dash-band-h', bh.toFixed(1) + 'px');
    // anchors always land with the header compact (it compacts as soon as the page scrolls), so measure the compact height
    var was = head.classList.contains('is-scrolled'), hh;
    if (was) hh = head.getBoundingClientRect().height;
    else { head.classList.add('mtr', 'is-scrolled'); hh = head.getBoundingClientRect().height; head.classList.remove('is-scrolled'); void head.offsetHeight; head.classList.remove('mtr'); }
    root.style.setProperty('--dash-sticky-h', (bh + hh).toFixed(1) + 'px');
  }
  function onScroll() {
    raf = 0;
    var y = window.scrollY || root.scrollTop || 0, want = compact ? y > OFF_AT : y > ON_AT;
    if (want !== compact) { compact = want; head.classList.toggle('is-scrolled', compact); }
    measure();
  }
  window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  window.addEventListener('resize', measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(head);
  measure(); onScroll();
})();
