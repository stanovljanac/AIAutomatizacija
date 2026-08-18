/* cw-rules — 022 s21 (phase 1) · s22 (phase 2) · s23 (phase 3).
 * Premise: takeaways land the moment they are earned, and the rail that collects them exists from
 * the first frame with its later slots reserved and empty — so the third rule never lands on top of
 * the second. Above the rail, each rule is DEMONSTRATED on the same objects the video has been
 * using: the pile, the prompt block, the five-line summary.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-rules", width: 1920, height: 1080, frames: 422, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 16, seed: 89, bloomY: 44 });

var PHASE = Number(props.phase) || 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var RULES = props.rules || ["Curate, don't dump.", "Task on top. Question last.", "New chat, five-line summary."];
["t1", "t2", "t3"].forEach(function (id, i) { document.getElementById(id).textContent = RULES[i]; });
document.getElementById("taskText").textContent = props.task || "TASK — normalise this due-date column to day-first";
document.getElementById("qText").textContent = props.question || "QUESTION — which rows did you have to guess?";

var slots = [document.getElementById("s1"), document.getElementById("s2"), document.getElementById("s3")];
var slotTexts = [document.getElementById("t1"), document.getElementById("t2"), document.getElementById("t3")];

var DESK_Y = 660;
FX.desk(document.getElementById("deskhost"), { w: 900, top: DESK_Y });
var N = 15;
var slabs = FX.pile(document.getElementById("pilehost"), { n: N, baseY: DESK_Y - 16, w: 700, gap: 20, seed: 41 });
var sweepBar = FX.sweep(document.getElementById("sweephost"), 780);
var topY = DESK_Y - 16 - (N - 1) * 20;

/* the five lines, real and legible (synthetic, invoice-flavoured) */
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
  var b = FX.el("", el, "b");
  b.textContent = parts[0];
  if (parts[1]) el.appendChild(document.createTextNode(" — " + parts[1]));
  return el;
});

/* the prompt block's filler */
var lnHost = document.getElementById("lines");
var rr = FX.rng(97);
for (var i = 0; i < 11; i++) {
  var l = FX.el("ln", lnHost);
  l.style.top = FX.px(96 + i * 32);
  l.style.left = FX.px(2 + Math.round(rr() * 16));
  l.style.width = FX.px(1040 * (0.42 + rr() * 0.56));
}

/** fill rail slot k — the rail itself is always present, so nothing ever shifts */
function fillSlot(k, at) {
  tl.to(slots[k], { borderColor: "rgba(255,176,32,0.6)", backgroundColor: "rgba(255,176,32,0.09)", duration: 0.35, ease: "power2.out" }, at);
  tl.to(slots[k].querySelector(".n"), { backgroundColor: "#ffb020", color: "#3a2a05", duration: 0.3 }, at);
  tl.to(slotTexts[k], { opacity: 1, color: "#ffd37a", duration: 0.34, ease: "power2.out" }, at + 0.06);
}

gsap.set(slotTexts, { opacity: 0 });
gsap.set(sumLines, { opacity: 0, y: FX.px(14) });
gsap.set(["#summary", "#block"], { opacity: 0 });
gsap.set(["#brkTop", "#brkBot"], { scaleX: 0 });

/* ══════════════════ ph1 — s21: curate the pile instead of growing it ═══════════ */
if (PHASE === 1) {
  var t1 = Math.max(beatAt(1, 0.11), 1.2);
  var t2 = Math.max(beatAt(2, 0.31), t1 + 2.0);
  var t3 = Math.max(beatAt(3, 0.53), t2 + 2.4);

  var folder = FX.el("folder", document.getElementById("world"));
  gsap.set(folder, { opacity: 0, y: FX.px(-60) });
  gsap.set(slabs, { opacity: 0 });

  fillSlot(0, t1 + 0.2);

  /* the whole folder goes in, and the read sweep struggles through it */
  tl.to(folder, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, t1 + 0.3);
  slabs.forEach(function (s, k) {
    FX.fromTo(tl, s, { opacity: 0, y: FX.px(-200) }, { opacity: 1, y: 0, duration: 0.28, ease: "power3.in" }, t1 + 0.6 + k * 0.05);
  });
  tl.to(folder, { opacity: 0, y: FX.px(-40), duration: 0.3 }, t1 + 1.5);
  tl.set(sweepBar, { y: FX.px(topY - 8), opacity: 0 }, t2 - 0.4);
  tl.to(sweepBar, { opacity: 1, duration: 0.1 }, t2 - 0.4);
  tl.to(sweepBar, { y: FX.px(DESK_Y - 6), duration: 2.4, ease: "none" }, t2 - 0.3);
  tl.to(sweepBar, { opacity: 0.3, duration: 0.6 }, t2 + 0.4);

  /* then all but three pages lift away, and the same sweep runs clean and fast */
  var keep = [0, 1, 2];
  slabs.forEach(function (s, k) {
    if (keep.indexOf(k) >= 0) return;
    tl.to(s, { opacity: 0, y: FX.px(-70), duration: 0.32, ease: "power2.in" }, t3 + 0.1 + k * 0.02);
  });
  tl.set(sweepBar, { y: FX.px(DESK_Y - 70), opacity: 0 }, t3 + 0.7);
  tl.to(sweepBar, { opacity: 1, duration: 0.08 }, t3 + 0.7);
  tl.to(sweepBar, { y: FX.px(DESK_Y - 6), duration: 0.3, ease: "power2.in" }, t3 + 0.75);
  tl.to(sweepBar, { opacity: 0, duration: 0.15 }, t3 + 1.05);
  FX.camera(tl, { at: t3, scale: 1.03, dur: Math.max(D - t3 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════════ ph2 — s22: the shape, now familiar ════════════════════ */
} else if (PHASE === 2) {
  var u1 = Math.max(beatAt(1, 0.2), 1.4);
  gsap.set(slabs, { opacity: 0 });
  gsap.set("#deskhost", { opacity: 0 });
  fillSlot(0, 0);
  gsap.set(slots[0], { borderColor: "rgba(255,176,32,0.6)", backgroundColor: "rgba(255,176,32,0.09)" });
  gsap.set(slotTexts[0], { opacity: 1, color: "#ffd37a" });

  tl.to("#block", { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.15);
  tl.to("#brkTop", { scaleX: 1, duration: 0.3, ease: "power3.out" }, 0.5);
  tl.to("#brkBot", { scaleX: 1, duration: 0.3, ease: "power3.out" }, 0.75);
  fillSlot(1, u1 - 0.2);
  tl.to(".ln", { backgroundColor: "rgba(96,114,134,0.18)", duration: 0.7, ease: "sine.out" }, u1 + 0.6);
  FX.camera(tl, { at: u1, scale: 1.03, dur: Math.max(D - u1 - 0.2, 0.8), ease: "sine.out" });

/* ═════════════════ ph3 — s23: a pile becomes five lines you can keep ═══════════ */
} else {
  var v0 = beatAt(0, 0.0);
  var v1 = Math.max(beatAt(1, 0.55), v0 + 3.4);   // "It feels like throwing memory away."
  var v3 = Math.max(beatAt(3, 0.85), v1 + 2.4);   // "You are just handing over a cleaner desk."

  gsap.set(slots[0], { borderColor: "rgba(255,176,32,0.6)", backgroundColor: "rgba(255,176,32,0.09)" });
  gsap.set(slots[1], { borderColor: "rgba(255,176,32,0.6)", backgroundColor: "rgba(255,176,32,0.09)" });
  gsap.set([slotTexts[0], slotTexts[1]], { opacity: 1, color: "#ffd37a" });
  gsap.set([slots[0].querySelector(".n"), slots[1].querySelector(".n")], { backgroundColor: "#ffb020", color: "#3a2a05" });
  gsap.set(slabs, { opacity: 1 });

  /* the tall messy pile compresses — it does not vanish, it becomes something smaller */
  slabs.forEach(function (s, k) {
    tl.to(s, { y: FX.px((N - 1 - k) * 20 * 0.92), scaleX: 0.5, opacity: 0, duration: 0.55, ease: "power2.in" }, v0 + 0.4 + k * 0.03);
  });
  tl.to("#deskhost", { opacity: 0.4, duration: 0.5 }, v0 + 0.6);
  tl.to("#summary", { opacity: 1, duration: 0.3 }, v0 + 1.1);
  sumLines.forEach(function (l, k) {
    FX.fromTo(tl, l, { opacity: 0, y: FX.px(16) }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, v0 + 1.2 + k * 0.16);
  });
  fillSlot(2, v1 + 0.2);
  /* the completed rail + the five lines are the screenshot: nothing moves over them */
  FX.camera(tl, { at: v0 + 1.0, scale: 1.02, dur: Math.max(v3 - v0 - 1.0, 1), ease: "sine.out" });
}

HF.register("cw-rules", tl);
