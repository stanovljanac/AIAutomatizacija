/* ats-budget-spill — 023 Short s1 (hook hero, portrait).
 *
 * Premise: the Short's hook is never the mechanism — it opens on what the viewer recognises (a note
 * they could have pasted themselves) and hands off. The total spills into that note's words and more
 * than half of it lands on the one word that means nothing, before the readout proves it was
 * measured rather than asserted.
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "ats-budget-spill", width: 1080, height: 1920, frames: 270, beatLo: 0.0, beatHi: 0.15 });
var D = S.D, beatAt = S.beatAt, props = S.props;
FX.init(S, { palette: "hero", dust: 22, seed: 11, bloomX: 50, bloomY: 44 });

var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* the note, with the fact it is hiding */
var NOTE = props.note || "Notes for the invoice run. The vendor code for Ridgeway is RW-88. Now write the Ridgeway summary.";
var FACT = props.factSpan || "RW-88";
var noteEl = document.getElementById("note");
var cut = NOTE.indexOf(FACT);
if (cut >= 0) {
  noteEl.appendChild(document.createTextNode(NOTE.slice(0, cut)));
  var em = FX.el("fact", noteEl, "span");
  em.textContent = FACT;
  noteEl.appendChild(document.createTextNode(NOTE.slice(cut + FACT.length)));
} else {
  noteEl.textContent = NOTE;
}

/* the words that share what is left after the first one takes its cut */
var TOKENS = ["Notes", "for", "the", "invoice", "run", "The", "vendor", "code", "RW-88"];
var SHARES = [0.53, 0.04, 0.03, 0.07, 0.05, 0.04, 0.08, 0.08, 0.08];
var host = document.getElementById("tokrow");
var wraps = [], bars = [];
TOKENS.forEach(function (t, i) {
  var w = FX.el("tw" + (i === 0 ? " sink" : ""), host);
  var cap = FX.el("tcap", w);
  cap.textContent = t;
  var bw = FX.el("tbarwrap", w);
  var b = FX.el("tbar", bw);
  wraps.push(w);
  bars.push(b);
});

document.getElementById("hlbl").textContent = props.headlineLabel || "to the first word";
document.getElementById("readout").textContent =
  "gpt2 · 12 layers × 12 heads\nrow sums  1.0000000  (max dev 6.0e-7)\ntoken 0 \"Notes\"  0.5326";

var b1 = beatAt(1, 0.62);                       // "I measured it."

gsap.set("#bfill", { scaleX: 1 });
gsap.set(bars, { scaleY: 0 });
gsap.set(wraps, { opacity: 0, y: FX.px(12) });
gsap.set("#headline", { opacity: 0, x: FX.px(-16) });
gsap.set("#readout", { opacity: 0, y: FX.px(14) });

/* the opening frame is ALREADY the note under a full bar — a hook cannot fade up (D-060) */
var t0 = beatAt(0, 0.0);
wraps.forEach(function (w, i) {
  FX.fromTo(tl, w, { opacity: 0, y: FX.px(12) }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, t0 + 0.15 + i * 0.06);
});

/* the spill: the bar empties, the slivers land first, and the sink lands last and hard */
tl.to("#bfill", { scaleX: 0.02, duration: 1.0, ease: "power2.inOut" }, t0 + 0.75);
TOKENS.forEach(function (_, i) {
  if (i === 0) return;
  tl.to(bars[i], { scaleY: SHARES[i] / 0.53, duration: 0.24, ease: "power3.out" }, t0 + 0.8 + i * 0.07);
});
tl.to(bars[0], { scaleY: 1, duration: 0.5, ease: "power4.out" }, t0 + 1.5);
tl.to(wraps[0], { scale: 1.07, duration: 0.18, ease: "power3.out" }, t0 + 1.5);
tl.to(wraps[0], { scale: 1, duration: 0.34, ease: "power2.out" }, t0 + 1.68);
tl.to("#headline", { opacity: 1, x: 0, duration: 0.36, ease: "power3.out" }, t0 + 1.55);
FX.count(tl, document.getElementById("hbig"), {
  from: 0, to: 53, at: t0 + 1.55, dur: 0.65,
  fmt: function (v) { return Math.round(v) + "%"; },
});

/* "I measured it." — the instrument, stamped in */
tl.to("#readout", { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, b1);
FX.camera(tl, { at: b1, scale: 1.03, dur: Math.max(D - b1 - 0.15, 0.6), ease: "sine.out" });

HF.register("ats-budget-spill", tl);
