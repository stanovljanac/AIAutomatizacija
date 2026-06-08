// Verifier-added tests — edge cases and regression guards for panel.mjs scoring.
// These were identified during Wave 0 independent verification.
// Run with: node --test pipeline/shared/review/panel-edges.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { panelScore, verdict } from "./panel.mjs";

const WEIGHTS = {
  retention_structure: 0.3,
  originality_depth: 0.2,
  hard_rule_craft: 0.2,
  style_tone: 0.15,
  readaloud_clarity: 0.15,
};
const CFG = { score_threshold: 9, auto_pass_threshold: 9.2, weights: WEIGHTS };

const mkFull = (val, gatesObj) => ({
  reviewer: "x",
  model: "m",
  hard_gates: gatesObj,
  category_scores: {
    retention_structure: val,
    originality_depth: val,
    hard_rule_craft: val,
    style_tone: val,
    readaloud_clarity: val,
  },
  fixes: [],
});

// ── Edge 1: exactly 9.2 should reach 'auto' ──────────────────────────────────
test("verdict band = auto when both reviewers are exactly 9.2 (boundary)", () => {
  const allGates = { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true };
  const r = verdict([mkFull(9.2, allGates), mkFull(9.2, allGates)], CFG);
  assert.equal(r.verdict.band, "auto", "9.2 is the auto threshold — both exactly at it should be auto");
});

// ── Edge 2: empty hard_gates treated as gatesOk = false (conservative) ───────
// panelScore: Object.keys({}).length > 0 is false → gatesOk = false → score clamped.
// This is the CORRECT and safe behavior: a reviewer that omits hard_gates entirely
// must not be allowed to pass the gate. Confirmed works today; guard it.
test("panelScore: empty hard_gates object gives gatesOk=false and clamps score", () => {
  const { score, gatesOk } = panelScore(mkFull(9.9, {}), WEIGHTS);
  assert.equal(gatesOk, false, "empty hard_gates must be treated as failing");
  assert.ok(score <= 8.5, `score ${score} should be clamped to <= 8.5`);
});

// ── BUG: partial hard_gates (missing required keys) treated as gatesOk=true ──
// panelScore checks Object.values(result.hard_gates || {}).every(Boolean),
// so { accuracy: true } (missing 3 required) gives gatesOk = true even though
// the reviewer omitted 3 gates. Fix: require all 4 keys to be present and true.
// This test FAILS on the current production code — demonstrating the bug.
test("[BUG] panelScore: reviewer omitting a required gate key must give gatesOk=false", () => {
  // on_screen_source is a required hard gate but is omitted here.
  const partialGates = { accuracy: true, original_angle: true, synthetic_data: true };
  const { gatesOk, score } = panelScore(mkFull(9.5, partialGates), WEIGHTS);
  // Current code: gatesOk = true (every present value is true, length=3 > 0)
  // Correct:      gatesOk = false (a required gate was not reported at all)
  assert.equal(
    gatesOk,
    false,
    "missing a required hard gate key must be treated as a gate failure; " +
    `current code returns gatesOk=${gatesOk} (BUG — partial gates silently pass)`
  );
  assert.ok(score <= 8.5, `score ${score} must be clamped when a required gate is absent`);
});

// ── Edge 4: panel IGNORES the model's own score field ────────────────────────
// verdict() replaces r.score with the panel-computed one. Confirm category_scores
// of 9.3 overrides a model-reported score of 5 and still yields 'auto'.
test("verdict ignores model's self-reported score field; uses panel-computed score", () => {
  const allGates = { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true };
  const r = mkFull(9.3, allGates);
  r.score = 5; // model claims 5 — panel must ignore this
  const v = verdict([r], CFG);
  assert.equal(v.scored[0].score, 9.3, "panel-computed score must overwrite model's self-score");
  assert.equal(v.verdict.band, "auto", "band must reflect the computed score, not the model's self-score");
});

// ── Nit/Safety: extra key in weights silently tanks score ────────────────────
// If config ever has a typo introducing an extra weight key, panelScore divides
// sum by tw=(1 + extra_weight), drastically reducing the score.
// schema/config.test.mjs already guards the live config; this test documents the
// fragility for Wave 2 (where weights may be reconfigured).
test("panelScore: extra weight key with score=0 drags score below threshold (documents fragility)", () => {
  const allGates = { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true };
  const weightsWithTypo = { ...WEIGHTS, oops_extra: 0.05 }; // sums to 1.05
  const { score } = panelScore(mkFull(9, allGates), weightsWithTypo);
  // sum = 9*1.0 (known categories) + 0*0.05 (missing in scores) = 9
  // tw  = 1.05
  // score = 9/1.05 ≈ 8.57 — below the 9.0 threshold!
  assert.ok(
    score < 9,
    `a typo extra weight key drops a perfect-9 reviewer below threshold (score=${score}); ` +
    "config.schema weights block should add additionalProperties:false"
  );
});
