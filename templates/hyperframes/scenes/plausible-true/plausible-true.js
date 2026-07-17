/* plausible-true — GSAP timeline for 010 s08. Two words line up under "=", then drift apart as it
 * becomes "≠". Silent, deterministic, seek-driven (two crossfading operators, no text swap).
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "plausible-true", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, IS_PORTRAIT = S.portrait, beatAt = S.beatAt;

var tP = beatAt(0, 0.05);
var tEq = Math.max(beatAt(3, 0.44), tP + 1.0);
var tNe = Math.max(beatAt(4, 0.68), tEq + 0.9);

var tl = gsap.timeline({ paused: true });

gsap.set(["#wt", "#op-eq"], { opacity: 0 });
gsap.set("#op-ne", { opacity: 0 });
gsap.set("#tag", { opacity: 0 });
gsap.set("#wp", { opacity: 0 });

// "plausible" lands
tl.fromTo("#wp", { opacity: 0, y: 34 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tP);

// "= true" — they line up
tl.fromTo("#op-eq", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" }, tEq);
tl.fromTo("#wt", { opacity: 0, y: 34 * U, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, tEq + 0.12);

// they drift apart; "=" becomes "≠"; the tag lands
var drift = (IS_PORTRAIT ? 60 : 120) * U;
if (IS_PORTRAIT) {
  tl.to("#wp", { y: -drift, duration: 0.7, ease: "power2.inOut" }, tNe);
  tl.to("#wt", { y: drift, duration: 0.7, ease: "power2.inOut" }, tNe);
} else {
  tl.to("#wp", { x: -drift, duration: 0.7, ease: "power2.inOut" }, tNe);
  tl.to("#wt", { x: drift, duration: 0.7, ease: "power2.inOut" }, tNe);
}
tl.to("#op-eq", { opacity: 0, scale: 0.7, duration: 0.3, ease: "power2.in" }, tNe);
tl.fromTo("#op-ne", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.9)" }, tNe + 0.1);
tl.to("#tag", { opacity: 1, duration: 0.5, ease: "power2.out" }, tNe + 0.35);

HF.register("plausible-true", tl);
