/* Questionnaire pop-up panels (Danny t660u 13:43 AWST 24 Oct 2026, live). See css/quiz-popups.css for the rules.
   One delegated click/keydown listener on document, so it keeps working if other jobs rebuild an element (e.g. #tstat).
   Content comes only from what the page already has (SIM_WX + its localStorage cache, SIM_BEACON, TermStatus, the footer
   lights, the ticker's facts, the tide strip's own label/svg, the moon-phase maths, the tty lines, navigator.onLine).
   No new network requests; the beacon's "Check again" re-runs the page's own existing Rebella check (what a tap used to do).
   One panel at a time; closes on tap outside, the X, or Esc; focus goes to the panel and back to the item on X/Esc. */
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id);};
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function awst(d,sec){try{return (d||new Date()).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',second:sec?'2-digit':undefined,hour12:false,timeZone:'Australia/Perth'})+' AWST';}catch(e){return '';}}
  function kv(rows){return '<dl class="qp-kv">'+rows.filter(Boolean).map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>';}).join('')+'</dl>';}
  function txt(el){return el?(el.textContent||'').replace(/\s+/g,' ').trim():'';}
  function online(){return navigator.onLine!==false;}
  function latency(){try{var l=performance.getEntriesByType('resource').filter(function(e){return /edgerequals\.github\.io\/rebella\/(\?|$)/.test(e.name);});return l.length?Math.round(l[l.length-1].duration)+' ms':'n/a';}catch(e){return 'n/a';}}
  function beacon(){var b=window.SIM_BEACON||{};return b.state==='live'?'live':b.state==='down'?'down':'checking';}
  var COND={sun:'Sunny',hot:'Hot',cloud:'Cloudy',fog:'Foggy',rain:'Rainy',storm:'Stormy',night:'Clear night',snow:'Snowy'};
  var MOON=['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'];
  function moonAge(){var a=((Date.now()-Date.UTC(2000,0,6,18,14))/864e5)%29.530588853;return a<0?a+29.530588853:a;}

  // [selector, title, render()] ; the DJ pill is excluded (it already has its own pop-up)
  var T=[
    ['.qh-logo','Rebella',function(){return '<p>Bonnie&rsquo;s logo. Rebella is Bonnie&rsquo;s site; this questionnaire from Dad helps shape what goes on it.</p><p class="qp-note">Nothing here leaves this page.</p>';}],
    ['#beacon','Rebella status',function(){var b=$('beacon');return kv([['state',beacon().toUpperCase()],['detail',(b&&b.title)||''],['response',latency()],['device',online()?'online':'offline']])+
      '<p class="qp-note">The page checks Rebella on load and every 60 s.</p><button type="button" class="qp-btn" data-qp-act="recheck">&#x21bb; Check again</button>';}],
    ['#tstat','Terminal status',function(){var ts=window.TermStatus,ph=ts&&ts.phase?ts.phase():'',live=ts&&ts.live?ts.live():online();
      return '<div class="qp-term">'+(live?'status: <span class="r">live</span>':'status: <span class="m">away :(</span>')+'\nphase:  '+esc(ph||'n/a')+'\nrebella '+esc(beacon())+' &middot; '+esc(latency())+'\nlink    '+esc(online()?'ok':'off')+'\ndevice  '+(online()?'online':'offline')+'\ntime    '+esc(awst(null,true))+'</div>'+
        '<p class="qp-note">Live means the device is online and the Rebella check isn&rsquo;t down.</p>';}],
    ['#wx','Weather in Perth',function(){var w=window.SIM_WX||{},c=null;try{c=JSON.parse(localStorage.getItem('dadWxPerth')||'null');}catch(e){}
      return '<p class="qp-big">'+esc(txt($('wxIcon')))+'</p>'+kv([['now',(COND[w.cond]||'n/a')+(w.temp!=null?', '+Math.round(w.temp)+'\u00B0C':'')],w.say?['note','It\u2019s '+w.say]:null,['day/night',c?(c.day?'day':'night'):'n/a'],['updated',c&&c.t?awst(new Date(c.t)):'n/a'],w.forced?['preview','?weather='+w.forced]:null])+
        '<p class="qp-note">Open-Meteo current weather for Perth, refreshed at most every 30 min.</p>';}],
    ['#wxr','Weather faces',function(){var r=$('wxr'),f=r?[].map.call(r.querySelectorAll('.fs>span'),txt).join(' '):'',o=r?[].map.call(r.querySelectorAll('.os>span'),txt).join(' '):'';
      return '<p>Dad&rsquo;s little reaction to today&rsquo;s weather.</p>'+kv([['faces',f||'n/a'],['offering',o||'n/a']]);}],
    ['.tick .tview','Fun facts from Dad',function(){var s=[].slice.call(document.querySelectorAll('#ttrack>span'));s=s.slice(0,Math.max(1,Math.ceil(s.length/2)));
      var li=s.map(function(x){var t=x.querySelector('.ts'),c=x.querySelector('.tc');return '<li>'+esc(t?txt(t).replace(/^"|"$/g,''):txt(x))+(c?' <span class="src">'+esc(txt(c).replace(/^\/\/\s*/,''))+'</span>':'')+'</li>';}).join('');
      return '<p class="qp-note">Picked for age '+esc(window.SIM_AGE?window.SIM_AGE():13)+'.</p><ul class="qp-list">'+(li||'<li>Loading&hellip;</li>')+'</ul>';}],
    ['.qh-mast .dh-sub','Questions for Bonnie',function(){return '<p>'+esc(txt(document.querySelector('.dh-sub')))+'</p>';}],
    ['.qh-mast .dh-brand','Questions for Bonnie',function(){var q=$('quiz'),c=$('count');return '<p>From Dad. '+esc(txt(document.querySelector('.dh-sub')))+'</p>'+kv([['progress',q&&!q.hidden?txt(c):($('summary')&&!$('summary').hidden?'finished':'not started')],['answered',txt($('vDone'))||'0']]);}],
    ['#ltStep','STEP',function(){return kv([['question',txt($('vStep'))],['state',$('quiz')&&!$('quiz').hidden?'in progress':'waiting']])+'<p class="qp-note">Which question you&rsquo;re on.</p>';}],
    ['#ltDone','DONE',function(){return kv([['answered',txt($('vDone'))]])+'<p class="qp-note">Questions answered so far (kept on this page only).</p>';}],
    ['#ltSky','SKY',function(){var w=window.SIM_WX||{};return kv([['weather feed',w.status==='ok'?'OK':w.status==='fail'?'not available':'loading'],['sky',COND[w.cond]||'n/a']]);}],
    ['#ltLink','LINK',function(){return kv([['device',online()?'online':'offline'],['rebella',beacon()],['response',latency()]]);}],
    ['#ro','Clock & age dial',function(){return kv([['Perth time',awst(null,true)],['age dial',(window.SIM_AGE?window.SIM_AGE():13)+(window.SIM_AGE_SRC==='url'?' (preview ?age)':'')]])+'<p class="qp-note">Everything on the page is written for this age.</p>';}],
    ['#fcr','Footer critters',function(){var a=moonAge();return '<p class="qp-big">'+esc(txt(document.querySelector('#fcr .ct>span')))+'</p>'+kv([['moon',MOON[Math.floor(a/29.530588853*8+0.5)%8]],['moon age',a.toFixed(1)+' days']])+'<p class="qp-note">The Moon&rsquo;s phase sets the critters&rsquo; order.</p>';}],
    ['#fts','Tide & swell',function(){var h=$('fts'),s=h&&h.querySelector('svg'),c=s?s.cloneNode(true):null;if(c){c.setAttribute('class','qp-tide');}
      return (c?c.outerHTML:'')+'<p>'+esc((h&&h.getAttribute('aria-label'))||'Tide data not loaded.')+'</p>';}],
    ['#footLine','Today',function(){var F=window.FootLine;if(!F||!F.today)return '<p>Loading&hellip;</p>';var c=F.current();
      return F.today().map(function(it){var on=c&&c.type===it.type;return '<p'+(on?' class="qp-big" style="font-size:1em"':'')+'>'+esc(it.emoji)+' <b>'+esc(it.label)+'</b><br>'+esc(it.type==='quote'?it.full+' \u2014 '+it.by:it.full)+(it.src?'<br><span class="qp-note">'+esc(it.src)+'</span>':'')+'</p>';}).join('')+
        '<p class="qp-note">'+esc(txt(document.querySelector('[data-copy="credit"]')))+'. Changes at midnight Perth time.</p>';}],
    ['.foot .note > span[data-copy]','About this page',function(){return '<p>'+esc(txt(document.querySelector('[data-copy="credit"]')))+'.</p><p class="qp-note">Nothing on this page is sent anywhere.</p>';}],
    ['.foot .ttybar','simmie &mdash; tty',function(){return tty();}],
    ['.foot .tout','simmie &mdash; tty',function(){return tty();}],
    ['#footSimmie','Simmie',function(){return tty();}]
  ];
  function tty(){return '<div class="qp-term">'+esc(txt($('tprev')))+'\n'+esc(txt($('tcur')))+'</div><p class="qp-note">Type in the simmie$ box to chat. Preview only, nothing is sent.</p>';}
  var SEL=T.map(function(t){return t[0];}).join(',');
  function match(el){if(!el||!el.closest)return null;for(var i=0;i<T.length;i++){var m=el.closest(T[i][0]);if(m)return {el:m,t:T[i]};}return null;}
  function excluded(el){return !el||!el.closest||!!el.closest('.qp-pop,#dj-pill,#qh-djpop,.tin,input,textarea,select,main');}

  function decorate(){[].forEach.call(document.querySelectorAll(SEL),function(el){if(el.classList.contains('qp-trig'))return;
    var m=match(el);el.classList.add('qp-trig');if(!/^(BUTTON|A)$/.test(el.tagName)){el.setAttribute('role','button');el.setAttribute('tabindex','0');}
    el.removeAttribute('aria-hidden');el.setAttribute('aria-haspopup','dialog');el.setAttribute('aria-expanded','false');
    if(!el.getAttribute('aria-label')||el.id==='beacon'||el.id==='fts'){}else{} if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',m.t[1].replace(/&mdash;/,'\u2014')+' (opens a panel)');});}

  var pop=document.createElement('div');pop.className='qp-pop';pop.id='qp-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-modal','false');pop.tabIndex=-1;pop.hidden=true;
  pop.innerHTML='<button type="button" class="qp-x" aria-label="Close">&times;</button><div class="qp-h" id="qp-h"><span class="qp-dot" aria-hidden="true"></span><span></span></div><div class="qp-b"></div>';
  pop.setAttribute('aria-labelledby','qp-h');document.body.appendChild(pop);
  var cur=null,timer=null;
  function place(){if(!cur)return;var r=cur.el.getBoundingClientRect(),vw=document.documentElement.clientWidth||innerWidth,vh=innerHeight,pw=pop.offsetWidth,ph=pop.offsetHeight,g=6;
    var x=Math.min(Math.max(8,r.left+r.width/2-pw/2),vw-8-pw),below=r.bottom+g,above=r.top-g-ph,y;
    if(r.top+r.height/2<vh/2)y=below+ph<=vh-8?below:Math.max(8,vh-8-ph);else y=above>=8?above:8;
    pop.style.left=Math.round(Math.max(8,x))+'px';pop.style.top=Math.round(y)+'px';}
  function fill(){pop.querySelector('.qp-h span:last-child').innerHTML=cur.t[1];pop.querySelector('.qp-b').innerHTML=cur.t[2]();place();}
  function open(m){close(false);cur=m;pop.hidden=false;fill();m.el.setAttribute('aria-expanded','true');
    requestAnimationFrame(function(){pop.classList.add('is-open');});pop.focus({preventScroll:true});
    timer=setInterval(function(){if(cur&&(cur.t[0]==='#tstat'||cur.t[0]==='#beacon'||cur.t[0]==='#ro'||cur.t[0]==='#ltLink'||cur.t[0].indexOf('tty')>=0||cur.t[0]==='.foot .tout'||cur.t[0]==='#footSimmie')){var b=pop.querySelector('.qp-b'),s=b.scrollTop;b.innerHTML=cur.t[2]();b.scrollTop=s;place();}},1000);}
  function close(refocus){if(!cur)return;var el=cur.el;clearInterval(timer);cur=null;pop.classList.remove('is-open');pop.hidden=true;el.setAttribute('aria-expanded','false');if(refocus&&el.isConnected)el.focus({preventScroll:true});}
  var pass=false;
  document.addEventListener('click',function(e){
    if(pass)return;var t=e.target;
    if(t.closest&&t.closest('.qp-x')){close(true);return;}
    if(t.closest&&t.closest('[data-qp-act="recheck"]')){var b=$('beacon');if(b){pass=true;try{b.click();}finally{pass=false;}}setTimeout(function(){if(cur)fill();},50);return;}
    if(excluded(t))return;var m=match(t);if(!m)return;
    e.preventDefault();e.stopPropagation();   // capture phase: the item's old inline action (beacon re-check) no longer runs on tap
    if(cur&&cur.el===m.el)close(false);else open(m);
  },true);
  document.addEventListener('keydown',function(e){
    if((e.key==='Escape'||e.key==='Esc')&&cur){e.preventDefault();close(true);return;}
    if((e.key==='Enter'||e.key===' ')&&!excluded(e.target)){var m=match(e.target);if(m&&m.el===e.target&&m.el.getAttribute('role')==='button'){e.preventDefault();if(cur&&cur.el===m.el)close(true);else open(m);}}
  });
  document.addEventListener('pointerdown',function(e){if(!cur)return;var t=e.target;if(pop.contains(t)||cur.el.contains(t))return;close(false);},true);
  addEventListener('resize',function(){place();});addEventListener('scroll',function(){if(cur){if(!cur.el.isConnected||cur.el.getClientRects().length===0)close(false);else place();}},{passive:true});
  decorate();
  try{new MutationObserver(function(){decorate();if(cur&&!cur.el.isConnected)close(false);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});}catch(e){}
  window.QuizPopups={open:function(sel){var el=document.querySelector(sel),m=match(el);if(m)open(m);},close:function(){close(false);},items:function(){return T.map(function(t){return t[0];});}};
})();
