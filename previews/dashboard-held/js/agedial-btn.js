// PREVIEW ONLY (Danny 11:07 AWST 24 Oct 2026): age dial folds into a family button (css/agedial-btn.css).
// Press the family: the box extends across from the right into the full age dial. Press again, Esc, or tap outside: it folds back.
// Animation PHI^-1 = 0.618 s with the kids' ease (phi rule 1); reduced motion = instant. js/agedial.js is untouched.
(function(){
  var box = document.getElementById("agedial"), btn = document.getElementById("ad-fam");
  if(!box || !btn) return;
  var pin = box.closest(".ad-pin"), mast = document.querySelector("#dash-head .masthead"), root = document.documentElement;
  var svg = document.getElementById("ad-family"), parts = box.querySelectorAll(".ad-row,.ad-note");
  var DUR = 618, EASE = "cubic-bezier(.2,.8,.2,1)", busy = [], open = false;
  function still(){ return !box.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function mh(){ if(mast) root.style.setProperty("--ad-mh", mast.getBoundingClientRect().height.toFixed(1) + "px"); }
  mh(); window.addEventListener("resize", mh); if(window.ResizeObserver && mast) new ResizeObserver(mh).observe(mast);
  function label(){ var a = box.getAttribute("data-age") || ""; btn.setAttribute("aria-label", "Age dial, age " + a + (open ? ", hide" : ", show")); }
  document.addEventListener("rebella:age", label); label();
  function setState(o){ // o = expanded
    pin.classList.toggle("is-collapsed", !o); box.classList.toggle("is-collapsed", !o); }
  function geo(){ var r = box.getBoundingClientRect(), s = svg.getBoundingClientRect(); return {r:r, s:s, h:pin.getBoundingClientRect().height}; }
  function stop(){ busy.forEach(function(a){ try{ a.cancel(); }catch(e){} }); busy = []; }
  function run(from, to, toOpen, done){
    // from/to geometry: the box is laid out EXPANDED during the whole animation; clip + translate fake the button end
    var big = toOpen ? to : from, small = toOpen ? from : to;
    var clipSmall = "inset(0px 0px " + Math.max(0, big.r.height - small.r.height).toFixed(1) + "px " + Math.max(0, big.r.width - small.r.width).toFixed(1) + "px round 8px)";
    var shift = "translate(0px," + (small.r.top - big.r.top).toFixed(1) + "px)";
    var sv = (small.s.width / big.s.width).toFixed(4);
    var kBox = [{clipPath:clipSmall, transform:shift}, {clipPath:"inset(0px 0px 0px 0px round 8px)", transform:"translate(0px,0px)"}];
    var kPin = [{height:"0px"}, {height:big.h.toFixed(1) + "px"}];
    var kSvg = [{transform:"translate(" + ((small.s.right - small.r.right) - (big.s.right - big.r.right)).toFixed(1) + "px," + ((small.s.top - small.r.top) - (big.s.top - big.r.top)).toFixed(1) + "px) scale(" + sv + ")", transformOrigin:"100% 0"}, {transform:"none", transformOrigin:"100% 0"}];
    var kIn = [{opacity:0}, {opacity:1}];
    if(!toOpen){ kBox.reverse(); kPin.reverse(); kSvg.reverse(); kIn.reverse(); }
    var o = {duration:DUR, easing:EASE, fill:"forwards"};
    busy = [box.animate(kBox, o), pin.animate(kPin, o), svg.animate(kSvg, o)];
    parts.forEach(function(p){ busy.push(p.animate(kIn, o)); });
    busy[0].onfinish = function(){ done(); stop(); };
  }
  function toggle(o){
    if(o === open) return; stop(); open = o; btn.setAttribute("aria-expanded", o ? "true" : "false"); label();
    if(still()){ setState(o); return; }
    var a = geo(); setState(true); var b = geo();                    // a = collapsed, b = expanded
    if(o){ setState(true); run(a, b, true, function(){}); }
    else { setState(false); b = geo(); setState(true); run(a, b, false, function(){ setState(false); }); }   // fold while still laid out expanded
  }
  btn.addEventListener("click", function(){ toggle(!open); });
  document.addEventListener("keydown", function(e){ if(open && (e.key === "Escape" || e.key === "Esc")){ var inside = box.contains(document.activeElement); toggle(false); if(inside) btn.focus(); } });
  document.addEventListener("pointerdown", function(e){ if(open && !box.contains(e.target)) toggle(false); }, true);
})();
