/* cw-position — 022 s11 (phase 1) + s12 (phase 2).
 * Premise: "where it sits matters" is a claim about ONE object, so one object carries both scenes —
 * a gold, readable page. It drifts into the middle of the pile, then rides the published U curve.
 * The curve and the page are drawn from the SAME function, so the page cannot lie about the shape.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-position", width: 1920, height: 1080, frames: 231, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 27, bloomY: 48 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("pagetext").textContent = props.fact || "the invoice date format is day first";
document.getElementById("chip").textContent = props.sourceChip || "Lost in the Middle · Liu et al. · TACL 2024";
var TITLE = props.title == null ? "Where it sits matters." : props.title;
document.getElementById("kicker").textContent = TITLE;
document.getElementById("axStart").textContent = props.axStart || "start of the input";
document.getElementById("axMid").textContent = props.axMid || "middle";
document.getElementById("axEnd").textContent = props.axEnd || "end";
document.getElementById("yLbl").textContent = props.yLabel || "recalled";

/* ── the readable column of pages (both phases open on it) ───────────────────── */
var COL_TOP = P ? 420 : 210, PITCH = P ? 44 : 40, NROWS = 13;
var colhost = document.getElementById("colhost");
var rowsr = FX.rng(19), col = [];
for (var i = 0; i < NROWS; i++) {
  var s = FX.el("fx-slab", colhost);
  s.style.width = FX.px((P ? 720 : 700) * (0.86 + rowsr() * 0.14));
  s.style.height = FX.px(20);
  s.style.top = FX.px(COL_TOP + i * PITCH);
  s.style.left = "50%";
  gsap.set(s, { xPercent: -50 });
  col.push(s);
}

/* ── the measured shape: high at both ends, sagging in the middle ─────────────── */
var X0 = P ? 90 : 260, XW = P ? 900 : 1400;
var YTOP = P ? 700 : 200, YH = P ? 520 : 520;
/** recall(x), x in [0,1] — one function for the curve AND for the page riding it */
function recall(x) { return 1 - 0.62 * Math.pow(Math.sin(Math.PI * x), 1.5); }
function py(x) { return (1 - recall(x)) * YH * 0.86 + 40; }        // svg-space y
var d = "";
for (var k = 0; k <= 60; k++) {
  var x = k / 60;
  d += (k ? " L " : "M ") + (x * 1400).toFixed(1) + " " + py(x).toFixed(1);
}
var curve = document.getElementById("curve");
curve.setAttribute("d", d);
var LEN = 3000;
gsap.set(curve, { strokeDasharray: LEN, strokeDashoffset: LEN });

/** frame-space position of the page when it sits at input-position x */
function pageAt(x) { return { x: X0 + x * XW, y: YTOP + (py(x) / 520) * YH }; }

var page = document.getElementById("page");
gsap.set(page, { xPercent: -50, yPercent: -50 });
gsap.set(["#plot", "#axisline", "#axStart", "#axMid", "#axEnd", "#yLbl", "#chip", "#kicker"], { opacity: 0 });

/* ═════════════════ ph1 — s11: the fact drifts toward the middle ═════════════════ */
if (PHASE === 1) {
  var t1 = beatAt(1, 0.55);   // "A fact does not count the same everywhere on the desk."
  var topRow = COL_TOP + 1 * PITCH, midRow = COL_TOP + 6 * PITCH;
  gsap.set(page, { x: FX.px(960), y: FX.px(topRow + 10) });
  gsap.set(col[1], { opacity: 0 });

  tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, 0.15);
  /* nothing else moves — deliberately calm; only the gold page travels */
  tl.to(page, { y: FX.px(midRow + 10), duration: Math.max(D - t1 - 0.4, 2.4), ease: "power1.inOut" }, t1);
  tl.to(col[6], { opacity: 0.25, duration: 0.5 }, t1 + 0.4);
  tl.to(col, { filter: "brightness(0.72)", duration: 0.7, ease: "sine.out" }, t1 + 0.2);
  FX.camera(tl, { at: t1, scale: 1.04, dur: Math.max(D - t1 - 0.2, 1), ease: "sine.inOut" });

/* ══════════════════════ ph2 — s12: the page rides the curve ════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.12), u0 + 1.6);   // "They took one relevant paragraph…"
  var u2 = Math.max(beatAt(2, 0.52), u1 + 6.0);   // "Accuracy was highest at the beginning or end…"

  /* the column lifts away and the plot takes the stage */
  gsap.set(page, { x: FX.px(pageAt(0.12).x), y: FX.px(pageAt(0.12).y) });
  tl.to(col, { opacity: 0, y: FX.px(-40), duration: 0.4, ease: "power2.in", stagger: 0.02 }, u0 + 0.1);
  tl.to(["#plot", "#axisline"], { opacity: 1, duration: 0.3 }, u0 + 0.5);
  tl.to(curve, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, u0 + 0.6);
  tl.to(["#axStart", "#axMid", "#axEnd", "#yLbl"], { opacity: 1, duration: 0.35, stagger: 0.1 }, u0 + 1.2);
  tl.to("#chip", { opacity: 1, duration: 0.4 }, u0 + 1.0);

  /* the page moves through every position, and its height IS the measured recall */
  var ride = { x: 0.12 };
  var span = Math.max(u2 - u1 - 0.3, 2.5);
  tl.to(ride, {
    x: 0.5, duration: span * 0.55, ease: "power1.inOut",
    onUpdate: function () { var p = pageAt(ride.x); gsap.set(page, { x: FX.px(p.x), y: FX.px(p.y) }); },
  }, u1 + 0.2);
  tl.to(ride, {
    x: 0.88, duration: span * 0.45, ease: "power1.inOut",
    onUpdate: function () { var p = pageAt(ride.x); gsap.set(page, { x: FX.px(p.x), y: FX.px(p.y) }); },
  }, u1 + 0.2 + span * 0.55);
  /* the sag is the finding — it lands hardest at the bottom of the curve */
  tl.to(page, { filter: "brightness(0.6) saturate(0.5)", duration: 0.5 }, u1 + 0.2 + span * 0.42);
  tl.to(page, { filter: "brightness(1) saturate(1)", duration: 0.5 }, u1 + 0.2 + span * 0.78);
  if (TITLE) tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, u2 + 0.2);
  FX.camera(tl, { at: u2, scale: 1.03, dur: Math.max(D - u2 - 0.2, 0.8), ease: "sine.out" });
}

HF.register("cw-position", tl);
