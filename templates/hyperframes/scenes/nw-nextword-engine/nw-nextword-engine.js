/* nw-nextword-engine — GSAP timeline for 019 s2 (CORRECTION BEAT + MECHANISM). The motif tag
 * lands; the WRONG "look it up" model gets a gray ✕; then the REAL machine assembles — partial
 * sentence + caret and a fan of DEMO probability bars, the top bar snapping "boils" into the
 * sentence. Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "nw-nextword-engine", width: 1080, height: 1920, frames: 206, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt;

// sentence beats: [0] "Here's what's really happening" (motif) [1] "isn't looking anything up"
// (database ✕) [2] "guessing the next word, one at a time" (bars + snap)
var t0 = beatAt(0, 0.05);
var t1 = Math.max(beatAt(1, 0.28), t0 + 1.0);
var t2 = Math.max(beatAt(2, 0.6), t1 + 1.4);

// ── resting state ──
gsap.set("#motif", { opacity: 0, y: -20 * U });
gsap.set("#wrong", { opacity: 0, y: 16 * U });
gsap.set("#wx", { opacity: 0, scale: 1.8 });
gsap.set("#engine", { opacity: 0, y: 24 * U });
gsap.set("#bar0", { opacity: 0, x: -30 * U });
gsap.set("#bar1", { opacity: 0, x: -30 * U });
gsap.set("#bar2", { opacity: 0, x: -30 * U });
gsap.set("#slotword", { opacity: 0, y: -18 * U, scale: 1.3 });
gsap.set("#caret2", { opacity: 0 });
gsap.set("#onelabel", { opacity: 0 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the correction motif tag lands ──
tl.to("#motif", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0);

// ── beat 1 — the WRONG "look it up" model gets a gray ✕ ──
tl.to("#wrong", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t1);
tl.to("#wx", { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2)" }, t1 + 0.45);
tl.to(".wchip", { filter: "grayscale(0.5) brightness(0.7)", duration: 0.4 }, t1 + 0.5);

// ── beat 2 — the WRONG model recedes; the REAL machine assembles ──
tl.to("#wrong", { opacity: 0.16, scale: 0.86, y: -18 * U, duration: 0.5, ease: "power2.inOut" }, t2);
tl.to("#engine", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t2 + 0.1);
tl.to("#caret2", { opacity: 1, duration: 0.15 }, t2 + 0.35);
// the candidate bars fan in (top first)
tl.to("#bar0", { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, t2 + 0.4);
tl.to("#bar1", { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, t2 + 0.58);
tl.to("#bar2", { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, t2 + 0.76);
// the top bar pulses, then "boils" snaps up into the sentence slot
tl.to("#bar0", { boxShadow: "0 0 " + (36 * U) + "px rgba(255,176,32,0.6)", duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, t2 + 1.05);
tl.to("#caret2", { opacity: 0, duration: 0.15 }, t2 + 1.25);
tl.to("#slotword", { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "back.out(2.2)" }, t2 + 1.3);
tl.to("#onelabel", { opacity: 1, duration: 0.4, ease: "power2.out" }, t2 + 1.5);

HF.register("nw-nextword-engine", tl);
