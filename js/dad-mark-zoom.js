/* Dad's mark tap-to-enlarge (Danny t699u 25 Oct 2026, questionnaire only). See css/dad-mark-zoom.css.
   Opens a centred modal with the mark large (same SVG, so its satellite/sweep animations keep running), scaling up from the small
   mark's position over PHI^-2 = 0.382 s (reduced motion: appears/disappears instantly). Closes on a tap outside the mark, the X, or Esc;
   focus moves to the X while open (Tab stays inside) and returns to the small mark on close. Self-contained: DadMarkZoom.open()/close(). */
(function(){
  'use strict';
  var btn=document.querySelector('.q-head .dad-zoom');if(!btn)return;
  var src=(btn.querySelector('img')||{}).src||'';
  var D=382,rm=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var ov=document.createElement('div');ov.className='dmz';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',"Dad's logo, enlarged");
  ov.innerHTML='<button type="button" class="dmz-x" aria-label="Close">&times;</button><figure class="dmz-fig"><img alt="Dad\u2019s world equals mark" src="'+src.replace(/"/g,'&quot;')+'"></figure>';
  document.body.appendChild(ov);
  var fig=ov.querySelector('.dmz-fig'),x=ov.querySelector('.dmz-x'),isOpen=false,t=null;
  function fromMark(){var a=btn.querySelector('img').getBoundingClientRect();fig.style.transition='none';fig.style.transform='none';
    var b=fig.getBoundingClientRect();if(!b.width)return 'none';return 'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px) scale('+(a.width/b.width)+')';}
  function open(){if(isOpen)return;isOpen=true;clearTimeout(t);try{window.QuizPopups&&QuizPopups.close();}catch(e){}
    ov.hidden=false;btn.setAttribute('aria-expanded','true');
    if(!rm.matches){var f=fromMark();fig.style.transform=f;void fig.offsetWidth;fig.style.transition='';}
    requestAnimationFrame(function(){ov.classList.add('is-open');fig.style.transform='none';});
    x.focus({preventScroll:true});}
  function close(){if(!isOpen)return;isOpen=false;btn.setAttribute('aria-expanded','false');ov.classList.remove('is-open');
    if(rm.matches){ov.hidden=true;}else{var f=fromMark();fig.style.transform='none';void fig.offsetWidth;fig.style.transition='';fig.style.transform=f;
      t=setTimeout(function(){ov.hidden=true;fig.style.transform='';},D);}
    btn.focus({preventScroll:true});}
  btn.setAttribute('aria-expanded','false');
  btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open();});
  x.addEventListener('click',function(e){e.stopPropagation();close();});
  ov.addEventListener('click',function(e){if(!fig.contains(e.target))close();});
  document.addEventListener('keydown',function(e){if(!isOpen)return;
    if(e.key==='Escape'||e.key==='Esc'){e.preventDefault();e.stopPropagation();close();}
    else if(e.key==='Tab'){e.preventDefault();x.focus({preventScroll:true});}},true);
  window.DadMarkZoom={open:open,close:close,isOpen:function(){return isOpen;}};
})();
