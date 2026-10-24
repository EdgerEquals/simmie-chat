/* Bonnie's Dashboard: MAIL row + MUSIC tab. Two looks of the SAME inbox queue the chat page's Replies mode reads
   (canonical source: /workspace/rebella-inbox/web/; copied into each page). Bonnie only ever sees approved-for-bonnie
   items in the sanitised shape from inbox.py bonnie_view(): safe summary, stage name, region, track link. Nothing from
   strangers reaches her directly; her replies go to Dad's list and are sent by the Rebella team after Dad checks.
   Modes (script attribute data-inbox-mode):
     preview  MOCK data only (data-mock url, same folder tree). Buttons show "preview, not saved/sent". No network calls
              beyond that one same-origin mock file: nothing outbound.
     (side mode removed from this preview copy)
   Timings are PHI^n (phi-timing-rules.md); reduced motion respected. Test runs are marked test:true and never count. */
(function(){
  "use strict";
  var S = document.currentScript || {getAttribute:function(){return null;}};
  var MODE = "preview";   // PREVIEW COPY: always mock data, nothing outbound
  var MOCK = S.getAttribute("data-mock") || "";
  var KKEY = S.getAttribute("data-qkey") || "rebella-mod-qkey";
  var TRACKS = S.getAttribute("data-tracks") || "";
  var OUTBOX = "rebella-mod-music-decisions-v1", ROUTBOX = "rebella-mod-reply-drafts-v1";
  var D = {mail:[], music:{featured:null, tracks:[]}}, ready = false, open = {}, drafts = {}, notes = {};
  function $(s, r){ return (r || document).querySelector(s); }
  function el(t, c, s){ var e = document.createElement(t); if(c) e.className = c; if(s != null) e.textContent = s; return e; }
  function when(ts){ try{ return new Date(ts).toLocaleString("en-AU", {timeZone:"Australia/Perth", day:"numeric", month:"short", hour:"numeric", minute:"2-digit"}) + " AWST"; }catch(e){ return ""; } }
  function kind(it){ return it.type === "music-submission" ? "Music submission" : it.type === "music-scout" ? "Simmie found" : "Reader message"; }
  function nonce(){ return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10); }
  var waiting = function(){ return D.mail.filter(function(i){ return i.status === "approved-for-bonnie"; }); };
  var newMusic = function(){ return D.mail.filter(function(i){ return (i.type === "music-submission" || i.type === "music-scout") && i.status === "approved-for-bonnie"; }); };

  // ---------- data ----------
  function load(){
    if(MODE === "preview"){
      if(!MOCK) return Promise.resolve();
      return fetch(MOCK, {cache:"no-store", credentials:"omit"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(m){
        if(m && m.mock){ D.mail = m.mail || []; D.music = m.music || D.music; D.mock = true; }
      }).catch(function(){});
    }
    return Promise.resolve();   // PREVIEW COPY: no other data source
  }
  function normTracks(t){
    var list = Array.isArray(t.tracks) ? t.tracks : t.tracks ? Object.keys(t.tracks).map(function(k){ var x = t.tracks[k]; x.id = x.id || k; return x; }) : [];
    var f = Array.isArray(t.featured) ? t.featured[0] : (t.featured && t.featured.id) || t.featured;
    return {featured:f, tracks:list.map(function(x){ return {id:x.id, title:x.title, artist:x.artist || x.stage_name, region:x.region, licence:x.licence, source:x.source, state:x.id === f ? "featured" : (x.state || "keep")}; })};
  }

  // ---------- decisions ----------
  function outbox(k){ try{ return JSON.parse(localStorage.getItem(k) || "[]"); }catch(e){ return []; } }
  function decideMusic(id, action, row){
    var msg = {type:"music-decision", id:id, action:action, decidedAt:new Date().toISOString(), nonce:nonce()};
    if(MODE === "preview" || !D.key){ note(row, (action === "feature" ? "Feature" : action === "keep" ? "Keep" : "Remove") + ": coming soon, not saved"); return; }
    window.RebellaCrypto.encryptJSON(D.key, msg).then(function(box){
      var o = outbox(OUTBOX); o.push(Object.assign({v:1}, box)); localStorage.setItem(OUTBOX, JSON.stringify(o.slice(-200)));
      var t = D.music.tracks.filter(function(x){ return x.id === id; })[0];
      if(action === "feature"){ D.music.tracks.forEach(function(x){ if(x.state === "featured") x.state = "keep"; }); D.music.featured = id; }
      if(t) t.state = action === "feature" ? "featured" : action === "keep" ? "keep" : "removed";
      else { var m = D.mail.filter(function(x){ return x.id === id; })[0]; if(m) m._music = action; }
      notes[id] = (action === "feature" ? "Featured" : action === "keep" ? "Kept" : "Removed") + ": saved in this browser, encrypted (side copy, not sent)";
      render();
    });
  }
  function sendDraft(it, text, row){
    if(!text.trim()) return;
    var line = "Your reply is waiting for Dad. It's sent by the Rebella team after Dad checks.";
    if(MODE === "preview" || !D.key){ drafts[it.id] = {text:text, at:Date.now()}; notes[it.id] = "Coming soon, not sent. " + line; render(); return; }
    window.RebellaCrypto.encryptJSON(D.key, {type:"reply-draft", parent_id:it.id, text:text.slice(0, 1500), draftedAt:new Date().toISOString(), nonce:nonce()}).then(function(box){
      var o = outbox(ROUTBOX); o.push(Object.assign({v:1}, box)); localStorage.setItem(ROUTBOX, JSON.stringify(o.slice(-100)));
      drafts[it.id] = {text:text, at:Date.now()}; notes[it.id] = "Saved for Dad, encrypted (side copy, not sent). " + line; render();
    });
  }
  function note(row, s){ var n = $(".ibx-note", row) || el("p", "ibx-note"); n.setAttribute("role", "status"); n.textContent = s; row.appendChild(n); }

  // ---------- Mail row ----------
  function mailRow(){
    var host = $("#ibx-mail");
    if(!host){
      host = el("section", "ibx-mail"); host.id = "ibx-mail"; host.setAttribute("aria-label", "Mail");
      var tabs = $("nav.tabs"); tabs.parentNode.insertBefore(host, tabs);
    }
    var w = waiting(), latest = w[0];
    host.innerHTML = "";
    var line = el("button", "ibx-line"); line.type = "button"; line.setAttribute("aria-expanded", open.mail ? "true" : "false"); line.setAttribute("aria-controls", "ibx-list");
    line.appendChild(el("span", "ibx-ico", "\u2709\uFE0F")); line.lastChild.setAttribute("aria-hidden", "true");
    line.appendChild(el("b", "ibx-word", "Mail"));
    var c = el("span", "ibx-count" + (w.length ? " on" : ""), String(w.length)); c.setAttribute("aria-label", w.length + " waiting"); line.appendChild(c);
    line.appendChild(el("span", "ibx-peek", latest ? kind(latest) + ": " + latest.safe_summary : "Nothing new. Everything here is checked by Simmie and Dad first."));
    line.appendChild(el("span", "ibx-chev", open.mail ? "\u25B4" : "\u25BE")); line.lastChild.setAttribute("aria-hidden", "true");
    line.addEventListener("click", function(){ open.mail = !open.mail; render(); });
    host.appendChild(line);
    var list = el("div", "ibx-list"); list.id = "ibx-list"; list.hidden = !open.mail; host.appendChild(list);
    if(D.mock) list.appendChild(el("p", "ibx-mock", "Mock data for the preview: invented messages, no real people."));
    D.mail.forEach(function(it){
      var row = el("article", "ibx-item" + (it.status === "replied" ? " done" : "")); row.dataset.id = it.id;
      var h = el("button", "ibx-head"); h.type = "button"; h.setAttribute("aria-expanded", open[it.id] ? "true" : "false");
      h.appendChild(el("span", "ibx-kind k-" + it.type, kind(it)));
      h.appendChild(el("span", "ibx-sum", it.safe_summary));
      h.appendChild(el("span", "ibx-when", it.status === "replied" ? "Replied \u2713" : when(it.ts)));
      h.addEventListener("click", function(){ open[it.id] = !open[it.id]; render(); });
      row.appendChild(h);
      if(open[it.id]){
        var b = el("div", "ibx-body");
        if(it.stage_name) b.appendChild(el("p", "ibx-f", "Stage name: " + it.stage_name));
        if(it.region) b.appendChild(el("p", "ibx-f", "Region: " + it.region));
        if(it.track_link){ var p = el("p", "ibx-f", "Track: "); if(D.mock){ p.appendChild(el("span", "ibx-mocklink", (it.track_title || "track") + " (mock link)")); } else { var a = el("a", "", it.track_title || "open the track page"); a.href = it.track_link; a.rel = "noopener noreferrer"; a.target = "_blank"; p.appendChild(a); } if(it.licence) p.appendChild(document.createTextNode(" \u00B7 " + it.licence)); b.appendChild(p); }
        if(it.status === "replied") b.appendChild(el("p", "ibx-sent", "Sent by the Rebella team after Dad checked."));
        else if(drafts[it.id]) { b.appendChild(el("p", "ibx-draft", "\u201C" + drafts[it.id].text + "\u201D")); b.appendChild(el("p", "ibx-sent", notes[it.id] || "")); }
        else {
          var f = el("form", "ibx-reply"); var lab = el("label", "sr-only", "Draft a reply"); lab.htmlFor = "ibx-ta-" + it.id; f.appendChild(lab);
          var ta = el("textarea", "ibx-ta"); ta.id = "ibx-ta-" + it.id; ta.rows = 2; ta.maxLength = 1500; ta.placeholder = "Draft a reply\u2026"; f.appendChild(ta);
          var sb = el("button", "btn btn-approve ibx-send", "Send to Dad to check"); sb.type = "submit"; f.appendChild(sb);
          f.appendChild(el("p", "ibx-fine", "Never sent straight away: it's sent by the Rebella team after Dad checks."));
          f.addEventListener("submit", function(e){ e.preventDefault(); sendDraft(it, ta.value, row); });
          b.appendChild(f);
        }
        row.appendChild(b);
      }
      list.appendChild(row);
    });
    if(!D.mail.length) list.appendChild(el("p", "ibx-empty", "No mail yet."));
  }

  // ---------- Music tab ----------
  function musicTab(){
    var tabs = $("nav.tabs"), t = $(".ibx-music-tab");
    if(!t){
      t = el("button", "tab ibx-music-tab"); t.setAttribute("role", "tab"); t.setAttribute("aria-selected", "false"); t.setAttribute("aria-controls", "ibx-music");
      t.appendChild(document.createTextNode("Music ")); t.appendChild(el("span", "count", "0")); tabs.appendChild(t);
      t.addEventListener("click", function(){ setMusic(true); });
      tabs.querySelectorAll(".tab:not(.ibx-music-tab)").forEach(function(o){ o.addEventListener("click", function(){ setMusic(false); }); });
      var p = el("section", "ibx-music"); p.id = "ibx-music"; p.setAttribute("role", "tabpanel"); p.setAttribute("aria-label", "Music"); p.hidden = true;
      var q = $("#queue"); q.parentNode.insertBefore(p, q.nextSibling);
    }
    $(".count", t).textContent = String(newMusic().length);   // new tracks waiting for Bonnie's pick
    var p2 = $("#ibx-music"); p2.innerHTML = "";
    p2.appendChild(el("p", "ibx-mhint", "Pick what's on Rebella's Music page. \u2605 Feature puts one artist in the spotlight at the top. Keep leaves it on the page. Remove takes it off."));
    function rowFor(x, isNew){
      var r = el("article", "item ibx-track c-rwl" + (x.state === "removed" ? " removed" : "")); r.dataset.id = x.id;
      var top = el("div", "top"); top.appendChild(el("span", "tag", isNew ? (x.type === "music-scout" ? "Simmie found" : "Submitted") : "On the page"));
      top.appendChild(el("span", "status ibx-state " + (x.state || "new"), x.state === "featured" ? "\u2605 Featured" : x.state === "removed" ? "Removed" : isNew ? "New" : "Kept")); r.appendChild(top);
      r.appendChild(el("h3", "", (x.title || x.track_title || "Untitled") + " \u00B7 " + (x.artist || x.stage_name || "")));
      r.appendChild(el("p", "sum", [x.region, x.licence, x.source].filter(Boolean).join(" \u00B7 ")));
      var a = el("div", "actions");
      [["feature", "\u2605 Feature", "btn btn-approve"], ["keep", "Keep", "btn btn-info"], ["remove", "Remove", "btn btn-primary"]].forEach(function(b){
        var k = el("button", b[2] + " ibx-mb", b[1]); k.type = "button"; k.addEventListener("click", function(){ decideMusic(x.id, b[0], r); }); a.appendChild(k);
      });
      r.appendChild(a); if(notes[x.id]) note(r, notes[x.id]); return r;
    }
    var n = newMusic();
    p2.appendChild(el("h3", "ibx-sub", "New for you (" + n.length + ")"));
    if(!n.length) p2.appendChild(el("p", "ibx-empty", "No new tracks. Approved submissions and Simmie's finds show up here."));
    n.forEach(function(x){ p2.appendChild(rowFor({id:x.id, track_title:x.track_title, stage_name:x.stage_name, region:x.region, licence:x.licence, source:x.source, type:x.type, state:x._music === "feature" ? "featured" : x._music === "remove" ? "removed" : "new"}, true)); });
    p2.appendChild(el("h3", "ibx-sub", "On the Music page (" + D.music.tracks.length + ")"));
    if(!D.music.tracks.length) p2.appendChild(el("p", "ibx-empty", "No tracks list in this copy yet."));
    D.music.tracks.forEach(function(x){ p2.appendChild(rowFor(x, false)); });
    if(MODE === "side"){
      var ex = el("button", "btn btn-info ibx-export", "Export music decisions (encrypted JSON)"); ex.type = "button";
      ex.addEventListener("click", function(){ var blob = new Blob([JSON.stringify({type:"music-decisions", boxes:outbox(OUTBOX)}, null, 1)], {type:"application/json"});
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rebella-music-decisions-" + new Date().toISOString().slice(0, 10) + ".json"; a.click(); });
      p2.appendChild(ex);
    } else p2.appendChild(el("p", "ibx-fine", "Coming soon: Feature, Keep and Remove aren't switched on yet."));
  }
  function setMusic(on){
    document.body.classList.toggle("ibx-music-on", on);
    $("#ibx-music").hidden = !on;
    if(on) document.querySelectorAll("nav.tabs .tab").forEach(function(o){ o.setAttribute("aria-selected", o.classList.contains("ibx-music-tab") ? "true" : "false"); });
    else $(".ibx-music-tab").setAttribute("aria-selected", "false");
  }

  function render(){ if(!$("nav.tabs")) return; mailRow(); musicTab(); try{ document.dispatchEvent(new CustomEvent("rebella:mail", {detail:{waiting:waiting().length}})); }catch(e){} }
  function start(){ if(ready) return; ready = true; load().then(render); }
  // test hook (screenshots / local tests only): same shape as bonnie_view
  document.addEventListener("rebella:inbox-data", function(e){ if(e.detail){ D.mail = e.detail.mail || []; if(e.detail.music) D.music = e.detail.music; D.mock = !!e.detail.mock; render(); } });
  function watch(){
    var app = $("#app"); if(!app) return;
    if(!app.hidden) start();
    new MutationObserver(function(){ if(!app.hidden) start(); }).observe(app, {attributes:true, attributeFilter:["hidden"]});
    document.addEventListener("rebella:status", start);
    document.addEventListener("rebella:locked", function(){ ready = false; D = {mail:[], music:{featured:null, tracks:[]}}; drafts = {}; notes = {}; var m = $("#ibx-mail"); if(m) m.innerHTML = ""; });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
})();
