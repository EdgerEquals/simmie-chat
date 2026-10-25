# Dad's world equals mark, draft3 (Danny t706u toroid field lines, t707u two orbits). Writes dad-mark-v2-draft3.svg.
import math, random, sys
PHI=1.6180339887; G=0.6180339887
def frac(x): return x-math.floor(x)
def L(n): return PHI**n*PHI**-1.5   # Dad ladder: Bonnie slot PHI^n x PHI^-1.5
C=32
def ell(rx,ry): return f"M{C+rx},{C} A{rx},{ry} 0 1,1 {C-rx},{C} A{rx},{ry} 0 1,1 {C+rx},{C}"
rnd=random.Random(1618)
def jit(v,a=.07): return v+rnd.uniform(-a,a)
f1=lambda v: f"{v:.1f}".replace("-0.0","0.0")
# ---------- 3D field lines ----------
# View: torus axis = the orbit plane's normal. Elevation e so the equator projects to the same ellipse ratio as the orbit (ry/rx).
def proj(x,y,z,e):
    sx=x; sy=y*math.sin(e)-z*math.cos(e); d=y*math.cos(e)+z*math.sin(e)   # d > 0 = towards the viewer
    return C+sx, C+sy, d
def bin_paths(lines,e,norm):
    """lines: list of 3D polylines. Split every segment into front/mid/back by depth, join runs into subpaths."""
    out={'F':[], 'M':[], 'B':[]}
    for pts in lines:
        P=[proj(*p,e) for p in pts]
        P=[(jit(x),jit(y),d) for x,y,d in P]   # hand-drawn wobble
        run=None; cur=None
        for i in range(len(P)-1):
            d=(P[i][2]+P[i+1][2])/2/norm
            b='F' if d>.22 else ('B' if d<-.22 else 'M')
            if b!=cur:
                if run: out[cur].append(run)
                run=[P[i]]; cur=b
            run.append(P[i+1])
        if run: out[cur].append(run)
    return {k:"".join("M"+" ".join(f"{f1(x)},{f1(y)}" for x,y,_ in r) for r in v) for k,v in out.items()}
# Ring 1 plane: dipole (toroidal magnetic) field lines r = Lsh sin^2(theta), nested shells at golden ratios, meridians on golden offsets
e1=math.asin(11/29)
SH=[(28.0,12),(28/PHI,10),(28/PHI**2,8)]
lines=[]
for si,(Ls,M) in enumerate(SH):
    for k in range(M):
        ph=2*math.pi*k/M+si*2.39996
        N=30 if si==0 else 22
        pts=[]
        for i in range(N+1):
            th=.16+(math.pi-.32)*i/N; r=Ls*math.sin(th)**2; rho=r*math.sin(th)
            pts.append((rho*math.cos(ph),rho*math.sin(ph),r*math.cos(th)))
        lines.append(pts)
FL=bin_paths(lines,e1,28.0)
# construction: field axis, equator ellipse, ticks where the outer meridians cross the equator, pole crosses
ax_top=proj(0,0,15,e1); ax_bot=proj(0,0,-15,e1)
axis=f"M{f1(ax_top[0])},{f1(ax_top[1])} L{f1(ax_bot[0])},{f1(ax_bot[1])}"
ticks1=""
for k in range(12):
    ph=2*math.pi*k/12; x,y=28*math.cos(ph),28*math.sin(ph)
    a=proj(x,y,.9,e1); b=proj(x,y,-.9,e1); ticks1+=f"M{f1(a[0])},{f1(a[1])} L{f1(b[0])},{f1(b[1])}"
for z in (15,-15):
    p=proj(0,0,z,e1); ticks1+=f"M{f1(p[0]-1.1)},{f1(p[1])} H{f1(p[0]+1.1)}"
# Ring 2 plane: one closed helical field line winding a thin torus (8 poloidal turns per lap: a Fibonacci winding)
e2=math.asin(14/26); R2,a2,q=17.0,2.4,8
hp=[]
for i in range(8*18+1):
    t=2*math.pi*i/(8*18); th=q*t; rho=R2+a2*math.cos(th)
    hp.append((rho*math.cos(t),rho*math.sin(t),a2*math.sin(th)))
HX=bin_paths([hp],e2,R2)
# ---------- orbit-local construction ring ticks (dial) ----------
dial="".join(f"M{C+30*math.cos(a):.2f},{C+30*math.sin(a):.2f} L{C+(28.6 if d%30 else 27.6)*math.cos(a):.2f},{C+(28.6 if d%30 else 27.6)*math.sin(a):.2f}" for d in range(0,360,10) for a in [math.radians(d)])
def ros(R,a,k,s):
    p=[]
    for i in range(0,97):
        t=i*2*math.pi/96; r=R+s*a*math.sin(k*t); p.append(f"{C+r*math.cos(t):.1f},{C+r*math.sin(t):.1f}")
    return "M"+" L".join(p)+"Z"
rosA=ros(19.5,1.6,8,1); rosB=ros(19.5,1.6,8,-1)
stars=[]
for k in range(1,8):
    a=k*2.39996; r=24+5*frac(k*G); stars.append((C+r*math.cos(a),C+r*math.sin(a)))
# ---------- timings ----------
T=dict(o1=L(3.5),o2=L(4.5),          # bodies: outer faster (one phi step)
       p1=L(8.5),p2=L(7.5),          # path precession, opposite way: outer slower
       sys=L(9.5),                   # whole-system turn
       br1=L(4),br2=L(3),            # strata breathing
       flow=L(5),hflow=L(4),fbr=L(7),   # field-line flow (dipole), helix flow, field breathing
       rout=L(3.5),rin=L(4.5),ros=L(2.5),shim=L(5.5),glow=L(3),blink=L(2),dial=L(7.5))
EQ=[('jump',23.6,1.6),('shrink',38.2,2.0),('spin',47.0,1.8),('tilt',61.8,2.4),('fade',76.4,2.6)]
def gd(k): return frac(k*G)
S0=0.5
def win(p,l): a=S0*100; return a, a+100*l/p
def eqkf(name,p,l):
    a,b=win(p,l); m=lambda f: f"{a+(b-a)*f:.3f}%"
    if name=='jump':  ks=[(0,'transform:translateY(0)'),(.3,'transform:translateY(-6px)'),(.6,'transform:translateY(0)'),(.8,'transform:translateY(-1.8px)'),(1,'transform:translateY(0)')]
    if name=='shrink':ks=[(0,'transform:scale(1)'),(.45,'transform:scale(.5)'),(1,'transform:scale(1)')]
    if name=='spin':  ks=[(0,'transform:rotate(0deg)'),(1,'transform:rotate(360deg)')]
    if name=='tilt':  ks=[(0,'transform:rotate(0deg)'),(.3,'transform:rotate(-18deg)'),(.6,'transform:rotate(-18deg)'),(.82,'transform:rotate(9deg)'),(1,'transform:rotate(0deg)')]
    if name=='fade':  ks=[(0,'opacity:1'),(.3,'opacity:0'),(.65,'opacity:0'),(1,'opacity:1')]
    base=ks[0][1]
    return f"@keyframes eq-{name}{{0%,{a:.3f}%{{{base}}}"+"".join(f"{m(f)}{{{v}}}" for f,v in ks[1:-1])+f"{b:.3f}%,100%{{{base}}}}}"
eqvars="\n".join(f"--t-eq-{n}:{p}s;   /* equals {n}: fires once per period for {l}s */" for n,p,l in EQ)
eqcss="\n".join(f"#eq-{n}{{animation:eq-{n} var(--t-eq-{n}) ease-in-out calc(var(--t-eq-{n}) * -{gd(k):.3f}) infinite}}\n"+eqkf(n,p,l) for k,(n,p,l) in enumerate(EQ,1))
def strata(i,rx,ry):
    return f'<g id="br{i}" class="v strata" fill="none"><ellipse cx="32" cy="32" rx="{rx+1.6}" ry="{ry+1.0}" stroke="#85A6BB" stroke-width=".25"/><ellipse cx="32" cy="32" rx="{rx-1.6}" ry="{max(ry-1.0,1)}" stroke="#0AF2FF" stroke-width=".25" opacity=".7"/><ellipse cx="32" cy="32" rx="{rx+3.2}" ry="{ry+2.0}" stroke="#85A6BB" stroke-width=".18" opacity=".5" stroke-dasharray=".6 1"/></g>'
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="dm3-t">
<title id="dm3-t">Dad's world equals mark</title>
<!-- Dad mark v2 (draft3), Dad's world equals mark (Danny t702u to t708u, 25 Oct 2026). LIGHTWEIGHT HEADER VERSION: CSS-only animation, no JS, reads at 28 to 48 px.
     TWO orbits (the original Dad mark's offset loops: ring 1 rx29 ry11 at -20deg, ring 2 rx26 ry14 at +25deg).
     Pencil layer = 3D toroidal magnetic field lines: ring 1 carries a dipole field (r = L sin^2 theta, 3 nested shells at golden ratios, 30 meridians),
     ring 2 carries one helical field line winding a thin torus 8 times. Both are projected with their orbit's tilt and depth-sorted:
     front strokes heavy and bright, back strokes thin and faint. Sepia pencil base (jittered, turbulence filter) plus cyan neon pulses that flow along the lines.
     Each field rides its orbit's counter-rotating precession; the whole system turns slowly. The square equals bars stay upright on top with 5 random effects.
     Timings: Dad ladder = PHI^n x PHI^-1.5; start offsets = period x frac(k x 0.618) as negative delays.
     prefers-reduced-motion: every animation stops on a composed static frame. -->
<style>
/* PARAMS (keep this block together; it moves to the shared params file) */
:root{{
--phi:1.6180339887;
--c-black:#000000;--c-head:#9DBCCE;--c-text:#85A6BB;--c-mid:#1F5478;--c-deep:#143A57;--c-accent:#0AF2FF;--c-ice:#E6FDFF;--c-sepia:#C9B79C;
--t-system:{T["sys"]:.2f}s;   /* whole system full turn, clockwise, PHI^9.5 x PHI^-1.5 */
--t-body-outer:{T["o1"]:.2f}s; /* ring 1 haloed dot, PHI^3.5 (faster) */
--t-body-inner:{T["o2"]:.2f}s; /* ring 2 diamond, PHI^4.5 (slower, x PHI) */
--t-prec-outer:{T["p1"]:.2f}s; /* ring 1 path precession, anticlockwise, PHI^8.5 (slower) */
--t-prec-inner:{T["p2"]:.2f}s; /* ring 2 path precession, PHI^7.5 */
--t-strata-outer:{T["br1"]:.2f}s;--t-strata-inner:{T["br2"]:.2f}s; /* strata breathe on each orbit, PHI^4 / PHI^3 */
--t-field-flow:{T["flow"]:.2f}s;  /* neon pulses flow along the dipole field lines, PHI^5 */
--t-helix-flow:{T["hflow"]:.2f}s; /* pulses along the helical torus line, PHI^4 */
--t-field-breathe:{T["fbr"]:.2f}s; /* field swells and settles, PHI^7 */
--t-ripple-out:{T["rout"]:.2f}s;--t-ripple-in:{T["rin"]:.2f}s;--t-standing:{T["ros"]:.2f}s; /* central harmonics */
--t-shimmer:{T["shim"]:.2f}s;--t-glow:{T["glow"]:.2f}s;--t-blink:{T["blink"]:.2f}s;--t-dial:{T["dial"]:.2f}s;
{eqvars}
--eq-size-small:1.25;   /* equals scale in the header tier */
}}
/* END PARAMS */
.v{{transform-box:view-box;transform-origin:32px 32px}}
#dm-sys{{animation:spin var(--t-system) linear calc(var(--t-system) * -0.618) infinite}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@keyframes unspin{{to{{transform:rotate(-360deg)}}}}
#pr1{{animation:unspin var(--t-prec-outer) linear calc(var(--t-prec-outer) * -0.236) infinite}}
#pr2{{animation:unspin var(--t-prec-inner) linear calc(var(--t-prec-inner) * -0.854) infinite}}
.strata{{animation:breathe ease-in-out infinite alternate}}
#br1{{animation-duration:var(--t-strata-outer);animation-delay:calc(var(--t-strata-outer) * -0.090)}}
#br2{{animation-duration:var(--t-strata-inner);animation-delay:calc(var(--t-strata-inner) * -0.708)}}
@keyframes breathe{{from{{transform:scale(.955);opacity:.35}}to{{transform:scale(1.045);opacity:1}}}}
#fd1{{animation:fbr var(--t-field-breathe) ease-in-out calc(var(--t-field-breathe) * -0.326) infinite alternate}}
@keyframes fbr{{from{{transform:scale(.96,.92)}}to{{transform:scale(1.03,1.06)}}}}
.flow{{fill:none;stroke-dasharray:1.6 9.4;animation:flow var(--t-field-flow) linear infinite}}
#hxF{{animation-duration:var(--t-helix-flow);stroke-dasharray:2.2 6.8}}
@keyframes flow{{from{{stroke-dashoffset:0}}to{{stroke-dashoffset:-11}}}}
#hxF{{animation-name:hflow}}
@keyframes hflow{{from{{stroke-dashoffset:0}}to{{stroke-dashoffset:-9}}}}
#nfM{{animation-delay:calc(var(--t-field-flow) * -0.382)}}
#o1b,#t1{{offset-path:path('{ell(29,11)}')}}
#o2b{{offset-path:path('{ell(26,14)}')}}
.body{{offset-rotate:0deg;animation:orb linear infinite}}
#o1b{{animation-duration:var(--t-body-outer);animation-delay:calc(var(--t-body-outer) * -0.618);offset-distance:61.8%}}
#o2b{{animation-duration:var(--t-body-inner);animation-delay:calc(var(--t-body-inner) * -0.236);offset-distance:23.6%}}
@keyframes orb{{from{{offset-distance:0%}}to{{offset-distance:100%}}}}
.trail{{animation:trl linear infinite}}
@keyframes trl{{from{{stroke-dashoffset:var(--l)}}to{{stroke-dashoffset:calc(var(--l) - 100)}}}}
#t1 .trail{{animation-duration:var(--t-body-outer);animation-delay:calc(var(--t-body-outer) * -0.618)}}
#t2 .trail{{animation-duration:var(--t-body-inner);animation-delay:calc(var(--t-body-inner) * -0.236)}}
#t1{{offset-path:none}}
#dial{{animation:unspin var(--t-dial) linear calc(var(--t-dial) * -0.090) infinite}}
.rout{{opacity:0;animation:rout var(--t-ripple-out) ease-out infinite}}
.rin{{opacity:0;animation:rin var(--t-ripple-in) ease-in infinite}}
#ro1{{animation-delay:calc(var(--t-ripple-out) * -0.944)}}#ro2{{animation-delay:calc(var(--t-ripple-out) * -0.562)}}#ro3{{animation-delay:calc(var(--t-ripple-out) * -0.180)}}
#ri1{{animation-delay:calc(var(--t-ripple-in) * -0.798)}}#ri2{{animation-delay:calc(var(--t-ripple-in) * -0.416)}}
@keyframes rout{{0%{{transform:scale(.55);opacity:0}}20%{{opacity:.7}}100%{{transform:scale(1.55);opacity:0}}}}
@keyframes rin{{0%{{transform:scale(1.5);opacity:0}}30%{{opacity:.5}}100%{{transform:scale(.6);opacity:0}}}}
#rosA{{animation:sa var(--t-standing) ease-in-out calc(var(--t-standing) * -0.034) infinite alternate}}
#rosB{{animation:sa var(--t-standing) ease-in-out calc(var(--t-standing) * -0.034) infinite alternate-reverse}}
@keyframes sa{{from{{opacity:.45}}to{{opacity:.04}}}}
#shim{{animation:shim var(--t-shimmer) ease-in-out calc(var(--t-shimmer) * -0.652) infinite}}
@keyframes shim{{0%,61.8%{{transform:translateX(-30px)}}100%{{transform:translateX(42px)}}}}
#barB{{animation:neon var(--t-glow) ease-in-out calc(var(--t-glow) * -0.270) infinite alternate}}
@keyframes neon{{from{{opacity:.95}}to{{opacity:1}}}}
.tw{{animation:tw var(--t-blink) ease-in-out infinite alternate}}
@keyframes tw{{from{{opacity:.15}}to{{opacity:.9}}}}
{eqcss}
/* size tiers: the SVG's own viewport is the img size; the header (96 px or less) gets a bold silhouette, the zoom gets the full field study */
@media (max-width:96px){{.pc,#hx,#dial,#rosB,#ri1,#ri2,#ro2,#ro3,.tw,.strata ellipse+ellipse+ellipse{{display:none}}#nfF{{stroke-width:.75;opacity:.55}}#nfM{{display:none}}#rosA{{animation:none;opacity:.35}}#o2b path{{stroke-width:.9}}#eq-size{{transform:scale(var(--eq-size-small))}}}}
@media (min-width:200px){{#ring1{{stroke-width:.85}}#ring2{{stroke-width:.7}}#t1 ellipse{{stroke-width:.9}}}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}.rout,.rin{{opacity:.35}}#ro2{{transform:scale(1.15)}}#ri1{{transform:scale(.8)}}}}
</style>
<defs>
<linearGradient id="gR1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F5478"/><stop offset=".5" stop-color="#9DBCCE"/><stop offset="1" stop-color="#0AF2FF"/></linearGradient>
<linearGradient id="gR2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#143A57"/><stop offset=".55" stop-color="#85A6BB"/><stop offset="1" stop-color="#0AF2FF"/></linearGradient>
<linearGradient id="gTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#143A57"/><stop offset=".6" stop-color="#1F5478"/><stop offset="1" stop-color="#3A84B0"/></linearGradient>
<linearGradient id="gBot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F8FC0"/><stop offset=".35" stop-color="#0AF2FF"/><stop offset=".5" stop-color="#BFFBFF"/><stop offset=".65" stop-color="#0AF2FF"/><stop offset="1" stop-color="#1F8FC0"/></linearGradient>
<linearGradient id="gShim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="gCore"><stop offset="0" stop-color="#1F5478" stop-opacity=".55"/><stop offset=".6" stop-color="#143A57" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="neon" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation=".45" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale=".35"/></filter>
<clipPath id="cBars"><rect x="19.2" y="24.4" width="25.6" height="6.4"/><rect x="19.2" y="33.2" width="25.6" height="6.4"/></clipPath>
<path id="fF" d="{FL['F']}"/><path id="fM" d="{FL['M']}"/><path id="fB" d="{FL['B']}"/>
<path id="hF" d="{HX['F']}"/><path id="hM" d="{HX['M']}{HX['B']}"/>
</defs>
<circle cx="32" cy="32" r="30" fill="url(#gCore)"/>
<g id="dm-sys" class="v">
<g class="v" id="dial"><path d="{dial}" fill="none" stroke="#85A6BB" stroke-width=".3" opacity=".5"/></g>
<g id="dm-harm" fill="none">
 <circle id="ro1" class="v rout" cx="32" cy="32" r="14" stroke="#0AF2FF" stroke-width=".35"/>
 <circle id="ro2" class="v rout" cx="32" cy="32" r="14" stroke="#85A6BB" stroke-width=".35"/>
 <circle id="ro3" class="v rout" cx="32" cy="32" r="14" stroke="#0AF2FF" stroke-width=".35"/>
 <circle id="ri1" class="v rin" cx="32" cy="32" r="16" stroke="#9DBCCE" stroke-width=".3" stroke-dasharray="1 1.4"/>
 <circle id="ri2" class="v rin" cx="32" cy="32" r="16" stroke="#9DBCCE" stroke-width=".3" stroke-dasharray="1 1.4"/>
 <path id="rosA" d="{rosA}" stroke="#0AF2FF" stroke-width=".3" opacity=".22"/>
 <path id="rosB" d="{rosB}" stroke="#85A6BB" stroke-width=".3" opacity=".2"/>
 <g fill="#E6FDFF">{"".join(f'<circle class="tw" cx="{x:.1f}" cy="{y:.1f}" r=".45" style="animation-delay:calc(var(--t-blink) * -{frac(k*G):.3f})"/>' for k,(x,y) in enumerate(stars,1))}</g>
</g>
<g id="dm-orbits" fill="none" stroke-linecap="round" stroke-linejoin="round">
 <g id="pr1" class="v"><g transform="rotate(-20 32 32)">
  <g id="fd1" class="v">
   <g class="pc" filter="url(#pencil)" stroke="#C9B79C">
    <use href="#fB" stroke-width=".16" opacity=".22"/>
    <use href="#fM" stroke-width=".22" opacity=".5"/>
    <use href="#fF" stroke-width=".32" opacity=".85"/>
    <path d="{axis}" stroke-width=".18" stroke-dasharray=".8 1.2" opacity=".6"/>
    <ellipse cx="32" cy="32" rx="28" ry="{28*11/29:.2f}" stroke-width=".16" stroke-dasharray=".5 1" opacity=".5"/>
    <path d="{ticks1}" stroke="#E0CFAE" stroke-width=".2" opacity=".8"/>
   </g>
   <use href="#fB" class="flow pc" stroke="#1F5478" stroke-width=".3" opacity=".5"/>
   <use id="nfM" href="#fM" class="flow" stroke="#85A6BB" stroke-width=".35" opacity=".6"/>
   <use id="nfF" href="#fF" class="flow" stroke="#0AF2FF" stroke-width=".5" filter="url(#soft)"/>
  </g>
  {strata(1,29,11)}
  <ellipse id="ring1" cx="32" cy="32" rx="29" ry="11" stroke="url(#gR1)" stroke-width="1.7"/>
  <g id="t1" stroke="#0AF2FF" filter="url(#neon)"><ellipse class="trail" pathLength="100" cx="32" cy="32" rx="29" ry="11" stroke-width="1.6" stroke-dasharray="5 95" style="--l:5"/><ellipse class="trail" pathLength="100" cx="32" cy="32" rx="29" ry="11" stroke-width="1" opacity=".45" stroke-dasharray="12 88" style="--l:12"/></g>
  <g id="o1b" class="body"><circle class="tw" r="3.1" stroke="#0AF2FF" stroke-width=".5" style="animation-delay:calc(var(--t-blink) * -0.854)"/><circle r="1.6" fill="#E6FDFF" filter="url(#neon)"/></g>
 </g></g>
 <g id="pr2" class="v"><g transform="rotate(25 32 32)">
  <g id="hx">
   <g class="pc" filter="url(#pencil)" stroke="#C9B79C"><use href="#hM" stroke-width=".15" opacity=".3"/><use href="#hF" stroke-width=".26" opacity=".75"/></g>
   <use href="#hF" id="hxF" class="flow" stroke="#9DBCCE" stroke-width=".4" filter="url(#soft)" opacity=".85"/>
  </g>
  {strata(2,26,14)}
  <ellipse id="ring2" cx="32" cy="32" rx="26" ry="14" stroke="url(#gR2)" stroke-width="1.3"/>
  <g id="t2" stroke="#9DBCCE"><ellipse class="trail" pathLength="100" cx="32" cy="32" rx="26" ry="14" stroke-width="1.3" stroke-dasharray="7 93" style="--l:7" opacity=".8"/></g>
  <g id="o2b" class="body" filter="url(#neon)"><path d="M0,-2.6 L1.8,0 L0,2.6 L-1.8,0Z M0,-2.6 V2.6 M-1.8,0 H1.8" fill="none" stroke="#9DBCCE" stroke-width=".55"/></g>
 </g></g>
</g>
</g>
<g id="dm-eq"><g id="eq-size" class="v"><g id="eq-jump" class="v"><g id="eq-shrink" class="v"><g id="eq-spin" class="v"><g id="eq-tilt" class="v"><g id="eq-fade">
 <rect x="19.2" y="24.4" width="25.6" height="6.4" fill="url(#gTop)" stroke="#9DBCCE" stroke-width=".7"/>
 <rect id="barB" x="19.2" y="33.2" width="25.6" height="6.4" fill="url(#gBot)" filter="url(#neon)"/>
 <g clip-path="url(#cBars)"><g id="shim"><rect x="16" y="20" width="9" height="24" fill="url(#gShim)" transform="skewX(-20) translate(10 0)"/></g></g>
</g></g></g></g></g></g></g>
</svg>
'''
import re
for c in re.findall(r"<!--(.*?)-->",svg,re.S): assert '--' not in c, 'double hyphen in comment'
out=sys.argv[1] if len(sys.argv)>1 else '/workspace/dadmark-v2-draft/dad-mark-v2-draft3.svg'
open(out,'w').write(svg); print(out, len(svg.encode()),'bytes')
