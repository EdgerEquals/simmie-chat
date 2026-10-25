/* Rebella zoom "life" (Danny t724u 14:04 AWST 25 Oct 2026), questionnaire only, ENLARGED view only (header logo and logo artwork untouched).
   Loaded lazily: js/dad-mark-zoom.js injects this file the first time the Rebella zoom opens. Everything stops when the zoom closes.
   1 SHIMMER  a soft light band glides across the letters, clipped to the letter shapes (evenodd, so the holes stay black).
              Period PHI^4 = 6.854 s (Bonnie 'facts' slot), glide PHI^1 = 1.618 s, first one PHI^0 = 1 s after opening.
   2 STARS    very faint static stars on a small canvas behind the logo, plus 6 highlight stars that twinkle in and out just above the top and
              just below the bottom edge of the lettering (positions read from the letter silhouette). Star k (1..6) repeats every
              PHI^(1.5+k/2) s = 2.62 / 3.33 / 4.24 / 5.39 / 6.85 / 8.72 s, each twinkle PHI^1 s, first at period*frac(k*0.618) (golden angle).
   3 SOUND    Web Audio synthesis only (no files): one harmonic set, G3 196 Hz x [4,5,6,8,10,12]. Each shimmer = a soft band-passed swish rising
              with the light plus a faint harmonic-8 tone; star k = a quiet ping on harmonic k. The AudioContext is created inside the tap
              (js/dad-mark-zoom.js, iOS-safe) along with the open/close chords; it is its own context, the auto-DJ is never touched. Low volume.
   4 GLOW     the halo breathes over PHI^5 = 11.09 s (Bonnie 'loop effect'), and its echo comes back off an undrawn rounded wall inside the tile
              (a soft ring of light that fades to nothing on both sides, where the halo meets the invisible wall), PHI^-1 = 0.618 s later, as if the light bounced. The wall itself is never drawn.
   All periods follow PhiTiming.sweep() (weather shift, re-read every cycle). Reduced motion: no shimmer, no twinkles, no breathing; the faint
   stars, the stronger glow and the static echo stay; open/close sounds stay. API: RebellaZoomLife.start(fig, audioContext) / stop(). */
(function(){
  'use strict';
  var PHI=1.6180339887,G=0.6180339887,NS='http://www.w3.org/2000/svg',VB=[413,534,1810,893],F0=196,HS=[4,5,6,8,10,12];
  var RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function P(n){var s=0;try{s=window.PhiTiming?PhiTiming.sweep():0;}catch(e){}return Math.pow(PHI,n+s)*1000;}
  var CSS='.dmz--rebella .dmz-art{position:relative;z-index:1}'+
    '.rbz-bg,.rbz-fx{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;border-radius:inherit}'+
    '.rbz-bg{z-index:0}.rbz-fx{z-index:2;overflow:hidden}'+
    '.rbz-wall{position:absolute;left:1%;top:1.5%;right:1%;bottom:1.5%;pointer-events:none;z-index:0;opacity:.6;'+   // soft ring that fades to 0 on both sides: no edge, no drawn wall
      'background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(229,138,166,0) 58%,rgba(229,138,166,.16) 80%,rgba(229,138,166,.05) 92%,rgba(229,138,166,0) 100%)}'+
    '.rbz-star{position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity;'+
      'background:radial-gradient(circle,#fff 0 10%,rgba(248,207,219,.85) 20%,rgba(229,138,166,0) 62%);'+
      'clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%);-webkit-clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)}';
  function style(){if(document.getElementById('rbz-life-css'))return;var s=document.createElement('style');s.id='rbz-life-css';s.textContent=CSS;document.head.appendChild(s);}
  var dCache={};
  function pathD(url){if(!dCache[url])dCache[url]=fetch(url,{credentials:'same-origin'}).then(function(r){return r.text();}).then(function(t){var m=/<path id="bonnies-logo"[^>]*?\sd="([^"]+)"/.exec(t);return m?m[1]:'';});return dCache[url];}
  // letter silhouette -> for each column, the top-most and bottom-most ink (logo units), so stars sit just outside the lettering
  function edges(d){var k=0.2,w=Math.ceil(VB[2]*k),h=Math.ceil(VB[3]*k),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');
    x.setTransform(k,0,0,k,-VB[0]*k,-VB[1]*k);x.fill(new Path2D(d),'evenodd');var a=x.getImageData(0,0,w,h).data,cols=[];
    for(var i=0;i<w;i++){var t=-1,b=-1;for(var j=0;j<h;j++){if(a[(j*w+i)*4+3]>100){if(t<0)t=j;b=j;}}if(t>=0)cols.push([VB[0]+i/k,VB[1]+t/k,VB[1]+b/k]);}
    return cols;}
  var st=null;
  function out(){return st&&st.ac&&st.ac.state==='running'?st.out:null;}
  function ping(f,dur,gain,delay){var o=out();if(!o)return;var ac=st.ac,t=ac.currentTime+(delay||0)+0.01,os=ac.createOscillator(),g=ac.createGain();
    os.type='sine';os.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    os.connect(g);g.connect(o);os.start(t);os.stop(t+dur+0.05);}
  var noise=null;
  function swish(dur){var o=out();if(!o)return;var ac=st.ac,t=ac.currentTime+0.01;
    if(!noise||noise.sampleRate!==ac.sampleRate){var n=Math.floor(ac.sampleRate*2.2);noise=ac.createBuffer(1,n,ac.sampleRate);var c=noise.getChannelData(0);for(var i=0;i<n;i++)c[i]=Math.random()*2-1;}
    var s=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;bp.type='bandpass';bp.Q.value=7;
    bp.frequency.setValueAtTime(F0*8,t);bp.frequency.exponentialRampToValueAtTime(F0*24,t+dur);   // rises with the light, harmonics 8 -> 24
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.05,t+dur*0.382);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(bp);bp.connect(g);g.connect(o);s.start(t);s.stop(t+dur+0.05);
    ping(F0*8,dur*0.9,0.012,dur*0.3);ping(F0*12,dur*0.6,0.006,dur*0.45);}
  function later(fn,ms){var h=setTimeout(function(){st&&st.timers.splice(st.timers.indexOf(h),1);if(st)fn();},ms);st.timers.push(h);}
  function anim(el,k,o){try{var a=el.animate(k,o);st.anims.push(a);return a;}catch(e){return null;}}
  // logo units -> px inside the figure (svg box = .dmz-art, xMidYMid meet, rotated -5.5deg about its centre)
  function toFig(ux,uy){var a=st.art,W=a.offsetWidth,H=a.offsetHeight,s=Math.min(W/VB[2],H/VB[3]),x=(ux-VB[0])*s+(W-VB[2]*s)/2-W/2,y=(uy-VB[1])*s+(H-VB[3]*s)/2-H/2,r=-5.5*Math.PI/180;
    return [a.offsetLeft+W/2+x*Math.cos(r)-y*Math.sin(r),a.offsetTop+H/2+x*Math.sin(r)+y*Math.cos(r),s];}
  function shimmer(){if(!st.sheen)return;var dur=P(1);anim(st.sheen,[{transform:'translateX(0px)'},{transform:'translateX('+(VB[2]+900)+'px)'}],{duration:dur,easing:'cubic-bezier(.45,.05,.35,1)'});
    swish(dur/1000);later(shimmer,P(4));}
  function twinkle(k){var el=st.stars[k-1],c=st.cols;if(!el||!c||!c.length)return;
    var col=c[Math.floor(c.length*(0.04+0.88*Math.random()))],top=(k%2===1),u=toFig(col[0],top?col[1]-26:col[2]+26),sz=Math.max(8,Math.round(st.fig.clientWidth*0.022*(0.75+0.5*Math.random())));
    el.style.width=el.style.height=sz+'px';el.style.left=(u[0]-sz/2)+'px';el.style.top=(u[1]-sz/2)+'px';
    anim(el,[{opacity:0,transform:'scale(.2) rotate(0deg)'},{opacity:.9,transform:'scale(1) rotate(22deg)',offset:.382},{opacity:0,transform:'scale(.25) rotate(45deg)'}],{duration:P(1),easing:'ease-in-out'});
    ping(F0*HS[k-1],1.3,0.016+0.004*(6-k)/5);later(function(){twinkle(k);},P(1.5+k/2));}
  function bgStars(cv){var w=cv.clientWidth,h=cv.clientHeight,d=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;cv.width=Math.round(w*d);cv.height=Math.round(h*d);
    var x=cv.getContext('2d');x.scale(d,d);var n=Math.round(w*h/2600),seed=7;function r(){seed=(seed*16807)%2147483647;return seed/2147483647;}
    for(var i=0;i<n;i++){var a=0.05+0.17*r()*r(),R=0.35+0.8*r();x.fillStyle=(i%5===0?'rgba(248,207,219,':'rgba(255,255,255,')+a.toFixed(3)+')';x.beginPath();x.arc(r()*w,r()*h,R,0,6.2832);x.fill();}}
  function start(fig,ac){stop();var svg=fig.querySelector('.dmz-art svg'),use=svg&&svg.querySelector('use:last-of-type');if(!svg||!use)return;style();
    st={fig:fig,art:fig.querySelector('.dmz-art'),ac:ac||null,timers:[],anims:[],stars:[],cols:null,sheen:null,out:null};
    if(st.ac){try{st.out=st.ac.createGain();st.out.gain.value=0.8;st.out.connect(st.ac.destination);}catch(e){st.out=null;}}
    var bg=document.createElement('canvas');bg.className='rbz-bg';bg.setAttribute('aria-hidden','true');fig.insertBefore(bg,fig.firstChild);
    var wall=document.createElement('div');wall.className='rbz-wall';wall.setAttribute('aria-hidden','true');fig.insertBefore(wall,st.art);
    var fx=document.createElement('div');fx.className='rbz-fx';fx.setAttribute('aria-hidden','true');fig.appendChild(fx);
    requestAnimationFrame(function(){if(st&&st.fig===fig)bgStars(bg);});
    var glowUse=svg.querySelector('use[filter]'),motion=!RM.matches;
    if(motion){var B=P(5);if(glowUse)anim(glowUse,[{opacity:.72},{opacity:1},{opacity:.72}],{duration:B,iterations:Infinity,easing:'ease-in-out'});
      anim(wall,[{opacity:.3},{opacity:.95},{opacity:.3}],{duration:B,delay:P(-1),iterations:Infinity,easing:'ease-in-out',fill:'backwards'});}
    var href=(use.getAttribute('href')||'').split('#')[0];
    pathD(href).then(function(d){if(!st||st.fig!==fig||!d)return;
      var defs=document.createElementNS(NS,'defs');
      defs.innerHTML='<clipPath id="rbz-clip"><path clip-rule="evenodd" d="'+d+'"/></clipPath>'+
        '<linearGradient id="rbz-sheen-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#FFF4F8" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      if(motion){var g=document.createElementNS(NS,'g');g.setAttribute('clip-path','url(#rbz-clip)');g.setAttribute('aria-hidden','true');
        var r=document.createElementNS(NS,'rect');r.setAttribute('x',VB[0]-560);r.setAttribute('y',VB[1]-200);r.setAttribute('width',300);r.setAttribute('height',VB[3]+400);
        r.setAttribute('fill','url(#rbz-sheen-g)');r.setAttribute('transform','translate(0 0)');g.appendChild(r);
        var wrap=document.createElementNS(NS,'g');wrap.setAttribute('transform','skewX(-16)');wrap.appendChild(r);g.appendChild(wrap);svg.appendChild(g);st.sheen=r;
        later(shimmer,P(0));
        try{st.cols=edges(d);}catch(e){st.cols=null;}
        for(var k=1;k<=6;k++){var s=document.createElement('span');s.className='rbz-star';fx.appendChild(s);st.stars.push(s);
          (function(k){later(function(){twinkle(k);},P(1.5+k/2)*((k*G)%1));})(k);}}
    }).catch(function(){});}
  function stop(){if(!st)return;var s=st;st=null;s.timers.forEach(clearTimeout);s.anims.forEach(function(a){try{a.cancel();}catch(e){}});
    if(s.out){try{var t=s.ac.currentTime;s.out.gain.cancelScheduledValues(t);s.out.gain.setValueAtTime(s.out.gain.value,t);s.out.gain.linearRampToValueAtTime(0,t+0.08);
      setTimeout(function(){try{s.out.disconnect();}catch(e){}},150);}catch(e){}}}
  window.RebellaZoomLife={start:start,stop:stop,running:function(){return !!st;}};
})();
