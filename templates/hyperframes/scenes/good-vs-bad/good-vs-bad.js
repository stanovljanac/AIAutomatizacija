/* good-vs-bad — GSAP timeline for 010 s10. Two chat panels: invent (silent) vs refuse (loud). The
 * refusal is highlighted as the stronger one. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "good-vs-bad", width: 1920, height: 1080, frames: 300, beatLo: 0.12, beatHi: 0.3 });
var fps = S.fps, U = S.U, props = S.props, beats = S.beats, beatAt = S.beatAt;

// 4 sentence beats
var tFrame = beatAt(0, 0.05);
var tBad = Math.max(beatAt(1, 0.28), tFrame + 0.7);
var tGood = Math.max(beatAt(2, 0.52), tBad + 0.9);
var tWin = Math.max(beatAt(3, 0.76), tGood + 0.9);

var tl = gsap.timeline({ paused: true });

gsap.set(["#b-ai1", "#v-bad", "#b-ai2", "#v-good"], { opacity: 0 });
gsap.set(["#b-user1", "#b-user2"], { opacity: 0 });

// both panel frames + the user prompts appear
tl.from("#panel-bad", { opacity: 0, x: -50 * U, duration: 0.5, ease: "power3.out" }, tFrame);
tl.from("#panel-good", { opacity: 0, x: 50 * U, duration: 0.5, ease: "power3.out" }, tFrame);
tl.to("#b-user1", { opacity: 1, duration: 0.35, ease: "power2.out" }, tFrame + 0.4);
tl.to("#b-user2", { opacity: 1, duration: 0.35, ease: "power2.out" }, tFrame + 0.4);

// LEFT invents a confident cited answer
tl.fromTo("#b-ai1", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tBad);
tl.to("#v-bad", { opacity: 1, duration: 0.4, ease: "power2.out" }, tBad + 0.5);

// RIGHT refuses
tl.fromTo("#b-ai2", { opacity: 0, y: 22 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tGood);
tl.to("#v-good", { opacity: 1, duration: 0.4, ease: "power2.out" }, tGood + 0.5);

// the refusal is the stronger one — right panel lifts + glows, left recedes
tl.to("#panel-good", { scale: 1.04, boxShadow: "0 " + (24 * U) + "px " + (60 * U) + "px rgba(0,0,0,0.5), 0 0 " + (46 * U) + "px rgba(255,176,32,0.4)", duration: 0.6, ease: "power2.out" }, tWin);
tl.to("#panel-bad", { opacity: 0.42, scale: 0.97, duration: 0.6, ease: "power2.inOut" }, tWin);

HF.register("good-vs-bad", tl);
