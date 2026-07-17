/* wh-hour-flip — GSAP timeline for 014 s5 TAKEAWAY MONOLITH. "WILL AI TAKE YOUR JOB?" assembles,
 * struck through, 3D Y-flips to the real question "WHICH HOUR WOULD YOU HAND OVER FIRST?" (held >=4s,
 * slow gold pulse). A comment-bait line + blinking caret. The brand row rises in reserved space below.
 * Deterministic, seek-driven; no Math.random / Date. Adapts the flip-question rig (013 s5).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "wh-hour-flip", width: 1080, height: 1920, frames: 406, beatLo: 0.05, beatHi: 0.5 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// sentence beats: [0] "so stop asking if AI will take your job" [1] "ask which hour you'd hand over first" [2] "mine was the copy-paste. yours?" [3] "follow while I hand AI the worst hour of every job"
var tKick = beatAt(0, 0.0);
var tFlip = Math.max(beatAt(1, 0.2), tKick + 1.3);
var tBait = Math.max(beatAt(2, 0.38), tFlip + 1.6);
var tBrand = Math.max(beatAt(3, 0.56), tBait + 1.4);

// ── resting state ──
gsap.set("#kicker", { opacity: 0, y: 26 * U });
gsap.set("#qA", { opacity: 0, y: 40 * U, scale: 0.92 });
gsap.set("#strike", { scaleX: 0 });
gsap.set("#bait", { opacity: 0, y: 20 * U });
gsap.set("#brandrow", { opacity: 0, y: 40 * U });
gsap.set("#aurora", { opacity: 0.7, scale: 0.94 });

var tl = gsap.timeline({ paused: true });

// ambient aurora breathe
tl.to("#aurora", { opacity: 1, scale: 1.06, duration: D, ease: "sine.inOut" }, 0);

// ── beat 0 — kicker + "WILL AI TAKE YOUR JOB?" assembles, then is struck (answered) ──
tl.fromTo("#kicker", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tKick);
tl.to("#qA", { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, tKick + 0.3);
tl.to("#strike", { scaleX: 1, duration: 0.34, ease: "power3.inOut" }, tFlip - 0.5);

// ── beat 1 — the 3D Y-flip to the real question ──
tl.to("#fliprig", { rotationY: 180, duration: 0.85, ease: "power3.inOut" }, tFlip);
tl.to("#camera", { scale: 1.03, duration: 0.85, ease: "power2.inOut" }, tFlip);
// hide the A face once the rig passes 90° (GSAP can settle children to 2D matrices — the fade guarantees it)
tl.to("#qA", { opacity: 0, duration: 0.16 }, tFlip + 0.42);
// the flipped question holds + a slow gold pulse (pause-and-screenshot beat, >=4s)
tl.to("#qB .gold", { textShadow: "0 0 " + (80 * U) + "px rgba(255,176,32,0.8)", duration: 1.1, yoyo: true, repeat: 4, ease: "sine.inOut" }, tFlip + 1.0);

// ── beat 2 — comment-bait line + blinking caret ("Mine was the copy-paste. Yours?") ──
tl.to("#bait", { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tBait);
tl.to("#caret", { opacity: 0.15, duration: 0.5, repeat: Math.ceil((D - tBait) / 0.5), yoyo: true, ease: "none" }, tBait + 0.3);

// ── beat 3 — the brand row rises in its RESERVED space below (never over the question) ──
tl.fromTo("#brandrow", { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, tBrand);
tl.fromTo(".b-mark", { rotation: -8, scale: 0.9 }, { rotation: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, tBrand);

// slow push-in the whole scene (after the flip)
tl.fromTo("#camera", { scale: 1.03 }, { scale: 1.08, duration: cl(D - tFlip, 2, 10), ease: "power1.inOut" }, tFlip + 0.9);

HF.register("wh-hour-flip", tl);
