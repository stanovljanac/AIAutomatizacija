/* at-sink-cause — 023 s11. The strongest fact in the video, staged as a controlled experiment.
 *
 * Premise: "the sink is caused by the normalisation" is a causal claim, so the frame has to show the
 * control. Two rigs run the same note through the same pipe; the only difference is one component,
 * and it is REMOVED on the right rather than switched off. The left rig's first capsule loads; the
 * right rig's does not. Both keep running, so the difference is repeatable and not a single frame.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-sink-cause", width: 1920, height: 1080, frames: 554, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 57, bloomX: 50, bloomY: 38 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var L = props.left || {}, R = props.right || {};
document.getElementById("tagL").textContent = L.label || "softmax";
document.getElementById("ruleL").textContent = L.rule || "shares must sum to 1";
document.getElementById("tagR").textContent = R.label || "sigmoid, no normalisation";
document.getElementById("ruleR").textContent = R.rule || "no forced total";
document.getElementById("resL").textContent = L.result || "sink appears";
document.getElementById("resR").textContent = R.result || "no sink";
document.getElementById("src").textContent = props.sourceChip || "Gu et al. · ICLR 2025 · models up to 1B";
document.getElementById("verdict").textContent = props.verdict || "Not taste. Change from a transaction that has to balance.";

/* the same eight tokens through both rigs; only the first capsule's share differs */
var TOKENS = ["Notes", "for", "the", "invoice", "run", "The", "vendor", "code"];
var WITH_NORM = [0.53, 0.05, 0.04, 0.09, 0.05, 0.05, 0.10, 0.09];   // forced to sum to 1
var NO_NORM = [0.04, 0.05, 0.04, 0.09, 0.05, 0.05, 0.10, 0.09];     // nothing forces a total: no sink

function buildRig(hostId, shares) {
  var host = document.getElementById(hostId);
  return TOKENS.map(function (t, i) {
    var tk = FX.el("tk" + (i === 0 ? " sink" : ""), host);
    var bar = FX.el("tkbar", tk);
    bar.style.height = (shares[i] / 0.53) * 100 + "%";
    var cap = FX.el("tkcap", tk);
    cap.textContent = t;
    return bar;
  });
}
var barsL = buildRig("toksL", WITH_NORM);
var barsR = buildRig("toksR", NO_NORM);

var b0 = beatAt(0, 0.0);                          // "…because someone tested it."
var b1 = Math.max(beatAt(1, 0.22), b0 + 2.0);     // "Swap the step that forces the total to one…"
var b2 = Math.max(beatAt(2, 0.72), b1 + 5.0);     // "It is not taste."
var b3 = Math.max(beatAt(3, 0.80), b2 + 0.7);     // "It is change from a transaction that has to balance."

gsap.set(["#rigL", "#rigR"], { opacity: 0, y: FX.px(20) });
gsap.set(barsL.concat(barsR), { scaleY: 0 });
gsap.set(["#resL", "#resR"], { opacity: 0 });
gsap.set("#verdict", { opacity: 0, y: FX.px(14) });

tl.to("#rigL", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b0);
tl.to("#rigR", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b0 + 0.16);
FX.fromTo(tl, "#src", { opacity: 0, y: FX.px(-10) }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b0 + 0.4);

/* the run: both rigs fill, token by token, at the same time — the comparison is the composition */
var span = Math.max(b2 - b1 - 0.8, 1.4);
TOKENS.forEach(function (_, i) {
  var at = b1 + 0.2 + (i / TOKENS.length) * span * 0.7;
  tl.to(barsL[i], { scaleY: 1, duration: 0.3, ease: "power3.out" }, at);
  tl.to(barsR[i], { scaleY: 1, duration: 0.3, ease: "power3.out" }, at);
});
/* the component that is missing on the right gets one beat of attention */
FX.fromTo(tl, "#normR", { x: 0 }, { x: FX.px(-6), duration: 0.09, yoyo: true, repeat: 3, ease: "sine.inOut" }, b1 + 0.35);
tl.to("#normL", { boxShadow: "0 0 " + FX.px(26) + " rgba(255,176,32,0.55)", duration: 0.3 }, b1 + 0.35);
/* and the run repeats, so the difference is not one frame: the bars re-settle a second time */
TOKENS.forEach(function (_, i) {
  var at = b1 + 0.2 + span * 0.75 + (i / TOKENS.length) * span * 0.25;
  FX.fromTo(tl, barsL[i], { scaleY: 1 }, { scaleY: 0.92, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut" }, at);
  FX.fromTo(tl, barsR[i], { scaleY: 1 }, { scaleY: 0.92, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut" }, at);
});

tl.to("#resL", { opacity: 1, duration: 0.3 }, b2 - 0.4);
tl.to("#resR", { opacity: 1, duration: 0.3 }, b2 - 0.25);
tl.to("#verdict", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, b3);
FX.camera(tl, { at: b3, scale: 1.02, dur: Math.max(D - b3 - 0.2, 0.6), ease: "sine.out" });

HF.register("at-sink-cause", tl);
