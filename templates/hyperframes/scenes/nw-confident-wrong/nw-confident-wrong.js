/* nw-confident-wrong — GSAP timeline for 019 s1 (PROBLEM HOOK HERO). A wrong chat answer types
 * out while the CONFIDENCE meter pins to 100% and never flinches; the myth "sounds sure = it
 * checked" rises; then it is struck through and the anchor "100% SURE. 100% WRONG." slams in.
 * Deterministic, seek-driven; flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "nw-confident-wrong", width: 1080, height: 1920, frames: 242, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, cl = S.cl;

// sentence beats: [0] "ChatGPT gets things wrong — and never sounds unsure" (answer types + meter pins)
// [1] "We read that confidence as proof it knows" (myth rises) [2] "It doesn't" (strike + anchor slam)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.52), t0 + 3.0);
var t2 = Math.max(beatAt(2, 0.88), t1 + 1.4);

// ── resting state ──
gsap.set("#chat", { opacity: 0, y: -30 * U });
gsap.set("#correction", { opacity: 0, scale: 1.6, y: -10 * U });
gsap.set("#caret", { opacity: 0 });
gsap.set("#meter", { opacity: 0, y: 30 * U });
gsap.set("#myth", { opacity: 0, y: 26 * U });
gsap.set("#mstrike", { scaleX: 0 });
gsap.set("#anchor", { opacity: 0, scale: 1.5 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the answer types out; the meter fills and PINS to 100% ──
tl.to("#chat", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0);
tl.to("#caret", { opacity: 1, duration: 0.15 }, t0 + 0.3);
// typewriter reveal (clip-path L→R) + caret rides the edge
tl.fromTo("#reveal", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.7, ease: "steps(28)" }, t0 + 0.35);
tl.fromTo("#caret", { x: 0 }, { x: 470 * U, duration: 1.7, ease: "steps(28)" }, t0 + 0.35);
tl.to("#caret", { opacity: 0, duration: 0.2 }, t0 + 2.15);
// the meter fills to 100% and holds glued there (count the value up via a proxy)
tl.to("#meter", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0 + 0.5);
tl.fromTo("#mfill", { width: "0%" }, { width: "100%", duration: 1.1, ease: "power2.out" }, t0 + 0.7);
var mCount = { v: 0 };
tl.to(mCount, { v: 100, duration: 1.1, ease: "power2.out", onUpdate: function () { document.getElementById("mval").textContent = Math.round(mCount.v) + "%"; } }, t0 + 0.7);
// the correction stamp punches in — it is WRONG
tl.to("#correction", { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(2.2)" }, t0 + 2.2);
tl.to("#correction", { rotation: -3, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, t0 + 2.6);

// ── beat 1 — the myth rises; the meter does NOT move ──
tl.to("#myth", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t1);
// a deliberate, tiny non-flinch on the meter (pulse the glow, value stays 100%)
tl.to("#mval", { textShadow: "0 0 " + (40 * U) + "px rgba(255,176,32,0.9)", duration: 0.6, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1 + 0.2);

// ── beat 2 — strike the myth, clear the stage, SLAM the anchor onto a clean frame ──
tl.to("#mstrike", { scaleX: 1, duration: 0.26, ease: "power3.inOut" }, t2);
// clear everything else out so the anchor owns the frame (no overlap clutter)
tl.to("#chat", { opacity: 0.06, y: -24 * U, duration: 0.35, ease: "power2.in" }, t2 + 0.22);
tl.to("#meter", { opacity: 0.06, y: 24 * U, duration: 0.35, ease: "power2.in" }, t2 + 0.22);
tl.to("#myth", { opacity: 0.06, scale: 0.94, duration: 0.35, ease: "power2.in" }, t2 + 0.3);
// the anchor slams from oversize → 1 with a hard settle, centered on the cleared stage
tl.to("#anchor", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(1.7)" }, t2 + 0.28);
tl.to("#anchor", { scale: 1.02, duration: 0.55, yoyo: true, repeat: 1, ease: "sine.inOut" }, t2 + 0.62);

HF.register("nw-confident-wrong", tl);
