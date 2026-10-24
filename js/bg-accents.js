/* Chat background accents (css/bg-accents.css): adds the wave + shimmer layers inside the existing .chat-bg and runs them only
   while the chat screen is open and the tab is visible. Decorative only: no network, no storage, no pop-ups, no message access. */
(function () {
  'use strict';
  var bg = document.querySelector('.chat-bg'), scr = document.getElementById('screen-chat');
  if (!bg || bg.querySelector('.cbw')) return;
  var w = document.createElement('div'); w.className = 'cbw'; w.setAttribute('aria-hidden', 'true');
  w.innerHTML = '<div class="cbw-dots"></div><div class="cbw-spark cbw-s1"></div><div class="cbw-spark cbw-s2"></div><div class="cbw-spark cbw-s3"></div>';
  bg.appendChild(w);
  function sync() { document.documentElement.classList.toggle('cbw-run', !!scr && !scr.hidden && !document.hidden); }
  document.addEventListener('visibilitychange', sync);
  if (scr) new MutationObserver(sync).observe(scr, { attributes: true, attributeFilter: ['hidden'] });
  sync();
})();
