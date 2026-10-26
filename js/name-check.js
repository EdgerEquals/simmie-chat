/* NAME CHECK on every word (Kids Club standard "name check on every word", Danny 14:51 AWST 26 Oct 2026; under review).
   SHARED: the SAME file is rebella js/name-check.js and simmie-chat js/name-check.js. Loaded only when a caller needs it.
   WHAT: before something she types could go public, every word of her name is tested on its own, case-insensitive, and as part of a
   longer word (so a nickname built on one word still trips); a name word shorter than MIN letters is tested as a whole word only.
   PRIVATE: her name is NOT in this file or any page file. The page only gets a list of salted hashes (name-hashes.json, made on the box
   by tools/build_name_hashes.py from the private roles file; never printed, never committed in plain text). Each candidate piece of
   what she typed is hashed the same way here (PBKDF2-SHA256 with that salt) and compared. Nothing she types is stored or sent.
   LIMIT (said plainly): a salted hash on a public page slows guessing, it does not stop it; anyone with the file and a list of names
   can test guesses. So the hash list belongs only on pages where that is acceptable (see the report), and the box-side check
   (tools/name_check.py on every push) stays the real guard for commits, page titles, tags and exports.
   ON A MATCH: never a scary no. The caller shows LINE (her loving-heart voice) with "Surprise me" (a made-up name from friendly
   words) or quietly leaves the name words out (omit()).
   UNDER REVIEW: counts only, on this device, in the one usage record (phiAdapt.v1, slot x.namecheck): checks, trips, surprise picks,
   omits, keeps. Never the name, never the typed text.
   API: NameCheck.load(url) -> Promise; .check(text) -> Promise<{hit, words:[word numbers]}>; .omit(text) -> Promise<text>;
        .surprise() -> string; .LINE; .count(kind); .ready() */
(function (root) {
  'use strict';
  if (root.NameCheck) return;
  var LIST = null, cache = {}, enc = root.TextEncoder ? new TextEncoder() : null, subtle = root.crypto && root.crypto.subtle;
  var LINE = '\uD83D\uDC97 That looks a lot like a real name, and real names are best kept just for the people who know you. Try a made-up one, or tap Surprise me! \uD83D\uDC97';
  // friendly made-up names: a soft word + a nature word (no real names; each passes the site's own word filter)
  var A = ['Starry', 'Velvet', 'Misty', 'Golden', 'Sparkle', 'Moonlit', 'Dreamy', 'Petal', 'Sunny', 'Silver', 'Cosmic', 'Breezy', 'Hush'];
  var B = ['Wagtail', 'Bluebird', 'Comet', 'Fern', 'Willow', 'Pebble', 'Lantern', 'Meadow', 'Ripple', 'Firefly', 'Nebula', 'Coral', 'Everlasting'];
  function words(t) { return String(t || '').normalize('NFC').toLowerCase().match(/[^\W\d_]+/gu) || []; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }   // unit: bytes as hex
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function hash(piece) {
    if (cache[piece]) return cache[piece];
    return (cache[piece] = subtle.importKey('raw', enc.encode(piece), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: LIST.saltBytes, iterations: LIST.iter }, k, LIST.bits);   // cite: 'SHA-256' is the hash's name (FIPS 180-4), not a value
    }).then(hex));
  }
  function load(url) {
    return fetch(url, { credentials: 'omit', cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || j.v !== 1 || !Array.isArray(j.words) || !subtle || !enc) return false;
      LIST = { saltBytes: b64(j.salt), iter: +j.iter, bits: +j.bits, min: +j.min, words: j.words }; cache = {}; return true;
    }).catch(function () { return false; });
  }
  function count(kind) {
    try { var PA = root.PhiAdapt; if (!PA || !PA.ext) return; var c = PA.ext('namecheck') || {}; c[kind] = (c[kind] | 0) + 1; PA.ext('namecheck', c); } catch (e) {}
  }
  // every piece of what she typed that could be one of the name words: same length, inside a word (or the whole word if short)
  function pieces(w, n, min) { var out = []; if (n < min) { if (w.length === n) out.push(w); return out; } for (var i = 0; i + n <= w.length; i++) out.push(w.slice(i, i + n)); return out; }
  function wordHits(w) {
    var jobs = LIST.words.map(function (e, k) { return Promise.all(pieces(w, e.n, LIST.min).map(hash)).then(function (hs) { return hs.indexOf(e.h) !== -1 ? k + 1 : 0; }); });
    return Promise.all(jobs).then(function (r) { return r.filter(Boolean); });
  }
  function check(text) {
    if (!LIST) return Promise.resolve({ hit: false, words: [], ready: false });
    var ws = words(text);
    return Promise.all(ws.map(wordHits)).then(function (per) {
      var hitWords = []; per.forEach(function (h) { h.forEach(function (k) { if (hitWords.indexOf(k) === -1) hitWords.push(k); }); });
      count('checks'); if (hitWords.length) count('trips');
      return { hit: hitWords.length > 0, words: hitWords, ready: true };
    });
  }
  function omit(text) {   // quietly leave out every typed word that holds a name word
    if (!LIST) return Promise.resolve(text);
    var parts = String(text || '').split(/(\s+)/);
    return Promise.all(parts.map(function (p) { return /\S/.test(p) ? Promise.all(words(p).map(wordHits)).then(function (h) { return h.some(function (x) { return x.length; }) ? '' : p; }) : Promise.resolve(p); }))
      .then(function (out) { count('omits'); return out.join('').replace(/\s+/g, ' ').trim(); });
  }
  function surprise() { count('surprise'); var r = root.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(2)) : [Math.random() * A.length, Math.random() * B.length];   // unit: two random picks
    return A[Math.floor(r[0]) % A.length] + ' ' + B[Math.floor(r[1]) % B.length]; }
  root.NameCheck = { load: load, check: check, omit: omit, surprise: surprise, LINE: LINE, count: count, ready: function () { return !!LIST; } };
})(typeof window !== 'undefined' ? window : this);
