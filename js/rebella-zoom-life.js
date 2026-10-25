/* Rebella zoom "life" (Danny t724u 14:04 AWST 25 Oct 2026), questionnaire only, ENLARGED view only (header logo and logo artwork untouched).
   Loaded lazily: js/dad-mark-zoom.js injects this file the first time the Rebella zoom opens. Everything stops when the zoom closes.
   1 SHIMMER  a soft light band glides across the letters, clipped to the letter shapes (evenodd, so the holes stay black).
              Period PHI^4 = 6.854 s (Bonnie 'facts' slot), glide PHI^1 = 1.618 s, first one PHI^0 = 1 s after opening.
   2 STARS    very faint static stars on a small canvas behind the logo, plus 6 highlight stars that twinkle in and out just above the top and
              just below the bottom edge of the lettering (positions read from the letter silhouette). Star k (1..6) repeats every
              PHI^(1.5+k/2) s = 2.62 / 3.33 / 4.24 / 5.39 / 6.85 / 8.72 s, each twinkle PHI^1 s, first at period*frac(k*0.618) (golden angle).
   3 SOUND    (t746u) a continuous music bed from js/logo-sound.js (the shared logo sound engine, trap <-> ethereal-organic ladder, loaded
              lazily on the first open; the bird's star-drop and each shimmer fire its 'star-drop' / 'shimmer' hooks = +0.236 nudge). On top:
              Fairy palette (Danny t740u 14:2x AWST 25 Oct: the music-box tones were "too baby and too scary"): Web Audio synthesis only, no
              files, no tones below ~1.3 kHz, no drone. Each shimmer = a breathy high-passed air swish (3 -> 8 kHz) with one or two faint glassy
              sparkles; star k = one tiny glass sparkle (bright E-major-pentatonic partials in the E6-E7 octave, 4 ms attack, ~0.3 s decay,
              +-12 cent random scatter). The AudioContext is created inside the tap (js/dad-mark-zoom.js, iOS-safe); it is its own context,
              the auto-DJ is never touched. Low volume.
   5 BLUEBIRD (Danny t744u 14:3x AWST 25 Oct: "slow down by 50% ... change it to a bluebird ... a bit bigger"; replaces the t740u fairy)
              an original small bluebird of happiness in Dad's palette (#1F5478 back and wings, #85A6BB/#9DBCCE breast, pale belly, #0AF2FF
              wing-edge and crown glints, faint cyan aura), 1.6x the fairy's size, drawn on a canvas over the overlay. Once per open: after
              PHI^-2 = 0.382 s it flies in on a curved swoop (2.544 s = twice the fairy's PHI^0.5, wingbeats with short glides,
              6.85 beats/s = PHI^4, gentle PHI^1 s bob, soft wing-flutter sound and a little chirp), hovers over the top of a letter (1.236 s) and leaves
              the star it carries in its beak (dust burst, glass chime, happy chirp, logo glow brightens), then flies off out of frame
              (2.544 s). Reduced motion: no flight, just the soft sparkle in place with the chime.
   6 COMPANIONS tiny butterflies and small songbirds (no birds of prey) drift through the dawn sky behind the tile (see section 6 below).
   7 DAWN SKY  a calm background loop behind the tile: horizon glow, aurora veils, rising bokeh motes (see section 7 below).
   The small header logo gets only a faint glow drift (css/rebella-glow-lite.css, tier 3), never creatures.
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
    '.rbz-wall{position:absolute;left:1%;top:1.5%;right:1%;bottom:1.5%;pointer-events:none;z-index:0;opacity:.6;'+   // soft ring that fades to 0 on both sides: no edge, no drawn wall
      'background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(229,138,166,0) 58%,rgba(229,138,166,.16) 80%,rgba(229,138,166,.05) 92%,rgba(229,138,166,0) 100%)}'+
    '.rbz-star{position:absolute;left:0;top:0;opacity:0;will-change:transform,opacity;'+
      'background:radial-gradient(circle,#fff 0 10%,rgba(248,207,219,.85) 20%,rgba(229,138,166,0) 62%);'+
      'clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%);-webkit-clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)}';
  function style(){if(document.getElementById('rbz-life-css'))return;var s=document.createElement('style');s.id='rbz-life-css';s.textContent=CSS+DAWN_CSS+'.dmz-x{z-index:2}';document.head.appendChild(s);}
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
  function snd(name){try{st&&st.snd&&st.snd.event(name);}catch(e){}}
  var SND='js/logo-sound.js?v=1',sndLoading=null;
  function music(){if(!st||!st.ac||!st.out)return;var me=st;
    function go(){if(me!==st||me.snd||!window.LogoSound)return;try{me.snd=LogoSound.create(me.ac,me.out,{root:41.2034,events:{'star-drop':0.236,'shimmer':0.236},gain:0.5});}catch(e){}}
    if(window.LogoSound)return go();if(!sndLoading)sndLoading=new Promise(function(res){var sc=document.createElement('script');sc.src=SND;sc.async=true;sc.onload=sc.onerror=res;document.head.appendChild(sc);});sndLoading.then(go);}
  function shimmer(){if(!st.sheen)return;snd('shimmer');var dur=P(1);anim(st.sheen,[{transform:'translateX(0px)'},{transform:'translateX('+(VB[2]+900)+'px)'}],{duration:dur,easing:'cubic-bezier(.45,.05,.35,1)'});
    swish(dur/1000);later(shimmer,P(4));}
  function twinkle(k){var el=st.stars[k-1],c=st.cols;if(!el||!c||!c.length)return;
    var col=c[Math.floor(c.length*(0.04+0.88*Math.random()))],top=(k%2===1),u=toFig(col[0],top?col[1]-26:col[2]+26),sz=Math.max(8,Math.round(st.fig.clientWidth*0.022*(0.75+0.5*Math.random())));
    el.style.width=el.style.height=sz+'px';el.style.left=(u[0]-sz/2)+'px';el.style.top=(u[1]-sz/2)+'px';
    anim(el,[{opacity:0,transform:'scale(.2) rotate(0deg)'},{opacity:.9,transform:'scale(1) rotate(22deg)',offset:.382},{opacity:0,transform:'scale(.25) rotate(45deg)'}],{duration:P(1),easing:'ease-in-out'});
    sparkle(note(k-1+Math.floor(Math.random()*2)),0.011+0.003*(6-k)/5,0,(u[0]/st.fig.clientWidth-0.5)*0.8);later(function(){twinkle(k);},P(1.5+k/2));}
  function bgStars(cv){var w=cv.clientWidth,h=cv.clientHeight,d=Math.min(2,window.devicePixelRatio||1);if(!w||!h)return;cv.width=Math.round(w*d);cv.height=Math.round(h*d);
    var x=cv.getContext('2d');x.scale(d,d);var n=Math.round(w*h/2600),seed=7;function r(){seed=(seed*16807)%2147483647;return seed/2147483647;}
    for(var i=0;i<n;i++){var a=0.05+0.17*r()*r(),R=0.35+0.8*r();x.fillStyle=(i%5===0?'rgba(248,207,219,':'rgba(255,255,255,')+a.toFixed(3)+')';x.beginPath();x.arc(r()*w,r()*h,R,0,6.2832);x.fill();}}
  // ---- 5 BLUEBIRD (Danny t744u, replaces the t740u fairy): original small bluebird of happiness, canvas over the overlay, once per open ----
  function bez(p,t){var u=1-t;return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]];}
  function eio(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
  function star4(x,c,r){x.beginPath();x.moveTo(0,-r);x.quadraticCurveTo(0,0,r,0);x.quadraticCurveTo(0,0,0,r);x.quadraticCurveTo(0,0,-r,0);x.quadraticCurveTo(0,0,0,-r);x.fillStyle=c;x.fill();}
  // bird in local units (~28 wide, beak to +x). face: +1 right / -1 left. flap: wing phase (rad). wing<0 = folded (glide). a: alpha. pal: 0 bluebird, 1 small songbird
  function drawBird(x,face,px,py,tilt,flap,sz,carry,a,pal,aura){x.save();x.translate(px,py);x.rotate(tilt);x.scale(sz*face,sz);x.globalAlpha=a==null?1:a;
    var back=pal?'#85A6BB':'#1F5478',deep=pal?'#1F5478':'#143A57',belly=pal?'#DCEAF2':'#C9DEEA',head=pal?'#9DBCCE':'#1F5478';
    if(aura){x.globalCompositeOperation='lighter';var g=x.createRadialGradient(0,0,0,0,0,26);g.addColorStop(0,'rgba(10,242,255,.30)');g.addColorStop(.4,'rgba(10,242,255,.10)');g.addColorStop(1,'rgba(10,242,255,0)');
      x.fillStyle=g;x.beginPath();x.arc(0,0,26,0,6.2832);x.fill();x.globalCompositeOperation='source-over';}
    var w=flap==null?0:Math.sin(flap);                                           // wing: +1 up, -1 down
    // far wing (behind the body)
    x.save();x.translate(-1,-2.2);x.scale(1,flap==null?0.35:-0.9*w);x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(-4,-9,-11,-8.5);x.quadraticCurveTo(-6,-3,0,0);x.fillStyle=deep;x.fill();x.restore();
    // tail
    x.beginPath();x.moveTo(-6,-0.6);x.lineTo(-14.5,-3.4);x.quadraticCurveTo(-13,-0.6,-14.5,2.2);x.lineTo(-6,1.6);x.closePath();x.fillStyle=deep;x.fill();
    // body: blue back to pale belly
    var b=x.createLinearGradient(0,-5.5,0,5.5);b.addColorStop(0,back);b.addColorStop(.55,pal?'#9DBCCE':'#85A6BB');b.addColorStop(1,belly);
    x.beginPath();x.ellipse(0,0.4,8.2,5.4,-0.08,0,6.2832);x.fillStyle=b;x.fill();
    // head + eye + beak
    x.beginPath();x.arc(6.6,-3.2,4.1,0,6.2832);x.fillStyle=head;x.fill();
    x.beginPath();x.arc(7.4,-1.6,2.2,0,6.2832);x.fillStyle=pal?'#DCEAF2':'#9DBCCE';x.fill();             // soft cheek
    x.beginPath();x.arc(8,-3.9,1.05,0,6.2832);x.fillStyle='#F4FBFF';x.fill();x.beginPath();x.arc(8.3,-3.9,0.6,0,6.2832);x.fillStyle='#071A28';x.fill();
    x.beginPath();x.moveTo(10.3,-3.5);x.lineTo(13.4,-2.6);x.lineTo(10.3,-1.8);x.closePath();x.fillStyle='#E7DDBF';x.fill();
    // near wing (in front), cyan glint on its edge
    x.save();x.translate(-0.5,-1.6);x.scale(1,flap==null?0.4:w);x.beginPath();x.moveTo(1.5,0);x.quadraticCurveTo(-3,-10,-12,-9.5);x.quadraticCurveTo(-6.5,-2.6,1.5,0);
    x.fillStyle=back;x.fill();x.lineWidth=0.6;x.strokeStyle='rgba(10,242,255,.7)';x.stroke();x.restore();
    if(!pal){x.globalCompositeOperation='lighter';x.beginPath();x.arc(5.6,-5.4,0.9,0,6.2832);x.fillStyle='rgba(10,242,255,.55)';x.fill();x.globalCompositeOperation='source-over';}   // crown glint
    if(carry){x.save();x.translate(14.6,-2.4);x.rotate((flap||0)*0.08);x.globalCompositeOperation='lighter';star4(x,'rgba(10,242,255,.5)',4.4);star4(x,'#E9FDFF',2.7);x.restore();}
    x.restore();x.globalAlpha=1;}
  function chirp(delay,px,hi){var o=out();if(!o)return;var ac=st.ac,t=ac.currentTime+(delay||0)+0.01,d=pan(px)||o;
    [0,0.11].forEach(function(dt,i){var os=ac.createOscillator(),g=ac.createGain(),f=(hi?3400:3000)*Math.pow(2,(Math.random()*30-15)/1200);os.type='sine';
      os.frequency.setValueAtTime(f,t+dt);os.frequency.exponentialRampToValueAtTime(f*(i?1.27:1.5),t+dt+0.06);
      g.gain.setValueAtTime(0,t+dt);g.gain.linearRampToValueAtTime(0.008,t+dt+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.085);
      os.connect(g);g.connect(d);os.start(t+dt);os.stop(t+dt+0.12);});}
  function bird(){if(!st||st.bird)return;var me=st;st.bird={cv:null,raf:0};later(function(){if(me===st)fly(me);},382);}   // PHI^-2: after the zoom has finished scaling up
  function fly(me){var ov=st.fig.parentNode;if(!ov)return;
    var cv=document.createElement('canvas');cv.className='rbz-bird';cv.setAttribute('aria-hidden','true');ov.appendChild(cv);
    var W=ov.clientWidth||innerWidth,H=ov.clientHeight||innerHeight,dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    var x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
    var fr=st.fig.getBoundingClientRect(),orr=ov.getBoundingClientRect(),T;
    if(st.cols&&st.cols.length){var col=st.cols[Math.floor(st.cols.length*0.618)],u=toFig(col[0],col[1]);T=[fr.left-orr.left+st.fig.clientLeft+u[0],fr.top-orr.top+st.fig.clientTop+u[1]];}
    else T=[fr.left-orr.left+fr.width*0.6,fr.top-orr.top+fr.height*0.32];
    // 1.6x the fairy's size (Danny t744u "a bit bigger")
    var side=Math.random()<0.5?-1:1,sz=1.618*Math.max(1,Math.min(1.8,fr.width/480)),fw=fr.width,fh=fr.height,H0=[T[0]-side*2*sz,T[1]-11*sz];
    var IN=[[side<0?-60:W+60,Math.max(24,fr.top-orr.top-fh*0.2)],[T[0]+side*fw*0.18,T[1]+fh*0.55],[T[0]-side*fw*0.3,T[1]-fh*0.45],H0];
    var OUT=[H0,[T[0]+side*fw*0.1,T[1]-fh*0.38],[T[0]-side*fw*0.6,T[1]-fh*0.55],[side<0?W+80:-80,Math.max(-50,fr.top-orr.top-fh*0.45)]];
    // Danny t744u: 50% slower = every flight phase twice as long (fairy 1.272 / 0.618 / 1.272 s -> 2.544 / 1.236 / 2.544 s), dust PHI^1
    var D0=0,DIN=2544,DT=1236,DOUT=2544,DUST=1618,t0=performance.now(),parts=[],burst=false,gift=null,lx=IN[0][0],ly=IN[0][1],face=-side,rm=RM.matches,ac=st.ac;
    var pp=function(px){return (px/W-0.5)*1.6;};
    st.bird.cv=cv;
    function spawn(px,py,n,sp,life,up){for(var i=0;i<n;i++){var a=Math.random()*6.2832,v=sp*(0.35+0.65*Math.random());
      parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(up||0),l:0,m:life*(0.6+0.8*Math.random()),r:(0.7+Math.random()*1.4)*sz/1.3,c:Math.random()<0.55?'10,242,255':(Math.random()<0.5?'157,188,206':'235,250,255'),s:Math.random()<0.3});}}
    function give(){if(me!==st)return;burst=true;snd('star-drop');gift={x:lx+face*14*sz,y:ly-2*sz,t:performance.now()};
      spawn(T[0],T[1],rm?16:40,rm?14:110,rm?1.4:1.2,rm?0:18);
      [0,1,2,3].forEach(function(i){sparkle(note(1+i+(i>2?1:0)),0.014-0.002*i,i*0.056,pp(T[0]));});
      chirp(0.3,pp(T[0]),true);
      if(st.art)anim(st.art,[{filter:'brightness(1)'},{filter:'brightness(1.5) saturate(1.15)',offset:0.236},{filter:'brightness(1)'}],{duration:2058,easing:'ease-out'});}
    if(rm){give();}
    else if(ac){air(DIN/1000,{f0:3800,f1:5600,gain:0.014,peak:0.7,flutter:6.85,pan:[side*0.9,pp(T[0])],q:0.9});chirp(DIN/1000*0.618,pp(T[0]));
      air(DOUT/1000,{delay:(D0+DIN+DT)/1000,f0:3000,f1:8000,gain:0.016,peak:0.3,flutter:6.85,pan:[pp(T[0]),-side*0.95]});chirp((DIN+DT)/1000+0.2,pp(T[0]),true);}
    function frame(now){if(me!==st)return;var e=now-t0,dt=1/60,fx=null,fy=null,tilt=0,carry=true,ph=null,k=0;
      if(!rm&&e>=D0){k=e-D0;
        if(k<DIN){var q=eio(k/DIN),p=bez(IN,q);fx=p[0];fy=p[1];var fl=k/1000*6.85;ph=(fl%1<0.72)?fl*6.2832/0.72:null;}            // wingbeats with short glides
        else if(k<DIN+DT){var h=(k-DIN)/DT;fx=H0[0]+Math.sin(h*Math.PI*2)*2*sz;fy=H0[1]+Math.sin(h*Math.PI)*7*sz;ph=k/1000*6.2832*9;if(h>0.5)carry=false;if(h>=0.5&&!burst)give();}
        else if(k<DIN+DT+DOUT){var o=(k-DIN-DT)/DOUT,p2=bez(OUT,o*o*(1.6-0.6*o));fx=p2[0];fy=p2[1];carry=false;var fl2=k/1000*6.85;ph=(fl2%1<0.72)?fl2*6.2832/0.72:null;}
        if(fx!==null){fy+=Math.sin(k/1000*6.2832/1.618)*2.2*sz;                                                          // gentle bob, PHI^1 s
          var vx=fx-lx;if(Math.abs(vx)>0.25)face=vx>0?1:-1;tilt=Math.max(-0.35,Math.min(0.35,(fy-ly)*0.05));if(Math.random()<0.6)spawn(fx-vx*0.5,fy+3*sz,1,10,1,0);lx=fx;ly=fy;}}
      x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
      for(var i=parts.length-1;i>=0;i--){var P0=parts[i];P0.l+=dt;if(P0.l>=P0.m){parts.splice(i,1);continue;}
        if(!rm){P0.vx*=0.965;P0.vy=P0.vy*0.965+30*dt;P0.x+=P0.vx*dt;P0.y+=P0.vy*dt;}
        var al=(1-P0.l/P0.m);al=al*al*(rm?Math.sin(Math.PI*P0.l/P0.m):1);
        if(P0.s){x.save();x.translate(P0.x,P0.y);x.rotate(P0.l*3);star4(x,'rgba('+P0.c+','+(al*0.95).toFixed(3)+')',P0.r*2.2);x.restore();}
        else{x.fillStyle='rgba('+P0.c+','+(al*0.85).toFixed(3)+')';x.beginPath();x.arc(P0.x,P0.y,P0.r,0,6.2832);x.fill();}}
      if(gift){var gt=(now-gift.t)/1000;if(gt<1){var gx=gift.x+(T[0]-gift.x)*Math.min(1,gt*2.6),gy=gift.y+(T[1]-gift.y)*Math.min(1,gt*2.6);
          var rr=4+gt*36*sz/1.6,g2=x.createRadialGradient(gx,gy,0,gx,gy,rr);g2.addColorStop(0,'rgba(235,252,255,'+(0.8*(1-gt)).toFixed(3)+')');g2.addColorStop(0.4,'rgba(10,242,255,'+(0.35*(1-gt)).toFixed(3)+')');g2.addColorStop(1,'rgba(10,242,255,0)');
          x.fillStyle=g2;x.beginPath();x.arc(gx,gy,rr,0,6.2832);x.fill();x.save();x.translate(gx,gy);x.rotate(gt*2);star4(x,'rgba(233,253,255,'+(1-gt).toFixed(3)+')',3+5*(1-gt)*sz/1.6);x.restore();}else gift=null;}
      x.globalCompositeOperation='source-over';
      if(fx!==null)drawBird(x,face,fx,fy,tilt,ph,sz,carry,1,0,true);
      if(e>(rm?D0:D0+DIN+DT+DOUT)+200&&!parts.length&&!gift){endBird(me);return;}
      if(e>D0+DIN+DT+DOUT+DUST+1600){endBird(me);return;}
      me.bird.raf=requestAnimationFrame(frame);}
    st.bird.raf=requestAnimationFrame(frame);}
  function endBird(s){if(!s||!s.bird)return;try{cancelAnimationFrame(s.bird.raf);}catch(e){}if(s.bird.cv&&s.bird.cv.parentNode)s.bird.cv.parentNode.removeChild(s.bird.cv);s.bird.raf=0;}
  // ---- 6 COMPANIONS (Danny t744u "🦋 and 🐦 ... small birds, not birds of prey"): tiny butterflies and small songbirds drifting through the
  // dawn sky BEHIND the tile, one small canvas at ~30 fps, only while one is in flight. At most 3 at once. Creature k arrives at
  // PHI^2 s x (1 + frac(k x 0.618)) after the previous one (golden-angle stagger), crosses in PHI^4 s (butterfly) or PHI^3.5 s (songbird),
  // fading in and out over the first and last 0.236 of its trip. Butterflies flutter and wander; songbirds bound (flap, glide, flap).
  function drawFly(x,px,py,flap,sz,a,hue){x.save();x.translate(px,py);x.scale(sz,sz);x.globalAlpha=a;var fx=0.18+0.82*Math.abs(Math.cos(flap)),c=hue?'157,188,206':'10,242,255';
    for(var sd=-1;sd<=1;sd+=2){x.save();x.scale(sd*fx,1);
      x.beginPath();x.moveTo(0,-0.5);x.bezierCurveTo(3,-7,9,-6.5,8,-1.5);x.bezierCurveTo(7.4,0.6,3,0.6,0,0.2);x.fillStyle='rgba('+c+',.55)';x.fill();x.lineWidth=0.5;x.strokeStyle='rgba(10,242,255,.8)';x.stroke();
      x.beginPath();x.moveTo(0,0.4);x.bezierCurveTo(4,1,6,4.6,3.6,5.6);x.bezierCurveTo(1.8,6.2,0.6,3,0,1);x.fillStyle='rgba(133,166,187,.6)';x.fill();x.restore();}
    x.beginPath();x.ellipse(0,0.6,0.7,3.4,0,0,6.2832);x.fillStyle='#143A57';x.fill();
    x.strokeStyle='rgba(157,188,206,.8)';x.lineWidth=0.35;x.beginPath();x.moveTo(-0.3,-2.6);x.quadraticCurveTo(-1.4,-4.6,-2.2,-4.9);x.moveTo(0.3,-2.6);x.quadraticCurveTo(1.4,-4.6,2.2,-4.9);x.stroke();
    x.restore();x.globalAlpha=1;}
  function companions(){if(!st||RM.matches)return;var me=st,ov=st.fig.parentNode;if(!ov)return;
    var cv=document.createElement('canvas');cv.className='rbz-sky';cv.setAttribute('aria-hidden','true');ov.insertBefore(cv,st.fig);
    var dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,x=cv.getContext('2d'),list=[],n=0,raf=0,lastT=0;
    function size(){W=ov.clientWidth||innerWidth;H=ov.clientHeight||innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);x.setTransform(dpr,0,0,dpr,0,0);}
    size();me.sky={cv:cv,stop:function(){cancelAnimationFrame(raf);raf=0;}};
    function spawn(){if(me!==st)return;n++;var bf=((n*G)%1)<0.618,dir=Math.random()<0.5?1:-1,m=Math.min(W,H),s=Math.max(0.9,Math.min(1.7,m/360));
      var y0=H*(0.08+0.84*Math.random()),y1=Math.max(H*0.05,Math.min(H*0.95,y0+(Math.random()-0.5)*H*0.3));
      if(list.length<3)list.push({bf:bf,dir:dir,y0:y0,y1:y1,t0:performance.now(),d:bf?P(4):P(3.5),s:bf?s*1.15:s*0.62,ph:Math.random()*6.28,hue:Math.random()<0.5,wob:0.6+0.8*Math.random()});
      if(!raf)raf=requestAnimationFrame(frame);
      later(spawn,P(2)*(1+((n+1)*G)%1));}
    function frame(now){raf=0;if(me!==st)return;if(now-lastT<30){raf=requestAnimationFrame(frame);return;}lastT=now;   // ~30 fps
      x.clearRect(0,0,W,H);
      for(var i=list.length-1;i>=0;i--){var c=list[i],p=(now-c.t0)/c.d;if(p>=1){list.splice(i,1);continue;}
        var a=Math.min(1,p/0.236,(1-p)/0.236)*(c.bf?0.85:0.75),px=c.dir>0?-40+p*(W+80):W+40-p*(W+80),py=c.y0+(c.y1-c.y0)*p,tt=(now-c.t0)/1000;
        if(c.bf){py+=Math.sin(tt*6.2832/1.618*c.wob+c.ph)*16*c.s+Math.sin(tt*6.2832*1.1)*3*c.s;drawFly(x,px,py,tt*6.2832*2.62+c.ph,c.s,a,c.hue);}
        else{var cyc=(tt*1.618+c.ph)%1,flapOn=cyc<0.5;py+=(flapOn?-1:1)*Math.sin(cyc*Math.PI*2)*4*c.s;drawBird(x,c.dir,px,py,0,flapOn?tt*6.2832*11:null,c.s,false,a,1,false);}}
      if(list.length)raf=requestAnimationFrame(frame);}
    later(spawn,P(1)+P(-2));}   // first companion ~2 s after opening, after the bluebird has set off
  // ---- 7 DAWN SKY (Danny t744u "something else in the background ... a background loop ... very aesthetic"): behind the tile, over the
  // dimmed page. A deep-navy-to-dawn horizon glow that breathes (PHI^5 11.09 s), two faint aurora veils drifting sideways (PHI^7 29.03 s and
  // PHI^6 17.94 s, alternate = seamless) and 11 soft bokeh motes rising slowly (PHI^5..PHI^6 s each, golden-angle negative delays so the
  // sky is already full on open). Transform + opacity only, no filters, no canvas. Reduced motion: the same sky, still.
  var DAWN_CSS='.rbz-dawn{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;opacity:0;transition:opacity .618s ease}.rbz-dawn.on{opacity:1}'+
    '.rbz-dawn i{position:absolute;display:block;will-change:transform,opacity}'+
    '.rbz-hz{left:-20%;right:-20%;bottom:-30%;height:75%;background:radial-gradient(ellipse 50% 50% at 50% 70%,rgba(229,138,166,.27),rgba(133,166,187,.17) 42%,rgba(31,84,120,.12) 62%,rgba(20,58,87,0) 78%)}'+
    '.rbz-top{left:0;right:0;top:0;height:55%;background:linear-gradient(rgba(20,58,87,.42),rgba(20,58,87,0))}'+
    '.rbz-au{left:-40%;width:180%;height:42%;border-radius:50%}'+
    '.rbz-au1{top:6%;background:radial-gradient(ellipse 45% 38% at 40% 50%,rgba(10,242,255,.14),rgba(10,242,255,.05) 55%,rgba(10,242,255,0) 75%)}'+
    '.rbz-au2{top:22%;background:radial-gradient(ellipse 40% 34% at 62% 50%,rgba(157,188,206,.13),rgba(133,166,187,.05) 55%,rgba(133,166,187,0) 75%)}'+
    '.rbz-mote{border-radius:50%;opacity:0}'+
    '.rbz-sky,.rbz-bird{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}.rbz-sky{z-index:0}.rbz-bird{z-index:3}'+
    '.dmz>.dmz-fig{z-index:1}';
  function dawn(){var ov=st.fig.parentNode;if(!ov)return;var d=document.createElement('div');d.className='rbz-dawn';d.setAttribute('aria-hidden','true');
    d.innerHTML='<i class="rbz-top"></i><i class="rbz-hz"></i><i class="rbz-au rbz-au1"></i><i class="rbz-au rbz-au2"></i>';
    var motion=!RM.matches,cols=['157,188,206','10,242,255','229,138,166','133,166,187'];
    for(var k=1;k<=11;k++){var m=document.createElement('i'),f=(k*G)%1,s=Math.round(6+22*((k*0.382)%1)),c=cols[k%4],al=(c==='10,242,255'?0.22:0.3);
      m.className='rbz-mote';m.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(4+92*f).toFixed(1)+'%;top:'+(58+36*((k*0.2361)%1)).toFixed(1)+'%;'+
        'background:radial-gradient(circle,rgba('+c+','+al+') 0,rgba('+c+','+(al*0.45).toFixed(3)+') 45%,rgba('+c+',0) 70%)';
      d.appendChild(m);
      if(motion){var dur=P(5+(k%3)/2);anim(m,[{opacity:0,transform:'translate3d(0,0,0)'},{opacity:1,transform:'translate3d('+((f-0.5)*30).toFixed(1)+'px,-22vh,0)',offset:0.5},{opacity:0,transform:'translate3d('+((0.5-f)*20).toFixed(1)+'px,-44vh,0)'}],{duration:dur,delay:-dur*f,iterations:Infinity,easing:'linear'});}
      else m.style.opacity=(0.4+0.5*f).toFixed(2);}
    ov.insertBefore(d,ov.firstChild);st.layers.push(d);
    if(motion){var hz=d.querySelector('.rbz-hz'),a1=d.querySelector('.rbz-au1'),a2=d.querySelector('.rbz-au2');
      anim(hz,[{opacity:.72,transform:'scale(1)'},{opacity:1,transform:'scale(1.06)'}],{duration:P(5),iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
      anim(a1,[{opacity:.45,transform:'translate3d(-9%,0,0)'},{opacity:1,transform:'translate3d(9%,2%,0)'}],{duration:P(7),delay:-P(7)*G,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
      anim(a2,[{opacity:.9,transform:'translate3d(8%,0,0)'},{opacity:.35,transform:'translate3d(-8%,-3%,0)'}],{duration:P(6),delay:-P(6)*((2*G)%1),iterations:Infinity,direction:'alternate',easing:'ease-in-out'});}
    requestAnimationFrame(function(){d.classList.add('on');});}
  function start(fig,ac){stop();var svg=fig.querySelector('.dmz-art svg'),use=svg&&svg.querySelector('use:last-of-type');if(!svg||!use)return;style();
    st={fig:fig,art:fig.querySelector('.dmz-art'),ac:ac||null,timers:[],anims:[],stars:[],cols:null,sheen:null,out:null,snd:null,bird:null,sky:null,layers:[]};
    dawn();companions();
    if(st.ac){try{st.out=st.ac.createGain();st.out.gain.value=0.8;st.out.connect(st.ac.destination);}catch(e){st.out=null;}}
    music();
    var bg=document.createElement('canvas');bg.className='rbz-bg';bg.setAttribute('aria-hidden','true');fig.insertBefore(bg,fig.firstChild);
    var wall=document.createElement('div');wall.className='rbz-wall';wall.setAttribute('aria-hidden','true');fig.insertBefore(wall,st.art);
    var fx=document.createElement('div');fx.className='rbz-fx';fx.setAttribute('aria-hidden','true');fig.appendChild(fx);
    requestAnimationFrame(function(){if(st&&st.fig===fig)bgStars(bg);});
    var glowUse=svg.querySelector('use[filter]'),motion=!RM.matches;
    if(motion){var B=P(5);if(glowUse)anim(glowUse,[{opacity:.72},{opacity:1},{opacity:.72}],{duration:B,iterations:Infinity,easing:'ease-in-out'});
      anim(wall,[{opacity:.3},{opacity:.95},{opacity:.3}],{duration:B,delay:P(-1),iterations:Infinity,easing:'ease-in-out',fill:'backwards'});}
    var href=(use.getAttribute('href')||'').split('#')[0],fst=st;
    later(function(){if(st===fst&&!st.bird)bird();},300);   // bluebird: once per open (waits up to 0.3 s for the letter tops, then flies anyway)
    pathD(href).then(function(d){if(!st||st.fig!==fig||!d)return;
      var defs=document.createElementNS(NS,'defs');
      defs.innerHTML='<clipPath id="rbz-clip"><path clip-rule="evenodd" d="'+d+'"/></clipPath>'+
        '<linearGradient id="rbz-sheen-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#FFF4F8" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      try{st.cols=edges(d);}catch(e){st.cols=null;}
      if(!st.bird)bird();
      if(motion){var g=document.createElementNS(NS,'g');g.setAttribute('clip-path','url(#rbz-clip)');g.setAttribute('aria-hidden','true');
        var r=document.createElementNS(NS,'rect');r.setAttribute('x',VB[0]-560);r.setAttribute('y',VB[1]-200);r.setAttribute('width',300);r.setAttribute('height',VB[3]+400);
        r.setAttribute('fill','url(#rbz-sheen-g)');r.setAttribute('transform','translate(0 0)');g.appendChild(r);
        var wrap=document.createElementNS(NS,'g');wrap.setAttribute('transform','skewX(-16)');wrap.appendChild(r);g.appendChild(wrap);svg.appendChild(g);st.sheen=r;
        later(shimmer,P(0));
        for(var k=1;k<=6;k++){var s=document.createElement('span');s.className='rbz-star';fx.appendChild(s);st.stars.push(s);
          (function(k){later(function(){twinkle(k);},P(1.5+k/2)*((k*G)%1));})(k);}}
    }).catch(function(){});}
  function stop(){if(!st)return;var s=st;st=null;endBird(s);if(s.snd){try{s.snd.stop();}catch(e){}}if(s.sky){s.sky.stop();var sc=s.sky.cv;}
    s.layers.forEach(function(l){l.classList.remove('on');});setTimeout(function(){s.layers.forEach(function(l){if(l.parentNode)l.parentNode.removeChild(l);});if(sc&&sc.parentNode)sc.parentNode.removeChild(sc);},400);
    s.timers.forEach(clearTimeout);s.anims.forEach(function(a){try{a.cancel();}catch(e){}});
    if(s.out){try{var t=s.ac.currentTime;s.out.gain.cancelScheduledValues(t);s.out.gain.setValueAtTime(s.out.gain.value,t);s.out.gain.linearRampToValueAtTime(0,t+0.08);
      setTimeout(function(){try{s.out.disconnect();}catch(e){}},150);}catch(e){}}}
  window.RebellaZoomLife={start:start,stop:stop,running:function(){return !!st;}};
})();
