/* tk-meaning-vs-input — GSAP timeline for 021 s11 (MONEY BEAT #2, THE LOCK). The top rail never
 * moves; the bottom rail cycles the three shapes s9/s10 built. One rail frozen, one rail thrashing —
 * that contrast is the whole visual, and the last frame is meant to be screenshotted.
 * Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "tk-meaning-vs-input", width: 1920, height: 1080, frames: 103, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

var SHAPES = Array.isArray(props.shapes) && props.shapes.length
  ? props.shapes
  : [["st", "raw", "berry"], ["strawberry"], ["ST", "RAW", "B", "ERRY"]];

document.getElementById("meantlabel").textContent = props.meantLabel || "what you meant";
document.getElementById("arrivedlabel").textContent = props.arrivedLabel || "what arrived";
document.getElementById("meant").textContent = props.word || "strawberry";
document.getElementById("caption").textContent = props.caption || "";

var host = document.getElementById("shapes");
var shapeEls = SHAPES.map(function (parts) {
  var d = document.createElement("div");
  d.className = "shape" + (parts.length === 1 ? " single" : "");
  parts.forEach(function (t) {
    var s = document.createElement("span"); s.className = "cap"; s.textContent = t; d.appendChild(s);
  });
  host.appendChild(d);
  return d;
});

// sentence beats: [0] "Your meaning didn't move an inch." [1] "What arrived changed completely."
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.57), t0 + 1.2);

gsap.set(shapeEls, { opacity: 0, scale: 0.94 });
gsap.set("#caption", { opacity: 0, y: 14 * U });

var tl = gsap.timeline({ paused: true });
tl.to("#glow", { opacity: 1, scale: 1.04, duration: D, ease: "sine.inOut" }, 0);

// OPENING FRAME already shows the first shape — the cut lands on the beat, with no runway (D-060)
gsap.set(shapeEls[0], { opacity: 1, scale: 1 });

// the bottom rail thrashes: each shape replaces the last, hard, in the same position
var step = Math.max((t1 - t0) / 2, 0.55);
shapeEls.forEach(function (el, i) {
  if (i === 0) return;
  var at = t0 + i * step;
  tl.to(shapeEls[i - 1], { opacity: 0, scale: 0.94, duration: 0.14, ease: "power2.in" }, at);
  tl.to(el, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.2)" }, at + 0.08);
});
// the top rail is DEAD STILL the whole time — the only motion on it is that it never moves
tl.to("#railtop", { borderColor: "rgba(255,176,32,0.35)", duration: 0.5, ease: "sine.out" }, t0 + 0.2);

tl.to("#caption", { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, t1 + 0.1);
// hold both rails, still, to the cut
tl.fromTo("#root", { scale: 1 }, { scale: 1.015, duration: Math.max(D - t1, 0.6), ease: "sine.out" }, t1);

HF.register("tk-meaning-vs-input", tl);
