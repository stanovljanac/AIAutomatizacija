/* human-gate-one — GSAP timeline for 012 s09. Stream smear-stops → the gate lowers → the page is
 * READ (highlight walks lines, note lands, APPROVED) → the line restarts. Silent, deterministic.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ term? }
 */
var S = HF.scene({ id: "human-gate-one", width: 1920, height: 1080, frames: 480, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, W = S.W, D = S.D, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

if (props.term) document.getElementById("gtitle").textContent = String(props.term).toUpperCase();

// 3 sentence beats
var tStop = beatAt(0, 0.03);
var tRead = Math.max(beatAt(1, 0.3), tStop + 1.4);
var tRule = Math.max(beatAt(2, 0.68), tRead + 2.2);

var tl = gsap.timeline({ paused: true });

// pre-roll: chips are mid-flight, streaming fast (they enter already moving)
var chips = document.querySelectorAll(".schip");
var stopX = [0.62, 0.34, 0.5, 0.14, 0.26, 0.44]; // where each freezes (fractions of W)
for (var i = 0; i < chips.length; i++) {
  // fast stream toward the freeze point, arriving AT the stop beat with a skew smear
  tl.fromTo(chips[i],
    { x: (-0.25 - i * 0.12) * W, skewX: 0 },
    { x: stopX[i] * W, skewX: -14, duration: Math.max(0.6, tStop + 0.12), ease: "power1.in" }, 0);
  tl.to(chips[i], { skewX: 0, x: "+=" + 10 * U, duration: 0.3, ease: "back.out(3)" }, tStop + 0.14);
}

// beat 0 — THE HALT: everything snaps still; the great gate drops
tl.fromTo("#gatebig", { yPercent: -105 }, { yPercent: 0, duration: 0.55, ease: "power3.in" }, tStop + 0.2);
tl.from(".gb-bar", { scaleY: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }, tStop + 0.75);

// beat 1 — the page rises to the desk and gets READ: highlight walks the lines, a note lands
tl.fromTo("#page", { opacity: 0, y: 90 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tRead);
var readSpan = Math.max(1.4, tRule - tRead - 0.5);
tl.to("#hl", { opacity: 1, duration: 0.25, ease: "power1.out" }, tRead + 0.5);
tl.to("#hl", { y: 60 * U, duration: readSpan * 0.35, ease: "steps(2)" }, tRead + 0.75);
tl.to("#hl", { y: 130 * U, duration: readSpan * 0.35, ease: "steps(2)" }, tRead + 0.75 + readSpan * 0.4);
tl.fromTo("#note", { opacity: 0, x: -20 * U }, { opacity: 1, x: 0, duration: 0.35, ease: "back.out(1.8)" }, tRead + 0.9);

// beat 2 — APPROVED slams; the gate lifts; the line RESTARTS
tl.to("#hl", { opacity: 0, duration: 0.25 }, tRule - 0.1);
tl.to("#approve", { opacity: 1, scale: 1, duration: 0.3, ease: "power4.in" }, tRule);
tl.to("#page", { y: 6 * U, duration: 0.1, ease: "power1.inOut" }, tRule + 0.28);
tl.to("#page", { y: 0, duration: 0.2, ease: "power1.out" }, tRule + 0.38);
tl.to(".gb-bar", { scaleY: 0.12, duration: 0.5, stagger: 0.05, ease: "power2.inOut" }, tRule + 0.7);
for (var j = 0; j < chips.length; j++) {
  tl.to(chips[j], { x: "+=" + 0.6 * W, skewX: -8, duration: Math.max(0.8, D - tRule - 1.0), ease: "power1.in" }, tRule + 0.9);
}
tl.to("#page", { x: 0.35 * W, opacity: 0, duration: Math.max(0.6, (D - tRule - 1.0) * 0.7), ease: "power1.in" }, tRule + 1.05);

HF.register("human-gate-one", tl);
