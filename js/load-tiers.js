/* LOAD TIERS (Danny t713u/t715u 25 Oct 2026: "light, lined up"). One tiny loader every module registers with; questionnaire only for now.
   Tier 0 CRITICAL, painted at once: the HTML, the layout/header CSS in <head>, the text and the slim 2.9 KB header mark.
          Web fonts are non-blocking (swap), the space-loop video shows only its poster.
   Tier 1 AFTER FIRST PAINT: the interactive bits as plain `defer` scripts (questions and the page script, buttons and pop-ups,
          logo zoom, DJ pill, footer line + its data). LoadTiers.add(1, fn) runs fn on the frame after first paint.
   Tier 2 IDLE (requestIdleCallback after load, 3 s timeout): decoration and motion. tide + swell strip, space orbit layer,
          front orbit emojis, tty status bars, Dad's auto DJ, the space-loop video, the matrix rain.
          LoadTiers.script(url, 2) / LoadTiers.add(2, fn).
   Tier 3 BACKGROUND PREFETCH: after tier 2 has drained + PHI^1 (1.62 s) and an idle slot, only when navigator.connection is not saveData or 2g,
          low priority: the detailed zoom mark SVG, so a tap on the logo opens instantly from cache. LoadTiers.prefetch(url).
   Tiers 2 and 3 wait while the visitor is scrolling or typing (1.2 s of quiet first). LoadTiers.report() lists what ran and when (ms).
   STAGGER (Danny 13:45 AWST 25 Oct, smoother): tier 2 and 3 jobs start ONE PER IDLE SLOT (requestIdleCallback, only with >= 8 ms left in the
   deadline), a script job counts as done when it has loaded and run, then a PHI^-2 = 0.382 s gap before the next. Jobs added with {last:true}
   (the matrix rain) go to the end. Tier 3 starts PHI^1 = 1.62 s after tier 2 has drained.
   ANIM GATE: <html> gets .lt-wait at once and every CSS animation is paused under it (inline style next to this script), so the first frames
   are cheap; the class is removed in the first tier-2 idle slot (or 3 s after load at the latest). No JS = no class = nothing paused.
   ADAPTIVE (Danny t744u 25 Oct, adaptive golden-ratio principle): jobs may carry a shared component id ({id:'dj'}); js/phi-adapt.js runs as
   the FIRST tier-2 job ({first:true}) and calls LoadTiers.adapt({rank,gap}): from then on the waiting tier-2/3 jobs are gently re-ranked by
   this visitor's on-device usage and each job's following gap becomes a golden step (0.236 / 0.382 / 0.618 s). first/last jobs never move.
   Without phi-adapt (or with too little data) the order and the 0.382 s gap are exactly as before. See docs/phi-adapt.md. */
(function(){
  'use strict';
  var T={1:[],2:[],3:[]},done={1:0,2:0,3:0},log=[],last=0,t0=Date.now(),GAP=382,de=document.documentElement;
  de.classList.add('lt-wait');
  function animOn(){if(de.classList.contains('lt-wait')){de.classList.remove('lt-wait');log.push([2,'animations on',now()]);}}
  var ric=window.requestIdleCallback||function(f){return setTimeout(function(){f({timeRemaining:function(){return 8},didTimeout:false});},200);};
  function now(){return Date.now()-t0;}
  ['scroll','keydown','input','touchmove','wheel'].forEach(function(e){addEventListener(e,function(){last=Date.now();},{passive:true,capture:true});});
  function quiet(f){var w=Date.now()-last;if(w<1200)setTimeout(function(){quiet(f);},1200-w);else f();}
  function run(n){done[n]=1;var q=T[n];T[n]=[];q.forEach(function(j){try{j.fn();log.push([n,j.name,now()]);}catch(e){log.push([n,j.name+' FAILED',now()]);}});}
  var Q={2:[],3:[]},busy={2:0,3:0},drained={2:0,3:0},onDrain={2:[],3:[]};
  function drain(n){if(busy[n])return;var q=Q[n];
    if(!q.length){drained[n]=1;var f=onDrain[n];onDrain[n]=[];f.forEach(function(g){g();});return;}
    busy[n]=1;ric(function(dl){quiet(function(){
      if(dl&&!dl.didTimeout&&dl.timeRemaining()<8){busy[n]=0;return drain(n);}
      var j=q.shift(),fin=function(){if(fin.d)return;fin.d=1;log.push([n,j.name,now()]);var g=GAP;if(H&&j.id){try{g=+H.gap(j.id)||GAP;}catch(e){}}setTimeout(function(){busy[n]=0;drain(n);},g);};
      try{if(j.fn.length){j.fn(fin);setTimeout(fin,4000);}else{j.fn();fin();}}catch(e){log.push([n,j.name+' FAILED',now()]);fin();}
    });},{timeout:2000});}
  var H=null;   // adapt hook {rank(ids)->ids, gap(id)->ms} from js/phi-adapt.js
  function reorder(n){if(!H)return;var q=Q[n],a=0,b=q.length;while(a<b&&q[a].first)a++;while(b>a&&q[b-1].last)b--;var mid=q.slice(a,b);if(mid.length<2)return;
    var r;try{r=H.rank(mid.map(function(j){return j.id||'';}));}catch(e){return;}
    // rank() works on component ids; map back to jobs keeping the original order among equal ids
    var used={},out=[];r.forEach(function(id){for(var i=0;i<mid.length;i++){if(!used[i]&&(mid[i].id||'')===id){used[i]=1;out.push(mid[i]);break;}}});
    for(var i=0;i<mid.length;i++)if(!used[i])out.push(mid[i]);if(out.length!==mid.length)return;Array.prototype.splice.apply(q,[a,mid.length].concat(out));}
  function adapt(h){if(!h||typeof h.rank!=='function')return;H=h;reorder(2);reorder(3);log.push([2,'adapt on',now()]);}
  function enqueue(n,j){var q=Q[n];if(j.first){var f=0;while(f<q.length&&q[f].first)f++;q.splice(f,0,j);}else if(j.last)q.push(j);else{var i=q.length;while(i>0&&q[i-1].last)i--;q.splice(i,0,j);reorder(n);}if(done[n])drain(n);}
  function add(n,fn,name,o){var j={fn:fn,name:name||fn.name||'fn',last:!!(o&&o.last),first:!!(o&&o.first),id:(o&&o.id)||''};
    if(n===1){if(done[1])fn();else T[1].push(j);return;}enqueue(n,j);}
  function slow(){var c=navigator.connection||{};return !!(c.saveData||/(^|-)2g$/.test(c.effectiveType||''));}
  function script(url,n,o){add(n||2,function(done){var s=document.createElement('script');s.src=url;s.async=true;s.onload=s.onerror=done;document.head.appendChild(s);},url.split('/').pop().split('?')[0],o);}
  function prefetch(url,o){add(3,function(){if(slow())return;var i=new Image();try{i.fetchPriority='low';}catch(e){}i.decoding='async';i.src=url;LoadTiers._keep.push(i);},'prefetch '+url.split('/').pop().split('?')[0],o);}
  function start(){
    requestAnimationFrame(function(){setTimeout(function(){run(1);},0);});
    function afterLoad(){setTimeout(animOn,3000);
      ric(function(){animOn();done[2]=1;onDrain[2].push(function(){setTimeout(function(){done[3]=1;drain(3);},1618);});drain(2);},{timeout:3000});}
    if(document.readyState==='complete')afterLoad();else addEventListener('load',afterLoad);
  }
  window.LoadTiers={add:add,script:script,prefetch:prefetch,adapt:adapt,_keep:[],report:function(){return log.slice();}};
  start();
})();
