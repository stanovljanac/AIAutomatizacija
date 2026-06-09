// V4b — the deterministic QA checker: a clean render passes; each HARD rule (hook, captions,
// no-empty, coverage, Short length) fails closed; the emitted report shape matches qa.schema.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveFormat } from "../shared/lib/format.mjs";
import { validate } from "../shared/testkit/index.mjs";
import { runChecks, summarize } from "./lib/check-lib.mjs";

const FMT = resolveFormat({});
const FPS = 30;

// A clean long-form props: hook-card opener, short captions, dynamic scenes, full coverage.
// audio = 30s (900f), intro 45, outro 75 → total 1020, window [45, 945].
function cleanProps(over = {}) {
  return {
    fps: FPS,
    introFrames: 45,
    outroFrames: 75,
    totalFrames: 1020,
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30, 60] }, fromFrame: 336, durFrames: 300 },
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 627, durFrames: 318 },
    ],
    captions: [
      { fromFrame: 45, durFrames: 60, words: [{ w: "Still" }, { w: "doing" }, { w: "this" }] },
      { fromFrame: 120, durFrames: 60, words: [{ w: "by" }, { w: "hand" }] },
    ],
    ...over,
  };
}
const check = (props, opts = { vertical: false, durationSeconds: 30 }) => runChecks(props, FMT, opts);
const byName = (checks, name) => checks.find((c) => c.name === name);

test("a clean long-form render passes every HARD check", () => {
  const { pass, checks } = check(cleanProps());
  assert.equal(pass, true, JSON.stringify(checks.filter((c) => !c.pass)));
  assert.equal(byName(checks, "hook_opening").pass, true);
  assert.equal(byName(checks, "caption_density").pass, true);
  assert.equal(byName(checks, "no_empty_scene").pass, true);
  assert.equal(byName(checks, "coverage").pass, true);
});

test("FAILS closed when no hook-class scene opens the video", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 45, durFrames: 450 },
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 486, durFrames: 459 },
    ],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  assert.equal(byName(checks, "hook_opening").pass, false);
  assert.equal(byName(checks, "hook_opening").severity, "high");
});

test("FAILS closed when a caption cue exceeds the format's max words", () => {
  const props = cleanProps({
    captions: [{ fromFrame: 45, durFrames: 90, words: Array.from({ length: 9 }, (_, i) => ({ w: `w${i}` })) }],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  assert.equal(byName(checks, "caption_density").pass, false);
});

test("FAILS closed on a long static hold of a sparse template", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "lt.0", template: "lower-third", props: {}, fromFrame: 336, durFrames: 609 }, // ~20s, no reveals
    ],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  const empty = checks.find((c) => c.name === "no_empty_scene" && !c.pass);
  assert.ok(empty, "expected a failing no_empty_scene check");
  assert.equal(empty.scene, "lt.0");
});

test("a sparse template with multi reveals is NOT flagged (it animates)", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "lt.0", template: "lower-third", props: { reveals: [0, 60, 120] }, fromFrame: 336, durFrames: 609 },
    ],
  });
  assert.equal(byName(check(props).checks, "no_empty_scene").pass, true);
});

test("FAILS closed on a coverage gap (would render black)", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 }, // ends 345
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 600, durFrames: 345 }, // gap 345→600
    ],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  assert.equal(byName(checks, "coverage").pass, false);
});

test("Short length is enforced: a 130s Short FAILS, a 55s Short passes", () => {
  const short = cleanProps();
  assert.equal(byName(check(short, { vertical: true, durationSeconds: 130 }).checks, "short_length").pass, false);
  assert.equal(byName(check(short, { vertical: true, durationSeconds: 55 }).checks, "short_length").pass, true);
});

test("the report shape validates against qa.schema.json", () => {
  const { pass, checks } = check(cleanProps());
  const report = { pass, checked_at: new Date().toISOString(), checks, summary: summarize(checks) };
  const { valid, errors } = validate(report, "qa");
  assert.ok(valid, JSON.stringify(errors));
});

test("summarize: green when all pass, lists failures otherwise", () => {
  assert.match(summarize([{ name: "x", pass: true, severity: "high" }]), /passed/i);
  assert.match(summarize([{ name: "coverage", pass: false, severity: "high" }]), /coverage/);
});

// --- Regression tests added by the V4b verifier (Sonnet 4.6) ---

// coverage: out-of-order scenes are sorted and coverage still passes
test("coverage: out-of-order scenes are sorted — full coverage still passes", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 627, durFrames: 318 },
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30, 60] }, fromFrame: 336, durFrames: 300 },
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// coverage: crossfade overlap (scenes overlap by xf frames) is NOT a false gap
test("coverage: crossfade overlapping scenes do NOT trigger a false gap", () => {
  // Simulates build-props output: each scene starts xf(9) frames before the next beat.
  // hook[45,354), p1[345,654), p2[645,945) — all overlap by 9 frames at boundaries.
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 309 },   // ends 354
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 345, durFrames: 309 }, // ends 654
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 645, durFrames: 300 },          // ends 945
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// coverage: a scene starting before introFrames is handled (no crash, window still covered)
test("coverage: scene starting before introFrames does not crash and covers window correctly", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 0, durFrames: 645 },   // starts before intro
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 636, durFrames: 309 }, // ends 945
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// coverage: gap exactly at tolerance boundary (15 frames = 0.5s) is treated as no-gap (strict >)
test("coverage: gap of exactly tol(15) frames is accepted (boundary is non-inclusive)", () => {
  // After hook ends at 345, next scene at 360 = 345 + 15 frames. Strict condition is a > cursor+tol,
  // so 360 > 360 is false → no gap flagged.
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },  // ends 345
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 360, durFrames: 300 }, // starts at 345+15
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 651, durFrames: 294 },         // ends 945
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// coverage: gap of 16 frames (just over 0.5s) FAILS
test("coverage: gap of 16 frames (just over tolerance) FAILS closed", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 }, // ends 345
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 361, durFrames: 300 }, // starts at 345+16
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 652, durFrames: 293 },         // ends 945
    ],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  assert.equal(byName(checks, "coverage").pass, false);
});

// coverage: single scene exactly covering the full window passes
test("coverage: a single scene exactly spanning the window passes", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 900 }, // [45, 945]
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// coverage: trailing gap (last scene ends well before winEnd) FAILS
test("coverage: trailing gap (last scene ends >tol frames before winEnd) FAILS closed", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "p1.0", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 336, durFrames: 300 },
      // Last scene ends at 882, winEnd=945, gap=63 frames (2.1s) > tol(15) → FAIL
      { sceneId: "p2.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 627, durFrames: 255 },
    ],
  });
  const { pass, checks } = check(props);
  assert.equal(pass, false);
  assert.equal(byName(checks, "coverage").pass, false);
});

// coverage: trailing gap exactly at tol boundary (ends at winEnd-tol=930) passes
test("coverage: last scene ending exactly at winEnd-tol (930) is accepted", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 885 }, // ends at 930 = 945-15
    ],
  });
  const c = byName(check(props).checks, "coverage");
  assert.equal(c.pass, true, c.detail);
});

// fails-closed: medium-severity failure alone does NOT flip the overall pass to false
test("fails-closed: a medium-severity failure alone does NOT flip pass to false", () => {
  // Long video (2000s) triggers long_length=medium fail; but all high checks pass.
  const props = cleanProps({
    totalFrames: 99999,
    outroFrames: 0,
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 99954 },
    ],
  });
  const { pass, checks } = runChecks(props, FMT, { vertical: false, durationSeconds: 2000 });
  const med = checks.find((c) => c.name === "long_length");
  assert.equal(med?.pass, false, "long_length should fail");
  assert.equal(med?.severity, "medium", "long_length should be medium");
  assert.equal(pass, true, "overall pass must be true — medium doesn't flip it");
});

// fails-closed: scenes:[] causes hook_opening to fail without crashing; coverage block is skipped
test("fails-closed: empty scenes array fails (hook) without crashing; no coverage check", () => {
  const { pass, checks } = runChecks(
    { fps: FPS, introFrames: 45, outroFrames: 75, totalFrames: 1020, scenes: [], captions: [] },
    FMT,
    { vertical: false, durationSeconds: 30 },
  );
  assert.equal(pass, false, "should fail because hook_opening is false");
  assert.equal(byName(checks, "hook_opening")?.pass, false);
  assert.equal(byName(checks, "coverage"), undefined, "coverage check is absent when scenes is empty");
});

// no_empty_scene: exactly 1 reveal is NOT enough to mark a scene dynamic — it is still flagged
test("no_empty_scene: exactly 1 reveal is still flagged as a static hold (needs >1)", () => {
  const props = cleanProps({
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "lt.0", template: "lower-third", props: { reveals: [0] }, fromFrame: 336, durFrames: 609 }, // 1 reveal, 20.3s
    ],
  });
  const empty = check(props).checks.find((c) => c.name === "no_empty_scene" && !c.pass);
  assert.ok(empty, "should flag lower-third with only 1 reveal");
  assert.equal(empty.scene, "lt.0");
});

// threshold sourcing: Short uses length.short band; long uses length.long band
test("threshold sourcing: Short band comes from length.short (not length.long)", () => {
  // short.max = 120, long.max = 1800 — 130s fails short but would pass long
  const short = cleanProps();
  const { checks: sc } = runChecks(short, FMT, { vertical: true, durationSeconds: 130 });
  assert.equal(byName(sc, "short_length")?.severity, "high");
  assert.equal(byName(sc, "short_length")?.pass, false);
  assert.equal(byName(sc, "long_length"), undefined, "long_length should not appear in Short");
});

// report: render_props_missing synthetic report also validates against qa.schema.json
test("report: synthetic render_props_missing report validates against qa.schema.json", () => {
  const report = {
    pass: false,
    checked_at: new Date().toISOString(),
    checks: [{ name: "render_props_missing", pass: false, severity: "high", detail: "foo.json not found", fix: "node pipeline/04-render/build-props.mjs foo" }],
    summary: "Cannot QA: render props missing.",
  };
  const { valid, errors } = validate(report, "qa");
  assert.ok(valid, JSON.stringify(errors));
});
