/* at-pair-price — 023 s18 (ph1: 900 vs 55,696) + s19 (ph2: softened, not removed).
 *
 * Premise: "quadratic" is a word; an area is a picture. Both grids are drawn at the SAME cell size,
 * so the padded note's grid runs off the frame and the viewer sees the cost instead of being told
 * it. The counters only confirm what the area already said. ph2 then concedes honestly — real
 * mitigations take real cells out — and scopes the concession with the chip the owner added
 * pre-voice: for full attention, every pair is still scored.
 *
 * The grids are drawn on canvas with a deterministic reveal driven by a property tween (no
 * callbacks: the capture engine seeks).
 *
 * VARIABLES CONTRACT: fps,width,height,durationFrames,durationSeconds,revealsSeconds[],props{}
 */
var S = HF.scene({ id: "at-pair-price", width: 1920, height: 1080, frames: 469, beatLo: 0.0, beatHi: 0.2 });
var D = S.D, beatAt = S.beatAt, props = S.props, P = S.portrait;
FX.init(S, { palette: "body", dust: 16, seed: 97, bloomX: 40, bloomY: 40 });

var PHASE = Number(props.phase) === 2 ? 2 : 1;
var tl = gsap.timeline({ paused: true });
FX.ambient(tl, { push: false });

var A = props.a || { tokens: 30, pairs: 900, label: "the short note" };
var B = props.b || { tokens: 236, pairs: 55696, label: "the padded one" };

document.getElementById("glblA").textContent = A.label + " · " + A.tokens + " tokens";
document.getElementById("glblB").textContent = B.label + " · " + B.tokens + " tokens";
document.getElementById("gsubA").textContent = A.tokens + " x " + A.tokens + " comparisons";
document.getElementById("gsubB").textContent = B.tokens + " x " + B.tokens + " comparisons";
document.getElementById("arith").textContent = props.arithmeticChip || "arithmetic · n squared per head per layer";

/* ── the two grids, same cell size ───────────────────────────────────────────── */
function grid(canvasId, n, cell, cols) {
  var c = document.getElementById(canvasId);
  var g = c.getContext("2d");
  var w = cols * cell;
  c.width = w;
  c.height = w;
  return {
    ctx: g, n: n, cell: cell, cols: cols, size: w,
    /* draw the first `frac` of the grid, row-major */
    draw: function (frac, dim) {
      var total = this.cols * this.cols;
      var upto = Math.floor(total * HF.cl(frac, 0, 1));
      g.clearRect(0, 0, this.size, this.size);
      for (var i = 0; i < upto; i++) {
        var cx = (i % this.cols) * this.cell, cy = Math.floor(i / this.cols) * this.cell;
        var lit = !dim || !dim(i % this.cols, Math.floor(i / this.cols));
        g.fillStyle = lit ? "rgba(255,176,32,0.85)" : "rgba(90,110,132,0.30)";
        g.fillRect(cx + 1, cy + 1, this.cell - 2, this.cell - 2);
      }
    },
  };
}
/* the cell is the SAME in both grids — that is the whole point of the comparison */
var CELL = 10;
var gA = grid("gcA", A.tokens, CELL, 30);
var gB = grid("gcB", B.tokens, CELL, 90);   // 90x90 shown of 236x236; the rest runs off the frame

/* ══════════════════ ph1 — s18: the two counts ═══════════════════════════════ */
if (PHASE === 1) {
  var t0 = beatAt(0, 0.0);                          // "My short note was thirty tokens: nine hundred comparisons."
  var t1 = Math.max(beatAt(1, 0.28), t0 + 3.4);     // "The padded one, two hundred and thirty-six tokens: fifty-five thousand…"
  var t2 = Math.max(beatAt(2, 0.70), t1 + 5.0);     // "Just under eight times the text."
  var t3 = Math.max(beatAt(3, 0.84), t2 + 1.4);     // "Sixty-two times the work."

  gsap.set(["#mits", "#scope", "#verdict"], { display: "none" });
  gsap.set("#gwA", { opacity: 0, y: FX.px(16) });
  gsap.set("#gwB", { opacity: 0, y: FX.px(16) });
  gsap.set("#ratios", { opacity: 0, x: FX.px(18) });

  tl.to("#gwA", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t0);
  var pa = { f: 0 };
  tl.to(pa, {
    f: 1, duration: Math.max(t1 - t0 - 0.6, 1.0), ease: "power1.inOut",
    onUpdate: function () { gA.draw(pa.f); },
  }, t0 + 0.2);
  FX.count(tl, document.getElementById("gcntA"), { from: 0, to: A.pairs, at: t0 + 0.3, dur: Math.max(t1 - t0 - 0.6, 1.0), fmt: FX.comma });

  /* the padded grid at the SAME cell size — it does not fit, and that is the point */
  tl.to("#gwB", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, t1);
  var pb = { f: 0 };
  tl.to(pb, {
    f: 1, duration: Math.max(t2 - t1 - 0.4, 1.2), ease: "power1.inOut",
    onUpdate: function () { gB.draw(pb.f); },
  }, t1 + 0.15);
  FX.count(tl, document.getElementById("gcntB"), { from: 0, to: B.pairs, at: t1 + 0.2, dur: Math.max(t2 - t1 - 0.4, 1.2), fmt: FX.comma });

  document.getElementById("rtText").textContent = props.textRatio || "7.9x the text";
  document.getElementById("rtWork").textContent = props.workRatio || "62x the work";
  tl.to("#ratios", { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" }, t2);
  FX.fromTo(tl, "#rtWork", { scale: 0.86 }, { scale: 1, duration: 0.36, ease: "back.out(2)" }, t3);
  FX.fromTo(tl, "#arith", { opacity: 0, y: FX.px(10) }, { opacity: 1, y: 0, duration: 0.3 }, t3 + 0.3);
  FX.camera(tl, { at: t3, scale: 1.02, dur: Math.max(D - t3 - 0.2, 0.6), ease: "sine.out" });

/* ══════════════════ ph2 — s19: softened, not removed ════════════════════════ */
} else {
  var u0 = beatAt(0, 0.0);                          // "Real systems fight that with caching and clever shortcuts…"
  var u1 = Math.max(beatAt(1, 0.52), u0 + 3.4);     // "But for full attention, the underlying quadratic cost is still there."

  /* opening frame = the big grid exactly as s18 left it */
  gsap.set("#gwA", { opacity: 0.25 });
  gsap.set("#gwB", { opacity: 1, y: 0 });
  gsap.set("#ratios", { display: "none" });
  gsap.set("#arith", { display: "none" });
  gA.draw(1);
  gB.draw(1);
  document.getElementById("gcntA").textContent = FX.comma(A.pairs);
  document.getElementById("gcntB").textContent = FX.comma(B.pairs);

  var MITS = props.softened && props.softened.length ? props.softened : ["caching", "sparse windows", "streaming"];
  var CUTS = ["-31%", "-46%", "-12%"];
  var host = document.getElementById("mits");
  var mitEls = MITS.map(function (m, i) {
    var el = FX.el("mit", host);
    var n = FX.el("mitname", el);
    n.textContent = m;
    var c = FX.el("mitcut", el);
    c.textContent = CUTS[i] || "";
    return el;
  });
  document.getElementById("scope").textContent = props.scopeChip || "full attention = every pair still scored";
  document.getElementById("verdict").textContent = props.verdict || "Softened. Not removed.";

  gsap.set(mitEls, { opacity: 0, x: FX.px(16) });
  gsap.set("#verdict", { opacity: 0, y: FX.px(14) });

  /* each mitigation takes REAL cells out of the grid — the frame gets visibly cheaper */
  var dim = { cache: 0, sparse: 0, stream: 0, relight: 0 };
  function dimFn(x, y) {
    if (dim.relight > 0.5) return false;
    if (dim.cache > 0.5 && y < 26) return true;                     // cached prefix rows
    if (dim.sparse > 0.5 && Math.abs(x - y) > 14 && !(x < 3)) return true;  // a local window + the sink column
    if (dim.stream > 0.5 && x > 8 && x < 78 && y > 8 && y < 78) return true; // keep the ends
    return false;
  }
  function redraw() { gB.draw(1, dimFn); }

  mitEls.forEach(function (el, i) {
    var at = u0 + 0.3 + i * 0.9;
    var key = i === 0 ? "cache" : i === 1 ? "sparse" : "stream";
    tl.to(el, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out" }, at);
    /* the state flip is a tweened NUMBER with an onUpdate redraw, so an out-of-order seek always
       lands on the right picture (a callback would not fire at all on a crossed playhead). */
    var vars = { duration: 0.4, ease: "none", onUpdate: redraw };
    vars[key] = 1;
    tl.to(dim, vars, at + 0.1);
  });

  /* and then the scope: for FULL attention, the cells are all still there */
  tl.to(dim, { relight: 1, duration: 0.3, ease: "none", onUpdate: redraw }, u1 + 0.2);
  FX.fromTo(tl, "#scope", { opacity: 0, y: FX.px(10) }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }, u1 + 0.25);
  tl.to(mitEls, { opacity: 0.45, duration: 0.3 }, u1 + 0.3);
  tl.to("#verdict", { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, u1 + 0.5);
  FX.camera(tl, { at: u1, scale: 1.02, dur: Math.max(D - u1 - 0.2, 0.6), ease: "sine.out" });
}

HF.register("at-pair-price", tl);
