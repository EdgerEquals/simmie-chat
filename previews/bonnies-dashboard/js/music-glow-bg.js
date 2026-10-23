/* PREVIEW ONLY (Danny 2026-10-24 02:38 AWST): the music glow backdrop for Bonnie's Dashboard preview (see css/music-glow-bg.css).
   Replaces the old backdrop test (the space-loop video). No network, no storage, no microphone, no audio access of its own:
   it only reads Bonnie's sound layer (window.BonnieSound.bpm / .running) and listens to its 'bonnie-sound:cue' test event
   (cue kind only). Periods change only at a breathe-cycle boundary (rule 6: no jump mid-animation). ?bg=video = old video. */
(function () {
  'use strict';
  var PHI = 1.6180339887, G = 0.6180339887, H = document.documentElement;
  var old = false; try { old = new URLSearchParams(location.search).get('bg') === 'video'; } catch (e) {}
  if (old) return;
  function sweep() { try { var T = window.PhiTiming; var s = T && T.sweep ? +T.sweep() : 0; return isFinite(s) ? s : 0; } catch (e) { return 0; } }
  function beat() {   // seconds per beat from the sound layer (60 / bpm), else the same phi rule here
    try { var b = window.BonnieSound && window.BonnieSound.bpm; if (isFinite(b) && b > 0) return 60 / b; } catch (e) {}
    return Math.pow(PHI, -1 + sweep());
  }
  function frac(k) { return (k * G) % 1; }
  var box = null, cur = 0;
  function setVars(force) {
    var b = beat(); if (!force && Math.abs(b - cur) < 0.005) return; cur = b;
    var br = b * Math.pow(PHI, 4), dr = b * Math.pow(PHI, 8);
    box.style.setProperty('--mgb-breathe', br.toFixed(3) + 's'); box.style.setProperty('--mgb-drift', dr.toFixed(3) + 's');
    for (var k = 1; k <= 3; k++) { box.style.setProperty('--mgb-d' + k, (-br * frac(k)).toFixed(3) + 's'); box.style.setProperty('--mgb-e' + k, (-dr * frac(k)).toFixed(3) + 's'); }
    box.setAttribute('data-beat', b.toFixed(3));
  }
  function mount() {
    var bg = document.querySelector('#app .wx-bg'); if (!bg || box) return !!box;
    box = document.createElement('div'); box.className = 'mgb'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<i class="p1"></i><i class="p2"></i><i class="p3"></i><span class="lift"></span>';
    bg.insertBefore(box, bg.firstChild);
    var v = document.getElementById('wx-bg-video');            // the old backdrop test: stop it and take it out of the page
    if (v) { try { v.pause(); } catch (e) {} v.removeAttribute('autoplay'); v.preload = 'none'; v.remove(); }
    H.classList.add('mgb-on'); setVars(true);
    box.querySelector('.p1').addEventListener('animationiteration', function (e) { if (e.animationName === 'mgb-breathe') setVars(false); });
    return true;
  }
  // every generated sound lifts the glow for PHI^-1 s
  var hitT = 0;
  document.addEventListener('bonnie-sound:cue', function () {
    H.classList.add('mgb-hit'); clearTimeout(hitT); hitT = setTimeout(function () { H.classList.remove('mgb-hit'); }, Math.pow(PHI, -1) * 1000);
  });
  // LED on the music button: is the generated layer running? (checked every PHI^1 s)
  setInterval(function () { var r = false; try { r = !!(window.BonnieSound && window.BonnieSound.running && window.BonnieSound.on); } catch (e) {} H.classList.toggle('bs-live', r); }, Math.pow(PHI, 1) * 1000);
  function boot() { if (mount()) return; var mo = new MutationObserver(function () { if (mount()) mo.disconnect(); }); mo.observe(document.body, { childList: true, subtree: true }); }
  window.MusicGlowBg = { get beat() { return cur; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
