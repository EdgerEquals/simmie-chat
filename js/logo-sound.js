/* LOGO SOUND ENGINE v1: the default sound for every logo (Danny t746u 14:5x AWST 25 Oct 2026; spec /home/box/.config/logo-sound-motion-spec.md,
   free-wheel rule = adaptive-phi-principle.md rule 6). Reusable: nothing in here knows about Rebella. Only the questionnaire's Rebella zoom
   uses it for now (js/rebella-zoom-life.js); do not add it to other pages or logos until Danny says so.
   SOUND: synthesised AND organic at once, gliding continuously between two boundaries with one macro position m in 0..1:
     m = 0  TRAP: tight 808 sub, hat triplet rolls, crisp saw/square plucks, dry and close.
     m = 1  ETHEREAL-ORGANIC: airy pad and breath noise, wood/glass/kalimba plucks (a 4 ms filtered noise burst into resonant band-passes),
            faint synthesised birdsong chirps, wide shimmering reverb.
   BLEND WAVE: w(t) = [sin(2 pi t / PHI^10) + sin(2 pi t / PHI^9 + 1)] / 2 -> m = (w + 1) / 2 (periods 122.99 s and 76.01 s, so one sweep is
     roughly 1.6-2 min and it never exactly repeats; t = wall-clock seconds, so it carries on across opens). NUDGES (logo hooks): an event
     such as 'star-drop' or 'shimmer' adds +0.236 to m, fading as (1 - t/PHI^2)^2 over PHI^2 = 2.618 s; nudges add up; m is clamped 0..1.
   GRID: step PHI^-3 = 0.236 s; swing on odd steps (straight -> 1:PHI long:short); phrases of 8, 13, 21 steps (Fibonacci), cycling.
   LADDER (free-wheel, spec order; e = entry threshold on m, gaps x1.618, shimmer slot at 0.618):
     stage  parameter (y = stage output 0..1)                        e       glide tau = PHI^(i-1) x 0.236 s
      1     blend: synth gain (1-y), organic gain y                    0       0.236 s
      2     rhythm density: hats per step .92 -> .14, triplet-roll
            chance .38 -> 0 (x(1-y)^2), pluck chance .50 -> .22        .0136   0.382 s
      3     low end: 808 level 1 -> .03, 808 decay .62 -> .24 s        .0357   0.618 s
      4     filter: pluck cutoff 1.2 -> 5.2 kHz, Q 8 -> .7, attack
            2 -> 25 ms, decay .18 -> .9 s (tight/punchy -> soft/airy) .0713   1.000 s
      5     swing: odd steps late, long:short = 1 : 1 -> PHI : 1       .1290   1.618 s
      6     pitch colour: Aeolian -> Dorian -> Lydian -> major
            pentatonic (E root), each note picks between the two
            neighbouring modes with probability = the fraction       .2225   2.618 s
      7     reverb & space: send .04 -> .5, short (PHI^-1 s) -> long
            (PHI^2 s, stereo, decorrelated) generated impulse          .3736   4.236 s
      8     shimmer = 0.618 x u^PHI (0 at trap, 0.618 at organic; the
            curve itself, never gated): octave-up glass partials into
            the long reverb, birdsong chance, pad air                  slot .618 6.854 s
   COUPLING: stage 1 is driven by m; stage i+1 by u = (y_i + m)/2 + 0.236 x tau_i x v_i (its output plus m plus a little of its velocity:
     energy passes up the ladder). Target_i = smoothstep((u - e_i')/(1 - e_i')) with e_i' = e_i - 0.0136 x f_i, where f_i glides to 1 while
     u falls and back to 0 while it rises (soft release hysteresis 0.0136). Each stage is a lightly damped spring (zeta = PHI^-0.5 = 0.786,
     omega = 1/tau), integrated in 4 sub-steps every grid step, so every stage keeps moving every 0.236 s and nothing freezes or gates.
     Stages 1-5 re-read their targets every step; stages 6-8 at phrase boundaries (only the target timing is quantised, never the glide).
   COST: one look-ahead scheduler (setTimeout ~100 ms, 0.3 s ahead), a few short-lived nodes per step, two always-on pad oscillators, one
     breath-noise loop, two convolvers. Quiet (engine gain 0.5 into the logo's own output). Hidden tab: no catch-up burst.
   API: LogoSound.create(audioContext, destinationNode, {root, events:{name:nudge}, gain}) -> engine
        engine.event(name) (logo hooks: default 'star-drop' and 'shimmer' = +0.236), engine.nudge(x), engine.state(), engine.stop(). */
(function(){
  'use strict';
  var PHI=1.6180339887,STEP=0.2360679775,E=[0,0.0136,0.0357,0.0713,0.1290,0.2225,0.3736,0.618],HYS=0.0136,ZETA=Math.pow(PHI,-0.5),PHR=[8,13,21],
      MODES=[[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,6,7,9,11],[0,2,4,7,9]];
  var irCache={};
  function lerp(a,b,t){return a+(b-a)*t;}
  function clamp(x){return x<0?0:x>1?1:x;}
  function sstep(x){x=clamp(x);return x*x*(3-2*x);}
  function wave(t){var w=(Math.sin(2*Math.PI*t/Math.pow(PHI,10))+Math.sin(2*Math.PI*t/Math.pow(PHI,9)+1))/2;return (w+1)/2;}
  function ir(ac,len,bright){var k=ac.sampleRate+':'+len;if(irCache[k])return irCache[k];var n=Math.floor(ac.sampleRate*len),b=ac.createBuffer(2,n,ac.sampleRate);
    for(var c=0;c<2;c++){var d=b.getChannelData(c),lp=0;for(var i=0;i<n;i++){var r=Math.random()*2-1;lp=bright?r:lp+0.35*(r-lp);d[i]=(bright?r-0.5*lp:lp)*Math.pow(1-i/n,2.618)*(i<64?i/64:1);}}
    return irCache[k]=b;}
  function create(ac,dest,o){o=o||{};var root=o.root||41.2034,ev=o.events||{'star-drop':0.236,'shimmer':0.236},alive=true;   // E1
    var out=ac.createGain();out.gain.value=0;out.connect(dest);out.gain.setTargetAtTime(o.gain||0.5,ac.currentTime,0.618);
    var dry=ac.createGain();dry.connect(out);
    var sendS=ac.createGain(),sendL=ac.createGain(),cvS=ac.createConvolver(),cvL=ac.createConvolver();cvS.buffer=ir(ac,0.618,false);cvL.buffer=ir(ac,2.618,true);
    sendS.connect(cvS);sendL.connect(cvL);cvS.connect(out);cvL.connect(out);sendS.gain.value=0.03;sendL.gain.value=0.0;
    var bus=ac.createGain();bus.connect(dry);bus.connect(sendS);bus.connect(sendL);
    var shim=ac.createGain();shim.gain.value=0;shim.connect(sendL);                 // stage 8: glass partials straight into the long space
    // noise (hats, plucks, breath)
    var nb=ac.createBuffer(1,Math.floor(ac.sampleRate*1.618),ac.sampleRate),nd=nb.getChannelData(0);for(var i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    // pad + breath (organic boundary): always on, level follows the ladder
    var pad=ac.createGain(),plp=ac.createBiquadFilter();pad.gain.value=0;plp.type='lowpass';plp.frequency.value=1800;plp.Q.value=0.5;plp.connect(pad);pad.connect(bus);
    var po=[0,1].map(function(k){var x=ac.createOscillator();x.type='triangle';x.frequency.value=root*8*(k?1.4983:1);x.detune.value=k?5:-5;x.connect(plp);x.start();return x;});
    var br=ac.createBufferSource(),bbp=ac.createBiquadFilter(),bg=ac.createGain();br.buffer=nb;br.loop=true;bbp.type='bandpass';bbp.frequency.value=2600;bbp.Q.value=0.7;bg.gain.value=0;
    br.connect(bbp);bbp.connect(bg);bg.connect(bus);br.start();
    // ladder state
    var y=[0,0,0,0,0,0,0,0],v=[0,0,0,0,0,0,0,0],tg=[0,0,0,0,0,0,0,0],fall=[0,0,0,0,0,0,0,0],lu=[0,0,0,0,0,0,0,0],nudges=[],first=true;
    function mNow(){var t=Date.now()/1000,n=0;nudges=nudges.filter(function(q){var a=(t-q.t)/2.618;if(a>=1)return false;n+=q.a*(1-a)*(1-a);return true;});return clamp(wave(t)+n);}
    function ladder(m,phrase){for(var i=0;i<8;i++){var tau=STEP*Math.pow(PHI,i),w=1/tau;
        var u=i?clamp((y[i-1]+m)/2+0.236*tau*v[i-1]):m;
        var d=u-lu[i];lu[i]=u;fall[i]+=((d<0?1:d>0?0:fall[i])-fall[i])*0.382;                   // soft release hysteresis
        if(i<5||phrase||first){var e=Math.max(0,E[i]-HYS*fall[i]);tg[i]=i===7?0.618*Math.pow(u,PHI):sstep((u-e)/(1-e));}
        if(first){y[i]=tg[i];v[i]=0;continue;}
        for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(tg[i]-y[i])-2*ZETA*w*v[i];v[i]+=a*h;y[i]+=v[i]*h;}}
      first=false;}
    // voices
    function env(g,t,pk,at,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+at);g.gain.exponentialRampToValueAtTime(0.0001,t+at+dec);}
    function hat(t,lvl){var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;f.type='highpass';f.frequency.value=7200;env(g,t,lvl,0.001,0.028);
      s.connect(f);f.connect(g);g.connect(bus);s.start(t,Math.random());s.stop(t+0.06);}
    function sub(t,lvl,dec){var x=ac.createOscillator(),x2=ac.createOscillator(),g=ac.createGain(),g2=ac.createGain();x.frequency.setValueAtTime(root*2.5,t);x.frequency.exponentialRampToValueAtTime(root,t+0.045);
      x2.frequency.setValueAtTime(root*5,t);x2.frequency.exponentialRampToValueAtTime(root*2,t+0.045);env(g,t,lvl,0.003,dec);env(g2,t,lvl*0.35,0.003,dec*0.6);   // 2nd harmonic so phones hear it
      x.connect(g);x2.connect(g2);g.connect(dry);g2.connect(dry);x.start(t);x2.start(t);x.stop(t+dec+0.05);x2.stop(t+dec+0.05);}
    function synthPluck(t,f,lvl,P){var x=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();x.type=Math.random()<0.5?'sawtooth':'square';x.frequency.value=f;
      lp.type='lowpass';lp.Q.value=P.q;lp.frequency.setValueAtTime(P.cut*1.6,t);lp.frequency.exponentialRampToValueAtTime(P.cut*0.5,t+P.dec);env(g,t,lvl,P.at,P.dec);
      x.connect(lp);lp.connect(g);g.connect(bus);x.start(t);x.stop(t+P.at+P.dec+0.05);}
    function woodPluck(t,f,lvl,P,sh){var s=ac.createBufferSource(),g0=ac.createGain();s.buffer=nb;env(g0,t,1,0.0008,0.004);s.connect(g0);
      [[1,1,40],[2.76,0.35,60],[5.4,0.12,80]].forEach(function(q){var bp=ac.createBiquadFilter(),g=ac.createGain();bp.type='bandpass';bp.frequency.value=f*q[0];bp.Q.value=q[2];
        g.gain.value=lvl*q[1]*22;g0.connect(bp);bp.connect(g);g.connect(bus);if(sh&&q[0]>1)g.connect(shim);});
      s.start(t,Math.random());s.stop(t+0.02);}
    function chirp(t,lvl){[0,0.09,0.2].forEach(function(dt,i){if(i===2&&Math.random()<0.5)return;var x=ac.createOscillator(),g=ac.createGain(),f=(3000+Math.random()*900);
      x.frequency.setValueAtTime(f,t+dt);x.frequency.exponentialRampToValueAtTime(f*(i%2?1.27:1.5),t+dt+0.055);env(g,t+dt,lvl,0.006,0.07);x.connect(g);g.connect(sendL);g.connect(dry);x.start(t+dt);x.stop(t+dt+0.1);});}
    function noteF(oct,deg,colour){var p=colour*3,lo=Math.floor(Math.min(2.999,p)),md=MODES[Math.random()<p-lo?lo+1:lo],k=((deg%md.length)+md.length)%md.length,o2=Math.floor(deg/md.length);
      return root*Math.pow(2,oct+o2+md[k]/12);}
    // scheduler
    var step=0,pIdx=0,pLen=PHR[0],pPos=0,next=ac.currentTime+0.05,timer=0,deg=0;
    function tick(){if(!alive)return;if(next<ac.currentTime)next=ac.currentTime+0.05;           // hidden tab / suspend: no catch-up burst
      while(next<ac.currentTime+0.3){play(next);next+=STEP;}timer=setTimeout(tick,100);}
    function play(T){var phrase=pPos===0;ladder(mNow(),phrase);
      var b=y[0],d=y[1],lo=y[2],fl=y[3],sw=y[4],col=y[5],sp=y[6],sh=y[7];
      var r=1+(PHI-1)*sw,t=T+(step%2?(2*STEP*r/(1+r)-STEP):0),now=T;
      // continuous levels, glided (no clicks)
      sendS.gain.setTargetAtTime(lerp(0.04,0.5,sp)*(1-sp),now,0.236);sendL.gain.setTargetAtTime(lerp(0.04,0.5,sp)*sp,now,0.236);
      shim.gain.setTargetAtTime(sh*0.9,now,0.236);pad.gain.setTargetAtTime(0.022*b,now,0.382);bg.gain.setTargetAtTime(0.006*b+0.008*sh,now,0.382);
      plp.frequency.setTargetAtTime(lerp(900,3400,fl),now,0.382);
      if(phrase){var ch=[0,3,4,5][pIdx%4];po[0].frequency.setTargetAtTime(noteF(2,ch,col),now,0.618);po[1].frequency.setTargetAtTime(noteF(2,ch+2,col),now,0.618);}
      var P={cut:lerp(1200,5200,fl),q:lerp(8,0.7,fl),at:lerp(0.002,0.025,fl),dec:lerp(0.18,0.9,fl)};
      // rhythm (trap end busy, organic end sparse)
      if(Math.random()<lerp(0.92,0.14,d)){var roll=Math.random()<0.38*(1-d)*(1-d);
        if(roll){for(var k=0;k<3;k++)hat(t+k*STEP/3,0.02*(1-0.2*k));}else hat(t,0.018*(1-0.5*b));}
      var pos=pPos%8;if(pos===0||pos===3||(pos===6&&Math.random()<0.5))sub(t,0.22*lerp(1,0.03,lo),lerp(0.62,0.24,lo));
      if(Math.random()<lerp(0.5,0.22,d)){deg+=[-2,-1,1,2,0,3][Math.floor(Math.random()*6)];deg=Math.max(-3,Math.min(9,deg));
        var oct=b>0.5?3:2;var f=noteF(oct,deg,col);
        if(1-b>0.02)synthPluck(t,f,0.022*(1-b),P);
        if(b>0.02)woodPluck(t,f*2,0.02*b,P,sh>0.05);}
      if(Math.random()<0.035*b+0.05*sh)chirp(t+Math.random()*STEP,0.006*(b+sh));
      step++;pPos++;if(pPos>=pLen){pPos=0;pIdx++;pLen=PHR[pIdx%3];}}
    ladder(mNow(),true);tick();
    return {
      event:function(name){var a=ev[name];if(a)nudges.push({t:Date.now()/1000,a:a});},
      nudge:function(a){nudges.push({t:Date.now()/1000,a:+a||0});},
      state:function(){return {m:mNow(),y:y.slice(),step:step,phrase:[pIdx,pLen]};},
      stop:function(){if(!alive)return;alive=false;clearTimeout(timer);var t=ac.currentTime;try{out.gain.cancelScheduledValues(t);out.gain.setTargetAtTime(0,t,0.06);}catch(e){}
        setTimeout(function(){try{po.forEach(function(x){x.stop();});br.stop();out.disconnect();}catch(e){}},400);}};
  }
  window.LogoSound={create:create,wave:wave,THRESHOLDS:E.slice()};
})();
