/* Node checks for js/name-check.js and tools/build_name_hashes.py, with a MADE-UP fixture name ("Mia Smith", the standard's own example).
   Run: node _tests/test_namecheck.js   (needs python3; never uses a real name) */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.dirname(__dirname); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nc-')), roles = path.join(tmp, 'roles.json'), out = path.join(tmp, 'h.json'), extra = path.join(tmp, 'extra.txt');
fs.writeFileSync(roles, JSON.stringify({ 'kid-x': 'Mia Smith' })); fs.writeFileSync(extra, 'Jo\n');
const log = cp.execFileSync('python3', [path.join(ROOT, 'tools/build_name_hashes.py'), '--kid', 'kid-x', '--out', out, '--roles', roles, '--extra', extra]).toString();
const list = fs.readFileSync(out, 'utf8');
ok(!/mia|smith|\bjo\b/i.test(list) && !/mia|smith/i.test(log), 'hash list and build output hold no name in plain text');
const L = JSON.parse(list); ok(L.words.length === 3 && L.words.every(w => /^[0-9a-f]+$/.test(w.h)), 'one salted hash per name word (3 words)');
const L2 = (cp.execFileSync('python3', [path.join(ROOT, 'tools/build_name_hashes.py'), '--kid', 'kid-x', '--out', out + '2', '--roles', roles]), JSON.parse(fs.readFileSync(out + '2', 'utf8')));
ok(L2.salt !== L.salt && L2.words[0].h !== L.words[0].h, 'every build has a fresh salt, so lists can\'t be matched across builds');
const store = {}; const ctx = { window: null, crypto: globalThis.crypto, TextEncoder, atob, Uint8Array, Uint32Array, Promise, Math, URL,
  fetch: async () => ({ ok: true, json: async () => L }), PhiAdapt: { ext(k, v) { if (v !== undefined) store[k] = v; return store[k] ? JSON.parse(JSON.stringify(store[k])) : null; } } };
ctx.window = ctx; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/name-check.js'), 'utf8'), ctx);
const NC = ctx.NameCheck;
(async () => {
  ok(await NC.load('x') === true && NC.ready(), 'loads the hash list');
  const t = async (s) => (await NC.check(s)).hit;
  ok(await t('Mia'), 'first word on its own trips');
  ok(await t('SMITH'), 'second word on its own trips, any case');
  ok(await t('Smithy'), 'a nickname built on one word trips (Smithy)');
  ok(await t('Starry miaow'), 'a name word inside a longer word trips (3+ letters)');
  ok(await t('Jo'), 'a short name word trips as a whole word');
  ok(!(await t('Joyful Comet')), 'a short name word inside another word does not trip (Joyful)');
  ok(!(await t('Starry Wagtail')), 'a made-up name passes');
  for (let i = 0; i < 21; i++) { const s = NC.surprise(); if (await t(s)) { ok(false, 'surprise name tripped: ' + s); break; } }
  ok(/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(NC.surprise()), 'Surprise me gives a friendly two-word made-up name');
  ok((await NC.omit('Love from Mia xo')) === 'Love from xo', 'Leave it out quietly drops only the name words');
  ok(/real name/.test(NC.LINE) && /Surprise me/.test(NC.LINE), 'the kind line says what to change and offers Surprise me');
  const c = store.namecheck || {}; ok(c.checks > 0 && c.trips > 0 && c.surprise > 0 && c.omits > 0 && Object.keys(c).every(k => typeof c[k] === 'number'), 'only counts go into the usage record, no names or text');
  const src = fs.readFileSync(path.join(ROOT, 'js/name-check.js'), 'utf8'); ok(!/localStorage|sendBeacon|XMLHttpRequest/.test(src), 'nothing typed is stored or sent');
  console.log(fails ? `\n${fails} FAIL` : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();
