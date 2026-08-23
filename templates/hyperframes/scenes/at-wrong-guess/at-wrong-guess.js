/* at-wrong-guess — 023 s15. The falsified hypothesis, kept on screen.
 *
 * Premise: the tidy story ("pad the prompt and the important line gets a smaller share") is not what
 * the instrument returned, and the honest move is to show the prediction and the measurement on the
 * same axes. The prediction is struck, not deleted. Then the reason: attention is not a pro-rata
 * split — one head can lock onto a rare relevant line and hold it.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-wrong-guess", width: 1920, height: 1080, frames: 535, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 83, bloomX: 64, bloomY: 36 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var FROM = Number(props.from) || 0.078, TO = Number(props.to) || 0.100;
document.getElementById("htext").textContent = props.expected || "the fact's share falls";
document.getElementById("hsub").textContent = "pad the prompt 7.9x → the buried line gets a smaller cut";
document.getElementById("ptitle").textContent = props.title || "0.078 → 0.100";
document.getElementById("pfrom").textContent = FROM.toFixed(3);
document.getElementById("pto").textContent = TO.toFixed(3);
document.getElementById("verdict").textContent = props.verdict || "I was wrong. The number stays on screen.";
document.getElementById("lesson").textContent = props.lesson || "not a pro-rata split — one head can lock on";

/* the two curves, on the same axes: the one we predicted and the one we measured */
var predPath = "M 40 300 C 300 330, 620 372, 960 392";
var measPath = "M 40 300 C 300 288, 620 214, 960 150";
var pred = document.getElementById("pred"), meas = document.getElementById("meas");
pred.setAttribute("d", predPath);
meas.setAttribute("d", measPath);
[pred, meas].forEach(function (p) {
  var len = p.getTotalLength ? p.getTotalLength() : 1200;
  p.style.strokeDasharray = p === pred ? "14 10" : len;
  p._len = len;
});
meas.style.strokeDashoffset = meas._len;
gsap.set(pred, { opacity: 0 });

/* twelve heads; one of them is the one that locks on */
var headsHost = document.getElementById("heads");
var LOCK = 6;
var heads = [];
for (var i = 0; i < 12; i++) {
  var hd = FX.el("hd" + (i === LOCK ? " lock" : ""), headsHost);
  var fill = FX.el("hdfill", hd);
  var lbl = FX.el("hdlbl", hd);
  lbl.textContent = "head " + (i + 1);
  heads.push(fill);
}

var b0 = beatAt(0, 0.0);                          // "I expected the fact's share to fall…"
var b1 = Math.max(beatAt(1, 0.28), b0 + 3.0);     // "It did not."
var b2 = Math.max(beatAt(2, 0.36), b1 + 0.7);     // "It went up."
var b3 = Math.max(beatAt(3, 0.46), b2 + 0.9);     // "So that guess of mine was wrong…"
var b4 = Math.max(beatAt(4, 0.68), b3 + 3.0);     // "attention is not a pro-rata split — one head can lock on"

gsap.set("#hyp", { opacity: 0, x: FX.px(-18) });
gsap.set("#plot", { opacity: 0 });
gsap.set(["#pfrom", "#pto"], { opacity: 0 });
gsap.set("#heads", { opacity: 0, y: FX.px(16) });
gsap.set(["#verdict", "#lesson"], { opacity: 0, y: FX.px(12) });
gsap.set("#hslash", { scaleX: 0 });

/* the prediction, written down before the result — that is what makes it a prediction */
tl.to("#hyp", { opacity: 1, x: 0, duration: 0.42, ease: "power3.out" }, b0);
tl.to("#plot", { opacity: 1, duration: 0.36 }, b0 + 0.3);
FX.fromTo(tl, "#pfrom", { opacity: 0 }, { opacity: 1, duration: 0.3 }, b0 + 0.5);
FX.fromTo(tl, pred, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, b0 + 0.7);

/* the measurement goes the other way, straight through it */
FX.fromTo(tl, meas, { strokeDashoffset: meas._len }, { strokeDashoffset: 0, duration: Math.max(b2 - b1 + 0.9, 1.0), ease: "power2.inOut" }, b1);
FX.fromTo(tl, "#pto", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2)" }, b2 + 0.4);

/* struck, and kept */
tl.to("#hslash", { scaleX: 1, duration: 0.28, ease: "power3.out" }, b3 + 0.1);
tl.to("#hyp", { opacity: 0.55, duration: 0.4 }, b3 + 0.3);
tl.to("#verdict", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b3 + 0.4);

/* the mechanism: eleven heads spread, one locks on and holds */
tl.to("#heads", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b4);
heads.forEach(function (f, i) {
  if (i === LOCK) return;
  FX.fromTo(tl, f, { scaleX: 0.16 }, { scaleX: 0.34 + (i % 3) * 0.08, duration: 0.5, ease: "power2.out" }, b4 + 0.2 + i * 0.03);
});
FX.fromTo(tl, heads[LOCK], { scaleX: 0.16 }, { scaleX: 1, duration: 0.5, ease: "power4.out" }, b4 + 0.5);
tl.to("#lesson", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b4 + 0.7);
FX.camera(tl, { at: b4, scale: 1.02, dur: Math.max(D - b4 - 0.2, 0.6), ease: "sine.out" });

HF.register("at-wrong-guess", tl);
