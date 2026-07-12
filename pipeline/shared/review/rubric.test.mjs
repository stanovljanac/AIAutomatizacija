// R1 — rubric prompt + result normalization (missing gates default to false).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReviewerPrompt, normalizeReviewResult, extractJson, HARD_GATES, scoredCategories, hardGates } from "./rubric.mjs";

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

// ── IDEA STAGE rubric (the pre-script content-value pass) ─────────────────────────────────────────

test("scoredCategories/hardGates are stage-aware (idea vs script default)", () => {
  assert.deepEqual(hardGates("idea"), ["value_type_present", "takeaway_present", "on_brand"]);
  assert.deepEqual(scoredCategories("idea"), ["audience_value", "reusable_takeaway", "transformation", "packaging", "audience_fit"]);
  // unknown / omitted stage falls back to the script set (back-compat)
  assert.deepEqual(hardGates(), HARD_GATES);
});

test("buildReviewerPrompt(idea) names the idea gates, categories and contract", () => {
  const p = buildReviewerPrompt({ stage: "idea", artifact: { id: "bulk-emails" } });
  assert.match(p, /video IDEA/);
  assert.match(p, /value_type_present/);
  assert.match(p, /reusable_takeaway/);
  assert.match(p, /transformation/);
  assert.match(p, /STRANGER TEST/);
  assert.match(p, /audience_fit/);
  assert.doesNotMatch(p, /retention_structure/, "idea prompt must NOT use script categories");
});

test("normalizeReviewResult(stage:idea) keeps idea keys and defaults a missing idea gate to false", () => {
  const r = normalizeReviewResult(
    { score: 8.4, hard_gates: { value_type_present: true, takeaway_present: true }, category_scores: { audience_value: 8 } },
    { reviewer: "g", model: "m", stage: "idea" }
  );
  assert.equal(r.hard_gates.on_brand, false, "omitted idea gate must be false");
  assert.ok("audience_value" in r.category_scores && "packaging" in r.category_scores);
  assert.equal(r.category_scores.packaging, 0, "missing idea category defaults to 0");
  assert.ok(!("retention_structure" in r.category_scores), "no script keys leak into an idea result");
});

// ── PUBLISH STAGE rubric (metadata/SEO pass before the owner gate — plan v2 Phase 2) ─────────────

test("publish stage: gates + categories are the SEO/claims set", () => {
  assert.deepEqual(hardGates("publish"), ["accuracy", "no_overpromise", "disclosure_set"]);
  assert.deepEqual(scoredCategories("publish"), ["title_ctr", "seo_keywords", "answer_first_description", "metadata_consistency"]);
});

test("buildReviewerPrompt(publish) names the publish gates and categories, not script ones", () => {
  const p = buildReviewerPrompt({ stage: "publish", artifact: { title_options: ["T"], description: "D" } });
  assert.match(p, /publish metadata package/);
  assert.match(p, /no_overpromise/);
  assert.match(p, /title_ctr/);
  assert.doesNotMatch(p, /retention_structure/, "publish prompt must NOT use script categories");
});

test("normalizeReviewResult(stage:publish) defaults a missing publish gate to false", () => {
  const r = normalizeReviewResult(
    { score: 9, hard_gates: { accuracy: true, no_overpromise: true }, category_scores: { title_ctr: 9 } },
    { reviewer: "g", model: "m", stage: "publish" }
  );
  assert.equal(r.hard_gates.disclosure_set, false, "omitted disclosure gate must be false");
  assert.equal(r.category_scores.seo_keywords, 0, "missing publish category defaults to 0");
  assert.ok(!("accuracy" in r.category_scores));
});
