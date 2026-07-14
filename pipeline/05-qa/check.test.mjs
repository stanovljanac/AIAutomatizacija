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

test("Short hook gate uses the TIGHTER window: a hook-class opener within ~3s passes", () => {
  // vertical Short, intro 36f (1.2s), hook opens at frame 36 (~0s into the body) → within 3s.
  const short = cleanProps({
    introFrames: 36,
    outroFrames: 36,
    totalFrames: 1000,
    scenes: [
      { sceneId: "s1", template: "hook-card", props: {}, fromFrame: 36, durFrames: 300 },
      { sceneId: "s2", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 336, durFrames: 628 },
    ],
  });
  const { checks } = check(short, { vertical: true, durationSeconds: 33 });
  assert.equal(byName(checks, "hook_opening").pass, true);
});

test("Short hook gate FAILS when the hook lands after the ~3s window (would pass the loose 30s long gate)", () => {
  // Hook starts at frame 180 = 4.8s > 3s (Short window) but < 30s (long window). Short must fail;
  // long must pass — proving the window is Short-aware.
  const late = cleanProps({
    introFrames: 36,
    outroFrames: 36,
    totalFrames: 1200,
    scenes: [
      { sceneId: "s1", template: "bullet-steps", props: { reveals: [0, 30] }, fromFrame: 36, durFrames: 144 },
      { sceneId: "s2", template: "hook-card", props: {}, fromFrame: 180, durFrames: 984 },
    ],
  });
  assert.equal(byName(check(late, { vertical: true, durationSeconds: 38 }).checks, "hook_opening").pass, false);
  assert.equal(byName(check(late, { vertical: false, durationSeconds: 38 }).checks, "hook_opening").pass, true);
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

// --- Content-quality enforcement (items 4/6/9 — paid-SaaS, bespoke ratio, no-repeat) ---

// A real-length (>=5 scenes) all-template, no-bespoke video = the slideshow the owner rejected.
function slideshowProps(over = {}) {
  const mkScene = (i, template, extra = {}) => ({ sceneId: `s${i}.0`, template, props: { reveals: [0, 30], ...extra }, fromFrame: 45 + i * 100, durFrames: 100 });
  return {
    fps: FPS, introFrames: 45, outroFrames: 75, totalFrames: 1020,
    scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 100 },
      mkScene(1, "term-highlight"), mkScene(2, "term-highlight"), mkScene(3, "term-highlight"),
      mkScene(4, "term-highlight"), mkScene(5, "term-highlight"), mkScene(6, "icon-list"),
    ],
    captions: [{ fromFrame: 45, durFrames: 60, words: [{ w: "hello" }] }],
    ...over,
  };
}
// A good bespoke-first video: distinct HF/custom scenes mixed with a visual template. No title-only
// cards (a rich HF hook + custom components + a flow) — the bar after the 009 owner rule.
function bespokeProps(over = {}) {
  return {
    fps: FPS, introFrames: 45, outroFrames: 75, totalFrames: 1020,
    scenes: [
      { sceneId: "hook.0", engine: "hyperframes", template: "hook-card", props: { hf_scene: "hook-prism" }, fromFrame: 45, durFrames: 100 },
      { sceneId: "s1.0", template: "custom", props: { component: "ai-flow" }, fromFrame: 145, durFrames: 100 },
      { sceneId: "s2.0", template: "custom", props: { component: "calendar-find" }, fromFrame: 245, durFrames: 100 },
      { sceneId: "s3.0", engine: "hyperframes", template: "section-header", props: { hf_scene: "bad-row-gate" }, fromFrame: 345, durFrames: 100 },
      { sceneId: "s4.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 445, durFrames: 100 },
      { sceneId: "s5.0", template: "custom", props: { component: "spreadsheet-clean" }, fromFrame: 545, durFrames: 100 },
    ],
    captions: [{ fromFrame: 45, durFrames: 60, words: [{ w: "hello" }] }],
    ...over,
  };
}

test("no_paid_saas FAILS when narration/props name a paid SaaS not in approved_tools", () => {
  const props = cleanProps({ captions: [{ fromFrame: 45, durFrames: 60, words: [{ w: "use" }, { w: "Expensify" }, { w: "today" }] }] });
  const { checks } = check(props);
  assert.equal(byName(checks, "no_paid_saas").pass, false);
  assert.equal(byName(checks, "no_paid_saas").severity, "high");
});

test("no_paid_saas PASSES when the named product is in brief.approved_tools (owner-approved)", () => {
  const props = cleanProps({ scenes: [
    { sceneId: "hook.0", template: "hook-card", props: { title: "Why I use QuickBooks" }, fromFrame: 45, durFrames: 900 },
  ] });
  assert.equal(byName(check(props, { vertical: false, durationSeconds: 30, approvedTools: ["QuickBooks"] }).checks, "no_paid_saas").pass, true);
  // …and FAILS again without the approval
  assert.equal(byName(check(props).checks, "no_paid_saas").pass, false);
});

test("no_adjacent_repeat FAILS on two identical templates back-to-back", () => {
  const props = cleanProps({ scenes: [
    { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
    { sceneId: "a.0", template: "term-highlight", props: { reveals: [0, 30] }, fromFrame: 336, durFrames: 300 },
    { sceneId: "b.0", template: "term-highlight", props: { reveals: [0, 30] }, fromFrame: 627, durFrames: 318 },
  ] });
  const c = byName(check(props).checks, "no_adjacent_repeat");
  assert.equal(c.pass, false);
  assert.match(c.detail, /b\.0/);
});

test("the slideshow (>=5 scenes, all template, no bespoke) FAILS bespoke_ratio + template_repeat", () => {
  const { pass, checks } = check(slideshowProps());
  assert.equal(pass, false);
  assert.equal(byName(checks, "bespoke_ratio").pass, false, "0% bespoke < 25% min");
  assert.equal(byName(checks, "template_repeat").pass, false, "5× term-highlight > 3");
});

test("a bespoke-first video (HF/custom mixed, distinct) passes the variety checks", () => {
  const { checks } = check(bespokeProps());
  assert.equal(byName(checks, "bespoke_ratio").pass, true);
  assert.equal(byName(checks, "template_repeat").pass, true);
  assert.equal(byName(checks, "no_adjacent_repeat").pass, true);
  assert.equal(byName(checks, "no_title_card").pass, true);
});

// --- no_title_card (owner rule 2026-06-28): every scene must VISUALIZE its point, not be a card ---

test("no_title_card FAILS on a title-only card template (term-highlight/stat-callout/section-header/cta-card)", () => {
  for (const tpl of ["term-highlight", "stat-callout", "section-header", "cta-card"]) {
    const props = cleanProps({ scenes: [
      { sceneId: "hook.0", template: "hook-card", props: {}, fromFrame: 45, durFrames: 300 },
      { sceneId: "c.0", template: tpl, props: { reveals: [0, 30] }, fromFrame: 336, durFrames: 609 },
    ] });
    const c = byName(check(props).checks, "no_title_card");
    assert.equal(c.pass, false, `${tpl} should be flagged as a title card`);
    assert.equal(c.severity, "high");
    assert.match(c.detail, /c\.0/);
  }
});

test("no_title_card FAILS on a text-only HF hero (hook-kinetic), even though it is 'bespoke'", () => {
  const props = cleanProps({ scenes: [
    { sceneId: "hook.0", engine: "hyperframes", template: "hook-card", props: { hf_scene: "hook-kinetic" }, fromFrame: 45, durFrames: 450 },
    { sceneId: "p.0", template: "flow", props: { reveals: [0, 30] }, fromFrame: 486, durFrames: 459 },
  ] });
  const { checks } = check(props);
  assert.equal(byName(checks, "no_title_card").pass, false, "hook-kinetic is a text-only HF card");
});

test("no_title_card PASSES when every scene is custom or a RICH HF hero", () => {
  const props = cleanProps({ scenes: [
    { sceneId: "hook.0", engine: "hyperframes", template: "hook-card", props: { hf_scene: "money-hero" }, fromFrame: 45, durFrames: 300 },
    { sceneId: "s1.0", template: "custom", props: { component: "money-leak-run" }, fromFrame: 336, durFrames: 300 },
    { sceneId: "s2.0", template: "custom", props: { component: "hype-flip" }, fromFrame: 627, durFrames: 318 },
  ] });
  assert.equal(byName(check(props).checks, "no_title_card").pass, true);
});

test("no_title_card does NOT flag the sanctioned hook-card or visual templates (flow/bullet-steps)", () => {
  // cleanProps = hook-card + bullet-steps + flow → all allowed (hook-card is the opener; flow/bullet
  // -steps have visual structure). Only the TEXT cards are banned.
  assert.equal(byName(check(cleanProps()).checks, "no_title_card").pass, true);
});

test("template_repeat IGNORES bespoke HF scenes that share a gallery fallback template (008 regression)", () => {
  // 5 DISTINCT HyperFrames scenes all carrying `section-header` as their render FALLBACK + 1 REAL
  // remotion section-header outro. The HF scenes render as their distinct hf_scene, so the 6
  // `section-header` tags must NOT trip template_repeat (only the 1 real gallery scene counts).
  const props = {
    fps: FPS, introFrames: 45, outroFrames: 75, totalFrames: 1845,
    scenes: [
      { sceneId: "s1.0", engine: "hyperframes", template: "hook-card", props: { hf_scene: "receipts-hook" }, fromFrame: 45, durFrames: 300 },
      { sceneId: "s2.0", engine: "hyperframes", template: "section-header", props: { hf_scene: "monthly-retype" }, fromFrame: 345, durFrames: 300 },
      { sceneId: "s3.0", engine: "hyperframes", template: "section-header", props: { hf_scene: "receipts-mathcheck" }, fromFrame: 645, durFrames: 300 },
      { sceneId: "s4.0", engine: "hyperframes", template: "section-header", props: { hf_scene: "only-flags" }, fromFrame: 945, durFrames: 300 },
      { sceneId: "s5.0", engine: "hyperframes", template: "section-header", props: { hf_scene: "limits-privacy" }, fromFrame: 1245, durFrames: 300 },
      { sceneId: "s6.0", template: "section-header", props: {}, fromFrame: 1545, durFrames: 225 },
    ],
    captions: [{ fromFrame: 45, durFrames: 60, words: [{ w: "hello" }] }],
  };
  const { checks } = check(props);
  assert.equal(byName(checks, "template_repeat").pass, true, "5 distinct HF scenes + 1 real section-header must not count as 6 gallery repeats");
  assert.equal(byName(checks, "no_adjacent_repeat").pass, true, "distinct hf_scene => not adjacent repeats");
  assert.equal(byName(checks, "bespoke_ratio").pass, true, "5/6 bespoke");
});

test("variety checks are SKIPPED for tiny (<5-scene) clips — not added at all", () => {
  const checks = check(cleanProps()).checks; // 3 scenes
  assert.equal(byName(checks, "bespoke_ratio"), undefined);
  assert.equal(byName(checks, "template_repeat"), undefined);
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
