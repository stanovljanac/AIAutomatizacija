/* at-budget-bar — 023 s2 (ph1: the mechanism) + s3 (ph2: the hard edge).
 *
 * Premise: attention is a fixed total, and this is the object that says so. The five things you
 * handed the model are REAL documents with readable text; the next word scores itself against every
 * one of them; the scores come back as slices that fill the bar EXACTLY. Then ph2 refuses the
 * comfortable reading — "up to one" is drawn, struck and replaced, and the window contents change
 * underneath a bar that does not move.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "at-budget-bar", width: 1920, height: 1080, frames: 525, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 22, seed: 9, bloomX: P ? 50 : 44, bloomY: 34 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* ── the documents: what the budget is actually spent on ─────────────────────── */
var DOCS = [
  {
    title: "onboarding brief",
    lines: ["Ridgeway was onboarded in", "March. Contact is the accounts", "desk, not the site manager.", "Terms were agreed by email.", "Site visits are booked a week", "ahead through the same desk.", "Purchase orders are raised", "monthly, not per delivery.", "Escalations go to the account", "lead before the supplier."],
  },
  {
    title: "the contract",
    lines: ["§4 Payment. Net thirty from", "the invoice date. Late fees", "apply after forty-five days.", "§9 Renewal is automatic", "unless cancelled in writing", "sixty days before the term.", "§11 Disputed lines are held,", "the rest of the invoice is", "still due on the same date.", "§14 Notices go by email."],
  },
  {
    title: "last quarter's notes",
    lines: ["Q2 volumes held steady.", "Two credit notes issued in", "May, both resolved.", "No open disputes.", "Delivery times improved", "after the depot change.", "One short shipment in June,", "credited the same week.", "Contact list unchanged.", "Review booked for October."],
  },
  {
    title: "the vendor sheet",
    lines: ["Ridgeway Supplies Ltd", "vendor code RW-88", "invoice run: August", "status: active", "terms: net 30", "currency: local", "category: supplies", "owner: accounts desk", "last updated: 12 Aug", "duplicate check: clean"],
    key: 1,
  },
  {
    title: "your question",
    lines: ["Which vendor code goes", "on the August invoice", "for Ridgeway?", "", "Answer with the code only.", "Do not summarise the", "contract. Do not restate", "the brief. The code is in", "one of the pages above."],
    q: true,
  },
];
var SHARES = [0.14, 0.21, 0.09, 0.34, 0.22];   // the slices, in document order — they sum to 1.00

var docsHost = document.getElementById("docs");
var docEls = [], scoreEls = [];
DOCS.forEach(function (d, i) {
  var el = FX.el("doc" + (d.q ? " q" : ""), docsHost);
  var t = FX.el("dtitle", el);
  t.textContent = d.title;
  d.lines.forEach(function (ln, k) {
    var l = FX.el("dline" + (d.key === k ? " k" : ""), el);
    l.textContent = ln;
  });
  var sc = FX.el("dscore", el);
  sc.textContent = SHARES[i].toFixed(2);
  docEls.push(el);
  scoreEls.push(sc);
});

/* ── the bar's slices, one per document ──────────────────────────────────────── */
var slicesHost = document.getElementById("slices");
var sliceEls = [];
SHARES.forEach(function (s, i) {
  var el = FX.el("slice", slicesHost);
  el.style.width = s * 100 + "%";
  var v = FX.el("sval", el);
  v.textContent = s.toFixed(2);
  sliceEls.push(el);
});

document.getElementById("motif").textContent = props.motif || "Here's what's actually happening.";
document.getElementById("bterm").textContent = props.term || "Attention";
document.getElementById("bsum").textContent = props.total || "1.0000000";
document.getElementById("nwbox").textContent = "RW";

/* the wires: the next word reaching every single piece of text you handed it */
var wires = document.getElementById("wires");
var wireEls = [];
var NW = { x: P ? 540 : 1660, y: P ? 1300 : 560 };
DOCS.forEach(function (d, i) {
  var x = (P ? 70 : 120) + (i + 0.5) * ((P ? 940 : 1240) / DOCS.length);
  var y = P ? 690 : 370;
  var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  var mx = (x + NW.x) / 2;
  p.setAttribute("d", "M " + NW.x + " " + NW.y + " C " + mx + " " + NW.y + ", " + mx + " " + y + ", " + x + " " + y);
  wires.appendChild(p);
  var len = 1400;
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = len;
  p._len = len;
  wireEls.push(p);
});

gsap.set("#budget", { opacity: 1 });
gsap.set("#bedge", { opacity: 1 });
gsap.set(sliceEls, { scaleX: 0 });
gsap.set(scoreEls, { opacity: 0 });
gsap.set(docEls, { opacity: 0, y: FX.px(26) });

/* ══════════════════ ph1 — s2: the total, and what it is spent on ═════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.18), t0 + 2.2);    // "…a name you have heard a hundred times: attention."
  var t2 = Math.max(beatAt(2, 0.42), t1 + 2.4);    // "…it scores that word against every other piece of text"
  var t3 = Math.max(beatAt(3, 0.72), t2 + 3.2);    // "…squeezes those scores into shares that add up to exactly one."

  /* the opening frame ALREADY shows the bar the hook handed over (cut, not fade-up) */
  gsap.set("#motif", { opacity: 0, y: FX.px(-14) });
  tl.to("#motif", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, t0 + 0.05);

  /* the name */
  FX.fromTo(tl, "#bterm", { opacity: 0, y: FX.px(14) }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, t1);

  /* what is in the window — real pages, one per beat of the sentence */
  docEls.forEach(function (el, i) {
    FX.fromTo(tl, el, { opacity: 0, y: FX.px(26) }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, t1 + 0.45 + i * 0.17);
  });
  FX.fromTo(tl, "#nextword", { opacity: 0, x: FX.px(24) }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, t2 - 0.35);

  /* it scores itself against EVERY one of them */
  wireEls.forEach(function (p, i) {
    var at = t2 + 0.1 + i * 0.26;
    FX.fromTo(tl, p, { strokeDashoffset: p._len }, { strokeDashoffset: 0, duration: 0.34, ease: "power2.out" }, at);
    FX.fromTo(tl, scoreEls[i], { opacity: 0, y: FX.px(-10) }, { opacity: 1, y: 0, duration: 0.26, ease: "power3.out" }, at + 0.24);
  });

  /* and the scores are squeezed into shares that fill the bar exactly */
  sliceEls.forEach(function (el, i) {
    tl.to(el, { scaleX: 1, duration: 0.34, ease: "power3.out" }, t3 + 0.12 + i * 0.16);
    tl.to(el.firstChild, { opacity: 1, duration: 0.2 }, t3 + 0.3 + i * 0.16);
    tl.to(wireEls[i], { opacity: 0.25, duration: 0.3 }, t3 + 0.12 + i * 0.16);
  });
  FX.fromTo(tl, "#bsum", { opacity: 0 }, { opacity: 1, duration: 0.3 }, t3 + 0.12 + SHARES.length * 0.16);
  /* the last slice lands ON the edge — the beat the whole video rests on */
  tl.to("#bedge", { scaleY: 1.35, duration: 0.14, ease: "power4.out" }, t3 + 0.12 + SHARES.length * 0.16);
  tl.to("#bedge", { scaleY: 1, duration: 0.3, ease: "power2.out" }, t3 + 0.26 + SHARES.length * 0.16);
  FX.camera(tl, { at: t3, scale: 1.03, dur: Math.max(D - t3 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════ ph2 — s3: not up to one. exactly one. ════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);                          // "Not up to one."
  var u1 = Math.max(beatAt(1, 0.22), u0 + 0.8);     // "Exactly one."
  var u2 = Math.max(beatAt(2, 0.45), u1 + 1.0);     // "Every time, no matter what is in the window."

  /* opening frame = exactly where s2 ended */
  gsap.set(sliceEls, { scaleX: 1 });
  gsap.set(docEls, { opacity: 1, y: 0 });
  gsap.set(scoreEls, { opacity: 1 });
  gsap.set("#nextword", { opacity: 1 });
  gsap.set("#bterm", { opacity: 1 });
  gsap.set("#bsum", { opacity: 1 });
  gsap.set(wireEls, { strokeDashoffset: 0, opacity: 0.25 });
  gsap.set("#motif", { opacity: 0 });
  document.getElementById("bterm").textContent = props.term || "Exactly 1. Always.";

  /* "not up to one" — the comfortable version is drawn over the real one, and struck */
  tl.to(sliceEls, { opacity: 0.18, duration: 0.22 }, u0);
  FX.fromTo(tl, "#ghostfill", { opacity: 0 }, { opacity: 1, duration: 0.26, ease: "power2.out" }, u0 + 0.05);
  tl.to("#barslash", { scaleX: 1, duration: 0.24, ease: "power4.out" }, u0 + 0.42);

  /* "exactly one" — it comes back and slams to the edge */
  tl.to("#ghostfill", { opacity: 0, duration: 0.18 }, u1);
  tl.to("#barslash", { opacity: 0, duration: 0.18 }, u1);
  tl.to(sliceEls, { opacity: 1, duration: 0.2 }, u1);
  tl.to("#bedge", { scaleY: 1.5, duration: 0.12, ease: "power4.out" }, u1 + 0.06);
  tl.to("#bedge", { scaleY: 1, duration: 0.34, ease: "power2.out" }, u1 + 0.18);
  FX.fromTo(tl, "#btrack", { x: FX.px(-7) }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.4)" }, u1 + 0.06);

  /* whatever is in the window, the total is the same — the CONTENTS cycle, the bar does not move */
  var VARIANTS = props.windowVariants && props.windowVariants.length ? props.windowVariants : ["3 lines", "40 pages", "one word", "a whole contract"];
  var vval = document.getElementById("vval");
  vval.textContent = VARIANTS[0];
  FX.fromTo(tl, "#variant", { opacity: 0, y: FX.px(12) }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, u2);
  var span = Math.max(D - u2 - 0.5, 1.2);
  var step = span / VARIANTS.length;
  var vp = { i: 0 };
  tl.to(vp, {
    i: VARIANTS.length - 0.001, duration: span, ease: "none",
    onUpdate: function () { vval.textContent = VARIANTS[Math.floor(vp.i)]; },
  }, u2 + 0.2);
  /* each swap shoves the documents around; the bar is the one thing that never changes */
  VARIANTS.forEach(function (_, i) {
    var at = u2 + 0.2 + i * step;
    tl.to(docEls, { opacity: 0.34, duration: 0.14, stagger: 0.03 }, at);
    tl.to(docEls, { opacity: 1, duration: 0.2, stagger: 0.03 }, at + 0.16);
  });
}

HF.register("at-budget-bar", tl);
