/* quiz-tty2.js: Simmie tty panel, redesign 2 (Danny t709u, 25 Oct 2026 13:11 AWST), questionnaire only.
   - Three live bar graphs replace the window dots, each fed by a real page stream (numbers only, never any text):
       LOG  mission-log lines per PHI^3 Simmie slot (2.06 s), last 7 slots, newest on the right (counted when a line moves up);
       QZ   quiz progress: DONE / total spread over 6 bars, the bar holding the current STEP pulses (#vDone, #vStep);
       NET  duration of the page's last 7 network requests (Resource Timing), log scale 10 ms..1.6 s; red bars when offline.
   - A rolling readout where the 'simmie - tty' title was (session up-time, log lines, last request ms, step), rolling up every
     PHI^4 Simmie = 3.33 s; mission-log lines rise into place; matrix rain columns on the right edge; satellite bobs.
   Reduced motion: values still update, but no rolling, rising or rain. Paused with the page (body.paused) or a hidden tab. */
(function(){
  'use strict';
  var PHI=1.6180339887,SIM=Math.pow(PHI,-1.5),RM=matchMedia('(prefers-reduced-motion: reduce)');
  function $(id){return document.getElementById(id);}
  var bar=document.querySelector('.foot .ttybar');if(!bar||bar._t2)return;bar._t2=1;
  var t0=Date.now(),lines=0,lastMs=null;
  function graph(id,label,n,cls){var g=document.createElement('span');g.className='tg '+cls;g.id=id;g.setAttribute('role','img');
    var h='<b class="tgl" aria-hidden="true">'+label+'</b><span class="tgb" aria-hidden="true">';for(var i=0;i<n;i++)h+='<i style="--k:'+i+'"></i>';
    g.innerHTML=h+'</span>';return g;}
  var gLog=graph('tgLog','LOG',7,'tg-log'),gQz=graph('tgQz','QZ',6,'tg-qz'),gNet=graph('tgNet','NET',7,'tg-net');
  var dots=bar.querySelectorAll(':scope > i');Array.prototype.forEach.call(dots,function(d){d.remove();});
  var wrap=document.createElement('span');wrap.className='tgs';wrap.appendChild(gLog);wrap.appendChild(gQz);wrap.appendChild(gNet);
  bar.insertBefore(wrap,bar.firstChild);
  var roll=document.createElement('span');roll.className='troll';roll.setAttribute('aria-hidden','true');roll.innerHTML='<span class="trw"><b></b><b></b></span>';
  var tt=bar.querySelector('.tt');if(tt)tt.replaceWith(roll);else bar.insertBefore(roll,bar.querySelector('.sat'));
  function set(g,vals,lab){var b=g.querySelectorAll('.tgb i');for(var i=0;i<b.length;i++){var v=Math.max(0.12,Math.min(1,vals[i]||0));b[i].style.setProperty('--v',v.toFixed(3));}g.setAttribute('aria-label',lab);g.title=lab;}

  // ---- LOG: count new mission-log lines (the previous line changes each time a new one starts) ----
  var prev=$('tprev'),cur=$('tcur'),slots=[0,0,0,0,0,0,0],lastPrev=prev?prev.innerHTML:'';
  // throughput = characters Simmie prints per slot (lengths only; the input box is never read), plus a kick for each new line
  var curLen=cur?cur.textContent.length:0;
  if(prev&&window.MutationObserver)new MutationObserver(function(){if(prev.innerHTML===lastPrev)return;lastPrev=prev.innerHTML;lines++;slots[6]+=8;rise();drawLog();}).observe(prev,{childList:true,characterData:true,subtree:true});
  if(cur&&window.MutationObserver)new MutationObserver(function(){var n=cur.textContent.length;if(n>curLen)slots[6]+=n-curLen;curLen=n;}).observe(cur,{childList:true,characterData:true,subtree:true});
  setInterval(function(){if(!document.hidden)drawLog();},382);
  function drawLog(){var mx=Math.max(40,Math.max.apply(null,slots));set(gLog,slots.map(function(x){return Math.sqrt(x/mx);}),'Mission log throughput: '+slots[6]+' characters in the current 2 s slot, '+lines+' lines this visit');}
  setInterval(function(){if(document.hidden||document.body.classList.contains('paused'))return;slots.shift();slots.push(0);drawLog();},Math.round(Math.pow(PHI,3)*SIM*1000));
  function rise(){if(RM.matches||!cur.animate)return;var o={duration:382,easing:'cubic-bezier(.3,1.45,.55,1)'};
    cur.animate([{transform:'translateY(100%)',opacity:.2},{transform:'translateY(0)',opacity:1}],o);
    prev.animate([{transform:'translateY(100%)'},{transform:'translateY(0)'}],o);}

  // ---- QZ: DONE / total, current STEP ----
  var vS=$('vStep'),vD=$('vDone');
  function drawQz(){var s=(vS&&vS.textContent)||'--',m=s.match(/(\d+)\s*\/\s*(\d+)/),total=m?+m[2]:12,step=m?+m[1]:0,done=+(vD&&vD.textContent)||0,v=[],k;
    for(k=0;k<6;k++)v.push(Math.max(0,Math.min(1,done*6/total-k)));
    var cb=gQz.querySelectorAll('.tgb i');for(k=0;k<cb.length;k++)cb[k].classList.toggle('on',!!step&&k===Math.min(5,Math.floor((step-1)*6/total)));
    set(gQz,v,'Quiz progress: '+done+' of '+total+' answered'+(step?', on question '+step:''));}
  [vS,vD].forEach(function(e){if(e&&window.MutationObserver)new MutationObserver(drawQz).observe(e,{childList:true,characterData:true,subtree:true});});

  // ---- NET: Resource Timing durations of the page's own requests ----
  var net=[];
  function addNet(d){net.push(d);if(net.length>7)net.shift();lastMs=Math.round(d);drawNet();}
  function drawNet(){var on=navigator.onLine;gNet.classList.toggle('off',!on);var v=[];for(var i=0;i<7;i++){var d=net[i-(7-net.length)];v.push(d==null?0:Math.log(Math.max(10,d)/10)/Math.log(160));}
    var slow=lastMs!=null&&lastMs>800;gNet.classList.toggle('slow',slow);
    set(gNet,on?v:v.map(function(){return .12;}),on?('Network: last request '+(lastMs!=null?lastMs+' ms':'pending')+', last '+net.length+' requests'):'Network: offline');}
  try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.duration>0&&/^https?:/.test(e.name))addNet(e.duration);});}).observe({type:'resource',buffered:true});}catch(e){}
  addEventListener('online',drawNet);addEventListener('offline',drawNet);

  // ---- rolling readout (numbers only): one cell cycling the stats on phones, four cells side by side on wider screens ----
  function stat(i){var s=Math.floor((Date.now()-t0)/1000),st=(vS&&vS.textContent)||'--';
    return [['up',String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'),'c'],['lines',String(lines),'g'],['net',lastMs!=null?lastMs+'ms':'--',navigator.onLine?'c':'r'],['q',st,'b']][i%4];}
  function fill(b,x){b.className='t-'+x[2];b.innerHTML='<u>'+x[0]+'</u> '+x[1];}
  var cells=[],wide=matchMedia('(min-width:600px)');
  function build(){roll.innerHTML='';cells=[];var n=wide.matches?4:1;
    for(var c=0;c<n;c++){var w=document.createElement('span');w.className='trw';w.innerHTML='<b></b><b></b>';roll.appendChild(w);var cell={w:w,i:c,last:''};fill(w.children[0],stat(c));cell.last=w.children[0].textContent;cells.push(cell);}}
  build();if(wide.addEventListener)wide.addEventListener('change',build);
  function flip(cell,ni){var B=cell.w.children,x=stat(ni);fill(B[1],x);cell.i=ni;
    if(RM.matches||!cell.w.animate){fill(B[0],x);cell.last=B[0].textContent;return;}
    var a=cell.w.animate([{transform:'translateY(0)'},{transform:'translateY(-50%)'}],{duration:618,easing:'cubic-bezier(.3,1.5,.55,1)'});
    a.onfinish=function(){fill(B[0],stat(cell.i));cell.last=B[0].textContent;};}
  var live=function(){return !(document.hidden||document.body.classList.contains('paused'));};
  // wide: each cell rolls up when its value changes (the up-time every second, odometer style)
  setInterval(function(){if(!live())return;cells.forEach(function(cell){if(cells.length===1){fill(cell.w.children[0],stat(cell.i));return;}
    var x=stat(cell.i),t=x[0]+' '+x[1];if(t!==cell.last){cell.last=t;flip(cell,cell.i);}});},1000);
  // phone: the single cell rolls to the next stat every PHI^4 Simmie = 3.33 s
  setInterval(function(){if(!live()||cells.length!==1)return;flip(cells[0],cells[0].i+1);},Math.round(Math.pow(PHI,4)*SIM*1000));

  // ---- matrix rain columns (decorative glyphs, no data) ----
  var body=document.querySelector('.foot .ttybody');
  if(body){var rn=document.createElement('span');rn.className='train';rn.setAttribute('aria-hidden','true');
    var G='01<>/\\|=+*$#{}[]:;~^',cols=innerWidth<480?2:innerWidth<900?4:6,h='';
    var P=[4,5,6,4.5,5.5,3.5];   // Simmie slots: PHI^n * PHI^-1.5 = 3.33, 5.39, 8.72, 4.24, 6.85, 2.62 s
    for(var c=0;c<cols;c++){var s='';for(var j=0;j<24;j++){var ch=G[(c*7+j*11+j*j)%G.length];s+=((j*5+c*3)%13===0?'<em>'+ch+'</em>':ch)+'<br>';}
      var d=Math.pow(PHI,P[c%P.length])*SIM;h+='<span style="animation-duration:'+d.toFixed(3)+'s;animation-delay:'+(-(d*((c+1)*0.6180339887%1))).toFixed(3)+'s">'+s+s+'</span>';}
    rn.innerHTML=h;body.appendChild(rn);}

  drawLog();drawQz();drawNet();
  window.QuizTty2={stats:function(){return {lines:lines,slots:slots.slice(),net:net.slice(),lastMs:lastMs};}};
})();
