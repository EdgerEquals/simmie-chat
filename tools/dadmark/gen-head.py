# Slim HEADER Dad mark (Danny t713u: light). Only rings, 2 bodies, equals. <=6 animations, transform/opacity only, no filters.
# usage: gen-head.py OUT [cyan|emerald]
import sys, math, json
PHI=1.6180339887
def L(n): return PHI**n*PHI**-1.5
OUT=sys.argv[1]; MODE=sys.argv[2] if len(sys.argv)>2 else 'cyan'
O1=(29,11,-20); O2=(26,14,25)
if MODE=='cyan':
    R1=('#1F5478','#9DBCCE','#0AF2FF'); R2=('#143A57','#85A6BB','#0AF2FF'); B1='#E6FDFF'; B1h='#0AF2FF'; B2='#9DBCCE'
    TOP=('#143A57','#3A84B0'); TOPs='#9DBCCE'; BOT=('#1F8FC0','#0AF2FF','#BFFBFF'); GLOW='#0AF2FF'; BOTs=None; REF=None
    ringop=1
else:
    R1=('#143A57','#1F5478','#2B6A92'); R2=('#0E2A40','#1F5478','#2B6A92'); B1='#6F93AB'; B1h='#1F5478'; B2='#5F86A0'
    REF='#00C896'; ringop=.85
def sc(rx,ry): return ry/rx
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Dad's world equals mark">
<!-- Dad mark v2, SLIM HEADER version ({MODE}). Two orbits, two bodies, the equals. 6 animations, transform and opacity only, no filters.
     The detailed mark (toroid field lines) loads only in the tap-to-zoom view. Timings: Dad ladder PHI^n x PHI^-1.5. -->
<style>
.v{{transform-box:view-box;transform-origin:32px 32px}}
#s{{animation:a {L(9.5):.2f}s linear -{L(9.5)*.618:.2f}s infinite}}
#p1{{animation:b {L(8.5):.2f}s linear -{L(8.5)*.236:.2f}s infinite}}
#p2{{animation:b {L(7.5):.2f}s linear -{L(7.5)*.854:.2f}s infinite}}
#b1{{animation:a {L(3.5):.2f}s linear -{L(3.5)*.618:.2f}s infinite}}
#b2{{animation:a {L(4.5):.2f}s linear -{L(4.5)*.236:.2f}s infinite}}
@keyframes a{{to{{transform:rotate(360deg)}}}}
@keyframes b{{to{{transform:rotate(-360deg)}}}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}}}
</style>
<defs>
<linearGradient id="r1" x1="0" x2="1"><stop offset="0" stop-color="{R1[0]}"/><stop offset=".5" stop-color="{R1[1]}"/><stop offset="1" stop-color="{R1[2]}"/></linearGradient>
<linearGradient id="r2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{R2[0]}"/><stop offset=".55" stop-color="{R2[1]}"/><stop offset="1" stop-color="{R2[2]}"/></linearGradient>
'''
if MODE=='cyan':
    svg+=f'''<linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{TOP[0]}"/><stop offset="1" stop-color="{TOP[1]}"/></linearGradient>
<linearGradient id="u" x1="0" x2="1"><stop offset="0" stop-color="{BOT[0]}"/><stop offset=".35" stop-color="{BOT[1]}"/><stop offset=".5" stop-color="{BOT[2]}"/><stop offset=".65" stop-color="{BOT[1]}"/><stop offset="1" stop-color="{BOT[0]}"/></linearGradient>
'''
else:
    svg+='''<linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ECC71"/><stop offset=".5" stop-color="#C8FFE6"/><stop offset="1" stop-color="#2ECC71"/></linearGradient>
<linearGradient id="u2" x1="0" x2="1"><stop offset="0" stop-color="#50FFB0" stop-opacity=".0"/><stop offset=".5" stop-color="#50FFB0" stop-opacity=".9"/><stop offset="1" stop-color="#50FFB0" stop-opacity="0"/></linearGradient>
<radialGradient id="lit" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="24"><stop offset=".3" stop-color="#00C896" stop-opacity=".8"/><stop offset=".62" stop-color="#00C896" stop-opacity=".25"/><stop offset="1" stop-color="#00C896" stop-opacity="0"/></radialGradient>
<radialGradient id="h"><stop offset="0" stop-color="#00C896" stop-opacity=".42"/><stop offset=".5" stop-color="#00C896" stop-opacity=".14"/><stop offset="1" stop-color="#00C896" stop-opacity="0"/></radialGradient>
'''
svg+='</defs>\n'
if MODE!='cyan':
    svg+='<ellipse cx="32" cy="32" rx="27" ry="20" fill="url(#h)"/>\n'
def orbit(i,rx,ry,tilt,grad,w,body):
    k=sc(rx,ry)
    ref=''
    if REF:  # emerald reflection: a short arc on the side of the ring facing the equals (the inner edge), lit from the centre
        ref=f'<ellipse cx="32" cy="32" rx="{rx}" ry="{ry}" fill="none" stroke="url(#lit)" stroke-width="{w+.3}"/>'
    return f'''<g id="p{i}" class="v"><g transform="rotate({tilt} 32 32)">
 <ellipse cx="32" cy="32" rx="{rx}" ry="{ry}" fill="none" stroke="url(#{grad})" stroke-width="{w}" opacity="{ringop}"/>{ref}
 <g transform="translate(0 {32-32*k:.3f}) scale(1 {k:.4f})"><g id="b{i}" class="v">{body(rx)}</g></g>
</g></g>'''
if MODE=='cyan':
    body1=lambda rx: f'<circle cx="{32+rx}" cy="32" r="4.6" fill="{B1h}" opacity=".35"/><circle cx="{32+rx}" cy="32" r="2.6" fill="{B1}"/>'
    body2=lambda rx: f'<rect x="{32-rx-1.9}" y="30.1" width="3.8" height="3.8" fill="{B2}" transform="rotate(45 {32-rx} 32)"/>'
else:
    body1=lambda rx: f'<circle cx="{32+rx}" cy="32" r="4.2" fill="url(#lit)" opacity=".7"/><circle cx="{32+rx}" cy="32" r="2.5" fill="{B1}"/><circle cx="{32+rx}" cy="32" r="2.5" fill="url(#lit)"/>'
    body2=lambda rx: f'<rect x="{32-rx-1.9}" y="30.1" width="3.8" height="3.8" fill="{B2}" transform="rotate(45 {32-rx} 32)"/><rect x="{32-rx-1.9}" y="30.1" width="3.8" height="3.8" fill="url(#lit)" transform="rotate(45 {32-rx} 32)"/>'
svg+=f'<g id="s" class="v">\n{orbit(1,*O1,"r1",2.0,body1)}\n{orbit(2,*O2,"r2",1.6,body2)}\n</g>\n'
if MODE=='cyan':
    svg+=f'''<g transform="translate(32 32) scale(1.25) translate(-32 -32)">
<rect x="17.7" y="31.7" width="28.6" height="9.4" fill="{GLOW}" opacity=".18"/>
<rect id="g" x="18.6" y="32.6" width="26.8" height="7.6" fill="{GLOW}" opacity=".4"/>
<rect x="19.2" y="24.4" width="25.6" height="6.4" fill="url(#t)" stroke="{TOPs}" stroke-width=".7"/>
<rect x="19.2" y="33.2" width="25.6" height="6.4" fill="url(#u)"/>
</g>
</svg>
'''
else:
    bars=lambda y: f'''<rect x="16.9" y="{y-2.3}" width="30.2" height="11" rx="5.5" fill="#00C896" opacity=".12"/>
<rect x="18" y="{y-1.2}" width="28" height="8.8" rx="3.2" fill="#00C896" opacity=".26"/>
<rect x="19.2" y="{y}" width="25.6" height="6.4" fill="url(#u)"/>
<rect x="21" y="{y+2.6}" width="22" height="1.2" fill="url(#u2)"/>'''
    EQ=json.load(open(sys.argv[3])) if len(sys.argv)>3 else None
    if EQ:
        M=EQ['M'];d=M*0.618
        anim=f"#eqg{{animation:eqg {M:.3f}s linear -{d:.3f}s infinite}}#eqt,#eqb{{animation:eqt {M:.3f}s linear -{d:.3f}s infinite}}#eqp{{opacity:0;animation:eqp {M:.3f}s linear -{d:.3f}s infinite}}"
        anim+="".join(f"#eqn{k}{{opacity:0;animation:eqn{k} {M:.3f}s linear -{d:.3f}s infinite}}" for k in range(len(EQ['particles'])))
        rm=f"@media (prefers-reduced-motion:reduce){{#eqg{{animation:eqrm {EQ['T']:.2f}s ease-in-out infinite alternate!important}}}}@keyframes eqrm{{from{{transform:scale(1)}}to{{transform:scale(1.035)}}}}"
        svg=svg.replace('</style>','/* equals: breathe / snap / dematerialise, keyframes sampled offline from js/eq-physics.js by tools/gen-eq-keyframes.js (no JS here) */\n'+anim+'\n'+EQ['css']+'\n'+rm+'\n</style>',1)
        parts="".join(f'<g id="eqn{k}"><circle cx="{32+p["hx"]}" cy="{32+p["hy"]}" r="{p["r"]*1.9:.2f}" fill="#00C896" opacity=".3"/><circle cx="{32+p["hx"]}" cy="{32+p["hy"]}" r="{p["r"]}" fill="#B9FFDD"/></g>' for k,p in enumerate(EQ['particles']))
        svg+=f'''<g transform="translate(32 32) scale(1.25) translate(-32 -32)">
<circle id="eqp" class="v" cx="32" cy="32" r="15" fill="none" stroke="#50FFB0" stroke-width=".9"/>
<g id="eqg" class="v"><g id="eqt">{bars(24.4)}</g><g transform="matrix(1 0 0 -1 0 64)"><g id="eqb">{bars(24.4)}</g></g></g>
{parts}
</g>
</svg>
'''
    else:
        svg+=f'''<g transform="translate(32 32) scale(1.25) translate(-32 -32)">
{bars(24.4)}
{bars(33.2)}
</g>
</svg>
'''
import re
for c in re.findall(r"<!--(.*?)-->",svg,re.S): assert '--' not in c
open(OUT,'w').write(svg); print(OUT,len(svg.encode()),'bytes, animations:',svg.count('animation:')-1)
