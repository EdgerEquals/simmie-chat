/* In-chat questions sheet (Danny 15:41 AWST 25 Oct). Generic renderer only: the questions themselves travel inside an
   encrypted log entry {kind:'form', form:{...}}, so nothing readable exists outside the chat's passcode gate.
   Built with DOM nodes + textContent only (never innerHTML). Opened from a message button by js/app.js after unlock;
   closed on Lock. Spec: {title, intro:[str], points:[str], note, sections:[
     {type:'choice', id, q, options:[str], required, hideWhen:{id, is}},
     {type:'grid', id, q, rows:[{id,label}], options:[str], hideWhen},
     {type:'text', id, q, placeholder, max, hideWhen}],
   send, noThanks, thanks}.
   SimmieForm.open(spec, {answered, onSubmit(summary, values)}) */
(function () {
  'use strict';
  let sheet = null, lastFocus = null;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = String(text); return n; };
  const str = (v, max) => String(v == null ? '' : v).slice(0, max || 400);
  const arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n || 20);

  function close() {
    if (!sheet) return;
    sheet.remove(); sheet = null; document.documentElement.classList.remove('cf-open');
    document.removeEventListener('keydown', onKey, true);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }

  function summarise(spec, vals, secs) {
    const lines = [];
    for (const s of secs) {
      if (s.type === 'grid') {
        const parts = arr(s.rows).map((r) => vals[s.id + '.' + r.id] ? str(r.short || r.label, 60) + ': ' + vals[s.id + '.' + r.id] : '').filter(Boolean);
        if (parts.length) lines.push(parts.join(' · '));
      } else if (vals[s.id]) lines.push(str(s.short || s.q, 60) + ': ' + vals[s.id]);
    }
    return lines.join('\n');
  }

  function open(spec, opts) {
    close(); opts = opts || {};
    if (!spec || typeof spec !== 'object') return;
    lastFocus = document.activeElement;
    const host = document.getElementById('screen-chat') || document.body;
    sheet = el('div', 'cf-sheet'); sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
    const panel = el('div', 'cf-panel'); sheet.appendChild(panel);
    const head = el('div', 'cf-head');
    const h = el('h2', 'cf-title', str(spec.title || 'Questions', 80)); h.id = 'cf-title'; sheet.setAttribute('aria-labelledby', 'cf-title');
    const x = el('button', 'cf-x', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = close;
    head.appendChild(h); head.appendChild(x); panel.appendChild(head);
    const body = el('div', 'cf-body'); panel.appendChild(body);
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });

    if (opts.answered) {
      body.appendChild(el('p', 'cf-intro', 'You already sent your answers. Thank you!'));
      body.appendChild(el('p', 'cf-sent', opts.answered));
      const ok = el('button', 'cf-send', 'Close'); ok.type = 'button'; ok.onclick = close; body.appendChild(ok);
      return mount(host);
    }

    arr(spec.intro, 6).forEach((p) => body.appendChild(el('p', 'cf-intro', str(p, 600))));
    if (arr(spec.points).length) {
      const ul = el('ul', 'cf-points'); arr(spec.points, 8).forEach((p) => ul.appendChild(el('li', null, str(p, 400)))); body.appendChild(ul);
    }
    if (spec.note) body.appendChild(el('p', 'cf-note', str(spec.note, 300)));

    const vals = {}, secs = arr(spec.sections, 12), blocks = [];
    const form = el('form', 'cf-form'); form.noValidate = true; body.appendChild(form);
    const refresh = () => blocks.forEach(({ s, node }) => {
      const hw = s.hideWhen; node.hidden = !!(hw && arr(hw.is).includes(vals[hw.id]));
    });
    secs.forEach((s, i) => {
      const fs = el('fieldset', 'cf-q'); const lg = el('legend', null, str(s.q, 200)); fs.appendChild(lg);
      if (s.type === 'choice') {
        const row = el('div', 'cf-pills');
        arr(s.options, 10).forEach((o) => {
          const b = el('button', 'cf-pill', str(o, 40)); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
          b.onclick = () => { vals[s.id] = vals[s.id] === o ? '' : String(o); row.querySelectorAll('.cf-pill').forEach((y) => y.setAttribute('aria-pressed', String(vals[s.id] === y.textContent))); refresh(); };
          row.appendChild(b);
        });
        fs.appendChild(row);
      } else if (s.type === 'grid') {
        arr(s.rows, 10).forEach((r) => {
          const line = el('div', 'cf-row'); line.appendChild(el('span', 'cf-rowlabel', str(r.label, 80)));
          const row = el('div', 'cf-pills cf-small'); const k = s.id + '.' + r.id;
          arr(s.options, 4).forEach((o) => {
            const b = el('button', 'cf-pill', str(o, 20)); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
            b.setAttribute('aria-label', str(r.label, 80) + ': ' + o);
            b.onclick = () => { vals[k] = vals[k] === o ? '' : String(o); row.querySelectorAll('.cf-pill').forEach((y) => y.setAttribute('aria-pressed', String(vals[k] === y.textContent))); };
            row.appendChild(b);
          });
          line.appendChild(row); fs.appendChild(line);
        });
      } else if (s.type === 'text') {
        const t = el('textarea', 'cf-text'); t.rows = 3; t.maxLength = Math.min(+s.max || 400, 600); t.placeholder = str(s.placeholder, 80);
        t.setAttribute('aria-label', str(s.q, 200)); t.oninput = () => { vals[s.id] = t.value.trim(); }; fs.appendChild(t);
      }
      form.appendChild(fs); blocks.push({ s, node: fs });
    });
    const err = el('p', 'cf-err'); err.hidden = true; err.setAttribute('role', 'alert'); form.appendChild(err);
    const actions = el('div', 'cf-actions');
    const send = el('button', 'cf-send', str(spec.send || 'Send', 30)); send.type = 'submit';
    const no = el('button', 'cf-no', str(spec.noThanks || 'No thanks', 40)); no.type = 'button';
    actions.appendChild(send); actions.appendChild(no); form.appendChild(actions);

    const finish = async (summary) => {
      send.disabled = no.disabled = true;
      try { if (opts.onSubmit) await opts.onSubmit(summary, Object.assign({}, vals)); } catch (e) {}
      body.textContent = '';
      body.appendChild(el('p', 'cf-thanks', str(spec.thanks || 'Sent. Thank you!', 300)));
      const ok = el('button', 'cf-send', 'Back to chat'); ok.type = 'button'; ok.onclick = close; body.appendChild(ok); ok.focus();
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const miss = secs.find((s) => s.required && !vals[s.id]);
      if (miss) { err.textContent = 'Pick one for "' + str(miss.q, 80) + '" first (or tap ' + str(spec.noThanks || 'No thanks', 40) + ').'; err.hidden = false; return; }
      const shown = blocks.filter((b) => !b.node.hidden).map((b) => b.s);
      finish(summarise(spec, vals, shown).slice(0, 1200));
    };
    no.onclick = () => finish(str(spec.noThanksAnswer || spec.noThanks || 'No thanks', 120));
    refresh();
    mount(host);
  }
  function mount(host) {
    host.appendChild(sheet); document.documentElement.classList.add('cf-open');
    document.addEventListener('keydown', onKey, true);
    const f = sheet.querySelector('.cf-x'); if (f) f.focus({ preventScroll: true });
  }
  window.SimmieForm = { open, close, isOpen: () => !!sheet };
})();
