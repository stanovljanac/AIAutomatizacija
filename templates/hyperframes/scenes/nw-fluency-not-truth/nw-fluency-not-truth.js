/* nw-fluency-not-truth — GSAP timeline for 019 s4 (REFRAME / TAKEAWAY). The s3 meter reappears
 * small and relabels confidence → fluency; the quote "Confidence measures fluency — not truth."
 * holds; a gray fact-check gauge sits at zero; the wrong rule fades and the working rule "treat it
 * as a guess → verify" locks in gold (carried into s5). Deterministic, seek-driven; flat, face-on.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "nw-fluency-not-truth", width: 1080, height: 1920, frames: 399, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, cl = S.cl;

// sentence beats: [0] "That's the trap" (chip) [1] "measures fluency — not truth" (quote + relabel)
// [2] "nothing checks if it's right" (gauge at zero) [3] "don't trust the tone" (wrong rule)
// [4] "every answer is a guess. verify it" (working rule locks)
var t0 = beatAt(0, 0.03);
var t1 = Math.max(beatAt(1, 0.12), t0 + 1.0);
var t2 = Math.max(beatAt(2, 0.48), t1 + 3.0);
var t3 = Math.max(beatAt(3, 0.68), t2 + 1.8);
var t4 = Math.max(beatAt(4, 0.79), t3 + 1.2);

// ── resting state ──
gsap.set("#relabel", { opacity: 0, y: -18 * U });
gsap.set("#rnew", { opacity: 0 });
gsap.set("#quote", { opacity: 0, y: 26 * U, scale: 0.96 });
gsap.set("#machine", { opacity: 0, y: 24 * U });
gsap.set("#wrongrule", { opacity: 0, x: -26 * U });
gsap.set("#workingrule", { opacity: 0, x: 26 * U });
gsap.set("#wstrike", { scaleX: 0 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the small meter chip reappears (confidence) ──
tl.to("#relabel", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0);

// ── beat 1 — the quote lands and HOLDS; the chip relabels confidence → fluency ──
tl.to("#quote", { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, t1);
tl.to("#quote", { scale: 1.015, duration: 1.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, t1 + 0.6);
// the literal swap
tl.to("#rold", { opacity: 0, y: -14 * U, duration: 0.3, ease: "power2.in" }, t1 + 0.5);
tl.to("#rnew", { opacity: 1, duration: 0.35, ease: "power2.out" }, t1 + 0.7);

// ── beat 2 — the fact-check gauge sits at zero; there is no truth dial ──
tl.to("#machine", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t2);
// the needle twitches at 0 and refuses to move (nothing measures truth)
tl.to("#gneedle", { rotation: 4, transformOrigin: "110px 115px", duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, t2 + 0.5);

// ── beat 3 — the WRONG rule appears (gray) ──
tl.to("#wrongrule", { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, t3);

// ── beat 4 — the wrong rule fades; the WORKING rule locks in gold (carried into s5) ──
tl.to("#wstrike", { scaleX: 1, duration: 0.3, ease: "power3.inOut" }, t4);
tl.to("#wrongrule", { opacity: 0.32, duration: 0.4, ease: "power2.out" }, t4 + 0.25);
tl.to("#workingrule", { opacity: 1, x: 0, duration: 0.45, ease: "back.out(1.6)" }, t4 + 0.3);
tl.to("#workingrule", { boxShadow: "0 0 " + (46 * U) + "px rgba(255,176,32,0.4)", duration: 0.9, yoyo: true, repeat: 2, ease: "sine.inOut" }, t4 + 0.7);
// slow push-in while it holds
tl.to("#camera", { scale: 1.03, duration: cl(D - t4, 2.0, 4), ease: "power1.inOut", transformOrigin: "50% 60%" }, t4 + 0.3);

HF.register("nw-fluency-not-truth", tl);
