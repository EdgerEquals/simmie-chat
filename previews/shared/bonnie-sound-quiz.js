/* Questionnaire hooks for Bonnie's sounds (bonnie-sound.js, data-page="quiz"). Display-only: listens to clicks and to
   Simmie's terminal line; never reads what Bonnie types. Uses whatever cues the sound layer has (falls back to older ones). */
(function () {
  'use strict';
  var PHI = 1.6180339887;
  function S() { return window.BonnieSound; }
  function has(k) { var b = S(); return b && b.CUES && b.CUES.indexOf(k) >= 0; }
  function cue(k, lv, fb) { var b = S(); if (!b) return; b.cue(has(k) || !fb ? k : fb, lv); }
  var last = {};
  function limited(k, sec) { var n = performance.now(); if (last[k] && n - last[k] < sec * 1000) return true; last[k] = n; return false; }
  function boot() {
    // answer tiles (choice pairs and Yes/No): dial click on the press, peak on the answer, then a sparkle as the question completes
    ['t0', 't1'].forEach(function (id) {
      var t = document.getElementById(id); if (!t) return;
      t.addEventListener('pointerdown', function () { cue('dial-click', 0.5, 'press'); });
      t.addEventListener('click', function () {
        cue('peak', 1.1);
        setTimeout(function () { cue('sparkle'); }, Math.pow(PHI, -1) * 1000);          // 0.618 s
        setTimeout(function () { cue('sparkle'); }, Math.pow(PHI, -1) * 1000 + Math.pow(PHI, -3.5) * 1000);
      });
    });
    // Send (a note to Dad): capture phase, so it runs before the page clears the box; only checks it isn't empty
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('#send')) return;
      var n = document.getElementById('note'); if (n && n.value.trim()) cue('send-whoosh', 0.6, 'new');
    }, true);
    var sum = document.getElementById('summary');
    if (sum) new MutationObserver(function () { if (!sum.hidden) { cue('send-whoosh', 0.6, 'dad'); setTimeout(function () { cue('peak', 1.2); }, Math.pow(PHI, -1) * 1000); } })
      .observe(sum, { attributes: true, attributeFilter: ['hidden'] });
    // Simmie's lines in the footer terminal: a chime when a new 'simmie>' line starts (at most one per PHI^4 = 6.85 s)
    var cur = document.getElementById('tcur');
    if (cur) new MutationObserver(function () {
      var pr = cur.firstElementChild; if (!pr || !pr.classList.contains('pr') || pr.textContent.indexOf('simmie') !== 0) return;
      if (limited('simmie', Math.pow(PHI, 4))) return;
      cue('simmie', 0.45, 'new');
    }).observe(cur, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
