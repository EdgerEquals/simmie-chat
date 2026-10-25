/* Logo tap-to-enlarge, one module for both header logos (questionnaire only).
   Dad's mark: Danny t699u 25 Oct 2026. Bonnie's Rebella logo: Danny t701u 12:45 AWST 25 Oct ("Replicate that for the Rebella logo").
   Any <button data-zoom="…"> in .q-head opens one shared modal showing its logo large: Dad's mark as the same SVG <img> (its satellite/sweep
   animations keep running) with a soft cyan glow; the Rebella logo as the same vector <use> (crisp at any size), raspberry with a soft pink neon glow.
   It scales up from the small logo's spot over PHI^-2 = 0.382 s (reduced motion: appears/disappears instantly). Closes on a tap outside the logo,
   the X, or Esc; focus sits on the X while open (Tab stays inside) and returns to the logo's button on close. See css/dad-mark-zoom.css (file names kept from the dad-mark version).
   Light load (Danny t713u 25 Oct): the header <img> is a slim mark; its data-zoom-src names the DETAILED mark, which is fetched only when the
   zoom opens (or earlier from cache if js/load-tiers.js prefetched it at idle).
   Live physics (Danny t717u/t719u): when js/eq-physics.js is loaded (tier 3) and the mark has data-zoom-stage, the zoom shows the bar-less stage
   file and EqPhysics.attach() draws the equals, its particles, pulses and reflecting waves on a canvas over it; otherwise the CSS version shows.
   API: LogoZoom.open(name) / close() / isOpen(); DadMarkZoom kept as an alias for the dad mark. */
(function(){
  'use strict';
  var btns=[].slice.call(document.querySelectorAll('.q-head [data-zoom]'));if(!btns.length)return;
  var D=382,rm=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var ov=document.createElement('div');ov.className='dmz';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML='<button type="button" class="dmz-x" aria-label="Close">&times;</button><figure class="dmz-fig"></figure>';
  document.body.appendChild(ov);
  var fig=ov.querySelector('.dmz-fig'),x=ov.querySelector('.dmz-x'),cur=null,t=null,phys=null;
  function endPhys(){if(phys){phys.stop();phys=null;}}
  function srcEl(b){return b.querySelector('img,svg');}
  // Rebella neon (Danny t710u): rim + halo behind, small letter holes painted black on top of the glow, then the logo. Units = logo viewBox (1810 wide).
  var NS='http://www.w3.org/2000/svg';
  function glow(svg){var u=svg.querySelector('use');if(!u)return;var d=document.createElementNS(NS,'defs');
    // Layers (Danny t720u): [glow only: halo + pale rim] -> [black copy of the small letter holes, #bonnies-logo-holes] -> [the logo itself].
    // So the e/b/a holes stay black and full size with the same outer neon; the R bowl and heart keep their glow.
    d.innerHTML='<filter id="rbz-glow" x="-15%" y="-25%" width="130%" height="150%" color-interpolation-filters="sRGB">'+
      '<feGaussianBlur in="SourceAlpha" stdDeviation="20" result="b"/><feFlood flood-color="#E58AA6" flood-opacity=".9"/><feComposite in2="b" operator="in" result="halo"/>'+
      '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="r"/><feFlood flood-color="#F8CFDB" flood-opacity=".8"/><feComposite in2="r" operator="in" result="rim"/>'+
      '<feMerge><feMergeNode in="halo"/><feMergeNode in="rim"/></feMerge></filter>';
    svg.insertBefore(d,svg.firstChild);
    var href=u.getAttribute('href')||u.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';
    var g=u.cloneNode(false);g.setAttribute('filter','url(#rbz-glow)');svg.insertBefore(g,u);
    var h=u.cloneNode(false);h.setAttribute('href',href.replace(/#bonnies-logo$/,'#bonnies-logo-holes'));svg.insertBefore(h,u);}
  function build(b){var name=b.getAttribute('data-zoom'),s=srcEl(b),c;
    var live=name==='dad'&&window.EqPhysics&&!!s.getAttribute('data-zoom-stage');   // Danny t717u: live physics equals over the bar-less stage file
    if(s.tagName.toLowerCase()==='img'){c=document.createElement('img');c.decoding='async';c.src=(live&&s.getAttribute('data-zoom-stage'))||s.getAttribute('data-zoom-src')||s.src;c.alt=s.getAttribute('data-zoom-alt')||'';}
    else{c=s.cloneNode(true);c.removeAttribute('class');c.removeAttribute('width');c.removeAttribute('height');c.removeAttribute('style');c.setAttribute('preserveAspectRatio','xMidYMid meet');}
    if(name==='rebella'&&c.tagName.toLowerCase()==='svg'){glow(c);}
    fig.className='dmz-fig dmz--'+name;fig.innerHTML='';var w=document.createElement('div');w.className='dmz-art';w.appendChild(c);fig.appendChild(w);
    if(phys){phys.stop();phys=null;}if(live){try{phys=EqPhysics.attach(ov,c);}catch(e){phys=null;}}
    ov.setAttribute('aria-label',(b.getAttribute('data-zoom-title')||'Logo')+', enlarged');}
  function fromBtn(){var a=srcEl(cur).getBoundingClientRect();fig.style.transition='none';fig.style.transform='none';
    var b=fig.getBoundingClientRect();if(!b.width||!a.width)return 'none';
    return 'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px) scale('+(a.width/b.width)+','+(a.height/b.height)+')';}
  function open(b){if(cur)return;clearTimeout(t);try{window.QuizPopups&&QuizPopups.close();}catch(e){}
    cur=b;build(b);ov.hidden=false;b.setAttribute('aria-expanded','true');ov.classList.remove('is-open');
    if(!rm.matches){var f=fromBtn();fig.style.transform=f;void fig.offsetWidth;fig.style.transition='';}
    requestAnimationFrame(function(){ov.classList.add('is-open');fig.style.transform='none';});
    x.focus({preventScroll:true});}
  function close(){if(!cur)return;var b=cur;b.setAttribute('aria-expanded','false');ov.classList.remove('is-open');
    if(rm.matches){ov.hidden=true;endPhys();}else{var f=fromBtn();fig.style.transform='none';void fig.offsetWidth;fig.style.transition='';fig.style.transform=f;
      t=setTimeout(function(){ov.hidden=true;fig.style.transform='';endPhys();},D);}
    cur=null;b.focus({preventScroll:true});}
  btns.forEach(function(b){b.setAttribute('aria-expanded','false');b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b);});});
  x.addEventListener('click',function(e){e.stopPropagation();close();});
  ov.addEventListener('click',function(e){if(!fig.contains(e.target))close();});
  document.addEventListener('keydown',function(e){if(!cur)return;
    if(e.key==='Escape'||e.key==='Esc'){e.preventDefault();e.stopPropagation();close();}
    else if(e.key==='Tab'){e.preventDefault();x.focus({preventScroll:true});}},true);
  function byName(n){for(var i=0;i<btns.length;i++)if(btns[i].getAttribute('data-zoom')===n)return btns[i];return btns[0];}
  window.LogoZoom={open:function(n){open(byName(n));},close:close,isOpen:function(){return !!cur;}};
  window.DadMarkZoom={open:function(){open(byName('dad'));},close:close,isOpen:function(){return !!cur;}};
})();
