#!/usr/bin/env python3
"""Simmie chat helper (routine side + box relay).

Secrets come from env (falls back to a login shell, `bash -lc`): SIMMIE_CHAT_PASSWORD_NEW if set, else
SIMMIE_CHAT_PASSWORD; SIMMIE_CHAT_WEBHOOK_URL, SIMMIE_CHAT_WEBHOOK_KEY. Nothing here ever prints them.

Fast routine path (one call each):
  context                    stdin: webhook body (may be empty on timer wakes). Ingests her message LOCALLY (staged,
                             no git), catches up relay messages, ensures the relay runs, prints what needs a reply
                             + recent history
  append --from simmie --text TEXT
                             live ping first, then commit staged messages + the reply in one commit and push
  flush                      commit/push staged messages without a reply (e.g. nothing to say)
  ignore ID...               never ingest/forward these ids again (persistent)

Other subcommands
  decrypt-payload            stdin: webhook body (or {"body": "<json string>"}) -> prints the plain message JSON
  ingest                     like decrypt-payload, and also appends her message to log.enc.json (dedup by id), pushes
  history [n]                last n plain messages (default 20)
  append --from simmie|daughter --text TEXT [--id ID --ts MS] [--no-ping]
                             encrypt + append to log.enc.json, git pull/commit/push; a simmie reply is also
                             pinged (encrypted) on the relay topic so the open page shows it instantly
  pending [--ingest]         her messages still on the relay (last ~12 h) that are not in the log yet
  relay                      run the relay forever (relay topic -> routine webhook); normally via relay-ensure
  relay-ensure               start the relay in the background if it isn't running
  relay-status               is the relay running, when did it last forward
  relay-restart              stop the relay and start it again (after code/password changes)
Global: --repo DIR (default: this script's folder), --no-git (local tests: no pull/commit/push)
"""
import argparse, base64, json, os, subprocess, sys, time, uuid, urllib.request, urllib.error, signal

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
STATE_DIR = os.path.expanduser(os.environ.get('SIMMIE_CHAT_STATE_DIR', '~/.config/simmie-chat'))
RELAY_FILE = os.path.join(STATE_DIR, 'relay.json')     # {"base": "https://ntfy.sh", "topic": "..."} (secret-ish, 0600)
STATE_FILE = os.path.join(STATE_DIR, 'relay-state.json')
PID_FILE = os.path.join(STATE_DIR, 'relay.pid')
LOG_FILE = os.path.join(STATE_DIR, 'relay.log')
IGNORE_FILE = os.path.join(STATE_DIR, 'ignore.json')   # ["id", ...] never (re)ingest / forward
STAGED_FILE = os.path.join(STATE_DIR, 'staged.enc.json')  # her ingested-but-not-yet-committed msgs (encrypted, 0600)
TEST_PREFIX = 'TEST from setup'
ITER = 250000


def die(msg, code=1):
    print('error: ' + msg, file=sys.stderr); sys.exit(code)


def secret(name, required=True):
    v = os.environ.get(name)
    if not v:
        try:
            v = subprocess.run(['bash', '-lc', 'printf %s "${%s}"' % name], capture_output=True, text=True, timeout=20).stdout
        except Exception:
            v = ''
    v = (v or '').strip('\r\n')
    if required and not v:
        die(f'{name} is not set')
    return v


def password():
    """The chat password: SIMMIE_CHAT_PASSWORD_NEW wins when set (password rotation), else SIMMIE_CHAT_PASSWORD."""
    return secret('SIMMIE_CHAT_PASSWORD_NEW', required=False) or secret('SIMMIE_CHAT_PASSWORD')


def load_ignore():
    v = load_json(IGNORE_FILE, [])
    return set(v) if isinstance(v, list) else set()


def add_ignore(ids):
    cur = load_ignore() | set(ids)
    save_private(IGNORE_FILE, sorted(cur))


def skip_msg(m, ignore=None):
    """True for setup tests and ignored ids: never ingest, forward or reply to these."""
    ignore = load_ignore() if ignore is None else ignore
    return m.get('id') in ignore or str(m.get('text', '')).lstrip().startswith(TEST_PREFIX)


def b64(b): return base64.b64encode(b).decode()
def unb64(s): return base64.b64decode(s)


def derive_key(password, salt_b64, iterations=ITER):
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=unb64(salt_b64), iterations=iterations)
    return kdf.derive(unicodedata.normalize('NFC', password).encode())


def encrypt_json(key, obj):
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode(), None)
    return {'iv': b64(iv), 'ct': b64(ct)}


def decrypt_json(key, box):
    return json.loads(AESGCM(key).decrypt(unb64(box['iv']), unb64(box['ct']), None).decode())


def save_private(path, obj):
    os.makedirs(os.path.dirname(path), mode=0o700, exist_ok=True)
    tmp = path + '.tmp'
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f: json.dump(obj, f)
    os.replace(tmp, path)


def load_json(path, default=None):
    try:
        with open(path) as f: return json.load(f)
    except Exception:
        return default


class Chat:
    def __init__(self, repo, use_git=True):
        self.repo, self.use_git = repo, use_git
        self._key = None

    @property
    def meta(self):
        m = load_json(os.path.join(self.repo, 'config.enc.json'))
        if not m: die('config.enc.json missing: run build.py first')
        return m

    @property
    def key(self):
        if self._key is None:
            m = self.meta
            self._key = derive_key(password(), m['kdf']['salt'], m['kdf']['iter'])
            try: decrypt_json(self._key, m['config'])
            except Exception: die('the chat password (SIMMIE_CHAT_PASSWORD_NEW / SIMMIE_CHAT_PASSWORD) does not match config.enc.json')
        return self._key

    @property
    def cfg(self): return decrypt_json(self.key, self.meta['config'])

    def git(self, *args, check=True):
        return subprocess.run(['git', '-C', self.repo, *args], capture_output=True, text=True, check=check)

    def log_path(self): return os.path.join(self.repo, 'log.enc.json')

    def read_log(self):
        data = load_json(self.log_path(), {'v': 1, 'entries': []})
        out = []
        for box in data.get('entries', []):
            try: out.append(decrypt_json(self.key, box))
            except Exception: pass
        return data, out

    # ---- staged (ingested locally, committed with the next reply) ----
    def read_staged(self):
        out = []
        for box in (load_json(STAGED_FILE, {}) or {}).get('entries', []):
            try: out.append(decrypt_json(self.key, box))
            except Exception: pass
        return out

    def write_staged(self, msgs):
        if not msgs:
            try: os.remove(STAGED_FILE)
            except FileNotFoundError: pass
            return
        save_private(STAGED_FILE, {'v': 1, 'entries': [encrypt_json(self.key, m) for m in msgs]})

    def stage(self, msgs):
        """Add msgs to the local staging file (no git). Returns the ones that were new."""
        _, plain = self.read_log(); staged = self.read_staged()
        have = {m.get('id') for m in plain} | {m.get('id') for m in staged}
        new = []
        for m in msgs:
            if m['id'] in have: continue
            have.add(m['id']); new.append(m)
        if new: self.write_staged(staged + new)
        return new

    def append(self, msgs):
        """msgs: list of plain dicts. Dedups by id. Pulls first, pushes after (retries on conflict)."""
        for attempt in range(3):
            if self.use_git:
                r = self.git('pull', '--rebase', '--quiet', 'origin', 'main', check=False)
                if r.returncode != 0:
                    self.git('rebase', '--abort', check=False)
                    self.git('fetch', '--quiet', 'origin', 'main', check=False)
                    self.git('reset', '--quiet', '--hard', 'origin/main', check=False)
            data, plain = self.read_log()
            have = {m.get('id') for m in plain}
            new = [m for m in msgs if m['id'] not in have]
            if not new: return []
            data.setdefault('entries', []).extend(encrypt_json(self.key, m) for m in new)
            data['v'] = 1
            with open(self.log_path(), 'w') as f: json.dump(data, f, separators=(',', ':')); f.write('\n')
            if not self.use_git: return new
            self.git('add', 'log.enc.json')
            self.git('commit', '--quiet', '-m', 'chat: +%d message(s)' % len(new))
            r = self.git('push', '--quiet', 'origin', 'HEAD:main', check=False)
            if r.returncode == 0: return new
            self.git('fetch', '--quiet', 'origin', 'main', check=False)
            self.git('reset', '--quiet', '--hard', 'origin/main', check=False)
            time.sleep(1)
        die('could not push log after 3 tries')

    def ping(self, msg):
        relay = self.cfg.get('relay') or {}
        if not relay.get('topic'): return
        body = json.dumps({'v': 1, **encrypt_json(self.key, msg)}).encode()
        req = urllib.request.Request(f"{relay['base']}/{relay['topic']}", data=body, method='POST',
                                     headers={'Content-Type': 'text/plain'})
        try: urllib.request.urlopen(req, timeout=8).read(); return True
        except Exception as e: print(f'(live ping failed: {type(e).__name__}; the page will still see it in the log)', file=sys.stderr)

    def open_payload(self, raw):
        """Accept the webhook body, the whole webhook_event ({"body": "..."}), or a relay message."""
        obj = json.loads(raw) if isinstance(raw, str) else raw
        for _ in range(3):
            if isinstance(obj, dict) and 'body' in obj and 'ct' not in obj:
                obj = json.loads(obj['body']) if isinstance(obj['body'], str) else obj['body']
            elif isinstance(obj, dict) and 'message' in obj and 'ct' not in obj and isinstance(obj['message'], str):
                obj = json.loads(obj['message'])
        if not (isinstance(obj, dict) and 'iv' in obj and 'ct' in obj): die('not a simmie-chat payload')
        try: m = decrypt_json(self.key, obj)
        except Exception: die('payload did not decrypt (wrong password or not from the chat page)')
        if not isinstance(m, dict) or not isinstance(m.get('text'), str) or not m.get('id'): die('payload has no message')
        m['from'] = 'daughter' if m.get('from') != 'simmie' else 'simmie'
        return m

    # ---- relay topic ----
    def relay_messages(self, since='12h', timeout=30):
        relay = self.cfg['relay']
        url = f"{relay['base']}/{relay['topic']}/json?poll=1&since={since}"
        out = []
        with urllib.request.urlopen(url, timeout=timeout) as r:
            for line in r.read().decode().splitlines():
                try:
                    ev = json.loads(line)
                    if ev.get('event') != 'message': continue
                    m = self.open_payload_quiet(ev.get('message', ''))
                    if m: out.append((ev, m))
                except Exception: pass
        return out

    def open_payload_quiet(self, s):
        try:
            box = json.loads(s)
            m = decrypt_json(self.key, box)
            if isinstance(m, dict) and isinstance(m.get('text'), str) and m.get('id'): return m
        except Exception: return None


def fmt(m):
    t = time.strftime('%a %d %b %H:%M', time.localtime(int(m.get('ts', 0)) / 1000))
    return f"[{t}] {m.get('from')}: {m.get('text')}"


# ---------------- relay daemon ----------------
def relay_forever(chat):
    url_hook, key_hook = secret('SIMMIE_CHAT_WEBHOOK_URL'), secret('SIMMIE_CHAT_WEBHOOK_KEY')
    key_hook = key_hook.replace('\r', '').replace('\n', '').strip()
    relay = chat.cfg['relay']
    st = load_json(STATE_FILE, {}) or {}
    st.setdefault('seen', [])
    sent_times = []

    def logline(s):
        with open(LOG_FILE, 'a') as f: f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + s + '\n')

    def typing(m):
        try:
            chat.ping({'type': 'typing', 'id': 't-' + uuid.uuid4().hex[:10], 'ref': m['id'], 'ts': int(time.time() * 1000)})
        except Exception as e: logline(f'typing ping failed: {type(e).__name__}')

    def forward(ev, m):
        if m.get('from') != 'daughter' or m['id'] in st['seen']: return
        if skip_msg(m):
            logline(f'skip {m["id"]} (test/ignored; not forwarded)')
            st['seen'] = (st['seen'] + [m['id']])[-500:]; save_private(STATE_FILE, st); return
        now = time.time()
        sent_times[:] = [t for t in sent_times if now - t < 600]
        if len(sent_times) >= 20: logline('rate limit hit; holding message ' + m['id']); return
        body = json.dumps({'source': 'simmie-chat', 'kind': 'daughter-message', 'v': 1,
                           'iv': json.loads(ev['message'])['iv'], 'ct': json.loads(ev['message'])['ct'],
                           'relay_id': ev.get('id')}).encode()
        req = urllib.request.Request(url_hook, data=body, method='POST', headers={
            'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key_hook})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=15) as r: code = r.status
            except urllib.error.HTTPError as e: code = e.code
            except Exception as e: code = type(e).__name__
            logline(f'forward {m["id"]} -> webhook {code}')
            if code == 200: typing(m); break
            time.sleep(5 * (attempt + 1))
        sent_times.append(now)
        st['seen'] = (st['seen'] + [m['id']])[-500:]
        st['last_forward'] = int(now)
        save_private(STATE_FILE, st)

    logline('relay started')
    backoffs, fails = [2, 5, 10], 0
    while True:
        since = st.get('last_id') or '10m'
        try:
            req = urllib.request.Request(f"{relay['base']}/{relay['topic']}/json?since={since}")
            with urllib.request.urlopen(req, timeout=60) as r:  # ntfy sends keepalives every ~45 s
                fails = 0
                for line in r:
                    ev = json.loads(line)
                    if ev.get('event') != 'message': continue
                    m = chat.open_payload_quiet(ev.get('message', ''))
                    if m: forward(ev, m)
                    st['last_id'] = ev.get('id'); save_private(STATE_FILE, st)
        except Exception as e:
            backoff = backoffs[min(fails, len(backoffs) - 1)]; fails += 1
            logline(f'stream ended: {type(e).__name__}; reconnecting in {backoff}s')
            time.sleep(backoff)


def relay_pid():
    try:
        pid = int(open(PID_FILE).read().strip()); os.kill(pid, 0)
        cmd = open(f'/proc/{pid}/cmdline').read()
        return pid if 'chat.py' in cmd and 'relay' in cmd else None
    except Exception:
        return None


def relay_start(chat):
    chat.key  # fail early if the password is missing/wrong
    secret('SIMMIE_CHAT_WEBHOOK_URL'); secret('SIMMIE_CHAT_WEBHOOK_KEY')
    os.makedirs(STATE_DIR, mode=0o700, exist_ok=True)
    cmd = f'exec setsid nohup python3 {os.path.abspath(__file__)} --repo {chat.repo} relay >>{LOG_FILE} 2>&1 < /dev/null &'
    subprocess.run(['bash', '-lc', cmd])
    for _ in range(30):
        time.sleep(0.2)
        pid = relay_pid()
        if pid: return pid
    return None


def relay_ensure(chat, quiet=False):
    pid = relay_pid()
    if pid: return f'relay running (pid {pid})'
    pid = relay_start(chat)
    return f'relay started (pid {pid})' if pid else 'relay FAILED to start; see ' + LOG_FILE


def relay_stop():
    pid = relay_pid()
    if not pid: return False
    try: os.killpg(pid, signal.SIGTERM)
    except Exception:
        try: os.kill(pid, signal.SIGTERM)
        except Exception: pass
    for _ in range(25):
        time.sleep(0.2)
        if not relay_pid(): return True
    try: os.kill(pid, signal.SIGKILL)
    except Exception: pass
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', default=HERE)
    ap.add_argument('--no-git', action='store_true')
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('decrypt-payload'); sub.add_parser('ingest')
    h = sub.add_parser('history'); h.add_argument('n', nargs='?', type=int, default=20); h.add_argument('--json', action='store_true')
    a = sub.add_parser('append'); a.add_argument('--from', dest='frm', choices=['simmie', 'daughter'], required=True)
    a.add_argument('--text', required=True); a.add_argument('--id'); a.add_argument('--ts', type=int); a.add_argument('--no-ping', action='store_true')
    p = sub.add_parser('pending'); p.add_argument('--ingest', action='store_true')
    sub.add_parser('relay'); sub.add_parser('relay-ensure'); sub.add_parser('relay-status'); sub.add_parser('relay-restart')
    c = sub.add_parser('context'); c.add_argument('-n', type=int, default=8)
    sub.add_parser('flush')
    ig = sub.add_parser('ignore'); ig.add_argument('ids', nargs='+')
    args = ap.parse_args()
    chat = Chat(os.path.abspath(args.repo), use_git=not args.no_git)

    if args.cmd == 'context':
        cmd_context(chat, sys.stdin.read() if not sys.stdin.isatty() else '', args.n)
    elif args.cmd == 'flush':
        staged = chat.read_staged()
        if not staged: print('nothing staged'); return
        new = chat.append(staged); chat.write_staged([])
        print(f'committed {len(new)} staged message(s)')
    elif args.cmd == 'ignore':
        add_ignore(args.ids)
        chat.write_staged([m for m in chat.read_staged() if m['id'] not in set(args.ids)])
        print(f'ignoring {len(args.ids)} id(s)')
    elif args.cmd in ('decrypt-payload', 'ingest'):
        m = chat.open_payload(sys.stdin.read())
        if args.cmd == 'ingest':
            new = chat.append([m])
            m['_logged'] = 'added' if new else 'already in log'
        print(json.dumps(m, ensure_ascii=False))
    elif args.cmd == 'history':
        if chat.use_git: chat.git('pull', '--rebase', '--quiet', 'origin', 'main', check=False)
        _, plain = chat.read_log()
        plain.sort(key=lambda m: m.get('ts', 0))
        for m in plain[-args.n:] if args.n else plain:
            print(json.dumps(m, ensure_ascii=False) if args.json else fmt(m))
    elif args.cmd == 'append':
        m = {'id': args.id or ('s-' if args.frm == 'simmie' else 'd-') + uuid.uuid4().hex[:12],
             'ts': args.ts or int(time.time() * 1000), 'from': args.frm, 'text': args.text}
        _, plain = chat.read_log()
        if m['id'] in {x.get('id') for x in plain}: print('already in log ' + m['id']); return
        if args.frm == 'simmie' and not args.no_ping: chat.ping(m)   # page shows it now; the log follows
        staged = chat.read_staged()
        new = chat.append(staged + [m])                            # one commit: her staged msg(s) + the reply
        chat.write_staged([])
        print(('appended ' if any(x['id'] == m['id'] for x in new) else 'already in log ') + m['id'] +
              (f' (+{len(staged)} staged)' if staged else ''))
    elif args.cmd == 'pending':
        _, plain = chat.read_log(); have = {m['id'] for m in plain}
        have |= {m['id'] for m in chat.read_staged()}; ign = load_ignore()
        todo = [m for ev, m in chat.relay_messages() if m.get('from') == 'daughter' and m['id'] not in have and not skip_msg(m, ign)]
        uniq = list({m['id']: m for m in todo}.values())
        for m in uniq: print(fmt(m))
        if args.ingest and uniq: print(f'appended {len(chat.append(uniq))}')
        if not uniq: print('nothing pending')
    elif args.cmd == 'relay':
        os.makedirs(STATE_DIR, mode=0o700, exist_ok=True)
        with open(PID_FILE, 'w') as f: f.write(str(os.getpid()))
        relay_forever(chat)
    elif args.cmd == 'relay-ensure':
        print(relay_ensure(chat))
    elif args.cmd == 'relay-restart':
        relay_stop(); print(relay_ensure(chat))
    elif args.cmd == 'relay-status':
        pid = relay_pid(); st = load_json(STATE_FILE, {}) or {}
        lf = st.get('last_forward')
        print(('running pid %s' % pid) if pid else 'NOT running',
              '| last forward:', time.strftime('%Y-%m-%d %H:%M', time.localtime(lf)) if lf else 'never')


def cmd_context(chat, raw, n=8):
    """One call per routine wake: ingest (locally), catch up, ensure relay, print a compact block."""
    ign = load_ignore(); incoming = []; notes = []
    raw = (raw or '').strip()
    if raw:
        try: incoming.append(chat.open_payload(raw))
        except SystemExit: notes.append('webhook body did not decrypt / was not a chat message')
    try:
        incoming += [m for ev, m in chat.relay_messages(timeout=10) if m.get('from') == 'daughter']
    except Exception as e: notes.append(f'relay catch-up failed ({type(e).__name__})')
    incoming = [m for m in {m['id']: m for m in incoming}.values() if m.get('from') == 'daughter']
    skipped = [m for m in incoming if skip_msg(m, ign)]
    chat.stage([m for m in incoming if not skip_msg(m, ign)])
    status = relay_ensure(chat)
    _, plain = chat.read_log()
    allm = {m['id']: m for m in plain}
    for m in chat.read_staged(): allm.setdefault(m['id'], m)
    allm = sorted((m for m in allm.values() if not skip_msg(m, ign)), key=lambda m: m.get('ts', 0))
    last_s = max([m.get('ts', 0) for m in allm if m.get('from') == 'simmie'] or [0])
    cutoff = time.time() * 1000 - 12 * 3600 * 1000
    need = [m for m in allm if m.get('from') == 'daughter' and m.get('ts', 0) > last_s and m.get('ts', 0) > cutoff]
    print('== NEEDS REPLY ==')
    for m in need: print(fmt(m))
    if not need: print('NONE')
    print(f'== LAST {n} ==')
    for m in [m for m in allm if m not in need][-n:]: print(fmt(m))
    extra = [status] + notes + ([f'skipped {len(skipped)} test/ignored msg(s)'] if skipped else [])
    print('== ' + ' | '.join(extra) + ' ==')


if __name__ == '__main__':
    main()
