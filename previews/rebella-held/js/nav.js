/* Rebella in-page navigation (progressive enhancement, 24 Oct 2026, approved by Danny).
   Every page is still a real generated HTML file: without JS, on refresh and on deep links it loads normally.
   With JS, a left-click on an internal page link fetches that page and swaps only <main>, then history.pushState with
   the real URL; Back/Forward (popstate) swap it back and restore the scroll position. The header, footer, help orb,
   header radio dial and any playing radio player stay mounted.
   Skipped (normal navigation): modifier keys, other buttons, target/download links, other sites, #hash-only links,
   moderation/, rhythm/ (own runtime), the Get me out button (it keeps location.replace), files that aren't pages,
   and pages whose own script already ran once this visit (it can't safely start twice). Any fetch error falls back to
   a normal page load. Reduced motion: no fade; otherwise a 0.236 s (PHI^-3) fade-in of the new content. */
(function () {
  'use strict';
  if (!window.fetch || !window.history || !history.pushState || !window.DOMParser) return;
  var me = document.currentScript, ROOT = new URL('../', me ? me.src : location.href).href;
  var COMMON = /\/js\/(main|bars|footbar|help-orb|help-init|quotes|quotes-render|nav|dashbars)\.js|\/music\/youtube\/(stations|bonnie-radio)\.js/;
  var RERUN = /\/(music\/music|js\/recs|js\/recs-render|js\/library)\.js/;   // only bind to their own page content: safe to run again
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ran = {};   // page scripts that have run in this document
  [].forEach.call(document.scripts, function (s) { if (s.src) ran[s.src.split('?')[0]] = true; });
  var live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.id = 'nav-live';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(live); absolutize(); });
  if (document.readyState !== 'loading') { document.body.appendChild(live); absolutize(); }

  // the header/footer/menus stay put while the URL changes, so their relative links are made absolute once
  function absolutize() {
    var main = document.querySelector('main');
    [].forEach.call(document.querySelectorAll('a[href], form[action]'), function (el) {
      if (main && main.contains(el)) return;
      var at = el.tagName === 'FORM' ? 'action' : 'href', v = el.getAttribute(at);
      if (!v || v.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(v)) return;
      try { el.setAttribute(at, new URL(v, location.href).href); } catch (e) {}
    });
  }
  function eligible(u) {
    if (u.origin !== location.origin || u.href.indexOf(ROOT) !== 0) return false;
    var rest = u.pathname.slice(new URL(ROOT).pathname.length);
    if (/^(moderation|rhythm)\//.test(rest)) return false;
    if (!(/\.html$/.test(rest) || /\/$/.test(rest) || rest === '')) return false;
    return true;
  }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.hasAttribute('data-escape') || a.closest('[data-escape]') || a.target && a.target !== '_self' || a.hasAttribute('download') || a.hasAttribute('data-no-swap')) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.pathname === location.pathname && u.search === location.search && u.hash) return;   // same-page #hash
    if (!eligible(u)) return;
    e.preventDefault();
    go(u.href, true);
  });
  var shown = location.href.split('#')[0];
  window.addEventListener('popstate', function () { var u = location.href.split('#')[0]; if (u === shown) return; go(location.href, false); });
  document.addEventListener('rebella:urlstate', function () { shown = location.href.split('#')[0]; });
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  function saveScroll() { try { history.replaceState(Object.assign({}, history.state, { rbScroll: scrollY }), ''); } catch (e) {} }
  window.addEventListener('pagehide', saveScroll);

  var busy = 0;
  function go(href, push) {
    var n = ++busy;
    if (push) saveScroll();
    fetch(href, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
      if (n !== busy) return;
      var doc = new DOMParser().parseFromString(html, 'text/html'), nm = doc.querySelector('main'), om = document.querySelector('main');
      if (!nm || !om) throw new Error('no main');
      var base = new URL(href, location.href);
      // page-specific scripts: load the ones not seen yet; a page whose script already ran gets a normal load
      var need = [].map.call(doc.querySelectorAll('head script[src], main script[src]'), function (s) { return new URL(s.getAttribute('src'), base).href; }).filter(function (s) { return !COMMON.test(s); });
      if (need.some(function (s) { return ran[s.split('?')[0]] && !RERUN.test(s); })) throw new Error('script ran');
      if (push) history.pushState({ rbScroll: 0 }, '', href);
      shown = location.href.split('#')[0];
      document.dispatchEvent(new CustomEvent('rebella:beforeswap', { detail: { url: href } }));
      // styles the new page needs
      [].forEach.call(doc.querySelectorAll('link[rel=stylesheet]'), function (l) {
        var h = new URL(l.getAttribute('href'), base).href;
        if (![].some.call(document.querySelectorAll('link[rel=stylesheet]'), function (x) { return x.href === h; })) { var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = h; document.head.appendChild(c); }
      });
      var fresh = document.importNode(nm, true);
      if (!reduce) { fresh.style.opacity = '0'; fresh.style.transition = 'opacity .236s ease'; }
      om.replaceWith(fresh);
      document.title = doc.title;
      var d = doc.querySelector('meta[name=description]'), cd = document.querySelector('meta[name=description]'); if (d && cd) cd.setAttribute('content', d.getAttribute('content'));
      var cn = doc.querySelector('link[rel=canonical]'), cc = document.querySelector('link[rel=canonical]'); if (cn && cc) cc.setAttribute('href', new URL(cn.getAttribute('href'), base).href);
      document.body.className = doc.body.className + (document.body.classList.contains('has-bars') ? ' has-bars' : '');
      // active nav state (section menu + header links)
      var cur = location.href.split('#')[0].split('?')[0];
      [].forEach.call(document.querySelectorAll('.mainnav a, .drawer a, #app-head a'), function (a) {
        var on = a.href.split('#')[0] === cur || (/\/$/.test(cur) && a.href === cur + 'index.html');
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      // close the phone menu if it was open
      var dr = document.getElementById('drawer'); if (dr && dr.classList.contains('open')) { var cl = dr.querySelector('[data-close-drawer]'); if (cl) cl.click(); }
      // re-run page init for the new content
      [].forEach.call(document.querySelectorAll('script[data-nav-current]'), function (s) { s.removeAttribute('data-nav-current'); });
      need.forEach(function (src) { var s = document.createElement('script'); s.src = src; s.setAttribute('data-nav-current', ''); ran[src.split('?')[0]] = true; document.body.appendChild(s); });
      if (window.RebellaForms) window.RebellaForms(fresh);
      if (window.BonnieRadioMount) window.BonnieRadioMount();
      if (window.HelpOrb && window.HelpOrb.refresh) window.HelpOrb.refresh();
      document.dispatchEvent(new CustomEvent('rebella:swapped', { detail: { url: location.href } }));
      // scroll + focus + announce
      var y = !push && history.state && typeof history.state.rbScroll === 'number' ? history.state.rbScroll : 0;
      var hashEl = location.hash && document.getElementById(location.hash.slice(1));
      if (hashEl && push) hashEl.scrollIntoView(); else window.scrollTo(0, y);
      var h = fresh.querySelector('h1') || fresh.querySelector('h2');
      if (h) { if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (x) {} }
      live.textContent = ''; setTimeout(function () { live.textContent = (h ? h.textContent.trim() + '. ' : '') + 'Page loaded.'; }, 50);
      if (!reduce) requestAnimationFrame(function () { fresh.style.opacity = '1'; setTimeout(function () { fresh.style.transition = ''; fresh.style.opacity = ''; }, 300); });
    }).catch(function () {
      if (n !== busy) return;
      if (push) location.assign(href); else location.reload();   // normal navigation
    });
  }
})();
