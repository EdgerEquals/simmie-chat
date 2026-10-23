#!/usr/bin/env python3
"""Build config.enc.json for the Simmie chat page.

Needs the chat password (SIMMIE_CHAT_PASSWORD_NEW if set, else SIMMIE_CHAT_PASSWORD), SIMMIE_CHAT_WEBHOOK_URL, SIMMIE_CHAT_WEBHOOK_KEY (env, or a login shell); refuses if any is missing.
Writes config.enc.json = {v, kdf:{salt, iter}, config: AES-GCM(password-derived key, {relay, repo, branch})}.
The webhook URL + key are deliberately NOT put in the page: the browser can't call the webhook (no CORS for this
site), so the box relay holds them and forwards. The page only needs the (random, secret) relay topic.
Keeps the existing salt if the password still matches, so the log stays readable.
  --push   also git add/commit/push config.enc.json
  --rotate-salt  new salt (only allowed while log.enc.json is empty)
  --rotate-password  the password changed: decrypt config + every log entry with the OLD password
                 (SIMMIE_CHAT_PASSWORD), re-encrypt everything with SIMMIE_CHAT_PASSWORD_NEW and a new salt.
                 Ids in the ignore list are dropped from the log. Restart the relay afterwards.
"""
import json, os, secrets, subprocess, sys, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chat as C

HERE = os.path.dirname(os.path.abspath(__file__))
names = ['SIMMIE_CHAT_WEBHOOK_URL', 'SIMMIE_CHAT_WEBHOOK_KEY']
vals = {n: C.secret(n, required=False) for n in names}
vals['PW'] = C.secret('SIMMIE_CHAT_PASSWORD_NEW', required=False) or C.secret('SIMMIE_CHAT_PASSWORD', required=False)
missing = [n for n in names if not vals[n]] + ([] if vals['PW'] else ['SIMMIE_CHAT_PASSWORD(_NEW)'])
if missing: C.die('missing env: ' + ', '.join(missing) + ' (nothing written)')
if not vals['SIMMIE_CHAT_WEBHOOK_URL'].startswith('https://'): C.die('SIMMIE_CHAT_WEBHOOK_URL is not an https URL')

repo = HERE
cfg_path = os.path.join(repo, 'config.enc.json')
old = C.load_json(cfg_path)
log = C.load_json(os.path.join(repo, 'log.enc.json'), {'entries': []})
salt = None
log_path = os.path.join(repo, 'log.enc.json')
new_entries_plain = None
if '--rotate-password' in sys.argv:
    if not old: C.die('--rotate-password: no existing config.enc.json')
    oldpw = C.secret('SIMMIE_CHAT_PASSWORD', required=False)
    k_old = None
    for cand in [oldpw, vals['PW']]:
        if not cand: continue
        try:
            k = C.derive_key(cand, old['kdf']['salt'], old['kdf']['iter']); C.decrypt_json(k, old['config']); k_old = k; break
        except Exception: pass
    if not k_old: C.die('--rotate-password: neither password opens the current config. Nothing written.')
    plain, bad = [], 0
    for box in log.get('entries', []):
        try: plain.append(C.decrypt_json(k_old, box))
        except Exception: bad += 1
    if bad: C.die(f'--rotate-password: {bad} log entries did not decrypt with the old password. Nothing written.')
    ign = C.load_ignore()
    new_entries_plain = [m for m in plain if m.get('id') not in ign]
    staged_plain = []
    for box in (C.load_json(C.STAGED_FILE, {}) or {}).get('entries', []):
        try: staged_plain.append(C.decrypt_json(k_old, box))
        except Exception: pass
    print(f'rotating: {len(plain)} log entries, dropping {len(plain) - len(new_entries_plain)} ignored, {len(staged_plain)} staged')
elif old and '--rotate-salt' not in sys.argv:
    try:
        C.decrypt_json(C.derive_key(vals['PW'], old['kdf']['salt'], old['kdf']['iter']), old['config'])
        salt = old['kdf']['salt']
    except Exception:
        if log.get('entries'):
            C.die('password changed but log.enc.json has messages encrypted with the old one; '
                  'archive/empty the log first (or keep the old password). Nothing written.')
elif '--rotate-salt' in sys.argv and log.get('entries'):
    C.die('--rotate-salt only allowed while the log is empty')
salt = salt or base64.b64encode(secrets.token_bytes(16)).decode()

relay = C.load_json(C.RELAY_FILE)
if not relay:
    relay = {'base': 'https://ntfy.sh', 'topic': 'sc-' + secrets.token_urlsafe(24).replace('-', 'x').replace('_', 'y')}
    C.save_private(C.RELAY_FILE, relay)
key = C.derive_key(vals['PW'], salt)
out = {'v': 1, 'kdf': {'name': 'PBKDF2', 'hash': 'SHA-256', 'iter': C.ITER, 'salt': salt},
       'config': C.encrypt_json(key, {'relay': relay, 'repo': 'EdgerEquals/simmie-chat', 'branch': 'main'})}
if new_entries_plain is not None:
    # verify before writing anything
    test = [C.encrypt_json(key, m) for m in new_entries_plain]
    assert [C.decrypt_json(key, b) for b in test] == new_entries_plain
    with open(log_path, 'w') as f: json.dump({'v': 1, 'entries': test}, f, separators=(',', ':')); f.write('\n')
    if staged_plain: C.save_private(C.STAGED_FILE, {'v': 1, 'entries': [C.encrypt_json(key, m) for m in staged_plain]})
with open(cfg_path, 'w') as f: json.dump(out, f, indent=1); f.write('\n')
print('wrote config.enc.json (salt %s)' % ('kept' if old and salt == old['kdf']['salt'] else 'new'))
if '--push' in sys.argv:
    g = lambda *a: subprocess.run(['git', '-C', repo, *a], check=True, capture_output=True, text=True)
    g('add', 'config.enc.json', 'log.enc.json')
    if subprocess.run(['git', '-C', repo, 'diff', '--cached', '--quiet']).returncode:
        g('commit', '-m', 'Rotate chat password (re-encrypt config + log)' if new_entries_plain is not None else 'Update encrypted config'); g('push', 'origin', 'HEAD:main'); print('pushed')
    else: print('no change to push')
