import test from "node:test";
import assert from "node:assert/strict";
import { parseLuma, findDropouts, repairFilter } from "./repair-dropouts.mjs";

/** the exact two-line-per-frame shape `metadata=print` emits */
function log(values) {
  return values
    .map((v, i) => `frame:${i}    pts:${i * 1000}   pts_time:${(i / 30).toFixed(6)}\nlavfi.signalstats.YAVG=${v.toFixed(4)}`)
    .join("\n");
}

test("parseLuma reads YAVG per frame, indexed by frame number", () => {
  const luma = parseLuma(log([54.2791, 12.5, 4.0]));
  assert.deepEqual(luma, [54.2791, 12.5, 4.0]);
});

test("parseLuma returns empty for junk instead of throwing", () => {
  assert.deepEqual(parseLuma("no frames here"), []);
  assert.deepEqual(parseLuma(undefined), []);
});

test("findDropouts flags the single black frame between two bright ones (the 022 defect)", () => {
  const luma = [56.8, 56.9, 4.0, 52.2, 52.2];
  assert.deepEqual(findDropouts(luma), [2]);
});

test("findDropouts finds several, ascending", () => {
  const luma = [40, 42.6, 4.6, 42.8, 50.2, 4.4, 50.3, 51];
  assert.deepEqual(findDropouts(luma), [2, 5]);
});

test("an intentional cut to black is NOT a dropout — it is dark on both sides", () => {
  const luma = [50, 50, 3.0, 3.0, 3.0, 50, 50];
  assert.deepEqual(findDropouts(luma), []);
});

test("a hard cut between two bright scenes is not a dropout — the dark frame must be near-black", () => {
  const luma = [90, 90, 40, 90, 90];
  assert.deepEqual(findDropouts(luma), [], "40 is far darker than both neighbours but nowhere near black");
});

test("a genuinely dark scene does not trip the detector just by being dark", () => {
  const luma = [8.2, 7.9, 7.6, 7.8, 8.3];
  assert.deepEqual(findDropouts(luma), []);
});

test("the first and last frames are never flagged (no two neighbours to compare against)", () => {
  assert.deepEqual(findDropouts([2.0, 50, 50]), []);
  assert.deepEqual(findDropouts([50, 50, 2.0]), []);
});

test("thresholds are tunable", () => {
  const luma = [50, 20, 50];
  assert.deepEqual(findDropouts(luma), [], "20 is above the default 12 threshold");
  assert.deepEqual(findDropouts(luma, { threshold: 25 }), [1]);
});

test("repairFilter drops exactly the listed frames and re-fills with fps", () => {
  assert.equal(repairFilter([135, 672], 30), "select='not(eq(n\\,135)+eq(n\\,672))',fps=30");
});

test("repairFilter honours a non-30 fps", () => {
  assert.match(repairFilter([7], 24), /fps=24$/);
});
