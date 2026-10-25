/* DAD'S MARK VOICE for the shared logo engine (js/logo-sound.js v3), Danny on voice 15:28-15:30 AWST 25 Oct 2026. Questionnaire only.
   Same structure as the Rebella logo: a pure MIDI Sequencer (also runs in node for the offline .mid export) -> a Tone.js Renderer, the
   same 0.236 s grid, 8/13/21 phrases, 1:PHI swing, the 8-stage free-wheel ladder (same thresholds .0/.0136/.0357/.0713/.1290/.2225/
   .3736/shimmer 0.618 u^PHI, same coupled springs), the same root formula and the same time-of-day loudness. His own tone (not Bonnie's):
     ELECTRONIC end (m = 0): deep sub on the root at 27-40 Hz, warm analogue-style bass (detuned saws) with filter sweeps, a pulsing arp,
       deep kicks.
     ORCHESTRAL end (m = 1): low cello + contrabass, horn swells, timpani hits, high string harmonics, celesta/glass whose FM sidebands
       reach 12-16 kHz.
     Bass-heavy, using both frequency extremes, with clean mids (EQ: lows +3 dB, 250 Hz-2.6 kHz -3 dB, air +2 dB).
     Phone-safe sub: the sub voice carries harmonics 2, 3, 4 (missing-fundamental, MusicRef.subHarmonics) and a 24 Hz high-pass.
     Master: compressor -> limiter (-3 dB). Daytime level about +3 dB over the Rebella logo (LEVEL below), under the limiter.
   DISSONANCE D (0 consonant .. 1 strongly dissonant), its own two pump nodes ('dissonance' 3 modes, PHI^6..PHI^7 s; 'dissonance-drift'
     2 modes, PHI^7.5..PHI^8 s), a free-wheel spring (tau PHI s) also driven by the colour stage's velocity, plus eq-physics events:
       D > .25 cluster notes (a semitone above chord tones)        D > .45 tritones against the root (horn, cello, arp partners)
       D > .60 bitonal high strings (triad a tritone, above .85 a semitone, away from the bass key)
       always, scaled by D: detuned beating (spread = D x 1/4 critical band at the voice's pitch, Plomp & Levelt; cap 50 cents),
       ring-mod + FM sidebands (ring mix D x .5, celesta FM index 8 -> 24, harmonicity 3 -> 2.618), microtonal drift (+-D x 40 cents walk).
     Occasional RESOLUTION: at a phrase boundary, chance .09 + .146 D (and on every eq 'reform'), one phrase falls to D = 0 and the
     harmony lands on root + fifth + octave.
   BUSIER + MORE CHAOTIC: arp on a 5:8 Euclidean layer (16ths when density is high), bass on 8:13, celesta on 5:13, timpani 2:13, kick 3:8;
     jitter up to +-0.09 s x (0.382 + 0.618 D) x jitter detail pump (kick and sub at 0.382 of that, so the floor stays).
   ROOT: S = 0.382 daytime + 0.236 tide + 0.146 moon + 0.146 ratio-pump + 0.09 clock; offset clamp(round(3S), -2, +3) from B0 (MIDI 23,
     30.9 Hz) = A0 27.5 Hz .. D1 36.7 Hz (Danny's 27-40 Hz). Retargets only at phrase boundaries, glides (free-wheel spring) like Rebella's.
   LOUDNESS: same curve as Rebella (full 12-17 h, cosine 06-12 and 17-21, 0.40 from 21:00 to 06:00; other feeds +-0.146) as CC7, plus
     CC21 = day(h): the extreme lows (sub, kick, timpani, bass) get a further x lerp(0.618, 1, day) at night.
   MICROCOSM (rule 10): subscribes to pump:page, daytime, clock, moon, tide, ratio-pump, component:theme, phi-adapt:dad-mark, and the mark's
     own animation: dad:eq-breath (eq-physics breath coordinate, -1..1: breathing out opens the filter and swells the strings), dad:eq-mode
     (breath/snap/demat: a snap = timpani hit + nudge toward orchestral; dematerialise = celesta flurry + D +0.236 + more chaos; reform =
     resolution), dad:dmw (the header's radiating ring phase, -1..1: pulses the arp accents and the sub swell).
   RULE 11: fixed numbers that come from the real world (instrument ranges, roughness peak, ERB, sub harmonics) live in js/music-ref-data.js
     with sources and are pumped; everything else is a PHI-ladder value or is listed in /workspace/logo-sound-fixed-params.md.
   PUMP TREE (Fibonacci, child scaler = parent output): page 13 -> logo:dad-mark 8 (PhiPumps.logo) ->
       sub 5 -> low 3 -> subDecay 2          bass 5 -> filter 3 -> cutoff 2, res 2       arp 5 -> density 3, swing 3 -> jitter 2
       strings 5 -> blend 3, reverb 3        brass 5 -> (velocities)                       perc 5 -> (velocities)
       glass 5 -> shimmer 3 -> celestaDecay 2   harmony 5 -> colour 3, dissonance 3, dissonance-drift 2 -> beat 2, drift 2
   MIDI MAP (1-based): ch1 analogue bass PC39 | ch2 arp PC81 | ch3 cello+contrabass PC42/43 | ch4 horn PC61 | ch5 string harmonics PC45 |
     ch6 celesta PC9 | ch7 sub PC39 | ch8 timpani PC48 | ch10 kick note 36 | ch16 macro: CC16 blend, 17 density, 18 low, 74 filter, 71 res,
     19 swing, 80 colour, 91 reverb, 93 shimmer, 7 loudness, 81 root, 20 DISSONANCE, 21 night-low (day), 94 detune depth; pitch bend on ch3-ch6 = drift. */
(function(G0){
  'use strict';
  var W=typeof window!=='undefined'?window:G0,LS=W.LogoSound;if(!LS||!LS.util)return;
  var U=LS.util,PHI=U.PHI,G=U.G,STEP=U.STEP,E=U.E,HYS=U.HYS,ZETA=U.ZETA,lerp=U.lerp,clamp=U.clamp,sstep=U.sstep,v7=U.v7,hz=U.hz,dayCurve=U.dayCurve;
  var PHR=[8,13,21],ROOT=23,MODES=[[0,1,3,5,7,8,10],[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,5,7,9,10]],   // Phrygian -> Aeolian -> Dorian -> Mixolydian
      CH={bass:0,arp:1,cello:2,horn:3,harm:4,cel:5,sub:6,timp:7,drums:9,macro:15},
      CC={blend:16,density:17,low:18,filter:74,res:71,swing:19,colour:80,reverb:91,shimmer:93,vol:7,root:81,dis:20,night:21,detune:94},
      SUBS=['pump:page','daytime','tide','moon','ratio-pump','clock','component:theme','phi-adapt:dad-mark','dad:eq-breath','dad:eq-mode','dad:dmw'];
  function R_(){var r=W.MusicRef||{};return {cello:r.cello||{lo:36,hi:81},cb:r.contrabass||{lo:28,hi:67},horn:r.horn||{lo:35,hi:77},timp:r.timpani||{lo:38,hi:60},
    cel:r.celesta||{lo:60,hi:108},harm:r.violinHarmonics||{lo:79,hi:100},rough:r.roughPeakCB||0.25,erb:r.erb||function(f){return 24.7*(4.37*f/1000+1);},sh:r.subHarmonics||[1,2,3,4]};}
  function eu(k,n,p){p=((p%n)+n)%n;return ((p*k)%n)<k;}                                   // Euclidean k-in-n layer
  function fit(n,lo,hi){while(n<lo)n+=12;while(n>hi)n-=12;return n;}

  function Sequencer(o){o=o||{};var REF=R_();
    var rnd=o.random||Math.random,clock=o.clock||{wall:function(){return Date.now()/1000;},mono:function(){return (W.performance?performance.now():Date.now())/1000;},hour:function(){var d=new Date();return d.getHours()+d.getMinutes()/60;}};
    var REG=o.registry||(W.PhiPumps&&W.PhiPumps.subscribe&&!o.local?W.PhiPumps:U.stub(clock)),node=REG.node||U.stubNode,feedsIn=o.feeds||{};
    var subs={};(o.subscribe||SUBS).forEach(function(n){subs[n]=feedsIn[n]?{get:feedsIn[n]}:REG.subscribe(n);});
    function feed(n){var s=subs[n];var v=null;try{v=s?s.get():null;}catch(e){}return typeof v==='number'&&isFinite(v)?v:null;}
    var pageN=REG.page||{out:function(){var v=feed('pump:page');return v==null?1:v;}},sd=10;
    function N(name,n,k0,d,par){sd+=1;return node(name,n,k0,d,par,sd);}
    function md(nd,t){if(nd.modes)return nd.modes(t);var p=nd.parent&&nd.parent.out?nd.parent.out(t):1;return (nd.out(t)/p-1)/(nd.depth||1);}
    var logo=REG.logo?REG.logo('dad-mark'):N('logo:dad-mark',8,3,0.09,pageN),L={},Pm={},D={};
    ['sub','bass','arp','strings','brass','perc','glass','harmony'].forEach(function(k){L[k]=N(k,5,2,0.09,logo);});
    [['blend','strings'],['density','arp'],['low','sub'],['filter','bass'],['swing','arp'],['colour','harmony'],['reverb','strings'],['shimmer','glass']].forEach(function(p){Pm[p[0]]=N(p[0],3,1.5,0.056,L[p[1]]);});
    var Dn=N('dissonance',3,6,0.146,L.harmony),Dd=N('dissonance-drift',2,7.5,0.146,L.harmony);   // D's own two pump nodes
    [['subDecay',Pm.low],['jitter',Pm.swing],['cutoff',Pm.filter],['res',Pm.filter],['celestaDecay',Pm.shimmer],['beat',Dn],['drift',Dd]].forEach(function(p){D[p[0]]=N(p[0],2,1,0.034,p[1]);});
    var PORD=['blend','density','low','filter','swing','colour','reverb','shimmer'];
    var ev=o.events||{snap:0.146,demat:0.236,reform:0},nudges=[];
    var y=[0,0,0,0,0,0,0,0],v=[0,0,0,0,0,0,0,0],tg=[0,0,0,0,0,0,0,0],fall=[0,0,0,0,0,0,0,0],lu=[0,0,0,0,0,0,0,0],first=true;
    var root={x:0,v:0,tg:0},dis={x:0.3,v:0,tg:0.3,res:0,kick:0},step=0,pIdx=0,pLen=PHR[0],pPos=0,arpI=0,lastCC={},held={},loud=1,day=1,feedsNow={},
        lastMode=null,drift=[0,0,0,0,0,0,0,0],flurry=0,timpQ=[],cpos=0;
    function mNow(){var t=clock.wall(),n=0;nudges=nudges.filter(function(q){var a=(t-q.t)/2.618;if(a>=1)return false;n+=q.a*(1-a)*(1-a);return true;});
      var a=feed('phi-adapt:dad-mark');return clamp((o.forceM!=null?o.forceM:U.wave(t))+n+0.09*(a||0));}
    function ladder(m,phrase,tm,br){for(var i=0;i<8;i++){var tau=STEP*Math.pow(PHI,i),w=1/tau,u=i?clamp((y[i-1]+m)/2+0.236*tau*v[i-1]):m;
        u=clamp(u*Pm[PORD[i]].out(tm)*(i===3?1+0.146*br:1));var d=u-lu[i];lu[i]=u;fall[i]+=((d<0?1:d>0?0:fall[i])-fall[i])*0.382;
        if(i<5||phrase||first){var e=Math.max(0,E[i]-HYS*fall[i]);tg[i]=i===7?0.618*Math.pow(u,PHI):sstep((u-e)/(1-e));}
        if(first){y[i]=tg[i];v[i]=0;continue;}
        for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(tg[i]-y[i])-2*ZETA*w*v[i];v[i]+=a*h;y[i]+=v[i]*h;}}
      first=false;}
    function z(x){return x==null?0:x;}
    function readFeeds(){var f={};['daytime','tide','moon','ratio-pump','clock','component:theme','dad:eq-breath','dad:eq-mode','dad:dmw'].forEach(function(n){f[n]=feed(n);});feedsNow=f;
      var S=0.382*z(f.daytime)+0.236*z(f.tide)+0.146*z(f.moon)+0.146*z(f['ratio-pump'])+0.09*z(f.clock);root.tg=clamp(Math.round(3*S),-2,3);root.S=S;
      var h=o.forceHour!=null?o.forceHour:(clock.hour?clock.hour():new Date(clock.wall()*1000).getHours());day=dayCurve(h);
      loud=(0.40+0.60*day)*(1+0.146*(0.382*z(f.tide)+0.236*z(f.moon)+0.236*z(f['ratio-pump'])+0.146*z(f.clock)))/1.146;}
    function rootStep(){var w=1/0.618,c=0.236*0.618*v[5];for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(root.tg+c-root.x)-2*w*root.v;root.v+=a*h;root.x+=root.v*h;}}
    function disStep(tm,phrase){var m1=md(Dn,tm),m2=md(Dd,tm),em=feedsNow['dad:eq-mode'],raw=0.55+1.3*(0.618*m1+0.382*m2)+0.236*dis.kick+0.09*z(feedsNow['dad:dmw'])*(em===1?1:0);
      dis.kick*=0.95;if(o.forceD!=null)raw=o.forceD;
      if(phrase){if(dis.res>0)dis.res--;else if(rnd()<0.09+0.146*dis.x&&o.forceD==null)dis.res=1;}
      dis.tg=dis.res?0:clamp(raw);var tau=dis.res?0.618:PHI,w=1/tau,c=0.236*v[5];
      for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(dis.tg+c-dis.x)-2*ZETA*w*dis.v;dis.v+=a*h;dis.x+=dis.v*h;}dis.x=clamp(dis.x);}
    function rn(){return ROOT+Math.round(root.x);}
    function noteN(base,dg,colour){var p=clamp(colour)*3,lo=Math.floor(Math.min(2.999,p)),mo=MODES[rnd()<p-lo?lo+1:lo],k=((dg%mo.length)+mo.length)%mo.length,o2=Math.floor(dg/mo.length);return base+12*o2+mo[k];}
    function eqEvents(){var em=feedsNow['dad:eq-mode'];if(em==null)return;var mode=em>=0.75?'demat':em>=0.25?'snap':'breath';
      if(lastMode&&mode!==lastMode){if(mode==='snap'){nudges.push({t:clock.wall(),a:ev.snap||0.146});timpQ.push(1);}
        else if(mode==='demat'){nudges.push({t:clock.wall(),a:ev.demat||0.236});dis.kick=1;flurry=8;}
        else if(lastMode==='demat'){dis.res=1;timpQ.push(0.7);}}
      lastMode=mode;}
    function stepEvents(T){var out=[],tm=clock.mono();function E_(e){out.push(e);return e;}
      var phrase=pPos===0;
      feedsNow['dad:eq-mode']=feed('dad:eq-mode');feedsNow['dad:eq-breath']=feed('dad:eq-breath');feedsNow['dad:dmw']=feed('dad:dmw');
      if(phrase||first)readFeeds();eqEvents();
      var br=z(feedsNow['dad:eq-breath']),ring=z(feedsNow['dad:dmw']);
      ladder(mNow(),phrase,tm,br);rootStep();disStep(tm,phrase);
      var b=y[0],d=y[1],lo=y[2],fl=y[3],sw=y[4],col=y[5],sp=y[6],sh=y[7],Dx=dis.x;
      var lay={};for(var k in L)lay[k]=L[k].out(tm);var det={};for(var k2 in D)det[k2]=D[k2].out(tm);
      if(feedsNow['component:theme']===1)det.cutoff+=0.056;
      var r=1+(PHI-1)*sw,t0=T+(step%2?(2*STEP*r/(1+r)-STEP):0),acc=(0.82+0.18*((step*G)%1))*(1+0.09*ring);
      var chaos=0.382+0.618*Dx;
      function J(f){return clamp((rnd()*2-1)*0.09*chaos*det.jitter*(f==null?1:f),-0.09,0.09);}
      function cc(c,val,ch){ch=ch==null?CH.macro:ch;var key=ch+':'+c;if(lastCC[key]===val)return;lastCC[key]=val;E_({t:T,type:'cc',ch:ch,cc:c,val:val});}
      function note(ch,n,vel,t,dur){if(vel<=0)return;E_({t:t,type:'on',ch:ch,n:n,v:vel});E_({t:t+dur,type:'off',ch:ch,n:n});}
      function hold(ch,n,vel,t){if(vel<=0)return;(held[ch]=held[ch]||[]).push(n);E_({t:t,type:'on',ch:ch,n:n,v:vel});}
      function release(ch,t){(held[ch]||[]).forEach(function(n){E_({t:t,type:'off',ch:ch,n:n});});held[ch]=[];}
      if(step===0){[[CH.bass,39],[CH.arp,81],[CH.cello,42],[CH.horn,61],[CH.harm,45],[CH.cel,9],[CH.sub,39],[CH.timp,48]].forEach(function(q){E_({t:T,type:'pc',ch:q[0],prog:q[1]});});
        [CH.cello,CH.horn,CH.harm,CH.cel].forEach(function(c){E_({t:T,type:'cc',ch:c,cc:101,val:0});E_({t:T,type:'cc',ch:c,cc:100,val:0});E_({t:T,type:'cc',ch:c,cc:6,val:2});});}
      cc(CC.blend,v7(b));cc(CC.density,v7(d));cc(CC.low,v7(lo));cc(CC.filter,v7(clamp(fl*det.cutoff*(1+0.146*br))));cc(CC.res,v7(clamp((1-fl)*det.res)));cc(CC.swing,v7(sw));
      cc(CC.colour,v7(col));cc(CC.reverb,v7(clamp(sp*(1+0.09*z(feedsNow.tide)))));cc(CC.shimmer,v7(sh));cc(CC.vol,v7(loud));cc(CC.root,64+root.tg);
      cc(CC.dis,v7(Dx));cc(CC.night,v7(day));cc(CC.detune,v7(clamp(Dx*det.beat)));
      // microtonal drift: a slow walk per voice, +-D x 40 cents (bend range 2 semitones: 8191 = 200 cents)
      [CH.cello,CH.horn,CH.harm,CH.cel].forEach(function(c){drift[c]=clamp(drift[c]*0.94+(rnd()*2-1)*0.12*det.drift,-1,1);var bd=Math.round(drift[c]*Dx*40/200*8191);if(lastCC['pb'+c]!==bd){lastCC['pb'+c]=bd;E_({t:T,type:'bend',ch:c,bend:bd});}});
      var R0=rn(),cons=dis.res>0;
      var chordDeg=cons?0:[0,5,3,4,0,6,3,4][pIdx%8];
      function chord(base,lo2,hi2){var ns=cons?[base,base+7,base+12]:[0,2,4].map(function(g){return noteN(base,chordDeg+g,col);});
        if(!cons&&Dx>0.25)ns.push(ns[0]+1);if(!cons&&Dx>0.45)ns.push(base+6);return ns.map(function(n){return fit(n,lo2,hi2);});}
      // phrase-level: cello + contrabass, horn swells, high string harmonics (bitonal when dissonant)
      if(phrase){release(CH.cello,T);release(CH.horn,T);release(CH.harm,T);
        var cv=v7(clamp(0.7*b*lay.strings*acc));hold(CH.cello,fit(R0+12,REF.cb.lo,REF.cb.hi),cv,T+J(0.382));
        chord(R0+24,REF.cello.lo,Math.min(REF.cello.hi,62)).forEach(function(n,i){hold(CH.cello,n,v7(clamp(0.55*b*lay.strings*acc*(i>2?0.6:1))),T+0.01+J(0.5));});
        if(pIdx%2===0||sp>0.5){var hv=v7(clamp(0.6*b*lay.brass*(0.5+0.5*sp)));chord(R0+36,REF.horn.lo,REF.horn.hi).slice(0,cons?3:4).forEach(function(n){hold(CH.horn,n,hv,T+0.02+J(0.5));});}
        var key=cons?0:(Dx>0.85?1:Dx>0.6?6:0),hvv=v7(clamp((0.35*b+0.6*sh)*lay.strings*(1+0.146*br)));
        [0,4,7].forEach(function(iv,i){hold(CH.harm,fit(R0+60+key+iv+(i===2&&!cons&&Dx>0.25?1:0),REF.harm.lo,REF.harm.hi),hvv,T+0.03+i*0.09+J());});}
      // sub on the root (ch7): one long note per 8 steps; the low end stage shortens it
      var p8=pPos%8,p13=cpos%13,sv0=v7(clamp(0.9*lerp(1,0.382,lo)*lay.sub*(1+0.09*ring)));
      if(p8===0)note(CH.sub,R0,sv0,T+J(0.382),8*STEP*lerp(0.9,0.5,lo)*det.subDecay);
      // kick 3:8 (deep), electronic weight
      if(eu(3,8,p8))note(CH.drums,36,v7(clamp(0.95*(1-0.8*b)*lay.sub*acc)),t0+J(0.382),0.1);
      // analogue bass 8:13
      if(eu(8,13,p13)){var bn=R0+12+[0,0,7,12,0,10,0,7][arpI%8]+(!cons&&Dx>0.45&&rnd()<Dx*0.5?6:0);note(CH.bass,bn,v7(clamp(0.8*(1-b)*lay.bass*acc)),t0+J(0.5),STEP*lerp(0.45,0.95,fl));}
      // arp 5:8, pulsing; 16ths when density is high (d low = busy)
      if(eu(5,8,p8)){var subd=d<0.382?2:1,ch=chord(R0+48,58,88);for(var q=0;q<subd;q++){var an=ch[(arpI++)%ch.length],tq=t0+q*STEP/2+J(0.7),av=v7(clamp(0.6*(1-b)*lay.arp*acc*(q?0.7:1)));
        note(CH.arp,an,av,tq,STEP*0.38);if(!cons&&Dx>0.45&&rnd()<Dx)note(CH.arp,an+(Dx>0.7?1:6),v7(clamp(0.4*(1-b)*lay.arp*Dx)),tq+0.004,STEP*0.3);}}
      // timpani 2:13 + eq-physics snaps
      if(eu(2,13,p13)&&rnd()<0.5+0.5*b)timpQ.push(0.6+0.4*b);
      timpQ.forEach(function(a,i){var tn=fit(R0+24+(i%2?7:0)+(!cons&&Dx>0.6?6:0),REF.timp.lo,REF.timp.hi);note(CH.timp,tn,v7(clamp(a*(0.3+0.7*b)*lay.perc*acc)),t0+i*STEP/3+J(0.382),1.2);});timpQ=[];
      // celesta / glass 5:13 + flurries on dematerialise
      var celP=(0.35+0.4*b)*(1+0.09*z(feedsNow.moon));
      if((eu(5,13,p13)&&rnd()<celP)||flurry>0){var cn=fit(noteN(R0+84,(arpI*3)%9,col)+(!cons&&Dx>0.25&&rnd()<Dx?1:0),REF.cel.lo,REF.cel.hi),cdur=lerp(0.6,2.2,sh/0.618)*det.celestaDecay;
        note(CH.cel,cn,v7(clamp((0.35+1.1*sh)*lay.glass*acc*(flurry>0?0.8:1))),t0+J(),cdur);if(flurry>0){flurry--;note(CH.cel,fit(cn+7,REF.cel.lo,REF.cel.hi),v7(clamp(0.5*lay.glass)),t0+STEP/2+J(),cdur);}}
      step++;pPos++;cpos++;if(pPos>=pLen){pPos=0;pIdx++;pLen=PHR[pIdx%3];}
      return out;}
    function allOff(T){var out=[];for(var c in held){(held[c]||[]).forEach(function(n){out.push({t:T,type:'off',ch:+c,n:n});});}held={};return out;}
    return {step:stepEvents,allOff:allOff,event:function(name){var a=ev[name];if(name==='snap')timpQ.push(1);if(a)nudges.push({t:clock.wall(),a:a});},nudge:function(a){nudges.push({t:clock.wall(),a:+a||0});},
      state:function(){return {voice:'dad',m:mNow(),D:dis.x,resolving:dis.res>0,y:y.slice(),root:{offset:root.tg,pos:+root.x.toFixed(3),S:root.S,midi:rn(),hz:+hz(rn()).toFixed(2)},loud:loud,day:day,feeds:feedsNow,step:step,phrase:[pIdx,pLen],
        pumps:{page:pageN.out(clock.mono()),logo:logo.out(clock.mono())}};}};}

  // ================= RENDERER =================
  // LEVEL: Rebella's master (CC7 x 0.16) x 1.413 (+3 dB) x 0.5, the 0.5 calibrated by measurement because this voice is bass-heavy:
  // daytime RMS lands about +3 dB over the Rebella logo across the blend (Playwright measure, see the build report).
  var LEVEL=0.16*1.413*0.5;
  function Renderer(T,dest){var REF=R_();
    var nodes=[];function K(x){nodes.push(x);return x;}
    var lim=K(new T.Limiter(-3));lim.connect(dest);
    var comp=K(new T.Compressor({threshold:-24,ratio:3,attack:0.006,release:0.236})).connect(lim);
    var master=K(new T.Gain(0)).connect(comp);
    var eq=K(new T.EQ3({low:3,mid:-3,high:2,lowFrequency:250,highFrequency:2600})).connect(master);
    var bus=K(new T.Gain(1)).connect(eq);
    var revS=K(new T.Reverb({decay:0.618,preDelay:0.01,wet:1})).connect(eq),revL=K(new T.Reverb({decay:4.236,preDelay:0.04,wet:1})).connect(eq);
    var sendS=K(new T.Gain(0.04)).connect(revS),sendL=K(new T.Gain(0)).connect(revL),shim=K(new T.Gain(0)).connect(revL);
    // ring modulator (input x sine): output = in * osc, mixed by D
    var ringIn=K(new T.Gain(1)),ringMul=K(new T.Gain(0)),ringOsc=K(new T.Oscillator(46.25,'sine')),ringMix=K(new T.Gain(0));
    ringOsc.connect(ringMul.gain);ringIn.connect(ringMul);ringMul.connect(ringMix);ringMix.connect(bus);ringOsc.start();
    function chan(vol,ring){var g=K(new T.Gain(vol));g.connect(bus);g.connect(sendS);g.connect(sendL);if(ring)g.connect(ringIn);return g;}
    var C={},lowG={};
    // ch1 analogue bass: detuned saws, filter sweep
    C[0]=chan(0.4);var bass=K(new T.MonoSynth({oscillator:{type:'fatsawtooth',count:3,spread:12},filter:{Q:4,type:'lowpass',rolloff:-24},envelope:{attack:0.004,decay:0.3,sustain:0.5,release:0.2},filterEnvelope:{attack:0.006,decay:0.382,sustain:0.25,baseFrequency:70,octaves:3.6}})).connect(C[0]);
    // ch2 arp: pulsing square through a lowpass
    C[1]=chan(0.3);var arpF=K(new T.Filter(2400,'lowpass')).connect(C[1]),arp=K(new T.PolySynth(T.Synth,{oscillator:{type:'square'},envelope:{attack:0.003,decay:0.12,sustain:0.15,release:0.08}}));arp.maxPolyphony=8;arp.connect(arpF);
    // ch3 cello + contrabass: two detuned saws, slow bow attack, dark lowpass
    C[2]=chan(0.42,true);var celF=K(new T.Filter(1300,'lowpass')).connect(C[2]),cello=K(new T.PolySynth(T.Synth,{oscillator:{type:'fatsawtooth',count:2,spread:10},envelope:{attack:0.618,decay:0.4,sustain:0.85,release:1.618}}));cello.maxPolyphony=8;cello.connect(celF);
    // ch4 horn swells: warm triangle-saw blend under a low lowpass
    C[3]=chan(0.36,true);var hornF=K(new T.Filter(900,'lowpass')).connect(C[3]),horn=K(new T.PolySynth(T.Synth,{oscillator:{type:'fatsawtooth',count:2,spread:6},envelope:{attack:1.0,decay:0.5,sustain:0.8,release:1.618}}));horn.maxPolyphony=6;horn.connect(hornF);
    // ch5 high string harmonics: near-sine glassy partials
    C[4]=chan(0.16);var harm=K(new T.PolySynth(T.Synth,{oscillator:{type:'custom',partials:[1,0,0.25,0,0.08]},envelope:{attack:0.8,decay:0.4,sustain:0.9,release:1.618}}));harm.maxPolyphony=6;harm.connect(C[4]);
    // ch6 celesta / glass: FM, sidebands into 12-16 kHz
    C[5]=chan(0.28);var cel=K(new T.PolySynth(T.FMSynth,{harmonicity:3,modulationIndex:8,oscillator:{type:'sine'},envelope:{attack:0.001,decay:1.2,sustain:0,release:0.618},modulation:{type:'sine'},modulationEnvelope:{attack:0.001,decay:0.236,sustain:0,release:0.146}}));cel.maxPolyphony=6;cel.connect(C[5]);cel.connect(shim);
    // ch7 sub: root + harmonics 2,3,4 (phone-safe), 24 Hz high-pass
    var subHP=K(new T.Filter({type:'highpass',frequency:24,rolloff:-24}));C[6]=chan(0.5);lowG[6]=C[6];subHP.connect(C[6]);
    var hs=REF.sh,partials=[];for(var i=1;i<=4;i++)partials.push(hs.indexOf(i)>=0?[1,0.5,0.3,0.18][i-1]:0);
    var sub=K(new T.Synth({oscillator:{type:'custom',partials:partials},envelope:{attack:0.02,decay:0.6,sustain:0.6,release:0.5}})).connect(subHP);
    // ch8 timpani
    C[7]=chan(0.6);lowG[7]=C[7];var timp=[0,1].map(function(){return K(new T.MembraneSynth({pitchDecay:0.012,octaves:0.7,envelope:{attack:0.002,decay:1.4,sustain:0,release:0.4}})).connect(C[7]);}),ti=0;
    // ch10 deep kick (and its click harmonic so phones hear it)
    C[9]=chan(0.55);lowG[9]=C[9];var kick=K(new T.MembraneSynth({pitchDecay:0.06,octaves:4,envelope:{attack:0.001,decay:0.45,sustain:0,release:0.1}})).connect(C[9]);
    lowG[0]=C[0];var base={0:0.4,6:0.5,7:0.6,9:0.55};
    var st={filter:0.5,res:0.5,blend:0,reverb:0,shimmer:0,low:0,dis:0,night:1,det:0};
    function tgt(p,v,t,tc){try{p.setTargetAtTime(v,t,tc||0.06);}catch(e){}}
    function applyMacro(t){var fl=st.filter,cut=lerp(160,2600,fl);
      try{bass.set({filter:{Q:lerp(1,9,st.res)},filterEnvelope:{baseFrequency:cut*0.4}});}catch(e){}
      tgt(arpF.frequency,lerp(900,5200,fl),t,0.236);tgt(celF.frequency,lerp(700,1800,fl),t,0.382);tgt(hornF.frequency,lerp(600,1400,fl),t,0.618);
      tgt(sendS.gain,lerp(0.05,0.5,st.reverb)*(1-st.reverb),t,0.236);tgt(sendL.gain,lerp(0.05,0.55,st.reverb)*st.reverb,t,0.236);tgt(shim.gain,st.shimmer*0.8,t,0.236);
      var ease=lerp(0.618,1,st.night);for(var c in lowG)tgt(lowG[c].gain,base[c]*ease*(c==='6'?lerp(1,0.618,st.low):1),t,0.382);
      tgt(bus.gain,(1+0.944*st.blend*(1-st.blend))*lerp(0.8,1.25,st.blend),t,0.382);   // even loudness across the blend (measured)
      tgt(ringMix.gain,st.dis*0.5,t,0.382);
      try{cel.set({modulationIndex:lerp(8,24,st.dis),harmonicity:lerp(3,2.618,st.dis)});}catch(e){}
      var sp=function(f){var c=1200*Math.log(1+st.det*REF.rough*REF.erb(f)/f)/Math.LN2;return Math.max(4,Math.min(50,c));};
      try{bass.set({oscillator:{spread:sp(65)}});cello.set({oscillator:{spread:sp(130)}});horn.set({oscillator:{spread:sp(262)*0.7}});}catch(e){}}
    function midi(e){var t=e.t;try{
      if(e.type==='cc'){var x=e.val/127;
        if(e.ch===15){if(e.cc===7){tgt(master.gain,x*LEVEL,t,0.382);return;}
          if(e.cc===74)st.filter=x;else if(e.cc===71)st.res=x;else if(e.cc===91)st.reverb=x;else if(e.cc===93)st.shimmer=x;else if(e.cc===16)st.blend=x;else if(e.cc===18)st.low=x;
          else if(e.cc===20)st.dis=x;else if(e.cc===21)st.night=x;else if(e.cc===94)st.det=x;else if(e.cc===81){tgt(ringOsc.frequency,hz(23+e.val-64)*Math.SQRT2*2,t,0.618);return;}else return;applyMacro(t);}
        return;}
      if(e.type==='pc')return;
      if(e.type==='bend'){var cents=e.bend/8192*200,s={2:cello,3:horn,4:harm,5:cel}[e.ch];if(s)s.set({detune:cents});return;}
      var vel=(e.v||0)/127,f=hz(e.n),on=e.type==='on';
      switch(e.ch){
        case 0:if(on)bass.triggerAttack(f,t,vel);else bass.triggerRelease(t);break;
        case 1:if(on)arp.triggerAttack(f,t,vel);else arp.triggerRelease(f,t);break;
        case 2:if(on)cello.triggerAttack(f,t,vel);else cello.triggerRelease(f,t);break;
        case 3:if(on)horn.triggerAttack(f,t,vel);else horn.triggerRelease(f,t);break;
        case 4:if(on)harm.triggerAttack(f,t,vel);else harm.triggerRelease(f,t);break;
        case 5:if(on)cel.triggerAttack(f,t,vel);else cel.triggerRelease(f,t);break;
        case 6:if(on)sub.triggerAttack(f,t,vel);else sub.triggerRelease(t);break;
        case 7:if(on){timp[ti].triggerAttack(f,t,vel);ti^=1;}break;
        case 9:if(on&&e.n===36)kick.triggerAttack(hz(28),t,vel);break;}
    }catch(err){}}
    return {midi:midi,ready:Promise.all([revS.ready,revL.ready]).catch(function(){}),
      fadeIn:function(t){tgt(master.gain,0.75*LEVEL,t,0.618);},
      stop:function(t,fade){tgt(master.gain,0,t,fade||0.06);try{ringOsc.stop(t+3);}catch(e){}setTimeout(function(){nodes.forEach(function(n){try{n.dispose();}catch(e){}});},Math.max(600,(fade||0.06)*5000));}};}

  LS.voices.dad={Sequencer:Sequencer,Renderer:Renderer,CH:CH,CC:CC,ROOT:ROOT,SUBS:SUBS};
})(this);
