/* Rebella zoom "life" (Danny t724u 14:04 AWST 25 Oct 2026), questionnaire only, ENLARGED view only (header logo and logo artwork untouched).
   Loaded lazily: js/dad-mark-zoom.js injects this file the first time the Rebella zoom opens. Everything stops when the zoom closes.
   1 SHIMMER  a soft light band glides across the letters, clipped to the letter shapes (evenodd, so the holes stay black).
              Period PHI^4 = 6.854 s (Bonnie 'facts' slot), glide PHI^1 = 1.618 s, first one PHI^0 = 1 s after opening.
   2 STARS    very faint static stars on a small canvas behind the logo, plus 6 highlight stars that twinkle in and out just above the top and
              just below the bottom edge of the lettering (positions read from the letter silhouette). Star k (1..6) repeats every
              PHI^(1.5+k/2) s = 2.62 / 3.33 / 4.24 / 5.39 / 6.85 / 8.72 s, each twinkle PHI^1 s, first at period*frac(k*0.618) (golden angle).
   3 SOUND    Fairy palette (Danny t740u 14:2x AWST 25 Oct: the music-box tones were "too baby and too scary"): Web Audio synthesis only, no
              files, no tones below ~1.3 kHz, no drone. Each shimmer = a breathy high-passed air swish (3 -> 8 kHz) with one or two faint glassy
              sparkles; star k = one tiny glass sparkle (bright E-major-pentatonic partials in the E6-E7 octave, 4 ms attack, ~0.3 s decay,
              +-12 cent random scatter). The AudioContext is created inside the tap (js/dad-mark-zoom.js, iOS-safe); it is its own context,
              the auto-DJ is never touched. Low volume.
   5 FAIRY    (Danny t740u "can we have a fairy? Come in and give it a thing and fly off once you open it") an original tiny glowing sprite in
              Dad's palette (#9DBCCE body, #85A6BB dress, pale-cyan wings rimmed #0AF2FF, cyan aura) drawn on a canvas over the overlay. Once per
              open: after PHI^-2 = 0.382 s she flies in from one side on a curved swoop (PHI^0.5 = 1.27 s, wing flutter sound panned with her),
              hovers over the top of a letter and touches it (PHI^-1 = 0.618 s): she drops the little star she carries onto the logo, a burst
              of pixie dust and a soft glass chime, and the logo glow brightens for PHI^0.5 s; then she flies off out of frame on the other side
              (PHI^0.5 s, airy whoosh), leaving a dust trail that drifts down and fades over ~PHI^0 s. Reduced motion: no flight, just a soft
              sparkle in place on the logo with the chime.
   4 GLOW     the halo breathes over PHI^5 = 11.09 s (Bonnie 'loop effect'), and its echo comes back off an undrawn rounded wall inside the tile
              (a soft ring of light that fades to nothing on both sides, where the halo meets the invisible wall), PHI^-1 = 0.618 s later, as if the light bounced. The wall itself is never drawn.
   All periods follow PhiTiming.sweep() (weather shift, re-read every cycle). Reduced motion: no shimmer, no twinkles, no breathing; the faint
   stars, the stronger glow and the static echo stay; open/close sounds stay. API: RebellaZoomLife.start(fig, audioContext) / stop(). */
(function(){
  'use strict';
  var PHI=1.6180339887,G=0.6180339887,NS='http://www.w3.org/2000/svg',VB=[413,534,1810,893],
      NOTES=[1318.5,1480,1661.2,1976,2217.5,2637];   // E6 F#6 G#6 B6 C#7 E7: bright E-major pentatonic, nothing minor, nothing low
  var RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function P(n){var s=0;try{s=window.PhiTiming?PhiTiming.sweep():0;}catch(e){}return Math.pow(PHI,n+s)*1000;}
  var CSS='.dmz--rebella .dmz-art{position:relative;z-index:1}'+
    '.rbz-bg,.rbz-fx{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;border-radius:inherit}'+
    '.rbz-bg{z-index:0}.rbz-fx{z-index:2;overflow:hidden}'+
    '.rbz-fairy{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:3}'+
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
  // one glass sparkle: a bright sine plus two quiet inharmonic partials (x2.76, x5.4: glass, not a music-box tine), 4 ms attack, short decay
  function pan(x){var o=out();if(!o)return null;try{if(st.ac.createStereoPanner){var p=st.ac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,x||0));p.connect(o);return p;}}catch(e){}return o;}
  function sparkle(f,gain,delay,px){var o=out();if(!o)return;var ac=st.ac,t=ac.currentTime+(delay||0)+0.01,d=pan(px)||o;
    f*=Math.pow(2,(Math.random()*24-12)/1200);var dec=0.22+Math.random()*0.16;
    [[1,1,dec],[2.76,0.28,dec*0.55],[5.4,0.1,dec*0.3]].forEach(function(q){var os=ac.createOscillator(),g=ac.createGain();os.type='sine';os.frequency.value=f*q[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*q[1],t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+q[2]);
      os.connect(g);g.connect(d);os.start(t);os.stop(t+q[2]+0.05);});}
  function note(i){return NOTES[((i%NOTES.length)+NOTES.length)%NOTES.length];}
  var noise=null;
  function nbuf(ac){if(!noise||noise.sampleRate!==ac.sampleRate){var n=Math.floor(ac.sampleRate*2.2);noise=ac.createBuffer(1,n,ac.sampleRate);var c=noise.getChannelData(0);for(var i=0;i<n;i++)c[i]=Math.random()*2-1;}return noise;}
  // breathy air: white noise -> high-pass -> soft band sweep; optional wing flutter (gain wobble) and a pan glide
  function air(dur,o){var out0=out();if(!out0)return;o=o||{};var ac=st.ac,t=ac.currentTime+(o.delay||0)+0.01;
    var s=ac.createBufferSource(),hp=ac.createBiquadFilter(),bp=ac.createBiquadFilter(),g=ac.createGain(),d=out0;s.buffer=nbuf(ac);s.loop=true;
    hp.type='highpass';hp.frequency.value=2200;bp.type='bandpass';bp.Q.value=o.q||1.1;
    bp.frequency.setValueAtTime(o.f0||3000,t);bp.frequency.exponentialRampToValueAtTime(o.f1||8000,t+dur);
    var pk=o.gain||0.03,at=dur*(o.peak==null?0.382:o.peak);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(pk,t+at);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    try{if(o.pan&&ac.createStereoPanner){var p=ac.createStereoPanner();p.pan.setValueAtTime(o.pan[0],t);p.pan.linearRampToValueAtTime(o.pan[1],t+dur);p.connect(out0);d=p;}}catch(e){}
    var last=g;if(o.flutter){try{var w=ac.createGain(),lfo=ac.createOscillator(),dep=ac.createGain();w.gain.value=0.6;lfo.frequency.value=o.flutter;dep.gain.value=0.4;
      lfo.connect(dep);dep.connect(w.gain);g.connect(w);last=w;lfo.start(t);lfo.stop(t+dur+0.05);}catch(e){}}
    s.connect(hp);hp.connect(bp);bp.connect(g);last.connect(d);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05);}
  function swish(dur){air(dur,{f0:3000,f1:8000,gain:0.026});var i=Math.floor(Math.random()*6);sparkle(note(i+2),0.009,dur*0.45);if(Math.random()<0.5)sparkle(note(i+4),0.006,dur*0.6);}
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
    sparkle(note(k-1+Math.floor(Math.random()*2)),0.011+0.003*(6-k)/5,0,(u[0]/st.fig.clientWidth-0.5)*0.8);later(function(){twinkle(k);},P(1.5+k/2));}
  function bgStars(cv){var w=cv.clientWidth,h=cv.clientHeight,d=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;cv.width=Math.round(w*d);cv.height=Math.round(h*d);
    var x=cv.getContext('2d');x.scale(d,d);var n=Math.round(w*h/2600),seed=7;function r(){seed=(seed*16807)%2147483647;return seed/2147483647;}
    for(var i=0;i<n;i++){var a=0.05+0.17*r()*r(),R=0.35+0.8*r();x.fillStyle=(i%5===0?'rgba(248,207,219,':'rgba(255,255,255,')+a.toFixed(3)+')';x.beginPath();x.arc(r()*w,r()*h,R,0,6.2832);x.fill();}}
  // ---- 5 FAIRY (Danny t740u): original sprite, canvas over the overlay, once per open ----
  function bez(p,t){var u=1-t;return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]];}
  function eio(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function star4(x,c,r){x.beginPath();x.moveTo(0,-r);x.quadraticCurveTo(0,0,r,0);x.quadraticCurveTo(0,0,0,r);x.quadraticCurveTo(0,0,-r,0);x.quadraticCurveTo(0,0,0,-r);x.fillStyle=c;x.fill();}
  function drawFairy(x,f,px,py,tilt,flap,sz,carry){x.save();x.translate(px,py);x.rotate(tilt);x.scale(sz,sz);x.globalCompositeOperation='lighter';
    var a=x.createRadialGradient(0,0,0,0,0,24);a.addColorStop(0,'rgba(10,242,255,.42)');a.addColorStop(.35,'rgba(10,242,255,.14)');a.addColorStop(1,'rgba(10,242,255,0)');
    x.fillStyle=a;x.beginPath();x.arc(0,0,24,0,6.2832);x.fill();
    var fx=0.3+0.7*Math.abs(Math.cos(flap));            // wings sweep: full -> edge-on
    for(var sd=-1;sd<=1;sd+=2){x.save();x.scale(sd,1);
      x.save();x.translate(1.5,-2.5);x.rotate(-0.55);x.scale(fx,1);x.beginPath();x.ellipse(6.5,0,7.5,3.6,0,0,6.2832);
      x.fillStyle='rgba(157,188,206,.30)';x.fill();x.lineWidth=0.7;x.strokeStyle='rgba(10,242,255,.75)';x.stroke();x.restore();
      x.save();x.translate(1.2,1.2);x.rotate(0.6);x.scale(fx,1);x.beginPath();x.ellipse(4.4,0,4.8,2.4,0,0,6.2832);
      x.fillStyle='rgba(133,166,187,.28)';x.fill();x.lineWidth=0.6;x.strokeStyle='rgba(10,242,255,.6)';x.stroke();x.restore();x.restore();}
    x.globalCompositeOperation='source-over';
    x.beginPath();x.moveTo(0,-1.5);x.quadraticCurveTo(3.6,5,2.2,8.5);x.quadraticCurveTo(0,7.6,-2.2,8.5);x.quadraticCurveTo(-3.6,5,0,-1.5);x.fillStyle='#85A6BB';x.fill();  // petal dress
    x.beginPath();x.ellipse(0,0.6,1.5,2.6,0,0,6.2832);x.fillStyle='#9DBCCE';x.fill();                                              // body
    x.beginPath();x.arc(0,-3.9,2.1,0,6.2832);x.fillStyle='#EAF6FB';x.fill();                                                       // head
    x.beginPath();x.arc(-0.9,-5.6,1.15,0,6.2832);x.fillStyle='#9DBCCE';x.fill();                                                  // little bun
    x.globalCompositeOperation='lighter';var c=x.createRadialGradient(0,-1,0,0,-1,5);c.addColorStop(0,'rgba(255,255,255,.9)');c.addColorStop(1,'rgba(10,242,255,0)');
    x.fillStyle=c;x.beginPath();x.arc(0,-1,5,0,6.2832);x.fill();
    if(carry){x.save();x.translate(f*4.6,2.2);x.rotate(flap*0.15);star4(x,'#E9FDFF',2.6);star4(x,'rgba(10,242,255,.55)',4.2);x.restore();}
    x.restore();}
  function fairy(){if(!st||st.fairy)return;var me=st;st.fairy={cv:null,raf:0};later(function(){if(me===st)fly(me);},382);}   // PHI^-2: after the zoom has finished scaling up
  function fly(me){var ov=st.fig.parentNode;if(!ov)return;
    var cv=document.createElement('canvas');cv.className='rbz-fairy';cv.setAttribute('aria-hidden','true');ov.appendChild(cv);
    var W=ov.clientWidth||innerWidth,H=ov.clientHeight||innerHeight,dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    var x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
    var fr=st.fig.getBoundingClientRect(),orr=ov.getBoundingClientRect(),T;
    // touch point: the top of a letter about a golden section along the word (from the letter silhouette when it is ready)
    if(st.cols&&st.cols.length){var col=st.cols[Math.floor(st.cols.length*0.618)],u=toFig(col[0],col[1]);T=[fr.left-orr.left+st.fig.clientLeft+u[0],fr.top-orr.top+st.fig.clientTop+u[1]];}
    else T=[fr.left-orr.left+fr.width*0.6,fr.top-orr.top+fr.height*0.32];
    var side=Math.random()<0.5?-1:1,sz=Math.max(1,Math.min(1.8,fr.width/480)),fw=fr.width,fh=fr.height,H0=[T[0],T[1]-15*sz];
    var IN=[[side<0?-50:W+50,Math.max(20,fr.top-orr.top-fh*0.15)],[T[0]+side*fw*0.15,T[1]+fh*0.62],[T[0]-side*fw*0.32,T[1]-fh*0.42],H0];
    var OUT=[H0,[T[0]+side*fw*0.12,T[1]-fh*0.36],[T[0]-side*fw*0.6,T[1]-fh*0.5],[side<0?W+60:-60,Math.max(-40,fr.top-orr.top-fh*0.4)]];
    var D0=0,DIN=1272,DT=618,DOUT=1272,DUST=1000,t0=performance.now(),parts=[],burst=false,gift=null,lx=IN[0][0],ly=IN[0][1],rm=RM.matches,ac=st.ac;
    var pp=function(px){return (px/W-0.5)*1.6;};
    st.fairy.cv=cv;
    function spawn(px,py,n,sp,life,up){for(var i=0;i<n;i++){var a=Math.random()*6.2832,v=sp*(0.35+0.65*Math.random());
      parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(up||0),l:0,m:life*(0.6+0.8*Math.random()),r:(0.7+Math.random()*1.6)*sz,c:Math.random()<0.55?'10,242,255':(Math.random()<0.5?'157,188,206':'235,250,255'),s:Math.random()<0.3});}}
    function give(){if(me!==st)return;burst=true;gift={x:lx,y:ly+8*sz,t:performance.now()};
      spawn(T[0],T[1],rm?16:44,rm?14:130,rm?1.4:1.1,rm?0:20);
      [0,1,2,3].forEach(function(i){sparkle(note(1+i+(i>2?1:0)),0.014-0.002*i,i*0.056,pp(T[0]));});    // little glass chime, PHI^-6 s apart
      air(0.618,{f0:5000,f1:9000,gain:0.012,peak:0.2});
      if(st.art)anim(st.art,[{filter:'brightness(1)'},{filter:'brightness(1.5) saturate(1.15)',offset:0.236},{filter:'brightness(1)'}],{duration:1272,easing:'ease-out'});}
    if(rm){give();}
    else if(ac){air(DIN/1000,{f0:4200,f1:6500,gain:0.018,peak:0.7,flutter:19,pan:[side*0.9,pp(T[0])],q:0.9});
      air(DOUT/1000,{delay:(D0+DIN+DT)/1000,f0:3200,f1:10000,gain:0.022,peak:0.3,flutter:21,pan:[pp(T[0]),-side*0.95]});}
    function frame(now){if(me!==st)return;var e=now-t0,dt=1/60,fx=null,fy=null,tilt=0,carry=true,ph=0;
      if(!rm&&e>=D0){var k=e-D0;
        if(k<DIN){var q=eio(k/DIN),p=bez(IN,q);fx=p[0];fy=p[1];ph=k/1000*2*Math.PI*9;}
        else if(k<DIN+DT){var h=(k-DIN)/DT;fx=H0[0]+Math.sin(h*Math.PI*2)*3*sz;fy=H0[1]+Math.sin(h*Math.PI)*9*sz;ph=k/1000*2*Math.PI*6;if(h>0.5)carry=false;if(h>=0.5&&!burst)give();}
        else if(k<DIN+DT+DOUT){var o=(k-DIN-DT)/DOUT,p2=bez(OUT,o*o*(1.6-0.6*o));fx=p2[0];fy=p2[1];carry=false;ph=k/1000*2*Math.PI*10;}
        if(fx!==null){var vx=fx-lx;tilt=Math.max(-0.5,Math.min(0.5,vx*0.03));if(Math.random()<0.9)spawn(fx-vx*0.5,fy+3*sz,2,12,1,0);lx=fx;ly=fy;}}
      x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
      for(var i=parts.length-1;i>=0;i--){var P0=parts[i];P0.l+=dt;if(P0.l>=P0.m){parts.splice(i,1);continue;}
        if(!rm){P0.vx*=0.965;P0.vy=P0.vy*0.965+38*dt;P0.x+=P0.vx*dt;P0.y+=P0.vy*dt;}
        var al=(1-P0.l/P0.m);al=al*al*(rm?Math.sin(Math.PI*P0.l/P0.m):1);
        if(P0.s){x.save();x.translate(P0.x,P0.y);x.rotate(P0.l*3);star4(x,'rgba('+P0.c+','+(al*0.95).toFixed(3)+')',P0.r*2.2);x.restore();}
        else{x.fillStyle='rgba('+P0.c+','+(al*0.85).toFixed(3)+')';x.beginPath();x.arc(P0.x,P0.y,P0.r,0,6.2832);x.fill();}}
      if(gift){var gt=(now-gift.t)/618;if(gt<1){var gx=gift.x+(T[0]-gift.x)*Math.min(1,gt*2.6),gy=gift.y+(T[1]-gift.y)*Math.min(1,gt*2.6);
          var rr=4+gt*36*sz,g2=x.createRadialGradient(gx,gy,0,gx,gy,rr);g2.addColorStop(0,'rgba(235,252,255,'+(0.8*(1-gt)).toFixed(3)+')');g2.addColorStop(0.4,'rgba(10,242,255,'+(0.35*(1-gt)).toFixed(3)+')');g2.addColorStop(1,'rgba(10,242,255,0)');
          x.fillStyle=g2;x.beginPath();x.arc(gx,gy,rr,0,6.2832);x.fill();x.save();x.translate(gx,gy);x.rotate(gt*2);star4(x,'rgba(233,253,255,'+(1-gt).toFixed(3)+')',3+5*(1-gt)*sz);x.restore();}else gift=null;}
      if(fx!==null)drawFairy(x,side<0?1:-1,fx,fy,tilt,ph,sz,carry);
      if(e>(rm?D0:D0+DIN+DT+DOUT)+200&&!parts.length&&!gift){endFairy(me);return;}
      if(e>D0+DIN+DT+DOUT+DUST+1600){endFairy(me);return;}
      me.fairy.raf=requestAnimationFrame(frame);}
    st.fairy.raf=requestAnimationFrame(frame);}
  function endFairy(s){if(!s||!s.fairy)return;try{cancelAnimationFrame(s.fairy.raf);}catch(e){}if(s.fairy.cv&&s.fairy.cv.parentNode)s.fairy.cv.parentNode.removeChild(s.fairy.cv);s.fairy.raf=0;}
  function start(fig,ac){stop();var svg=fig.querySelector('.dmz-art svg'),use=svg&&svg.querySelector('use:last-of-type');if(!svg||!use)return;style();
    st={fig:fig,art:fig.querySelector('.dmz-art'),ac:ac||null,timers:[],anims:[],stars:[],cols:null,sheen:null,out:null,fairy:null};
    if(st.ac){try{st.out=st.ac.createGain();st.out.gain.value=0.8;st.out.connect(st.ac.destination);}catch(e){st.out=null;}}
    var bg=document.createElement('canvas');bg.className='rbz-bg';bg.setAttribute('aria-hidden','true');fig.insertBefore(bg,fig.firstChild);
    var wall=document.createElement('div');wall.className='rbz-wall';wall.setAttribute('aria-hidden','true');fig.insertBefore(wall,st.art);
    var fx=document.createElement('div');fx.className='rbz-fx';fx.setAttribute('aria-hidden','true');fig.appendChild(fx);
    requestAnimationFrame(function(){if(st&&st.fig===fig)bgStars(bg);});
    var glowUse=svg.querySelector('use[filter]'),motion=!RM.matches;
    if(motion){var B=P(5);if(glowUse)anim(glowUse,[{opacity:.72},{opacity:1},{opacity:.72}],{duration:B,iterations:Infinity,easing:'ease-in-out'});
      anim(wall,[{opacity:.3},{opacity:.95},{opacity:.3}],{duration:B,delay:P(-1),iterations:Infinity,easing:'ease-in-out',fill:'backwards'});}
    var href=(use.getAttribute('href')||'').split('#')[0],fst=st;
    later(function(){if(st===fst&&!st.fairy)fairy();},300);   // fairy: once per open (waits up to 0.3 s for the letter tops, then flies anyway)
    pathD(href).then(function(d){if(!st||st.fig!==fig||!d)return;
      var defs=document.createElementNS(NS,'defs');
      defs.innerHTML='<clipPath id="rbz-clip"><path clip-rule="evenodd" d="'+d+'"/></clipPath>'+
        '<linearGradient id="rbz-sheen-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#FFF4F8" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      try{st.cols=edges(d);}catch(e){st.cols=null;}
      if(!st.fairy)fairy();
      if(motion){var g=document.createElementNS(NS,'g');g.setAttribute('clip-path','url(#rbz-clip)');g.setAttribute('aria-hidden','true');
        var r=document.createElementNS(NS,'rect');r.setAttribute('x',VB[0]-560);r.setAttribute('y',VB[1]-200);r.setAttribute('width',300);r.setAttribute('height',VB[3]+400);
        r.setAttribute('fill','url(#rbz-sheen-g)');r.setAttribute('transform','translate(0 0)');g.appendChild(r);
        var wrap=document.createElementNS(NS,'g');wrap.setAttribute('transform','skewX(-16)');wrap.appendChild(r);g.appendChild(wrap);svg.appendChild(g);st.sheen=r;
        later(shimmer,P(0));
        for(var k=1;k<=6;k++){var s=document.createElement('span');s.className='rbz-star';fx.appendChild(s);st.stars.push(s);
          (function(k){later(function(){twinkle(k);},P(1.5+k/2)*((k*G)%1));})(k);}}
    }).catch(function(){});}
  function stop(){if(!st)return;var s=st;st=null;endFairy(s);s.timers.forEach(clearTimeout);s.anims.forEach(function(a){try{a.cancel();}catch(e){}});
    if(s.out){try{var t=s.ac.currentTime;s.out.gain.cancelScheduledValues(t);s.out.gain.setValueAtTime(s.out.gain.value,t);s.out.gain.linearRampToValueAtTime(0,t+0.08);
      setTimeout(function(){try{s.out.disconnect();}catch(e){}},150);}catch(e){}}}
  window.RebellaZoomLife={start:start,stop:stop,running:function(){return !!st;}};
})();
