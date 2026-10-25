/* Logo tap-to-enlarge, one module for both header logos (questionnaire only).
   Dad's mark: Danny t699u 25 Oct 2026. Bonnie's Rebella logo: Danny t701u 12:45 AWST 25 Oct ("Replicate that for the Rebella logo").
   Any <button data-zoom="…"> in .q-head opens one shared modal showing its logo large: Dad's mark as the same SVG <img> (its satellite/sweep
   animations keep running) with a soft cyan glow; the Rebella logo as the same vector <use> (crisp at any size), raspberry with a soft pink neon glow.
   It scales up from the small logo's spot over PHI^-2 = 0.382 s (reduced motion: appears/disappears instantly). Closes on a tap outside the logo,
   the X, or Esc; focus sits on the X while open (Tab stays inside) and returns to the logo's button on close. See css/dad-mark-zoom.css (file names kept from the dad-mark version).
   Light load (Danny t713u 25 Oct): the header <img> is a slim mark; its data-zoom-src names the DETAILED mark, which is fetched only when the
   zoom opens (or earlier from cache if js/load-tiers.js prefetched it at idle).
   Live physics (Danny t717u/t719u): when js/eq-physics.js is loaded (tier 3) and the mark has data-zoom-stage, the zoom shows the bar-less stage
   file and EqPhysics.attach() draws the equals, its particles, pulses and reflecting waves on a canvas over it; otherwise the CSS version shows.
   Sound (Danny voice 15:28-15:30 AWST): Dad's mark has its own music on the shared logo engine (see DAD'S MARK SOUND below); the Rebella
   logo keeps its own (js/rebella-zoom-life.js). Only one logo sounds at a time.
   API: LogoZoom.open(name) / close() / isOpen(); DadMarkZoom kept as an alias for the dad mark. */
(function(){
  'use strict';
  var btns=[].slice.call(document.querySelectorAll('.q-head [data-zoom]'));if(!btns.length)return;
  var D=382,rm=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var ov=document.createElement('div');ov.className='dmz';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML='<button type="button" class="dmz-x" aria-label="Close">&times;</button><figure class="dmz-fig"></figure>';
  document.body.appendChild(ov);
  var fig=ov.querySelector('.dmz-fig'),x=ov.querySelector('.dmz-x'),cur=null,t=null,phys=null;
  function endPhys(){if(phys){phys.stop();phys=null;}}
  function srcEl(b){return b.querySelector('img,svg');}
  // Rebella neon (Danny t710u): rim + halo behind, small letter holes painted black on top of the glow, then the logo. Units = logo viewBox (1810 wide).
  var NS='http://www.w3.org/2000/svg';
  function glow(svg){var u=svg.querySelector('use');if(!u)return;var d=document.createElementNS(NS,'defs');
    // Layers (Danny t720u): [glow only: halo + pale rim] -> [black copy of the small letter holes, #bonnies-logo-holes] -> [the logo itself].
    // So the e/b/a holes stay black and full size with the same outer neon; the R bowl and heart keep their glow.
    d.innerHTML='<filter id="rbz-glow" x="-22%" y="-40%" width="144%" height="180%" color-interpolation-filters="sRGB">'+
      '<feGaussianBlur in="SourceAlpha" stdDeviation="46" result="b2"/><feFlood flood-color="#E58AA6" flood-opacity=".6"/><feComposite in2="b2" operator="in" result="halo2"/>'+
      '<feGaussianBlur in="SourceAlpha" stdDeviation="20" result="b"/><feFlood flood-color="#E58AA6" flood-opacity=".9"/><feComposite in2="b" operator="in" result="halo"/>'+
      '<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="r"/><feFlood flood-color="#F8CFDB" flood-opacity=".8"/><feComposite in2="r" operator="in" result="rim"/>'+
      '<feMerge><feMergeNode in="halo2"/><feMergeNode in="halo"/><feMergeNode in="rim"/></feMerge></filter>';
    svg.insertBefore(d,svg.firstChild);
    var href=u.getAttribute('href')||u.getAttributeNS('http://www.w3.org/1999/xlink','href')||'';
    var g=u.cloneNode(false);g.setAttribute('filter','url(#rbz-glow)');svg.insertBefore(g,u);
    var h=u.cloneNode(false);h.setAttribute('href',href.replace(/#bonnies-logo$/,'#bonnies-logo-holes'));svg.insertBefore(h,u);}
  function build(b){var name=b.getAttribute('data-zoom'),s=srcEl(b),c;
    var live=name==='dad'&&window.EqPhysics&&!!s.getAttribute('data-zoom-stage');   // Danny t717u: live physics equals over the bar-less stage file
    if(s.tagName.toLowerCase()==='img'){c=document.createElement('img');c.decoding='async';c.src=(live&&s.getAttribute('data-zoom-stage'))||s.getAttribute('data-zoom-src')||s.src;c.alt=s.getAttribute('data-zoom-alt')||'';}
    else{c=s.cloneNode(true);c.removeAttribute('class');c.removeAttribute('width');c.removeAttribute('height');c.removeAttribute('style');c.setAttribute('preserveAspectRatio','xMidYMid meet');}
    if(name==='rebella'&&c.tagName.toLowerCase()==='svg'){glow(c);}
    fig.className='dmz-fig dmz--'+name;fig.innerHTML='';var w=document.createElement('div');w.className='dmz-art';w.appendChild(c);fig.appendChild(w);
    if(phys){phys.stop();phys=null;}if(live){try{phys=EqPhysics.attach(ov,c);}catch(e){phys=null;}}
    ov.setAttribute('aria-label',(b.getAttribute('data-zoom-title')||'Logo')+', enlarged');}
  // Rebella zoom life + sound (Danny t724u 14:04 AWST 25 Oct): js/rebella-zoom-life.js is injected the first time the Rebella zoom opens
  // (shimmer, stars, breathing glow, wall echo, sweep/star sounds; t744u: bluebird, butterflies + songbirds, dawn-sky background loop). The AudioContext is made HERE, inside the tap (iOS needs the gesture);
  // it is this module's own context (the auto-DJ is never touched), suspended again PHI^0 s after close.
  // Open/close sounds (Danny t740u 25 Oct: the old G3 chords were "too baby and too scary" -> fairies): a breathy airy whoosh, high-passed
  // noise whose soft band rises 2.8 -> 8.5 kHz on open (with two faint glass sparkles) and falls 7 -> 2.6 kHz on close. No chords, no low end.
  var AC=null,acT=null,LIFE='js/rebella-zoom-life.js?v=6',lifeLoading=false,NB=null;
  function audio(){try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;if(!AC)AC=new C();clearTimeout(acT);if(AC.state!=='running')AC.resume();return AC;}catch(e){return null;}}
  function chord(up){if(!AC)return;try{var t=AC.currentTime+0.02,d=up?0.618:0.382;
    if(!NB){var n=Math.floor(AC.sampleRate*0.8);NB=AC.createBuffer(1,n,AC.sampleRate);var c=NB.getChannelData(0);for(var i=0;i<n;i++)c[i]=Math.random()*2-1;}
    var s=AC.createBufferSource(),hp=AC.createBiquadFilter(),bp=AC.createBiquadFilter(),g=AC.createGain();s.buffer=NB;hp.type='highpass';hp.frequency.value=2000;bp.type='bandpass';bp.Q.value=1.2;
    bp.frequency.setValueAtTime(up?2800:7000,t);bp.frequency.exponentialRampToValueAtTime(up?8500:2600,t+d);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(up?0.03:0.02,t+d*0.382);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    s.connect(hp);hp.connect(bp);bp.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+d+0.05);
    if(up)[1976,2637].forEach(function(f,i){var w=t+0.236+i*0.09,dec=0.3;f*=Math.pow(2,(Math.random()*24-12)/1200);
      [[1,0.009,dec],[2.76,0.0025,dec*0.5]].forEach(function(q){var o=AC.createOscillator(),gg=AC.createGain();o.type='sine';o.frequency.value=f*q[0];
        gg.gain.setValueAtTime(0,w);gg.gain.linearRampToValueAtTime(q[1],w+0.004);gg.gain.exponentialRampToValueAtTime(0.0001,w+q[2]);o.connect(gg);gg.connect(AC.destination);o.start(w);o.stop(w+q[2]+0.05);});});
  }catch(e){}}
  // DAD'S MARK SOUND (Danny voice 15:28-15:30 AWST 25 Oct): the same logo engine as the Rebella logo (js/logo-sound.js v3, voice
  // js/logo-sound-dad.js, reference data js/music-ref-data.js), all loaded on the first Dad zoom tap (Tone.js too), never on page load.
  // Its feeds include the mark's own animation (rule 10): dad:eq-breath / dad:eq-mode from the live eq-physics model, dad:dmw = the header's
  // radiating ring phase (CSS animation time, 4.362 s cycle). OPEN/CLOSE: live mini-mapped stings, plain Web Audio so they sound at once:
  // a short map of the engine's current state (root 27-40 Hz with harmonics 2-4, a 5:8 arp in the current blend, the current dissonance,
  // a celesta ping with partials to ~12-16 kHz). Open PHI^-1 = 0.618 s, close 3x longer = 1.854 s; level follows the day curve (night 0.40,
  // extreme lows eased a further x0.618 at night) through a limiter. Only one logo sounds at a time (LogoSound solo + modal).
  var DSND={ls:'js/logo-sound.js?v=3',ref:'js/music-ref-data.js?v=1',dad:'js/logo-sound-dad.js?v=1'},dadEng=null,dadOut=null,dadLoading=null,fedPP=false;
  function inj(src){return new Promise(function(res){var sc=document.createElement('script');sc.src=src;sc.async=true;sc.onload=sc.onerror=res;document.head.appendChild(sc);});}
  function clamp1(x,a,b){return x<a?a:x>b?b:x;}
  function dc(h){h=((h%24)+24)%24;if(h<6||h>=21)return 0;if(h<12)return 0.5-0.5*Math.cos(Math.PI*(h-6)/6);if(h<=17)return 1;return 0.5+0.5*Math.cos(Math.PI*(h-17)/4);}
  var dadFeeds={
    'dad:eq-breath':function(){var m=phys&&phys.model;return m?clamp1(m.x,-1,1):null;},
    'dad:eq-mode':function(){var m=phys&&phys.model;return m?(m.mode==='demat'?1:m.mode==='snap'?0.5:0):null;},
    'dad:dmw':function(){try{var i=document.querySelector('.dmw i');var a=i&&i.getAnimations&&i.getAnimations()[0];if(!a||a.currentTime==null)return null;return Math.sin(2*Math.PI*((a.currentTime/1000)%4.362)/4.362);}catch(e){return null;}}};
  function feedPP(){if(fedPP||!window.PhiPumps||!PhiPumps.provide)return;fedPP=true;for(var k in dadFeeds)PhiPumps.provide(k,dadFeeds[k]);}
  function dadMap(){var L=null;try{L=window.LogoSound&&LogoSound.live&&LogoSound.live['dad-mark'];}catch(e){}
    var d=new Date(),h=d.getHours()+d.getMinutes()/60,day=dc(h);
    if(L&&Date.now()-L.at<120000&&typeof L.midi==='number')return {m:L.m,D:L.D,midi:L.midi,loud:L.loud,day:day};
    var P=window.PhiPumps,f=function(n){try{var v=P&&P.subscribe(n).get();return typeof v==='number'&&isFinite(v)?v:0;}catch(e){return 0;}};
    var S=0.382*(-Math.cos(2*Math.PI*h/24))+0.236*f('tide')+0.146*f('moon')+0.146*f('ratio-pump')+0.09*f('clock'),t=Date.now()/1000;
    var m=((Math.sin(2*Math.PI*t/122.9919)+Math.sin(2*Math.PI*t/76.0132+1))/2+1)/2,lg=P&&P.logo?P.logo('dad-mark'):null,Dm=lg&&lg.modes?lg.modes():0;
    return {m:m,D:clamp1(0.55+1.3*Dm,0,1),midi:23+clamp1(Math.round(3*S),-2,3),loud:0.40+0.60*day,day:day};}
  function dadSting(up){if(!AC)return;try{var q=dadMap(),t=AC.currentTime+0.02,dur=up?0.618:1.854,hz=function(n){return 440*Math.pow(2,(n-69)/12);};
    var lim=AC.createDynamicsCompressor();lim.threshold.value=-6;lim.ratio.value=20;lim.attack.value=0.003;lim.release.value=0.25;lim.connect(AC.destination);
    var M=AC.createGain();M.gain.value=0.11*q.loud*1.413;M.connect(lim);
    var hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=24;hp.connect(M);
    // sub on the root with harmonics 2,3,4 (phone-safe), rising on open, sinking on close
    var f0=hz(q.midi),ease=0.618+0.382*q.day;[1,2,3,4].forEach(function(k,i){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';
      o.frequency.setValueAtTime(f0*k*(up?0.84:1),t);o.frequency.exponentialRampToValueAtTime(f0*k*(up?1:0.84),t+dur);
      var a=[0.9,0.45,0.25,0.14][i]*(k===1?ease:1);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(a,t+dur*(up?0.236:0.146));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      o.connect(g);g.connect(hp);o.start(t);o.stop(t+dur+0.05);});
    // 5:8 mini arp in the current blend (square = electronic, triangle = orchestral) with dissonant partners when D is high
    var mode=[0,3,7,10,12],hits=[0,2,3,5,6],lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(up?900:4200,t);lp.frequency.exponentialRampToValueAtTime(up?4200:700,t+dur);lp.connect(M);
    hits.forEach(function(p,i){var w=t+p*dur/8,nn=q.midi+48+mode[up?i:4-i],len=dur/8*1.4;
      [[nn,1],[nn+(q.D>0.7?1:6),q.D>0.45?q.D*0.6:0]].forEach(function(z){if(!z[1])return;
        [['square',(1-q.m)*0.16],['triangle',q.m*0.26]].forEach(function(v){if(v[1]<0.005)return;var o=AC.createOscillator(),g=AC.createGain();o.type=v[0];o.frequency.value=hz(z[0]);o.detune.value=(Math.random()*2-1)*q.D*20;
          g.gain.setValueAtTime(0,w);g.gain.linearRampToValueAtTime(v[1]*z[1],w+(q.m>0.5?0.03:0.004));g.gain.exponentialRampToValueAtTime(0.0001,w+len);o.connect(g);g.connect(lp);o.start(w);o.stop(w+len+0.05);});});});
    // celesta ping, partials up to ~12-16 kHz (FM-like inharmonic when dissonant)
    var cf=hz(q.midi+84),w2=t+(up?dur*0.618:0.09);[[1,0.05],[2,0.018],[3.01+q.D*0.6,0.012],[4,0.008]].forEach(function(z){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=cf*z[0];
      g.gain.setValueAtTime(0,w2);g.gain.linearRampToValueAtTime(z[1],w2+0.002);g.gain.exponentialRampToValueAtTime(0.0001,w2+(up?0.5:1.2));o.connect(g);g.connect(M);o.start(w2);o.stop(w2+1.3);});
  }catch(e){}}
  function dadMusic(){if(!AC||!cur||cur.getAttribute('data-zoom')!=='dad')return;feedPP();var me=cur;
    function go(){if(cur!==me||dadEng||!window.LogoSound||!LogoSound.voices||!LogoSound.voices.dad)return;
      try{if(!dadOut){dadOut=AC.createGain();dadOut.connect(AC.destination);}
        dadEng=LogoSound.create(AC,dadOut,{voice:'dad',logo:'dad-mark',feeds:dadFeeds,events:{snap:0.146,demat:0.236,reform:0},
          subscribe:['pump:page','daytime','tide','moon','ratio-pump','clock','component:theme','phi-adapt:dad-mark','dad:eq-breath','dad:eq-mode','dad:dmw']});}catch(e){}}
    if(window.LogoSound&&LogoSound.voices&&LogoSound.voices.dad)return go();
    if(!dadLoading)dadLoading=Promise.all([window.LogoSound?0:inj(DSND.ls),window.MusicRef?0:inj(DSND.ref)]).then(function(){return (LogoSound&&LogoSound.voices&&LogoSound.voices.dad)?0:inj(DSND.dad);});
    dadLoading.then(go);}
  function life(){if(!cur||cur.getAttribute('data-zoom')!=='rebella')return;
    if(window.RebellaZoomLife){try{RebellaZoomLife.start(fig,AC);}catch(e){}return;}
    if(lifeLoading)return;lifeLoading=true;var sc=document.createElement('script');sc.src=LIFE;sc.async=true;
    sc.onload=function(){lifeLoading=false;life();};sc.onerror=function(){lifeLoading=false;};document.head.appendChild(sc);}
  function fromBtn(){var a=srcEl(cur).getBoundingClientRect();fig.style.transition='none';fig.style.transform='none';
    var b=fig.getBoundingClientRect();if(!b.width||!a.width)return 'none';
    return 'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px) scale('+(a.width/b.width)+','+(a.height/b.height)+')';}
  function open(b){if(cur)return;clearTimeout(t);try{window.QuizPopups&&QuizPopups.close();}catch(e){}
    var rb=b.getAttribute('data-zoom')==='rebella',dd=b.getAttribute('data-zoom')==='dad';if(rb){audio();chord(true);}if(dd){audio();dadSting(true);}
    cur=b;build(b);ov.hidden=false;b.setAttribute('aria-expanded','true');ov.classList.remove('is-open');
    if(!rm.matches){var f=fromBtn();fig.style.transform=f;void fig.offsetWidth;fig.style.transition='';}
    requestAnimationFrame(function(){ov.classList.add('is-open');fig.style.transform='none';});
    if(rb)life();if(dd)dadMusic();
    x.focus({preventScroll:true});}
  function close(){if(!cur)return;var b=cur;
    if(b.getAttribute('data-zoom')==='rebella'){try{window.RebellaZoomLife&&RebellaZoomLife.stop();}catch(e){}chord(false);clearTimeout(acT);acT=setTimeout(function(){try{if(AC&&!cur&&AC.state==='running')AC.suspend();}catch(e){}},1000);}
    if(b.getAttribute('data-zoom')==='dad'){if(dadEng){try{dadEng.stop(0.382);}catch(e){}dadEng=null;}dadSting(false);clearTimeout(acT);acT=setTimeout(function(){try{if(AC&&!cur&&AC.state==='running')AC.suspend();}catch(e){}},2618);}
    b.setAttribute('aria-expanded','false');ov.classList.remove('is-open');
    if(rm.matches){ov.hidden=true;endPhys();}else{var f=fromBtn();fig.style.transform='none';void fig.offsetWidth;fig.style.transition='';fig.style.transform=f;
      t=setTimeout(function(){ov.hidden=true;fig.style.transform='';endPhys();},D);}
    cur=null;b.focus({preventScroll:true});}
  btns.forEach(function(b){b.setAttribute('aria-expanded','false');b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(b);});});
  x.addEventListener('click',function(e){e.stopPropagation();close();});
  ov.addEventListener('click',function(e){if(!fig.contains(e.target))close();});
  document.addEventListener('keydown',function(e){if(!cur)return;
    if(e.key==='Escape'||e.key==='Esc'){e.preventDefault();e.stopPropagation();close();}
    else if(e.key==='Tab'){e.preventDefault();x.focus({preventScroll:true});}},true);
  function byName(n){for(var i=0;i<btns.length;i++)if(btns[i].getAttribute('data-zoom')===n)return btns[i];return btns[0];}
  window.LogoZoom={open:function(n){open(byName(n));},close:close,isOpen:function(){return !!cur;}};
  window.DadMarkZoom={open:function(){open(byName('dad'));},close:close,isOpen:function(){return !!cur;}};
})();
