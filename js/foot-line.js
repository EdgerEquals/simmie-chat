/* foot-line.js: one-line footer readout that cycles gently through
   quote of the day / on this day / word of the day / countdown / science fact of the day.
   Self-contained: needs only data/foot-line-data.js (window.FOOT_LINE_DATA) and css/foot-line.css.
   Drop-in:
     <span class="fl" id="footLine" tabindex="0"></span>
     <link rel="stylesheet" href="css/foot-line.css">
     <script src="data/foot-line-data.js" defer></script>
     <script src="js/foot-line.js" defer></script>
     <script>addEventListener('DOMContentLoaded',function(){ FootLine.init(document.getElementById('footLine')); });</script>
   Options (all optional): {data, tz:'Australia/Perth', order:['quote','onthisday','word','countdown','science'], sweep:fn -> phi steps}
   Timing (phi rules): each item shows for PHI^6 = 17.94 s (PHI^7 / PHI^8 if a long item needs the time to scroll), shifted by the
   page's weather sweep when window.PhiTiming exists; long items wait PHI^2 = 2.618 s, glide left, then wait again; PHI^-1 = 0.618 s
   cross-fade. Pauses while hovered or focused. Reduced motion: no glide or fade, items still swap (long ones end in an ellipsis).
   Picks are deterministic by the local calendar date in tz, so everyone sees the same items all day; they change at midnight. */
(function(root){
  "use strict";
  var PHI = 1.6180339887, G = 0.6180339887, SPEED = 28; // px per second for the glide
  var RM = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function ymd(tz, d){ d = d || new Date();
    try{ var p = new Intl.DateTimeFormat("en-CA", {timeZone:tz, year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(d), o = {};
      p.forEach(function(x){ o[x.type] = x.value; }); return {y:+o.year, m:+o.month, d:+o.day}; }
    catch(e){ return {y:d.getFullYear(), m:d.getMonth()+1, d:d.getDate()}; } }
  function dnum(y, m, d){ return Math.floor(Date.UTC(y, m-1, d) / 864e5); }
  function parse(s){ var a = s.split("-"); return dnum(+a[0], +a[1], +a[2]); }
  function key(m, d){ return (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d; }
  function plural(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }
  function fmt(n){ var t = new Date(n * 864e5); return t.getUTCDate() + " " + MON[t.getUTCMonth()]; }

  // ---------- today's five items ----------
  function build(D, t){
    var today = dnum(t.y, t.m, t.d), out = {};
    var q = D.quotes[((today % D.quotes.length) + D.quotes.length) % D.quotes.length];
    out.quote = {text:"\u201C" + q[0] + "\u201D \u2014 " + q[1], full:"\u201C" + q[0] + "\u201D", by:q[1], src:q[2]};
    // on this day: exact date, else nearest entry (either way) within the year, said with its date
    var exact = D.onthisday[key(t.m, t.d)], ev, when;
    if(exact){ ev = exact; when = "On this day in " + exact[0]; }
    else { var best = null, bd = 999;
      Object.keys(D.onthisday).forEach(function(k){ var mm = +k.slice(0,2), dd = +k.slice(3);
        var a = dnum(t.y, mm, dd) - today, b = Math.min(Math.abs(a), Math.abs(a + 365), Math.abs(a - 365));
        if(b < bd){ bd = b; best = k; } });
      ev = D.onthisday[best]; when = "On " + (+best.slice(3)) + " " + MON[+best.slice(0,2) - 1] + " " + ev[0]; }
    out.onthisday = {text:when + ", " + ev[1], full:when + ", " + ev[1]};
    var w = D.words[((today * 7 + 3) % D.words.length + D.words.length) % D.words.length];
    out.word = {text:w[0] + ": " + w[1], full:w[0] + ": " + w[1]};
    var f = D.science[((today * 11 + 5) % D.science.length + D.science.length) % D.science.length];
    out.science = {text:f, full:f};
    out.countdown = countdown(D, t, today);
    return out;
  }
  function countdown(D, t, today){
    var xmas = dnum(t.y, 12, 25); if(xmas < today) xmas = dnum(t.y + 1, 12, 25);
    var ny = dnum(t.y + 1, 1, 1), parts = [], hol = null, inHol = null;
    var T = (D.terms || []).map(function(r){ return [parse(r[0]), parse(r[1])]; });
    for(var i = 0; i < T.length; i++){
      if(today >= T[i][0] && today <= T[i][1]){ hol = T[i][1] + 1; break; }               // in term: holidays start the day after it ends
      if(i + 1 < T.length && today > T[i][1] && today < T[i+1][0]){ inHol = T[i+1][0]; break; } // in a break: next term starts
      if(i === 0 && today < T[0][0]){ inHol = T[0][0]; break; } }
    if(hol != null) parts.push(plural(hol - today, "day") + " to the school holidays");
    else if(inHol != null) parts.push("school holidays! " + plural(inHol - today, "day") + " till term starts");
    parts.push((xmas === today ? "Merry Christmas!" : plural(xmas - today, "day") + " to Christmas"));
    parts.push((t.m === 1 && t.d === 1 ? "Happy New Year!" : plural(ny - today, "day") + " to New Year"));
    var s = parts.join(" \u00B7 ");
    return {text:s, full:s + (hol != null ? " (WA school holidays start " + fmt(hol) + ")" : "")};
  }

  // ---------- the rotator ----------
  var FL = root.FootLine = {items:null, order:null, i:0, current:function(){ return FL.items ? FL._item(FL.order[FL.i]) : null; }, _build:build, _ymd:ymd};
  FL.init = function(el, opts){
    if(!el || el._fl) return; el._fl = true; opts = opts || {};
    var D = opts.data || root.FOOT_LINE_DATA; if(!D){ return; }
    var tz = opts.tz || "Australia/Perth", order = FL.order = opts.order || ["quote","onthisday","word","countdown","science"];
    var sweep = opts.sweep || function(){ return root.PhiTiming && root.PhiTiming.sweep ? root.PhiTiming.sweep() : 0; };
    el.classList.add("fl"); el.setAttribute("aria-live", "off");
    el.innerHTML = '<span class="fl-e" aria-hidden="true"></span><span class="fl-w"><span class="fl-t"></span></span><span class="fl-sr"></span>';
    var E = el.querySelector(".fl-e"), W = el.querySelector(".fl-w"), Tt = el.querySelector(".fl-t"), SR = el.querySelector(".fl-sr");
    var dayKey = "", timer = null, endAt = 0, left = 0, paused = false, glide = null, fade = null;
    function refresh(){ var t = ymd(tz), k = t.y + "-" + t.m + "-" + t.d; if(k !== dayKey){ dayKey = k; FL.items = build(D, t); } }
    FL._item = function(type){ var it = FL.items[type]; return {type:type, emoji:D.emoji[type], label:D.label[type], text:it.text, full:it.full, by:it.by, src:it.src}; };
    function per(n){ return Math.pow(PHI, n + (RM.matches ? 0 : (+sweep() || 0))); }
    function show(){
      refresh(); var it = FL._item(order[FL.i]);
      if(glide){ glide.cancel(); glide = null; }
      E.textContent = it.emoji; Tt.textContent = it.text; SR.textContent = it.label + ": " + it.text;
      el.setAttribute("data-type", it.type); el.setAttribute("title", it.label);
      var over = Math.ceil(Tt.scrollWidth - W.clientWidth), wait = per(2), fd = RM.matches ? 0 : per(-1), n = 6, dwell = per(6);
      el.classList.toggle("fl-long", over > 1);
      if(over > 1 && !RM.matches){
        while(dwell < 2 * wait + 2 * fd + over / SPEED && n < 8){ n++; dwell = per(n); }
        var dur = Math.max(1, dwell - 2 * wait - 2 * fd);
        glide = Tt.animate([{transform:"translateX(0)"},{transform:"translateX(" + (-over) + "px)"}],
          {duration:dur * 1000, delay:(fd + wait) * 1000, easing:"ease-in-out", fill:"both"});
        if(paused) glide.pause();
      }
      if(fd && Tt.animate){ if(fade) fade.cancel(); fade = el.animate([{opacity:0},{opacity:1}], {duration:fd * 1000, easing:"ease-out"}); }
      arm(dwell * 1000);
    }
    function arm(ms){ clearTimeout(timer); left = ms; endAt = Date.now() + ms; if(!paused) timer = setTimeout(next, ms); }
    function next(){
      var go = function(){ FL.i = (FL.i + 1) % order.length; show(); };
      if(!RM.matches && el.animate){ var o = el.animate([{opacity:1},{opacity:0}], {duration:per(-1) * 1000, easing:"ease-in", fill:"forwards"}); o.onfinish = function(){ o.cancel(); go(); }; }
      else go();
    }
    function pause(){ if(paused) return; paused = true; clearTimeout(timer); left = Math.max(0, endAt - Date.now()); if(glide) glide.pause(); el.classList.add("fl-paused"); }
    function resume(){ if(!paused) return; paused = false; if(glide) glide.play(); el.classList.remove("fl-paused"); endAt = Date.now() + left; timer = setTimeout(next, Math.max(400, left)); }
    el.addEventListener("mouseenter", pause); el.addEventListener("mouseleave", function(){ if(document.activeElement !== el) resume(); });
    el.addEventListener("focusin", pause); el.addEventListener("focusout", resume);
    root.addEventListener("resize", function(){ clearTimeout(FL._rz); FL._rz = setTimeout(function(){ if(!paused) show(); }, 300); });
    if(RM.addEventListener) RM.addEventListener("change", function(){ show(); });
    FL.i = 0; show();   // starts on the quote of the day
    FL.today = function(){ refresh(); return order.map(FL._item); };
  };
})(window);
