// R2 — Gemini reviewer: defers without a key; parses a Gemini reply; retries-flag on 5xx; throttles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GeminiReviewer } from "./gemini.mjs";

const geminiReply = (obj) => ({
  ok: true,
  async json() {
    return { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] };
  },
});

const goodReview = {
  score: 9.3,
  hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
  category_scores: { retention_structure: 9, originality_depth: 9, hard_rule_craft: 10, style_tone: 9, readaloud_clarity: 9 },
  fixes: [],
  summary: "solid",
};

test("defers when no API key is configured", async () => {
  const g = new GeminiReviewer({ name: "gemini" }, { getKey: () => undefined });
  const r = await g.review({ stage: "script", artifact: {} });
  assert.equal(r.deferred, true);
});

test("parses a Gemini reply into a normalized review result", async () => {
  let calledUrl = null;
  const fetch = async (url) => { calledUrl = url; return geminiReply(goodReview); };
  const g = new GeminiReviewer({ name: "gemini", model: "gemini-3.5-flash" }, { getKey: () => "KEY", fetch });
  const r = await g.review({ stage: "script", artifact: { id: "x" } });
  assert.equal(r.reviewer, "gemini");
  assert.equal(r.model, "gemini-3.5-flash");
  assert.equal(r.score, 9.3);
  assert.equal(r.hard_gates.on_screen_source, true);
  assert.match(calledUrl, /generativelanguage\.googleapis\.com/);
  assert.match(calledUrl, /key=KEY/);
});

test("throws with a status on a non-ok response (so error-policy can retry 5xx)", async () => {
  const fetch = async () => ({ ok: false, status: 503, async text() { return "overloaded"; } });
  const g = new GeminiReviewer({ name: "gemini" }, { getKey: () => "KEY", fetch });
  await assert.rejects(() => g.review({ stage: "script", artifact: {} }), (e) => e.status === 503);
});

test("throttles consecutive calls to respect the RPM cap", async () => {
  const waits = [];
  const fetch = async () => geminiReply(goodReview);
  const sleep = (ms) => { waits.push(ms); return Promise.resolve(); };
  const g = new GeminiReviewer({ name: "gemini", rpm: 60 }, { getKey: () => "KEY", fetch, sleep });
  await g.review({ stage: "script", artifact: {} });
  await g.review({ stage: "script", artifact: {} });
  assert.ok(waits.some((w) => w > 0), "second call should wait to respect the rate limit");
});
