// R4 — the self-review loop: pass immediately, improve over iterations, cap, or defer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewLoop } from "./loop.mjs";
import { MockReviewer } from "./reviewer.mjs";

const PANEL = {
  score_threshold: 9,
  auto_pass_threshold: 9.2,
  weights: {
    retention_structure: 0.3,
    originality_depth: 0.2,
    hard_rule_craft: 0.2,
    style_tone: 0.15,
    readaloud_clarity: 0.15,
  },
};

const gates = { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true };
const scored = (v) => ({
  hard_gates: gates,
  category_scores: {
    retention_structure: v,
    originality_depth: v,
    hard_rule_craft: v,
    style_tone: v,
    readaloud_clarity: v,
  },
  fixes: v < 9 ? [{ severity: "major", area: "hook", note: "tighten" }] : [],
});

// A reviewer that scores by whether the artifact has been revised.
const conditional = (name) =>
  new MockReviewer({ name, responder: (input) => scored(input.artifact?.revised ? 9.3 : 7) });

test("passes immediately when reviewers proceed (no fixes applied)", async () => {
  let applied = 0;
  const reviewers = [new MockReviewer({ name: "a", responder: () => scored(9.3) }), new MockReviewer({ name: "b", responder: () => scored(9.3) })];
  const out = await reviewLoop({
    stage: "script",
    artifact: { id: "x" },
    reviewers,
    panelCfg: PANEL,
    maxIterations: 3,
    applyFixes: () => { applied++; return {}; },
  });
  assert.equal(out.passed, true);
  assert.equal(out.iterations, 1);
  assert.equal(applied, 0);
});

test("improves across iterations: fixes are applied, then it passes", async () => {
  let applied = 0;
  const reviewers = [conditional("a"), conditional("b")];
  const out = await reviewLoop({
    stage: "script",
    artifact: { revised: false },
    reviewers,
    panelCfg: PANEL,
    maxIterations: 3,
    applyFixes: (artifact) => { applied++; return { ...artifact, revised: true }; },
  });
  assert.equal(out.passed, true);
  assert.equal(out.iterations, 2);
  assert.equal(applied, 1);
});

test("caps after maxIterations when it never passes, surfacing to the owner", async () => {
  const reviewers = [new MockReviewer({ name: "a", responder: () => scored(7) }), new MockReviewer({ name: "b", responder: () => scored(7) })];
  const out = await reviewLoop({
    stage: "script",
    artifact: {},
    reviewers,
    panelCfg: PANEL,
    maxIterations: 2,
    applyFixes: (a) => a,
  });
  assert.equal(out.passed, false);
  assert.equal(out.capped, true);
  assert.equal(out.iterations, 2);
});

test("surfaces a deferral when a reviewer cannot run inline", async () => {
  const reviewers = [
    new MockReviewer({ name: "a", responder: () => scored(9.3) }),
    { review: async () => ({ deferred: true, reason: "GEMINI_API_KEY not set" }) },
  ];
  const out = await reviewLoop({ stage: "script", artifact: {}, reviewers, panelCfg: PANEL, maxIterations: 3 });
  assert.ok(out.deferred);
});
