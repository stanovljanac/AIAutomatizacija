// F3 — every new Phase B/C schema compiles and accepts a minimal valid document.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, loadSchema } from "../lib/validate-lib.mjs";

test("review.schema compiles and accepts a valid auto-band review", () => {
  loadSchema("review");
  const doc = {
    stage: "script",
    iteration: 0,
    created: "2026-06-08T00:00:00Z",
    reviewers: [
      {
        reviewer: "gemini",
        model: "gemini-3.5-flash",
        score: 9.3,
        hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
        category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 10, style_tone: 9, readaloud_clarity: 9 },
        fixes: [],
      },
    ],
    verdict: { band: "auto", proceed: true, both_pass: true, hard_gate_ok: true, min_score: 9.3 },
  };
  const { valid, errors } = validate(doc, "review");
  assert.ok(valid, JSON.stringify(errors));
});

test("review.schema rejects an out-of-range score and a bad band", () => {
  const bad = {
    stage: "script",
    iteration: 0,
    created: "x",
    reviewers: [{ reviewer: "g", model: "m", score: 12, hard_gates: {}, category_scores: {} }],
    verdict: { band: "nope", proceed: true },
  };
  assert.equal(validate(bad, "review").valid, false);
});

test("news-item.schema accepts a corroborated item", () => {
  const doc = {
    updated: "2026-06-08T00:00:00Z",
    items: [
      {
        id: "abc123",
        title: "Claude Opus 4.8 released",
        url: "https://www.anthropic.com/news/opus-4-8",
        fetched: "2026-06-08T00:00:00Z",
        sources: [
          { name: "anthropic", type: "official", url: "https://www.anthropic.com/news/opus-4-8" },
          { name: "the-decoder", type: "aggregator" },
        ],
        score: 88,
        suggested_archetype: "comparison",
      },
    ],
  };
  const { valid, errors } = validate(doc, "news");
  assert.ok(valid, JSON.stringify(errors));
});

test("timeline.schema accepts a seconds-based timeline", () => {
  const doc = {
    version: 1,
    format: { width: 1920, height: 1080, fps: 30 },
    duration_seconds: 60,
    audio: { src: "narration.mp3", start_seconds: 1.5 },
    scenes: [{ scene_id: "s1", template: "hook-card", start_seconds: 0, end_seconds: 6, props: {} }],
    captions: [{ start_seconds: 1.5, end_seconds: 3, words: [{ w: "Hello", start_seconds: 1.5, end_seconds: 2 }] }],
  };
  const { valid, errors } = validate(doc, "timeline");
  assert.ok(valid, JSON.stringify(errors));
});

test("ideas.schema accepts the new news provenance source", () => {
  const doc = {
    updated: "2026-06-08",
    ideas: [
      {
        id: "claude-opus-48-vs",
        title: "Is Opus 4.8 actually better for spreadsheets?",
        archetype: "comparison",
        task: "data-entry",
        score: 72,
        status: "backlog",
        source: { origin: "news", news_id: "abc123", added: "2026-06-08" },
      },
    ],
  };
  const { valid, errors } = validate(doc, "ideas");
  assert.ok(valid, JSON.stringify(errors));
});

// ── [verifier] regression: review.schema allOf conditionals actually REJECT missing keys ──

const mkReviewDoc = (stage, reviewerOverride = {}) => ({
  stage,
  iteration: 0,
  created: "2026-06-24T00:00:00Z",
  reviewers: [{ reviewer: "g", model: "m", score: 9, ...reviewerOverride }],
  verdict: { band: "auto", proceed: true, both_pass: true, hard_gate_ok: true, min_score: 9 },
});

test("[verifier] review.schema allOf: script-stage doc missing a script category is REJECTED", () => {
  // 'readaloud_clarity' is deliberately absent
  const doc = mkReviewDoc("script", {
    hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
    category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 9, style_tone: 9 },
  });
  const { valid } = validate(doc, "review");
  assert.equal(valid, false, "script-stage doc missing 'readaloud_clarity' must be rejected by allOf");
});

test("[verifier] review.schema allOf: script-stage doc missing a hard gate is REJECTED", () => {
  // 'on_screen_source' is deliberately absent from hard_gates
  const doc = mkReviewDoc("script", {
    hard_gates: { accuracy: true, original_angle: true, synthetic_data: true },
    category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 9, style_tone: 9, readaloud_clarity: 9 },
  });
  const { valid } = validate(doc, "review");
  assert.equal(valid, false, "script-stage doc missing 'on_screen_source' hard gate must be rejected by allOf");
});

test("[verifier] review.schema allOf: idea-stage doc missing an idea category is REJECTED", () => {
  // 'audience_fit' is deliberately absent
  const doc = mkReviewDoc("idea", {
    hard_gates: { value_type_present: true, takeaway_present: true, on_brand: true },
    category_scores: { audience_value: 9, reusable_takeaway: 9, transformation: 9, packaging: 9 },
  });
  const { valid } = validate(doc, "review");
  assert.equal(valid, false, "idea-stage doc missing 'audience_fit' must be rejected by allOf");
});

test("[verifier] review.schema allOf: idea-stage doc missing a hard gate is REJECTED", () => {
  // 'on_brand' is deliberately absent from hard_gates
  const doc = mkReviewDoc("idea", {
    hard_gates: { value_type_present: true, takeaway_present: true },
    category_scores: { audience_value: 9, reusable_takeaway: 9, transformation: 9, packaging: 9, audience_fit: 9 },
  });
  const { valid } = validate(doc, "review");
  assert.equal(valid, false, "idea-stage doc missing 'on_brand' must be rejected by allOf");
});

test("[verifier] review.schema allOf: valid idea doc (no script keys) is ACCEPTED", () => {
  // A complete idea doc must pass without requiring any script-stage keys
  const doc = mkReviewDoc("idea", {
    hard_gates: { value_type_present: true, takeaway_present: true, on_brand: true },
    category_scores: { audience_value: 9, reusable_takeaway: 9, transformation: 9, packaging: 9, audience_fit: 9 },
  });
  const { valid, errors } = validate(doc, "review");
  assert.ok(valid, `valid idea doc rejected: ${JSON.stringify(errors)}`);
});

test("[verifier] review.schema: 'idea' is a valid stage value (added to enum)", () => {
  // Verify the 'idea' enum was actually added to the stage property
  const doc = mkReviewDoc("idea", {
    hard_gates: { value_type_present: true, takeaway_present: true, on_brand: true },
    category_scores: { audience_value: 9, reusable_takeaway: 9, transformation: 9, packaging: 9, audience_fit: 9 },
  });
  const { valid } = validate(doc, "review");
  assert.ok(valid, "stage='idea' must be a valid enum value in review.schema");
});

test("[verifier] ideas.schema accepts the new idea-pass fields (lane, value_type, takeaway, value_band)", () => {
  const doc = {
    updated: "2026-06-24",
    ideas: [{
      id: "email-automation",
      title: "Automate your follow-up emails with Claude",
      archetype: "mini-demo",
      task: "outbound-comms",
      score: 85,
      status: "backlog",
      lane: "desk-fixes",
      value_type: ["saves-time", "avoids-mistake"],
      takeaway: "Use a two-step Claude prompt to draft, then filter follow-ups",
      value_score: 9.1,
      value_band: "qualify",
    }],
  };
  const { valid, errors } = validate(doc, "ideas");
  assert.ok(valid, `ideas schema rejected new idea-pass fields: ${JSON.stringify(errors)}`);
});

test("[verifier] ideas.schema rejects an unknown value_band value", () => {
  const doc = {
    updated: "2026-06-24",
    ideas: [{
      id: "x", title: "X", archetype: "ideas", task: "documents", score: 70, status: "backlog",
      value_band: "approved", // not in enum: qualify | owner | reject
    }],
  };
  const { valid } = validate(doc, "ideas");
  assert.equal(valid, false, "unknown value_band must be rejected");
});

test("[verifier] brief.schema accepts the new idea-pass carry fields (lane, value_type, takeaway, value_band)", () => {
  const doc = {
    id: "010-email-follow-up",
    title_working: "Automate email follow-ups",
    archetype: "mini-demo",
    target_seconds: 360,
    format: "long+short",
    status: "new",
    lane: "desk-fixes",
    value_type: ["saves-time"],
    takeaway: "A two-step Claude prompt handles drafting + filtering",
    value_score: 9.1,
    value_band: "qualify",
  };
  const { valid, errors } = validate(doc, "brief");
  assert.ok(valid, `brief schema rejected idea-pass carry fields: ${JSON.stringify(errors)}`);
});
