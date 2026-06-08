// R1 — rubric prompt + result normalization (missing gates default to false).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReviewerPrompt, normalizeReviewResult, extractJson, HARD_GATES } from "./rubric.mjs";

test("buildReviewerPrompt names the stage, the rubric, the contract and the artifact", () => {
  const p = buildReviewerPrompt({ stage: "script", artifact: { id: "x" } });
  assert.match(p, /INDEPENDENT reviewer of a YouTube script/);
  assert.match(p, /HARD GATES/);
  assert.match(p, /Return ONLY minified JSON/);
  assert.match(p, /"id": "x"/);
});

test("normalizeReviewResult defaults a missing hard gate to false (conservative)", () => {
  const r = normalizeReviewResult(
    { score: 9.5, hard_gates: { accuracy: true, original_angle: true, synthetic_data: true }, category_scores: {} },
    { reviewer: "g", model: "m" }
  );
  assert.equal(r.hard_gates.on_screen_source, false, "omitted gate must be false");
  for (const k of HARD_GATES) assert.ok(k in r.hard_gates);
  // missing category scores default to 0
  assert.equal(r.category_scores.retention_structure, 0);
});

test("normalizeReviewResult coerces junk into a valid shape", () => {
  const r = normalizeReviewResult(null, { reviewer: "g", model: "m" });
  assert.equal(r.score, 0);
  assert.deepEqual(r.fixes, []);
  assert.equal(typeof r.summary, "string");
});

test("extractJson pulls a JSON object out of fenced / prose replies", () => {
  assert.equal(extractJson('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(extractJson('Sure! {"a":1} done'), '{"a":1}');
  assert.throws(() => extractJson("no json here"), /no JSON object/);
});
