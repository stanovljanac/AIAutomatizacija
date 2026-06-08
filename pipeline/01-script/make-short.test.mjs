// P2 — the derived Short is schema-valid, keeps the hook, and re-ids its scenes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeShort, estimateSeconds } from "./make-short.mjs";
import { readFixture, assertValid } from "../shared/testkit/index.mjs";

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
