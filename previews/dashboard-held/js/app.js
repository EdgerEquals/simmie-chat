// PREVIEW COPY of Bonnie's Dashboard (held header/footer work, rebella-dashheader 69b0779) for simmie-chat/previews/dashboard-held.
// SAMPLE DATA ONLY: no passcode gate, no encrypted queue, no keys. Cards come from data/sample-queue.json (invented items).
// Approve / Reject / Undo, the age dial and Lock only change this page; nothing is saved or sent anywhere.
(function(){
  "use strict";
  var CAT = {"Make It":"c-make","Big Questions":"c-questions","Mind & Body":"c-mind","Your World":"c-world","Read Watch Listen":"c-rwl","Your Voice":"c-voice"};
  var $ = function(s){return document.querySelector(s);};
  var filter = "pending";
  var panel = null;
  var REASONS = ["Not age-appropriate","Body image / diet content","Unverified or misleading claims","Advertising or sponsored","Privacy or consent concern","Off-topic for Rebella"];
  var Q = null, ITEMS = [], live = {}, remote = {};
  var linkState = "ok", linkAt = Date.now(), linkMs = null;
  function emitStatus(counts){
    try{
      var pend = ITEMS.filter(function(it){ return forAge(it) && statusOf(it.id) === "pending"; });
      var newest = ITEMS.filter(function(it){ return it.published; }).sort(function(a,b){ return a.published < b.published ? 1 : -1; })[0];
      document.dispatchEvent(new CustomEvent("rebella:status", {detail:{
        pending:counts.pending, approved:counts.approved, rejected:counts.rejected, all:counts.all,
        updated:Q && Q.updated, link:linkState, linkAt:linkAt, linkMs:linkMs,
        top:pend[0] ? {title:pend[0].title, score:pend[0].score} : null,
        newest:newest ? {title:newest.title, date:newest.published} : null,
        published:Q && Q.published ? Object.keys(Q.published).length : 0, liveChecked:Object.keys(live).length
      }}));
    }catch(e){}
  }
  // ---------- decisions ----------
  var MEM = {};   // PREVIEW: decisions live in this page only (nothing saved, nothing sent)
  function load(){ return JSON.parse(JSON.stringify(MEM)); }
  function save(d){ MEM = d; }
  // the box's record wins once it exists (shared across devices); this browser's record fills the gap until then
  function rec(id){
    var boxd = (Q && Q.decisions && Q.decisions[id]) || null, loc = load()[id] || null;
    if(Q && Q.published && Q.published[id]) return {status:"approved", state:"published", url:Q.published[id].url, decidedAt:(boxd||loc||{}).decidedAt};
    if(boxd && (!loc || (boxd.decidedAt||"") >= (loc.decidedAt||""))) return boxd;
    return loc;
  }
  function statusOf(id){ var r = rec(id); return r ? r.status : "pending"; }
  function nonce(){ return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,10); }

  // ---------- age dial (Danny 24 Oct 2026 02:54 AWST): the queue follows the dial straight away ----------
  // Each item carries the pipeline's suggested age label (scan.py age_for: "All ages", "10+", "12+" ... "16+").
  // At dial age A an item is in the queue when its minimum age <= A. Labels with no number other than "All ages"
  // (e.g. "Not suitable") only show at 16, the top of the dial, so a younger setting never surfaces them.
  function dialAge(){ var b = document.getElementById("agedial"), a = b ? parseInt(b.getAttribute("data-age"), 10) : 13; return a >= 10 && a <= 16 ? a : 13; }
  function minAge(label){ var t = String(label || ""); if(/all\s*ages/i.test(t)) return 0; var m = t.match(/(\d{1,2})\s*\+/); return m ? +m[1] : (t ? 16 : 0); }
  function forAge(it){ return minAge(it.age) <= dialAge(); }
  function perthNow(){ return new Date().toLocaleString("sv-SE", {timeZone:"Australia/Perth"}).replace(" ", "T") + "+08:00"; }
  var ageSendT = 0, ageSentFrom = null;
  document.addEventListener("rebella:age", function(ev){
    var d = ev.detail || {}; if(Q) render();
    if(d.source !== "bonnie") return;
    if(ageSentFrom == null) ageSentFrom = d.from;
    clearTimeout(ageSendT);   // one message per burst of presses: PHI^0.5 s (1.272 s) after the last press
    ageSendT = setTimeout(function(){
      var from = ageSentFrom, to = dialAge(); ageSentFrom = null;
      if(from === to) return;
      send({type:"age-dial-change", from:from, to:to, by:"bonnie", at:perthNow(), decidedAt:new Date().toISOString(), nonce:nonce()}).catch(function(){});
    }, 1272);
  });

  // PREVIEW: nothing is ever sent anywhere
  async function send(obj){ await new Promise(function(r){ setTimeout(r, 300); }); return true; }
  async function decide(id, status, reason){
    try{ document.dispatchEvent(new CustomEvent("rebella:decision", {detail:{n:ITEMS.findIndex(function(it){ return it.id === id; }) + 1, status:status}})); }catch(e){}
    var d = load(), now = new Date().toISOString();
    if(status === "pending") d[id] = {status:"pending", decidedAt:now, state:"sending"};
    else d[id] = {status:status, reason:reason||"", decidedAt:now, state:"sending"};
    save(d); remote[id] = null; render();
    try{
      await send({type:"decision", id:id, status:status, reason:reason||"", decidedAt:now, nonce:nonce()});
      d = load(); if(d[id]) d[id].state = "preview"; save(d);
    }catch(e){ d = load(); if(d[id]) d[id].state = "unsent"; save(d); }
    render();
  }

  function checkLive(){}   // PREVIEW: no live-page checks

  function pipeLine(it, r){
    var rm = remote[it.id], url = (r && r.url) || (rm && rm.url) || it.url;
    if(r && r.status === "approved"){
      if(live[it.id]) return {cls:"pipe live", html:"Live \u2713 <a href=\"" + live[it.id] + "\" target=\"_blank\" rel=\"noopener\">Open the page on Rebella</a>"};
      if(rm && rm.state === "error") return {cls:"pipe err", text:"Approved, but publishing hit a problem. Simmie's publisher will retry."};
      if(r.state === "unsent") return {cls:"pipe err", text:"Approved here, but it didn't reach the publisher. Tap Retry."};
      if(r.state === "sending") return {cls:"pipe", text:"Approved \u00b7 sending\u2026"};
      if(r.state === "preview") return {cls:"pipe", text:"Approved (preview, not saved or sent)"};
      checkLive(it.id, url);
      if((rm && (rm.state === "pushed" || rm.state === "slow")) || r.state === "published") return {cls:"pipe", text:"Approved \u00b7 published, waiting for the page to go live (1\u20135 minutes)\u2026"};
      return {cls:"pipe", text:"Approved, publishing\u2026 (this page updates by itself)"};
    }
    if(r && r.status === "rejected"){
      if(r.state === "unsent") return {cls:"pipe err", text:"Rejected here, but it didn't reach the box. Tap Retry."};
      if(r.state === "sending") return {cls:"pipe", text:"Rejected \u00b7 sending\u2026"};
      if(r.state === "preview") return {cls:"pipe", text:"Rejected (preview, not saved or sent)"};
      if((rm && rm.state === "rejected-logged") || r.state === "logged") return {cls:"pipe", text:"Rejected \u00b7 logged. It won't be suggested again."};
      return {cls:"pipe", text:"Rejected \u00b7 sent"};
    }
    return null;
  }

  function el(tag, cls, text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function btn(label, cls, fn){ var b=el("button","btn "+cls,label); b.type="button"; b.addEventListener("click",fn); return b; }
  function link(href, text){ var a=el("a",null,text); a.href=href; a.target="_blank"; a.rel="noopener noreferrer"; return a; }

  function card(it){
    var r = rec(it.id), st = r ? r.status : "pending";
    if(st === "pending") r = null;
    var a = el("article", "item " + (CAT[it.category]||"c-make")); a.setAttribute("data-id", it.id);
    var top = el("div","top"), left = el("div");
    left.appendChild(el("span","tag",it.category));
    left.appendChild(el("span","type",it.type));
    top.appendChild(left);
    var rt = el("div"); rt.appendChild(el("span","status "+st, st)); top.appendChild(rt);
    a.appendChild(top);
    if(it.image && (it.image.thumb || it.image.src)){
      var fig = el("div","pic"), img = el("img"); img.src = it.image.thumb || it.image.src; img.alt = it.image.alt || ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      fig.appendChild(img); a.appendChild(fig);
      a.appendChild(el("p","pic-credit","Photo: " + (it.image.artist||"") + " \u00b7 " + (it.image.licLabel||"") + " \u00b7 " + (it.image.via||"")));
    }
    a.appendChild(el("h3",null,it.title));
    a.appendChild(el("p","src","Source: " + it.source + (it.authors ? " \u00b7 " + it.authors : "") + " \u00b7 Licence: " + it.licence));
    a.appendChild(el("p","sum",it.summary || ""));
    var dl = el("dl"); dl.appendChild(el("dt",null,"Suggested age:"));
    dl.appendChild(el("dd","age"+(/not/i.test(it.age)?" bad":""),it.age));
    if(it.words){ dl.appendChild(el("dt",null,"Length:")); dl.appendChild(el("dd",null,it.words + " words")); }
    dl.appendChild(el("dt",null,"Score:")); dl.appendChild(el("dd",null,String(it.score)));
    a.appendChild(dl);
    var ul = el("ul","flags");
    if(!(it.flags||[]).length) ul.appendChild(el("li","none","No flags"));
    (it.flags||[]).forEach(function(f){ ul.appendChild(el("li",null,"\u26A0 "+f)); });
    a.appendChild(ul);
    var ln = el("div","links");
    ln.appendChild(link(it.source_url, it.type === "video" ? "Watch the video first \u2197" : "Read the original \u2197"));
    if(it.image && it.image.page) ln.appendChild(link(it.image.page, "Photo source \u2197"));
    ln.appendChild(link(it.licence_url, "Licence \u2197"));
    a.appendChild(ln);
    if(it.licence_note) a.appendChild(el("p","why",it.licence_note));
    var pl = pipeLine(it, r);
    if(pl){ var p = el("p", pl.cls); if(pl.html) p.innerHTML = pl.html; else p.textContent = pl.text; a.appendChild(p); }
    if(r && r.decidedAt){
      var when = new Date(r.decidedAt).toLocaleString("en-AU",{dateStyle:"medium",timeStyle:"short"});
      a.appendChild(el("p","decision",(st==="approved"?"Approved ":"Rejected ")+when+(r.reason?" \u2014 "+r.reason:"")));
    }
    var acts = el("div","actions");
    if(st === "pending" && panel && panel.id === it.id){
      a.appendChild(panel.kind === "reject" ? rejectPanel(it) : videoPanel(it));
      return a;
    }
    if(st === "pending"){
      acts.appendChild(btn("\u2713 Approve","btn-approve",function(){
        if(it.type === "video"){ openPanel(it.id, "video"); return; }
        decide(it.id,"approved"); }));
      acts.appendChild(btn("\u2715 Reject","btn-primary",function(){ openPanel(it.id, "reject"); }));
    } else if(r && r.state === "unsent"){
      acts.appendChild(btn("\u21BB Retry","btn-approve",function(){ decide(it.id, st, r.reason); }));
    } else if(st === "rejected"){
      acts.appendChild(btn("\u21B6 Undo","btn-secondary",function(){ decide(it.id,"pending"); }));
    }
    a.appendChild(acts);
    return a;
  }

  // ---------- inline panels (no dialogs / confirm boxes) ----------
  function openPanel(id, kind){ panel = {id:id, kind:kind, pick:"", text:""}; render(); focusPanel(); }
  function closePanel(){ var id = panel && panel.id; panel = null; render();
    if(id){ var c = document.querySelector('.item[data-id="' + CSS.escape(id) + '"] .actions button'); if(c) c.focus(); } }
  function focusPanel(){ var f = document.querySelector(".inline-panel select, .inline-panel .btn"); if(f) f.focus(); }
  function onEsc(e){ if(e.key === "Escape"){ e.preventDefault(); closePanel(); } }
  function rejectPanel(it){
    var f = el("form","inline-panel reject-panel"); f.setAttribute("aria-label","Reject this item"); f.noValidate = true;
    f.appendChild(el("p","ip-title","Reject this item?"));
    var lid = "rp-" + it.id.replace(/[^\w-]/g,"");
    var lab = el("label",null,"Reason (optional)"); lab.htmlFor = lid + "-pick"; f.appendChild(lab);
    var sel = el("select","field"); sel.id = lid + "-pick";
    sel.appendChild(new Option("Choose a reason, or type below",""));
    REASONS.forEach(function(r){ sel.appendChild(new Option(r, r)); });
    sel.value = panel.pick; sel.addEventListener("change", function(){ panel.pick = sel.value; });
    f.appendChild(sel);
    var ta = el("textarea","field"); ta.rows = 3; ta.placeholder = "Add a note (optional)"; ta.setAttribute("aria-label","Note (optional)");
    ta.value = panel.text; ta.addEventListener("input", function(){ panel.text = ta.value; });
    f.appendChild(ta);
    var b = el("div","ip-btns");
    var ok = el("button","btn btn-primary btn-reject-confirm","\u2715 Reject"); ok.type = "submit";
    var no = el("button","btn btn-secondary","Cancel"); no.type = "button"; no.addEventListener("click", closePanel);
    b.appendChild(ok); b.appendChild(no); f.appendChild(b);
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var reason = [panel.pick, panel.text.trim()].filter(Boolean).join(": ");
      panel = null; decide(it.id, "rejected", reason);
    });
    f.addEventListener("keydown", onEsc);
    return f;
  }
  function videoPanel(it){
    var d = el("div","inline-panel confirm-strip video-confirm"); d.setAttribute("role","group"); d.setAttribute("aria-label","Approve this video?");
    d.appendChild(el("p","ip-title","Approve this video?"));
    d.appendChild(el("p","cs-text","Have you watched the whole video? It will be embedded on Rebella."));
    var b = el("div","ip-btns");
    b.appendChild(btn("\u2713 Yes, approve","btn-approve",function(){ panel = null; decide(it.id,"approved"); }));
    b.appendChild(btn("Cancel","btn-secondary",closePanel));
    d.appendChild(b); d.addEventListener("keydown", onEsc);
    return d;
  }

  function render(){
    if(!Q) return;
    if(panel && !ITEMS.some(function(it){ return it.id === panel.id && statusOf(it.id) === "pending"; })) panel = null;
    var keepFocus = panel && document.activeElement && document.activeElement.closest && document.activeElement.closest(".inline-panel");
    var VIS = ITEMS.filter(forAge), hid = ITEMS.length - VIS.length;
    var q = $("#queue"), counts = {pending:0,approved:0,rejected:0,all:VIS.length};
    VIS.forEach(function(it){ counts[statusOf(it.id)]++; });
    Object.keys(counts).forEach(function(k){ $("#c-"+k).textContent = counts[k]; });
    document.querySelectorAll(".tab").forEach(function(t){ t.setAttribute("aria-selected", t.dataset.filter===filter ? "true":"false"); });
    emitStatus(counts);
    $("#queue-meta").textContent = "Queue updated " + new Date(Q.updated*1000).toLocaleString("en-AU",{dateStyle:"medium",timeStyle:"short"}) + ". Highest score first. Showing age " + dialAge() + (hid ? " (" + hid + " for older readers hidden)." : ".");
    if(keepFocus){   // don't rebuild the cards while someone is typing in an open panel; just refresh the counts
      return;
    }
    q.textContent = "";
    var shown = VIS.filter(function(it){ return filter==="all" || statusOf(it.id)===filter; });
    shown.forEach(function(it){ q.appendChild(card(it)); });
    $("#empty").hidden = shown.length > 0;
  }

  document.querySelectorAll(".tab").forEach(function(t){
    t.addEventListener("click", function(){ filter = t.dataset.filter; render(); });
  });


  // ---------- boot (PREVIEW: open straight away with the sample queue) ----------
  document.body.classList.remove("locked");
  $("#lock").addEventListener("click", function(){
    var b = $("#lock"); b.textContent = "\uD83D\uDD12 Preview: Lock is off"; setTimeout(function(){ b.innerHTML = "&#128274; Lock"; }, 2400);
  });
  (async function(){
    var t0 = performance.now();
    try{
      var r = await fetch("data/sample-queue.json?t=" + Date.now(), {cache:"no-store", credentials:"omit"});
      Q = await r.json(); ITEMS = Q.items || []; linkMs = Math.round(performance.now() - t0);
    }catch(e){ Q = {updated:Date.now()/1000, items:[]}; ITEMS = []; linkState = "fail"; }
    render();
  })();
})();
