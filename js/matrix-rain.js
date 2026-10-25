/* MATRIX RAIN background (Danny t713u 25 Oct 2026, questionnaire only). Movie-style green falling code behind everything.
   One fixed full-viewport <canvas id="mxrain"> (z-index -1, pointer-events none, dim), katakana + digits, a white-green leading glyph
   on each column and green trails that fade out (destination-out, so the space-loop video still shows through).
   Light: loaded by js/load-tiers.js in tier 2 (idle after load) and it also waits for an idle slot itself, about 22 fps, devicePixelRatio capped at 1.5,
   paused while the tab is hidden, one static frame under prefers-reduced-motion. No libraries, no layout shift (fixed, out of flow), no sideways scroll. */
(function(){
  'use strict';
  function boot(){
  if(document.getElementById('mxrain'))return;
  var P={fps:22,size:15,opacity:.2,fade:.085,head:'#E8FFEE',body:'#00FF41',dim:'#008F2A',maxDpr:1.5};
  var G='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789'.split('');
  var c=document.createElement('canvas');c.id='mxrain';c.setAttribute('aria-hidden','true');
  c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;opacity:'+P.opacity+';contain:strict';
  document.body.insertBefore(c,document.body.firstChild);
  var x=c.getContext('2d'),W=0,H=0,cols=0,drops=[],speed=[],last=[],raf=0,prev=0,dt=1000/P.fps;
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');
  function g(){return G[(Math.random()*G.length)|0];}
  function size(){var d=Math.min(window.devicePixelRatio||1,P.maxDpr);W=innerWidth;H=innerHeight;
    c.width=Math.round(W*d);c.height=Math.round(H*d);x.setTransform(d,0,0,d,0,0);
    x.font=P.size+'px monospace';x.textBaseline='top';cols=Math.ceil(W/P.size);
    for(var i=0;i<cols;i++){if(drops[i]==null){drops[i]=-Math.random()*H/P.size;speed[i]=.45+Math.random()*.6;last[i]=null;}}}
  function step(){
    x.globalCompositeOperation='destination-out';x.fillStyle='rgba(0,0,0,'+P.fade+')';x.fillRect(0,0,W,H);
    x.globalCompositeOperation='source-over';
    for(var i=0;i<cols;i++){var y=drops[i],cx=i*P.size;
      if(last[i]){x.fillStyle=Math.random()<.15?P.dim:P.body;x.fillText(last[i][0],cx,last[i][1]);}
      var row=Math.floor(y),py=row*P.size;
      if(y>=0&&(!last[i]||last[i][1]!==py)){var ch=g();x.shadowColor=P.body;x.shadowBlur=0;x.fillStyle=P.head;x.fillText(ch,cx,py);last[i]=[ch,py];}
      drops[i]+=speed[i];
      if(py>H&&Math.random()>.975){drops[i]=-Math.random()*8;speed[i]=.45+Math.random()*.6;last[i]=null;}}
  }
  function loop(t){raf=requestAnimationFrame(loop);if(t-prev<dt)return;prev=t-((t-prev)%dt);step();}
  function play(){if(!raf&&!document.hidden&&!(rm&&rm.matches))raf=requestAnimationFrame(loop);}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}}
  function still(){x.clearRect(0,0,W,H);for(var k=0;k<60;k++)step();}
  var rt=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size();if(rm&&rm.matches)still();},200);},{passive:true});
  document.addEventListener('visibilitychange',function(){document.hidden?stop():play();});
  if(rm&&rm.addEventListener)rm.addEventListener('change',function(){if(rm.matches){stop();still();}else play();});
  size();if(rm&&rm.matches)still();else play();
  window.MatrixRain={params:P,play:play,stop:stop};
  }
  function later(){(window.requestIdleCallback||function(f){setTimeout(f,600);})(boot,{timeout:3000});}
  if(document.readyState==='complete')later();else addEventListener('load',later);
})();
