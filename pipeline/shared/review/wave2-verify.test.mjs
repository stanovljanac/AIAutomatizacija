// Wave 2 independent verification tests — added by the verifier, NOT the author.
// These tests are in addition to the existing suite and specifically probe the safety
// properties and edge cases identified during the Wave 2 review.
// Run: node --test pipeline/shared/review/wave2-verify.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewLoop } from "./loop.mjs";
import { panelScore, verdict, runPanelOnce } from "./panel.mjs";
import { normalizeReviewResult, extractJson } from "./rubric.mjs";
import { buildReviewers } from "./build.mjs";
import { MockReviewer } from "./reviewer.mjs";
import { GeminiReviewer } from "./gemini.mjs";

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

// ── PROBE 2: Core safety property ───────────────────────────────────────────
// A hard-gate-failing artifact must NEVER pass the loop, even with perfect category scores.

test("safety: accuracy=false with perfect category scores never passes reviewLoop", async () => {
  const reviewers = [
    new MockReviewer({
      name: "a",
      responder: () => ({
        hard_gates: { accuracy: false, original_angle: true, synthetic_data: true, on_screen_source: true },
        category_scores: {
          retention_structure: 10,
          originality_depth: 10,
          hard_rule_craft: 10,
          style_tone: 10,
          readaloud_clarity: 10,
        },
        fixes: [],
      }),
    }),
  ];
  const out = await reviewLoop({
    stage: "script",
    artifact: { id: "failing-accuracy" },
    reviewers,
    panelCfg: PANEL,
    maxIterations: 3,
    applyFixes: (a) => a,
  });
  assert.equal(out.passed, false, "accuracy=false must not pass");
  assert.equal(out.band, "fail", "band must be fail");
  assert.equal(out.capped, true);
});

test("safety: original_angle=false with perfect category scores never passes reviewLoop", async () => {
  const reviewers = [
    new MockReviewer({
      name: "a",
      responder: () => ({
        hard_gates: { accuracy: true, original_angle: false, synthetic_data: true, on_screen_source: true },
        category_scores: {
          retention_structure: 10, originality_depth: 10, hard_rule_craft: 10, style_tone: 10, readaloud_clarity: 10,
        },
        fixes: [],
      }),
    }),
  ];
  const out = await reviewLoop({ stage: "script", artifact: {}, reviewers, panelCfg: PANEL, maxIterations: 3, applyFixes: (a) => a });
  assert.equal(out.passed, false, "original_angle=false must not pass");
  assert.equal(out.band, "fail");
});

test("safety: panelScore caps score at HARD_GATE_CAP (8.5) when any gate is false, even with scores of 10", () => {
  const result = {
    reviewer: "x", model: "m",
    hard_gates: { accuracy: false, original_angle: true, synthetic_data: true, on_screen_source: true },
    category_scores: {
      retention_structure: 10, originality_depth: 10, hard_rule_craft: 10, style_tone: 10, readaloud_clarity: 10,
    },
    fixes: [],
  };
  const { score, gatesOk } = panelScore(result, PANEL.weights);
  assert.equal(gatesOk, false, "gate must be reported as failed");
  assert.ok(score <= 8.5, `score ${score} must be clamped to <= 8.5`);
  // Confirm: 8.5 clamped score is below both thresholds (9 and 9.2), so it cannot pass
  assert.ok(score < PANEL.score_threshold, "clamped score must be below score_threshold");
});

// ── PROBE 3: normalizeReviewResult + loop — bare {score:10} fails closed ────

test("safety: normalizeReviewResult({score:10}) produces all-false hard gates and zero category scores", () => {
  const normalized = normalizeReviewResult({ score: 10 }, { reviewer: "bare", model: "m" });
  for (const [k, v] of Object.entries(normalized.hard_gates)) {
    assert.equal(v, false, `gate ${k} must default to false`);
  }
  for (const [k, v] of Object.entries(normalized.category_scores)) {
    assert.equal(v, 0, `category ${k} must default to 0`);
  }
  assert.equal(normalized.score, 10, "self-reported score is preserved in the normalized object");
});

test("safety: MockReviewer returning {score:10} only — wired through reviewLoop — fails closed", async () => {
  // This simulates a model that only emits a score with no gates or category breakdown.
  // normalizeReviewResult defaults everything to zero/false, so the loop must fail.
  const normalized = normalizeReviewResult({ score: 10 }, { reviewer: "bare", model: "m" });
  const bareReviewer = { review: async () => normalized };

  const out = await reviewLoop({
    stage: "script",
    artifact: { id: "bare-response" },
    reviewers: [bareReviewer],
    panelCfg: PANEL,
    maxIterations: 1,
    applyFixes: null,
  });
  assert.equal(out.passed, false, "bare {score:10} response must fail closed");
  assert.equal(out.band, "fail", "band must be fail because all gates defaulted to false");
});

test("safety: normalizeReviewResult(null) fails closed (null/undefined model reply)", () => {
  const normalized = normalizeReviewResult(null, { reviewer: "null-model", model: "m" });
  const allFalse = Object.values(normalized.hard_gates).every((v) => v === false);
  assert.ok(allFalse, "all hard_gates must be false when model returns null");
  assert.equal(normalized.score, 0);
});

// ── PROBE 4: Gemini throttle ─────────────────────────────────────────────────

test("throttle: _lastCall is updated on the first call (no wait), so the second call waits", async () => {
  const waits = [];
  const goodReply = {
    ok: true,
    async json() {
      return {
        candidates: [{
          content: { parts: [{ text: JSON.stringify({
            score: 9,
            hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
            category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 9, style_tone: 9, readaloud_clarity: 9 },
            fixes: [], summary: "",
          }) }] },
        }],
      };
    },
  };
  const g = new GeminiReviewer(
    { name: "g", rpm: 60 },
    { getKey: () => "KEY", fetch: async () => goodReply, sleep: (ms) => { waits.push(ms); return Promise.resolve(); } },
  );
  assert.equal(g._lastCall, 0, "_lastCall starts at 0");

  await g.review({ stage: "script", artifact: {} });
  const afterFirst = g._lastCall;
  assert.ok(afterFirst > 0, "_lastCall must be set after first call");

  await g.review({ stage: "script", artifact: {} });
  assert.ok(waits.length >= 1, "second call must have triggered a sleep");
  assert.ok(waits[0] > 0, "sleep duration must be positive");
});

test("throttle: concurrent calls on same instance — JS single-thread ensures second call sees _lastCall set by first", async () => {
  const waits = [];
  const goodReply = {
    ok: true,
    async json() {
      return {
        candidates: [{
          content: { parts: [{ text: JSON.stringify({
            score: 9,
            hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
            category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 9, style_tone: 9, readaloud_clarity: 9 },
            fixes: [], summary: "",
          }) }] },
        }],
      };
    },
  };
  const g = new GeminiReviewer(
    { name: "g", rpm: 60 },
    { getKey: () => "KEY", fetch: async () => goodReply, sleep: (ms) => { waits.push(ms); return Promise.resolve(); } },
  );
  // Two promises started at the same time via Promise.all
  await Promise.all([
    g.review({ stage: "script", artifact: {} }),
    g.review({ stage: "script", artifact: {} }),
  ]);
  // First call runs sync through _throttle (no sleep, _lastCall = 0 -> wait <= 0),
  // sets _lastCall, then awaits fetch. Second call then enters _throttle and sees
  // _lastCall already set, so it correctly waits.
  assert.ok(waits.length >= 1, "at least one of the two concurrent calls must have waited");
});

// ── PROBE 5: Loop iteration accounting ──────────────────────────────────────

test("iteration accounting: maxIterations=1 failing artifact → passed:false, capped:true, iterations:1, applyFixes NOT called", async () => {
  let fixesCalled = 0;
  const reviewer = new MockReviewer({
    name: "a",
    responder: () => ({
      hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
      category_scores: { retention_structure: 5, originality_depth: 5, hard_rule_craft: 5, style_tone: 5, readaloud_clarity: 5 },
      fixes: [{ severity: "major", area: "hook", note: "too slow" }],
    }),
  });
  const out = await reviewLoop({
    stage: "script",
    artifact: { id: "failing" },
    reviewers: [reviewer],
    panelCfg: PANEL,
    maxIterations: 1,
    applyFixes: async (a) => { fixesCalled++; return a; },
  });
  assert.equal(out.passed, false, "must not pass");
  assert.equal(out.capped, true, "must be capped");
  assert.equal(out.iterations, 1, "must count exactly 1 review");
  assert.equal(fixesCalled, 0, "applyFixes must NOT be called on the final (only) iteration");
});

test("iteration accounting: iterations count reviews not loop indices (deferral on first attempt = 0 reviews counted)", async () => {
  const reviewers = [{ review: async () => ({ deferred: true, reason: "no key" }) }];
  const out = await reviewLoop({ stage: "script", artifact: {}, reviewers, panelCfg: PANEL, maxIterations: 3 });
  assert.ok(out.deferred, "must surface deferral");
  assert.equal(out.iterations, 0, "deferred before any review completes = 0 iterations");
});

// ── PROBE 6: extractJson parsing ────────────────────────────────────────────

test("extractJson: strips prose before and after JSON object", () => {
  const result = extractJson('Here is my review: {"score":9} Hope it helps!');
  assert.equal(result, '{"score":9}');
  assert.doesNotThrow(() => JSON.parse(result));
});

test("extractJson: handles fenced json block", () => {
  const result = extractJson("```json\n{\"score\":8.5}\n```");
  assert.equal(result.trim(), '{"score":8.5}');
  assert.doesNotThrow(() => JSON.parse(result));
});

test("extractJson: handles non-labeled fence (```)", () => {
  const result = extractJson("```\n{\"score\":9}\n```");
  assert.equal(result.trim(), '{"score":9}');
  assert.doesNotThrow(() => JSON.parse(result));
});

test("extractJson: throws a clear error when no JSON object is present", () => {
  assert.throws(
    () => extractJson("I cannot review this content due to safety policies."),
    /no JSON object found/,
    "must throw with a clear message when there is no JSON"
  );
});

test("extractJson: handles nested objects correctly (uses lastIndexOf for closing brace)", () => {
  const result = extractJson('prefix {"a":{"b":1}} suffix');
  assert.equal(result, '{"a":{"b":1}}');
  assert.doesNotThrow(() => JSON.parse(result));
});

test("gemini: throws a clear error when model returns pure prose (no JSON)", async () => {
  const fetch = async () => ({
    ok: true,
    async json() {
      return { candidates: [{ content: { parts: [{ text: "I cannot review this." }] } }] };
    },
  });
  const g = new GeminiReviewer({ name: "g" }, { getKey: () => "KEY", fetch, sleep: () => Promise.resolve() });
  await assert.rejects(
    () => g.review({ stage: "script", artifact: {} }),
    /no JSON object found/,
    "must throw with a clear message so the caller can surface it"
  );
});

test("gemini: throws with .status on non-ok response (enables retry policy)", async () => {
  const fetch = async () => ({ ok: false, status: 429, async text() { return "rate limited"; } });
  const g = new GeminiReviewer({ name: "g" }, { getKey: () => "KEY", fetch, sleep: () => Promise.resolve() });
  await assert.rejects(
    () => g.review({ stage: "script", artifact: {} }),
    (e) => {
      assert.equal(e.status, 429, "error must carry .status for retry-policy");
      return true;
    }
  );
});

// ── PROBE 7: build.mjs ───────────────────────────────────────────────────────

test("buildReviewers: drops enabled:false, keeps enabled:true and entries without 'enabled' key", async () => {
  const config = {
    review: {
      panel: {
        reviewers: [
          { provider: "mock", name: "keep-a", enabled: true },
          { provider: "mock", name: "drop-b", enabled: false },
          { provider: "mock", name: "keep-c" },          // no enabled key → keep
          { provider: "groq", name: "drop-groq", enabled: false },
        ],
      },
    },
  };
  const reviewers = await buildReviewers(config);
  const names = reviewers.map((r) => r.name);
  assert.ok(names.includes("keep-a"), "enabled:true reviewer must be kept");
  assert.ok(names.includes("keep-c"), "reviewer without 'enabled' key must be kept (defaults to enabled)");
  assert.ok(!names.includes("drop-b"), "enabled:false reviewer must be dropped");
  assert.ok(!names.includes("drop-groq"), "groq enabled:false must be dropped");
  assert.equal(reviewers.length, 2);
});

test("buildReviewers: empty config.review.panel.reviewers returns empty array", async () => {
  const reviewers = await buildReviewers({ review: { panel: { reviewers: [] } } });
  assert.deepEqual(reviewers, []);
});

test("buildReviewers: missing config returns empty array (no crash)", async () => {
  const reviewers = await buildReviewers({});
  assert.deepEqual(reviewers, []);
});

// ── Additional safety: empty panel blocked by schema validation ──────────────

test("safety: runPanelOnce with empty reviewers array throws schema validation error (schema enforces minItems:1)", async () => {
  await assert.rejects(
    () => runPanelOnce({ stage: "script", target: "t", artifact: {}, reviewers: [], panelCfg: PANEL }),
    /assembled review invalid/,
    "empty reviewers must be rejected by schema validation, not silently pass"
  );
});

// ── Verify both-reviewer scenario: ONE gate failure anywhere → fail ──────────

test("safety: panel with two reviewers — one passes all gates, one fails a gate → band=fail, proceed=false", async () => {
  const reviewers = [
    new MockReviewer({
      name: "good",
      responder: () => ({
        hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
        category_scores: { retention_structure: 9.5, originality_depth: 9.5, hard_rule_craft: 9.5, style_tone: 9.5, readaloud_clarity: 9.5 },
        fixes: [],
      }),
    }),
    new MockReviewer({
      name: "bad",
      responder: () => ({
        hard_gates: { accuracy: true, original_angle: true, synthetic_data: false, on_screen_source: true }, // synthetic_data fails
        category_scores: { retention_structure: 9.5, originality_depth: 9.5, hard_rule_craft: 9.5, style_tone: 9.5, readaloud_clarity: 9.5 },
        fixes: [{ severity: "blocker", area: "data", note: "real client data found" }],
      }),
    }),
  ];
  const out = await reviewLoop({
    stage: "script",
    artifact: { id: "mixed-panel" },
    reviewers,
    panelCfg: PANEL,
    maxIterations: 1,
  });
  assert.equal(out.passed, false, "one gate failure in panel must prevent pass");
  assert.equal(out.band, "fail");
});
