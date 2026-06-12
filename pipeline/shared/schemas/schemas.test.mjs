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
