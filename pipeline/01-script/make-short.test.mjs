// P2 — the derived Short is schema-valid, keeps the hook, and re-ids its scenes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeShort, estimateSeconds, pickShortScenes, makeShortPlan, deriveShortPlanFile } from "./make-short.mjs";
import { readFixture, assertValid, withTempDir } from "../shared/testkit/index.mjs";

test("estimateSeconds scales with words and wpm", () => {
  const scenes = [{ narration: "one two three four five six" }]; // 6 words
  assert.ok(Math.abs(estimateSeconds(scenes, 60) - 6) < 1e-9); // 6 words / 60wpm = 6s
});

test("makeShort derives a schema-valid Short from the long script", () => {
  const long = readFixture("script.json");
  const short = makeShort(long);
  assertValid(short, "script");
  assert.ok(short.scenes.length >= 1 && short.scenes.length <= long.scenes.length);
});

test("makeShort keeps the hook and re-ids scenes sequentially", () => {
  const long = readFixture("script.json");
  const short = makeShort(long);
  assert.ok(short.scenes.some((s) => s.role === "hook"));
  assert.deepEqual(
    short.scenes.map((s) => s.id),
    short.scenes.map((_, i) => `s${i + 1}`)
  );
  assert.match(short.title_working, /\(Short\)$/);
});

test("makeShort does not duplicate scenes when there is no hook role", () => {
  // scene[0] is a 'point' (fallback hook) AND appears in points — must not be included twice.
  const long = {
    id: "x",
    language: "en",
    archetype: "ideas",
    angle: "a",
    title_working: "T",
    target_seconds: 60,
    scenes: [
      { id: "p1", role: "point", template: "bullet-steps", narration: "First point here.", sentences: ["First point here."] },
      { id: "c1", role: "cta", template: "cta-card", narration: "Subscribe now please.", sentences: ["Subscribe now please."] },
    ],
  };
  const short = makeShort(long);
  const ids = short.scenes.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate scene ids");
  assert.equal(short.scenes.length, 2);
});

test("makeShort with only a hook returns exactly one scene", () => {
  const long = {
    id: "x", language: "en", archetype: "ideas", angle: "a", title_working: "T", target_seconds: 60,
    scenes: [{ id: "h", role: "hook", template: "hook-card", narration: "Just a hook.", sentences: ["Just a hook."] }],
  };
  const short = makeShort(long);
  assert.equal(short.scenes.length, 1);
});

// ── Short scene-plan derivation (T5.2 follow-up — the storyboard wire-up) ──────

// A long script where the Short DROPS a middle scene, so the renumbered short ids (s1..sN) differ
// from the long ids — this is what stresses the join (short scene_id ← long-plan entry by long id).
const longWithGap = () => ({
  id: "010-x",
  language: "en",
  archetype: "comparison",
  angle: "a",
  title_working: "T",
  target_seconds: 30, // tiny target → the loop stops after the first point, dropping p2/p3
  scenes: [
    { id: "h", role: "hook", template: "hook-card", narration: "Hook line one here now.", sentences: ["Hook line one here now."], on_screen_text: "Hook" },
    { id: "p1", role: "point", template: "comparison-table", narration: "Point one is the strong one.", sentences: ["Point one is the strong one."], on_screen_text: "Point one" },
    { id: "p2", role: "point", template: "bullet-steps", narration: "Point two also matters a lot.", sentences: ["Point two also matters a lot."], on_screen_text: "Point two" },
    { id: "c", role: "cta", template: "cta-card", narration: "Subscribe for more of this.", sentences: ["Subscribe for more of this."], on_screen_text: "Subscribe" },
  ],
});
const longPlanWithGap = () => ({
  id: "010-x",
  scenes: [
    { scene_id: "h", template: "hook-card", props: { title: "Hook" }, engine: "hyperframes" },
    { scene_id: "p1", template: "comparison-table", props: { columns: ["A", "B"], rows: [["1", "2"]], hf_scene: "hero" } },
    { scene_id: "p2", template: "bullet-steps", props: { title: "Point two", items: ["x"] } },
    { scene_id: "c", template: "cta-card", props: { title: "Subscribe" } },
  ],
});

test("makeShortPlan derives a schema-valid plan, renumbers ids, and reuses the long props", () => {
  const long = readFixture("script.json");
  const longPlan = readFixture("scene-plan.json");
  const plan = makeShortPlan(long, longPlan);
  assertValid(plan, "scene-plan");
  assert.equal(plan.id, long.id);
  assert.deepEqual(plan.scenes.map((s) => s.scene_id), plan.scenes.map((_, i) => `s${i + 1}`));
  // the hook entry's rich props survive the derivation
  assert.equal(plan.scenes[0].template, "hook-card");
  assert.equal(plan.scenes[0].props.title, "A day a month, gone");
});

test("makeShortPlan ids line up with makeShort (same pick → same s1..sN), even when a scene is dropped", () => {
  const long = longWithGap();
  // targetSeconds is a LOWER bound: a tiny target stops after the first point, dropping p2 — so the
  // renumbered short ids (s1..s3) differ from the long ids (h, p1, c), stressing the join.
  const opts = { targetSeconds: 5 };
  const short = makeShort(long, opts);
  const plan = makeShortPlan(long, longPlanWithGap(), opts);
  assert.deepEqual(
    plan.scenes.map((s) => s.scene_id),
    short.scenes.map((s) => s.id),
    "short script and short scene-plan must share identical scene ids"
  );
  // the dropped middle scene (p2) must not appear; the kept p1's comparison props must carry over.
  const picked = pickShortScenes(long, opts).map((s) => s.id);
  assert.ok(!picked.includes("p2"), "p2 dropped by the tiny target");
  assert.deepEqual(picked, ["h", "p1", "c"]);
  const p1Entry = plan.scenes[short.scenes.findIndex((s) => s.template === "comparison-table")];
  assert.deepEqual(p1Entry.props.columns, ["A", "B"]);
});

test("makeShortPlan strips long-only render coupling (engine + hf_scene) so the Short is pure Remotion", () => {
  const plan = makeShortPlan(longWithGap(), longPlanWithGap());
  for (const s of plan.scenes) {
    assert.equal("engine" in s, false, "no per-scene engine on the Short");
    assert.equal(s.props && "hf_scene" in s.props, false, "no hf_scene prop on the Short");
  }
});

test("makeShortPlan falls back to a minimal entry when the long plan has no match", () => {
  const long = longWithGap();
  const sparsePlan = { id: long.id, scenes: [{ scene_id: "h", template: "hook-card", props: { title: "Hook" } }] }; // only the hook
  const plan = makeShortPlan(long, sparsePlan);
  assertValid(plan, "scene-plan");
  const cta = plan.scenes[plan.scenes.length - 1];
  assert.equal(cta.template, "cta-card");
  assert.equal(cta.props.title, "Subscribe"); // from on_screen_text fallback
});

test("deriveShortPlanFile writes a valid short/scene-plan.json and is idempotent + non-clobbering", async () => {
  await withTempDir(async (dir) => {
    fs.writeFileSync(path.join(dir, "script.json"), JSON.stringify(readFixture("script.json")));
    fs.writeFileSync(path.join(dir, "scene-plan.json"), JSON.stringify(readFixture("scene-plan.json")));
    const first = deriveShortPlanFile(dir);
    const outPath = path.join(dir, "short", "scene-plan.json");
    assert.ok(fs.existsSync(outPath));
    assertValid(JSON.parse(fs.readFileSync(outPath, "utf8")), "scene-plan");
    // idempotent: a second run returns the same plan...
    const second = deriveShortPlanFile(dir);
    assert.deepEqual(second, first);
    // ...and a hand-authored plan is respected, never overwritten.
    const authored = { id: "_FIXTURE", scenes: [{ scene_id: "s1", template: "custom", props: { component: "mine" } }] };
    fs.writeFileSync(outPath, JSON.stringify(authored));
    assert.deepEqual(deriveShortPlanFile(dir), authored);
  });
});

// ── [verifier] regression tests ──────────────────────────────────────────────

// Script with multiple points and long enough narration that the loop actually drops scenes
// at lower targetSeconds values. Used by the id-parity sweep and props-preservation tests.
const longMultiPoint = () => ({
  id: "020-x",
  language: "en",
  archetype: "ideas",
  angle: "a",
  title_working: "T",
  target_seconds: 120,
  scenes: [
    { id: "h",  role: "hook",  template: "hook-card",        narration: "Hook one two three four five six seven eight nine ten eleven twelve thirteen.", sentences: ["Hook."], on_screen_text: "Hook" },
    { id: "p1", role: "point", template: "bullet-steps",     narration: "Point one two three four five six seven eight nine ten eleven twelve thirteen.", sentences: ["P1."] },
    { id: "p2", role: "point", template: "bullet-steps",     narration: "Point two three four five six seven eight nine ten eleven twelve thirteen.",    sentences: ["P2."] },
    { id: "p3", role: "point", template: "comparison-table", narration: "Point three four five six seven eight nine ten eleven twelve thirteen.",        sentences: ["P3."] },
    { id: "c",  role: "cta",   template: "cta-card",         narration: "Subscribe now.", sentences: ["Subscribe."], on_screen_text: "Subscribe" },
  ],
});
const longPlanMultiPoint = () => ({
  id: "020-x",
  scenes: [
    { scene_id: "h",  template: "hook-card",        props: { title: "Hook" } },
    { scene_id: "p1", template: "bullet-steps",     revealOn: "sentences", props: { title: "P1", items: ["A", "B"], focalZoom: { target: { x: 0.5, y: 0.5 }, scale: 1.3, in: "second", out: "end" } } },
    { scene_id: "p2", template: "bullet-steps",     engine: "hyperframes",  props: { title: "P2", hf_scene: "hero", items: ["C"] } },
    { scene_id: "p3", template: "comparison-table", props: { columns: ["X", "Y"], rows: [["1", "2"]], pip: { anchor: "top-right", content: "clip.mp4", in: "third", out: "end" } } },
    { scene_id: "c",  template: "cta-card",         props: { title: "Subscribe" } },
  ],
});

test("[verifier] id-parity: makeShort and makeShortPlan produce the same s1..sN ids across multiple targetSeconds", () => {
  const long = longMultiPoint();
  const longPlan = longPlanMultiPoint();
  // Sweep targetSeconds so the loop drops different numbers of points in each pass.
  // At very small targets (5s) only hook + first point + cta fit; larger targets include more.
  const targets = [5, 8, 12, 16, 20, 50, 100];
  for (const targetSeconds of targets) {
    const short = makeShort(long, { targetSeconds });
    const plan = makeShortPlan(long, longPlan, { targetSeconds });
    assert.deepEqual(
      plan.scenes.map((s) => s.scene_id),
      short.scenes.map((s) => s.id),
      `id-parity failed at targetSeconds=${targetSeconds}: script=${JSON.stringify(short.scenes.map((s) => s.id))} plan=${JSON.stringify(plan.scenes.map((s) => s.scene_id))}`
    );
  }
});

test("[verifier] id-parity: dedup fallback-hook (scenes[0] has no hook role, also in points) never doubles up", () => {
  // scenes[0] is a 'point' so it acts as the fallback hook AND appears in the points filter.
  // The dedup set must prevent it from appearing twice in both the script and the plan.
  const long = {
    id: "y", language: "en", archetype: "ideas", angle: "a", title_working: "T", target_seconds: 60,
    scenes: [
      { id: "p1", role: "point", template: "bullet-steps", narration: "Fallback hook also point.", sentences: ["FH."], on_screen_text: "FH" },
      { id: "p2", role: "point", template: "bullet-steps", narration: "Point two.",                  sentences: ["P2."] },
      { id: "c",  role: "cta",   template: "cta-card",     narration: "Subscribe.",                  sentences: ["Sub."] },
    ],
  };
  const plan = { id: "y", scenes: [
    { scene_id: "p1", template: "bullet-steps", props: { title: "FH" } },
    { scene_id: "p2", template: "bullet-steps", props: { title: "P2" } },
    { scene_id: "c",  template: "cta-card",     props: { title: "CTA" } },
  ]};
  for (const targetSeconds of [5, 20, 60]) {
    const short = makeShort(long, { targetSeconds });
    const derived = makeShortPlan(long, plan, { targetSeconds });
    const scriptIds = short.scenes.map((s) => s.id);
    const planIds = derived.scenes.map((s) => s.scene_id);
    assert.equal(new Set(scriptIds).size, scriptIds.length, `script has duplicate ids at target=${targetSeconds}`);
    assert.deepEqual(planIds, scriptIds, `id-parity failed at target=${targetSeconds}`);
  }
});

test("[verifier] id-parity: custom wpm propagates correctly through pickShortScenes", () => {
  // Both makeShort and makeShortPlan accept wpm; verify parity when a non-default wpm is passed.
  const long = longMultiPoint();
  const longPlan = longPlanMultiPoint();
  const opts = { targetSeconds: 10, wpm: 80 }; // low wpm → duration estimate is large → loop cuts earlier
  const short = makeShort(long, opts);
  const plan = makeShortPlan(long, longPlan, opts);
  assert.deepEqual(
    plan.scenes.map((s) => s.scene_id),
    short.scenes.map((s) => s.id),
    "id-parity must hold for custom wpm"
  );
});

test("[verifier] leanForShort preserves rich props (revealOn, cueWords, beats, focalZoom, pip) through makeShortPlan", () => {
  // The renderer uses these props to drive animation; a silent drop would produce a broken render.
  const long = longMultiPoint();
  const longPlan = longPlanMultiPoint();
  // Use a targetSeconds large enough that p1 (with the rich props) is always picked.
  const plan = makeShortPlan(long, longPlan, { targetSeconds: 100 });
  assertValid(plan, "scene-plan");

  // p1 has revealOn + focalZoom in props (and NO engine/hf_scene — plain entry)
  const p1Entry = plan.scenes.find((s) => s.template === "bullet-steps" && s.props?.focalZoom);
  assert.ok(p1Entry, "p1 entry with focalZoom must appear in the derived plan");
  assert.equal(p1Entry.revealOn, "sentences", "revealOn must survive leanForShort");
  assert.ok(p1Entry.props?.focalZoom, "focalZoom must survive leanForShort");

  // p3 has pip in props + comparison-table columns/rows
  const p3Entry = plan.scenes.find((s) => s.template === "comparison-table");
  assert.ok(p3Entry, "p3 comparison-table entry must appear");
  assert.ok(p3Entry.props?.columns, "columns must survive");
  assert.ok(p3Entry.props?.rows, "rows must survive");
  assert.ok(p3Entry.props?.pip, "pip must survive leanForShort");

  // p2 has engine + hf_scene — those must be stripped; other props survive
  const p2Entry = plan.scenes.find((s) => s.props?.items && !s.props?.focalZoom && !s.props?.columns);
  assert.ok(p2Entry, "p2 entry must appear");
  assert.equal("engine" in p2Entry, false, "engine must be stripped");
  assert.equal(p2Entry.props && "hf_scene" in p2Entry.props, false, "hf_scene must be stripped");
  assert.ok(Array.isArray(p2Entry.props?.items), "items must survive stripping");
});

test("[verifier] deriveShortPlanFile throws ENOENT when the long scene-plan has not been produced yet", async () => {
  // The orchestrator guarantees plan_long runs before plan_short via deps.
  // If someone calls deriveShortPlanFile manually before plan_long writes scene-plan.json,
  // the error must be obvious (ENOENT), not a silent wrong result.
  // deriveShortPlanFile throws synchronously (fs.readFileSync); wrap in a try/catch.
  await withTempDir(async (dir) => {
    fs.writeFileSync(path.join(dir, "script.json"), JSON.stringify(readFixture("script.json")));
    // Deliberately do NOT write scene-plan.json
    let thrown = null;
    try { deriveShortPlanFile(dir); } catch (e) { thrown = e; }
    assert.ok(thrown, "must throw when the long scene-plan file is absent");
    assert.equal(thrown.code, "ENOENT", `error must be ENOENT, got: ${thrown.code} — ${thrown.message}`);
  });
});
