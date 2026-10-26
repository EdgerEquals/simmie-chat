#!/usr/bin/env python3
"""Box only. Builds the salted hash list for js/name-check.js from the PRIVATE roles file, without ever printing a name.
Each word of the kid's name (lower case, NFC) becomes {n: its length, h: hex PBKDF2-SHA256(word, salt, ITER, BITS)}. A fresh random
salt is made on every build, so an old list can't be matched against a new one. Output is JSON for a page to fetch.
  build_name_hashes.py --kid kid-b --out PATH [--roles /home/box/usage-layer/private/roles.json] [--extra PRIVATE_FILE]
--extra: an optional private file with more names for the same kid (e.g. a call-me name), one per line; never committed.
Prints only counts. KEEP THE OUTPUT OUT OF ANY PUBLIC PAGE until Danny has chosen where it may live (see the report)."""
import argparse, base64, hashlib, json, os, re, unicodedata
ITER, BITS, MIN, SALT = 2 ** 14, 2 ** 7, 3, 2 ** 4   # security sizes, not tuning (like crypto.js): iterations, hash bits, short-word length, salt bytes
def main():
    a = argparse.ArgumentParser(); a.add_argument('--kid', required=True); a.add_argument('--out', required=True)
    a.add_argument('--roles', default='/home/box/usage-layer/private/roles.json'); a.add_argument('--extra')
    o = a.parse_args()
    names = [json.load(open(o.roles))[o.kid]]
    if o.extra and os.path.exists(o.extra): names += [l.strip() for l in open(o.extra, encoding='utf-8') if l.strip()]
    ws = []
    for n in names:
        for w in re.findall(r"[^\W\d_]+", unicodedata.normalize('NFC', n).lower()):
            if w not in ws: ws.append(w)
    salt = os.urandom(SALT)
    out = {'v': 1, 'salt': base64.b64encode(salt).decode(), 'iter': ITER, 'bits': BITS, 'min': MIN,
           'words': [{'n': len(w), 'h': hashlib.pbkdf2_hmac('sha256', w.encode(), salt, ITER, BITS // 8).hex()} for w in ws]}
    json.dump(out, open(o.out, 'w')); print(f'name hashes: {len(ws)} word(s) written, salt fresh, names not shown')
if __name__ == '__main__': main()
