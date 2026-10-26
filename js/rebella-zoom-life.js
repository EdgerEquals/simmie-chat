/* KIDS CLUB COPY for Bonnie's sites (rebella js/rebella-zoom-life.js = simmie-chat js/rebella-zoom-life.js), from dad-page 8e1ce3c.
   Started by her own zoom shell js/kid-logo-view.js (not dad-mark-zoom.js, which stays with Dad's page). Changes: script paths are
   relative to this file (works from /moderation/ and every page depth); the zoom output has no master gain (unity: the device volume is
   the one overall control, Danny 13:08 AWST 26 Oct 2026); the bluebird keeps Dad's colours. Everything else is unchanged and its fixed
   values stay listed for Danny (/workspace/logo-sound-fixed-params.md). */
/* Rebella zoom "life" (Danny t724u 14:04 AWST 25 Oct 2026), questionnaire only, ENLARGED view only (header logo and logo artwork untouched).
   Loaded lazily: js/dad-mark-zoom.js injects this file the first time the Rebella zoom opens. Everything stops when the zoom closes.
   1 SHIMMER  a soft light band glides across the letters, clipped to the letter shapes (evenodd, so the holes stay black).
              Period PHI^4 = 6.854 s (Bonnie 'facts' slot), glide PHI^1 = 1.618 s, first one PHI^0 = 1 s after opening.
   2 STARS    very faint static stars on a small canvas behind the logo, plus 6 highlight stars that twinkle in and out just above the top and
              just below the bottom edge of the lettering (positions read from the letter silhouette). Star k (1..6) repeats every
              PHI^(1.5+k/2) s = 2.62 / 3.33 / 4.24 / 5.39 / 6.85 / 8.72 s, each twinkle PHI^1 s, first at period*frac(k*0.618) (golden angle).
   3 SOUND    (t746u, MIDI rebuild 15:11 AWST) a continuous music bed from js/logo-sound.js v=4 (shared logo engine: a MIDI sequencer on the
              phi grid + ladder, rendered by self-hosted Tone.js like Rebella's Music Playground; root, loudness and pumps come from the
              page via PhiPumps subscriptions; loaded lazily on the first open; the bird's star-drop and each shimmer fire its 'star-drop' / 'shimmer' hooks = +0.236 nudge). On top:
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
   5b VIEWS   (Danny 15:24) the bluebird (and the wagtail) have side-on, 30 deg and 60 deg turned views, mirrored left/right: body
              foreshortened, far wing partly hidden, breast and eye more visible, far eye peeking in at 60. Chosen by each bird's own VIEW
              PUMP (see ViewPump below: PHI^3 + PHI^4 modes, PHI^6 depth pump, child of the logo node, biased by turn rate; one step at a
              time, held >= PHI^0.5 s, 0.236 s morph, hysteresis 0.146, frozen during the star-drop hover; reduced motion: side-on).
              Bluebird reference data (js/bird-ref-data.js, documented exception): ~79.5% perch-then-drop approach arcs, low flight, fast
              irregular wingbeats (Pennycuick estimate x PHI^-1, +-14.6% per beat), each value x its own pump.
   9 WAGTAIL  (Danny 15:25) an original Willie wagtail perches on a letter, wags, preens, hops, hawks insects and leaves; behaviour from
              real field data, pumped (see section 9 below).
   6 COMPANIONS tiny butterflies and small songbirds (no birds of prey) drift through the dawn sky behind the tile (see section 6 below).
   7 DAWN SKY  a calm background loop behind the tile: horizon glow, aurora veils, rising bokeh motes (see section 7 below).
   The small header logo gets only a faint glow drift (css/rebella-glow-lite.css, tier 3), never creatures.
   4 GLOW     the halo breathes over PHI^5 = 11.09 s (Bonnie 'loop effect'), and its echo comes back off an undrawn rounded wall inside the tile
              (a soft ring of light that fades to nothing on both sides, where the halo meets the invisible wall), PHI^-1 = 0.618 s later, as if the light bounced. The wall itself is never drawn.
   All periods follow PhiTiming.sweep() (weather shift, re-read every cycle). Reduced motion: no shimmer, no twinkles, no breathing; the faint
   stars, the stronger glow and the static echo stay; open/close sounds stay. API: RebellaZoomLife.start(fig, audioContext) / stop(). */
(function(){
  'use strict';
  var ME=document.currentScript||document.querySelector('script[src*="rebella-zoom-life.js"]'),DIR=ME?ME.src.replace(/[^\/]*$/,''):'js/',VQ=(ME&&/\?v=[^#]*/.exec(ME.src)||[''])[0];
  var PHI=1.6180339887,G=0.6180339887,NS='http://www.w3.org/2000/svg',VB=[413,534,1810,893],
      NOTES=[1318.5,1480,1661.2,1976,2217.5,2637];   // E6 F#6 G#6 B6 C#7 E7: bright E-major pentatonic, nothing minor, nothing low
  var RM=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  function P(n){var s=0;try{s=window.PhiTiming?PhiTiming.sweep():0;}catch(e){}return Math.pow(PHI,n+s+drift())*1000;}
  // SWEET (Danny 14:01 AWST): her motion tile; 'Slow, dreamy drift' (the default) stretches every timing by one PHI step
  function drift(){try{var k=window.KidLogo&&KidLogo.read();return k&&k.drift===0?0:1;}catch(e){return 1;}}
  function mood(){try{var k=window.KidLogo&&KidLogo.read();return (k&&k.mood)||'dreamy';}catch(e){return 'dreamy';}}
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
    var dec=0.22+Math.random()*0.16;
    [[1,1,dec],[2,0.28,dec*0.55],[2*2,0.1,dec*0.3]].forEach(function(q){var os=ac.createOscillator(),g=ac.createGain();os.type='sine';os.frequency.value=f*q[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*q[1],t+Math.pow(PHI,-8));g.gain.exponentialRampToValueAtTime(0.0001,t+q[2]);
      os.connect(g);g.connect(d);os.start(t);os.stop(t+q[2]+0.05);});}
  // SWEET: sparkle notes are the engine's current chord tones (+9th), two octaves above the pad, so nothing clashes; NOTES only before it starts
  function note(i){var L=window.LogoSound,q=L&&L.live&&L.live['rebella-logo'],c=q&&q.chord;
    if(c&&c.rel&&c.rel.length&&L.util){var R=c.rel.slice(0,c.rel.length-1),k=((i%R.length)+R.length)%R.length;var U=L.util;return U.hz(c.root+U.RG.pad+U.OCT+R[k]+U.OCT*Math.floor(i/R.length));}
    return NOTES[((i%NOTES.length)+NOTES.length)%NOTES.length];}
  var noise=null;
  function nbuf(ac){if(!noise||noise.sampleRate!==ac.sampleRate){var n=Math.floor(ac.sampleRate*2.2);noise=ac.createBuffer(1,n,ac.sampleRate);var c=noise.getChannelData(0);for(var i=0;i<n;i++)c[i]=Math.random()*2-1;}return noise;}
  // breathy air: white noise -> high-pass -> soft band sweep; optional wing flutter (gain wobble) and a pan glide
  function air(dur,o){return;   // SWEET (Danny 14:01 AWST): no noise hiss (wing and swish air removed)
    var out0=out();if(!out0)return;o=o||{};var ac=st.ac,t=ac.currentTime+(o.delay||0)+0.01;
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
  var SND=DIR+'logo-sound.js'+VQ,sndLoading=null;
  function music(){if(!st||!st.ac||!st.out)return;var me=st;
    function go(){if(me!==st||me.snd||!window.LogoSound)return;try{me.snd=LogoSound.create(me.ac,me.out,{logo:'rebella-logo',mood:mood(),events:{'star-drop':0.236,'shimmer':0.236},
      subscribe:['pump:page','daytime','tide','moon','ratio-pump','clock','component:theme','phi-adapt:rebella-logo']});/* rule 10: the logo listens to the page */}catch(e){}}
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
  // yaw (Danny 15:24): 0 = side-on (the original view), 30 / 60 = turned toward the viewer: body foreshortened (x 0.55 + 0.45 cos yaw), far wing
  // smaller, paler and tucked behind the body, near wing a little lower and forward, pale breast and eye more visible, far eye peeks in at 60.
  function drawBird(x,face,px,py,tilt,flap,sz,carry,a,pal,aura,yaw){var ba=a==null?1:a,yw=(yaw||0)*Math.PI/180,cy=Math.cos(yw),sy=Math.sin(yw);
    x.save();x.translate(px,py);x.rotate(tilt);x.scale(sz*face,sz);x.globalAlpha=ba;
    var back=pal?'#85A6BB':'#1F5478',deep=pal?'#1F5478':'#143A57',belly=pal?'#DCEAF2':'#C9DEEA',head=pal?'#9DBCCE':'#1F5478';
    if(aura){x.globalCompositeOperation='lighter';var g=x.createRadialGradient(0,0,0,0,0,26);g.addColorStop(0,'rgba(10,242,255,.30)');g.addColorStop(.4,'rgba(10,242,255,.10)');g.addColorStop(1,'rgba(10,242,255,0)');
      x.fillStyle=g;x.beginPath();x.arc(0,0,26,0,6.2832);x.fill();x.globalCompositeOperation='source-over';}
    var w=flap==null?0:Math.sin(flap);                                           // wing: +1 up, -1 down
    x.scale(0.55+0.45*cy,1);                                                       // turned views: foreshortened
    // far wing (behind the body; partly hidden when turned)
    x.save();x.globalAlpha=ba*(1-0.55*sy);x.translate(-1+2*sy,-2.2);x.scale(1-0.45*sy,(flap==null?0.35:-0.9*w)*(1-0.3*sy));x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(-4,-9,-11,-8.5);x.quadraticCurveTo(-6,-3,0,0);x.fillStyle=deep;x.fill();x.restore();x.globalAlpha=ba;
    // tail
    x.beginPath();x.moveTo(-6,-0.6);x.lineTo(-14.5,-3.4);x.quadraticCurveTo(-13,-0.6,-14.5,2.2);x.lineTo(-6,1.6);x.closePath();x.fillStyle=deep;x.fill();
    // body: blue back to pale belly
    var b=x.createLinearGradient(0,-5.5,0,5.5);b.addColorStop(0,back);b.addColorStop(.55,pal?'#9DBCCE':'#85A6BB');b.addColorStop(1,belly);
    x.beginPath();x.ellipse(0,0.4,8.2,5.4,-0.08,0,6.2832);x.fillStyle=b;x.fill();
    if(sy>0.01){x.globalAlpha=ba*(0.25+0.75*sy);x.beginPath();x.ellipse(3.4+0.6*sy,1.8,2.4+3*sy,2.4+1.3*sy,0.2,0,6.2832);x.fillStyle=belly;x.fill();x.globalAlpha=ba;}   // breast toward the viewer
    // head + eye + beak
    x.beginPath();x.arc(6.6,-3.2,4.1,0,6.2832);x.fillStyle=head;x.fill();
    x.beginPath();x.arc(7.4,-1.6,2.2,0,6.2832);x.fillStyle=pal?'#DCEAF2':'#9DBCCE';x.fill();             // soft cheek
    var er=1+0.3*sy,ex=8+0.6*sy;x.beginPath();x.arc(ex,-3.9,1.05*er,0,6.2832);x.fillStyle='#F4FBFF';x.fill();x.beginPath();x.arc(ex+0.3,-3.9,0.6*er,0,6.2832);x.fillStyle='#071A28';x.fill();
    if(sy>0.6){x.globalAlpha=ba*Math.min(1,(sy-0.6)*2.5);x.beginPath();x.arc(9.9,-3.6,0.62,0,6.2832);x.fillStyle='#F4FBFF';x.fill();x.beginPath();x.arc(10,-3.6,0.38,0,6.2832);x.fillStyle='#071A28';x.fill();x.globalAlpha=ba;}   // far eye
    x.beginPath();x.moveTo(10.3,-3.5);x.lineTo(13.4,-2.6);x.lineTo(10.3,-1.8);x.closePath();x.fillStyle='#E7DDBF';x.fill();
    // near wing (in front), cyan glint on its edge
    x.save();x.translate(-0.5+1.2*sy,-1.6+0.8*sy);x.scale(1,flap==null?0.4:w);x.beginPath();x.moveTo(1.5,0);x.quadraticCurveTo(-3,-10,-12,-9.5);x.quadraticCurveTo(-6.5,-2.6,1.5,0);
    x.fillStyle=back;x.fill();x.lineWidth=0.6;x.strokeStyle='rgba(10,242,255,.7)';x.stroke();x.restore();
    if(!pal){x.globalCompositeOperation='lighter';x.beginPath();x.arc(5.6,-5.4,0.9,0,6.2832);x.fillStyle='rgba(10,242,255,.55)';x.fill();x.globalCompositeOperation='source-over';}   // crown glint
    if(carry){x.save();x.translate(14.6,-2.4);x.rotate((flap||0)*0.08);x.globalCompositeOperation='lighter';star4(x,'rgba(10,242,255,.5)',4.4);star4(x,'#E9FDFF',2.7);x.restore();}
    x.restore();x.globalAlpha=1;}
  function chirp(delay,px,hi){var o=out();if(!o)return;var ac=st.ac,t=ac.currentTime+(delay||0)+0.01,d=pan(px)||o;
    [0,0.11].forEach(function(dt,i){var os=ac.createOscillator(),g=ac.createGain(),f=note((hi?2:0)+Math.floor(Math.random()*2))*2;os.type='sine';
      os.frequency.setValueAtTime(f,t+dt);os.frequency.exponentialRampToValueAtTime(f*(i?1.27:1.5),t+dt+0.06);
      g.gain.setValueAtTime(0,t+dt);g.gain.linearRampToValueAtTime(0.008,t+dt+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.085);
      os.connect(g);g.connect(d);os.start(t+dt);os.stop(t+dt+0.12);});}
  // ---- PUMPS for the birds (Danny 15:24 / 15:25): every bird pump is a child of the shared Rebella logo node (PhiPumps.logo), itself a
  // child of the page root, so scaling the page or the logo scales the birds too. Without PhiPumps: a local stub node with the same maths.
  function pnow(){return (window.performance?performance.now():Date.now())/1000;}
  function pumpParent(){try{if(window.PhiPumps&&PhiPumps.logo)return PhiPumps.logo('rebella-logo');}catch(e){}return null;}
  var pseed=40;
  function pnode(name,n,k0,depth,parent){pseed++;if(window.PhiPumps&&PhiPumps.node)return PhiPumps.node(name,n,k0,depth,parent===undefined?pumpParent():parent,pseed);
    var P=[],ph=[],sd=pseed;for(var j=0;j<n;j++){P.push(Math.pow(PHI,k0+j/2));ph.push(2*Math.PI*(((j+1+sd)*G)%1));}
    return {out:function(t){if(t==null)t=pnow();var s=0;for(var j=0;j<n;j++)s+=Math.sin(2*Math.PI*t/P[j]+ph[j]);return (parent?parent.out(t):1)*(1+depth*s/n);}};}
  // ---- VIEW PUMP (Danny 15:24): which of the side-on (0), 30 deg and 60 deg turned views a bird shows. Its own branch (child of the logo
  // node, separate from the flight motion): v = 0.5 + 0.5 x D x [sin(2 pi t/PHI^3 + a) + sin(2 pi t/PHI^4 + b)]/2, depth pump
  // D = 0.618 + 0.382 x (0.5 + 0.5 sin(2 pi t/PHI^6 + c)), times the logo node's output. Target = 0.382 v + 0.618 x turn, where turn is the
  // bird's smoothed turn rate (|d heading/dt| / 2.618 rad/s, 0..1, low-passed over 0.382 s): turning eases it toward 60 deg, straight
  // flight back toward side-on. Thresholds 1/3 and 2/3 with hysteresis 0.146 (+-0.073); it steps ONE view at a time (0 <-> 30 <-> 60),
  // holds each view at least PHI^0.5 = 1.27 s, morphs over 0.236 s, never changes while frozen (star-drop hover). Reduced motion: side-on.
  function ViewPump(){var par=pumpParent(),sd=(pseed+=3),a=2*Math.PI*((sd*G)%1),b=2*Math.PI*(((sd+1)*G)%1),c=2*Math.PI*(((sd+2)*G)%1);
    var k=0,from=0,since=-9,mt=-9,turn=0,lh=null,lt=null;
    function v(t){var D=0.618+0.382*(0.5+0.5*Math.sin(2*Math.PI*t/Math.pow(PHI,6)+c));
      return clamp01((0.5+0.5*D*(Math.sin(2*Math.PI*t/Math.pow(PHI,3)+a)+Math.sin(2*Math.PI*t/Math.pow(PHI,4)+b))/2)*(par?par.out(t):1));}
    return {update:function(t,dx,dy,frozen){
        if(Math.abs(dx)+Math.abs(dy)>0.3){var h=Math.atan2(dy,Math.abs(dx));if(lh!=null&&lt!=null&&t>lt){var dh=Math.abs(h-lh),r=clamp01(dh/(t-lt)/2.618);turn+=(r-turn)*Math.min(1,(t-lt)/0.382);}lh=h;lt=t;}
        else{turn*=0.95;lt=t;}
        if(!RM.matches&&!frozen&&t-since>=1.272){var x=0.382*v(t)+0.618*turn,up=[1/3+0.073,2/3+0.073],dn=[1/3-0.073,2/3-0.073];
          if(k<2&&x>up[k]){from=k;k++;since=t;mt=t;}else if(k>0&&x<dn[k-1]){from=k;k--;since=t;mt=t;}}
        if(RM.matches)k=0;
        var f=clamp01((t-mt)/0.236);f=f*f*(3-2*f);return (from+(k-from)*f)*30;},
      view:function(){return k*30;}};}
  function clamp01(x){return x<0?0:x>1?1:x;}
  function REF(){return window.BirdRef||{wagtail:{budget:{perch:0.54,preen:0.15,hop:0.12,sally:0.104,fly:0.086},wagHz:3,wagSwingDeg:35,dawnHour:6,duskHour:18.5,middayHour:12.5,wagDawnDuskBoost:0.382,flashMiddayBoost:0.382,sally:{twistsPerSally:2},wingbeatHz:8.54},
    bluebird:{perchDrop:0.795,irregularWingbeat:0.146,wingbeatHz:9.72}};}
  function loadRef(){if(window.BirdRef||document.getElementById('rbz-birdref'))return;var s=document.createElement('script');s.id='rbz-birdref';s.src=DIR+'bird-ref-data.js'+VQ;s.async=true;document.head.appendChild(s);}
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
    // reference data (js/bird-ref-data.js, Pinkowski 1977 etc.), each value x its own pump (children of a 'bluebird' node under the logo node):
    // ~79.5% of the time it comes in as a perch-then-drop arc (high, then dropping onto the letter), otherwise a low level approach.
    var R=REF().bluebird,bbN=pnode('bluebird',5,2,0.146),dropN=pnode('bb-drop',2,1,0.146,bbN),beatN=pnode('bb-beat',2,1,0.146,bbN),vp=ViewPump(),yaw=0,yawDx=0,yawDy=0;
    var drop=Math.random()<clamp01(R.perchDrop*dropN.out());
    var IN=[[side<0?-60:W+60,Math.max(24,fr.top-orr.top-fh*0.2)],[T[0]+side*fw*0.18,T[1]+fh*0.55],drop?[T[0]-side*fw*0.1,T[1]-fh*0.75]:[T[0]-side*fw*0.3,T[1]-fh*0.12],H0];
    // wingbeats: Pennycuick estimate (ESTIMATED, ~9.7 Hz) x PHI^-1 (Danny's slowed flight) x pump, each beat +-irregularWingbeat (fast but irregular)
    var bph=0,bfr=R.wingbeatHz/PHI,lastNow=performance.now();
    function beatPh(now){var d=(now-lastNow)/1000;lastNow=now;var o=Math.floor(bph);bph+=d*bfr;if(Math.floor(bph)!==o)bfr=R.wingbeatHz/PHI*beatN.out()*(1+(Math.random()*2-1)*R.irregularWingbeat);var f=bph%1;return f<0.72?f*6.2832/0.72:null;}
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
        if(k<DIN){var q=eio(k/DIN),p=bez(IN,q);fx=p[0];fy=p[1];ph=beatPh(now);}            // wingbeats with short glides
        else if(k<DIN+DT){var h=(k-DIN)/DT;fx=H0[0]+Math.sin(h*Math.PI*2)*2*sz;fy=H0[1]+Math.sin(h*Math.PI)*7*sz;ph=k/1000*6.2832*9;if(h>0.5)carry=false;if(h>=0.5&&!burst)give();}
        else if(k<DIN+DT+DOUT){var o=(k-DIN-DT)/DOUT,p2=bez(OUT,o*o*(1.6-0.6*o));fx=p2[0];fy=p2[1];carry=false;ph=beatPh(now);}
        if(fx!==null){fy+=Math.sin(k/1000*6.2832/1.618)*2.2*sz;                                                          // gentle bob, PHI^1 s
          var vx=fx-lx;yaw=vp.update(now/1000,vx,fy-ly,k>=DIN&&k<DIN+DT);if(Math.abs(vx)>0.25)face=vx>0?1:-1;tilt=Math.max(-0.35,Math.min(0.35,(fy-ly)*0.05));if(Math.random()<0.6)spawn(fx-vx*0.5,fy+3*sz,1,10,1,0);lx=fx;ly=fy;}}
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
      if(fx!==null)drawBird(x,face,fx,fy,tilt,ph,sz,carry,1,0,true,yaw);
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
  // ---- 9 WILLIE WAGTAIL (Danny 15:25: Rhipidura leucophrys, 'jidi jidi'; original drawing, same canvas style). Glossy black upperparts and
  // head (#0B0F14 with a faint #1F5478 / #0AF2FF sheen), white belly, small white eyebrow, long fan tail. Local units, feet at the origin.
  // wag -1..1 = tail swung side to side in the HORIZONTAL plane (seen side-on: the tail foreshortens and turns slightly); fan 0..1 spread;
  // preen 0..1 head down to the breast; flash 0..1 wing flicked open; flap = wing phase in flight (null = folded); yaw as the bluebird.
  function drawWag(x,face,px,py,tilt,flap,sz,a,yaw,wag,fan,preen,flash){var ba=a==null?1:a,yw=(yaw||0)*Math.PI/180,cy=Math.cos(yw),sy=Math.sin(yw);
    x.save();x.translate(px,py);x.rotate(tilt);x.scale(sz*face,sz);x.globalAlpha=ba;x.scale(0.55+0.45*cy,1);
    var blk='#0B0F14',wht='#F4F8FA',w=flap==null?0:Math.sin(flap),perched=flap==null;
    x.globalCompositeOperation='lighter';var au=x.createRadialGradient(0,-7,0,0,-7,20);au.addColorStop(0,'rgba(157,188,206,.16)');au.addColorStop(1,'rgba(157,188,206,0)');x.fillStyle=au;x.beginPath();x.arc(0,-7,20,0,6.2832);x.fill();x.globalCompositeOperation='source-over';   // faint rim light so black reads on black
    if(perched){x.strokeStyle='#2A3540';x.lineWidth=0.7;x.beginPath();x.moveTo(-0.6,-2.6);x.lineTo(-1,0);x.moveTo(1.2,-2.6);x.lineTo(1,0);x.stroke();}
    // far wing
    x.save();x.globalAlpha=ba*(1-0.55*sy);x.translate(-1+2*sy,-7.5);x.scale(1-0.45*sy,perched?0.3+0.7*flash:(-0.9*w)*(1-0.3*sy));x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(-4,-8,-10,-7.5);x.quadraticCurveTo(-5.5,-2.5,0,0);x.fillStyle='#141B22';x.fill();x.restore();x.globalAlpha=ba;
    // long fan tail from the rump, cocked up a little; horizontal wag = foreshortening + a slight turn
    var sw=wag*0.61,L=(13.5+2*fan)*Math.abs(Math.cos(sw))*(1-0.25*sy)+2,spread=0.18+0.34*fan;
    x.save();x.translate(-5.5,-6.8);x.rotate(Math.PI+0.32+sw*0.25);x.beginPath();x.moveTo(0,-1.1);x.lineTo(L*Math.cos(-spread),L*Math.sin(-spread));
    x.quadraticCurveTo(L*1.06,0,L*Math.cos(spread),L*Math.sin(spread));x.lineTo(0,1.1);x.closePath();x.fillStyle=blk;x.fill();
    if(fan>0.3){x.strokeStyle='rgba(244,248,250,'+(0.5*(fan-0.3)).toFixed(3)+')';x.lineWidth=0.5;x.beginPath();x.moveTo(L*0.6*Math.cos(spread),L*0.6*Math.sin(spread));x.lineTo(L*Math.cos(spread),L*Math.sin(spread));x.stroke();}
    x.restore();
    // body: black back, white belly
    x.beginPath();x.ellipse(0,-6.2,6.8,4.4,-0.12,0,6.2832);x.fillStyle=blk;x.fill();
    x.save();x.beginPath();x.ellipse(0,-6.2,6.8,4.4,-0.12,0,6.2832);x.clip();x.beginPath();x.ellipse(1.4+0.6*sy,-3.4,6.4,3.6+1.2*sy,-0.12,0,6.2832);x.fillStyle=wht;x.fill();x.restore();
    x.globalCompositeOperation='lighter';x.beginPath();x.ellipse(-0.5,-9.4,4.6,0.9,-0.15,0,6.2832);x.fillStyle='rgba(31,84,120,.55)';x.fill();x.globalCompositeOperation='source-over';   // glossy sheen
    // head (preen: down toward the breast)
    x.save();x.translate(4.8,-9.6+3.2*preen);x.rotate(0.9*preen);
    x.beginPath();x.arc(0,0,3.5,0,6.2832);x.fillStyle=blk;x.fill();
    var er=1+0.3*sy,ex=1.4+0.5*sy;
    x.strokeStyle=wht;x.lineWidth=0.75;x.beginPath();x.arc(ex,-0.2,1.7,-2.6,-0.9);x.stroke();                                           // white eyebrow
    x.beginPath();x.arc(ex,0.2,0.8*er,0,6.2832);x.fillStyle='#000';x.fill();x.beginPath();x.arc(ex+0.3,-0.1,0.25,0,6.2832);x.fillStyle='rgba(10,242,255,.8)';x.fill();
    if(sy>0.6){x.globalAlpha=ba*Math.min(1,(sy-0.6)*2.5);x.strokeStyle=wht;x.lineWidth=0.5;x.beginPath();x.arc(3,-0.3,1,-2.4,-1.1);x.stroke();x.globalAlpha=ba;}
    x.beginPath();x.moveTo(3.2,-0.6);x.lineTo(5.6,0.1);x.lineTo(3.2,0.7);x.closePath();x.fillStyle='#1A1F24';x.fill();x.restore();
    // near wing (folded, flicked open in a wing-flash, or beating in flight); cyan glint on the edge
    x.save();x.translate(-0.5+1.2*sy,-7+0.8*sy);x.scale(1,perched?0.35+0.65*flash:w);x.beginPath();x.moveTo(1.5,0);x.quadraticCurveTo(-3,-9,-11,-8.5);x.quadraticCurveTo(-6,-2.4,1.5,0);
    x.fillStyle='#10161C';x.fill();x.lineWidth=0.5;x.strokeStyle='rgba(10,242,255,.45)';x.stroke();x.restore();
    x.restore();x.globalAlpha=1;}
  // Behaviour (all from js/bird-ref-data.js, each value x its own pump under a 'wagtail' node, child of the logo node; depth <= 0.146):
  // arrives PHI^1 s after the bluebird with a short jerky flight, lands on top of a letter about 0.236 of the way along the word (away from the
  // bluebird's 0.618), then a state machine picks each next state with the Stevens (2002) time-budget weights: PERCH 54% (still, tail wagging
  // hard right after alighting then easing off), PREEN 15% (head down to the breast), HOP 12% (a hop or two along the letter, wagging on
  // landing), HAWK SALLY 10.4% (a short jerky loop up off the letter with sudden twists to snap an insect, then back) and FLY 8.6% (leaves).
  // State lengths: PHI^1..PHI^2 s (perch), PHI^1.5 s (preen), PHI^0.5 s per hop, PHI^0.5..PHI^1 s (sally). It always leaves by PHI^5 s.
  // Tail: side-to-side wag at wagHz (ESTIMATED 3 Hz) x pump x (1 + 0.382 x dawn/dusk bump), with fanning bursts; wing-flashes on a
  // pumped rate that peaks around midday (Webb-Pullman & Elgar 1998). Wingbeat in flight: Pennycuick estimate 8.5 Hz x PHI^-1 x pump.
  // Views: its own ViewPump (turning in sallies eases it toward 60 deg). Reduced motion: a still wagtail perched on the letter, no motion.
  function bump(h,c,wd){var d=Math.abs(h-c);d=Math.min(d,24-d);return d>wd?0:0.5+0.5*Math.cos(Math.PI*d/wd);}
  function wagtail(){if(!st||st.wag)return;var me=st;st.wag={cv:null,raf:0};later(function(){if(me===st)wagGo(me);},382+1618);}
  function wagGo(me){var ov=st.fig.parentNode;if(!ov)return;var R=REF().wagtail,rm=RM.matches;
    var cv=document.createElement('canvas');cv.className='rbz-bird rbz-wag';cv.setAttribute('aria-hidden','true');ov.appendChild(cv);st.wag.cv=cv;
    var W=ov.clientWidth||innerWidth,H=ov.clientHeight||innerHeight,dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    var x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
    var fr=st.fig.getBoundingClientRect(),orr=ov.getBoundingClientRect(),T;
    if(st.cols&&st.cols.length){var col=st.cols[Math.floor(st.cols.length*0.236)],u=toFig(col[0],col[1]);T=[fr.left-orr.left+st.fig.clientLeft+u[0],fr.top-orr.top+st.fig.clientTop+u[1]+1];}
    else T=[fr.left-orr.left+fr.width*0.3,fr.top-orr.top+fr.height*0.3];
    var sz=1.15*Math.max(1,Math.min(1.8,fr.width/480)),face=Math.random()<0.5?1:-1,hr=new Date().getHours()+new Date().getMinutes()/60;
    var wN=pnode('wagtail',5,2,0.146),pw={};Object.keys(R.budget).forEach(function(k){pw[k]=pnode('wag-'+k,2,1,0.146,wN);});
    var rateN=pnode('wag-rate',2,1,0.146,wN),flashN=pnode('wag-flash',2,1,0.146,wN),beatN=pnode('wag-beat',2,1,0.146,wN),vp=ViewPump();
    var dd=Math.max(bump(hr,R.dawnHour,3),bump(hr,R.duskHour,3)),mid=bump(hr,R.middayHour,4);
    var wagHz=R.wagHz*(1+R.wagDawnDuskBoost*dd),flashPerS=0.12*(1+R.flashMiddayBoost*mid);                  // flash base rate ESTIMATED
    if(rm){x.clearRect(0,0,W,H);drawWag(x,face,T[0],T[1],0,null,sz,1,0,0,0.2,0,0);return;}
    var side=Math.random()<0.5?-1:1,start=[side<0?-50:W+50,Math.max(20,T[1]-H*0.25)],t0=performance.now(),pos=start.slice(),perch=T.slice();
    var state='in',sT=0,sDur=2618,path=null,wagAmp=0,fan=0,preen=0,flash=0,flashT=-1,bph=0,last=t0,lx=pos[0],ly=pos[1],yaw=0;
    function pick(){var tot=0,k,w={};for(k in R.budget){w[k]=R.budget[k]*pw[k].out();tot+=w[k];}var r=Math.random()*tot;for(k in w){r-=w[k];if(r<=0)return k;}return 'perch';}
    function jerky(a,b,dur,twists){var pts=[a];for(var i=1;i<=twists+1;i++){var f=i/(twists+2);pts.push([a[0]+(b[0]-a[0])*f+(Math.random()-0.5)*60*sz,a[1]+(b[1]-a[1])*f-(Math.random()*40+10)*sz]);}pts.push(b);return {pts:pts,dur:dur};}
    function along(p,f){f=clamp01(f);var n=p.pts.length-1,i=Math.min(n-1,Math.floor(f*n)),g=f*n-i;g=g*g*(3-2*g);return [p.pts[i][0]+(p.pts[i+1][0]-p.pts[i][0])*g,p.pts[i][1]+(p.pts[i+1][1]-p.pts[i][1])*g];}   // jerky: eased per segment
    function go(s,now){state=s;sT=now;
      if(s==='perch'){sDur=1000*Math.pow(PHI,1+Math.random());wagAmp=1;}
      else if(s==='preen')sDur=1000*Math.pow(PHI,1.5);
      else if(s==='hop'){sDur=1272;var nx=Math.max(-1,Math.min(1,(Math.random()-0.5)*2));perch=[T[0]+nx*14*sz,T[1]];path={pts:[pos.slice(),[(pos[0]+perch[0])/2,pos[1]-7*sz],perch.slice()],dur:sDur};}
      else if(s==='sally'){sDur=1000*Math.pow(PHI,0.5+Math.random()*0.5);var top=[perch[0]+(Math.random()-0.5)*80*sz,perch[1]-(40+Math.random()*40)*sz];
        path={pts:[perch.slice(),[top[0]-20*sz,top[1]+15*sz],top,[top[0]+25*sz,top[1]+5*sz],perch.slice()],dur:sDur};}
      else if(s==='fly'){sDur=1618;var end=[side<0?W+60:-60,Math.max(-40,T[1]-H*0.3)];path=jerky(pos.slice(),end,sDur,R.sally.twistsPerSally||2);}}
    path=jerky(start,T,2618,2);
    function frame(now){if(me!==st)return;var dt=Math.min(0.05,(now-last)/1000),e=now-t0,k=now-sT,f=Math.min(1,k/sDur),flap=null,tilt=0;last=now;
      if(state==='in'||state==='hop'||state==='sally'||state==='fly'){pos=along(path,state==='in'?Math.min(1,e/2618):f);
        if(state!=='hop'){bph+=dt*R.wingbeatHz/PHI*beatN.out();var q=bph%1;flap=q<0.75?q*6.2832/0.75:null;}
        if(state==='in'&&e>=2618){pos=T.slice();go('perch',now);}
        else if(state!=='in'&&f>=1){if(state==='fly'){endWag(me);return;}pos=perch.slice();go(state==='hop'?'perch':'perch',now);wagAmp=1;}}
      else if(f>=1){go(e>1000*Math.pow(PHI,5)?'fly':pick(),now);}
      // tail: wag hardest just after alighting, easing off; fanning bursts; preen; wing-flash
      wagAmp+=((state==='perch'?0.35:state==='preen'?0:0.2)-wagAmp)*dt*0.618;
      var wag=Math.sin(e/1000*2*Math.PI*wagHz*rateN.out())*wagAmp;fan+=(((Math.sin(e/1000*2*Math.PI/PHI/PHI)>0.6||state==='sally')?1:0.15)-fan)*dt*3;
      preen+=((state==='preen'?(0.6+0.4*Math.sin(k/1000*2*Math.PI/1.618)):0)-preen)*dt*4;
      if(state==='perch'&&flashT<0&&Math.random()<flashPerS*flashN.out()*dt)flashT=now;
      if(flashT>=0){var ft=(now-flashT)/382;flash=ft<1?Math.sin(Math.PI*ft):0;if(ft>=1)flashT=-1;}else flash=0;
      var dx=pos[0]-lx,dy=pos[1]-ly;if(Math.abs(dx)>0.3)face=dx>0?1:-1;yaw=vp.update(now/1000,dx,dy,false);lx=pos[0];ly=pos[1];
      if(flap!==null)tilt=Math.max(-0.4,Math.min(0.4,dy*0.06));
      x.clearRect(0,0,W,H);drawWag(x,face,pos[0],pos[1],tilt,flap,sz,1,yaw,wag,fan,preen,flash);
      me.wag.raf=requestAnimationFrame(frame);}
    me.wag.raf=requestAnimationFrame(frame);}
  function endWag(s){if(!s||!s.wag)return;try{cancelAnimationFrame(s.wag.raf);}catch(e){}if(s.wag.cv&&s.wag.cv.parentNode)s.wag.cv.parentNode.removeChild(s.wag.cv);s.wag.raf=0;}
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
    st={fig:fig,art:fig.querySelector('.dmz-art'),ac:ac||null,timers:[],anims:[],stars:[],cols:null,sheen:null,out:null,snd:null,bird:null,wag:null,sky:null,layers:[]};
    dawn();companions();
    if(st.ac){try{st.out=st.ac.createGain();st.out.gain.value=1;st.out.connect(st.ac.destination);}catch(e){st.out=null;}}
    music();
    var bg=document.createElement('canvas');bg.className='rbz-bg';bg.setAttribute('aria-hidden','true');fig.insertBefore(bg,fig.firstChild);
    var wall=document.createElement('div');wall.className='rbz-wall';wall.setAttribute('aria-hidden','true');fig.insertBefore(wall,st.art);
    var fx=document.createElement('div');fx.className='rbz-fx';fx.setAttribute('aria-hidden','true');fig.appendChild(fx);
    requestAnimationFrame(function(){if(st&&st.fig===fig)bgStars(bg);});
    var glowUse=svg.querySelector('use[filter]'),motion=!RM.matches;
    if(motion){var B=P(5);if(glowUse)anim(glowUse,[{opacity:.72},{opacity:1},{opacity:.72}],{duration:B,iterations:Infinity,easing:'ease-in-out'});
      anim(wall,[{opacity:.3},{opacity:.95},{opacity:.3}],{duration:B,delay:P(-1),iterations:Infinity,easing:'ease-in-out',fill:'backwards'});}
    var href=(use.getAttribute('href')||'').split('#')[0],fst=st;
    loadRef();later(function(){if(st===fst&&!st.bird)bird();if(st===fst)wagtail();},300);   // bluebird: once per open (waits up to 0.3 s for the letter tops, then flies anyway)
    pathD(href).then(function(d){if(!st||st.fig!==fig||!d)return;
      var defs=document.createElementNS(NS,'defs');
      defs.innerHTML='<clipPath id="rbz-clip"><path clip-rule="evenodd" d="'+d+'"/></clipPath>'+
        '<linearGradient id="rbz-sheen-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#FFF4F8" stop-opacity=".62"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      try{st.cols=edges(d);}catch(e){st.cols=null;}
      if(!st.bird)bird();if(!st.wag)wagtail();
      if(motion){var g=document.createElementNS(NS,'g');g.setAttribute('clip-path','url(#rbz-clip)');g.setAttribute('aria-hidden','true');
        var r=document.createElementNS(NS,'rect');r.setAttribute('x',VB[0]-560);r.setAttribute('y',VB[1]-200);r.setAttribute('width',300);r.setAttribute('height',VB[3]+400);
        r.setAttribute('fill','url(#rbz-sheen-g)');r.setAttribute('transform','translate(0 0)');g.appendChild(r);
        var wrap=document.createElementNS(NS,'g');wrap.setAttribute('transform','skewX(-16)');wrap.appendChild(r);g.appendChild(wrap);svg.appendChild(g);st.sheen=r;
        later(shimmer,P(0));
        for(var k=1;k<=6;k++){var s=document.createElement('span');s.className='rbz-star';fx.appendChild(s);st.stars.push(s);
          (function(k){later(function(){twinkle(k);},P(1.5+k/2)*((k*G)%1));})(k);}}
    }).catch(function(){});}
  function stop(){if(!st)return;var s=st;st=null;endBird(s);endWag(s);if(s.snd){try{s.snd.stop();}catch(e){}}if(s.sky){s.sky.stop();var sc=s.sky.cv;}
    s.layers.forEach(function(l){l.classList.remove('on');});setTimeout(function(){s.layers.forEach(function(l){if(l.parentNode)l.parentNode.removeChild(l);});if(sc&&sc.parentNode)sc.parentNode.removeChild(sc);},400);
    s.timers.forEach(clearTimeout);s.anims.forEach(function(a){try{a.cancel();}catch(e){}});
    if(s.out){try{var t=s.ac.currentTime;s.out.gain.cancelScheduledValues(t);s.out.gain.setValueAtTime(s.out.gain.value,t);s.out.gain.linearRampToValueAtTime(0,t+0.08);
      setTimeout(function(){try{s.out.disconnect();}catch(e){}},150);}catch(e){}}}
  window.RebellaZoomLife={start:start,stop:stop,running:function(){return !!st;}};
})();
