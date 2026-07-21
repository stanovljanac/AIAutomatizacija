/* nw-ab-contrast — GSAP timeline for 019 s3 THE MONEY SHOT. One CONFIDENCE meter pinned 100% the
 * whole beat; the SAME word-by-word engine builds a TRUE answer (left, green ✓) and an INVENTED one
 * (right, red ✗) at identical cadence; a bracket ties both to the one meter; a gold underline
 * "measures fluency, not truth" seeds s4. Deterministic, seek-driven; flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "nw-ab-contrast", width: 1080, height: 1920, frames: 546, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, cl = S.cl;

// sentence beats: [0] "build two answers the same way" (setup) [1] "ask an easy one — correct" (left)
// [2] "ask something it never learned — invented" (right) [3] "same engine, same confidence" (bracket)
// [4] "nothing inside can tell them apart" (underline; hold)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.15), t0 + 1.2);
var t2 = Math.max(beatAt(2, 0.35), t1 + 2.4);
var t3 = Math.max(beatAt(3, 0.62), t2 + 3.2);
var t4 = Math.max(beatAt(4, 0.75), t3 + 1.6);

// ── resting state ──
gsap.set("#meter", { opacity: 0, y: -24 * U });
gsap.set(["#colL", "#colR"], { opacity: 0, y: 30 * U });
gsap.set(".ans .w", { opacity: 0, y: 14 * U });
gsap.set(["#caretL", "#caretR"], { opacity: 0 });
gsap.set(["#vL", "#vR"], { opacity: 0, scale: 1.4 });
gsap.set("#sameengine", { opacity: 0, y: 10 * U });
gsap.set("#munder", { opacity: 0 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the meter (100%) and the two empty columns take the stage ──
tl.to("#meter", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0);
tl.to("#colL", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0 + 0.3);
tl.to("#colR", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0 + 0.45);

// ── beat 1 — the LEFT answer builds word by word → green ✓ ──
tl.to("#caretL", { opacity: 1, duration: 0.15 }, t1);
tl.to("#ansL .w", { opacity: 1, y: 0, duration: 0.3, stagger: 0.42, ease: "power2.out" }, t1 + 0.1);
tl.to("#caretL", { opacity: 0, duration: 0.2 }, t1 + 1.9);
tl.to("#vL", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, t1 + 2.0);

// ── beat 2 — the RIGHT answer builds the SAME way → red ✗ (invented) ──
tl.to("#caretR", { opacity: 1, duration: 0.15 }, t2);
tl.to("#ansR .w", { opacity: 1, y: 0, duration: 0.3, stagger: 0.4, ease: "power2.out" }, t2 + 0.1);
tl.to("#caretR", { opacity: 0, duration: 0.2 }, t2 + 2.5);
tl.to("#vR", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, t2 + 2.6);

// ── beat 3 — the bracket ties BOTH sides to the one meter; the meter never moves ──
tl.to("#bpath", { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, t3);
tl.to("#bstem", { strokeDashoffset: 0, duration: 0.35, ease: "power2.inOut" }, t3 + 0.5);
tl.to("#sameengine", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t3 + 0.4);
// the meter glow pulses to say "still pinned" — the value stays 100%
tl.to(".mval", { textShadow: "0 0 " + (44 * U) + "px rgba(255,176,32,0.9)", duration: 0.6, yoyo: true, repeat: 1, ease: "sine.inOut" }, t3 + 0.5);

// ── beat 4 — the gold underline lands; the complete frame HOLDS (screenshot beat) ──
tl.to("#munder", { opacity: 1, duration: 0.5, ease: "power2.out" }, t4);
tl.fromTo("#munder", { letterSpacing: "6px" }, { letterSpacing: "0.5px", duration: 0.6, ease: "power2.out" }, t4);
// slow push-in while it holds
tl.to("#camera", { scale: 1.04, duration: cl(D - t4, 2.5, 5), ease: "power1.inOut", transformOrigin: "50% 40%" }, t4);

HF.register("nw-ab-contrast", tl);
