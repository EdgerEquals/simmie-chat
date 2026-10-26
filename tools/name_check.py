#!/usr/bin/env python3
"""Box only: name check on every word, for anything about to go public from the kid's repos (diff lines, commit messages, tag and branch
names, page titles, exports). Same logic as the Kids Club reference build: EACH WORD of the kid's name is tested on its own,
case-insensitive, as a substring (whole word only when shorter than MIN letters). Names come only from the private roles file and are
never printed: a hit says 'kid word 2' and the place.
  name_check.py --kid kid-b FILE...           check files
  name_check.py --kid kid-b --git REPO RANGE  check added lines of a diff, its commit messages and the repo's refs
  name_check.py --kid kid-b --text 'text'     check one string
Exit 1 on any hit. NOTE: the kid's first name already appears across the kid's public pages and history by design (her pages are
named for her), so run it with --extra-only to check just the private extra words (e.g. a surname) when that is the question."""
import json, re, subprocess, sys
ROLES = '/home/box/usage-layer/private/roles.json'
MIN = 3   # words shorter than this are checked as whole words only
def words(kid, extra=None, extra_only=False):
    names = [] if extra_only else [json.load(open(ROLES))[kid]]
    if extra: names += [l.strip() for l in open(extra, encoding='utf-8') if l.strip()]
    out = []
    for name in names:
        for k, w in enumerate(re.findall(r"[^\W\d_]+", name), 1):
            out.append((f'kid word {len(out) + 1}', re.compile(re.escape(w) if len(w) >= MIN else r'\b' + re.escape(w) + r'\b', re.I)))
    return out
def scan(label, text, W):
    return [f'{label}:{i}  ({tag})' for i, line in enumerate(text.splitlines(), 1) for tag, rx in W if rx.search(line)]
def main(a):
    kid = a[a.index('--kid') + 1]; extra = a[a.index('--extra') + 1] if '--extra' in a else None
    W = words(kid, extra, '--extra-only' in a); rest = [x for i, x in enumerate(a) if x not in ('--kid', kid, '--extra', extra, '--extra-only')]
    hits = []
    if rest[:1] == ['--git']:
        repo, rng = rest[1], rest[2]
        diff = subprocess.run(['git', '-C', repo, 'diff', rng], capture_output=True, text=True).stdout
        hits += scan('diff(+)', '\n'.join(l[1:] for l in diff.splitlines() if l.startswith('+') and not l.startswith('+++')), W)
        hits += scan('commit msgs', subprocess.run(['git', '-C', repo, 'log', '--format=%B', rng], capture_output=True, text=True).stdout, W)
        hits += scan('refs', subprocess.run(['git', '-C', repo, 'for-each-ref', '--format=%(refname)'], capture_output=True, text=True).stdout, W)
    elif rest[:1] == ['--text']: hits += scan('text', rest[1], W)
    else:
        for f in rest:
            try: hits += scan(f, open(f, encoding='utf-8', errors='replace').read(), W)
            except OSError as e: print('unreadable', f, e)
    for h in hits: print('NAME HIT', h)
    print(f'name check: {len(hits)} hit(s), {len(W)} name word(s) tested one by one'); return 1 if hits else 0
if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
