// F7 — the reviewer factory maps providers to adapters and wires the runner.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createReviewer, MockReviewer } from "./reviewer.mjs";
import { createRunner } from "../orchestrator/runner.mjs";

test("createReviewer('mock') returns a MockReviewer", async () => {
  const rv = await createReviewer({ provider: "mock", name: "m", model: "x" });
  assert.ok(rv instanceof MockReviewer);
});

test("MockReviewer.review returns a shaped result", async () => {
  const rv = await createReviewer({ provider: "mock", name: "m", model: "x" });
  const out = await rv.review({ stage: "script", artifact: {} });
  assert.equal(out.reviewer, "m");
  assert.ok("category_scores" in out && "hard_gates" in out);
});

test("createReviewer('claude_subagent') defers in claude-code mode", async () => {
  const runner = createRunner({ mode: "claude-code" });
  const rv = await createReviewer(
    { provider: "claude_subagent", name: "sonnet", model: "claude-sonnet-4-6" },
    { runner }
  );
  const out = await rv.review({ stage: "script", artifact: { a: 1 }, rubric: "score it" });
  assert.equal(out.deferred, true);
  assert.equal(out.task.role, "review");
});

test("gemini reviewer defers when no API key is configured", async () => {
  const g = await createReviewer({ provider: "gemini", name: "gemini", model: "gemini-3-flash" }, { getKey: () => undefined });
  const r = await g.review({ stage: "script", artifact: {} });
  assert.equal(r.deferred, true);
});

test("groq adapter is still an honest stub", async () => {
  const q = await createReviewer({ provider: "groq", name: "groq" });
  await assert.rejects(() => q.review({ stage: "script" }), /future upgrade/);
});

test("createReviewer rejects an unknown provider", async () => {
  await assert.rejects(() => createReviewer({ provider: "nope" }), /unknown reviewer provider/);
});
