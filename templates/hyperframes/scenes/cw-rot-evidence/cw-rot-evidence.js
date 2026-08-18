/* cw-rot-evidence — 022 s16 (phase 1) + s17 (phase 2).
 * Premise: two published results, drawn as what they actually measured. The Chroma finding is
 * NON-UNIFORM, increasingly unreliable use of context — so the bars WOBBLE downward, they do not
 * fall in a clean line (that distinction is the claim we walked back during review). NoLiMa is a
 * count against a line: eleven of thirteen below half their own short-input score at 32k.
 * Deterministic, seek-driven. VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,
 * revealsSeconds[], props{}
 */
var S = HF.scene({ id: "cw-rot-evidence", width: 1920, height: 1080, frames: 556, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 18, seed: 61, bloomY: 46 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

document.getElementById("chip").textContent = props.sourceChip || (PHASE === 2 ? "NoLiMa · ICML 2025" : "Context Rot · Chroma · 2025");
document.getElementById("kicker").textContent = props.title || (PHASE === 2 ? "11 of 13 below half" : "18 of 18 got worse");
document.getElementById("slbl").textContent = props.sliderLabel || "input length →";
document.getElementById("llbl").textContent = props.limitLabel || "the documented limit";
document.getElementById("blbl").textContent = props.bracketLabel || "it degrades in here — long before the wall";
document.getElementById("hlbl").textContent = props.halfLabel || "half its own short-input score";

/* ══════════════════════ ph1 — s16: eighteen, none exempt ═══════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);
  var t1 = Math.max(beatAt(1, 0.55), t0 + 3.0);   // "Not one of them used its context evenly…"
  var t2 = Math.max(beatAt(2, 0.9), t1 + 4.0);    // "Not at the limit."
  var t3 = Math.max(beatAt(3, 0.96), t2 + 0.8);   // "Long before it."

  var host = document.getElementById("grid18");
  var COLS = 6, CW = 230, CH = 140;
  var fills = [], chips = [];
  var rr = FX.rng(71);
  for (var i = 0; i < 18; i++) {
    var c = FX.el("mchip", host);
    c.style.left = FX.px((i % COLS) * CW);
    c.style.top = FX.px(Math.floor(i / COLS) * CH);
    FX.el("mdot", c);
    var tr = FX.el("mtrack", c);
    var f = FX.el("mfill", tr);
    f._end = 0.24 + rr() * 0.3;          // where this model ends up — every one of them lower
    f._wob = 0.05 + rr() * 0.07;         // and none of them smooth about it
    fills.push(f);
    chips.push(c);
  }
  gsap.set(chips, { opacity: 0, y: FX.px(22) });
  gsap.set(fills, { scaleX: 1 });
  gsap.set(["#slider", "#limit", "#bracket", "#chip", "#kicker"], { opacity: 0 });

  tl.to(chips, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", stagger: 0.035 }, t0 + 0.15);
  tl.to("#chip", { opacity: 1, duration: 0.35 }, t0 + 0.8);
  tl.to("#slider", { opacity: 1, duration: 0.35 }, t1 - 1.6);

  /* scale the input, and watch every single bar become unreliable */
  var run = Math.max(t2 - t1 + 1.0, 3.4);
  tl.to("#knob", { x: FX.px(1180), duration: run, ease: "none" }, t1 - 1.2);
  tl.to("#slbl", { x: FX.px(1180), duration: run, ease: "none" }, t1 - 1.2);
  fills.forEach(function (f, i) {
    var start = t1 - 1.0 + i * 0.07;
    tl.to(f, { scaleX: f._end, duration: run * 0.8, ease: "power1.inOut" }, start);
    /* the wobble: performance grows increasingly UNRELIABLE, not neatly worse */
    tl.to(f, { scaleX: "+=" + f._wob, duration: 0.34, yoyo: true, repeat: 5, ease: "sine.inOut" }, start + 0.5);
    tl.to(f, { background: "linear-gradient(90deg, #ffb020, #ff5c5c)", duration: 0.8 }, start + run * 0.4);
  });

  /* and the limit is nowhere near where the trouble started */
  tl.to("#limit", { opacity: 1, duration: 0.4 }, t2 + 0.1);
  FX.fromTo(tl, "#bracket", { opacity: 0, scaleX: 0.2 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.out" }, t3 + 0.05);
  tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, t3 + 0.3);
  FX.camera(tl, { at: t2, scale: 1.03, dur: Math.max(D - t2 - 0.2, 0.8), ease: "sine.out" });

/* ═════════════════ ph2 — s17: eleven of thirteen, below the line ═══════════════ */
} else {
  var u0 = beatAt(0, 0.0);
  var u1 = Math.max(beatAt(1, 0.55), u0 + 4.0);   // "At thirty-two thousand tokens…"

  var barsHost = document.getElementById("bars13");
  var BASE = 760, HFULL = 470, BW = 92, GAPB = 26;
  var N = 13, TOT = N * BW + (N - 1) * GAPB, X0 = 960 - TOT / 2;
  var rr2 = FX.rng(83);
  var bars = [];
  for (var j = 0; j < N; j++) {
    var b = FX.el("b13", barsHost);
    b.style.left = FX.px(X0 + j * (BW + GAPB));
    b.style.width = FX.px(BW);
    b.style.height = FX.px(HFULL);
    b.style.top = FX.px(BASE - HFULL);
    b.style.bottom = "auto";
    /* eleven land below half; two survive above it. The counts are the finding. */
    b._to = j < 11 ? 0.16 + rr2() * 0.28 : 0.58 + rr2() * 0.2;
    b._fell = j < 11;
    bars.push(b);
  }
  var half = document.getElementById("halfline");
  half.style.top = FX.px(BASE - HFULL * 0.5);

  gsap.set(bars, { scaleY: 0 });
  gsap.set(["#chip", "#kicker", "#tally"], { opacity: 0 });
  gsap.set(["#slider", "#limit", "#bracket"], { opacity: 0 });
  gsap.set(half, { opacity: 0, scaleX: 0 });

  tl.to(bars, { scaleY: 1, duration: 0.34, ease: "back.out(1.4)", stagger: 0.05 }, u0 + 0.15);
  tl.to("#chip", { opacity: 1, duration: 0.35 }, u0 + 0.8);
  tl.to(half, { opacity: 1, scaleX: 1, duration: 0.6, ease: "power3.out" }, u0 + 1.4);

  /* the input is scaled, and eleven of them drop under the line, counted off in gold */
  var tally = document.getElementById("tally");
  var GOLD_BG = "linear-gradient(180deg, #ffd37a 0%, #ffb020 60%, #cf8a0e 100%)";
  var fellCount = 0, firstFall = null, lastFall = null;
  bars.forEach(function (b, j) {
    var at = u1 + 0.25 + j * 0.22;
    tl.to(b, { scaleY: b._to, duration: 0.5, ease: "power2.in" }, at);
    if (b._fell) {
      fellCount++;
      if (firstFall === null) firstFall = at + 0.3;
      lastFall = at + 0.3;
      tl.to(b, { backgroundImage: GOLD_BG, duration: 0.25 }, at + 0.3);
    }
  });
  /* the tally ticks with the falls — one counter, not thirteen */
  FX.count(tl, tally, { from: 0, to: fellCount, at: firstFall, dur: Math.max(lastFall - firstFall, 0.4), ease: "none", fmt: function (v) { return Math.round(v) + " / 13"; } });
  tl.to("#tally", { opacity: 1, duration: 0.3 }, u1 + 0.5);
  tl.to("#kicker", { opacity: 1, duration: 0.4, ease: "power3.out" }, u1 + 3.4);
  FX.camera(tl, { at: u1, scale: 1.04, dur: Math.max(D - u1 - 0.2, 1), ease: "sine.out" });
}

HF.register("cw-rot-evidence", tl);
