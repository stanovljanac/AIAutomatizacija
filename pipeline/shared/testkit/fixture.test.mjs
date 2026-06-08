// F4 — the golden fixture validates against every schema and is internally consistent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFixture, assertValid } from "./index.mjs";

test("fixture: brief/script/scene-plan/alignment all validate", () => {
  assertValid(readFixture("brief.json"), "brief.json");
  assertValid(readFixture("script.json"), "script.json");
  assertValid(readFixture("scene-plan.json"), "scene-plan.json");
  assertValid(readFixture("alignment.json"), "alignment.json");
});

test("fixture: scene-plan scene_ids match script scene ids", () => {
  const script = readFixture("script.json");
  const plan = readFixture("scene-plan.json");
  const ids = new Set(script.scenes.map((s) => s.id));
  for (const s of plan.scenes) {
    assert.ok(ids.has(s.scene_id), `plan scene ${s.scene_id} not in script`);
  }
});

test("fixture: alignment sentences reference real scenes and are time-ordered", () => {
  const script = readFixture("script.json");
  const align = readFixture("alignment.json");
  const ids = new Set(script.scenes.map((s) => s.id));
  let prevEnd = 0;
  for (const sen of align.sentences) {
    assert.ok(ids.has(sen.scene), `alignment refs unknown scene ${sen.scene}`);
    assert.ok(sen.end > sen.start, "sentence end must follow start");
    assert.ok(sen.start >= prevEnd - 1e-9, "sentences must not overlap");
    prevEnd = sen.end;
  }
  assert.ok(align.duration >= prevEnd - 1e-9, "duration must cover all sentences");
});

test("fixture: every script sentence has alignment coverage", () => {
  const script = readFixture("script.json");
  const align = readFixture("alignment.json");
  const scriptCount = script.scenes.reduce((n, s) => n + s.sentences.length, 0);
  assert.equal(align.sentences.length, scriptCount);
});
