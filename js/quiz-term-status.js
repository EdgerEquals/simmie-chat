/* Questionnaire terminal status pill (Danny t637u/t639u; t647u/t648u/t650u 13:32 AWST 24 Oct 2026). Display only: sends nothing.
   Pill renders a terminal line: text + block cursor, like the footer simmie$ line.
   Sequence (phi rules, base seconds, advanced at RatioPump.rate(), dial 0.75):
     cursor  : no word, cursor blinks 2x at PHI^0.5 = 1.272 s  -> 2.544 s
     status  : "status" green, pulses 3x at PHI^2 = 2.618 s, steady cursor after it -> 7.854 s
     cursor  : 2.544 s
     live    : "live" red, pulses 3x -> 7.854 s ... full cycle 20.80 base s.
   html[data-term-phase]=cursor|status|live|quiet (pill); html[data-term-status]=status|live|quiet (footer simmie$ light, holds the
   last word through cursor phases) + 'termstatus:change'.
   Quiet: not actually live = navigator.onLine false OR the page's Rebella link check window.SIM_BEACON.state==='down' -> muted
   static "away", no cycling. Resumes on recovery. Reduced motion: static "status" + steady cursor. */
(function(){
  'use strict';
  var PHI=1.6180339887, B=Math.pow(PHI,0.5), P=Math.pow(PHI,2);
  var SEQ=[['cursor',2*B],['status',3*P],['cursor',2*B],['live',3*P]];
  var root=document.documentElement, RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function rate(){ try{ var r=window.RatioPump&&window.RatioPump.rate(); return r>0?r:1; }catch(e){ return 1; } }
  var w=document.querySelector('#tstat .ts-w'), txt, cur;
  if(w){ txt=document.createElement('span'); txt.className='ts-txt'; cur=document.createElement('i'); cur.className='ts-cur'; w.appendChild(txt); w.appendChild(cur); }
  var idx=1, left=SEQ[1][1], phase=null, word='status', last=Date.now();
  function isLive(){ if(navigator.onLine===false) return false; var b=window.SIM_BEACON; return !(b&&b.state==='down'); }
  function setVars(){ var r=rate(); root.style.setProperty('--ts-pulse',(P/r).toFixed(3)+'s'); root.style.setProperty('--ts-blink',(B/r).toFixed(3)+'s'); root.style.setProperty('--ts-xf',(Math.pow(PHI,0.25)/r).toFixed(3)+'s'); }
  function show(ph){
    if(ph===phase) return; phase=ph; root.setAttribute('data-term-phase',ph);
    if(txt){ txt.classList.remove('ts-go'); txt.textContent= ph==='status'?'status': ph==='live'?'live': ph==='quiet'?'away':''; void txt.offsetWidth; if(ph==='status'||ph==='live') txt.classList.add('ts-go'); }
    var st= ph==='cursor'?word:ph; if(ph==='status'||ph==='live') word=ph;
    if(root.getAttribute('data-term-status')!==st){ root.setAttribute('data-term-status',st);
      try{ document.dispatchEvent(new CustomEvent('termstatus:change',{detail:{state:st,phase:ph}})); }catch(e){} }
  }
  function tick(){
    var now=Date.now(), dt=(now-last)/1000; last=now;
    if(!isLive()){ show('quiet'); return; }
    if(RM.matches){ show('status'); return; }
    if(phase==='quiet'){ idx=0; left=SEQ[0][1]; setVars(); show('cursor'); return; }
    if(document.hidden||(document.body&&document.body.classList.contains('paused'))) return;
    left-=dt*rate();
    if(left<=0){ setVars(); idx=(idx+1)%SEQ.length; left=SEQ[idx][1]; }
    show(SEQ[idx][0]);
  }
  setVars(); show(isLive()?'status':'quiet');
  document.addEventListener('ratiopump:change',setVars);
  document.addEventListener('visibilitychange',function(){ last=Date.now(); });
  window.addEventListener('online',tick); window.addEventListener('offline',tick);
  setInterval(tick,100);
  window.TermStatus={ phase:function(){ return phase; }, state:function(){ return root.getAttribute('data-term-status'); }, live:isLive,
    info:function(){ var r=rate(); return {phase:phase, rate:r, seqBase:SEQ, cycleBase:2*(2*B+3*P), cycleEffective:2*(2*B+3*P)/r}; } };
})();
