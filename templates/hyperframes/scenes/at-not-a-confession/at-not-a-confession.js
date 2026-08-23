/* at-not-a-confession — 023 s20. The guard that stops our own chart being over-read.
 *
 * Premise: we just spent four scenes on a bar chart, so we owe the viewer its limits. The arrow the
 * viewer would draw ("what it used" → the biggest slice) is drawn first, and then the published
 * finding moves a second arrow somewhere else. Both stay on screen. Attention decides what gets
 * mixed in; it is not a confession.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-not-a-confession", width: 1920, height: 1080, frames: 504, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 103, bloomX: 50, bloomY: 34 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* the same four slices the measurement produced — brought back, not redrawn from scratch */
var SPLIT = [
  { label: "the first word", pct: 25.8 },
  { label: "the chatter", pct: 23.6 },
  { label: "the answer", pct: 10.0 },
  { label: "the wrapping", pct: 40.6 },
];
var barHost = document.getElementById("cbar"), legHost = document.getElementById("clegend");
var centres = [];
var acc = 0;
SPLIT.forEach(function (s, i) {
  var el = FX.el("sl k" + i, barHost);
  el.style.width = s.pct + "%";
  var v = FX.el("slpct", el);
  v.textContent = s.pct.toFixed(1) + "%";
  centres.push(acc + s.pct / 2);
  acc += s.pct;
  var lg = FX.el("lg", legHost);
  lg.style.width = s.pct + "%";
  lg.textContent = s.label;
});

document.getElementById("ctitle").textContent = "the split, from the measurement";
document.getElementById("claim").textContent = props.claim || "a big share means it reasoned from that line";
document.getElementById("truth").textContent = props.truth || "attention decides what gets mixed in";
document.getElementById("src").textContent = props.sourceChip || "Jain & Wallace · 2019";
document.getElementById("verdict").textContent = props.title || "Not a confession.";
document.getElementById("pGuessTxt").textContent = "what you would read off it";
document.getElementById("pRealTxt").textContent = "what the answer leaned on";

/* the arrows sit over the bar's own geometry: they point at real slices, not at empty frame */
var barLeft = P ? 60 : 110, barRight = P ? 60 : 110;
function xForSlice(i) {
  return "calc(" + barLeft + "px * var(--u) + (100% - " + (barLeft + barRight) + "px * var(--u)) * " + centres[i] / 100 + ")";
}
var pGuess = document.getElementById("pGuess"), pReal = document.getElementById("pReal");
pGuess.style.left = xForSlice(3);
pReal.style.left = xForSlice(3);
gsap.set([pGuess, pReal], { xPercent: -50 });

var b0 = beatAt(0, 0.0);                          // "And one thing I will not let this video claim."
var b1 = Math.max(beatAt(1, 0.14), b0 + 1.4);     // "A big share does not mean the model reasoned from that line."
var b2 = Math.max(beatAt(2, 0.36), b1 + 2.6);     // "Published work found attention can point one way while…"
var b3 = Math.max(beatAt(3, 0.72), b2 + 4.0);     // "Attention decides what gets mixed in."
var b4 = Math.max(beatAt(4, 0.86), b3 + 1.6);     // "It is not a confession."

gsap.set("#claimwrap", { opacity: 0, y: FX.px(12) });
gsap.set(["#truth", "#src", "#verdict"], { opacity: 0, y: FX.px(12) });

/* the arrow the viewer would draw */
FX.fromTo(tl, pGuess, { opacity: 0, y: FX.px(-14) }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b0 + 0.2);
tl.to("#claimwrap", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b1);
tl.to("#cslash", { scaleX: 1, duration: 0.26, ease: "power3.out" }, b1 + 1.0);
tl.to("#claimwrap", { opacity: 0.45, duration: 0.34 }, b1 + 1.3);

/* the published finding puts a second arrow somewhere else, and both stay */
FX.fromTo(tl, pReal, { opacity: 0, y: FX.px(-14) }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, b2 + 0.3);
tl.to(pReal, { left: xForSlice(2), duration: 0.7, ease: "power2.inOut" }, b2 + 0.6);
tl.to(pGuess, { opacity: 0.55, duration: 0.4 }, b2 + 0.8);
FX.fromTo(tl, "#src", { opacity: 0, y: FX.px(10) }, { opacity: 1, y: 0, duration: 0.3 }, b2 + 0.9);

tl.to("#truth", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, b3);
tl.to("#verdict", { opacity: 1, y: 0, duration: 0.44, ease: "power3.out" }, b4);
FX.camera(tl, { at: b3, scale: 1.02, dur: Math.max(D - b3 - 0.2, 0.6), ease: "sine.out" });

HF.register("at-not-a-confession", tl);
