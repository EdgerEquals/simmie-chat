/* Live chat page: the Simmie terminal bar (simmie> line) + Ask Dad key.
   - Danny 12:01 AWST 24 Oct: chat-held header/footer ported live (based on the shared dash/js/talk.js, cut down).
   - Danny 12:20 AWST 24 Oct (t594u): the message box + Send were removed; tapping the simmie> line opens the terminal input,
     Enter sends through js/app.js (window.SimmieChatSend) exactly as the old Send did.
   - Danny 12:23 + 12:24 AWST 24 Oct (t596u/t597u): the fun-fact ticker moved here from the header and replaces the old
     idle typewriter lines; it hides while she types, "ANSWER PENDING" blinks after she sends, and Simmie's reply scrolls
     through in raspberry with a heartbeat before the ticker returns.
   - Ask Dad: no separate channel. It opens the terminal input with "Dad: " prefilled; nothing is sent until she presses
     Enter, and it then goes the normal encrypted path.
   The old "SIMMIE IS ON IT" spinner (pump-timed in 0cbc3ea) is replaced by the ANSWER PENDING blink, a CSS animation the
   ratio pump slows like every other (css/bar-ticker.css).
   Never stores or logs message text; sending is done by js/app.js. Static under reduced motion. */
(function(){
  "use strict";
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  var $ = function(s){ return document.querySelector(s); };
  var started = false, running = false, timer = null, job = null;

  var out = function(){ return $("#tty-out"); };
  function cloud(on){ var c = $("#tty-cloud"); if(c) c.classList.toggle("talking", !!on && !RM.matches); }
  function stop(){ clearTimeout(timer); timer = null; job = null; cloud(false); }
  function setLabel(t){ var b = $("#tty-open"); if(b) b.setAttribute("aria-label", t + ". Tap to type a message to Simmie"); }

  // ---------- the simmie> bar (Danny 12:23 + 12:24 AWST 24 Oct, t596u/t597u) ----------
  // One line, four states (only one shows at a time):
  //   ticker  - the fun-fact ticker (moved here from the header), scrolling beside the simmie> name (dash/js/hud.js sets its speed)
  //   typing  - she tapped the line: input open, ticker hidden. Blur / Esc / Enter (sent) closes it; a draft she leaves is kept
  //   pending - after she sends, until Simmie replies (js/app.js shows #typing): "ANSWER PENDING" blinking slowly (phi-timed)
  //   reply   - Simmie's reply arrives: its text scrolls once through the bar in raspberry with a heartbeat, then the ticker
  //             comes back. The text is what the chat already shows her (her own decrypted view, read from the bubble on screen);
  //             nothing is stored, logged, sent or pinged.
  var PHI = 1.6180339887, REPLY_MAX = 140;
  var replyOn = false, replyAnim = null, replyTimer = null, seenKey = null, armedAt = 0, wasPending = false;
  function inputOpen(){ var f = $("#tty-form"); return !!(f && !f.hidden); }
  function pending(){ var t = $("#typing"); return !!(t && !t.hidden && running); }
  function show(el, on){ if(el) el.hidden = !on; }
  function sync(){
    var foot = $("#wx-foot"), o = $("#tty-open"), busyLine = $("#tty-busy"), tk = $("#wx-ticker"), pe = $("#tty-pend"), rp = $("#tty-reply");
    if(!foot || !o) return;
    var typing = inputOpen(), pend = pending() && !replyOn;
    if(pending()) wasPending = true;
    show(busyLine, false); show(out(), false);
    o.hidden = typing;
    foot.classList.toggle("tty-busy-on", pend);
    foot.classList.toggle("bar-typing", typing);
    var tickerWas = tk && !tk.hidden;
    show(rp, replyOn && !typing); show(pe, pend && !typing); show(tk, !replyOn && !pend && !typing);
    cloud(replyOn && !typing);
    setLabel(replyOn ? "Simmie replied" : pend ? "Answer pending" : "Fun facts scrolling");
    if(tk && !tk.hidden && !tickerWas) document.dispatchEvent(new CustomEvent("rebella:ticker-shown"));
  }
  // newest Simmie reply on screen (the same bubble js/app.js renders; Dad's messages are not Simmie's)
  function lastReply(){
    var els = document.querySelectorAll("#log .msg.them:not(.dad)"), b = els[els.length - 1]; if(!b) return {n:0, key:"", text:""};
    var t = "", got = false; for(var c = b.firstChild; c; c = c.nextSibling){   // message text = its text nodes + tappable links (t670u)
      if(c.nodeType === 3){ t += c.data; got = true; } else if(c.nodeType === 1 && c.classList.contains("msg-link")){ t += c.textContent; got = true; } else if(got) break; }
    t = String(t).replace(/\s+/g, " ").trim();
    return {n:els.length, key:els.length + "|" + t.slice(0, 60), text:t};
  }
  function checkReply(){
    if(!running) return; var r = lastReply();
    if(seenKey === null || Date.now() < armedAt){ seenKey = r.key; return; }   // what was already there when the chat opened
    if(r.key === seenKey) return;
    var fresh = r.n > +String(seenKey).split("|")[0] || wasPending; seenKey = r.key;
    if(fresh && r.text) showReply(r.text);
  }
  function endReply(){ clearTimeout(replyTimer); replyTimer = null; if(replyAnim){ try{ replyAnim.cancel(); }catch(e){} replyAnim = null; }
    replyOn = false; var tr = $("#tty-reply-track"); if(tr) tr.textContent = ""; sync(); }
  function showReply(text){
    endReply(); wasPending = false;
    var tr = $("#tty-reply-track"), box = $("#tty-reply"); if(!tr || !box) return;
    tr.textContent = text.length > REPLY_MAX ? text.slice(0, REPLY_MAX - 1).replace(/\s+\S*$/, "") + "\u2026" : text;
    replyOn = true; sync();
    if(RM.matches || !tr.animate){ replyTimer = setTimeout(endReply, Math.round(Math.pow(PHI, 6) * 1000)); return; }   // static, PHI^6 = 17.9 s
    var cw = box.clientWidth || 200, tw = tr.scrollWidth || 200;
    var v = (window.RebellaHud && window.RebellaHud.tickerSpeed) ? window.RebellaHud.tickerSpeed().pxps : 24;   // same calm speed as the ticker
    replyAnim = tr.animate([{transform:"translateX(" + cw + "px)"}, {transform:"translateX(" + (-tw) + "px)"}],
      {duration:Math.round((cw + tw) / v * 1000), easing:"linear", fill:"both"});
    replyAnim.onfinish = function(){ replyAnim = null; replyTimer = setTimeout(endReply, Math.round(PHI * 1000)); };   // short PHI dwell, then the ticker
  }

  // Typing (Danny 12:20 AWST 24 Oct, t594u: message box + Send removed). Tap the simmie> line -> input opens (keyboard on
  // phones); Enter hands the text to js/app.js (window.SimmieChatSend: same message, encryption, relay and log entry as the
  // old Send). Nothing here stores or logs what she types. Her line is cleared once handed over.
  var sending = false;
  // Ask Dad on a phone (Danny 14:05 AWST 24 Oct, t665u): the keyboard used to cover the bonnie> input at the bottom of the page.
  // Now the whole footer (input included) slides up to sit directly under the header (CSS order, dash/css/chat-dash.css) and the
  // chat screen's height follows window.visualViewport, so the input stays in view above the keyboard. Blur, Esc, Enter (sent)
  // or the keyboard closing -> it slides back to its normal place. Touch phones/tablets only (no on-screen keyboard on desktop).
  // Slide time PHI^-2 = 0.382 s; no slide under reduced motion. Nothing typed is read, stored or logged here.
  var TOUCH = window.matchMedia ? window.matchMedia("(hover: none) and (pointer: coarse)") : {matches:false};
  var kb = {on:false, base:0, shrunk:false};
  function slide(el, fromTop){
    if(RM.matches || !el || !el.animate) return;
    var d = fromTop - el.getBoundingClientRect().top; if(Math.abs(d) < 1) return;
    try{ el.animate([{transform:"translateY(" + d + "px)"}, {transform:"none"}], {duration:382, easing:"cubic-bezier(.2,.7,.2,1)"}); }catch(e){}
  }
  function logToEnd(){ var lg = $("#log"); if(lg) lg.scrollTop = lg.scrollHeight; }
  function fitKb(){
    if(!kb.on) return;
    var s = $("#screen-chat"), v = window.visualViewport; if(!s) return;
    var h = v ? v.height : window.innerHeight;
    if(h < kb.base * 0.85) kb.shrunk = true;
    else if(kb.shrunk){ var i = $("#tty-in"); if(i) i.blur(); dropFoot(); return; }   // keyboard closed
    s.style.height = Math.round(h) + "px";
    if(window.scrollY) window.scrollTo(0, 0);
    s.style.transform = (v && v.offsetTop > 0.5) ? "translateY(" + Math.round(v.offsetTop) + "px)" : "";
  }
  function liftFoot(){
    var s = $("#screen-chat"), ft = $("#chat-foot"); if(!s || !ft || kb.on || !TOUCH.matches) return;
    var v = window.visualViewport; kb.on = true; kb.shrunk = false; kb.base = v ? v.height : window.innerHeight;
    var y0 = ft.getBoundingClientRect().top;
    s.classList.add("askdad-up"); slide(ft, y0); logToEnd(); fitKb();
  }
  function dropFoot(){
    var s = $("#screen-chat"), ft = $("#chat-foot"); if(!s || !kb.on) return;
    kb.on = false; var y0 = ft ? ft.getBoundingClientRect().top : 0;
    s.classList.remove("askdad-up"); s.style.height = ""; s.style.transform = "";
    if(ft) slide(ft, y0); logToEnd();
  }
  if(window.visualViewport){ window.visualViewport.addEventListener("resize", fitKb); window.visualViewport.addEventListener("scroll", fitKb); }
  window.addEventListener("resize", fitKb);
  function openInput(prefix, lift){
    var f = $("#tty-form"), i = $("#tty-in"); if(!f || !i) return;
    if(prefix && !i.value.trim()) i.value = prefix;
    f.hidden = false; stop(); sync();
    if(lift) liftFoot();
    i.focus({preventScroll:true});
    try{ i.setSelectionRange(i.value.length, i.value.length); }catch(e){}
  }
  function closeInput(){ dropFoot(); var f = $("#tty-form"); if(!f || f.hidden) return; f.hidden = true; sync(); }
  function wire(){
    var o = $("#tty-open"); if(o) o.addEventListener("click", function(){ openInput(""); });
    var b = $("#ask-dad"); if(b){ b.addEventListener("click", function(){ openInput("Dad: ", true); }); b.classList.add("ready"); }
    var f = $("#tty-form"), i = $("#tty-in");
    if(f && i){
      f.addEventListener("submit", function(e){
        e.preventDefault(); if(sending) return;
        var v = i.value.trim(); if(!v || !window.SimmieChatSend) return;
        sending = true; i.value = ""; wasPending = true;
        Promise.resolve(window.SimmieChatSend(v)).catch(function(){}).then(function(){ sending = false; sync(); });
        i.blur(); closeInput();   // sent: the bar goes back to normal (answer pending until Simmie replies)
      });
      i.addEventListener("keydown", function(e){ if(e.key === "Escape"){ i.blur(); } });
      // finished typing: the bar closes on blur (a draft stays in the box for next time)
      i.addEventListener("blur", function(){ setTimeout(function(){ if(document.activeElement !== i) closeInput(); }, 150); });
    }
    var t = $("#typing"); if(t && window.MutationObserver) new MutationObserver(function(){ checkReply(); sync(); }).observe(t, {attributes:true, attributeFilter:["hidden"]});
    var lg = $("#log"); if(lg && window.MutationObserver) new MutationObserver(function(){ checkReply(); sync(); }).observe(lg, {childList:true});
  }
  document.addEventListener("rebella:status", function(){
    if(!started){ started = true; wire(); }
    if(!running){ running = true; seenKey = null; armedAt = Date.now() + 6000; wasPending = false; checkReply(); sync(); }
  });
  document.addEventListener("rebella:locked", function(){ running = false; stop(); endReply(); dropFoot(); var f = $("#wx-foot"); if(f) f.classList.remove("tty-busy-on"); });
})();
