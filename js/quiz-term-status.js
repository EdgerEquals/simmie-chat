/* Questionnaire terminal status pill (Danny t637u/t639u; t647u/t648u/t650u 13:32 AWST 24 Oct 2026). Display only: sends nothing.
   Pill renders a terminal line: text + block cursor, like the footer simmie$ line.
   Sequence (phi rules, base seconds, advanced at RatioPump.rate(), dial 0.75):
     cursor  : no word, cursor blinks 2x with the footer cursor (cblink PHI^0.5 = 1.272 s, same clock) -> 2.544 s
     status  : "status" green, pulses at PHI^2 = 2.618 s for 6 footer blinks, steady cursor after it -> 7.633 s
     cursor  : 2.544 s
     live    : "live" red, 7.633 s ... full cycle 16 blinks = 20.35 base s. Clock = footer cursor animation currentTime (t651u).
   html[data-term-phase]=cursor|status|live|quiet (pill); html[data-term-status]=status|live|quiet (footer simmie$ light, holds the
   last word through cursor phases) + 'termstatus:change'.
   Quiet: not actually live = navigator.onLine false OR the page's Rebella link check window.SIM_BEACON.state==='down' -> muted
   static "away", no cycling. Resumes on recovery. Reduced motion: static "status" + steady cursor. */
(function(){
  'use strict';
  var PHI=1.6180339887, B=Math.pow(PHI,0.5), P=Math.pow(PHI,2);
  var SEQ=[['cursor',2*B],['status',6*B],['cursor',2*B],['live',6*B]], CYC=16*B; // t651u: every phase a whole number of footer blinks
  var root=document.documentElement, RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function rate(){ try{ var r=window.RatioPump&&window.RatioPump.rate(); return r>0?r:1; }catch(e){ return 1; } }
  var w=document.querySelector('#tstat .ts-w'), txt, cur, tel, lat=null, telTxt='';
  if(w){ txt=document.createElement('span'); txt.className='ts-txt'; cur=document.createElement('i'); cur.className='ts-cur'; w.appendChild(txt); w.appendChild(cur);
    tel=document.createElement('span'); tel.className='ts-tel'; tel.innerHTML='<span></span>'; w.parentNode.appendChild(tel); }
  var idx=1, left=SEQ[1][1], phase=null, word='status', last=Date.now();
  function footAnim(){ var b=document.querySelector('.foot .tin .blk')||document.querySelector('.tin .blk'); if(!b||!b.getAnimations) return null;
    var l=b.getAnimations(); for(var i=0;i<l.length;i++) if(l[i].animationName==='cblink') return l[i]; return null; }
  function fdelay(){ var b=document.querySelector('.tin .blk'); return b?(parseFloat(getComputedStyle(b).animationDelay)||0):0; }
  function lock(){ var fa=footAnim(); if(!fa||!cur||!cur.getAnimations) return; var l=cur.getAnimations();
    for(var i=0;i<l.length;i++){ var a=l[i]; if(a.animationName!=='cblink') continue;
      if(a.playbackRate!==fa.playbackRate) a.playbackRate=fa.playbackRate;
      if(fa.currentTime!=null&&Math.abs((a.currentTime||0)-fa.currentTime)>5) a.currentTime=fa.currentTime; } }
  function isLive(){ if(navigator.onLine===false) return false; var b=window.SIM_BEACON; return !(b&&b.state==='down'); }
  function setVars(){ var r=rate(); root.style.setProperty('--ts-pulse',(P/r).toFixed(3)+'s'); root.style.setProperty('--ts-blink',(B/r).toFixed(3)+'s'); root.style.setProperty('--ts-xf',(Math.pow(PHI,0.25)/r).toFixed(3)+'s'); }
  function show(ph){
    if(ph===phase) return; phase=ph; root.setAttribute('data-term-phase',ph);
    if(txt){ txt.classList.remove('ts-go'); txt.textContent= ph==='status'?'status': ph==='live'?'live': ph==='quiet'?'away':''; void txt.offsetWidth; if(ph==='status'||ph==='live') txt.classList.add('ts-go'); }
    var st= ph==='cursor'?word:ph; if(ph==='status'||ph==='live') word=ph;
    try{ telemetry(); }catch(e){}
    if(root.getAttribute('data-term-status')!==st){ root.setAttribute('data-term-status',st);
      try{ document.dispatchEvent(new CustomEvent('termstatus:change',{detail:{state:st,phase:ph}})); }catch(e){} }
  }
  function tick(){
    var now=Date.now(), dt=(now-last)/1000; last=now;
    if(!isLive()){ show('quiet'); return; }
    if(RM.matches){ show('status'); return; }
    if(phase==='quiet'){ idx=0; left=SEQ[0][1]; setVars(); show('cursor'); return; }
    lock(); var fa=footAnim();
    if(fa&&fa.currentTime!=null){ // shared clock: the footer cursor's own animation time (already pump-scaled, includes its delay)
      var t=fa.currentTime/1000-fdelay(); t=((t%CYC)+CYC)%CYC; var a=0; for(var k=0;k<SEQ.length;k++){ if(t<a+SEQ[k][1]){ idx=k; break; } a+=SEQ[k][1]; }
      show(SEQ[idx][0]); return; }
    if(document.hidden||(document.body&&document.body.classList.contains('paused'))) return;
    left-=dt*rate();
    if(left<=0){ setVars(); idx=(idx+1)%SEQ.length; left=SEQ[idx][1]; }
    show(SEQ[idx][0]);
  }
  // t654u telemetry: existing signals only, no new requests. Latency from the page's own Rebella check fetch (Resource Timing).
  try{ new PerformanceObserver(function(l){ l.getEntries().forEach(function(e){ if(/edgerequals\.github\.io\/rebella\/(\?|$)/.test(e.name)) { lat=Math.round(e.duration); telemetry(); } }); }).observe({type:'resource',buffered:true}); }catch(e){}
  function awst(){ try{ return new Date().toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Australia/Perth'})+' AWST'; }catch(e){ return ''; } }
  function telemetry(){ if(!tel) return; var b=window.SIM_BEACON, on=navigator.onLine!==false, lk=document.getElementById('vLink'), r;
    var bs=b&&b.state==='down'?'rebella down':b&&b.state==='live'?('rebella up'+(lat!=null?' '+lat+'ms':'')):'rebella checking';
    var ls='link '+(lk&&/OFF/i.test(lk.textContent)?'off':'ok');
    if(phase==='quiet') r=(b&&b.state==='down'?'link down':ls)+' \u00b7 '+(on?'online':'offline')+' :(';
    else r=bs+' \u00b7 '+ls+' \u00b7 '+(on?'online':'offline')+' \u00b7 '+awst()+' \u00b7 ';
    if(r===telTxt) return; telTxt=r; tel.firstChild.textContent= phase==='quiet'||RM.matches ? r : r+r; }
  setInterval(telemetry,1000);
  setVars(); show(isLive()?'status':'quiet');
  document.addEventListener('ratiopump:change',setVars);
  document.addEventListener('visibilitychange',function(){ last=Date.now(); });
  window.addEventListener('online',tick); window.addEventListener('offline',tick);
  setInterval(tick,100);
  window.TermStatus={ phase:function(){ return phase; }, state:function(){ return root.getAttribute('data-term-status'); }, live:isLive,
    info:function(){ var r=rate(); return {phase:phase, rate:r, seqBase:SEQ, cycleBase:2*(2*B+3*P), cycleEffective:2*(2*B+3*P)/r}; } };
})();
