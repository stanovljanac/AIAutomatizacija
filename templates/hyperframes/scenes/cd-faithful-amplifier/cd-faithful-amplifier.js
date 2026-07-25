/* cd-faithful-amplifier — GSAP timeline for 020 s3 (THE REFRAME, the money shot). One bad row (carried
 * from s2) drops into a faithful machine and comes out multiplied — 1 → 10 → 100 identical bad cells,
 * calmly stamped APPROVED, with no red error anywhere. Then "Faithful ≠ correct" lands, held for the
 * screenshot. Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cd-faithful-amplifier", width: 1080, height: 1920, frames: 332, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, props = S.props;

// sentence beats: [0] "The AI wasn't wrong." (row alone + machine in) [1] "It was faithful." (nod-pulse)
// [2] "It did exactly what I asked, on data that lied to it." (row drops into the machine)
// [3] "Bad input doesn't stop the AI." (amplify 1→10→100) [4] "It scales it — and stamps it approved."
// (APPROVED stamp, then collapse → "Faithful ≠ correct")
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.11), t0 + 1.0);
var t2 = Math.max(beatAt(2, 0.23), t1 + 0.9);
var t3 = Math.max(beatAt(3, 0.48), t2 + 1.8);
var t4 = Math.max(beatAt(4, 0.73), t3 + 2.0);

var BADCELL = (props.badCell || "L.A.") + "  →  1,240";

// pre-build the amplified grid deterministically (no Math.random): 100 identical bad cells
var stack = document.getElementById("stack");
var CELLS = [];
for (var i = 0; i < 100; i++) {
  var el = document.createElement("div");
  el.className = "cell";
  el.textContent = BADCELL;
  el.style.fontSize = (26 * U) + "px";
  stack.appendChild(el);
  CELLS.push(el);
}

// ── resting state ──
gsap.set("#badrow", { opacity: 1, y: 0, scale: 1 });
gsap.set("#machine", { opacity: 0, y: 30 * U });
gsap.set("#stack", { opacity: 0 });
gsap.set(CELLS, { opacity: 0, scale: 0.6 });
gsap.set("#approved", { opacity: 0, scale: 1.6, rotation: -8 });
gsap.set("#reframe", { opacity: 0 });
gsap.set("#neq", { opacity: 0, scale: 2 });
gsap.set(["#wFaithful", "#wCorrect"], { opacity: 0, y: 20 * U });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);
// the gear turns slowly the whole time — the machine is always dutifully working
tl.to("#mgear", { rotation: 360, duration: D, ease: "none" }, 0);

// ── beat 0 — the bad row sits alone; the machine fades in below it ──
tl.to("#machine", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 0.3);

// ── beat 1 — the machine gives one small obedient NOD-pulse ──
tl.to("#machine", { y: 10 * U, duration: 0.16, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1);
tl.to(".mbody", { borderColor: "rgba(255,176,32,0.85)", duration: 0.24, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1);

// ── beat 2 — the bad row drops DOWN into the machine (through the top port below it) ──
tl.to("#badrow", { y: 30 * U, duration: 0.2, ease: "power1.in" }, t2);
tl.to("#badrow", { y: 210 * U, scale: 0.5, opacity: 0, duration: 0.5, ease: "power2.in" }, t2 + 0.2);
tl.to("#mportIn", { opacity: 0.6, scaleX: 1.6, duration: 0.2, yoyo: true, repeat: 1 }, t2 + 0.42);

// ── beat 3 — it comes out the other side SCALED UP: 1 → 10 → 100 ──
tl.to("#mportOut", { opacity: 0.8, scaleX: 1.8, duration: 0.22, yoyo: true, repeat: 1 }, t3);
tl.to("#stack", { opacity: 1, duration: 0.2 }, t3 + 0.06);
// the machine recedes so the flood owns the frame
tl.to("#machine", { opacity: 0.12, scale: 0.9, duration: 0.4, ease: "power2.in" }, t3 + 0.1);
// first ONE cell, then a burst of ten, then the full hundred flood in — the amplification felt
tl.to(CELLS[0], { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2)" }, t3 + 0.1);
tl.to(CELLS.slice(1, 10), { opacity: 1, scale: 1, duration: 0.3, stagger: 0.02, ease: "back.out(1.6)" }, t3 + 0.34);
tl.to(CELLS.slice(10), { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.006, from: "center" }, ease: "power2.out" }, t3 + 0.66);

// ── beat 4 — the calm APPROVED stamp, then collapse → the reframe ──
tl.to("#approved", { opacity: 1, scale: 1, rotation: -8, duration: 0.32, ease: "back.out(1.8)" }, t4);
tl.to("#approved", { scale: 1.04, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, t4 + 0.34);
// hold the horror for a beat, then everything collapses into the reframe
tl.to(["#stack", "#approved", "#machine"], { opacity: 0, duration: 0.4, ease: "power2.in" }, t4 + 1.15);
tl.to("#reframe", { opacity: 1, duration: 0.2 }, t4 + 1.45);
tl.to("#wFaithful", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t4 + 1.5);
tl.to("#wCorrect", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t4 + 1.66);
// the gold ≠ SNAPS between them — the whole point, held to the end (screenshotable)
tl.to("#neq", { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, t4 + 1.84);
tl.to("#neq", { scale: 1.08, duration: 0.6, yoyo: true, repeat: 1, ease: "sine.inOut" }, t4 + 2.16);

HF.register("cd-faithful-amplifier", tl);
