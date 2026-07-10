// D-053 (2026-07-09): Gemini retired from the review panel — the grown system exceeds its
// free-tier daily quota (20 req/day/model; sustained 503s during 012's review). These tests
// pin the owner decision in code: the live config keeps gemini disabled, and the panel math
// still gates correctly with a single reviewer.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReviewers } from "./build.mjs";
import { verdict } from "./panel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const liveConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json"), "utf8"));

const WEIGHTS = {
  retention_structure: 0.3,
  originality_depth: 0.2,
  hard_rule_craft: 0.2,
  style_tone: 0.15,
  readaloud_clarity: 0.15,
};
const PANEL = { weights: WEIGHTS, score_threshold: 9, auto_pass_threshold: 9.2 };
const GATES_OK = { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true };
const cats = (n) => ({
  retention_structure: n,
  originality_depth: n,
  hard_rule_craft: n,
  style_tone: n,
  readaloud_clarity: n,
});

test("live config: gemini reviewer is retired (enabled:false) — D-053, do not re-enable without owner", () => {
  const gemini = liveConfig.review.panel.reviewers.find((r) => r.name === "gemini");
  assert.ok(gemini, "gemini entry stays in config for provenance");
  assert.equal(gemini.enabled, false);
  assert.equal(liveConfig.llm.providers.gemini.enabled, false);
});

test("live config: exactly one enabled reviewer remains (claude-subagent)", async () => {
  const reviewers = await buildReviewers(liveConfig, { runner: {} });
  assert.deepEqual(
    reviewers.map((r) => r.name),
    ["claude-subagent"]
  );
});

test("verdict gates correctly with a SINGLE reviewer: >=9.2 auto, >=9 soft, <9 pause, gate-fail fail", () => {
  const base = { reviewer: "claude-subagent", hard_gates: GATES_OK };
  assert.equal(verdict([{ ...base, category_scores: cats(9.5) }], PANEL).verdict.band, "auto");
  assert.equal(verdict([{ ...base, category_scores: cats(9) }], PANEL).verdict.band, "soft");
  assert.equal(verdict([{ ...base, category_scores: cats(8.8) }], PANEL).verdict.band, "pause");
  const gateFail = verdict(
    [{ ...base, category_scores: cats(9.5), hard_gates: { ...GATES_OK, on_screen_source: false } }],
    PANEL
  );
  assert.equal(gateFail.verdict.band, "fail");
  assert.equal(gateFail.verdict.proceed, false);
});
