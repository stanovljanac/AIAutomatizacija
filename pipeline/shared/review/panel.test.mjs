// F7 — panel scoring + verdict bands are deterministic and schema-valid.
import { test } from "node:test";
import assert from "node:assert/strict";
import { panelScore, verdict, assembleReview, runPanelOnce, resolvePanelCfg, ideaGateDecision, reviewIdea } from "./panel.mjs";
import { MockReviewer } from "./reviewer.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const WEIGHTS = {
  retention_structure: 0.3,
  originality_depth: 0.2,
  hard_rule_craft: 0.2,
  style_tone: 0.15,
  readaloud_clarity: 0.15,
};
const CFG = { score_threshold: 9, auto_pass_threshold: 9.2, weights: WEIGHTS };

const gates = (ok = true) => ({
  accuracy: ok,
  original_angle: true,
  synthetic_data: true,
  on_screen_source: true,
});
const mk = (val, ok = true) => ({
  reviewer: "x",
  model: "m",
  hard_gates: gates(ok),
  category_scores: {
    retention_structure: val,
    originality_depth: val,
    hard_rule_craft: val,
    style_tone: val,
    readaloud_clarity: val,
  },
  fixes: [],
});

test("panelScore computes the weighted average", () => {
  assert.equal(panelScore(mk(9.3), WEIGHTS).score, 9.3);
});

test("panelScore clamps below 9 when a hard gate fails", () => {
  const { score, gatesOk } = panelScore(mk(9.8, false), WEIGHTS);
  assert.equal(gatesOk, false);
  assert.ok(score <= 8.5);
});

test("verdict band = auto when both reviewers >= 9.2 and gates ok", () => {
  assert.equal(verdict([mk(9.3), mk(9.25)], CFG).verdict.band, "auto");
});

test("verdict band = soft when both >= 9 but below 9.2", () => {
  assert.equal(verdict([mk(9.05), mk(9.1)], CFG).verdict.band, "soft");
});

test("verdict band = pause when a reviewer is below 9", () => {
  assert.equal(verdict([mk(8.5), mk(9.3)], CFG).verdict.band, "pause");
});

test("verdict band = fail when any hard gate fails", () => {
  assert.equal(verdict([mk(9.3, false), mk(9.3)], CFG).verdict.band, "fail");
});

test("assembleReview produces a schema-valid review doc", () => {
  const doc = assembleReview({
    stage: "script",
    target: "content/_FIXTURE/script.json",
    iteration: 0,
    results: [mk(9.3), mk(9.25)],
    panelCfg: CFG,
  });
  assert.equal(doc.verdict.band, "auto");
  assert.equal(doc.reviewers.length, 2);
});

test("runPanelOnce runs injected reviewers and assembles a doc", async () => {
  const reviewers = [new MockReviewer({ name: "a" }), new MockReviewer({ name: "b" })];
  const doc = await runPanelOnce({
    stage: "script",
    target: "t",
    artifact: {},
    reviewers,
    panelCfg: CFG,
  });
  assert.equal(doc.stage, "script");
  assert.equal(doc.verdict.band, "soft"); // default mock = all 9.0
});

test("runPanelOnce surfaces a deferral when a reviewer cannot run inline", async () => {
  const reviewers = [
    new MockReviewer({ name: "a" }),
    { review: async () => ({ deferred: true, task: {} }) },
  ];
  const out = await runPanelOnce({ stage: "script", target: "t", reviewers, panelCfg: CFG });
  assert.ok(out.deferred && out.deferred.length === 1);
});

// ── IDEA STAGE (content-value gate, decisions #6/#7) — same panel, idea thresholds/gates/weights ──

const IDEA_WEIGHTS = { audience_value: 0.3, reusable_takeaway: 0.25, transformation: 0.2, packaging: 0.15, audience_fit: 0.1 };
// idea gate: >=9.0 auto (qualify), 7.5–9.0 soft (owner), <7.5 reject; gate fail → reject
const IDEA_CFG = {
  score_threshold: 7.5,
  auto_pass_threshold: 9.0,
  required_gates: ["value_type_present", "takeaway_present", "on_brand"],
  weights: IDEA_WEIGHTS,
};
const ideaGates = (ok = true) => ({ value_type_present: ok, takeaway_present: true, on_brand: true });
const mkIdea = (val, ok = true) => ({
  reviewer: "x",
  model: "m",
  hard_gates: ideaGates(ok),
  category_scores: { audience_value: val, reusable_takeaway: val, transformation: val, packaging: val, audience_fit: val },
  fixes: [],
});

test("resolvePanelCfg merges the idea stage override onto the global panel", () => {
  const panel = { score_threshold: 9, auto_pass_threshold: 9.2, weights: { a: 1 }, stage_overrides: { idea: IDEA_CFG } };
  const merged = resolvePanelCfg(panel, "idea");
  assert.equal(merged.score_threshold, 7.5);
  assert.equal(merged.auto_pass_threshold, 9.0);
  assert.deepEqual(merged.required_gates, ["value_type_present", "takeaway_present", "on_brand"]);
  // a non-overridden stage falls back to the global panel unchanged
  assert.equal(resolvePanelCfg(panel, "script").score_threshold, 9);
});

test("the live config defines an idea stage_override with the 9.0/7.5 thresholds", () => {
  const cfg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "config.json"), "utf8"));
  const idea = resolvePanelCfg(cfg.review.panel, "idea");
  assert.equal(idea.auto_pass_threshold, 9.0, "≥90% auto-qualify");
  assert.equal(idea.score_threshold, 7.5, "<75% auto-reject floor");
  assert.ok(cfg.review.panel.stages.includes("idea"), "idea is a configured stage");
});

test("idea verdict bands: >=9 auto, 7.5–9 soft, <7.5 pause, gate-fail = fail", () => {
  assert.equal(verdict([mkIdea(9.1), mkIdea(9.0)], IDEA_CFG).verdict.band, "auto");
  assert.equal(verdict([mkIdea(8.0), mkIdea(7.5)], IDEA_CFG).verdict.band, "soft");
  assert.equal(verdict([mkIdea(7.0), mkIdea(9.3)], IDEA_CFG).verdict.band, "pause");
  assert.equal(verdict([mkIdea(9.5, false)], IDEA_CFG).verdict.band, "fail");
});

test("ideaGateDecision maps bands to qualify / owner / reject", () => {
  assert.equal(ideaGateDecision("auto"), "qualify");
  assert.equal(ideaGateDecision("soft"), "owner");
  assert.equal(ideaGateDecision("pause"), "reject");
  assert.equal(ideaGateDecision("fail"), "reject");
});

test("assembleReview produces a schema-valid IDEA-stage review doc", () => {
  const doc = assembleReview({
    stage: "idea",
    target: "ideas.json#bulk-personalized-emails",
    iteration: 0,
    results: [mkIdea(9.1), mkIdea(9.0)],
    panelCfg: IDEA_CFG,
  });
  assert.equal(doc.stage, "idea");
  assert.equal(doc.verdict.band, "auto");
  assert.equal(ideaGateDecision(doc.verdict.band), "qualify");
});

test("reviewIdea runs the idea-pass via injected reviewers and returns the gate decision", async () => {
  const panel = { score_threshold: 9, auto_pass_threshold: 9.2, weights: WEIGHTS, stage_overrides: { idea: IDEA_CFG } };
  const ideaReviewer = (val, ok = true) =>
    new MockReviewer({ name: "r", model: "m", responder: () => mkIdea(val, ok) });
  const run = (a, b) => reviewIdea({ idea: { id: "x" }, target: "ideas.json#x", reviewers: [ideaReviewer(a), ideaReviewer(b)], panel });

  assert.equal((await run(9.1, 9.0)).decision, "qualify", "both >=9 → auto-qualify");
  assert.equal((await run(8.0, 8.0)).decision, "owner", "7.5–9 → owner decides");
  assert.equal((await run(7.0, 9.0)).decision, "reject", "<7.5 → reject");
  const gateFail = await reviewIdea({ idea: { id: "x" }, target: "t", reviewers: [new MockReviewer({ responder: () => mkIdea(9.5, false) })], panel });
  assert.equal(gateFail.decision, "reject", "a failed value gate → reject");
});

// ── [verifier] regression tests ───────────────────────────────────────────────

test("[verifier] resolvePanelCfg does NOT mutate the input panel object", () => {
  const panel = {
    score_threshold: 9,
    auto_pass_threshold: 9.2,
    weights: { a: 1 },
    stage_overrides: { idea: { score_threshold: 7.5, auto_pass_threshold: 9.0 } },
  };
  resolvePanelCfg(panel, "idea");
  // The original must be untouched
  assert.equal(panel.score_threshold, 9, "original panel.score_threshold must not be mutated");
  assert.equal(panel.auto_pass_threshold, 9.2, "original panel.auto_pass_threshold must not be mutated");
});

test("[verifier] resolvePanelCfg: empty panel + idea stage returns empty object (no crash)", () => {
  const result = resolvePanelCfg(undefined, "idea");
  assert.deepEqual(result, {}, "undefined panel must return an empty object");
});

test("[verifier] resolvePanelCfg: a stage with no override falls back to global panel unchanged", () => {
  const panel = { score_threshold: 9, auto_pass_threshold: 9.2, stage_overrides: { idea: { score_threshold: 7.5 } } };
  const resolved = resolvePanelCfg(panel, "script");
  assert.equal(resolved.score_threshold, 9, "non-overridden stage must inherit global threshold");
  assert.equal(resolved.auto_pass_threshold, 9.2);
});

test("[verifier] a hard-gate fail in the idea stage caps score at 8.5 → band=fail → reject", () => {
  // The HARD_GATE_CAP (8.5) must apply even for the idea stage (same panel, different gates).
  const gateFailResult = mkIdea(9.5, false); // high score but gate fail
  const { verdict: v } = verdict([gateFailResult], IDEA_CFG);
  assert.equal(v.band, "fail", "gate fail must always produce band=fail regardless of score");
  assert.ok(v.min_score <= 8.5, `score ${v.min_score} must be capped at 8.5 on gate fail`);
  assert.equal(v.proceed, false, "gate fail must set proceed=false");
  assert.equal(ideaGateDecision("fail"), "reject", "ideaGateDecision(fail) must return reject");
});

test("[verifier] idea threshold boundary: exactly 7.5 is 'soft' (owner), not 'pause'", () => {
  const at75 = verdict([mkIdea(7.5), mkIdea(7.5)], IDEA_CFG);
  assert.equal(at75.verdict.band, "soft", "7.5 >= 7.5 threshold means soft (owner decides)");
  assert.equal(ideaGateDecision("soft"), "owner");
});

test("[verifier] idea threshold boundary: 7.4 is 'pause' (→ reject)", () => {
  const below75 = verdict([mkIdea(7.4), mkIdea(7.4)], IDEA_CFG);
  assert.equal(below75.verdict.band, "pause", "7.4 < 7.5 threshold means pause (→ reject)");
  assert.equal(ideaGateDecision("pause"), "reject");
});

test("[verifier] reviewIdea deferral: returns {deferred} with no 'decision' key", async () => {
  const panel = { score_threshold: 9, auto_pass_threshold: 9.2, weights: WEIGHTS, stage_overrides: { idea: IDEA_CFG } };
  const deferredReviewer = { review: async () => ({ deferred: true, task: { id: "x" } }) };
  const normalReviewer = new MockReviewer({ name: "r" });
  const out = await reviewIdea({
    idea: { id: "test" }, target: "t",
    reviewers: [normalReviewer, deferredReviewer], panel,
  });
  assert.ok("deferred" in out, "deferral path must return { deferred: ... }");
  assert.ok(!("decision" in out), "deferral path must NOT include a decision key");
});

test("[verifier] idea stage does not leak script keys into normalised result (and vice versa)", () => {
  // If stage='idea', the result must have only idea category/gate keys.
  const ideaResult = mkIdea(9);
  const { scored } = verdict([ideaResult], IDEA_CFG);
  for (const k of Object.keys(scored[0].category_scores)) {
    assert.ok(
      ["audience_value", "reusable_takeaway", "transformation", "packaging", "audience_fit"].includes(k),
      `unexpected key in idea result: ${k}`,
    );
  }
});
