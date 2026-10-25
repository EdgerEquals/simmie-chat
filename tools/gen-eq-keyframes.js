/* Samples js/eq-physics.js (same Model, same PARAMS) into CSS keyframes for the slim header mark, so the header runs NO JS physics.
   node tools/gen-eq-keyframes.js > out.json   ->  {M, css, particles:[{hx,hy,r}], wavesCss, waves:{...}}
   Each animated channel is sampled at 240 Hz and reduced with Ramer-Douglas-Peucker (per-channel tolerance), linear between keys. */
const E=require('../js/eq-physics.js');const P=E.PARAMS;
const m=new E.Model(P,1618),dt=1/240,N=Math.round(m.M/dt);
const S={t:[],sx:[],sy:[],gap:[],op:[],pa:[],ps:[]},ev=[];
for(let i=0;i<=N;i++){const b=m.bars();S.t.push(m.t);S.sx.push(b.sx);S.sy.push(b.sy);S.gap.push(b.gap);S.op.push(b.op);
  const pa=m.particleAlpha();S.pa.push(pa);S.ps.push(m.particles.filter(p=>p.kind==='n').map(p=>[p.x-p.hx,p.y-p.hy]));
  if(i<N){m.step(dt);m.events.forEach(e=>ev.push(e));m.events=[];}}
function rdp(idx,val,tol){ // idx: indices, val(i) -> array of channels, tol per channel
  const keep=new Set([idx[0],idx[idx.length-1]]);
  (function rec(a,b){let worst=-1,wi=-1;const va=val(a),vb=val(b);
    for(let i=a+1;i<b;i++){const f=(i-a)/(b-a),vi=val(i);let e=0;for(let c=0;c<vi.length;c++){e=Math.max(e,Math.abs(vi[c]-(va[c]+(vb[c]-va[c])*f))/tol[c]);}if(e>worst){worst=e;wi=i;}}
    if(worst>1){keep.add(wi);rec(a,wi);rec(wi,b);}})(idx[0],idx[idx.length-1]);
  return [...keep].sort((a,b)=>a-b);}
const all=[...Array(N+1).keys()],pct=i=>(100*i/N).toFixed(3).replace(/\.?0+$/,'')+'%',f3=v=>(+v.toFixed(3)).toString();
function kf(name,val,tol,fmt){const ks=rdp(all,val,tol);return `@keyframes ${name}{${ks.map(i=>pct(i)+'{'+fmt(val(i))+'}').join('')}}`;}
let css='';
css+=kf('eqg',i=>[S.sx[i],S.sy[i],S.op[i]],[.012,.012,.06],v=>`transform:scale(${f3(v[0])},${f3(v[1])});opacity:${f3(v[2])}`);
css+=kf('eqt',i=>[S.gap[i]],[.08],v=>`transform:translateY(${f3(-v[0])}px)`);
if(!ev.some(e=>e.kind==='reform'))ev.push({kind:'reform',t:m.M-0.001});
// pulse ring at each snap and the reform
const pul=ev.filter(e=>e.kind==='snap'||e.kind==='reform').map(e=>e.t%m.M),PD=0.618;
let pk=['0%{transform:scale(.55);opacity:0}'];pul.sort((a,b)=>a-b).forEach(t=>{const a=100*t/m.M,b=100*Math.min(m.M,t+PD)/m.M;
  pk.push(`${(a-.01).toFixed(3)}%{transform:scale(.55);opacity:0}`,`${a.toFixed(3)}%{transform:scale(.6);opacity:.9}`,`${b.toFixed(3)}%{transform:scale(1.7);opacity:0}`);});
pk.push('100%{transform:scale(.55);opacity:0}');css+=`@keyframes eqp{${pk.join('')}}`;
// nuclei (4 in the header)
const nN=S.ps.find(a=>a.length)?.length||0,parts=[];
for(let k=0;k<nN;k++){const val=i=>{const p=S.ps[i][k]||[0,0];return [p[0],p[1],S.pa[i]];};
  css+=kf('eqn'+k,val,[.9,.9,.08],v=>`transform:translate(${f3(v[0])}px,${f3(v[1])}px);opacity:${f3(v[2])}`);}
const D=P.demat,B=P.bars;B.y.forEach(y=>D.perBar.nuclei.forEach(x=>parts.push({hx:x,hy:y,r:D.nucleus.r})));
// header waves (page elements around the mark): one emitted wave sampled from E.wave, as scale (r/Rb) + opacity for the sharp outgoing ring
// (leg 0) and the diffuse ring (legs 1-2); period = one breath / 2, two staggered pairs.
const W=P.waves,Rb=W.R0*W.ratio,WT=P.breath.T/2,wn=Math.round(WT*120),wo=[],wr=[];
for(let i=0;i<=wn;i++){const tau=WT*i/wn,s=E.wave(W,tau);wo.push(s&&s.leg===0?[s.r/Rb,s.a]:[.5,0]);wr.push(s&&s.leg>0?[s.r/Rb,s.a]:[1,0]);}
const widx=[...Array(wn+1).keys()],wp=i=>(100*i/wn).toFixed(2).replace(/\.?0+$/,'')+'%';
function wkf(name,arr){const ks=rdp(widx,i=>arr[i],[.01,.02]);return `@keyframes ${name}{${ks.map(i=>wp(i)+`{transform:scale(${f3(arr[i][0])});opacity:${f3(Math.min(1,arr[i][1]))}}`).join('')}}`;}
const wavesCss=wkf('dmwO',wo)+wkf('dmwR',wr);
process.stdout.write(JSON.stringify({M:m.M,T:P.breath.T,css,particles:parts,pulses:pul,wavesCss,WT,events:ev.map(e=>[e.kind,+e.t.toFixed(2)])}));
