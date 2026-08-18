/* cw-bill — 022 s9 (phase 1) + s10 (phase 2). One file so the receipt and the pile cross the
 * boundary as the same objects in the same places.
 * Premise: the bill is not "answers", it is your OWN conversation, bought again every turn — so the
 * receipt line has to get longer while the pile gets taller, in the same frame. Then the honest
 * catch: caching genuinely shortens the line and changes NOTHING about the pile.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-bill", width: 1920, height: 1080, frames: 370, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 13, bloomX: P ? 50 : 42, bloomY: 50 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var TURNS = 6;
var PILE_Y = P ? 600 : 740;
var slabs = FX.pile(document.getElementById("pilehost"), {
  n: TURNS * 2, baseY: PILE_Y, w: P ? 620 : 560, gap: 21, seed: 41, x: P ? 50 : 32,
});
/* even index = a page you wrote, odd = a page it wrote. The distinction IS the argument. */
var mine = slabs.filter(function (_, i) { return i % 2 === 0; });
var theirs = slabs.filter(function (_, i) { return i % 2 === 1; });

document.getElementById("rhead").textContent = props.receiptHead || "read this turn";
document.getElementById("pilelbl").textContent = props.pileLabel || "the same conversation";
document.getElementById("stamp").textContent = props.stamp || "cached";
document.getElementById("qtext").textContent = props.quote || "“cached prompt prefixes still occupy the context window”";
document.getElementById("qchip").textContent = props.sourceChip || "platform docs · 2026-08-16";
document.getElementById("kicker").textContent = props.title || "You re-buy the chat. Every turn.";

/* the receipt: one row per turn, each bar LONGER than the last (relative, never a price) */
var rows = [], rbars = [];
var rrows = document.getElementById("rrows");
for (var i = 0; i < TURNS; i++) {
  var row = FX.el("rrow", rrows);
  var lbl = FX.el("rlbl", row);
  lbl.textContent = "turn " + (i + 1);
  var wrap = FX.el("rbarwrap", row);
  var bar = FX.el("rbar", wrap);
  gsap.set(bar, { scaleX: 0.16 + (i / (TURNS - 1)) * 0.84 });
  rows.push(row);
  rbars.push(bar);
}

gsap.set(slabs, { opacity: 0 });
gsap.set(rows, { opacity: 0 });
gsap.set("#receipt", { opacity: 0, y: FX.px(30) });
gsap.set("#kicker", { opacity: 0, y: FX.px(18) });
gsap.set("#pilelbl", { opacity: 0 });
gsap.set("#quote", { opacity: 0, y: FX.px(46), scale: 0.97 });

/* ═════════════════════════════ ph1 — s9: the bill ══════════════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.37), t0 + 2.6);   // "You are not buying answers."
  var t2 = Math.max(beatAt(2, 0.52), t1 + 1.2);   // "You are re-buying your own conversation…"

  tl.to("#kicker", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0 + 0.1);
  tl.to("#receipt", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, t0 + 0.25);
  tl.to("#pilelbl", { opacity: 1, duration: 0.4 }, t0 + 0.5);

  /* the run: two pages land, one receipt line prints, longer than the last */
  var step = Math.max((t1 - t0 - 0.8) / TURNS, 0.32);
  for (var k = 0; k < TURNS; k++) {
    var at = t0 + 0.55 + k * step;
    FX.fromTo(tl, slabs[k * 2], { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" }, at);
    FX.fromTo(tl, slabs[k * 2 + 1], { opacity: 0, y: FX.px(-40) }, { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" }, at + 0.1);
    FX.fromTo(tl, rows[k], { opacity: 0, x: FX.px(24) }, { opacity: 1, x: 0, duration: 0.26, ease: "power3.out" }, at + 0.16);
  }

  /* "not buying answers" — its pages go quiet */
  tl.to(theirs, { filter: "saturate(0.2) brightness(0.55)", scaleX: 0.86, duration: 0.5, ease: "power2.out" }, t1 + 0.1);
  /* "re-buying your OWN conversation" — your pages light gold */
  tl.to(mine, { backgroundColor: "#f2d38f", boxShadow: "0 " + FX.px(3) + " " + FX.px(6) + " rgba(0,0,0,0.5), 0 " + FX.px(12) + " " + FX.px(40) + " rgba(255,176,32,0.5)", duration: 0.45, ease: "power2.out", stagger: 0.05 }, t2 + 0.1);
  FX.camera(tl, { at: t2, scale: 1.04, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ═══════════════════════ ph2 — s10: cheaper to re-read, still re-read ══════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.4), u0 + 3.0);    // "But the manual I'm quoting is blunt…"
  var u2 = Math.max(beatAt(2, 0.87), u1 + 5.0);   // "Cheaper to re-read."
  var u3 = Math.max(beatAt(3, 0.95), u2 + 0.7);   // "Still re-read."

  /* opening frame = exactly where s9 ended */
  gsap.set(slabs, { opacity: 1 });
  gsap.set(rows, { opacity: 1 });
  gsap.set("#receipt", { opacity: 1, y: 0 });
  gsap.set("#pilelbl", { opacity: 1 });
  gsap.set(theirs, { filter: "saturate(0.2) brightness(0.55)", scaleX: 0.86 });
  gsap.set(mine, { backgroundColor: "#f2d38f" });
  gsap.set("#kicker", { opacity: 0 });

  /* the discount is REAL: the stamp lands and every line genuinely shortens */
  tl.to("#stamp", { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2.2)" }, u0 + 1.0);
  rbars.forEach(function (b, i) {
    tl.to(b, { scaleX: "*=0.42", duration: 0.5, ease: "power3.out" }, u0 + 1.15 + i * 0.06);
  });
  /* and the pile does not lose a single page — that contradiction IS the beat */
  tl.fromTo(document.getElementById("pilehost"), { x: 0 }, { x: FX.px(-6), duration: 0.1, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, u0 + 1.5);

  tl.to("#quote", { opacity: 1, y: 0, scale: 1, duration: 0.46, ease: "power3.out" }, u1 + 0.2);
  tl.to("#receipt", { opacity: 0.35, duration: 0.5 }, u1 + 0.3);

  /* two hard beats on the same plate */
  tl.to("#quote", { scale: 1.035, duration: 0.16, ease: "power3.out" }, u2);
  tl.to("#quote", { scale: 1, duration: 0.24, ease: "power2.out" }, u2 + 0.16);
  tl.to("#kicker", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, u3);
  tl.to("#quote", { scale: 1.035, duration: 0.16, ease: "power3.out" }, u3);
  tl.to("#quote", { scale: 1, duration: 0.24, ease: "power2.out" }, u3 + 0.16);
  FX.camera(tl, { at: u3, scale: 1.03, dur: Math.max(D - u3 - 0.2, 0.6), ease: "sine.out" });
}

HF.register("cw-bill", tl);
