"""Headless checks for the sound-back ladder in js/rhythm-continuity.js (shared.md 'Sound comes back after another app borrows it',
guards 17:31 and 18:47 AWST 26 Oct). Chromium + WebKit, iPhone SE portrait, touch.
  1 an interruption while the page stays in view is resumed by the ladder, which then STOPS once output is confirmed (no more resume()).
  2 a paused helper <audio> is never restarted by a timer; the next real tap restarts it.
  3 when every timed resume is refused (iOS-like), the ladder gives up after its top rung, shows the one gentle button, and a scrolling
    touch (start, move, cancel: no lift) still brings the sound back.
  4 her own pause is never undone.
Gates: passed only by the DOM unhide the other tests use (no passcode). Run: python3 _tests/test_micresume.py [base-url]"""
import os, sys, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) > 1: BASE = sys.argv[1].rstrip('/') + '/'
else:
    H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
    class Q(socketserver.TCPServer): allow_reuse_address = True
    srv = Q(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start(); BASE = f'http://127.0.0.1:{srv.server_address[1]}/'
DASH = os.path.exists(os.path.join(ROOT, 'moderation', 'index.html'))
if DASH:
    URL, UNHIDE, START, OWNER = 'moderation/index.html', "document.getElementById('gate').hidden=true;document.getElementById('app').hidden=false;document.body.classList.remove('locked')", '.bm-pill', 'music'
else:
    URL, UNHIDE, START, OWNER = 'index.html', "document.querySelectorAll('#app > .screen').forEach(s=>s.hidden=true);document.getElementById('screen-chat').hidden=false", '#screen-chat .tb-logo-svg', 'logo'
INIT = """(()=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;window.__ctxs=[];window.__strict=false;window.__res=[];window.__plays=[];
const R=C.prototype.resume;C.prototype.resume=function(){const e=window.event,t=e&&/^(touch|pointer|click|mouse|key)/.test(e.type)?e.type:'timer';window.__res.push(t);
 if(window.__strict&&t==='timer')return Promise.reject(new Error('NotAllowed'));return R.call(this)};
const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const e=window.event;window.__plays.push(e&&/^(touch|pointer|click|mouse|key)/.test(e.type)?e.type:'timer');return P.call(this)};
const K=class extends C{constructor(...a){super(...a);window.__ctxs.push(this)}};window.AudioContext=K;window.webkitAudioContext=K;
window.addEventListener('unhandledrejection',e=>e.preventDefault())})()"""
HUB = "(()=>{for(const c of __ctxs){const h=RhythmContinuity.media(c);if(h.info().owners.includes('%s')){window.__c=c;window.__h=h;return true}}return false})()" % OWNER
fails, results = [], []
def ok(c, m, extra=''):
    results.append(('PASS ' if c else 'FAIL ') + m + (f'  [{extra}]' if extra != '' and not c else ''))
    if not c: fails.append(m)
ENG = {}
def eng_of(ctx): return ENG.get(id(ctx))
def scroll_touch(ctx, pg):
    cdp = ctx.new_cdp_session(pg) if eng_of(ctx) == 'chromium' else None
    if cdp:
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 180, 'y': 420}]})
        for y in (400, 370, 340, 310): cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 180, 'y': y}]})
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchCancel', 'touchPoints': []}); return
    pg.evaluate("""(()=>{const t=document.elementFromPoint(180,420)||document.body;const ev=(n,P)=>t.dispatchEvent(new (P||Event)(n,{bubbles:true,cancelable:true,pointerType:'touch'}));
      ev('pointerdown',window.PointerEvent);ev('touchstart');ev('pointermove',window.PointerEvent);ev('touchmove');ev('pointercancel',window.PointerEvent);ev('touchcancel');})()""")   # WebKit desktop has no Touch constructor
with sync_playwright() as pw:
    for eng in ('chromium', 'webkit'):
        b = getattr(pw, eng).launch(); name = eng
        def page():
            ctx = b.new_context(viewport={'width': 375, 'height': 548}, is_mobile=(eng == 'chromium'), has_touch=True); ENG[id(ctx)] = eng; pg = ctx.new_page(); pg.add_init_script(INIT)
            pg.goto(BASE + URL); pg.wait_for_function('window.RhythmContinuity'); pg.evaluate(UNHIDE); pg.wait_for_timeout(500)
            pg.tap(START); pg.wait_for_timeout(3000); return ctx, pg
        beat = lambda pg: pg.evaluate("(window.PhiB&&PhiB.rung?PhiB.rung(-10):Math.pow((1+Math.sqrt(5))/2,-5))")
        # 1 + 2
        ctx, pg = page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        ok(pg.evaluate(HUB), f'{name}: sound playing through the media hub ({OWNER})')
        bt = beat(pg); wait = int(bt * 1000 * 40) + 1500
        pg.evaluate('__c.suspend()'); pg.wait_for_timeout(wait)
        ok(pg.evaluate("__c.state") == 'running' and pg.evaluate('__h.ladder().live'), f'{name}: interruption in view is resumed and output confirmed', pg.evaluate("[__c.state,JSON.stringify(__h.ladder())]"))
        n0 = len(pg.evaluate('__res')); pg.wait_for_timeout(wait)
        ok(len(pg.evaluate('__res')) == n0 and not pg.evaluate('__h.ladder().pending'), f'{name}: ladder stops after confirmed audio (no resume() since)', f"{n0} -> {len(pg.evaluate('__res'))}")
        if pg.evaluate('__h.info().el'):
            pg.evaluate("__plays.length=0; __h.helper().pause()"); pg.wait_for_timeout(wait)
            ok(pg.evaluate("__plays.filter(t=>t==='timer').length") == 0 and pg.evaluate('__h.info().paused'), f'{name}: no timer restarts a paused helper player', pg.evaluate('JSON.stringify(__plays)'))
            ok(pg.evaluate("__c.state") == 'running', f'{name}: sound still reaches the output while the helper waits (direct path)')
            pg.touchscreen.tap(20, 300); pg.wait_for_timeout(800)
            ok(pg.evaluate("__plays.some(t=>t!=='timer')") and pg.evaluate(f"!__h.info().paused || !__h.info().owners.includes('{OWNER}')"), f'{name}: the next real tap restarts the helper (unless that tap ended the sound itself)', pg.evaluate('JSON.stringify([__plays,__h.info()])'))
        ok(not errs, f'{name}: no page errors', errs[:2]); ctx.close()
        # 3
        ctx, pg = page(); pg.evaluate(HUB); bt = beat(pg)
        pg.evaluate('window.__strict=true; __c.suspend()'); top = sum(bt * (1.618033988749895 ** k) for k in range(6)) * 1000 * 2 + 3000
        pg.wait_for_timeout(int(top)); t1 = pg.evaluate('__h.tries()'); pg.wait_for_timeout(int(top))
        ok(pg.evaluate('__h.tries()') == t1 and t1 <= 7 and not pg.evaluate('__h.ladder().pending'), f'{name}: refused resumes: the ladder gives up after its top rung (tries {t1})', pg.evaluate('__h.tries()'))
        ok(pg.evaluate('!!document.querySelector(".sound-back")'), f'{name}: the one gentle button shows')
        scroll_touch(ctx, pg); pg.wait_for_timeout(1500)
        ok(pg.evaluate("__c.state") == 'running', f'{name}: a scrolling touch (start, move, cancel) brings the sound back', pg.evaluate("[__c.state,JSON.stringify(__res.slice(-4))]"))
        ctx.close()
        # 4
        if DASH:
            ctx, pg = page(); pg.evaluate(HUB); pg.tap(START); pg.wait_for_timeout(4000); n0 = len(pg.evaluate('__res'))
            pg.evaluate('__c.suspend()'); pg.wait_for_timeout(int(beat(pg) * 1000 * 40) + 1500)
            ok(pg.evaluate("__c.state") != 'running' and len(pg.evaluate('__res')) == n0, f'{name}: her own pause is never undone')
            ctx.close()
        b.close()
print('\n'.join(results)); print(f"{len(results) - len(fails)}/{len(results)} passed"); sys.exit(1 if fails else 0)
