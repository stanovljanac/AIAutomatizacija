/* cws-restart — 022 Short s4 (portrait).
 * Premise: the Short's one takeaway has to be a thing you DO, so the beat ends on a five-line
 * template you can screenshot. Before that, the growth is shown honestly: measured bars, then a
 * dashed projection with its own chip, bending upward to a marker at forty.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cws-restart", width: 1080, height: 1920, frames: 374, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props;
FX.init(S, { palette: "body", dust: 20, seed: 109, bloomY: 44 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("chip").textContent = props.sourceChip || "arithmetic · equal-size turns";
document.getElementById("m40l").textContent = props.mark40 || "40 questions ≈ 20×";
document.getElementById("m8l").textContent = props.mark8 || "8 questions · 4.5× measured";
document.getElementById("axis").textContent = props.axisLabel || "questions in one chat";
document.getElementById("kicker").textContent = props.title || "New chat. Five-line summary.";

/* the growth curve: cumulative reads after N requests = N(N+1)/2 */
var X0 = 70, XW = 940, BASE = 1310, TOP = 300, H = 1010, NMAX = 44;
function cum(n) { return (n * (n + 1)) / 2; }
var YMAX = cum(NMAX);
function px_(n) { return X0 + (n / NMAX) * XW; }
function py_(n) { return BASE - (cum(n) / YMAX) * H; }

var chart = document.getElementById("chart");
var mbars = [];
for (var i = 1; i <= 8; i++) {
  var b = FX.el("mbar", chart);
  var h = Math.max(BASE - py_(i), 4);
  b.style.left = FX.px(px_(i) - 12);
  b.style.top = FX.px(BASE - h);
  b.style.height = FX.px(h);
  mbars.push(b);
}
var d = "";
for (var n = 8; n <= NMAX; n++) {
  d += (n === 8 ? "M " : " L ") + (((px_(n) - X0) / XW) * 900).toFixed(1) + " " + (((py_(n) - TOP) / H) * 620).toFixed(1);
}
var proj = document.getElementById("proj");
proj.setAttribute("d", d);
gsap.set(proj, { strokeDasharray: "20 18", opacity: 0 });
document.getElementById("m40").style.left = FX.px(px_(40));
document.getElementById("m40").style.top = FX.px(py_(40));
document.getElementById("m8").style.left = FX.px(px_(8));
document.getElementById("m8").style.top = FX.px(py_(8));

/* the pile that becomes five lines */
var slabs = FX.pile(document.getElementById("pilehost"), { n: 16, baseY: 1520, w: 700, gap: 24, seed: 41 });
var SUM = props.summary || [
  "goal — standardise the due-date column",
  "format — day-first, dashes",
  "rules — resolve relative dates, flag guesses",
  "open — what to do with 12 blanks",
  "next — apply to the 2024 sheet",
];
var sumHost = document.getElementById("summary");
var sumLines = SUM.map(function (line) {
  var el = FX.el("sline", sumHost);
  var parts = line.split(" — ");
  var b2 = FX.el("", el, "b");
  b2.textContent = parts[0];
  if (parts[1]) el.appendChild(document.createTextNode(" — " + parts[1]));
  return el;
});

var t0 = beatAt(0, 0.0);
var t1 = Math.max(beatAt(1, 0.55), t0 + 4.0);   // "So when a chat turns into a pile, don't drag it…"

gsap.set(mbars, { scaleY: 0 });
gsap.set(slabs, { opacity: 0 });
gsap.set(sumLines, { opacity: 0, y: FX.px(16) });
gsap.set(["#chip", "#m8", "#m40", "#axis", "#summary", "#kicker"], { opacity: 0 });

/* the measured eight, then the projection bending away from them */
tl.to(mbars, { scaleY: 1, duration: 0.26, ease: "power3.out", stagger: 0.04 }, t0 + 0.15);
tl.to(proj, { opacity: 1, duration: 0.2 }, t0 + 0.7);
FX.fromTo(tl, proj, { strokeDashoffset: 2600 }, { strokeDashoffset: 0, duration: 2.2, ease: "power1.in" }, t0 + 0.75);
tl.to(["#chip", "#axis"], { opacity: 1, duration: 0.3 }, t0 + 1.0);
FX.fromTo(tl, "#m8", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.2)" }, t0 + 0.55);
FX.fromTo(tl, "#m40", { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.4)" }, t0 + 2.6);

/* then: don't drag the pile — hand over five lines instead */
tl.to(["#plot", "#chart", "#m8", "#m40", "#axis", "#chip"], { opacity: 0, y: FX.px(-60), duration: 0.4, ease: "power2.in" }, t1 - 0.5);
slabs.forEach(function (s, k) {
  FX.fromTo(tl, s, { opacity: 0, y: FX.px(-30) }, { opacity: 1, y: 0, duration: 0.16, ease: "power3.out" }, t1 - 0.35 + k * 0.03);
});
slabs.forEach(function (s, k) {
  tl.to(s, { y: FX.px((15 - k) * 24 * 0.9), scaleX: 0.45, opacity: 0, duration: 0.5, ease: "power2.in" }, t1 + 0.5 + k * 0.02);
});
tl.to("#summary", { opacity: 1, duration: 0.3 }, t1 + 1.0);
sumLines.forEach(function (l, k) {
  FX.fromTo(tl, l, { opacity: 0, y: FX.px(16) }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.out" }, t1 + 1.1 + k * 0.14);
});
tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, t1 + 1.0);
/* held still from here to the cut — nothing moves over the text */
FX.camera(tl, { at: t1 + 1.0, scale: 1.02, dur: Math.max(D - t1 - 1.2, 0.8), ease: "sine.out" });

HF.register("cws-restart", tl);
