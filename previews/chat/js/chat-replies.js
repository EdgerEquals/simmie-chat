/* Chat page: "Chat | Replies" toggle at the top. Replies mode is the chat-page look of the SAME inbox queue the
   dashboard's Mail row shows (canonical source: /workspace/rebella-inbox/web/). Bonnie sees approved-for-bonnie items as
   message bubbles (sanitised summary, stage name, region, track link only) and can draft a reply. A draft NEVER goes out
   directly: it becomes a reply-draft on Dad's list, and Dad sends it as the Rebella team.
   Modes (script attribute data-inbox-mode):
     preview  MOCK data only (data-mock, same-origin file). "Preview, not sent". No ntfy, relay, email or GitHub API calls.
     side     side copy: reads inbox-view.enc.json with the chat key already in this tab (sessionStorage), if present;
              on localhost ?mockinbox=1 loads the mock file instead. Drafts are encrypted and kept in this browser
              (stub transport, not sent) until go-live wires the reply-draft route.
   Timings: PHI^-1 = 0.618 s fade. Reduced motion respected. */
(function(){
  "use strict";
  var S = document.currentScript || {getAttribute:function(){return null;}};
  var MODE = S.getAttribute("data-inbox-mode") || "preview";
  var MOCK = S.getAttribute("data-mock") || "";
  var CKEY = S.getAttribute("data-chatkey") || "simmie-chat-key";
  var OUT = "simmie-chat-reply-drafts-v1";
  var items = [], drafts = {}, mode = "chat", mock = false, key = null, built = false;
  function $(s, r){ return (r || document).querySelector(s); }
  function el(t, c, s){ var e = document.createElement(t); if(c) e.className = c; if(s != null) e.textContent = s; return e; }
  function when(ts){ try{ return new Date(ts).toLocaleString("en-AU", {timeZone:"Australia/Perth", weekday:"short", hour:"numeric", minute:"2-digit"}); }catch(e){ return ""; } }
  function kind(it){ return it.type === "music-submission" ? "Music submission" : it.type === "music-scout" ? "Simmie found a track" : "Reader message"; }
  function nonce(){ return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  function waiting(){ return items.filter(function(i){ return i.status === "approved-for-bonnie" && !drafts[i.id]; }).length; }

  function load(){
    var useMock = MODE === "preview" || (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).get("mockinbox") === "1");
    if(useMock){
      if(!MOCK) return Promise.resolve();
      return fetch(MOCK, {cache:"no-store", credentials:"omit"}).then(function(r){ return r.ok ? r.json() : null; })
        .then(function(m){ if(m && m.mock){ items = m.mail || []; mock = true; } }).catch(function(){});
    }
    var C = window.SimmieCrypto, raw = sessionStorage.getItem(CKEY);
    if(!C || !raw) return Promise.resolve();
    return C.importKey(raw).then(function(k){ key = k;
      return fetch("inbox-view.enc.json?t=" + Date.now(), {cache:"no-store", credentials:"omit"}).then(function(r){ if(!r.ok) throw 0; return r.json(); })
        .then(function(doc){ return C.decryptJSON(k, doc.box); }).then(function(p){ items = p.mail || []; }).catch(function(){});
    });
  }

  function build(){
    var scr = $("#screen-chat"), head = $(".chat-head", scr); if(!scr || !head || built) return; built = true;
    var bar = el("div", "rp-bar"); bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Chat or replies");
    [["chat", "Chat"], ["replies", "Replies"]].forEach(function(b){
      var t = el("button", "rp-tab"); t.type = "button"; t.setAttribute("role", "tab"); t.dataset.mode = b[0]; t.setAttribute("aria-selected", b[0] === mode ? "true" : "false");
      t.appendChild(document.createTextNode(b[1]));
      if(b[0] === "replies"){ var c = el("span", "rp-count", "0"); c.id = "rp-count"; t.appendChild(c); t.setAttribute("aria-controls", "rp-panel"); }
      t.addEventListener("click", function(){ setMode(b[0]); }); bar.appendChild(t);
    });
    head.parentNode.insertBefore(bar, head.nextSibling);
    var p = el("section", "rp-panel"); p.id = "rp-panel"; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-label", "Replies"); p.hidden = true;
    var log = $("#log", scr); log.parentNode.insertBefore(p, log);
  }
  function setMode(m){
    mode = m; var scr = $("#screen-chat");
    scr.classList.toggle("rp-on", m === "replies");
    document.querySelectorAll(".rp-tab").forEach(function(t){ t.setAttribute("aria-selected", t.dataset.mode === m ? "true" : "false"); });
    $("#rp-panel").hidden = m !== "replies";
    if(m === "replies") render();
  }
  function render(){
    build(); var p = $("#rp-panel"); if(!p) return;
    $("#rp-count").textContent = String(waiting()); $("#rp-count").classList.toggle("on", waiting() > 0);
    p.innerHTML = "";
    var intro = el("p", "rp-intro", "People who wrote to Rebella. Simmie and Dad checked these first. Your reply goes to Dad, and it's sent by the Rebella team after Dad checks.");
    p.appendChild(intro);
    if(mock) p.appendChild(el("p", "rp-mock", "Mock data for the preview: invented messages, no real people."));
    if(!items.length) p.appendChild(el("div", "empty", "No replies waiting. When someone writes to Rebella and it's safe, it shows up here."));
    items.slice().sort(function(a, b){ return a.ts - b.ts; }).forEach(function(it){
      var b = el("div", "msg them rp-msg k-" + it.type + (it.status === "replied" ? " rp-done" : "")); b.dataset.id = it.id;
      b.appendChild(el("span", "sender", kind(it)));
      b.appendChild(document.createTextNode(it.safe_summary));
      if(it.stage_name || it.region){ b.appendChild(el("span", "rp-who", [it.stage_name, it.region].filter(Boolean).join(" \u00B7 "))); }
      if(it.track_link){ var l = el("span", "rp-link"); if(mock) l.textContent = "\u266A " + (it.track_title || "track") + " (mock link)"; else { var a = el("a", "", "\u266A " + (it.track_title || "Listen")); a.href = it.track_link; a.target = "_blank"; a.rel = "noopener noreferrer"; l.appendChild(a); } b.appendChild(l); }
      b.appendChild(el("span", "meta", when(it.ts)));
      p.appendChild(b);
      if(it.status === "replied"){ var d = el("div", "msg me rp-sent"); d.appendChild(el("span", "rp-badge", "Sent by the Rebella team after Dad checks")); d.appendChild(document.createTextNode("Replied \u2713")); p.appendChild(d); return; }
      if(drafts[it.id]){
        var m = el("div", "msg me pending rp-draft"); m.appendChild(el("span", "rp-badge", "Waiting for Dad \u00B7 sent by the Rebella team after Dad checks"));
        m.appendChild(document.createTextNode(drafts[it.id].text)); m.appendChild(el("span", "meta", drafts[it.id].note)); p.appendChild(m); return;
      }
      var f = el("form", "rp-reply"); f.autocomplete = "off";
      var lab = el("label", "tty-sr", "Reply to this " + kind(it).toLowerCase()); lab.htmlFor = "rp-ta-" + it.id; f.appendChild(lab);
      var ta = el("textarea", "rp-ta"); ta.id = "rp-ta-" + it.id; ta.rows = 1; ta.maxLength = 1500; ta.placeholder = "Draft a reply\u2026"; f.appendChild(ta);
      var s = el("button", "rp-send", "To Dad"); s.type = "submit"; s.setAttribute("aria-label", "Send this draft to Dad to check"); f.appendChild(s);
      f.addEventListener("submit", function(e){ e.preventDefault(); draft(it, ta.value); });
      p.appendChild(f);
    });
    p.appendChild(el("p", "rp-fine", "Nothing here is sent straight away. Every reply is sent by the Rebella team after Dad checks it."));
  }
  function draft(it, text){
    text = (text || "").trim(); if(!text) return;
    if(MODE === "preview" || !key){ drafts[it.id] = {text:text, note:"Preview, not sent"}; render(); return; }
    window.SimmieCrypto.encryptJSON(key, {type:"reply-draft", parent_id:it.id, text:text.slice(0, 1500), draftedAt:new Date().toISOString(), nonce:nonce()}).then(function(box){
      try{ var o = JSON.parse(localStorage.getItem(OUT) || "[]"); o.push(Object.assign({v:1}, box)); localStorage.setItem(OUT, JSON.stringify(o.slice(-100))); }catch(e){}
      drafts[it.id] = {text:text, note:"Saved for Dad (side copy, not sent)"}; render();
    });
  }
  function start(){ build(); load().then(render); }
  document.addEventListener("rebella:inbox-data", function(e){ if(e.detail){ items = e.detail.mail || []; mock = !!e.detail.mock; render(); } });
  function watch(){
    var scr = $("#screen-chat"); if(!scr) return;
    if(!scr.hidden) start();
    else new MutationObserver(function(_, o){ if(!scr.hidden){ o.disconnect(); start(); } }).observe(scr, {attributes:true, attributeFilter:["hidden"]});
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
})();
