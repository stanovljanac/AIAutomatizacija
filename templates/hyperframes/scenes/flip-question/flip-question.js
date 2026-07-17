/* flip-question — GSAP timeline for 013 s5 (round-2 wording). Kicker → "DOES IT WORK?" strike +
 * 3D flip to "WILL IT TELL ME WHEN IT DOESN'T?" → "THE DANGEROUS ONE / KEEPS GOING." monolith
 * locks (held ≥4s, slow gold pulse) → brand row rises in reserved space. Deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "flip-question", width: 1080, height: 1920, frames: 346, beatLo: 0.05, beatHi: 0.5 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beatAt = S.beatAt;

var tKick = beatAt(0, 0.01);
var tFlip = Math.max(beatAt(1, 0.14), tKick + 0.7);
var tMono = Math.max(beatAt(2, 0.4), tFlip + 2.0);
var tBrand = Math.max(beatAt(3, 0.63), tMono + 1.2);

var tl = gsap.timeline({ paused: true });

// beat 0 — kicker
tl.fromTo("#kicker", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tKick);

// beat 1 — "DOES IT WORK?" assembles, gets struck, 3D-flips to the real question
tl.fromTo("#qA", { opacity: 0, y: 40 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, tFlip - 0.55 < tKick + 0.3 ? tKick + 0.3 : tFlip - 0.55);
tl.to("#strike", { scaleX: 1, duration: 0.32, ease: "power3.inOut" }, tFlip + 0.15);
tl.to("#fliprig", { rotationY: 180, duration: 0.85, ease: "power3.inOut" }, tFlip + 0.6);
tl.to("#camera", { scale: 1.03, duration: 0.85, ease: "power2.inOut" }, tFlip + 0.6);
// hide the A face once the rig passes 90° — GSAP settles children to 2D matrices, which
// can defeat backface-visibility, so the fade is the deterministic guarantee
tl.to("#qA", { opacity: 0, duration: 0.16 }, tFlip + 1.02);

// beat 2 — the monolith locks in (screenshotable; held to the end ≥4s)
tl.to("#fliprig", { y: -40 * U, scale: 0.82, opacity: 0.75, duration: 0.5, ease: "power2.inOut" }, tMono);
tl.to("#kicker", { opacity: 0.4, duration: 0.4 }, tMono);
tl.fromTo("#monolith", { opacity: 0 }, { opacity: 1, duration: 0.2 }, tMono);
tl.fromTo("#m1", { y: 70 * U, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power4.out" }, tMono + 0.05);
tl.fromTo("#m2", { y: 70 * U, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, tMono + 0.35);
// slow gold pulse while it holds (pause-and-screenshot beat)
tl.to("#m2", { textShadow: "0 0 90px rgba(255,176,32,0.75)", duration: 1.1, yoyo: true, repeat: 3, ease: "sine.inOut" }, tMono + 0.9);

// beat 3 — brand row rises in its reserved space (never over the monolith)
tl.fromTo("#brandrow", { opacity: 0, y: 40 * U }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, tBrand);
tl.fromTo(".b-mark", { rotation: -8 }, { rotation: 0, duration: 0.5, ease: "back.out(2)" }, tBrand);

// slow push-in the whole scene
tl.fromTo("#camera", { scale: 1.0 }, { scale: 1.06, duration: D - tMono, ease: "power1.inOut" }, tMono);

HF.register("flip-question", tl);
