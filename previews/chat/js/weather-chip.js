/* Perth weather chip + emoji story for the chat header (self-contained; prefix .wx-).
   Data: Open-Meteo, fixed Perth coords (-31.95, 115.86), no geolocation, cached 30 min (also across reloads).
   ?weather=sun|hot|cloud|rain|storm|night forces a state for previewing. The tty box reuses SimmieWeather.real(). */
(function (g) {
  'use strict';
  const URL_ = 'https://api.open-meteo.com/v1/forecast?latitude=-31.95&longitude=115.86&current=temperature_2m,weather_code,is_day&timezone=Australia%2FPerth';
  const CK = 'simmie-wx-cache', TTL = 30 * 60e3;
  // face(s), offerings handed toward the icon, icon, words
  const SETS = {
    sun:   { faces: ['😊'], gifts: ['🕶️', '🍦', '🌻'], icon: '☀️', word: 'Sunny' },
    hot:   { faces: ['😄', '🤩', '😎'], gifts: ['🏖️', '🍦', '🕶️'], icon: '🌞', word: 'Hot' },
    cloud: { faces: ['🙂'], gifts: [], icon: '⛅', word: 'Cloudy' },
    rain:  { faces: ['🥺'], gifts: ['☂️', '🌸', '🎁', '☕'], icon: '🌧️', word: 'Rainy' },
    storm: { faces: ['🤗', '🫣', '😮'], gifts: ['🫂', '🕯️'], icon: '⛈️', word: 'Stormy' },
    night: { faces: ['😌', '🥰', '🤩'], gifts: ['✨'], icon: '🌙', word: 'Clear night' },
  };
  const STYLES = ['drop', 'peek', 'spin', 'pop'];
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mem = null, inflight = null;
  async function real() {
    if (mem && Date.now() - mem.at < TTL) return mem;
    try { const c = JSON.parse(localStorage.getItem(CK) || 'null'); if (c && Date.now() - c.at < TTL) return (mem = c); } catch (e) {}
    if (!inflight) inflight = (async () => {
      try {
        const r = await fetch(URL_, { cache: 'no-store' }); if (!r.ok) throw 0;
        const c = (await r.json()).current; if (!c || typeof c.temperature_2m !== 'number') throw 0;
        mem = { at: Date.now(), t: Math.round(c.temperature_2m), code: +c.weather_code, day: !!c.is_day };
        try { localStorage.setItem(CK, JSON.stringify(mem)); } catch (e) {}
      } catch (e) {}
      inflight = null; return mem;
    })();
    return inflight;
  }
  function classify(w) {
    const c = w.code;
    if (c <= 1) return w.day ? (w.t >= 30 ? 'hot' : 'sun') : 'night';
    if (c >= 95) return 'storm';
    if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'rain';
    return 'cloud';
  }
  function override() { const v = new URLSearchParams(location.search).get('weather'); return v && SETS[v] ? v : null; }

  function mount(root) {
    root.classList.add('wx'); root.hidden = true;
    let loop = 0, state = null, lastLine = '';
    const stage = document.createElement('span'); stage.className = 'wx-stage'; stage.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'wx-label';
    root.append(stage, label);
    const span = (cls, txt, i) => { const o = document.createElement('span'); o.className = 'wx-sway'; o.style.setProperty('--i', i);
      const n = document.createElement('span'); n.className = cls; n.textContent = txt; o.appendChild(n); return o; };
    function build(st) {
      const s = SETS[st]; stage.innerHTML = '';
      const face = span('wx-face', s.faces[0], 0); stage.appendChild(face);
      s.gifts.forEach((x, i) => { const o = span('wx-gift', x, i + 1); o.firstChild.style.setProperty('--n', i); stage.appendChild(o); });
      const icon = document.createElement('span'); icon.className = 'wx-icon'; icon.textContent = s.icon; stage.appendChild(icon);
      // distance from each gift back to the icon (for PEEK: they slide out from behind it)
      requestAnimationFrame(() => {
        const ix = icon.getBoundingClientRect().left;
        stage.querySelectorAll('.wx-gift').forEach((gEl) => gEl.style.setProperty('--to-icon', (ix - gEl.getBoundingClientRect().left) + 'px'));
      });
      face.firstChild.addEventListener('animationiteration', next);
      setStyle();
    }
    function setStyle() { STYLES.forEach((x) => stage.classList.remove('wx-' + x)); void stage.offsetWidth; stage.classList.add('wx-' + STYLES[loop % STYLES.length]); stage.dataset.style = STYLES[loop % STYLES.length]; }
    function next() {   // new loop: rotate the effect style (and the face, for states with several)
      loop++; const s = SETS[state], f = stage.querySelector('.wx-face'); if (f) f.textContent = s.faces[loop % s.faces.length]; setStyle();
    }
    async function refresh() {
      const ov = override(), w = await real();
      const st = ov || (w ? classify(w) : null);
      if (!st) { root.hidden = true; return; }
      const s = SETS[st];
      if (st !== state) { state = st; root.dataset.state = st; build(st); }
      label.innerHTML = ''; const pl = document.createElement('span'); pl.className = 'wx-place'; pl.textContent = 'Perth ';
      label.append(pl, document.createTextNode(w ? w.t + '°' : s.word));
      root.setAttribute('aria-label', 'Perth weather: ' + s.word + (w ? ', ' + w.t + ' degrees' : '') + (ov ? ' (preview)' : ''));
      root.title = 'Perth · ' + s.word + (w ? ' · ' + w.t + '°C' : '') + ' · Open-Meteo';
      root.hidden = false;
      const line = 'wx: ' + s.word.toLowerCase() + (w ? ' ' + w.t + '°' : '') + (ov ? ' [preview]' : '');
      if (line !== lastLine) { lastLine = line; window.dispatchEvent(new CustomEvent('simmie:log', { detail: line })); }
    }
    document.addEventListener('visibilitychange', () => root.classList.toggle('wx-paused', document.hidden));
    refresh(); setInterval(() => { if (!document.hidden) refresh(); }, TTL);
    return { refresh };
  }
  g.SimmieWeather = { real, classify, mount, SETS };
})(window);
