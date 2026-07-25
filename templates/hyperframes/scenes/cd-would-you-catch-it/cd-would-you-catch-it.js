/* cd-would-you-catch-it — GSAP timeline for 020 s5 (CTA MONOLITH). "Unsexy — that's the point." lands;
 * "CAN AI BUILD IT?" is struck through and 3D Y-FLIPS to "WOULD YOU CATCH IT WHEN IT'S WRONG?", held
 * with a blinking caret; the brand row rises in reserved space below. Slow push-in throughout — never
 * a static title-card hold. Deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "cd-would-you-catch-it", width: 1080, height: 1920, frames: 386, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt;

// sentence beats: [0] "Fixing your data first is unsexy — that's the point." (lane line lands)
// [1] "So don't ask if AI can build it." (CAN AI BUILD IT? assembles + struck)
// [2] "Ask if you'd catch it when it's wrong." (Y-flip to the real question, held)
// [3] "Follow — I pressure-test the boring parts everyone skips." (brand row rises below)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.33), t0 + 2.0);
var t2 = Math.max(beatAt(2, 0.49), t1 + 1.6);
var t3 = Math.max(beatAt(3, 0.7), t2 + 2.2);

// ── resting state ──
gsap.set("#unsexy", { opacity: 0, y: 20 * U });
gsap.set("#flip", { rotationY: 0, scale: 0.94, opacity: 0 });
gsap.set("#front .q", { opacity: 0, y: 20 * U });
gsap.set("#slash", { scaleX: 0 });
gsap.set("#brand", { opacity: 0, y: 30 * U });
gsap.set("#caret", { opacity: 1 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);
// slow push-in on the whole stage — never a static hold
tl.fromTo("#stage", { scale: 1.0 }, { scale: 1.05, duration: D, ease: "sine.out" }, 0);

// ── beat 0 — the lane signature line lands ──
tl.to("#unsexy", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 0.2);

// ── beat 1 — "CAN AI BUILD IT?" assembles, then a hard gold slash strikes it ──
tl.to("#flip", { opacity: 1, scale: 1, duration: 0.44, ease: "back.out(1.4)" }, t1);
tl.to("#front .q", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t1 + 0.12);
tl.to("#slash", { scaleX: 1, duration: 0.3, ease: "power3.inOut" }, t1 + 0.9);

// ── beat 2 — the card 3D Y-FLIPS to the real question, held with a pulse + blinking caret ──
tl.to("#flip", { rotationY: 180, duration: 0.72, ease: "power2.inOut" }, t2);
// a subtle gold pulse as the real question settles (pause-and-screenshot)
tl.fromTo("#back .q", { textShadow: "0 0 " + 44 * U + "px rgba(255,176,32,0.45)" },
  { textShadow: "0 0 " + 70 * U + "px rgba(255,176,32,0.75)", duration: 0.8, yoyo: true, repeat: 1, ease: "sine.inOut" }, t2 + 0.8);
// the caret blinks — comment bait (deterministic 2Hz blink via a stepped yoyo)
tl.to("#caret", { opacity: 0, duration: 0.5, repeat: 8, yoyo: true, ease: "steps(1)" }, t2 + 0.8);

// ── beat 3 — the brand row rises in reserved space below (never over the question) ──
tl.to("#brand", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t3 + 0.1);

HF.register("cd-would-you-catch-it", tl);
