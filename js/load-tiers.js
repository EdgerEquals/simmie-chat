/* LOAD TIERS (Danny t713u/t715u 25 Oct 2026: "light, lined up"). One tiny loader every module registers with; questionnaire only for now.
   Tier 0 CRITICAL, painted at once: the HTML, the layout/header CSS in <head>, the text and the slim 2.9 KB header mark.
          Web fonts are non-blocking (swap), the space-loop video shows only its poster.
   Tier 1 AFTER FIRST PAINT: the interactive bits as plain `defer` scripts (questions and the page script, buttons and pop-ups,
          logo zoom, DJ pill, footer line + its data). LoadTiers.add(1, fn) runs fn on the frame after first paint.
   Tier 2 IDLE (requestIdleCallback after load, 3 s timeout): decoration and motion. tide + swell strip, space orbit layer,
          front orbit emojis, tty status bars, Dad's auto DJ, the space-loop video, the matrix rain.
          LoadTiers.script(url, 2) / LoadTiers.add(2, fn).
   Tier 3 BACKGROUND PREFETCH: after load + PHI^3 (4.24 s) and an idle slot, only when navigator.connection is not saveData or 2g,
          low priority: the detailed zoom mark SVG, so a tap on the logo opens instantly from cache. LoadTiers.prefetch(url).
   Tiers 2 and 3 wait while the visitor is scrolling or typing (1.2 s of quiet first). LoadTiers.report() lists what ran and when (ms). */
(function(){
  'use strict';
  var T={1:[],2:[],3:[]},done={1:0,2:0,3:0},log=[],last=0,t0=Date.now();
  var ric=window.requestIdleCallback||function(f){return setTimeout(function(){f({timeRemaining:function(){return 8},didTimeout:false});},200);};
  function now(){return Date.now()-t0;}
  ['scroll','keydown','input','touchmove','wheel'].forEach(function(e){addEventListener(e,function(){last=Date.now();},{passive:true,capture:true});});
  function quiet(f){var w=Date.now()-last;if(w<1200)setTimeout(function(){quiet(f);},1200-w);else f();}
  function run(n){done[n]=1;var q=T[n];T[n]=[];q.forEach(function(j){try{j.fn();log.push([n,j.name,now()]);}catch(e){log.push([n,j.name+' FAILED',now()]);}});}
  function add(n,fn,name){var j={fn:fn,name:name||fn.name||'fn'};if(done[n]){if(n===1)j.fn();else ric(function(){quiet(function(){try{j.fn();log.push([n,j.name,now()]);}catch(e){}});},{timeout:3000});return;}T[n].push(j);}
  function slow(){var c=navigator.connection||{};return !!(c.saveData||/(^|-)2g$/.test(c.effectiveType||''));}
  function script(url,n){add(n||2,function(){var s=document.createElement('script');s.src=url;s.async=true;document.head.appendChild(s);},url.split('/').pop().split('?')[0]);}
  function prefetch(url){add(3,function(){if(slow())return;var i=new Image();try{i.fetchPriority='low';}catch(e){}i.decoding='async';i.src=url;LoadTiers._keep.push(i);},'prefetch '+url.split('/').pop().split('?')[0]);}
  function start(){
    requestAnimationFrame(function(){setTimeout(function(){run(1);},0);});
    function afterLoad(){ric(function(){quiet(function(){run(2);});},{timeout:3000});
      setTimeout(function(){ric(function(){quiet(function(){run(3);});},{timeout:6000});},4236);}
    if(document.readyState==='complete')afterLoad();else addEventListener('load',afterLoad);
  }
  window.LoadTiers={add:add,script:script,prefetch:prefetch,_keep:[],report:function(){return log.slice();}};
  start();
})();
