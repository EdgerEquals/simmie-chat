/* Theme switch (Danny t0u, 25 Oct 2026), questionnaire only. The footer tty satellite (#thm) flips the page between Dad's dark
   theme (default) and the light theme (css/quiz-light.css). The choice is kept in localStorage under dadQuizTheme; the inline script
   at the top of <head> applies it before first paint. Tier 1 (plain defer). In light: the space-loop video is paused (it is hidden)
   and the matrix rain draws in deeper greens. Flip on Simmie's ladder (PHI^1 x PHI^-1.5 = 0.786 s); none under reduced motion. */
(function(){
  'use strict';
  var K='dadQuizTheme',de=document.documentElement,b=document.getElementById('thm');if(!b||b._thm)return;b._thm=1;
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
  var RAIN={dark:{head:'#E8FFEE',body:'#00FF41',dim:'#008F2A'},light:{head:'#075A21',body:'#1E8A44',dim:'#6FBF8A'}};
  function light(){return de.getAttribute('data-theme')==='light';}
  function rain(){var m=window.MatrixRain;if(!m||!m.params)return false;var c=RAIN[light()?'light':'dark'];m.params.head=c.head;m.params.body=c.body;m.params.dim=c.dim;return true;}
  function video(){var v=document.getElementById('bgloop');if(!v||!v.getAttribute('data-on'))return;
    if(light()||document.hidden||(rm&&rm.matches)){try{v.pause();}catch(e){}}else{var p=v.play();if(p&&p.catch)p.catch(function(){});}}
  function sync(){var l=light();b.setAttribute('aria-pressed',l?'true':'false');b.title=l?'Switch to dark theme':'Switch to light theme';rain();video();}
  b.addEventListener('click',function(){
    if(light())de.removeAttribute('data-theme');else de.setAttribute('data-theme','light');
    try{localStorage.setItem(K,light()?'light':'dark');}catch(e){}
    sync();
    if(!(rm&&rm.matches)){b.classList.remove('thm-go');void b.offsetWidth;b.classList.add('thm-go');clearTimeout(b._t);b._t=setTimeout(function(){b.classList.remove('thm-go');},786);}
  });
  document.addEventListener("visibilitychange",function(){setTimeout(function(){if(light())video();},0);});
  // the video and the rain start later (tier 2): catch up once they exist
  var n=0;(function wait(){var ok=rain();var v=document.getElementById('bgloop');if(light()&&v&&v.getAttribute('data-on'))video();if((!ok||!(v&&v.getAttribute('data-on')))&&++n<20)setTimeout(wait,1618);})();
  sync();
})();
