/* KIDS CLUB COPY for Bonnie's sites (rebella js/logo-sound.js = simmie-chat js/logo-sound.js), from dad-page 8e1ce3c (v4 CALM voice).
   Changes from that file (Danny 13:08 AWST 26 Oct 2026 + Kids Club "Loudness" and "Pitch" standards):
   - QUIET HOURS from the sun, not the clock: rest = SeasonPumps.restShare(SeasonPumps.sunHeight(now)) at the one coarse city point (dusk and
     dawn ease smoothly, day length sets how long the quiet lasts). Level = PHI^-(n x rest), n = Dial 3's ceiling rung (PhiDials.SPEC.season.ceil,
     Danny's rung; n = 2 gives the old ~0.382 night as the worked example). The other feeds still only nudge around it (listed for Danny).
   - NO FIXED ROOT: base pitch = (1/B) x PHI^13 (B = Rule phi anchor B from js/phi-b.js: her own rhythm, the Moon and the temperature), so
     a busier rhythm (shorter B) lifts it. Pump B (the page feeds' mix S) moves it within +-PHI^-2 of a phi step (about 3 semitones):
     floor and headroom are phi rungs. Every note, chord and interval stays a ratio of that base.
   - Tide feed at the city point (SeasonPumps.POINT, -32.0 / 115.9), not the old harbour point.
   - Tone.js path from window.KidLogoCfg.tone (Rebella keeps its copy under music/playground/vendor/tone).
   - No master volume control anywhere: the device volume is the only overall level. Internal mix levels are unchanged and listed.
   - SWEET (Danny 14:01 + 14:03 AWST 26 Oct): less noise and dissonance, more musical, feminine and ethereal; drums kept at their presence
     but in a groove. Blend dial rests and moves toward the ethereal end (floor PHI^-1, or PHI^-1/2 / PHI^-1/4 for the Dreamy / Moonlight
     moods; Moonlight steps x PHI slower). Pad: one mode per phrase (Ionian I-IV-vi-V, or Lydian I-II-vi-V so no diminished chord), triads,
     nearest-voice leading, no pitch-bend detune. Melody, glass, celesta and birds snap to the chord's tones + its 9th (consonant only); the
     808 plays the chord root. Hats on every even step with soft PHI accents, 808 on a fixed 2:3 pattern, both on the grid (no jitter);
     fills only on a phrase's last step. No breath noise. Soft attacks (PHI^-8 s) on the bell, celesta, glass and harp plucks, sine/triangle
     plucks, sine AM pad, consonant FM ratios (2:1), FM index PHI (celesta 1), shimmer reverb PHI^3 s. CALM ceilings tightened. */
/* LOGO SOUND ENGINE v2: MIDI end to end (Danny voice 15:11 AWST 25 Oct 2026; t746u blend, free-wheel rule 6, rule 10 'logo = microcosm
   of the site'; spec /home/box/.config/logo-sound-motion-spec.md). Reusable and logo-agnostic. Used by the questionnaire's two header logos only:
   the Rebella zoom (js/rebella-zoom-life.js) and Dad's mark (js/logo-sound-dad.js voice, 15:28 AWST); not on other pages.

   ARCHITECTURE  [Sequencer] -> MIDI events -> [ToneRenderer]
     Sequencer: pure JS (no DOM, no audio; runs in node for the offline .mid export). On the phi grid and the ladder it emits real MIDI
       messages {t, type: on|off|cc|pc|bend, ch 0-15, n, v, cc, val, prog, bend}: note on/off with velocity, a program change per layer,
       CCs for the eight macro parameters, pitch bend for the root glide (RPN 0 bend range = 12 semitones).
     ToneRenderer: the SAME approach as Rebella's Music Playground (EdgerEquals/rebella music/playground/js/playground.js): self-hosted
       Tone.js 15.1.22 (vendor/tone/Tone.js, byte-identical copy, MIT), MIDI note numbers -> hz(), instruments built like its make()
       (MembraneSynth 808, MetalSynth hats, MonoSynth/PolySynth plucks, PluckSynth Karplus-Strong, FM bells, AM pad, NoiseSynth),
       humanise jitter capped at 0.018 s like its 'human' control. It renders only what the MIDI stream says. Tone.js is loaded on
       the first Rebella zoom tap, never on page load, and runs on the zoom's own AudioContext (made inside the tap).

   MIDI MAP (channels 1-based)
     ch1  synth pluck      PC 80 square lead / PC 81 saw lead, alternating each phrase   -> PolySynth(MonoSynth), filter from CC74/71
     ch2  wood pluck       PC 108 kalimba                                                -> 2 x PluckSynth (Karplus-Strong), round robin
     ch3  glass            PC 98 crystal                                                 -> PolySynth(FMSynth) bells, + shimmer send
     ch4  pad              PC 89 warm pad, chord per phrase, pitch bend = root glide     -> PolySynth(AMSynth) through a lowpass
     ch5  breath           PC 121 breath noise, held note, CC2 breath = level            -> NoiseSynth (pink) through a band-pass
     ch6  birdsong         PC 123 bird tweet, short chirps                               -> Synth (sine) with an upward glide
     ch7  808 sub          PC 38 synth bass, on the root (+ an octave-up harmonic voice)  -> 2 x MembraneSynth
     ch10 drums            note 42 closed hat (triplet rolls)                            -> MetalSynth
     ch16 macro channel    CC16 blend, CC17 density, CC18 low end, CC74 filter brightness, CC71 resonance, CC19 swing, CC80 pitch
                           colour, CC91 reverb & space, CC93 shimmer (value = shimmer x 127, so its 0.618 ceiling sends 78), CC7 master
                           loudness, CC81 root offset (64 + semitones, information only).

   BLEND  m in 0..1: TRAP (m=0: tight 808 sub, hat triplet rolls, crisp saw/square plucks, dry and close) <-> ETHEREAL-ORGANIC (m=1: airy
     pad, breath, wood/kalimba and glass plucks, birdsong, wide shimmer reverb). Wave w = [sin(2 pi t/PHI^10) + sin(2 pi t/PHI^9 + 1)]/2,
     m = (w+1)/2 (122.99 s and 76.01 s, one sweep about 1.6-2 min, never exactly repeats; t = wall-clock seconds). NUDGES (logo hooks):
     'star-drop' and 'shimmer' add +0.236, fading (1 - t/PHI^2)^2 over PHI^2 s. AFFINITY: the subscribed 'phi-adapt:<logo id>' value
     (0..1, how much this visitor uses the logo) adds +0.09 x affinity toward organic. m is clamped 0..1.
   GRID  step PHI^-3 = 0.236 s (Rebella: x PHI = 0.382 s since CALM, see below); swing on odd steps, long:short 1:1 -> PHI:1; phrases 8, 13, 21 steps, cycling. HUMANISE: every event
     gets +-0.009 s x (jitter detail pump) of random micro-timing (cap 0.018 s); velocity accent 0.82 + 0.18 x frac(step x 0.618) (golden
     angle); kalimba notes get a further +-PHI^-6 s stagger so it stays a tinker-toy.
   LADDER (free-wheel; spec order; e = soft entry threshold on m, gaps x1.618, shimmer slot 0.618; glide tau = PHI^(i-1) x 0.236 s)
      1 blend          e .0     synth velocities x(1-y), organic x y                                        CC16   0.236 s
      2 density        e .0136  hats/step .92 -> .14, triplet-roll .38(1-y)^2, plucks/step .50 -> .22       CC17   0.382 s
      3 low end        e .0357  808 velocity 1 -> .03, decay .62 -> .24 s                                    CC18   0.618 s
      4 filter         e .0713  cutoff 1.2 -> 5.2 kHz, Q 8 -> .7, attack 2 -> 25 ms, decay .18 -> .9 s       CC74/71 1.000 s
      5 swing          e .1290  1:1 -> PHI:1                                                                  CC19   1.618 s
      6 pitch colour   e .2225  Aeolian -> Dorian -> Lydian -> major pentatonic, per note between neighbours CC80   2.618 s
      7 reverb/space   e .3736  send .04 -> .5, short (PHI^-1 s) -> long (PHI^2 s) reverb                    CC91   4.236 s
      8 shimmer        slot .618  0.618 x u^PHI (the curve, never gated): glass into the long reverb,
                                  birdsong chance, breath air                                                 CC93   6.854 s
     Coupling: stage 1 is driven by m; stage i+1 by u = (y_i + m)/2 + 0.236 x tau_i x v_i, times its parameter pump (below). Target =
     smoothstep((u - e')/(1 - e')), e' = e - 0.0136 x f (f glides to 1 while u falls: soft release hysteresis). Lightly damped springs
     (zeta PHI^-0.5, omega 1/tau), 4 sub-steps per grid step: every stage moves every 0.236 s, nothing freezes. Stages 1-5 retarget every
     step, 6-8 at phrase boundaries (only the target timing is quantised).

   ROOT (fed by the page, not fixed): S = 0.382 daytime + 0.236 tide + 0.146 moon + 0.146 ratio-pump + 0.09 clock (weights sum 1.0; each
     feed -1..1, a missing feed counts 0 = neutral). Offset = clamp(round(3 S), -2, +3) semitones from E1 (MIDI 28): D1 .. G1, deep and
     musical. Retargeted only at phrase boundaries; the root itself is a free-wheel spring (critically damped, tau PHI^-1 s, so it settles
     over about PHI^2 s, driven also by stage 6's velocity), so new notes take the nearest semitone and the held pad glides with pitch
     bend; chords, mode and every interval are rebuilt from the new root, so the whole chain transposes together.
   LOUDNESS (Danny 15:17 + 15:27: time of day is the PRIMARY feed, softer at night): day(h) = 0 from 21:00 to 06:00, cosine up
     06:00 -> 12:00, 1 from 12:00 to 17:00, cosine down 17:00 -> 21:00 (local device hour = AWST for Danny); L = 0.40 + 0.60 x day(h)
     (night = 40% of daytime). The other feeds modulate around it with depth 0.146:
     L x (1 + 0.146 x (0.382 tide + 0.236 moon + 0.236 ratio-pump + 0.146 clock)), sent as CC7 = 127 x L / 1.146. Even loudness across
     the blend: the renderer applies make-up gain 1 -> PHI^1.5 with CC16 (blend) and a gentle compressor, so the organic end is about as loud as
     the trap end (measured within ~1 dB). Master = CC7/127 x 0.16 into the zoom's own output: quiet.

   PUMP TREE (Danny 15:18: the whole questionnaire PAGE is the parent; pump counts follow Fibonacci down the tree). A node with N pumps =
     N slow sines on half golden steps (js/phi-pumps.js); out = parent.out x (1 + depth x mean(modes)), so each child's input-power
     scaler is its parent's output and scaling a parent scales its whole branch. Only the logo branch is built:
       page 13 (PhiPumps.page: PHI^4..PHI^10, depth .146)
        `- logo 8 (PHI^3..PHI^6.5, .09)
            |- 808 5        -> low end 3       -> 808 decay 2
            |- hats 5       -> density 3, swing 3 -> jitter 2
            |- plucks 5     -> blend 3, filter 3 -> cutoff 2, resonance 2, pluck decay 2
            |- pad 5        -> pitch colour 3
            |- organic 5    -> reverb 3        -> breath 2
            `- shimmer 5    -> shimmer 3       -> glass decay 2
       (layers PHI^2..PHI^4 depth .09; parameters PHI^1.5..PHI^2.5 depth .056; details PHI^1..PHI^1.5 depth .034). Layer outputs scale
       that layer's velocities; parameter outputs scale their stage's drive u; detail outputs scale that one value.
   SUBSCRIPTIONS (rule 10): a logo declares the page entities it listens to (opts.subscribe); they come from the page registry
     PhiPumps.subscribe(name) (js/phi-pumps.js: pump:page, daytime, clock, moon, tide, ratio-pump, phi-adapt:<id>, component:theme).
     Without PhiPumps a local stub gives a local page node and the locally computable feeds (daytime, clock, moon); others read neutral.
     component:theme light adds +0.056 to the cutoff detail (a touch brighter in the light theme).
   COST: one look-ahead scheduler (~100 ms tick, 0.3 s ahead), Tone voices reused (no per-note node churn), two reverbs, no catch-up burst.
   VOICES (v3, Danny voice 15:28-15:30 AWST): create(..., {voice:'dad'}) uses a registered voice's own Sequencer/Renderer pair
     (js/logo-sound-dad.js = Dad's mark); the default voice is the Rebella one above. SOLO: only one logo engine sounds at a time (a new
     create() stops the previous engine). LIVE: LogoSound.live[logo id] = {m, D, midi, loud, day} snapshot for live mini-mapped open/close sounds.
   CALM (Danny t797u 16:11 AWST, Rebella voice only; Dad's voice unchanged): step x PHI = 0.382 s (glide taus keep the spec's 0.236 base);
     blend m' = 0.382 + 0.618 m (organic-leaning, trap weight lowered); hats on even steps only, chance <= .382, 2-hit rolls <= .09,
     velocity x0.236, low-passed 5.2 kHz; breath x0.236 (ceiling .14), band 700 Hz + low-pass 900 Hz (no hiss); birds x0.236 (<= .0236
     per step); 808 x0.382 with a slow 20 ms attack and small pitch drop (soft warmth, no click) on a 2:3 grid (every 3rd step);
     trap pluck x0.382; plucks <= .382 per step, stepwise melody, upper-mid register; a celesta-like soft lead (FM index <= 2.5, ch8 PC9)
     doubles organic notes; glass FM index capped at 4; pad I-IV-vi-V an octave higher with nearest-voice leading; modes major
     pentatonic -> Ionian -> major hexatonic -> Lydian; total timing offset capped +-0.02 s; pump depths on hats layer, density, swing and
     jitter x0.382. CALM = the ceiling object (LogoSound.CALM); Sequencer.state().calm reports what actually happened.
   API: LogoSound.create(ac, dest, {voice, subscribe, events, logo, feeds, record}) -> engine {event(name), nudge(x), state(), stop(fade), log()}
        LogoSound.Sequencer(opts) (offline/export), LogoSound.feedTide() (lazy tide fetch), LogoSound.wave(t). */
(function(G0){
  'use strict';
  var W=typeof window!=='undefined'?window:G0;
  var PHI=1.6180339887,G=0.6180339887,STEP=0.2360679775,E=[0,0.0136,0.0357,0.0713,0.1290,0.2225,0.3736,0.618],HYS=0.0136,ZETA=Math.pow(PHI,-0.5),
      PHR=[8,13,21],MODES=[[0,2,4,7,9],[0,2,4,5,7,9,11],[0,2,4,7,9,11],[0,2,4,6,7,9,11]],ROOT=baseMidi(),   // CALM: major pentatonic -> Ionian -> major hexatonic -> Lydian
      RSTEP=0.2360679775*1.6180339887,   // CALM (Danny t797u 16:11): Rebella step x PHI = 0.382 s (Dad's voice keeps 0.236 s)
      CALM={hat:0.382,roll:Math.pow(PHI,-2),pluck:0.382,jitter:Math.pow(PHI,-9),noise:0,bird:Math.pow(PHI,-9),fm:PHI,blendFloor:G},   // SWEET calm ceiling: no feed/pump/nudge combination can exceed these
      OCT=12,   // unit: 12 semitones per octave (MIDI)
      RG={pluck:36,pad:48},   // the existing pluck / pad registers above the root, moved here (were literals at their use sites)
      MOOD={sparkle:1,dreamy:1/2,moonlight:1/2/2},   // phi: blend floor = PHI^-k (k halves toward the ethereal end)

      CH={synth:0,wood:1,glass:2,pad:3,breath:4,bird:5,sub:6,cel:7,drums:9,macro:15},
      CC={blend:16,density:17,low:18,filter:74,res:71,swing:19,colour:80,reverb:91,shimmer:93,vol:7,root:81,breath:2},
      DEF_SUBS=['pump:page','daytime','tide','moon','ratio-pump','clock','component:theme'];
  function lerp(a,b,t){return a+(b-a)*t;}
  function clamp(x,a,b){a=a==null?0:a;b=b==null?1:b;return x<a?a:x>b?b:x;}
  function sstep(x){x=clamp(x);return x*x*(3-2*x);}
  function wave(t){return ((Math.sin(2*Math.PI*t/Math.pow(PHI,10))+Math.sin(2*Math.PI*t/Math.pow(PHI,9)+1))/2+1)/2;}
  function v7(x){return Math.max(0,Math.min(127,Math.round(x*127)));}
  // ---- local stub registry (when the page has no PhiPumps) ----
  function stubNode(name,n,k0,depth,parent,seed){var P=[],ph=[];for(var j=0;j<n;j++){P.push(Math.pow(PHI,k0+j/2));ph.push(2*Math.PI*(((j+1+(seed||0))*G)%1));}
    function modes(t){var s=0;for(var j=0;j<n;j++)s+=Math.sin(2*Math.PI*t/P[j]+ph[j]);return s/n;}
    return {name:name,n:n,depth:depth,parent:parent||null,modes:modes,out:function(t){return (parent?parent.out(t):1)*(1+depth*modes(t));}};}
  function stub(clock){var page=stubNode('page',13,4,0.146,null,0),f={
      'pump:page':function(){return page.out(clock.mono());},
      daytime:function(){var d=new Date(clock.wall()*1000);return -Math.cos(2*Math.PI*(d.getHours()+d.getMinutes()/60)/24);},
      clock:function(){return Math.sin(2*Math.PI*(clock.wall()%3600)/3600);},
      moon:function(){var ph=(((clock.wall()*1000-947182440000)/86400000/29.530588853)%1+1)%1;return -Math.cos(2*Math.PI*ph);}};
    return {node:stubNode,page:page,subscribe:function(n){return {name:n,get:function(){return f[n]?f[n]():null;}};}};}
  function bNow(){var B=W.PhiB&&W.PhiB.value;if(B)return B;return 86400*Math.pow(PHI,-19);}   // unit: s per day; phi: phi-b.js first-view rung (day x PHI^-19)
  function baseMidi(){var B=bNow();if(!B)return null;var f=(1/B)*Math.pow(PHI,13);return 69+12*Math.log(f/440)/Math.LN2;}         // cite: ISO 16 / MIDI, A4 = note 69 = 440 Hz, 12 semitones per octave
  function nightRung(){try{return W.PhiDials.SPEC.season.ceil;}catch(e){return 2;}}                                                // anchor: Dial 3 ceiling rung (Danny's), mirrored when dials are off
  function restNow(d){var SP=W.SeasonPumps;if(!SP)return 0;try{return SP.restShare(SP.sunHeight(d||new Date()));}catch(e){return 0;}}
  function dayCurve(d){return 1-restNow(d);}   // daylight share 0..1 from the sun (name kept for the API)

  // ================= SEQUENCER (MIDI generator) =================
  function Sequencer(o){o=o||{};var MK=MOOD[o.mood]!=null?MOOD[o.mood]:MOOD.dreamy,FLOOR=Math.pow(G,MK),STEP=RSTEP*(o.mood==='moonlight'?PHI:1),calm={maxJ:0,steps:0,hats:0,rolls:0,birds:0,breathMax:0,plucks:0};
    var rnd=o.random||Math.random,clock=o.clock||{wall:function(){return Date.now()/1000;},mono:function(){return (W.performance?performance.now():Date.now())/1000;},hour:function(){var d=new Date();return d.getHours()+d.getMinutes()/60;}};
    var REG=o.registry||(W.PhiPumps&&W.PhiPumps.subscribe&&!o.local?W.PhiPumps:stub(clock)),node=REG.node||stubNode;
    var subs={};(o.subscribe||DEF_SUBS).forEach(function(n){subs[n]=REG.subscribe(n);});
    function feed(n){var s=subs[n];var v=s?s.get():null;return typeof v==='number'&&isFinite(v)?v:null;}
    // pump tree: logo branch under the page root
    var pageN=REG.page||{out:function(t){var v=feed('pump:page');return v==null?1:v;}},sd=0;
    function N(name,n,k0,d,par){sd+=1;return node(name,n,k0,d,par,sd);}
    var logo=(REG.logo&&o.logo)?REG.logo(o.logo):N('logo',8,3,0.09,pageN),L={},Pm={},D={};
    ['808','hats','plucks','pad','organic','shimmer'].forEach(function(k){L[k]=N(k,5,2,k==='hats'?0.09*0.382:0.09,logo);});   // CALM: hats layer depth x0.382
    [['blend','plucks'],['density','hats'],['low','808'],['filter','plucks'],['swing','hats'],['colour','pad'],['reverb','organic'],['shimmer','shimmer']].forEach(function(p){Pm[p[0]]=N(p[0],3,1.5,(p[0]==='density'||p[0]==='swing')?0.056*0.382:0.056,L[p[1]]);});
    [['subDecay','low'],['jitter','swing'],['cutoff','filter'],['res','filter'],['pluckDecay','filter'],['breath','reverb'],['glassDecay','shimmer']].forEach(function(p){D[p[0]]=N(p[0],2,1,p[0]==='jitter'?0.034*0.382:0.034,Pm[p[1]]);});
    var PORD=['blend','density','low','filter','swing','colour','reverb','shimmer'];
    var ev=o.events||{'star-drop':0.236,'shimmer':0.236},nudges=[],aff=o.logo?'phi-adapt:'+o.logo:null;if(aff&&!subs[aff])subs[aff]=REG.subscribe(aff);
    var y=[0,0,0,0,0,0,0,0],v=[0,0,0,0,0,0,0,0],tg=[0,0,0,0,0,0,0,0],fall=[0,0,0,0,0,0,0,0],lu=[0,0,0,0,0,0,0,0],first=true;
    var padPM=MODES[1],padREL=MODES[0].slice(),padBass=0,padPrev=[],root={x:0,v:0,tg:0,off:0},step=0,pIdx=0,pLen=PHR[0],pPos=0,deg=0,lastCC={},padOn=[],padRoot=0,breathOn=false,prog=80,loud=1,feedsNow={};
    function mNow(){var t=clock.wall(),n=0;nudges=nudges.filter(function(q){var a=(t-q.t)/2.618;if(a>=1)return false;n+=q.a*(1-a)*(1-a);return true;});
      var a=aff?feed(aff):null;var raw=clamp((o.forceM!=null?o.forceM:wave(t))+n+0.09*(a||0));return FLOOR+(1-FLOOR)*raw;}   // CALM: trap end weight lowered (m never below 0.382)
    function ladder(m,phrase,tm){for(var i=0;i<8;i++){var tau=0.2360679775*Math.pow(PHI,i),w=1/tau,u=i?clamp((y[i-1]+m)/2+0.236*tau*v[i-1]):m;
        u=clamp(u*Pm[PORD[i]].out(tm));var d=u-lu[i];lu[i]=u;fall[i]+=((d<0?1:d>0?0:fall[i])-fall[i])*0.382;
        if(i<5||phrase||first){var e=Math.max(0,E[i]-HYS*fall[i]);tg[i]=i===7?0.618*Math.pow(u,PHI):sstep((u-e)/(1-e));}
        if(first){y[i]=tg[i];v[i]=0;continue;}
        for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(tg[i]-y[i])-2*ZETA*w*v[i];v[i]+=a*h;y[i]+=v[i]*h;}}
      first=false;}
    function readFeeds(){var f={};['daytime','tide','moon','ratio-pump','clock'].forEach(function(n){f[n]=feed(n);});f.theme=feed('component:theme');feedsNow=f;
      var z=function(x){return x==null?0:x;};
      var S=0.382*z(f.daytime)+0.236*z(f.tide)+0.146*z(f.moon)+0.146*z(f['ratio-pump'])+0.09*z(f.clock);
      var K=12*Math.log(PHI)/Math.LN2*Math.pow(PHI,-2);root.tg=Math.max(-Math.round(K),Math.min(Math.round(K),Math.round(K*S)));root.S=S;   // unit: 12 semitones per octave; phi: range PHI^-2 of a phi step
      loud=Math.pow(PHI,-nightRung()*restNow(new Date(clock.wall()*1000)))*(1+0.146*(0.382*z(f.tide)+0.236*z(f.moon)+0.236*z(f['ratio-pump'])+0.146*z(f.clock)))/1.146;}
    function rootStep(){var w=1/0.618,c=0.236*0.618*v[5];for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(root.tg+c-root.x)-2*w*root.v;root.v+=a*h;root.x+=root.v*h;}}
    function rn(){return ROOT+Math.round(root.x);}
    function noteN(base,dg,colour){var p=(MODES.length-1)*Math.pow(clamp(colour),PHI),lo=Math.floor(Math.min(2.999,p)),md=MODES[rnd()<p-lo?lo+1:lo],k=((dg%md.length)+md.length)%md.length,o2=Math.floor(dg/md.length);return base+12*o2+md[k];}
    function degN(base,dg,md){var k=((dg%md.length)+md.length)%md.length;return base+OCT*Math.floor(dg/md.length)+md[k];}
    // SWEET: snap a note to the current chord's tones + its 9th (relative to padRoot, so a fractional root stays exact)
    function snap(n){var r=Math.round(n-padRoot),best=null;for(var dd=0;dd<OCT;dd++){[r-dd,r+dd].forEach(function(c){if(best==null&&padREL.indexOf(((c%OCT)+OCT)%OCT)>=0)best=c;});if(best!=null)break;}return padRoot+(best==null?r:best);}
    function stepEvents(T){var out=[],tm=clock.mono();function E_(e){out.push(e);return e;}
      var phrase=pPos===0;if(phrase||first)readFeeds();
      ladder(mNow(),phrase,tm);rootStep();
      var b=y[0],d=y[1],lo=y[2],fl=y[3],sw=y[4],col=y[5],sp=y[6],sh=y[7];
      var lay={};for(var k in L)lay[k]=L[k].out(tm);var det={};for(var k2 in D)det[k2]=D[k2].out(tm);
      if(feedsNow.theme===1)det.cutoff+=0.056;
      var r=1+(PHI-1)*sw,t0=T+(step%2?(2*STEP*r/(1+r)-STEP):0),acc=0.82+0.18*((step*G)%1);
      function J(x){var j=clamp((rnd()*2-1)*0.009*det.jitter+(x||0),-CALM.jitter,CALM.jitter);if(Math.abs(j)>calm.maxJ)calm.maxJ=Math.abs(j);return j;}   // CALM: total offset capped +-0.02 s
      function cc(c,val,ch){ch=ch==null?CH.macro:ch;var key=ch+':'+c;if(lastCC[key]===val)return;lastCC[key]=val;E_({t:T,type:'cc',ch:ch,cc:c,val:val});}
      if(step===0){E_({t:T,type:'cc',ch:CH.pad,cc:101,val:0});E_({t:T,type:'cc',ch:CH.pad,cc:100,val:0});E_({t:T,type:'cc',ch:CH.pad,cc:6,val:12});
        [[CH.wood,108],[CH.glass,98],[CH.pad,89],[CH.breath,121],[CH.bird,123],[CH.sub,38],[CH.cel,9]].forEach(function(q){E_({t:T,type:'pc',ch:q[0],prog:q[1]});});}
      cc(CC.blend,v7(b));cc(CC.density,v7(d));cc(CC.low,v7(lo));cc(CC.filter,v7(clamp(fl*det.cutoff)));cc(CC.res,v7(clamp((1-fl)*det.res)));cc(CC.swing,v7(sw));
      cc(CC.colour,v7(col));cc(CC.reverb,v7(sp));cc(CC.shimmer,v7(sh));cc(CC.vol,v7(loud));cc(CC.root,64+root.tg);
      var bl=Math.min(CALM.noise*0.6,0.236*clamp((0.5*b+0.6*sh)*det.breath*lay.organic));if(bl>calm.breathMax)calm.breathMax=bl;cc(CC.breath,v7(bl),CH.breath);   // CALM: breath x0.236, ceiling
      if(!breathOn&&CALM.noise>0){breathOn=true;E_({t:T,type:'on',ch:CH.breath,n:64,v:100});}
      // pad: chord per phrase, root glide by pitch bend
      if(phrase){prog=prog===80?81:80;E_({t:T,type:'pc',ch:CH.synth,prog:prog});
        padOn.forEach(function(n){E_({t:T,type:'off',ch:CH.pad,n:n});});padOn=[];padRoot=rn();
        padPM=rnd()<Math.pow(clamp(col),PHI)?MODES[3]:MODES[1];   // SWEET: one mode per phrase, Lydian more often as the colour rises
        var PR=[0,3,5,4],lyd=padPM===MODES[3],ch=PR[pIdx%PR.length]-(lyd&&pIdx%PR.length===1?2:0),pv=v7(clamp(0.62*b*lay.pad*acc));   // Ionian I-IV-vi-V / Lydian I-II-vi-V: never a diminished triad
        var c0=degN(0,ch,padPM);padREL=[ch,ch+2,ch+2*2,ch+1].map(function(dg){return ((degN(0,dg,padPM)%OCT)+OCT)%OCT;});padBass=padRoot+(((c0%OCT)+OCT)%OCT);
        if(pv>0)[ch,ch+2,ch+4].forEach(function(dg,k){var n=degN(padRoot+RG.pad,dg,padPM);if(padPrev[k]!=null){while(n-padPrev[k]>OCT/2)n-=OCT;while(padPrev[k]-n>OCT/2)n+=OCT;}padPrev[k]=n;padOn.push(n);E_({t:T+0.01,type:'on',ch:CH.pad,n:n,v:pv});});}
      var bend=0;   // SWEET: no glide detune (a sliding pad drifts off the plucks); the root moves at the next phrase, voice-led
      if(lastCC['pb']!==bend){lastCC['pb']=bend;E_({t:T,type:'bend',ch:CH.pad,bend:bend});}
      // hats (ch10 note 42). SWEET groove: every even step (2:1 under the pulse), on the grid, accent PHI^0 on the bar, PHI^-1 between;
      // a 2-hit fill only at a phrase's end (chance CALM.roll per phrase), no random rolls
      var hv=lay.hats*acc;
      if(step%2===0){var ha=(step%(2*2)===0)?1:G,t=t0;calm.hats++;
        if(pPos>=pLen-2&&rnd()<CALM.roll){calm.rolls++;for(var k3=0;k3<2;k3++){E_({t:t+k3*STEP/2,type:'on',ch:CH.drums,n:42,v:v7(clamp(0.236*0.62*hv*ha*(1-0.2*k3)))});E_({t:t+k3*STEP/2+0.03,type:'off',ch:CH.drums,n:42});}}
        else{E_({t:t,type:'on',ch:CH.drums,n:42,v:v7(clamp(0.236*0.55*hv*ha*(1-0.5*b)))});E_({t:t+0.03,type:'off',ch:CH.drums,n:42});}}
      // 808 (ch7). SWEET groove: a fixed 2:3 pattern on the grid (the bar's first step, and its 4th step every other bar), tuned to the chord root
      var pos=pPos%6;if(pos===0||(pos===3&&Math.floor(pPos/(2*3))%2===1)){var sv=v7(clamp(0.382*0.9*lerp(1,0.03,lo)*lay['808']*acc)),sdur=lerp(0.62,0.24,lo)*det.subDecay,t1=t0;
        if(sv>0){E_({t:t1,type:'on',ch:CH.sub,n:padBass,v:sv});E_({t:t1+sdur,type:'off',ch:CH.sub,n:padBass});}}
      // plucks
      if(rnd()<Math.min(CALM.pluck,lerp(0.382,0.18,d))){calm.plucks++;deg+=[-1,1,-1,1,0,2,-2][Math.floor(rnd()*7)];deg=Math.max(0,Math.min(9,deg));   // CALM: fewer notes, stepwise
        var pd=lerp(0.18,0.9,fl)*det.pluckDecay,t2=t0+J();
        var n1=snap(noteN(padRoot+RG.pluck,deg,col)),s1=v7(clamp(0.382*0.8*(1-b)*lay.plucks*acc));   // CALM: upper-mid register, trap pluck x0.382
        if(s1>0){E_({t:t2,type:'on',ch:CH.synth,n:n1,v:s1});E_({t:t2+pd,type:'off',ch:CH.synth,n:n1});}
        var n2=n1+12,w1=v7(clamp(0.9*b*lay.organic*acc)),t3=t0+J((rnd()*2-1)*Math.pow(PHI,-6)*0.5);   // kalimba stagger kept, inside the +-0.02 s cap
        if(w1>0){E_({t:t3,type:'on',ch:CH.wood,n:n2,v:w1});E_({t:t3+pd,type:'off',ch:CH.wood,n:n2});}
        var g1=v7(clamp(1.3*sh*lay.shimmer*acc));
        if(g1>0&&sh>0.02){var gd=lerp(0.6,1.6,sh/0.618)*det.glassDecay;E_({t:t3+0.002,type:'on',ch:CH.glass,n:n1+24,v:g1});E_({t:t3+gd,type:'off',ch:CH.glass,n:n1+24});}
        // CALM: a celesta-like voice doubles some organic notes an octave up (soft lead)
        if(b>0.5&&rnd()<0.382){var cv2=v7(clamp(0.45*b*lay.shimmer*acc));if(cv2>0){E_({t:t3+0.004,type:'on',ch:CH.cel,n:n2+12,v:cv2});E_({t:t3+0.9,type:'off',ch:CH.cel,n:n2+12});}}}
      // birdsong (ch6)
      if(rnd()<Math.min(CALM.bird,0.236*(0.035*b+0.05*sh))){calm.birds++;var t4=t0+J(),bv=v7(clamp(0.5*(b+sh)*lay.organic)),cn=3+(rnd()<0.5?0:1);
        for(var c2=0;c2<cn;c2++){var nn=snap(padRoot+RG.pad+OCT+Math.floor(rnd()*OCT/2));E_({t:t4+c2*0.09,type:'on',ch:CH.bird,n:nn,v:bv});E_({t:t4+c2*0.09+0.06,type:'off',ch:CH.bird,n:nn});}}
      step++;calm.steps++;pPos++;if(pPos>=pLen){pPos=0;pIdx++;pLen=PHR[pIdx%3];}
      return out;}
    function allOff(T){var out=[];padOn.forEach(function(n){out.push({t:T,type:'off',ch:CH.pad,n:n});});padOn=[];if(breathOn)out.push({t:T,type:'off',ch:CH.breath,n:64});breathOn=false;return out;}
    return {step:stepEvents,allOff:allOff,event:function(name){var a=ev[name];if(a)nudges.push({t:clock.wall(),a:a});},nudge:function(a){nudges.push({t:clock.wall(),a:+a||0});},
      state:function(){return {m:mNow(),y:y.slice(),root:{offset:root.tg,pos:+root.x.toFixed(3),S:root.S,midi:rn()},loud:loud,feeds:feedsNow,step:step,phrase:[pIdx,pLen],
        pumps:{page:pageN.out(clock.mono()),logo:logo.out(clock.mono())},chord:{root:padRoot,rel:padREL.slice()},mood:o.mood||'dreamy',floor:FLOOR,calm:calm,stepLen:STEP};},stepLen:STEP};}

  // ================= RENDERER (Tone.js, Rebella Playground approach) =================
  function hz(n){return 440*Math.pow(2,(n-69)/12);}
  function ToneRenderer(T,dest){
    var nodes=[];function K(x){nodes.push(x);return x;}
    var master=K(new T.Gain(0));master.connect(dest);
    var comp=K(new T.Compressor({threshold:-26,ratio:3,attack:0.01,release:0.236})).connect(master);
    var bus=K(new T.Gain(1)).connect(comp),makeup=bus;
    var revS=K(new T.Reverb({decay:0.618,preDelay:0.01,wet:1})).connect(comp),revL=K(new T.Reverb({decay:Math.pow(PHI,3),preDelay:0.03,wet:1})).connect(comp);
    var sendS=K(new T.Gain(0.03)).connect(revS),sendL=K(new T.Gain(0)).connect(revL),shim=K(new T.Gain(0)).connect(revL);
    function chan(vol){var g=K(new T.Gain(vol));g.connect(bus);g.connect(sendS);g.connect(sendL);return g;}
    var C={};
    C[0]=chan(0.5);var synth=K(new T.PolySynth(T.MonoSynth,{oscillator:{type:'triangle'},filter:{Q:PHI,type:'lowpass'},envelope:{attack:Math.pow(PHI,-8),decay:0.236,sustain:0,release:Math.pow(PHI,-2)},filterEnvelope:{attack:0.003,decay:0.236,sustain:0.1,baseFrequency:600,octaves:2.6}}));synth.maxPolyphony=8;synth.connect(C[0]);
    C[1]=chan(0.9);var wood=[0,1].map(function(){return K(new T.PluckSynth({attackNoise:Math.pow(PHI,-4),dampening:3800,resonance:0.92})).connect(C[1]);}),wi=0;
    C[2]=chan(0.35);var glass=K(new T.PolySynth(T.FMSynth,{harmonicity:2,modulationIndex:CALM.fm,oscillator:{type:'sine'},envelope:{attack:Math.pow(PHI,-8),decay:1.618,sustain:0,release:0.618},modulation:{type:'sine'},modulationEnvelope:{attack:0.002,decay:0.382,sustain:0,release:0.236}}));glass.maxPolyphony=6;glass.connect(C[2]);glass.connect(shim);
    C[3]=chan(0.5);var padF=K(new T.Filter(1800,'lowpass')).connect(C[3]),pad=K(new T.PolySynth(T.AMSynth,{harmonicity:2,modulation:{type:'sine'},envelope:{attack:1.618,decay:0.618,sustain:0.8,release:2.618}}));pad.maxPolyphony=6;pad.connect(padF);
    C[4]=chan(0);var brLP=K(new T.Filter({type:'lowpass',frequency:900,rolloff:-24})).connect(C[4]),brF=K(new T.Filter({type:'bandpass',frequency:700,Q:0.7})).connect(brLP),   // CALM: no hiss: breath low-passed at 900 Hz
    breath=K(new T.NoiseSynth({noise:{type:'pink'},envelope:{attack:0.618,decay:0.1,sustain:1,release:1.618}})).connect(brF);
    C[5]=chan(0.25);var bird=K(new T.Synth({oscillator:{type:'sine'},envelope:{attack:0.006,decay:0.07,sustain:0,release:0.03}})).connect(C[5]);
    C[6]=chan(0.9);var sub=K(new T.MembraneSynth({pitchDecay:0.02,octaves:G,envelope:{attack:0.02,decay:0.62,sustain:0,release:0.2}})).connect(C[6]),   // CALM: no click (slow attack, small pitch drop)
      sub2=K(new T.MembraneSynth({pitchDecay:0.02,octaves:G,envelope:{attack:0.02,decay:0.37,sustain:0,release:0.2}}));sub2.volume.value=-9;sub2.connect(C[6]);
    C[9]=chan(0.5);var hat=K(new T.MetalSynth({envelope:{attack:0.001,decay:0.056,release:0.01},harmonicity:5.1,modulationIndex:32,resonance:4000,octaves:1.5}));hat.volume.value=-14;var hatLP=K(new T.Filter({type:'lowpass',frequency:5200,rolloff:-24})).connect(C[9]);hat.connect(hatLP);   // CALM: hats low-passed
    C[7]=chan(0.3);var cel=K(new T.PolySynth(T.FMSynth,{harmonicity:4,modulationIndex:CALM.fm*G,oscillator:{type:'sine'},envelope:{attack:Math.pow(PHI,-8),decay:1.2,sustain:0,release:0.618},modulation:{type:'sine'},modulationEnvelope:{attack:0.005,decay:0.3,sustain:0,release:0.2}}));cel.maxPolyphony=6;cel.connect(C[7]);cel.connect(shim);   // CALM: celesta-like soft lead
    var st={filter:0.5,res:0.5,blend:0,reverb:0,shimmer:0,low:0};
    function tgt(p,v,t,tc){try{p.setTargetAtTime(v,t,tc||0.06);}catch(e){}}
    function applyMacro(t){var fl=st.filter,cut=lerp(1200,5200,fl);
      try{synth.set({filter:{Q:lerp(0.7,PHI*PHI,st.res)},filterEnvelope:{baseFrequency:cut*0.5}});}catch(e){}
      tgt(padF.frequency,lerp(900,3400,fl),t,0.382);wood.forEach(function(w){try{w.dampening=lerp(2400,5200,fl);}catch(e){}});
      tgt(sendS.gain,lerp(0.04,0.5,st.reverb)*(1-st.reverb),t,0.236);tgt(sendL.gain,lerp(0.04,0.5,st.reverb)*st.reverb,t,0.236);tgt(shim.gain,st.shimmer*0.9,t,0.236);
      tgt(makeup.gain,lerp(1,Math.pow(PHI,1.5),st.blend),t,0.382);
      try{sub.envelope.decay=lerp(0.62,0.24,st.low);sub2.envelope.decay=lerp(0.37,0.15,st.low);}catch(e){}}
    var held={};
    function midi(e){var t=e.t;try{
      if(e.type==='cc'){var x=e.val/127;
        if(e.ch===15){if(e.cc===7)tgt(master.gain,x*0.16,t,0.382);else if(e.cc===74)st.filter=x;else if(e.cc===71)st.res=x;else if(e.cc===91)st.reverb=x;else if(e.cc===93)st.shimmer=x;else if(e.cc===16)st.blend=x;else if(e.cc===18)st.low=x;else return;applyMacro(t);}
        else if(e.ch===4&&e.cc===2)tgt(C[4].gain,x*0.3,t,0.382);return;}
      if(e.type==='pc'){if(e.ch===0)synth.set({oscillator:{type:e.prog===81?'sine':'triangle'}});return;}
      if(e.type==='bend'){if(e.ch===3)pad.set({detune:e.bend/8192*1200});return;}
      var vel=(e.v||0)/127;
      switch(e.ch){
        case 0:if(e.type==='on')synth.triggerAttack(hz(e.n),t,vel);else synth.triggerRelease(hz(e.n),t);break;
        case 1:if(e.type==='on'){wood[wi].triggerAttack(hz(e.n),t);wi^=1;}break;
        case 2:if(e.type==='on')glass.triggerAttack(hz(e.n),t,vel);else glass.triggerRelease(hz(e.n),t);break;
        case 3:if(e.type==='on'){pad.triggerAttack(hz(e.n),t,vel);held[e.n]=1;}else{pad.triggerRelease(hz(e.n),t);delete held[e.n];}break;
        case 4:if(e.type==='on')breath.triggerAttack(t,1);else breath.triggerRelease(t);break;
        case 5:if(e.type==='on'){var f=hz(e.n)*(0.9+0.1*Math.random());bird.triggerAttack(f,t,vel);bird.frequency.setValueAtTime(f,t);bird.frequency.exponentialRampToValueAtTime(f*1.4,t+0.055);}break;
        case 6:if(e.type==='on'){sub.triggerAttack(hz(e.n),t,vel);sub2.triggerAttack(hz(e.n+12),t,vel);}break;
        case 7:if(e.type==='on')cel.triggerAttack(hz(e.n),t,vel);else cel.triggerRelease(hz(e.n),t);break;
        case 9:if(e.type==='on'&&e.n===42)hat.triggerAttackRelease(hz(84),0.03,t,vel*0.5);break;}
    }catch(err){}}
    return {midi:midi,ready:Promise.all([revS.ready,revL.ready]).catch(function(){}),
      fadeIn:function(t){tgt(master.gain,0.12,t,0.618);},
      stop:function(t,fade){tgt(master.gain,0,t,fade||0.06);setTimeout(function(){nodes.forEach(function(n){try{n.dispose();}catch(e){}});},600);}};}

  // ================= lazy loading + tide fetch =================
  var toneP=null;
  function base(){var s=document.querySelector('script[src*="logo-sound.js"]');return s?s.src.replace(/js\/logo-sound\.js.*$/,''):'';}
  function loadTone(){if(W.Tone)return Promise.resolve(W.Tone);if(toneP)return toneP;
    toneP=new Promise(function(res,rej){var s=document.createElement('script');s.src=(W.KidLogoCfg&&W.KidLogoCfg.tone)||base()+'vendor/tone/Tone.js?v=15.1.22';s.async=true;s.onload=function(){W.Tone?res(W.Tone):rej(0);};s.onerror=function(){toneP=null;rej(0);};document.head.appendChild(s);});return toneP;}
  var tideP=null;
  function pt(){return (W.SeasonPumps&&W.SeasonPumps.POINT)||{lat:-32.0,lon:115.9};}   // anchor: shared layer's one coarse city point (Perth, 0.1 deg)
  function feedTide(){if(tideP)return tideP;var have=false;try{have=!!localStorage.getItem('dadQuizTide')||!!sessionStorage.getItem('logoSound.tide');}catch(e){}
    if(have||!W.fetch)return tideP=Promise.resolve();
    tideP=fetch('https://marine-api.open-meteo.com/v1/marine?latitude='+pt().lat+'&longitude='+pt().lon+'&hourly=sea_level_height_msl&timezone=Australia%2FPerth&forecast_days=2',{credentials:'omit',referrerPolicy:'no-referrer',mode:'cors'})
      .then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){if(j&&j.hourly&&j.hourly.sea_level_height_msl){try{sessionStorage.setItem('logoSound.tide',JSON.stringify({at:Date.now(),d:j}));}catch(e){}}}).catch(function(){});
    return tideP;}

  // ================= engine =================
  // VOICES (v3, Dad's mark 15:28-15:30 AWST): a logo may bring its own Sequencer + Renderer pair (LogoSound.voices[name], e.g. js/logo-sound-dad.js);
  // the scheduler, lazy Tone load, tide feed and solo rule stay here. SOLO: only one logo sounds at a time; creating an engine stops the one before.
  // LIVE: each running engine publishes a small state snapshot in LogoSound.live[logo id] (used by the live mini-mapped open/close sounds).
  var voices={},live={},current=null;
  function create(ac,dest,o){o=o||{};var alive=true,seq=null,R=null,timer=0,next=0,log=o.record?[]:null,pend=[],V=o.voice?voices[o.voice]:null;
    var api={event:function(n){if(seq)seq.event(n);else pend.push(['e',n]);},nudge:function(a){if(seq)seq.nudge(a);else pend.push(['n',a]);},
      state:function(){return seq?seq.state():null;},log:function(){return log?log.slice():null;},
      stop:function(fade){if(!alive)return;alive=false;if(current===api)current=null;clearTimeout(timer);if(R&&seq){seq.allOff(ac.currentTime).forEach(R.midi);R.stop(ac.currentTime,fade);}}};
    if(current&&current!==api){try{current.stop();}catch(e){}}current=api;
    Promise.all([loadTone(),feedTide()]).then(function(r){var T=r[0];if(!alive)return;
      try{if(!T.getContext||T.getContext().rawContext!==ac)T.setContext(ac);}catch(e){}
      var so={mood:o.mood,subscribe:o.subscribe,events:o.events,logo:o.logo,forceM:o.forceM,forceD:o.forceD,feeds:o.feeds,forceHour:o.forceHour};
      R=V?V.Renderer(T,dest):ToneRenderer(T,dest);seq=V?V.Sequencer(so):Sequencer(so);
      pend.forEach(function(p){p[0]==='e'?seq.event(p[1]):seq.nudge(p[1]);});pend=[];
      R.ready.then(function(){if(!alive)return;next=ac.currentTime+0.1;R.fadeIn(ac.currentTime);tick();});
    }).catch(function(){});
    function tick(){if(!alive)return;if(next<ac.currentTime)next=ac.currentTime+0.05;
      while(next<ac.currentTime+0.3){var evs=seq.step(next);for(var i=0;i<evs.length;i++){R.midi(evs[i]);if(log){log.push(evs[i]);if(log.length>4000)log.splice(0,1000);}}next+=(seq.stepLen||STEP);}
      if(o.logo){try{var q=seq.state();live[o.logo]={at:Date.now(),m:q.m,D:q.D,midi:q.root&&q.root.midi,chord:q.chord,loud:q.loud,day:q.day};}catch(e){}}
      timer=setTimeout(tick,100);}
    return api;}
  W.LogoSound={create:create,Sequencer:Sequencer,wave:wave,feedTide:feedTide,dayCurve:dayCurve,THRESHOLDS:E.slice(),CH:CH,CC:CC,STEP:STEP,RSTEP:RSTEP,CALM:CALM,
    voices:voices,live:live,current:function(){return current;},
    util:{MODES:MODES,MOOD:MOOD,OCT:OCT,RG:RG,PHI:PHI,G:G,STEP:STEP,E:E,HYS:HYS,ZETA:ZETA,lerp:lerp,clamp:clamp,sstep:sstep,wave:wave,v7:v7,hz:hz,dayCurve:dayCurve,stub:stub,stubNode:stubNode}};
})(this);
