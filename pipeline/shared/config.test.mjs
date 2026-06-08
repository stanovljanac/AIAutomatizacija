// F2 — the live config and the example both satisfy config.schema, and the
// review-panel invariants hold (weights sum to 1, auto-pass >= pass threshold).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFile, readJson } from "./testkit/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = path.join(__dirname, "config.json");
const EXAMPLE = path.join(__dirname, "config.example.json");

// config.json is git-ignored (local copy) — only test it when present.
const targets = [["config.example.json", EXAMPLE]];
if (fs.existsSync(CONFIG)) targets.push(["config.json", CONFIG]);

for (const [label, file] of targets) {
  test(`${label} validates against config.schema`, () => {
    const { valid, errors } = validateFile(file, "config");
    assert.ok(valid, JSON.stringify(errors));
  });

  test(`${label} review.panel weights sum to 1.0`, () => {
    const cfg = readJson(file);
    const w = cfg.review.panel.weights;
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `weights sum = ${sum}`);
  });

  test(`${label} auto_pass_threshold >= score_threshold`, () => {
    const p = readJson(file).review.panel;
    assert.ok(p.auto_pass_threshold >= p.score_threshold);
  });

  test(`${label} has at least 2 enabled reviewers`, () => {
    const enabled = readJson(file).review.panel.reviewers.filter((r) => r.enabled !== false);
    assert.ok(enabled.length >= 2, `only ${enabled.length} enabled`);
  });
}

test("readJson import is available", () => {
  assert.equal(typeof readJson, "function");
});
