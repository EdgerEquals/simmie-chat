/* Questionnaire terminal status pill (Danny t637u/t639u; grouped pulses + quiet state t647u/t648u 13:30 AWST 24 Oct 2026). Display only.
   Shared state on <html data-term-status="status|live|quiet"> + 'termstatus:change' event (header pill + footer simmie$ light).
   Pattern: "status" (green) pulses 3x, cross-fade, "live" (red) pulses 3x, repeat. Pulse period PHI^2 = 2.618 base s; group = 3 pulses
   = 7.854 base s; all advanced at RatioPump.rate() (dial 0.75). Cross-fade PHI^0.25 / rate (--ts-xf).
   Quiet: when NOT actually live (navigator.onLine false, or the page's Rebella link check window.SIM_BEACON.state==='down'),
   the pill stops cycling and shows a muted, still "away". Resumes when both come back. Reduced motion: static "status". */
(function(){
  'use strict';
  var PHI=1.6180339887, P=Math.pow(PHI,2), N={status:3, live:3}, XF=Math.pow(PHI,0.25);
  var root=document.documentElement, RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function rate(){ try{ var r=window.RatioPump&&window.RatioPump.rate(); return r>0?r:1; }catch(e){ return 1; } }
  var w=document.querySelector('#tstat .ts-w'); if(w&&!w.querySelector('.ts-q')){ var q=document.createElement('b'); q.className='ts-q'; q.textContent='away'; w.appendChild(q); }
  var phase='status', left=N.status*P, shown=null, last=Date.now();
  function isLive(){ if(navigator.onLine===false) return false; var b=window.SIM_BEACON; return !(b&&b.state==='down'); }
  function setXf(){ root.style.setProperty('--ts-xf',(XF/rate()).toFixed(3)+'s'); root.style.setProperty('--ts-pulse',(P/rate()).toFixed(3)+'s'); }
  function show(s){ if(s===shown) return; shown=s; root.setAttribute('data-term-status',s);
    try{ document.dispatchEvent(new CustomEvent('termstatus:change',{detail:{state:s}})); }catch(e){} }
  function tick(){
    var now=Date.now(), dt=(now-last)/1000; last=now;
    if(!isLive()){ show('quiet'); return; }
    if(RM.matches){ phase='status'; left=N.status*P; show('status'); return; }
    if(shown==='quiet'){ phase='status'; left=N.status*P; setXf(); show('status'); return; }
    if(document.hidden||(document.body&&document.body.classList.contains('paused'))) return;
    left-=dt*rate();
    if(left<=0){ setXf(); phase=phase==='status'?'live':'status'; left=N[phase]*P; }
    show(phase);
  }
  setXf(); show(isLive()?'status':'quiet');
  document.addEventListener('ratiopump:change',setXf);
  document.addEventListener('visibilitychange',function(){ last=Date.now(); });
  window.addEventListener('online',tick); window.addEventListener('offline',tick);
  setInterval(tick,200);
  window.TermStatus={ state:function(){ return shown; }, live:isLive,
    info:function(){ var r=rate(); return {state:shown, rate:r, pulseBase:P, pulses:N, groupEffective:{status:N.status*P/r, live:N.live*P/r}, crossfadeEffective:XF/r, leftBase:left}; } };
})();
