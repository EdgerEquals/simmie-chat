/* PREVIEW ONLY (simmie-chat/previews): Ask Dad paper airplane on a tilted 3D orbit.
   - Path: ellipse rx = R + 9 (R = half the button width; R + 8 on the chat key), ry = 0.32 rx, tilted -18deg (flatter on the wide chat key).
   - Depth: far half (top of the ellipse) sits BEHIND the button (z swap at the two end points, where the path is outside the
     button), dimmed and a touch blurred; near half sits IN FRONT with a soft shadow. Scale 0.78 far -> 1.0 near, opacity 0.55 -> 1.
   - Heading from the ellipse derivative each frame (nose leads); gentle bank +-12deg (skew) plus a foreshortening squash.
   - Faint contrail of 4 fading dots on the near half only.
   - Timing: phase is read from the existing .ad-orbit CSS animation (phi-timing.js: Ask Dad satellite, Simmie ladder
     PHI^2.5 = 3.33 s, golden-angle start, weather sweep at cycle boundaries), so the phi clock is unchanged.
     The button's own 5.39 s breathing and glow are never touched.
   - One rAF loop, transforms + opacity only; reads two rects per frame, then writes (no read/write interleaving).
   - prefers-reduced-motion: a static plane in front, up and right of the button, pointing up-right.
   No network, no storage. */
(function(){
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var PLANE = '<svg viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">' +
    '<polygon points="7,0 -6,-6 -3.2,0" fill="#D6ECEF" stroke="#24292E" stroke-width="1" stroke-linejoin="round"/>' +   // far wing
    '<polygon points="7,0 -3.2,0 -6,6.2" fill="#F6EBD9" stroke="#24292E" stroke-width="1" stroke-linejoin="round"/>' +   // top (near) wing
    '<polygon points="7,0 -3.2,0 -4.6,2.2" fill="#0A3F4C" stroke="#24292E" stroke-width=".6" stroke-linejoin="round"/>' + // keel / fold
    '</svg>';
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
  var DOTS = 4, D2R = Math.PI / 180;
  var items = [];

  function attach(btn){
    if(btn.__adp) return; btn.__adp = true;
    var wrap = document.createElement("span"); wrap.className = "adp far"; wrap.setAttribute("aria-hidden", "true");
    var p = document.createElement("span"); p.className = "adp-p"; p.innerHTML = PLANE;
    var dots = []; for(var i = 0; i < DOTS; i++){ var d = document.createElement("i"); d.className = "adp-dot"; wrap.appendChild(d); dots.push(d); }
    wrap.appendChild(p);
    btn.parentNode.insertBefore(wrap, btn);
    var it = {btn:btn, wrap:wrap, p:p, dots:dots, fixed:false, zBack:1, zFront:3, near:null, orbit:btn.querySelector(".ad-orbit"), n:0, vis:true, small:null};
    items.push(it);
    document.documentElement.classList.add("adp-on");
  }

  function phase(it){
    // 0..1 from the existing CSS orbit animation (keeps the phi period, golden-angle start and the weather sweep)
    try{
      var a = it.orbit && it.orbit.getAnimations ? it.orbit.getAnimations() : [];
      if(a.length){ var t = a[0].currentTime, dur = a[0].effect.getComputedTiming().duration;
        if(t != null && dur > 0) return ((t % dur) + dur) % dur / dur; }
    }catch(e){}
    return null;
  }

  function frame(){
    for(var i = 0; i < items.length; i++){
      var it = items[i];
      if(!it.btn.isConnected){ continue; }
      if((it.n++ % 20) === 0) restyle(it);   // position / z-index / visibility can change (unlock, drag, CSS load): re-read now and then
      if(!it.vis){ it.wrap.style.opacity = "0"; continue; }
      // reads
      var b = it.btn.getBoundingClientRect(), o = {left:0, top:0};
      if(!it.fixed){ var op = it.wrap.offsetParent; if(op){ var r = op.getBoundingClientRect(); o = {left:r.left - op.scrollLeft + op.clientLeft, top:r.top - op.scrollTop + op.clientTop}; } }
      var cx = b.left + b.width / 2 - o.left, cy = b.top + b.height / 2 - o.top;
      var R = it.btn.offsetWidth / 2, H = it.btn.offsetHeight / 2;
      var rx = R + (it.small ? 8 : 9), ry = it.small ? Math.min(0.32 * rx, H + 5) : 0.32 * rx, tilt = (it.small ? -6 : -18) * D2R;
      var ph = RM.matches ? null : phase(it);
      // writes
      it.wrap.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px)";
      it.wrap.style.opacity = "";
      if(ph == null){   // reduced motion (or no clock): static, in front, up and right, pointing up-right
        setNear(it, true);
        var sx = it.small ? rx - 2 : R + 6, sy = it.small ? -H - 3 : -R * 0.45;
        it.p.style.transform = "translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px) rotate(-40deg)";
        it.p.style.opacity = "1";
        for(var k = 0; k < DOTS; k++) it.dots[k].style.opacity = "0";
        continue;
      }
      var th = ph * 2 * Math.PI;   // screen y is down, so sin(th) > 0 is the lower (near) half
      var pos = pt(th, rx, ry, tilt);
      var dx = -rx * Math.sin(th), dy = ry * Math.cos(th);   // derivative, then tilt
      var hx = dx * Math.cos(tilt) - dy * Math.sin(tilt), hy = dx * Math.sin(tilt) + dy * Math.cos(tilt);
      var head = Math.atan2(hy, hx) / D2R;
      var depth = (1 + Math.sin(th)) / 2;                 // 0 far .. 1 near
      var sc = 0.78 + 0.22 * depth, op1 = 0.55 + 0.45 * depth;
      var bank = 12 * Math.sin(th);                       // +-12deg, flips between the back and front passes
      var squash = 0.82 + 0.18 * Math.abs(Math.sin(th));  // foreshortened at the turn points
      setNear(it, Math.sin(th) > 0);
      it.p.style.transform = "translate(" + pos[0].toFixed(2) + "px," + pos[1].toFixed(2) + "px) rotate(" + head.toFixed(1) + "deg) skewX(" + bank.toFixed(1) + "deg) scale(" + sc.toFixed(3) + "," + (sc * squash).toFixed(3) + ")";
      it.p.style.opacity = op1.toFixed(3);
      for(var j = 0; j < DOTS; j++){
        var tj = th - (j + 1) * 0.2, sj = Math.sin(tj), dp = sj > 0 && Math.sin(th) > 0 ? (0.5 - j * 0.11) * ((1 + sj) / 2) : 0;
        var pj = pt(tj, rx, ry, tilt);
        it.dots[j].style.transform = "translate(" + pj[0].toFixed(2) + "px," + pj[1].toFixed(2) + "px) scale(" + (1 - j * 0.15).toFixed(2) + ")";
        it.dots[j].style.opacity = dp.toFixed(3);
      }
    }
    requestAnimationFrame(frame);
  }
  function restyle(it){
    var cs = getComputedStyle(it.btn), fixed = cs.position === "fixed", z = parseInt(cs.zIndex, 10); if(isNaN(z)) z = 2;
    var small = it.btn.offsetHeight > 0 && it.btn.offsetHeight < 30;   // chat key (17px tall) vs the 43px dashboard circle
    if(small !== it.small){ it.small = small; it.p.style.setProperty("--adp-s", small ? "12px" : "15px"); }
    it.vis = cs.visibility !== "hidden" && (fixed || it.btn.offsetParent !== null);
    if(fixed !== it.fixed){ it.fixed = fixed; it.wrap.classList.toggle("is-fixed", fixed); }
    if(z - 1 !== it.zBack){ it.zBack = z - 1; it.zFront = z + 1; it.near = null; }
  }
  function pt(th, rx, ry, tilt){ var x = rx * Math.cos(th), y = ry * Math.sin(th);
    return [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]; }
  function setNear(it, near){
    if(it.near === near) return; it.near = near;
    it.wrap.classList.toggle("near", near); it.wrap.classList.toggle("far", !near);
    it.wrap.style.zIndex = String(near ? it.zFront : it.zBack);
  }

  function scan(){ var bs = document.querySelectorAll("#ask-dad, .ad-key"); for(var i = 0; i < bs.length; i++) if(bs[i].querySelector(".ad-orbit")) attach(bs[i]); }
  function start(){
    scan();
    if(window.MutationObserver){ var mo = new MutationObserver(function(){ scan(); }); mo.observe(document.body, {childList:true, subtree:true}); }
    requestAnimationFrame(frame);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
