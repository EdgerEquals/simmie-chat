#!/usr/bin/env python3
"""Rule 12 / Season pumps self-check (dev only; not loaded by any page). Lists every fixed numeric literal in the given JS files
that is not one of:
  - 0, 1 or 2 (identity, a whole cycle, the halving: the shape of a cycle, per the Season pumps standard),
  - a phi-step exponent: Math.pow(PHI, n) / Math.pow(IP, n), or an array index a[n],
  - on a line tagged in its trailing comment with  cite:  (cited clock or physical constant),  anchor:  (measured anchor,
    e.g. the city point),  unit:  (a unit definition, e.g. ms per second) or  phi:  (the golden ratio itself).
Comments are not scanned for numbers. Exit 1 if anything is listed (the alert blocks the draft until it is a ratio or anchor).
Skipped on purpose (Danny 10:06 AWST 26 Oct 2026, Rule phi build A): security and policy code is never tuned to phi, so it is not
scanned: the passcode gate, the crypto, the gate's hashing config and the age-dial policy (files and blocks listed in SKIP_FILES and
SKIP_BLOCKS below; a skipped file or block is reported as skipped, never silently).
Usage: phi_selfcheck.py FILE.js [FILE.js ...]"""
import re, sys
NUM = re.compile(r'(?<![\w.$#])(\d+\.\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?|\d+(?:e[+-]?\d+)?)(?![\w.])', re.I)
TAG = re.compile(r'\b(cite|anchor|unit|phi):', re.I)
STEP = re.compile(r'Math\.pow\(\s*(?:PHI|IP)\s*,\s*-?$')
OK = {0.0, 1.0, 2.0}
import os
SKIP_FILES = {   # basename -> reason (whole file is security or policy, not tuning)
    'crypto.js': 'crypto (PBKDF2 / AES-GCM sizes)',
    'config.js': 'gate hashing config (PBKDF2 iterations, salt)',
    'agedial.js': 'age-dial policy (10-16 range, cited height table)',
    'agedial-btn.js': 'age-dial policy control',
}
SKIP_BLOCKS = [   # (basename, first line regex, line regex that ends the block (not skipped), reason)
    ('app.js', re.compile(r'//\s*-+\s*gate\s*-+'), re.compile(r'\$\("#lock"\)'), 'passcode gate (retry back-off)'),
    ('app.js', re.compile(r"\$\('login-form'\)\.addEventListener"), re.compile(r'^\s*\}\);\s*$'), 'chat password gate'),
]
def split(line, in_block):
    code, com, i = '', '', 0
    while i < len(line):
        if in_block:
            j = line.find('*/', i)
            if j < 0: com += line[i:]; return code, com, True
            com += line[i:j]; i = j + 2; in_block = False; continue
        if line.startswith('/*', i): in_block = True; i += 2; continue
        if line.startswith('//', i) and (i == 0 or line[i - 1] != ':'): com += line[i:]; break
        code += line[i]; i += 1
    return code, com, in_block
def check(path):
    hits, blk, base, skip = [], False, os.path.basename(path), None
    if base in SKIP_FILES:
        print(f'{path}: skipped ({SKIP_FILES[base]})'); return []
    blocks = [b for b in SKIP_BLOCKS if b[0] == base]
    for n, line in enumerate(open(path, encoding='utf-8'), 1):
        if skip is None:
            for b in blocks:
                if b[1].search(line): skip = b; print(f'{path}: line {n}: block skipped ({b[3]})'); break
        elif skip[2].search(line): skip = None
        if skip is not None: blk = split(line.rstrip('\n'), blk)[2]; continue
        code, com, blk = split(line.rstrip('\n'), blk)
        code = re.sub(r'/(?:\\.|[^/\n])+/[gimsuy]*(?=[.,);\s])', '/re/', code)   # regex literals hold no parameters
        if TAG.search(com): continue
        for m in NUM.finditer(code):
            if float(m.group(1)) in OK: continue
            if STEP.search(code[:m.start()]): continue
            if code[:m.start()].endswith('[') and code[m.end():].startswith(']'): continue   # an index, not a parameter
            hits.append((n, m.group(1), line.strip()[:110]))
    return hits
total = 0
for f in sys.argv[1:]:
    h = check(f); total += len(h)
    print(f'{f}: {len(h)} fixed literal(s) not phi, cited or anchored')
    for n, v, l in h: print(f'  line {n}: {v}    | {l}')
print('ALERT: blocked until each is a ratio or a cited / kid-input anchor' if total else 'PASS: no fixed parameters outside phi, cited clocks/constants and measured anchors')
sys.exit(1 if total else 0)
