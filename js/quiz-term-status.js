/* Questionnaire terminal status pill (Danny 13:18 AWST 24 Oct 2026, t637u/t639u). Display only: reads nothing, sends nothing.
   One shared state on <html data-term-status="status|live"> + a 'termstatus:change' event, so the header pill and the footer
   simmie$ light flip together. Dwell (phi rules): status PHI^5.5 = 14.107 s, live PHI^5.25 = 12.508 s, measured in base seconds and
   advanced at the ratio pump's rate (window.RatioPump.rate(), Dad's dial 0.75), so a pump change lands smoothly mid-dwell.
   Cross-fade PHI^0.25 = 1.128 s / rate (CSS var --ts-xf). Golden-angle start: k = 63 -> frac(63 x 0.618) = 0.936 of the cycle.
   Paused while the tab is hidden (body.paused). prefers-reduced-motion: frozen on "status". */
(function(){
  'use strict';
  var PHI=1.6180339887, D={status:Math.pow(PHI,5.5), live:Math.pow(PHI,5.25)}, XF=Math.pow(PHI,0.25), CYC=D.status+D.live;
  var root=document.documentElement, RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function rate(){ try{ var r=window.RatioPump&&window.RatioPump.rate(); return r>0?r:1; }catch(e){ return 1; } }
  var off=CYC*((63*0.6180339887)%1), state, left, last=Date.now();
  if(off<D.status){ state='status'; left=D.status-off; } else { state='live'; left=CYC-off; }
  function setXf(){ root.style.setProperty('--ts-xf',(XF/rate()).toFixed(3)+'s'); }
  function apply(){ root.setAttribute('data-term-status',state);
    try{ document.dispatchEvent(new CustomEvent('termstatus:change',{detail:{state:state}})); }catch(e){} }
  function tick(){
    var now=Date.now(), dt=(now-last)/1000; last=now;
    if(RM.matches){ if(state!=='status'){ state='status'; left=D.status; apply(); } return; }
    if(document.hidden||(document.body&&document.body.classList.contains('paused'))) return;
    left-=dt*rate();
    if(left<=0){ setXf(); state=state==='status'?'live':'status'; left+=D[state]; if(left<=0)left=D[state]; apply(); }
  }
  if(RM.matches){ state='status'; left=D.status; }
  setXf(); apply();
  document.addEventListener('ratiopump:change',setXf);
  document.addEventListener('visibilitychange',function(){ last=Date.now(); });
  setInterval(tick,200);
  window.TermStatus={ state:function(){ return state; },
    info:function(){ var r=rate(); return {state:state, rate:r, dwellBase:{status:D.status, live:D.live}, dwellEffective:{status:D.status/r, live:D.live/r}, crossfadeEffective:XF/r, leftBase:left}; } };
})();
