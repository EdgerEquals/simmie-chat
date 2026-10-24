// Bonnie's Dashboard: age dial line + family silhouette.
// Reads the public age dial value (it holds only the number) from the simmie-chat site, same github.io origin.
// The page already shows 13 (mirrored at build time), so if the fetch fails nothing changes.
// Danny 24 Oct 2026 02:54 AWST: Bonnie changes the age on the spot with the - / + buttons (no approval step). One step per press,
// clamped 10-16; the kids animate to their CDC size (the same .618s transition in css/agedial.css), her choice is kept for this
// tab (sessionStorage) and announced as "rebella:age" so the queue (js/app.js) and the fun facts (js/hud.js) follow it at once,
// and js/app.js sends it to Simmie as an encrypted "age-dial-change" on the dashboard's existing decision relay. No pop-ups.
(function(){
  var box = document.getElementById("agedial"); if(!box) return;
  var out = document.getElementById("ad-age"), kb = document.getElementById("ad-kid-b"), kg = document.getElementById("ad-kid-g");
  var dn = document.getElementById("ad-dn"), up = document.getElementById("ad-up"), SK = "rebella-mod-age";
  // CDC 2000 stature-for-age 50th percentile (cm) at exact birthdays; dad = male median at 20.
  var DAD = 176.85, HB = {10:138.62,11:143.52,12:149.05,13:156.09,14:163.84,15:169.94,16:173.51}, HG = {10:137.99,11:143.98,12:151.19,13:157.15,14:160.39,15:161.86,16:162.55};
  var cur = null;
  function show(v, why){
    v = Math.round(+v); if(!(v >= 10 && v <= 16)) return;
    var from = cur; cur = v;
    out.textContent = String(v); box.setAttribute("data-age", String(v));
    if(kb) kb.style.transform = "scale(" + (HB[v] / DAD).toFixed(4) + ")";
    if(kg) kg.style.transform = "scale(" + (HG[v] / DAD).toFixed(4) + ")";
    if(dn) dn.disabled = v <= 10; if(up) up.disabled = v >= 16;
    if(from !== v) try{ document.dispatchEvent(new CustomEvent("rebella:age", {detail:{age:v, from:from, source:why || "page"}})); }catch(e){}
  }
  function picked(){ try{ var s = parseInt(sessionStorage.getItem(SK), 10); return s >= 10 && s <= 16 ? s : null; }catch(e){ return null; } }
  show(picked() || box.getAttribute("data-age"), picked() ? "session" : "page");
  function step(d){
    var v = Math.max(10, Math.min(16, cur + d)); if(v === cur) return;
    try{ sessionStorage.setItem(SK, String(v)); }catch(e){}
    show(v, "bonnie");
    try{ if(window.BonnieSound && window.BonnieSound.cue) window.BonnieSound.cue("dial-click", (v - 10) / 6); }catch(e){}
  }
  if(dn) dn.addEventListener("click", function(){ step(-1); });
  if(up) up.addEventListener("click", function(){ step(1); });
  try{
    fetch("https://edgerequals.github.io/simmie-chat/age-dial.json?t=" + Date.now(), {cache:"no-store", credentials:"omit"})
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(j){ if(j && typeof j.age === "number" && !picked()) show(j.age, "age-dial.json"); })   // Bonnie's own pick wins this tab
      .catch(function(){});
  }catch(e){}
  window.RebellaAgeDial = { age: function(){ return cur; } };
})();
