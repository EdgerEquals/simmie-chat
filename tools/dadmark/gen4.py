# Detailed (zoom) Dad mark, emerald version (Danny t713u/t714u). Builds on gen3.py's geometry, then recolours:
# equals = identical emerald neon bars (brightest element); everything else dimmer, deeper Dad blues; emerald light from the sign on rings/bodies.
# usage: gen4.py OUT [nobars]
import sys, re
src=open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'gen3.py')).read()
src=src[:src.index("import re\nfor c in re.findall")]
ns={}; sys_argv=sys.argv; sys.argv=['gen3']; exec(src,ns); sys.argv=sys_argv
svg=ns['svg']; OUT=sys.argv[1]; NOBARS='nobars' in sys.argv[2:]
def R(a,b,n=1):
    global svg
    assert svg.count(a)==n,(a[:70],svg.count(a)); svg=svg.replace(a,b)
R('<linearGradient id="gR1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1F5478"/><stop offset=".5" stop-color="#9DBCCE"/><stop offset="1" stop-color="#0AF2FF"/></linearGradient>',
  '<linearGradient id="gR1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#143A57"/><stop offset=".5" stop-color="#1F5478"/><stop offset="1" stop-color="#2B6A92"/></linearGradient>')
R('<linearGradient id="gR2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#143A57"/><stop offset=".55" stop-color="#85A6BB"/><stop offset="1" stop-color="#0AF2FF"/></linearGradient>',
  '<linearGradient id="gR2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E2A40"/><stop offset=".55" stop-color="#1F5478"/><stop offset="1" stop-color="#2B6A92"/></linearGradient>')
R('<radialGradient id="gCore"><stop offset="0" stop-color="#1F5478" stop-opacity=".55"/>','<radialGradient id="gCore"><stop offset="0" stop-color="#0B4A3C" stop-opacity=".5"/>')
# emerald light from the sign: strongest on the parts of each ring nearest the centre
R('<clipPath id="cBars">','<radialGradient id="lit" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="24"><stop offset=".3" stop-color="#00C896" stop-opacity=".75"/><stop offset=".62" stop-color="#00C896" stop-opacity=".22"/><stop offset="1" stop-color="#00C896" stop-opacity="0"/></radialGradient>\n'
  '<linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ECC71"/><stop offset=".5" stop-color="#B9FFDD"/><stop offset="1" stop-color="#2ECC71"/></linearGradient>\n'
  '<filter id="emNeon" x="-40%" y="-120%" width="180%" height="340%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>\n<clipPath id="cBars">')
R('<ellipse id="ring1" cx="32" cy="32" rx="29" ry="11" stroke="url(#gR1)" stroke-width="1.7"/>','<ellipse id="ring1" cx="32" cy="32" rx="29" ry="11" stroke="url(#gR1)" stroke-width="1.7" opacity=".85"/><ellipse class="lit" cx="32" cy="32" rx="29" ry="11" stroke="url(#lit)" stroke-width="1.9"/>')
R('<ellipse id="ring2" cx="32" cy="32" rx="26" ry="14" stroke="url(#gR2)" stroke-width="1.3"/>','<ellipse id="ring2" cx="32" cy="32" rx="26" ry="14" stroke="url(#gR2)" stroke-width="1.3" opacity=".85"/><ellipse class="lit" cx="32" cy="32" rx="26" ry="14" stroke="url(#lit)" stroke-width="1.5"/>')
R('<g id="t1" stroke="#0AF2FF" filter="url(#neon)">','<g id="t1" stroke="#1F8FC0" filter="url(#neon)" opacity=".55">')
R('<circle class="tw" r="3.1" stroke="#0AF2FF"','<circle class="tw" r="3.1" stroke="#1F8FC0"')
R('<circle r="1.6" fill="#E6FDFF" filter="url(#neon)"/>','<circle r="1.6" fill="#7FA6BE" filter="url(#neon)"/><circle r="2.2" fill="none" stroke="#00C896" stroke-width=".35" opacity=".45"/>')
R('<g id="t2" stroke="#9DBCCE">','<g id="t2" stroke="#4F7896">')
R('fill="none" stroke="#9DBCCE" stroke-width=".55"/></g>','fill="none" stroke="#6F93AB" stroke-width=".55"/><circle r="2.9" fill="none" stroke="#00C896" stroke-width=".3" opacity=".4"/></g>')
R('<use id="nfF" href="#fF" class="flow" stroke="#0AF2FF" stroke-width=".5" filter="url(#soft)"/>','<use id="nfF" href="#fF" class="flow" stroke="#1F8FC0" stroke-width=".5" filter="url(#soft)" opacity=".75"/>')
R('<use href="#hF" id="hxF" class="flow" stroke="#9DBCCE"','<use href="#hF" id="hxF" class="flow" stroke="#5F86A0"')
R('stroke="#0AF2FF" stroke-width=".35"/>','stroke="#2B6A92" stroke-width=".35"/>',2)
R('<path id="rosA" d="','<path id="rosA" stroke-opacity=".7" d="')
svg=svg.replace('<path id="rosA" stroke-opacity=".7" d="'+ns['rosA']+'" stroke="#0AF2FF"','<path id="rosA" stroke-opacity=".7" d="'+ns['rosA']+'" stroke="#2B6A92"')
R('<g fill="#E6FDFF">','<g fill="#6F93AB">')
R('.v{transform-box:view-box;transform-origin:32px 32px}','.v{transform-box:view-box;transform-origin:32px 32px}\n.pc{opacity:.72}')
R('#barB{animation:neon var(--t-glow) ease-in-out calc(var(--t-glow) * -0.270) infinite alternate}\n','')
bar=lambda y,i: (f'<rect x="18.6" y="{y-.6}" width="26.8" height="7.6" rx="1.2" fill="#00C896" opacity=".55" filter="url(#emNeon)"/>'
                 f'<rect id="bar{i}" x="19.2" y="{y}" width="25.6" height="6.4" fill="url(#gEm)" stroke="#50FFB0" stroke-width=".35"/>')
old_bars=re.search(r' <rect x="19\.2" y="24\.4".*?\n <rect id="barB".*?/>\n',svg,re.S).group(0)
svg=svg.replace(old_bars,' '+bar(24.4,'A')+'\n '+bar(33.2,'B')+'\n')
svg=svg.replace('<!-- Dad mark v2 (draft3)','<!-- Dad mark v2, EMERALD (Danny t713u/t714u: identical emerald neon bars, everything else dimmer, emerald light on the rings and bodies)',1)

EQP=[a for a in sys.argv[2:] if a.endswith('.json')]
if EQP:
    import json
    EQ=json.load(open(EQP[0])); M=EQ['M']; d=M*0.618
    svg=re.sub(r'--t-eq-\w+:[^;]*;[^\n]*\n','',svg)
    svg=re.sub(r'#eq-(jump|shrink|spin|tilt|fade)\{[^\n]*\n@keyframes eq-\1\{.*?\}\}\n?','',svg,flags=re.S)
    assert 'eq-jump' in svg
    anim=f"#eqg{{animation:eqg {M:.3f}s linear -{d:.3f}s infinite}}#eqt,#eqb{{animation:eqt {M:.3f}s linear -{d:.3f}s infinite}}#eqp{{opacity:0;animation:eqp {M:.3f}s linear -{d:.3f}s infinite}}"
    anim+="".join(f"#eqn{k}{{opacity:0;animation:eqn{k} {M:.3f}s linear -{d:.3f}s infinite}}" for k in range(len(EQ['particles'])))
    rm=f"@media (prefers-reduced-motion:reduce){{#eqg{{animation:eqrm {EQ['T']:.2f}s ease-in-out infinite alternate!important}}}}@keyframes eqrm{{from{{transform:scale(1)}}to{{transform:scale(1.035)}}}}"
    svg=svg.replace('/* size tiers:','/* equals: breathe / snap / dematerialise, keyframes sampled offline from js/eq-physics.js (tools/gen-eq-keyframes.js); the zoom view runs the live model instead */\n'+anim+'\n'+EQ['css']+'\n'+rm+'\n/* size tiers:',1)
    parts="".join(f'<g id="eqn{k}" filter="url(#emNeon)"><circle cx="{32+p["hx"]}" cy="{32+p["hy"]}" r="{p["r"]}" fill="#B9FFDD"/></g>' for k,p in enumerate(EQ['particles']))
    newblk=(f'<g id="dm-eq"><g id="eq-size" class="v">\n<circle id="eqp" class="v" cx="32" cy="32" r="15" fill="none" stroke="#50FFB0" stroke-width=".7"/>\n'
            f'<g id="eqg" class="v"><g id="eqt">{bar(24.4,"A")}</g><g transform="matrix(1 0 0 -1 0 64)"><g id="eqb">{bar(24.4,"B")}</g></g>'
            f'<g clip-path="url(#cBars)"><g id="shim"><rect x="16" y="20" width="9" height="24" fill="url(#gShim)" transform="skewX(-20) translate(10 0)"/></g></g></g>\n{parts}\n</g></g>\n')
    svg=re.sub(r'<g id="dm-eq">.*?</g></g></g></g></g></g></g>\n',lambda m_:newblk,svg,flags=re.S)
    assert 'eq-jump' not in svg, 'old effects left'
svg=re.sub(r'<linearGradient id="g(Top|Bot)".*?</linearGradient>\n','',svg)
if NOBARS:
    svg=re.sub(r'<g id="dm-eq">.*?</g></g></g></g></g></g></g>\n','',svg,flags=re.S)
    if '<g id="dm-eq">' in svg: svg=svg[:svg.index('<g id="dm-eq">')]+'</svg>\n'
    assert 'id="dm-eq"' not in svg
for c in re.findall(r"<!--(.*?)-->",svg,re.S): assert '--' not in c
open(OUT,'w').write(svg); print(OUT,len(svg.encode()),'bytes')
