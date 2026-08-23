/* at-sink-reveal — 023 s8 (ph1: 53% to the first word) + s9 (ph2: layer by layer).
 *
 * Premise: this is the beat where the arithmetic stops being tidy. The payout is staged onto the
 * REAL token row so the viewer can see which capsule takes the money — and it is the one that means
 * nothing. ph2 then refuses to leave that as one number: all 12 layers are drawn, valued and
 * labelled, with the mean and the peak both named (a single labelled point explains nothing).
 *
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-sink-reveal", width: 1920, height: 1080, frames: 477, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 20, seed: 41, bloomX: P ? 50 : 26, bloomY: 40 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

/* the same 28 capsules the note tokenised into, and the share each one actually took */
var TOKENS = props.tokens && props.tokens.length ? props.tokens : ["Notes", " for", " the", " invoice", " run", ".", " The", " vendor", " code", " for", " Ridge", "way", " is", " RW", "-", "88", "."];
var SINK = Number(props.sinkIndex) || 0;
/* measured: the sink takes 0.53; the rest share what is left, weighted toward the content words */
var WEIGHT = TOKENS.map(function (t, i) {
  if (i === SINK) return 0;
  var w = t.replace(/\s/g, "");
  return w.length > 4 ? 3 : w.length > 2 ? 2 : 1;
});
var wsum = WEIGHT.reduce(function (a, b) { return a + b; }, 0);
var SHARES = TOKENS.map(function (t, i) { return i === SINK ? 0.53 : (0.47 * WEIGHT[i]) / wsum; });

var rowHost = document.getElementById("tokrow");
var wraps = [], bars = [], pcts = [];
TOKENS.forEach(function (t, i) {
  var w = FX.el("tokwrap" + (i === SINK ? " sink" : ""), rowHost);
  var cap = FX.el("tokcap", w);
  cap.textContent = t;
  var bw = FX.el("tokbarwrap", w);
  var b = FX.el("tokbar", bw);
  var p = FX.el("tokpct", w);
  p.textContent = (SHARES[i] * 100).toFixed(i === SINK ? 0 : 1) + "%";
  wraps.push(w);
  bars.push(b);
  pcts.push(p);
});

document.getElementById("qline").textContent = props.question || "Where did the money actually go?";
document.getElementById("hlbl").textContent = props.headlineLabel || "to the first word";
document.getElementById("tokchip").textContent = props.tokenChip || 'token 0 · "Notes"';
document.getElementById("methodchip").textContent = props.methodChip || "short note · 30 tok · every row · avg 12 layers";
document.getElementById("meaning").textContent = props.meaning || "";

/* ══════════════════ ph1 — s8: over half of it, to the first word ═════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);                         // "Then something turned up that I did not expect…"
  var t1 = Math.max(beatAt(1, 0.55), t0 + 3.0);    // "I asked where the money actually went."
  var t2 = Math.max(beatAt(2, 0.78), t1 + 1.6);    // "Over half of it went to the first word."

  gsap.set("#bfill", { scaleX: 1 });
  gsap.set(wraps, { opacity: 0, y: FX.px(14) });
  gsap.set(bars, { scaleY: 0 });
  gsap.set("#headline", { opacity: 0, x: FX.px(20) });
  gsap.set("#chart", { display: "none" });

  /* the tokens arrive as the row of things the money can go to */
  wraps.forEach(function (w, i) {
    FX.fromTo(tl, w, { opacity: 0, y: FX.px(14) }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }, t0 + 0.15 + i * 0.045);
  });
  FX.fromTo(tl, "#qline", { opacity: 0, y: FX.px(-10) }, { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t1);

  /* the bar empties INTO them — the sliver bars first, so the sink lands last and lands hard */
  tl.to("#bfill", { scaleX: 0.02, duration: 0.9, ease: "power2.inOut" }, t1 + 0.5);
  var order = wraps.map(function (_, i) { return i; }).filter(function (i) { return i !== SINK; });
  order.forEach(function (i, k) {
    tl.to(bars[i], { scaleY: SHARES[i] / 0.53, duration: 0.26, ease: "power3.out" }, t1 + 0.55 + k * 0.045);
    tl.to(pcts[i], { opacity: 0.75, duration: 0.2 }, t1 + 0.7 + k * 0.045);
  });
  /* and more than half of it slides onto the very first capsule */
  tl.to(bars[SINK], { scaleY: 1, duration: 0.55, ease: "power4.out" }, t2 + 0.1);
  tl.to(pcts[SINK], { opacity: 1, duration: 0.25 }, t2 + 0.3);
  tl.to(wraps[SINK], { scale: 1.06, duration: 0.2, ease: "power3.out" }, t2 + 0.1);
  tl.to(wraps[SINK], { scale: 1, duration: 0.35, ease: "power2.out" }, t2 + 0.3);
  tl.to("#headline", { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, t2 + 0.15);
  FX.count(tl, document.getElementById("hbig"), {
    from: 0, to: 53, at: t2 + 0.2, dur: 0.7,
    fmt: function (v) { return Math.round(v) + "%"; },
  });
  FX.camera(tl, { at: t2, scale: 1.03, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ══════════════════ ph2 — s9: layer by layer, 13% → 75% ══════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);                          // "Not the important word."
  var u1 = Math.max(beatAt(1, 0.09), u0 + 0.8);     // "The first one."
  var u2 = Math.max(beatAt(2, 0.16), u1 + 0.6);     // "In my note it was the word 'Notes' — a label…"
  var u3 = Math.max(beatAt(3, 0.38), u2 + 2.4);     // "Averaged across every layer it took fifty-three percent…"
  var u4 = Math.max(beatAt(4, 0.69), u3 + 3.0);     // "In one layer, seventy-five."

  /* opening frame: the token row is exactly where s8 left it */
  gsap.set(wraps, { opacity: 1, y: 0 });
  gsap.set(bars, { scaleY: 0 });
  gsap.set("#bfill", { scaleX: 0.02 });
  gsap.set("#headline", { display: "none" });
  gsap.set("#qline", { opacity: 0 });
  bars.forEach(function (b, i) { gsap.set(b, { scaleY: SHARES[i] / 0.53 }); });
  gsap.set(pcts, { opacity: 0.75 });
  gsap.set(pcts[SINK], { opacity: 1 });

  /* the row hands over to the chart: the token row shrinks away and the curve is built in its place */
  var CURVE = props.curve && props.curve.length ? props.curve : [13.1, 24.3, 24.9, 45.7, 52.3, 67.9, 66.9, 75.4, 67.7, 74.2, 69.8, 57.1];
  var MAXV = 80;
  var barsHost = document.getElementById("cbars");
  var cbars = [], cvals = [];
  var peakIdx = CURVE.indexOf(Math.max.apply(null, CURVE));
  CURVE.forEach(function (v, i) {
    var el = FX.el("cbar" + (i === peakIdx ? " peak" : ""), barsHost);
    el.style.height = (v / MAXV) * 100 + "%";
    var val = FX.el("cval", el);
    val.textContent = v.toFixed(0) + "%";
    var lbl = FX.el("clbl", el);
    lbl.textContent = "L" + (i + 1);
    cbars.push(el);
    cvals.push(val);
  });
  var mean = CURVE.reduce(function (a, b) { return a + b; }, 0) / CURVE.length;
  var meanEl = document.getElementById("meanline");
  meanEl.style.bottom = "calc(52px * var(--u) + " + (mean / MAXV) * 100 + "% * 0.78)";
  document.getElementById("mlbl").textContent = props.meanLabel || "53% mean";
  var peakEl = document.getElementById("peakflag");
  document.getElementById("peaklbl").textContent = props.peakLabel || "75% · layer 8";
  peakEl.style.left = (peakIdx / CURVE.length) * 100 + "%";
  peakEl.style.top = "calc(8px * var(--u))";
  document.getElementById("ctitle").textContent = props.title || "Layer by layer";

  /* the token row gives way — it slides down and dims, it is never wiped */
  tl.to("#tokrow", { y: FX.px(560), opacity: 0.3, duration: 0.7, ease: "power2.inOut" }, u0);
  tl.to("#budget", { opacity: 0.25, duration: 0.5 }, u0);
  FX.fromTo(tl, "#chart", { opacity: 0 }, { opacity: 1, duration: 0.35 }, u0 + 0.3);
  FX.fromTo(tl, "#tokchip", { opacity: 0, x: FX.px(14) }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, u1);
  FX.fromTo(tl, "#methodchip", { opacity: 0, x: FX.px(14) }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, u2 + 0.2);
  FX.fromTo(tl, "#meaning", { opacity: 0, y: FX.px(12) }, { opacity: 1, y: 0, duration: 0.34, ease: "power3.out" }, u2 + 0.6);

  /* the curve is drawn left to right, under the sentence that describes it */
  var span = Math.max(u4 - u2 - 0.4, 1.4);
  cbars.forEach(function (el, i) {
    var at = u2 + 0.3 + (i / CURVE.length) * span;
    tl.to(el, { scaleY: 1, duration: 0.3, ease: "power3.out" }, at);
    tl.to(cvals[i], { opacity: 1, duration: 0.2 }, at + 0.14);
  });
  FX.fromTo(tl, "#meanline", { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }, u3 + 0.2);
  FX.fromTo(tl, "#peakflag", { opacity: 0, y: FX.px(-10) }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, u4 + 0.1);
  tl.to(cbars[peakIdx], { filter: "brightness(1.25)", duration: 0.25 }, u4 + 0.1);
  FX.camera(tl, { at: u4, scale: 1.02, dur: Math.max(D - u4 - 0.2, 0.6), ease: "sine.out" });
}

HF.register("at-sink-reveal", tl);
