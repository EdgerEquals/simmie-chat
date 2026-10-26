/* Node unit checks for the Rule phi 14:29 AWST update (branch phifix). Run: node _tests/test_phifix.js
   1) js/phi-b.js: B is mirrored by whole rungs as far as her recent rhythm r is from her long-term rl, held to sky-B x PHI^+-REACH.
   2) js/phi-b.js: the long-term rhythm rl moves only PHI^-8 per visit; the pause limit comes from the sky reference B0.
   3) js/phi-dials.js: the long-term pace average moves PHI^-8 per visit, and a lasting change of pace moves the pace dial. */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.dirname(__dirname), PHI = (1 + Math.sqrt(5)) / 2;
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const near = (a, b) => Math.abs(a / b - 1) < 1e-9;
function el() { const n = { style: { setProperty() {} }, attrs: {}, children: [], nodeType: 1, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; },
  appendChild(c) { this.children.push(c); return c; }, insertBefore(c) { this.children.push(c); return c; }, firstChild: null, className: '', textContent: '' }; return n; }
function env(store) {
  const L = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const h = {}; let now = Date.UTC(2026, 9, 26, 6);
  const doc = { hidden: false, readyState: 'complete', documentElement: el(), head: el(), body: el(), currentScript: null,
    querySelector: () => null, querySelectorAll: () => [], createElement: () => el(),
    addEventListener: (t, f) => { (h[t] = h[t] || []).push(f); } };
  const win = { document: doc, localStorage: L, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    addEventListener: (t, f) => { (h['w:' + t] = h['w:' + t] || []).push(f); }, matchMedia: () => ({ matches: false }),
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, getComputedStyle: () => ({ backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(0, 0, 0)' }),
    SeasonPumps: { pumps: () => [{ id: 'year', P: 365.2422 }, { id: 'springNeap', P: 14.765, c: 0 }] } };
  win.window = win; win.Math = Math; win.JSON = JSON; win.Date = class extends Date { constructor(...a) { if (a.length) super(...a); else super(now); } static now() { return now; } };
  win.self = win; win.globalThis = win;
  return { win, h, tick: ms => { now += ms; }, fire: (t, ...a) => (h[t] || []).forEach(f => f(...a)) };
}
function run(file, e) { vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), e.win, { filename: file }); }
function rec(r, rl, s) { return JSON.stringify({ v: 1, n: s, c: {}, p: {}, x: { rhythm: { r, rl, s } } }); }
const WXC = JSON.stringify({ u: 900, t: 0, temp: 20 });   // a weather cache with the feed's own 15 min update period

// ---- 1) mirror within sky limits ----
function B(r, rl, s) { const e = env({ 'phiAdapt.v1': rec(r, rl, s), 'rebella.footer.weather': WXC }); run('js/phi-b.js', e); return e.win.PhiB.parts(); }
let p = B(4, 4, 40);
ok(p.mirror === 0 && near(p.Br, p.Bs), 'her usual rhythm (r = rl): Br = sky-B, no move');
p = B(4 / PHI, 4, 40);
ok(p.mirror === -1 && near(p.Br, p.Bs / PHI), 'quicker by one rung: mirrored one rung livelier (Br = sky-B x PHI^-1)');
p = B(4 / Math.pow(PHI, 5), 4, 40);
ok(p.mirror === -p.reach && near(p.Br, p.Bs * Math.pow(PHI, -p.reach)), 'very excited: held at the lively limit sky-B x PHI^-n');
p = B(4 * Math.pow(PHI, 5), 4, 40);
ok(p.mirror === p.reach && near(p.Br, p.Bs * Math.pow(PHI, p.reach)), 'very slow: held at the slow limit sky-B x PHI^n');
p = B(4, undefined, 40);
ok(p.mirror === 0 && near(p.Br, p.Bs), 'old record without rl: rl starts at her own r, no jump');
ok(p.B >= p.Bs * Math.pow(PHI, -p.reach) && p.B <= p.Bs * Math.pow(PHI, p.reach), 'B always inside sky-B x PHI^+-n');
const e0 = env({ 'rebella.footer.weather': WXC }); run('js/phi-b.js', e0); const p0 = e0.win.PhiB.parts();
ok(p0.w === 0 && near(p0.B, p0.Bs), 'first visit: B = sky-B (pumps 1 and 2 carry it)');

// ---- 2) long-term rhythm and pause limit ----
{
  const store = { 'phiAdapt.v1': rec(4, 4, 3), 'rebella.footer.weather': WXC }, e = env(store); run('js/phi-b.js', e);
  const P = e.win.PhiB.parts(), B0 = P.B0;
  // five taps at 2 s (inside the accepted window), one long pause well past B0 x PHI^4, which must not count
  const gaps = [2, 2, 2, 2, 2, B0 * Math.pow(PHI, 5), 2];
  e.fire('pointerdown', { target: null });
  gaps.forEach(g => { e.tick(g * 1000); e.fire('pointerdown', { target: null }); });
  e.fire('w:pagehide');
  const x = JSON.parse(store['phiAdapt.v1']).x.rhythm;
  ok(near(x.r, Math.exp(Math.log(4) * (1 - 1 / PHI) + Math.log(2) / PHI)), 'recent rhythm r moves PHI^-1 of the way (unchanged)');
  ok(near(x.rl, Math.exp(Math.log(4) * (1 - Math.pow(PHI, -8)) + Math.log(2) * Math.pow(PHI, -8))), 'long-term rhythm rl moves only PHI^-8 of the way');
  ok(x.s === 4, 'visit counted once');
  const src = fs.readFileSync(path.join(ROOT, 'js/phi-b.js'), 'utf8');
  ok(/HI = B0 \* Math\.pow\(PHI, 4\)/.test(src), 'pause limit (longest gap that counts) comes from the sky reference B0, not the kid-moved B');
}

// ---- 3) the pace dial's long-term average ----
function dials(store, n, visSec) {
  const e = env(store);
  const ext = {}; const pa = { ext: (k, v) => { if (v !== undefined) ext[k] = JSON.parse(JSON.stringify(v)); return ext[k] ? JSON.parse(JSON.stringify(ext[k])) : null; },
    save() {}, sessions: () => 1, snapshot: () => ({ c: {} }), score: () => 0, onPass() {}, session: () => ({ nav: { o: 0, t: n, l: 0 } }) };
  if (store.dials) ext.dials = store.dials;
  delete e.win.SeasonPumps;                          // the season dial is not under test here
  e.win.PhiAdapt = pa; run('js/phi-dials.js', e);
  e.tick(visSec * 1000); e.win.document.hidden = true; e.fire('visibilitychange');
  return ext.dials;
}
{
  let d = dials({}, 13, 60);                         // first visit sets her long-term rate
  const base = d.pace; ok(near(base, 13 / 60), 'first visit sets the long-term pace average');
  d = dials({ dials: d }, 13, 60);
  ok(near(d.pace, base) && d.pos.pace === 2, 'same pace: average unchanged, dial stays');
  const fast = (13 * PHI * PHI) / 60;               // she gets quicker and stays quicker
  let moved = 0, prev = d;
  for (let v = 0; v < 5; v++) { const nd = dials({ dials: prev }, 13 * PHI * PHI, 60); if (nd.pos.pace < prev.pos.pace) moved++; prev = nd; }
  ok(near(dials({ dials: d }, 13 * PHI * PHI, 60).pace, base + (fast - base) * Math.pow(PHI, -8)), 'average moves only PHI^-8 per visit (was PHI^-2)');
  ok(moved >= 1 && prev.pos.pace === 1, 'a lasting quicker pace moves the pace dial to its ceiling (it no longer chases her away)');
  ok(prev.prop.length >= 1, 'beyond the ceiling becomes a proposal for Danny, not a move');
}
console.log(fails ? `\n${fails} FAIL` : '\nALL PASS'); process.exit(fails ? 1 : 0);
