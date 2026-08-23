import test from "node:test";
import assert from "node:assert/strict";
import {
  boxBlur,
  detailDensity,
  measureInk,
  measureFrame,
  spanFraction,
  gateFrame,
  floorsFor,
  FLOORS,
  DEFAULTS,
} from "./ink-coverage.mjs";

const W = 96;
const H = 60;

/** A frame factory: `paint(x, y)` returns the byte for that pixel. */
function frame(paint, w = W, h = H) {
  const g = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = paint(x, y) & 0xff;
  return g;
}

const flatDark = () => frame(() => 10);
/** A smooth horizontal gradient — the shape of our stage background. */
const gradient = () => frame((x) => 8 + Math.round((x / W) * 40));
/** Alternating columns — the shape of dense text/texture. */
const checker = (lo = 20, hi = 200) => frame((x, y) => ((x + y) % 2 ? hi : lo));

test("boxBlur of a flat plane returns the same flat plane", () => {
  const flat = new Float32Array(W * H).fill(42);
  const out = boxBlur(flat, W, H, 5);
  for (const v of out) assert.ok(Math.abs(v - 42) < 1e-3);
});

test("boxBlur clamps at the edges instead of darkening them", () => {
  const plane = new Float32Array(W * H).fill(100);
  const out = boxBlur(plane, W, H, 7);
  assert.ok(Math.abs(out[0] - 100) < 1e-3, "top-left corner must not fall off");
  assert.ok(Math.abs(out[W * H - 1] - 100) < 1e-3, "bottom-right corner must not fall off");
});

// ── detailDensity: the primary gate ───────────────────────────────────────────────────────────

test("detailDensity is ~0 for a flat frame and for a smooth gradient", () => {
  assert.equal(detailDensity(flatDark(), { width: W, height: H }), 0);
  assert.equal(detailDensity(gradient(), { width: W, height: H }), 0);
});

test("detailDensity is high for a textured frame", () => {
  assert.ok(detailDensity(checker(), { width: W, height: H }) > 0.9);
});

test("detailDensity IGNORES a large flat fill — the 022 defect it exists to catch", () => {
  // Measured at a REALISTIC frame size: a shape's detail contribution is its perimeter, so the
  // perimeter/area ratio (and therefore the score of a blank fill) shrinks as resolution grows.
  // That is why the floors are only meaningful at the CLI's fixed 960x540 — see ANALYSIS_SIZE.
  const [w, h] = [480, 270];
  const inBar = (x, y) => y > h * 0.2 && y < h * 0.6 && x > w * 0.1 && x < w * 0.9;

  // A blank bar covering a third of the frame: lots of ink, no detail. Only its edges count.
  const bar = frame((x, y) => (inBar(x, y) ? 220 : 10), w, h);
  const d = detailDensity(bar, { width: w, height: h });
  assert.ok(d < 0.03, `a big blank bar must not score as detail (got ${d})`);

  // ... while the SAME area filled with readable content does.
  const textured = frame((x, y) => (inBar(x, y) ? ((x + y) % 2 ? 220 : 40) : 10), w, h);
  assert.ok(detailDensity(textured, { width: w, height: h }) > 0.3);
});

test("detailDensity excludes the burned-in caption band", () => {
  // Texture ONLY in the bottom 15% must not rescue an otherwise plain stage.
  const captionsOnly = frame((x, y) => (y > H * 0.85 ? ((x + y) % 2 ? 200 : 20) : 10));
  assert.ok(detailDensity(captionsOnly, { width: W, height: H }) < 0.02);
});

// ── measureInk: the empty-stage backstop ──────────────────────────────────────────────────────

test("measureInk reports no ink on a flat frame and none on a smooth gradient", () => {
  assert.equal(measureInk(flatDark(), { width: W, height: H }).coverage, 0);
  const grad = measureInk(gradient(), { width: W, height: H });
  assert.ok(grad.coverage < 0.02, `a smooth gradient is stage, not content (got ${grad.coverage})`);
});

test("measureInk: a small bright object in a void yields low coverage and a small box", () => {
  const dot = frame((x, y) => (x > W * 0.45 && x < W * 0.55 && y > H * 0.45 && y < H * 0.55 ? 240 : 10));
  const m = measureInk(dot, { width: W, height: H });
  assert.ok(m.coverage < 0.05, `got ${m.coverage}`);
  assert.ok(m.boxFrac < 0.05, `got ${m.boxFrac}`);
});

test("measureInk: a frame-filling subject yields a large box", () => {
  const big = frame((x, y) => (x > W * 0.08 && x < W * 0.92 && y > H * 0.05 && y < H * 0.7 ? ((x + y) % 2 ? 200 : 40) : 10));
  const m = measureInk(big, { width: W, height: H });
  assert.ok(m.boxFrac > 0.5, `got ${m.boxFrac}`);
});

test("measureInk rejects a buffer that is too small for the stated size", () => {
  assert.throws(() => measureInk(new Uint8Array(10), { width: W, height: H }), /need \d+ bytes|need \d+/);
});

test("measureInk rejects a degenerate frame size", () => {
  assert.throws(() => measureInk(new Uint8Array(4), { width: 2, height: 2 }), /width\/height >= 3/);
});

// ── spanFraction ──────────────────────────────────────────────────────────────────────────────

test("spanFraction returns 0 when there is no ink", () => {
  assert.equal(spanFraction(new Uint32Array(10), 0), 0);
});

test("spanFraction trims outliers so a corner chip cannot fake a full-height subject", () => {
  // 1 hit at the very top (a source chip), 99 hits in the middle rows.
  const hits = new Uint32Array(100);
  hits[0] = 1;
  for (let i = 45; i < 55; i++) hits[i] = 10;
  const untrimmed = spanFraction(hits, 101, 0);
  const trimmed = spanFraction(hits, 101, DEFAULTS.spanPercentile);
  assert.ok(untrimmed > 0.5, `untrimmed span should bracket the whole frame (got ${untrimmed})`);
  assert.ok(trimmed < 0.2, `trimming must drop the lone chip (got ${trimmed})`);
});

// ── the gate ──────────────────────────────────────────────────────────────────────────────────

test("floorsFor falls back to the default set for an unknown role", () => {
  assert.deepEqual(floorsFor("point"), FLOORS.default);
  assert.deepEqual(floorsFor("demo"), FLOORS.default);
  assert.deepEqual(floorsFor("hook"), FLOORS.hook);
});

test("the cta/outro monolith is allowed to be quiet, a body scene is not", () => {
  const quiet = { detail: 0.012, coverage: 0.03, boxFrac: 0.1, spanX: 0.5, spanY: 0.2 };
  assert.equal(gateFrame(quiet, "cta").pass, true);
  assert.equal(gateFrame(quiet, "outro").pass, true);
  assert.equal(gateFrame(quiet, "point").pass, false);
});

test("gateFrame passes a rich frame and names every missed floor on a poor one", () => {
  const rich = { detail: 0.05, coverage: 0.2, boxFrac: 0.4, spanX: 0.7, spanY: 0.57 };
  assert.equal(gateFrame(rich, "point").pass, true);
  assert.equal(gateFrame(rich, "hook").pass, true);

  const poor = { detail: 0.006, coverage: 0.06, boxFrac: 0.07, spanX: 0.14, spanY: 0.48 };
  const r = gateFrame(poor, "point");
  assert.equal(r.pass, false);
  assert.equal(r.reasons.length, 3, "all three floors missed");
  assert.match(r.reasons.join(" "), /plain frame/);
  assert.match(r.reasons.join(" "), /empty frame/);
  assert.match(r.reasons.join(" "), /subject too small/);
});

test("a big BLANK subject fails the detail floor while clearing the size floors — the 022 shape", () => {
  const blankButBig = { detail: 0.01, coverage: 0.25, boxFrac: 0.5, spanX: 0.8, spanY: 0.62 };
  const r = gateFrame(blankButBig, "point");
  assert.equal(r.pass, false);
  assert.equal(r.reasons.length, 1);
  assert.match(r.reasons[0], /plain frame/);
});

test("measureFrame returns both measurements over one plane", () => {
  const m = measureFrame(checker(), { width: W, height: H });
  assert.ok(m.detail > 0.9);
  assert.ok(typeof m.coverage === "number" && typeof m.boxFrac === "number");
});

test("the calibrated floors keep their evidence-based values", () => {
  // These came from measuring 012 (the owner's benchmark) against 021/022 (both rejected).
  // Changing them is a real decision — this test makes it a deliberate one.
  assert.equal(FLOORS.default.detail, 0.024);
  assert.equal(FLOORS.hook.detail, 0.03);
  assert.ok(FLOORS.cta.detail < FLOORS.default.detail);
});
