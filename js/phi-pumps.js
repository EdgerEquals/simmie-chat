/* KIDS CLUB COPY for Bonnie's sites (rebella js/phi-pumps.js = simmie-chat js/phi-pumps.js), from dad-page 8e1ce3c. Changes: 'daytime'
   comes from the sun at the one coarse city point (js/season-pumps.js: +1 full day .. -1 full rest, easing through dusk and dawn), not
   the clock hour. Continuity offset OFF on now() (rhythm-continuity.js, Kids Club standard 26 Oct 2026).
   Everything else unchanged (its fixed values stay listed for Danny). */
/* PHI PUMPS: the page-level pump root (Danny 15:18 AWST 25 Oct 2026). The WHOLE QUESTIONNAIRE PAGE is the parent entity of a pump tree
   whose pump counts follow Fibonacci down the tree: page 13 -> a logo 8 -> each sound layer 5 -> each chain parameter 3 -> small details 2.
   A node with N pumps = N slow sine modes on golden steps: periods PHI^(k0 + j/2) s, j = 0..N-1, phases 2 pi frac((j+1+seed) x 0.618)
   (golden angle). Its output = parent output x (1 + depth x mean of its modes), so a parent's output is the INPUT-POWER SCALER of every
   child: scale the parent and the whole branch scales. Page: 13 modes PHI^4..PHI^10 (6.85 s .. 123 s), depth 0.146.
   Cheap: no timers, no rAF, no storage; values are computed only when something reads them. Loaded at idle (tier 2). Only the Rebella logo
   zoom's sound (js/logo-sound.js) reads it for now; nothing else on the page is wired to it yet.
   REGISTRY (Danny rule 10 'logo = microcosm of the site'): page entities are PROVIDED here once and logos SUBSCRIBE to them by name instead of
   keeping their own constants. Every provider is a cheap read-on-demand function returning a number in -1..1 (or 0..1 where noted), or
   null when the page has no value. Provided now (nothing else on the page is rewired to them):
     pump:page        the page pump root output (around 1, +-0.146)
     daytime          local hour, -cos(2 pi (h + min/60)/24): -1 midnight .. +1 noon
     clock            seconds/minutes drift, sin(2 pi (secs within the hour)/3600)
     moon             -cos(2 pi phase): -1 new .. +1 full (phase from the 2000-01-06 18:14 UTC new moon, synodic 29.530588853 d)
     tide             the footer tide strip's cached Open-Meteo Marine reading (localStorage 'dadQuizTide', else sessionStorage
                      'logoSound.tide'): this hour's sea level within today's low..high, -1 low .. +1 high; null if nothing cached
     ratio-pump       RatioPump.pump() (0.887..1) mapped to -1..+1; null without the ratio pump
     phi-adapt:<id>   on-device affinity for a shared component id, 1 - exp(-score/PHI^3), 0..1 (js/phi-adapt.js); 0 without data
     component:theme  +1 light theme, -1 dark
   API: PhiPumps.node(name, n, k0, depth, parent, seed) -> {name, n, out(t?), modes(t?), parent}; PhiPumps.page; PhiPumps.now();
        PhiPumps.provide(name, fn); PhiPumps.subscribe(name) -> {name, get()}; PhiPumps.names();
        PhiPumps.logo(id) -> the shared 8-pump logo node for that logo (child of the page), created on first use. */
(function(){
  'use strict';
  var PHI=1.6180339887,G=0.6180339887,T0=(window.performance&&performance.now)?performance.now():Date.now();
  var OFF=0;   // continuity offset (s): js/rhythm-continuity.js fast-forwards the whole tree to wall-clock now after a reload or time away
  function now(){return ((window.performance&&performance.now)?performance.now():Date.now())/1000+OFF;}
  function node(name,n,k0,depth,parent,seed){var P=[],ph=[];seed=seed||0;
    for(var j=0;j<n;j++){P.push(Math.pow(PHI,k0+j/2));ph.push(2*Math.PI*(((j+1+seed)*G)%1));}
    function modes(t){if(t==null)t=now();var s=0;for(var j=0;j<n;j++)s+=Math.sin(2*Math.PI*t/P[j]+ph[j]);return s/n;}
    return {name:name,n:n,k0:k0,depth:depth,parent:parent||null,periods:P,modes:modes,
      out:function(t){if(t==null)t=now();var p=parent?parent.out(t):1;return p*(1+depth*modes(t));}};}
  var page=node('page',13,4,0.146,null,0),reg={};
  function provide(n,fn){reg[n]=fn;}
  function subscribe(n){return {name:n,get:function(){var f=reg[n],m=/^phi-adapt:(.+)$/.exec(n);
    if(!f&&m)f=function(){var sc=0;try{sc=window.PhiAdapt?PhiAdapt.score(m[1]):0;}catch(e){}return 1-Math.exp(-sc/4.236);};
    if(!f)return null;try{var v=f();return (typeof v==='number'&&isFinite(v))?v:null;}catch(e){return null;}}};}
  function hrs(){var d=new Date();return d.getHours()+d.getMinutes()/60+d.getSeconds()/3600;}
  function tideRead(){var c=null;try{c=JSON.parse(localStorage.getItem('dadQuizTide')||'null');}catch(e){}
    if(!(c&&c.d&&c.d.hourly)){try{c=JSON.parse(sessionStorage.getItem('logoSound.tide')||'null');}catch(e){c=null;}}
    var h=c&&c.d&&c.d.hourly;if(!h||!h.time||!h.sea_level_height_msl)return null;
    var p={};try{new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Perth',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value;});}catch(e){return null;}
    var i0=h.time.indexOf(p.year+'-'+p.month+'-'+p.day+'T00:00');if(i0<0)return null;var day=h.sea_level_height_msl.slice(i0,i0+25).filter(function(v){return typeof v==='number';});
    var v=h.sea_level_height_msl[i0+Number(p.hour)];if(typeof v!=='number'||day.length<2)return null;var lo=Math.min.apply(null,day),hi=Math.max.apply(null,day);
    return hi>lo?2*(v-lo)/(hi-lo)-1:0;}
  provide('pump:page',function(){return page.out();});
  provide('daytime',function(){var SP=window.SeasonPumps;if(SP)try{return 1-2*SP.restShare(SP.sunHeight(new Date()));}catch(e){}return -Math.cos(2*Math.PI*hrs()/24);});   // unit: 24 h per day (fallback only)
  provide('clock',function(){return Math.sin(2*Math.PI*((Date.now()/1000)%3600)/3600);});
  provide('moon',function(){var ph=(((Date.now()-947182440000)/86400000/29.530588853)%1+1)%1;return -Math.cos(2*Math.PI*ph);});
  provide('tide',tideRead);
  provide('ratio-pump',function(){var R=window.RatioPump;if(!R||!R.pump)return null;var p=+R.pump();return isFinite(p)?Math.max(-1,Math.min(1,2*(p-0.887)/(1-0.887)-1)):null;});
  provide('component:theme',function(){return document.documentElement.getAttribute('data-theme')==='light'?1:-1;});
  var logos={};function logo(id){return logos[id]||(logos[id]=node('logo:'+id,8,3,0.09,page,1));}   // one shared logo node per logo id (sound + visuals hang off it)
  // continuity (Kids Club 'Rhythms keep going while you're away'): the tree's time is saved and caught up analytically
  // (every mode is a sine of t, so t = saved + time away); the logo nodes hang off the page node, so they come along
  if(window.RhythmContinuity)RhythmContinuity.register('pumps',{save:function(){return {t:now()};},
    catchUp:function(e,s,m){if(m!=='restart'&&s&&isFinite(s.t))OFF+=s.t+e-now();},reset:function(){OFF-=now();}});
  window.PhiPumps={node:node,now:now,PHI:PHI,page:page,logo:logo,provide:provide,subscribe:subscribe,names:function(){return Object.keys(reg);}};
})();
