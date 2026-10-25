/* EQ PHYSICS: Dad's equals sign as a small real physical system (Danny t717u breathe/snap/dematerialise, t719u radiating waves, 25 Oct 2026).
   One param-driven model. The zoom view runs it live (canvas over the detailed mark); the slim header mark never runs JS: its CSS keyframes are
   sampled offline from THIS model and THESE params by tools/gen-eq-keyframes.js (node). Units: the mark's 64-unit viewBox, centre (32,32),
   mark radius R0 = 30. Time in seconds. Timings follow the phi rules (Dad ladder PHI^n x PHI^-1.5).

   1 BREATH (driven damped harmonic oscillator), breath coordinate x (+ out, - in):
        x'' + 2 zeta w0 x' + w0^2 x = F0 cos(w0 t),   w0 = 2 pi / T_breath,  F0 = 2 zeta w0^2 A   (steady-state amplitude A)
      x > 0  breathe out: gap widens  gap += gapOut*x,  scale up  sx = sy = 1 + scaleOut*x
      x < 0  pinch in:    u = -x,  thinner sy = 1 - pinch*u,  longer sx = 1 + extend*u,  gap -= gapIn*u
   2 SNAP (underdamped spring, released at a breath-out peak; driving off while it rings):
        m x'' = -k x - c x',  c = 2 zeta_s sqrt(k m);  overshoot = exp(-zeta_s pi / sqrt(1 - zeta_s^2)).
      An expanding ring pulse is emitted at the first zero crossing (the snap-through), then the drive resumes.
   3 DEMATERIALISE / REMATERIALISE: each bar becomes 1 nucleus + electrons (point masses, charge q):
        m_i a_i = sum_j kq q_i q_j (r_i - r_j)/(|r_i - r_j|^2 + s^2)^1.5        mild inverse-square repulsion (softened)
                + q_i (v_i x B)                                                    magnetic field out of the page: electrons curl ("phase shift")
                - kh(t) (r_i - home_i) - gamma(t) v_i                              home spring ramps up to reconverge, damping
      elastic bounce off the boundary circle |r| = Rp (normal velocity reversed, times restitution e).
   4 WAVES (radiating energy from the sign, 1-2 reflections): a ring leaves the mark edge R0 at speed c,
        amplitude a(s) = a0 (R0 / r) exp(-alpha s),  s = distance travelled;  at r = Rb = ratio x R0 it reflects inward with
        a *= Rc and width *= diffuse (wider, softer); at R0 it can reflect once more outward (a *= Rc). Energy lost each pass.
   Extend: add terms to forces() or new event kinds in schedule(); keep PARAMS the single source of truth. */
(function(root){
  'use strict';
  var PHI=1.6180339887;
  /*PARAMS-BEGIN*/
  var PARAMS={
    "breath":{"T":8.7232,"zeta":0.35,"A":1.0,"gapOut":1.1,"scaleOut":0.055,"gapIn":0.7,"pinch":0.26,"extend":0.11},
    "cycleBreaths":6,
    "snap":{"breaths":[3,5],"k":180,"m":1,"zeta":0.18,"settle":1.618},
    "demat":{"breath":6,"start":0.2,"burst":0.05,"free":0.55,"lock":0.9,"fadeOut":0.06,"fadeIn":0.12,
             "nucleus":{"m":4,"q":1.2,"r":2.1},"electron":{"m":1,"q":-1,"r":0.85},"perBar":{"nuclei":[-6.4,6.4],"electrons":[-11.6,11.6]},
             "kick":16,"kq":40,"soft":1.2,"B":1.6,"gamma0":0.25,"gamma1":5,"kHome":30,"Rp":19,"e":0.92},
    "bars":{"w":25.6,"h":6.4,"y":[-4.4,4.4]},
    "waves":{"on":true,"R0":30,"ratio":2.0,"speed":34,"alpha":0.012,"Rc":0.45,"diffuse":2.6,"reflections":2,"a0":0.9,"peakA":0.55}
  };
  /*PARAMS-END*/
  function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

  function Model(P,seed){
    P=P||PARAMS;this.P=P;this.rand=rng(seed==null?1618:seed);this.t=0;this.x=0;this.v=0;this.mode='breath';this.modeT=0;
    this.events=[];this.particles=[];this.snapped={};this.pulses=[];this.w0=2*Math.PI/P.breath.T;this.M=P.cycleBreaths*P.breath.T;this.cycle=0;this.prevV=0;
  }
  Model.prototype.breathIndex=function(){return Math.floor((this.t%this.M)/this.P.breath.T)+1;};
  Model.prototype.emit=function(kind,amp){this.events.push({kind:kind,t:this.t,amp:amp});};
  Model.prototype.spawn=function(){
    var D=this.P.demat,B=this.P.bars,ps=[],r=this.rand;
    B.y.forEach(function(y){
      D.perBar.nuclei.forEach(function(x){ps.push({kind:'n',m:D.nucleus.m,q:D.nucleus.q,r:D.nucleus.r,hx:x,hy:y,x:x,y:y,vx:0,vy:0});});
      D.perBar.electrons.forEach(function(x){ps.push({kind:'e',m:D.electron.m,q:D.electron.q,r:D.electron.r,hx:x,hy:y,x:x,y:y,vx:0,vy:0});});
    });
    ps.forEach(function(p){var a=Math.atan2(p.hy,p.hx)+(r()-.5)*1.4,s=D.kick*(.6+.8*r())/Math.sqrt(p.m);p.vx=s*Math.cos(a);p.vy=s*Math.sin(a);});
    this.particles=ps;
  };
  Model.prototype.forces=function(f){
    var D=this.P.demat,ps=this.particles,n=ps.length,i,j,kh=0,g=D.gamma0,u=0,lock=f>D.lock;
    if(f>D.free){u=Math.min(1,(f-D.free)/(D.lock-D.free));kh=D.kHome*u*u;g=D.gamma0+(D.gamma1-D.gamma0)*u;}
    if(lock)kh=D.kHome;
    var fade=1-u;   // repulsion and the magnetic curl fade out as the home spring takes over
    for(i=0;i<n;i++){ps[i].ax=0;ps[i].ay=0;}
    for(i=0;i<n;i++)for(j=i+1;j<n;j++){var a=ps[i],b=ps[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+D.soft*D.soft,F=fade*D.kq*Math.abs(a.q*b.q)/(d2*Math.sqrt(d2));
      a.ax+=F*dx/a.m;a.ay+=F*dy/a.m;b.ax-=F*dx/b.m;b.ay-=F*dy/b.m;}
    for(i=0;i<n;i++){var p=ps[i],gi=Math.max(g,2*Math.sqrt(kh*p.m)*u),Bq=fade*p.q*D.B;   // damping rises to critical per particle as u -> 1
      p.ax+=(Bq*p.vy-kh*(p.x-p.hx)-gi*p.vx)/p.m;   // q (v x B), B = B z-hat: (vy B, -vx B)
      p.ay+=(-Bq*p.vx-kh*(p.y-p.hy)-gi*p.vy)/p.m;}
  };
  Model.prototype.step=function(dt){
    var P=this.P,b=P.breath,w0=this.w0,tc=this.t%this.M,bi=this.breathIndex();
    if(tc<dt){this.snapped={};}
    var D=P.demat,ds=(D.breath-1)*b.T+D.start,dur=this.M-ds;
    if(this.mode==='breath'&&bi===D.breath&&tc>=ds){this.mode='demat';this.modeT=0;this.spawn();}
    if(this.mode==='demat'){
      var f=this.modeT/dur;this.forces(f);
      var Rp=D.Rp;this.particles.forEach(function(p){p.vx+=p.ax*dt;p.vy+=p.ay*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        var r=Math.sqrt(p.x*p.x+p.y*p.y);if(r>Rp-p.r){var nx=p.x/r,ny=p.y/r,vn=p.vx*nx+p.vy*ny;if(vn>0){p.vx-=(1+D.e)*vn*nx;p.vy-=(1+D.e)*vn*ny;}p.x=nx*(Rp-p.r);p.y=ny*(Rp-p.r);}});
      var a=-w0*w0*this.x-2*b.zeta*w0*this.v;this.v+=a*dt;this.x+=this.v*dt;
      this.modeT+=dt;if(this.modeT>=dur-1e-9||tc+dt>=this.M){this.mode='breath';this.particles=[];this.x=0;this.v=0;this.emit('reform',1);}
    }else if(this.mode==='snap'){
      var s=P.snap,c=2*s.zeta*Math.sqrt(s.k*s.m),xo=this.x;
      var as=(-s.k*this.x-c*this.v)/s.m;this.v+=as*dt;this.x+=this.v*dt;
      if(!this.crossed&&xo>0&&this.x<=0){this.crossed=true;this.emit('snap',1);}
      this.modeT+=dt;if(this.modeT>=s.settle)this.mode='breath';
    }else{
      var F0=2*b.zeta*w0*w0*b.A,acc=F0*Math.cos(w0*this.t-Math.PI/2)-w0*w0*this.x-2*b.zeta*w0*this.v;
      this.prevV=this.v;this.v+=acc*dt;this.x+=this.v*dt;
      if(this.prevV>0&&this.v<=0&&this.x>0){
        if(P.snap.breaths.indexOf(bi)>=0&&!this.snapped[bi]){this.snapped[bi]=1;this.mode='snap';this.modeT=0;this.crossed=false;}
        else this.emit('peak',P.waves.peakA);
      }
    }
    this.t+=dt;
  };
  Model.prototype.bars=function(){
    var b=this.P.breath,x=this.x,o={sx:1,sy:1,gap:0,op:1};
    if(x>=0){o.sx=o.sy=1+b.scaleOut*x;o.gap=b.gapOut*x;}else{var u=-x;o.sy=Math.max(.2,1-b.pinch*u);o.sx=1+b.extend*u;o.gap=-b.gapIn*u;}
    if(this.mode==='demat'){var D=this.P.demat,dur=this.M-((D.breath-1)*b.T+D.start),f=this.modeT/dur;
      o.op=f<D.fadeOut?1-f/D.fadeOut:(f>1-D.fadeIn?(f-(1-D.fadeIn))/D.fadeIn:0);}
    return o;
  };
  Model.prototype.particleAlpha=function(){
    if(this.mode!=='demat')return 0;var D=this.P.demat,dur=this.M-((D.breath-1)*this.P.breath.T+D.start),f=this.modeT/dur;
    return f<D.fadeOut?f/D.fadeOut:(f>1-D.fadeIn*.7?Math.max(0,(1-f)/(D.fadeIn*.7)):1);
  };
  /* wave state at age tau (s) for one emitted wave: {r, a, w, dir} or null when spent */
  function wave(W,tau,amp){
    var R0=W.R0,Rb=W.R0*W.ratio,L=Rb-R0,s=W.speed*tau,leg=Math.floor(s/L),q=s-leg*L;
    if(leg>W.reflections)return null;
    var r=leg%2===0?R0+q:Rb-q,a=(amp==null?W.a0:amp)*(R0/r)*Math.exp(-W.alpha*s)*Math.pow(W.Rc,leg),w=1*Math.pow(W.diffuse,leg);
    return {r:r,a:a,w:w,leg:leg};
  }
  /* live renderer for the zoom view: canvas over a mark image whose own bars are hidden (stage file) */
  function attach(host,img,opts){
    opts=opts||{};var P=PARAMS,m=new Model(P,(Math.random()*1e9)|0),cv=document.createElement('canvas'),x=cv.getContext('2d'),raf=0,last=0,waves=[],pulses=[];
    var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    cv.className='eqp-canvas';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2';
    host.appendChild(cv);
    m.t=(opts.t0!=null?opts.t0:P.breath.T*.15);
    function size(){var d=Math.min(window.devicePixelRatio||1,2);cv.width=innerWidth*d;cv.height=innerHeight*d;x.setTransform(d,0,0,d,0,0);}
    size();addEventListener('resize',size);
    function draw(){
      var R=img.getBoundingClientRect();if(!R.width)return;var k=R.width/64,cx=R.left+R.width/2,cy=R.top+R.height/2;
      x.clearRect(0,0,innerWidth,innerHeight);
      // waves
      var W=P.waves;for(var i=waves.length-1;i>=0;i--){var s=wave(W,m.t-waves[i].t,waves[i].a);if(!s){waves.splice(i,1);continue;}
        x.save();x.globalAlpha=Math.min(1,s.a);x.strokeStyle='#00C896';x.shadowColor='#00C896';x.shadowBlur=(s.leg?10:4)*k/4;x.lineWidth=Math.max(1,s.w*k*.35);
        x.beginPath();x.arc(cx,cy,s.r*k,0,Math.PI*2);x.stroke();x.restore();}
      // snap / reform pulse: a quick expanding ring (PHI^-1 s)
      for(var j=pulses.length-1;j>=0;j--){var u=(m.t-pulses[j])/0.618;if(u>1){pulses.splice(j,1);continue;}
        x.save();x.globalAlpha=.9*(1-u);x.strokeStyle='#50FFB0';x.shadowColor='#00C896';x.shadowBlur=10;x.lineWidth=Math.max(1,1.1*k*(1-u*.6));
        x.beginPath();x.arc(cx,cy,15*1.25*k*(.6+1.1*u),0,Math.PI*2);x.stroke();x.restore();}
      // bars
      var b=m.bars(),B=P.bars;
      if(b.op>0){x.save();x.globalAlpha=b.op;x.translate(cx,cy);x.scale(b.sx*k,b.sy*k);
        B.y.forEach(function(y){var yy=y+(y<0?-b.gap:b.gap)/b.sy-B.h/2;
          x.shadowColor='#00C896';x.shadowBlur=14;x.fillStyle='rgba(0,200,150,.55)';x.fillRect(-B.w/2-.6,yy-.6,B.w+1.2,B.h+1.2);
          var g=x.createLinearGradient(0,yy,0,yy+B.h);g.addColorStop(0,'#2ECC71');g.addColorStop(.5,'#B9FFDD');g.addColorStop(1,'#2ECC71');
          x.shadowBlur=6;x.fillStyle=g;x.fillRect(-B.w/2,yy,B.w,B.h);});
        x.restore();}
      // particles
      var pa=m.particleAlpha();if(pa>0){x.save();x.globalAlpha=pa;m.particles.forEach(function(p){
        x.shadowColor=p.kind==='n'?'#00C896':'#50FFB0';x.shadowBlur=p.kind==='n'?12:8;x.fillStyle=p.kind==='n'?'#B9FFDD':'#50FFB0';
        x.beginPath();x.arc(cx+p.x*k,cy+p.y*k,p.r*k,0,Math.PI*2);x.fill();});x.restore();}
    }
    function frame(ts){raf=requestAnimationFrame(frame);var dt=last?Math.min(.05,(ts-last)/1000):1/60;last=ts;
      if(rm){m.t+=dt;m.x=.6*Math.sin(m.w0*m.t);m.mode='breath';}
      else{var n=Math.ceil(dt/(1/240));for(var i=0;i<n;i++)m.step(dt/n);
        m.events.forEach(function(e){if(e.kind!=='peak')pulses.push(e.t);if(P.waves.on)waves.push({t:e.t,a:(e.amp||1)*P.waves.a0});});m.events=[];}
      draw();}
    raf=requestAnimationFrame(frame);
    var h={model:m,ff:function(T){while(m.t<T){m.step(1/240);}m.events=[];},stop:function(){cancelAnimationFrame(raf);removeEventListener('resize',size);if(cv.parentNode)cv.parentNode.removeChild(cv);}};
    api.last=h;return h;
  }
  var api={PARAMS:PARAMS,Model:Model,wave:wave,attach:attach,PHI:PHI};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EqPhysics=api;
})(typeof window!=='undefined'?window:this);
