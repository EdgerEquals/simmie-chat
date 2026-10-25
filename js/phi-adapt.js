/* PHI-ADAPT: the private usage feedback loop (Danny's adaptive golden-ratio principle, /home/box/.config/adaptive-phi-principle.md, t744u 25 Oct 2026).
   One shared module and ONE shared schema (docs/phi-adapt.md) so every page, and later the prompting, learns from the same signals:
   "same data, different faces".
   WHAT IT COUNTS, on this device only (localStorage 'phiAdapt.v1'): for a small fixed set of component ids (e.g. 'rebella-logo', 'dj'),
   how often the visitor OPENS it (o), TAPS it (t) or LINGERS on it (l = it stayed at least half on screen for PHI^2 = 2.618 s, at most once
   per PHI^4 = 6.854 s). Never typed text, chat, passwords, names, positions, URLs or timestamps; nothing is ever sent anywhere.
   WHAT IT DOES: score = o*PHI + t + l/PHI. Each new browser session first decays every count by 1/PHI (old habits fade), then the page's
   tier-2/3 jobs (js/load-tiers.js) are gently re-ranked: job key = position - PHI^2 * score/maxScore (a favourite moves up at most ~2.6
   places; jobs marked first/last stay put; nothing changes until the total score reaches PHI^3 = 4.236), and the gap after each job is
   quantised to golden steps: PHI^-3 0.236 s (top third of use), PHI^-2 0.382 s (default), PHI^-1 0.618 s (rarely used).
   COST: loaded as the FIRST tier-2 job (idle, after load); no first-load work. API: window.PhiAdapt.signal(id,kind) / score(id) / rank(ids) /
   gap(id) / snapshot() / clear().
   v2 (25 Oct 2026, Kids Club core standard 'golden-ratio dials, one closed feedback loop', Danny's go t816u): the SAME record now also
   carries the dials (js/phi-dials.js) in an extension slot (x), so there is still ONE store. Live events are never stored: each event
   goes into an in-memory session tally, and only a share of it passes up into the long-term profile (pass hook = the information
   filter dial; without dials the share is 1, i.e. exactly as before). Also on Bonnie's pages (Rebella, dashboard, chat) via
   js/ratio-pump.js's idle loader. Extra API: ext(name[,obj]) / save() / session() / onPass(fn) / sessions(). */
(function(){
  'use strict';
  var PHI=1.6180339887,KEY='phiAdapt.v1',SKEY='phiAdapt.session',MAXC=64,ID=/^[a-z0-9-]{1,32}$/,
      page=(location.pathname.split('/').pop()||'index').replace(/\.html?$/,'').replace(/[^a-z0-9-]/gi,'').toLowerCase().slice(0,32)||'index';
  // component id -> where it lives on this page. Ids are SHARED across pages (the Rebella logo is 'rebella-logo' everywhere).
  var MAP={'dad-mark':'.q-head [data-zoom="dad"]','rebella-logo':'.q-head [data-zoom="rebella"]','dj':'#dj-pill,#qh-djpop,#dad-dj',
    'status':'#beacon','theme':'#thm','tty':'#tty','ticker':'#tick','weather':'#wx,#wxr,#wx-chip','quiz':'#quiz','summary':'#summary','foot':'#foot,#app-foot',
    // Bonnie's pages (component ids only; never the text, value or position of anything)
    'nav':'#burger,#drawer','search':'#search-btn,#searchbar','help':'.help-orb','brand':'.brand','agedial':'#agedial','ask-dad':'#ask-dad,#dad-panel',
    'queue':'#queue','log':'#log','lock':'#lock,#lock-btn'};
  var d=load(),dirty=0,saveT=0,sess={},passFn=null;
  function blank(){return {v:1,n:0,c:{},p:{}};}
  function load(){try{var x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&x.v===1&&x.c&&typeof x.c==='object')return x;}catch(e){}return blank();}
  function r3(v){return Math.round(v*1000)/1000;}
  function save(){dirty=0;clearTimeout(saveT);try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}
  function soon(){dirty=1;clearTimeout(saveT);saveT=setTimeout(save,4236);}            // PHI^3 s debounce
  // new session: decay by 1/PHI, drop dust, count the session
  (function(){var fresh=true;try{fresh=!sessionStorage.getItem(SKEY);sessionStorage.setItem(SKEY,'1');}catch(e){fresh=false;}
    if(!fresh)return;var c=d.c;for(var k in c){if(!ID.test(k)){delete c[k];continue;}var e=c[k],s=0;['o','t','l'].forEach(function(f){e[f]=r3((+e[f]||0)/PHI);s+=e[f];});if(s<0.01)delete c[k];}
    d.n=(d.n|0)+1;d.p[page]=(d.p[page]|0)+1;save();})();
  function share(id){if(!passFn)return 1;var w=1;try{w=+passFn(id);}catch(e){}return w>=0&&w<=1?w:1;}
  function signal(id,kind){if(!ID.test(id||'')||'otl'.indexOf(kind)<0||kind.length!==1)return;var c=d.c;
    var s=sess[id]||(sess[id]={o:0,t:0,l:0});s[kind]++;                                  // session tally (memory only)
    if(!c[id]){if(Object.keys(c).length>=MAXC)return;c[id]={o:0,t:0,l:0};}c[id][kind]=r3((c[id][kind]||0)+share(id));soon();}
  function score(id){var e=d.c[id];return e?e.o*PHI+e.t+e.l/PHI:0;}
  function stats(){var m=0,s=0;for(var k in d.c){var v=score(k);s+=v;if(v>m)m=v;}return {max:m,total:s};}
  function rank(ids){var S=stats();if(S.total<4.236||!S.max)return ids.slice();
    return ids.map(function(id,i){return {id:id,k:i-PHI*PHI*score(id)/S.max,i:i};}).sort(function(a,b){return a.k-b.k||a.i-b.i;}).map(function(x){return x.id;});}
  function gap(id){var S=stats();if(S.total<4.236||!S.max||!id)return 382;var r=score(id)/S.max;return r>=0.618?236:(r<0.236?618:382);}
  // taps and opens: one passive capture listener; only the component id is kept, never the target's text or value
  function which(el){for(var k in MAP){try{if(el.closest&&el.closest(MAP[k]))return k;}catch(e){}}return null;}
  document.addEventListener('click',function(ev){var t=ev.target;if(!t||!t.closest)return;var id=which(t);if(!id)return;
    var b=t.closest('button,[role=button],a,summary,[aria-haspopup]');signal(id,b&&(b.hasAttribute('aria-haspopup')||b.hasAttribute('data-zoom')||b.hasAttribute('aria-expanded'))?'o':'t');},{capture:true,passive:true});
  // lingering: at least half visible for PHI^2 s while the page is visible; at most once per PHI^4 s per component
  if(window.IntersectionObserver){var timers={},lastL={},io=new IntersectionObserver(function(es){es.forEach(function(e){var id=e.target.getAttribute('data-pa-id');
      if(e.isIntersecting&&e.intersectionRatio>=0.5){if(!timers[id])timers[id]=setTimeout(function(){timers[id]=0;var n=Date.now();if(!document.hidden&&(!lastL[id]||n-lastL[id]>6854)){lastL[id]=n;signal(id,'l');}},2618);}
      else{clearTimeout(timers[id]);timers[id]=0;}});},{threshold:[0,0.5]});
    for(var k in MAP){var el=null;try{el=document.querySelector(MAP[k]);}catch(e){}if(el&&!el.hasAttribute('data-pa-id')){el.setAttribute('data-pa-id',k);io.observe(el);}}}
  addEventListener('pagehide',function(){if(dirty)save();});
  document.addEventListener('visibilitychange',function(){if(document.hidden&&dirty)save();});
  function ext(name,obj){if(!ID.test(name||''))return null;d.x=d.x&&typeof d.x==='object'?d.x:{};if(obj!==undefined){d.x[name]=obj;soon();}
    return d.x[name]?JSON.parse(JSON.stringify(d.x[name])):null;}
  window.PhiAdapt={signal:signal,score:score,rank:rank,gap:gap,page:page,ext:ext,save:save,onPass:function(fn){passFn=typeof fn==='function'?fn:null;},
    session:function(){return JSON.parse(JSON.stringify(sess));},sessions:function(){return d.n|0;},
    snapshot:function(){return JSON.parse(JSON.stringify(d));},clear:function(){d=blank();try{localStorage.removeItem(KEY);}catch(e){}}};
  if(window.LoadTiers&&LoadTiers.adapt)LoadTiers.adapt({rank:rank,gap:gap});
})();
