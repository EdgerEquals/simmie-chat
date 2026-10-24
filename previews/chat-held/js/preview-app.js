/* HELD-WORK PREVIEW (previews/chat-held/): stands in for the chat page's js/app.js.
   Made-up sample messages, rendered with the chat page's own message markup. No password gate, no keys, no network:
   typing a message adds it to this page only, and a canned "preview" reply appears. Reload = back to the samples. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var H = 3600e3, now = Date.now();
  var msgs = [
    { id: 's1', ts: now - 26 * H, from: 'daughter', text: 'Hi Simmie! What should I draw today?' },
    { id: 's2', ts: now - 26 * H + 50e3, from: 'simmie', text: 'Ooh, how about a dolphin surfing a giant wave at sunset? 🐬🌅' },
    { id: 's3', ts: now - 3 * H, from: 'dad', text: 'Sample question from Dad: pizza for dinner tonight?', kind: 'question', options: ['Yes', 'No'] },
    { id: 's4', ts: now - 40 * 60e3, from: 'daughter', text: 'Did you know octopuses have three hearts?' },
    { id: 's5', ts: now - 39 * 60e3, from: 'simmie', text: 'Yes! And blue blood too. They are basically tiny aliens of the sea 🐙' }
  ];
  var answers = {};
  var fmtTime = function (ts) { return new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }); };
  var fmtDay = function (ts) { return new Date(ts).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }); };
  function toast(t) {
    var el = document.createElement('div'); el.className = 'preview-toast'; el.setAttribute('role', 'status'); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
  }
  function render() {
    var log = $('log'); log.innerHTML = ''; var day = '';
    msgs.slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (m) {
      var d = fmtDay(m.ts);
      if (d !== day) { day = d; var s = document.createElement('div'); s.className = 'day'; s.textContent = d; log.appendChild(s); }
      var b = document.createElement('div'), mine = m.from === 'daughter';
      b.className = 'msg ' + (mine ? 'me' : 'them') + (m.from === 'dad' ? ' dad' : '') + (m.state === 'pending' ? ' pending' : '');
      if (m.from === 'dad') { var w = document.createElement('span'); w.className = 'sender'; w.textContent = 'Dad'; b.appendChild(w); }
      b.appendChild(document.createTextNode(m.text));
      if (m.kind === 'question') {
        var wrap = document.createElement('div'), row = document.createElement('div'), ans = answers[m.id];
        row.className = 'choices' + (ans ? ' done' : ''); wrap.appendChild(row);
        m.options.concat(['Ask more']).forEach(function (o) {
          var btn = document.createElement('button'); btn.type = 'button';
          btn.className = 'choice' + (o === 'Ask more' ? ' ask' : '') + (ans === o ? ' picked' : '');
          btn.textContent = (ans === o ? '✓ ' : '') + o; btn.disabled = !!ans;
          btn.onclick = function () { answers[m.id] = o; render(); toast('Preview: answer kept on this page only'); };
          row.appendChild(btn);
        });
        if (ans) { var n = document.createElement('span'); n.className = 'choice-note'; n.textContent = 'You answered: ' + ans; wrap.appendChild(n); }
        b.appendChild(wrap);
      }
      var meta = document.createElement('span'); meta.className = 'meta';
      meta.textContent = fmtTime(m.ts) + (mine ? (m.state === 'pending' ? ' · sending…' : ' · ✓✓') : '');
      b.appendChild(meta); log.appendChild(b);
    });
    var last = msgs[msgs.length - 1], waiting = last && last.from === 'daughter' && last.local;
    $('typing').hidden = !waiting; $('typing-text').textContent = 'Simmie is typing… (preview)';
    log.scrollTop = log.scrollHeight;
  }
  var ta = $('msg');
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && window.matchMedia('(pointer:fine)').matches) { e.preventDefault(); $('send-form').requestSubmit(); } });
  $('send-form').addEventListener('submit', function (ev) {
    ev.preventDefault(); var text = ta.value.trim(); if (!text) return;
    ta.value = ''; ta.style.height = 'auto';
    var m = { id: 'p' + Date.now(), ts: Date.now(), from: 'daughter', text: text, local: true }; msgs.push(m); render();
    setTimeout(function () {
      msgs.push({ id: 'r' + Date.now(), ts: Date.now(), from: 'simmie', text: 'This is a preview, so nothing was sent. On the real chat page Simmie would reply here.' }); render();
    }, 2200);
  });
  $('lock-btn').addEventListener('click', function () { toast('Preview: Lock is switched off here'); });
  render();
})();
