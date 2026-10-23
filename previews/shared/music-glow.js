/* PREVIEW ONLY: BPM-synced glow for the music-note button (see music-glow.css). No network, no storage, no audio access:
   it only reads Dad's auto-DJ BPM target (window.DadDJ.now.bpm) when that page has the DJ, else uses the phi default.
   The vars change only at a colour-drift cycle boundary (rule 10: never mid-fade), so nothing jumps. */
(function () {
  'use strict';
  var PHI = 1.6180339887, DEFAULT_BPM = 60 / Math.pow(PHI, -1);   // 97.08 BPM, beat PHI^-1 = 0.618 s
  function current() {
    try { var n = window.DadDJ && window.DadDJ.now; if (n && isFinite(n.bpm) && n.bpm > 0) return { bpm: n.bpm, src: 'dad-dj' }; } catch (e) {}
    return { bpm: DEFAULT_BPM, src: 'phi-default' };
  }
  var root = null, pill = null, beat = 0;
  function set(restart) {
    var c = current(), b = 60 / c.bpm, changed = Math.abs(b - beat) > 0.005;
    if (!changed && !restart) return;
    beat = b;
    root.style.setProperty('--mg-beat', b.toFixed(3) + 's');
    root.style.setProperty('--mg-drift', (b * Math.pow(PHI, 4)).toFixed(3) + 's');
    root.setAttribute('data-mg-bpm', String(Math.round(c.bpm))); root.setAttribute('data-mg-src', c.src);
    if (changed && pill && pill.getAnimations) {   // restart both animations together, so beat and drift stay in phase
      pill.style.animation = 'none'; void pill.offsetWidth; pill.style.animation = '';
    }
  }
  function attach() {
    var r = document.querySelector('.bm'); if (!r) return false;
    var p = r.querySelector('.bm-pill'); if (!p) return false;
    if (r === root && p === pill) return true;
    root = r; pill = p; beat = 0; root.classList.add('mg'); set(true);
    pill.addEventListener('animationiteration', function (e) { if (e.animationName === 'mg-drift') set(false); });
    return true;
  }
  function boot() {
    if (attach()) return;
    var mo = new MutationObserver(function () { if (attach()) mo.disconnect(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  window.MusicGlow = { get bpm() { return current(); }, get beat() { return beat; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
