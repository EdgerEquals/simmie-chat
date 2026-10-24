/* PREVIEW ONLY: Dad's DJ pill (Danny 24 Oct 2026 11:06 AWST). Toggles the Dad's DJ pop-up under the pinned header.
   Opens/closes on the pill; closes on the X, Esc, or a tap/click outside. Closing only hides the panel, so music keeps playing.
   aria-expanded on the pill; focus moves into the panel on open and back to the pill on close (X / Esc). */
(function(){
  var pill=document.getElementById('dj-pill'),pop=document.getElementById('qh-djpop');if(!pill||!pop)return;
  var x=pop.querySelector('.djp-x'),play=document.getElementById('dj-play');
  function isOpen(){return !pop.hidden;}
  function open(){pop.hidden=false;pill.setAttribute('aria-expanded','true');if(play&&!play.disabled)play.focus({preventScroll:true});else if(x)x.focus({preventScroll:true});}
  function close(refocus){if(!isOpen())return;pop.hidden=true;pill.setAttribute('aria-expanded','false');if(refocus)pill.focus({preventScroll:true});}
  pill.addEventListener('click',function(){isOpen()?close(false):open();});
  if(x)x.addEventListener('click',function(){close(true);});
  document.addEventListener('keydown',function(e){if((e.key==='Escape'||e.key==='Esc')&&isOpen()){e.preventDefault();close(pop.contains(document.activeElement)||document.activeElement===pill);}});
  document.addEventListener('pointerdown',function(e){if(!isOpen())return;var t=e.target,panel=pop.querySelector('.dad-dj');
    if(pill.contains(t)||(panel&&panel.contains(t)))return;close(false);},true);
  // the pill's little light mirrors the DJ play state, so you can see the music is on while the pop-up is closed
  function sync(){var on=!!(play&&play.getAttribute('aria-pressed')==='true');pill.classList.toggle('is-playing',on);
    pill.setAttribute('aria-label',on?'Dad\u2019s DJ (music on)':'Dad\u2019s DJ');}
  if(play)new MutationObserver(sync).observe(play,{attributes:true,attributeFilter:['aria-pressed']});sync();
})();
