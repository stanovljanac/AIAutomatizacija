/* cw-prompt-shape — 022 s13 (phase 1) + s14 (phase 2).
 * Premise: the claim is about POSITION inside one prompt, so it has to be one prompt block on screen
 * the whole time — the gold line is buried and lost, then lifted to the bottom and kept. Phase 2 then
 * turns that into the reusable shape: task on top, question last, the bulk quiet in between.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-prompt-shape", width: 1920, height: 1080, frames: 340, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 16, seed: 37, bloomY: 44 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("taskText").textContent = props.task || "TASK — normalise this due-date column to day-first";
document.getElementById("qText").textContent = props.question || "QUESTION — which rows did you have to guess?";
document.getElementById("kicker").textContent = props.title || "Same fact. Different position.";

/* the wall: real prompt-shaped filler with ONE readable gold line inside it */
var linesHost = document.getElementById("lines");
var NL = P ? 22 : 15, LP = P ? 42 : 38;
var r = FX.rng(29), lns = [];
for (var i = 0; i < NL; i++) {
  var l = FX.el("ln", linesHost);
  l.style.top = FX.px(6 + i * LP);
  l.style.left = FX.px(2 + Math.round(r() * 20));
  l.style.width = FX.px((P ? 830 : 1120) * (0.42 + r() * 0.56));
  lns.push(l);
}
var gold = FX.el("gold", document.getElementById("block"), "div");
gold.textContent = props.fact || "the invoice date format is day first";
var MID_Y = 34 + Math.floor(NL / 2) * LP + 6;
var BOT_Y = 34 + (NL - 1) * LP - 4;
gsap.set(gold, { y: FX.px(MID_Y) });
gsap.set(["#bandTask", "#bandQ"], { opacity: 0 });
gsap.set(["#brkTop", "#brkBot"], { scaleX: 0 });
gsap.set("#kicker", { opacity: 0, y: FX.px(16) });
document.getElementById("bandTask").style.top = FX.px(24);
var BH = P ? 1000 : 640;
document.getElementById("bandQ").style.top = FX.px(BH - 96);

/* ══════════════════ ph1 — s13: buried in the middle, then moved ════════════════ */
if (PHASE === 1) {
  var t1 = beatAt(1, 0.2);    // "Only its position did."
  var t2 = beatAt(2, 0.34);   // "Bury the one line that matters…"

  tl.to("#kicker", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.2);
  /* the wall closes over it: everything else brightens slightly, the gold line loses its light */
  tl.to(lns, { backgroundColor: "rgba(126,148,172,0.62)", duration: 0.8, ease: "sine.out", stagger: { each: 0.02, from: "center" } }, t1 + 0.1);
  tl.to(gold, { filter: "saturate(0.12) brightness(0.5)", duration: 0.9, ease: "sine.inOut" }, t1 + 0.5);
  tl.to(gold, { boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.9 }, t1 + 0.5);

  /* the same line lifts out and re-seats at the bottom — and it stays readable there */
  tl.to(gold, { y: FX.px(MID_Y - 46), scale: 1.04, duration: 0.32, ease: "power3.out" }, t2 + 0.4);
  tl.to(gold, { y: FX.px(BOT_Y), scale: 1, duration: 0.6, ease: "power3.inOut" }, t2 + 0.72);
  tl.to(gold, { filter: "saturate(1) brightness(1)", duration: 0.5 }, t2 + 0.8);
  tl.to(gold, { boxShadow: "0 " + FX.px(3) + " " + FX.px(6) + " rgba(0,0,0,0.5), 0 " + FX.px(14) + " " + FX.px(46) + " rgba(255,176,32,0.55)", duration: 0.5 }, t2 + 0.9);
  tl.to(lns, { backgroundColor: "rgba(126,148,172,0.3)", duration: 0.6, ease: "sine.out" }, t2 + 0.9);
  FX.camera(tl, { at: t2, scale: 1.03, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ═══════════════ ph2 — s14: the shape (task on top, question last) ═════════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.26), u0 + 1.4);   // "Task at the top, question at the bottom."
  var u2 = Math.max(beatAt(2, 0.6), u1 + 1.6);    // "The middle of a long prompt is where things go quiet."

  /* opens exactly where s13 ended: the gold line already at the bottom */
  gsap.set(gold, { y: FX.px(BOT_Y) });
  gsap.set(lns, { backgroundColor: "rgba(126,148,172,0.3)" });

  /* one continuous reorganisation — the block never reflows, layers just move */
  tl.to(lns, { y: FX.px(58), duration: 0.5, ease: "power3.inOut" }, u1 - 0.5);
  tl.to(gold, { opacity: 0, duration: 0.25, ease: "power2.in" }, u1 - 0.5);
  FX.fromTo(tl, "#bandTask", { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u1 - 0.35);
  FX.fromTo(tl, "#bandQ", { opacity: 0, y: FX.px(40) }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u1 + 0.15);
  tl.to("#brkTop", { scaleX: 1, duration: 0.32, ease: "power3.out" }, u1 + 0.1);
  tl.to("#brkBot", { scaleX: 1, duration: 0.32, ease: "power3.out" }, u1 + 0.45);

  /* the middle goes quiet — the claim, drawn */
  tl.to(lns, { backgroundColor: "rgba(96,114,134,0.20)", duration: 0.7, ease: "sine.out" }, u2);
  tl.to("#kicker", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u2 + 0.2);
  /* and then NOTHING moves over the text — this is the frame people screenshot */
}

document.getElementById("brkTop").style.top = FX.px(10);
document.getElementById("brkBot").style.top = FX.px(BH - 14);

HF.register("cw-prompt-shape", tl);
