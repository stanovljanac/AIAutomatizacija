// F7 — panel scoring + verdict bands are deterministic and schema-valid.
import { test } from "node:test";
import assert from "node:assert/strict";
import { panelScore, verdict, assembleReview, runPanelOnce } from "./panel.mjs";
import { MockReviewer } from "./reviewer.mjs";

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
