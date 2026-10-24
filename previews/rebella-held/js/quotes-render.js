/* Fills every [data-rebel-quote] slot with a different random quote from js/quotes.js on each page load.
   Without JS the slot keeps the quote _generator.py pre-rendered, so it's never blank. */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fill() {
    var Q = window.REBELLA_QUOTES || [];
    var slots = document.querySelectorAll('[data-rebel-quote]');
    if (!Q.length || !slots.length) return;
    var idx = Q.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var used = {}, n = 0;
    slots.forEach(function (slot) {
      var q = null;
      while (n < idx.length) { var c = Q[idx[n++]]; if (!used[c.person]) { q = c; break; } }   // different person in each slot
      if (!q) q = Q[idx[n++ % idx.length]];
      used[q.person] = 1;
      var fig = slot.querySelector('figure') || el('figure', 'rq-paper');
      fig.innerHTML = '';
      var bq = el('blockquote', 'rq-text'); bq.appendChild(el('p', null, q.quote));
      if (/^https:\/\//.test(q.source) || /^http:\/\//.test(q.source)) bq.setAttribute('cite', q.source);
      var cap = el('figcaption', 'rq-cap');
      cap.appendChild(el('span', 'rq-person', q.person));
      cap.appendChild(el('span', 'rq-who', q.who));
      var src = el('a', 'rq-src', 'Source: ' + q.context); src.href = q.source; src.rel = 'noopener';
      cap.appendChild(src);
      fig.appendChild(bq); fig.appendChild(cap);
      if (!fig.parentNode) slot.appendChild(fig);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
