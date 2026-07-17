/* scene-as-code — GSAP timeline for 012 s11. Code lines type on the left; the render assembles in
 * LOCKSTEP on the right; tool chips land; the render pane wins. Silent, deterministic, seek-driven.
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{ heading? }
 */
var S = HF.scene({ id: "scene-as-code", width: 1920, height: 1080, frames: 570, beatLo: 0.1, beatHi: 0.4 });
var fps = S.fps, D = S.D, U = S.U, props = S.props, beats = S.beats, cl = S.cl, beatAt = S.beatAt;

// 3 sentence beats
var tPanes = beatAt(0, 0.03);
var tType = Math.max(beatAt(1, 0.3), tPanes + 1.0);
var tTools = Math.max(beatAt(2, 0.74), tType + 3.0);

var tl = gsap.timeline({ paused: true });

// beat 0 — the two panes slide in facing each other
tl.from("#codepane", { opacity: 0, x: -120 * U, duration: 0.55, ease: "power3.out" }, tPanes);
tl.from("#renderpane", { opacity: 0, x: 120 * U, duration: 0.55, ease: "power3.out" }, tPanes + 0.12);

// beat 1 — LOCKSTEP: each code line types (left) and its render element assembles (right)
var span = Math.max(2.6, tTools - tType - 0.4);
var step = span / 5;
var lineY = 52 * U; // caret line height step (matches .cline gap+size)
function typed(lineSel, at, renderCb) {
  tl.fromTo(lineSel, { opacity: 0, x: -16 * U }, { opacity: 1, x: 0, duration: 0.28, ease: "power2.out" }, at);
  if (renderCb) renderCb(at + 0.22);
}
tl.to("#caret", { y: 0 * lineY, duration: 0.01 }, tType);
typed("#cl1", tType, null);
tl.to("#caret", { y: 1 * lineY, duration: 0.18, ease: "power1.inOut" }, tType + step * 0.9);
typed("#cl2", tType + step, function (at) {
  tl.fromTo("#rt", { opacity: 0, y: 18 * U }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" }, at);
});
tl.to("#caret", { y: 2 * lineY, duration: 0.18, ease: "power1.inOut" }, tType + step * 1.9);
typed("#cl3", tType + step * 2, function (at) {
  tl.to("#rr", { scaleX: 1, duration: 0.4, ease: "power3.out" }, at);
});
tl.to("#caret", { y: 3 * lineY, duration: 0.18, ease: "power1.inOut" }, tType + step * 2.9);
typed("#cl4", tType + step * 3, function (at) {
  tl.fromTo("#rc", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2)" }, at);
});
tl.to("#caret", { y: 4 * lineY, duration: 0.18, ease: "power1.inOut" }, tType + step * 3.9);
typed("#cl5", tType + step * 4, function (at) {
  tl.to("#rpfill", { scaleX: 1, duration: Math.max(0.8, step * 1.4), ease: "power1.inOut" }, at);
});

// beat 2 — the tool chips land (Claude + modular alternatives); the render pane takes the lead
tl.fromTo("#toolrow", { opacity: 0, y: 26 * U }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, tTools);
tl.to("#codepane", { scale: 0.96, opacity: 0.75, duration: 0.6, ease: "power2.inOut" }, cl(tTools + 0.8, tTools, D - 0.6));
tl.to("#renderpane", { scale: 1.04, duration: 0.6, ease: "power2.inOut" }, cl(tTools + 0.8, tTools, D - 0.6));

HF.register("scene-as-code", tl);
