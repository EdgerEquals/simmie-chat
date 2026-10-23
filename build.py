#!/usr/bin/env python3
"""Build config.enc.json for the Simmie chat page.

Needs SIMMIE_CHAT_PASSWORD, SIMMIE_CHAT_WEBHOOK_URL, SIMMIE_CHAT_WEBHOOK_KEY (env, or a login shell); refuses if any is missing.
Writes config.enc.json = {v, kdf:{salt, iter}, config: AES-GCM(password-derived key, {relay, repo, branch})}.
The webhook URL + key are deliberately NOT put in the page: the browser can't call the webhook (no CORS for this
site), so the box relay holds them and forwards. The page only needs the (random, secret) relay topic.
Keeps the existing salt if the password still matches, so the log stays readable.
  --push   also git add/commit/push config.enc.json
  --rotate-salt  new salt (only allowed while log.enc.json is empty)
"""
import json, os, secrets, subprocess, sys, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chat as C

HERE = os.path.dirname(os.path.abspath(__file__))
names = ['SIMMIE_CHAT_PASSWORD', 'SIMMIE_CHAT_WEBHOOK_URL', 'SIMMIE_CHAT_WEBHOOK_KEY']
vals = {n: C.secret(n, required=False) for n in names}
missing = [n for n in names if not vals[n]]
if missing: C.die('missing env: ' + ', '.join(missing) + ' (nothing written)')
if not vals['SIMMIE_CHAT_WEBHOOK_URL'].startswith('https://'): C.die('SIMMIE_CHAT_WEBHOOK_URL is not an https URL')

repo = HERE
cfg_path = os.path.join(repo, 'config.enc.json')
old = C.load_json(cfg_path)
log = C.load_json(os.path.join(repo, 'log.enc.json'), {'entries': []})
salt = None
if old and '--rotate-salt' not in sys.argv:
    try:
        C.decrypt_json(C.derive_key(vals['SIMMIE_CHAT_PASSWORD'], old['kdf']['salt'], old['kdf']['iter']), old['config'])
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
key = C.derive_key(vals['SIMMIE_CHAT_PASSWORD'], salt)
out = {'v': 1, 'kdf': {'name': 'PBKDF2', 'hash': 'SHA-256', 'iter': C.ITER, 'salt': salt},
       'config': C.encrypt_json(key, {'relay': relay, 'repo': 'EdgerEquals/simmie-chat', 'branch': 'main'})}
with open(cfg_path, 'w') as f: json.dump(out, f, indent=1); f.write('\n')
print('wrote config.enc.json (salt %s)' % ('kept' if old and salt == old['kdf']['salt'] else 'new'))
if '--push' in sys.argv:
    g = lambda *a: subprocess.run(['git', '-C', repo, *a], check=True, capture_output=True, text=True)
    g('add', 'config.enc.json')
    if subprocess.run(['git', '-C', repo, 'diff', '--cached', '--quiet']).returncode:
        g('commit', '-m', 'Update encrypted config'); g('push', 'origin', 'HEAD:main'); print('pushed')
    else: print('no change to push')
