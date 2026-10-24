/* Live chat page: Simmie terminal READOUT + Ask Dad key (Danny 12:01 AWST 24 Oct 2026: chat-held header/footer ported live,
   a bit less busy). Based on the shared dash/js/talk.js, cut down:
   - the terminal only DISPLAYS (cloud + "simmie>" line): idle greetings, a fun fact now and then, a short status report
     (counts only, from dash/js/chat-dash.js). Tapping the line opens the terminal input (the only input since the message
     box was removed, Danny 12:20 AWST 24 Oct); Enter sends through js/app.js exactly as the old Send did.
   - while the page is waiting for Simmie (#typing shown by js/app.js) the line shows a spinner.
   - Ask Dad: no separate transmission window or channel. It opens the terminal input with "Dad: "
     prefilled; nothing is sent until she presses Enter, and it then goes the normal encrypted path.
   Never stores or logs message text; sending is done by js/app.js. Static under reduced motion. Paused while the tab is hidden. */
(function(){
  "use strict";
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  var $ = function(s){ return document.querySelector(s); };
  var H = function(){ return window.RebellaHud || null; };
  var PT = function(){ return window.PhiTiming; };
  var SPIN = ["\u280B","\u2819","\u2839","\u2838","\u283C","\u2834","\u2826","\u2827","\u2807","\u280F"];
  var started = false, running = false, timer = null, job = null, cycle = 0, spin = null;

  function perth(ts){ return new Date(ts).toLocaleString("en-AU", {timeZone:"Australia/Perth", hour:"2-digit", minute:"2-digit", hour12:false}) + " AWST"; }
  function ago(ms){ var s = ms/1000; return s < 3600 ? Math.max(1, Math.round(s/60)) + " min" : s < 172800 ? Math.round(s/3600) + " h" : Math.round(s/86400) + " days"; }
  var SCRIPTS = ["HEY BONNIE!", "YOU ROCK", "STARS ALIGNED \u2728", "SYSTEMS NOMINAL"];
  function report(){ return window.ChatDashReport ? window.ChatDashReport(perth, ago) : ["SYSTEMS NOMINAL"]; }
  function factLine(){ var f = H() && H().fact(Math.floor(cycle/4)); return f ? "FACT" + (f.source ? " \u00B7 " + f.source : "") + ": " + f.text : null; }

  var out = function(){ return $("#tty-out"); };
  function cloud(on){ var c = $("#tty-cloud"); if(c) c.classList.toggle("talking", !!on && !RM.matches); }
  function cap(){
    var body = $(".tty-body"), m = $("#tty-measure"); if(!body) return 40;
    var cw = m ? m.getBoundingClientRect().width / 10 : 7.2; cw = cw || 7.2;
    return Math.max(12, Math.floor((body.clientWidth - 42 - cw * 8.5) / cw) - 1);
  }
  function chunks(text){
    var n = cap(), words = String(text).split(/\s+/), res = [], cur = "";
    words.forEach(function(w){
      while(w.length > n){ if(cur){ res.push(cur); cur = ""; } res.push(w.slice(0, n)); w = w.slice(n); }
      if(!cur) cur = w; else if((cur + " " + w).length <= n) cur += " " + w; else { res.push(cur); cur = w; }
    });
    if(cur) res.push(cur); return res;
  }
  function stop(){ clearTimeout(timer); timer = null; job = null; cloud(false); }
  function typeLines(lines, done, hold){
    stop(); var q = []; lines.forEach(function(l){ chunks(l).forEach(function(c){ q.push(c); }); });
    var i = 0, pos = 0; job = {};
    function step(){
      timer = null; if(!job || !running) return;
      if(document.hidden) return;                       // resumes on visibilitychange
      var o = out(); if(!o) return;
      if(i >= q.length){ cloud(false); job = null; if(done) done(); return; }
      if(RM.matches){ o.textContent = q[i]; i++; timer = setTimeout(step, hold || 2600); return; }
      cloud(true); pos++; o.textContent = q[i].slice(0, pos);
      if(pos >= q[i].length){ cloud(false); i++; pos = 0; timer = setTimeout(step, hold || 2200); }
      else timer = setTimeout(step, 55);
    }
    job.step = step; timer = setTimeout(step, 250);
  }
  function setLabel(t){ var b = $("#tty-open"); if(b) b.setAttribute("aria-label", "Simmie says: " + t + ". Tap to type a message to Simmie"); }
  function idle(){
    if(!running) return;
    if(RM.matches){ stop(); out().textContent = "HEY BONNIE!"; setLabel("HEY BONNIE!"); return; }
    cycle++;
    var lines;
    if(cycle % 8 === 4) lines = report();
    else if(cycle % 8 === 0 && (lines = factLine())) lines = [lines];
    else lines = [SCRIPTS[cycle % SCRIPTS.length]];
    setLabel(lines.join(". "));
    var P = PT();
    typeLines(lines, function(){ out().textContent = ""; timer = setTimeout(idle, P ? P.ms("tty-gap") : 3000); }, P ? P.ms(lines.length > 1 ? "tty-hold-multi" : "tty-hold") : 2200);
  }

  // waiting for Simmie (js/app.js shows #typing): spinner on the terminal line
  function busySync(){
    var t = $("#typing"), foot = $("#wx-foot"), busy = !!(t && !t.hidden && running), line = $("#tty-busy"), open = $("#tty-open");
    if(!foot || !line || !open) return;
    if(busy === foot.classList.contains("tty-busy-on")) return;
    foot.classList.toggle("tty-busy-on", busy); line.hidden = !busy; open.hidden = busy || inputOpen();
    clearInterval(spin); spin = null;
    if(busy){
      stop(); cloud(true); var i = 0, txt = $("#tty-busy-text");
      var tick = function(){ txt.textContent = (RM.matches ? "\u2026" : SPIN[i++ % SPIN.length]) + " SIMMIE IS ON IT\u2026"; };
      tick(); spin = setInterval(function(){ if(!document.hidden) tick(); }, RM.matches ? 5000 : Math.round(120 / ((window.RatioPump && window.RatioPump.rate()) || 1)));   // spinner on the ratio pump + site dial
    } else { cloud(false); out().textContent = ""; if(!inputOpen()) idle(); }
  }

  // Typing (Danny 12:20 AWST 24 Oct, t594u: message box + Send removed). Tap the simmie> line -> input opens (keyboard on
  // phones); Enter hands the text to js/app.js (window.SimmieChatSend: same message, encryption, relay and log entry as the
  // old Send). Nothing here stores or logs what she types. Her line is cleared once handed over.
  var sending = false;
  function inputOpen(){ var f = $("#tty-form"); return !!(f && !f.hidden); }
  function openInput(prefix){
    var f = $("#tty-form"), i = $("#tty-in"), o = $("#tty-open"); if(!f || !i) return;
    if(prefix && !i.value.trim()) i.value = prefix;
    f.hidden = false; if(o) o.hidden = true; stop();
    i.focus({preventScroll:true});
    try{ i.setSelectionRange(i.value.length, i.value.length); }catch(e){}
  }
  function closeInput(){
    var f = $("#tty-form"), o = $("#tty-open"), busy = $("#wx-foot") && $("#wx-foot").classList.contains("tty-busy-on");
    if(!f || f.hidden) return; f.hidden = true; if(o) o.hidden = busy;
    if(running && !busy){ out().textContent = ""; idle(); }
  }
  function wire(){
    var o = $("#tty-open"); if(o) o.addEventListener("click", function(){ openInput(""); });
    var b = $("#ask-dad"); if(b){ b.addEventListener("click", function(){ openInput("Dad: "); }); b.classList.add("ready"); }
    var f = $("#tty-form"), i = $("#tty-in");
    if(f && i){
      f.addEventListener("submit", function(e){
        e.preventDefault(); if(sending) return;
        var v = i.value.trim(); if(!v || !window.SimmieChatSend) return;
        sending = true; i.value = "";
        Promise.resolve(window.SimmieChatSend(v)).catch(function(){}).then(function(){ sending = false; });
      });
      i.addEventListener("keydown", function(e){ if(e.key === "Escape"){ i.blur(); } });
      i.addEventListener("blur", function(){ setTimeout(function(){ if(!i.value.trim() && document.activeElement !== i) closeInput(); }, 150); });
    }
    var t = $("#typing"); if(t && window.MutationObserver) new MutationObserver(busySync).observe(t, {attributes:true, attributeFilter:["hidden"]});
  }
  document.addEventListener("visibilitychange", function(){ if(!document.hidden && job && !timer && job.step) timer = setTimeout(job.step, 200); });
  document.addEventListener("rebella:status", function(){
    if(!started){ started = true; wire(); }
    if(!running){ running = true; idle(); busySync(); }
  });
  document.addEventListener("rebella:locked", function(){ running = false; stop(); clearInterval(spin); spin = null; var f = $("#wx-foot"); if(f) f.classList.remove("tty-busy-on"); });
})();
