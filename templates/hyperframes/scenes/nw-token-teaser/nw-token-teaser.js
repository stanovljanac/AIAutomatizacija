/* nw-token-teaser — GSAP timeline for 019 s5 (CAUSAL SIGN-OFF = CTA). The carried guess→verify node
 * sits at top; "one word at a time" with "word" highlighted; the demo word "understanding" fractures
 * into sub-word chunks; a gold TOKEN label locks on; a chevron points to the next-lesson plate; the
 * channel mark sits small. Deterministic, seek-driven; flat, face-on, no 3D tilt.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "nw-token-teaser", width: 1080, height: 1920, frames: 238, beatLo: 0.0, beatHi: 0.3 });
var D = S.D, U = S.U, beatAt = S.beatAt, cl = S.cl;

// sentence beats: [0] "guessing one word at a time" (phrase) [1] "what's a 'word' to an AI?"
// (fracture) [2] "it's called a token" (TOKEN label) [3] "that's the next piece" (plate + brand)
var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.3), t0 + 1.6);
var t2 = Math.max(beatAt(2, 0.53), t1 + 1.3);
var t3 = Math.max(beatAt(3, 0.83), t2 + 1.2);

// ── resting state ──
gsap.set("#carry", { opacity: 0, y: -16 * U });
gsap.set("#phrase", { opacity: 0, y: 20 * U });
gsap.set("#demo", { opacity: 0, y: 20 * U });
gsap.set("#ch2", { x: 0 });
gsap.set("#split", { width: 0, opacity: 0 });
gsap.set("#tokenlabel", { opacity: 0, scale: 0.6, y: -10 * U });
gsap.set("#next", { opacity: 0, x: -20 * U });
gsap.set("#brand", { opacity: 0 });

var tl = gsap.timeline({ paused: true });

// ambient glow breathe
tl.to("#glow", { opacity: 1, scale: 1.05, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — the carried node + the phrase (word highlighted) ──
tl.to("#carry", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0);
tl.to("#phrase", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0 + 0.25);
tl.to("#wordhi", { textShadow: "0 0 " + (30 * U) + "px rgba(255,176,32,0.8)", duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, t0 + 0.6);

// ── beat 1 — the demo word appears whole, then FRACTURES at odd boundaries ──
tl.to("#demo", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t1);
// the split opens: a gold seam grows, the chunks part, ch2 recolors gold
tl.to("#split", { opacity: 1, width: 14 * U, duration: 0.28, ease: "power3.out" }, t1 + 0.55);
tl.to("#ch2", { x: 30 * U, color: "#ffb020", duration: 0.4, ease: "back.out(1.8)" }, t1 + 0.55);
tl.to("#carry", { opacity: 0.24, duration: 0.4 }, t1 + 0.2);

// ── beat 2 — the gold TOKEN label locks onto a chunk ──
tl.to("#tokenlabel", { opacity: 1, scale: 1, y: 0, duration: 0.34, ease: "back.out(2.2)" }, t2);
tl.to("#ch2", { textShadow: "0 0 " + (34 * U) + "px rgba(255,176,32,0.6)", duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, t2 + 0.2);

// ── beat 3 — the next-lesson plate + chevron + brand; slow push-in; hold ──
tl.to("#next", { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, t3);
tl.to("#chev", { x: 10 * U, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut" }, t3 + 0.4);
tl.to("#brand", { opacity: 1, duration: 0.5, ease: "power2.out" }, t3 + 0.35);
tl.to("#camera", { scale: 1.035, duration: cl(D - t3, 1.6, 3.5), ease: "power1.inOut", transformOrigin: "50% 46%" }, t3);

HF.register("nw-token-teaser", tl);
