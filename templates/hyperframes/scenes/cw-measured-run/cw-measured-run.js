/* cw-measured-run — 022 s5/s6/s7 (16:9 phases 1-3) and Short s3 (portrait phase 4).
 * Premise: the video's whole claim is a measurement, so the measurement has to RUN on screen —
 * eight bars snapping in on their own beats with their real numbers ticking up, then stacking into
 * one column that is drawn to the TRUE ratio against the conversation itself. Faking the proportion
 * here would be lying with a chart.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-measured-run", width: 1920, height: 1080, frames: 504, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 31, bloomY: P ? 50 : 52 });

var PHASE = Number(props.phase) || 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── the measured data (measure/measured.json — never invent or round these) ──── */
var SENT = props.sent || [154, 215, 279, 366, 433, 489, 548, 606];
var SAID = props.said || 680;
var READ = props.read || 3090;
var RATIO = props.ratio || "4.5×";
var MAXV = SENT[SENT.length - 1];

/* ── geometry ────────────────────────────────────────────────────────────────── */
var BASE = P ? 1330 : 782;                        // the chart baseline
var HMAX = P ? 760 : 430;                         // pixels for the tallest measured bar (9:16 fills the band)
var BW = P ? 96 : 112, GAP = P ? 24 : 40;
var TOTALW = SENT.length * BW + (SENT.length - 1) * GAP;
var X0 = 960 - TOTALW / 2;                        // both formats compose around the frame centre
if (P) X0 = 540 - TOTALW / 2;

document.getElementById("counter").textContent = props.counter || "16 messages · 8 requests";
document.getElementById("chip").textContent = props.sourceChip || "measured · tiktoken o200k_base · 2026-08-16";
document.getElementById("numSaid").textContent = FX.comma(SAID);
document.getElementById("numRead").textContent = FX.comma(READ);
document.getElementById("lblSaid").textContent = props.saidLabel || "said";
document.getElementById("lblRead").textContent = props.readLabel || "read";
document.getElementById("ratio").textContent = RATIO;

/* ── ph1's thread ribbon: a real, boring chat about a messy due-date column ───── */
var ribbon = document.getElementById("ribbon");
var LINES = props.thread || [
  "here's the due date column from our invoice sheet — it's a mess",
  "I can see four different formats in there. Want one standard?",
  "yes. day first, dashes",
  "Some rows say \"next friday\". Should I resolve those to a date?",
  "resolve them, and flag anything you had to guess",
  "Done — 3 rows flagged, 41 converted.",
  "what about the blanks",
  "12 blanks. Leave them empty or mark them TBC?",
];
var msgs = [];
for (var i = 0; i < LINES.length; i++) {
  var m = FX.el("msg " + (i % 2 === 0 ? "me" : "ai"), ribbon);
  m.textContent = LINES[i];
  m.style.width = FX.px(P ? 700 : 720);
  m.style.top = FX.px(60 + i * 170);
  msgs.push(m);
}

/* ── the eight bars ──────────────────────────────────────────────────────────── */
var chart = document.getElementById("chart");
var bars = [], vals = [];
SENT.forEach(function (v, i) {
  var h = (v / MAXV) * HMAX;
  var b = FX.el("bar", chart);
  b.style.left = FX.px(X0 + i * (BW + GAP));
  b.style.width = FX.px(BW);
  b.style.height = FX.px(h);
  b.style.bottom = "auto";
  b.style.top = FX.px(BASE - h);
  bars.push(b);

  var n = FX.el("barval", chart);
  n.style.left = FX.px(X0 + i * (BW + GAP) - 20);
  n.style.width = FX.px(BW + 40);
  n.style.top = FX.px(BASE - h - 54);
  vals.push(n);

  var ix = FX.el("baridx", chart);
  ix.textContent = String(i + 1);
  ix.style.left = FX.px(X0 + i * (BW + GAP));
  ix.style.width = FX.px(BW);
  ix.style.top = FX.px(BASE + 16);
});
var axis = document.getElementById("axis");
axis.style.top = FX.px(BASE);
axis.style.width = FX.px(TOTALW + 120);

/* the pile growing beside the run — one page per request */
var sidePile = P ? [] : FX.pile(document.getElementById("pileside"), {
  n: 8, baseY: BASE - 6, w: 240, gap: 16, seed: 41, x: 88,
});

/* ── the two columns, drawn to the TRUE ratio ────────────────────────────────── */
var COLH = P ? 900 : 520;                           // the READ column's height
var saidH = (SAID / READ) * COLH;
var colW = P ? 210 : 200;
var colSaid = document.getElementById("colSaid"), colRead = document.getElementById("colRead");
var CX = P ? 540 : 960, SPREAD = P ? 300 : 430;
var SAID_CX = CX - SPREAD, READ_CX = CX + SPREAD;   // design-px centres of the two columns
colSaid.style.width = FX.px(colW);
colRead.style.width = FX.px(colW);
colSaid.style.left = FX.px(SAID_CX - colW / 2);
colRead.style.left = FX.px(READ_CX - colW / 2);
colSaid.style.top = FX.px(BASE - saidH);
colRead.style.top = FX.px(BASE - COLH);
colSaid.style.height = FX.px(saidH);
colRead.style.height = FX.px(COLH);
document.getElementById("barSaid").style.height = FX.px(saidH);
document.getElementById("barRead").style.height = FX.px(COLH);
document.getElementById("numSaid").style.top = FX.px(-70);
document.getElementById("numRead").style.top = FX.px(-70);
document.getElementById("lblSaid").style.top = FX.px(saidH + 18);
document.getElementById("lblRead").style.top = FX.px(COLH + 18);
document.getElementById("ratio").style.top = FX.px(BASE - (P ? 420 : 300));

/* ── shared builders ─────────────────────────────────────────────────────────── */
gsap.set(bars, { scaleY: 0 });
gsap.set(vals, { opacity: 0 });
if (sidePile.length) gsap.set(sidePile, { opacity: 0, scaleX: 0.7 });
gsap.set(".baridx", { opacity: 0 });
gsap.set(axis, { scaleX: 0 });
gsap.set("#cols", { opacity: 0 });
gsap.set(["#numSaid", "#numRead", "#lblSaid", "#lblRead"], { opacity: 0 });
gsap.set("#ratio", { opacity: 0, scale: 0.7 });
gsap.set("#chip", { opacity: 0 });
gsap.set("#counter", { opacity: 0, y: FX.px(16) });
gsap.set(["#barSaid", "#barRead"], { scaleY: 0 });

/** the run itself: bar k snaps up, its number ticks to the real value, the pile grows one page */
function runBars(at, span) {
  tl.to(axis, { scaleX: 1, duration: 0.4, ease: "power3.out" }, at - 0.15);
  var step = span / SENT.length;
  SENT.forEach(function (v, i) {
    var t = at + i * step;
    tl.to(bars[i], { scaleY: 1, duration: Math.min(0.34, step * 1.1), ease: "back.out(1.4)" }, t);
    tl.to(vals[i], { opacity: 1, duration: 0.18 }, t + 0.06);
    FX.count(tl, vals[i], { from: 0, to: v, at: t + 0.06, dur: Math.min(0.4, step), fmt: function (x) { return String(Math.round(x)); } });
    tl.to(document.querySelectorAll(".baridx")[i], { opacity: 1, duration: 0.16 }, t);
    if (sidePile[i]) tl.to(sidePile[i], { opacity: 1, scaleX: 1, duration: 0.24, ease: "power3.out" }, t + 0.04);
  });
}

/** the collapse: eight bars slide together into ONE column next to the conversation */
function stackIntoColumns(at) {
  bars.forEach(function (b, i) {
    var dx = READ_CX - (X0 + i * (BW + GAP) + BW / 2);
    tl.to(b, { x: FX.px(dx), opacity: 0, duration: 0.5, ease: "power2.inOut" }, at + i * 0.03);
    tl.to(vals[i], { opacity: 0, duration: 0.2 }, at + i * 0.02);
  });
  tl.to([".baridx", axis], { opacity: 0, duration: 0.3 }, at);
  if (sidePile.length) tl.to(sidePile, { opacity: 0, duration: 0.3 }, at);
  tl.to("#cols", { opacity: 1, duration: 0.01 }, at + 0.3);
  tl.to("#barRead", { scaleY: 1, duration: 0.7, ease: "power3.out" }, at + 0.32);
  tl.to("#barSaid", { scaleY: 1, duration: 0.5, ease: "power3.out" }, at + 0.5);
  tl.to(["#numRead", "#lblRead"], { opacity: 1, duration: 0.3, ease: "power2.out" }, at + 0.9);
  tl.to(["#numSaid", "#lblSaid"], { opacity: 1, duration: 0.3, ease: "power2.out" }, at + 1.05);
}

/* ═══════════════════════════════ ph1 — s5: the ordinary chat ════════════════════ */
if (PHASE === 1) {
  var a1 = beatAt(1, 0.3);
  gsap.set("#ribbon", { y: 0 });
  gsap.set(bars.concat(vals), { opacity: 0 });
  tl.to("#ribbon", { y: FX.px(-820), duration: Math.max(D - 1.2, 3), ease: "power1.inOut" }, 0.1);
  tl.to("#counter", { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.8)" }, a1 + 0.7);
  FX.camera(tl, { at: 0, scale: 1.05, dur: D, ease: "sine.inOut" });

/* ═══════════════════════════════ ph2 — s6: the run ══════════════════════════════ */
} else if (PHASE === 2) {
  var b0 = beatAt(0, 0.0), b1 = beatAt(1, 0.19), b2 = beatAt(2, 0.59);
  gsap.set("#ribbonclip", { opacity: 0 });
  tl.to("#chip", { opacity: 1, duration: 0.4 }, 0.15);
  /* bar 1 is already tall because they pasted rows into message one — that block is re-read
     on all eight requests, which is exactly what the "curate the pile" rule is about */
  runBars(b0 + 0.5, Math.max(b2 - b0 + 3.4, 6));
  tl.to(bars[SENT.length - 1], { boxShadow: "0 0 " + FX.px(70) + " rgba(255,176,32,0.6)", duration: 0.5 }, b2 + 1.4);
  FX.camera(tl, { at: b2, scale: 1.04, dur: Math.max(D - b2 - 0.2, 0.8), ease: "sine.out" });

/* ═══════════════════════════ ph3 — s7: what it adds up to ═══════════════════════ */
} else if (PHASE === 3) {
  var c0 = beatAt(0, 0.0), c1 = beatAt(1, 0.62);
  gsap.set("#ribbonclip", { opacity: 0 });
  gsap.set(bars, { scaleY: 1 });
  gsap.set(vals, { opacity: 1 });
  if (sidePile.length) gsap.set(sidePile, { opacity: 1, scaleX: 1 });
  gsap.set(".baridx", { opacity: 1 });
  gsap.set(axis, { scaleX: 1 });
  gsap.set("#chip", { opacity: 1 });
  vals.forEach(function (n, i) { n.textContent = String(SENT[i]); });
  stackIntoColumns(c0 + 0.2);
  /* 4.5x lands between them, then everything holds DEAD STILL through the scripted pause */
  tl.to("#ratio", { opacity: 1, scale: 1, duration: 0.44, ease: "back.out(2)" }, c1 + 0.15);
  FX.camera(tl, { at: c0, scale: 1.03, dur: Math.max(c1 - c0, 1), ease: "sine.out" });

/* ══════════════════════ ph4 — Short s3: the run, vertical cut ═══════════════════ */
} else {
  var s0 = beatAt(0, 0.0), s1 = beatAt(1, 0.28), s2 = beatAt(2, 0.8);
  gsap.set("#ribbonclip", { opacity: 0 });
  tl.to("#chip", { opacity: 1, duration: 0.3 }, 0.1);
  runBars(s1 - 0.4, Math.max(s2 - s1, 4.5));
  stackIntoColumns(s2 + 0.1);
  tl.to("#ratio", { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)" }, s2 + 1.6);
  FX.camera(tl, { at: s2, scale: 1.05, dur: Math.max(D - s2 - 0.2, 0.8), ease: "sine.out" });
}

HF.register("cw-measured-run", tl);
