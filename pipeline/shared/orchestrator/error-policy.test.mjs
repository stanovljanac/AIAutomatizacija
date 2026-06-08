// P6 — retry/backoff classifies transient vs fatal; guardStep pauses + notifies on failure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { withRetry, defaultIsTransient, guardStep } from "./error-policy.mjs";

const noSleep = () => Promise.resolve();
const transient = () => Object.assign(new Error("rate limit"), { status: 429 });
const fatal = () => Object.assign(new Error("bad request"), { status: 400 });

test("defaultIsTransient flags 429/5xx/network, not 4xx", () => {
  assert.equal(defaultIsTransient(transient()), true);
  assert.equal(defaultIsTransient(Object.assign(new Error("x"), { code: "ECONNRESET" })), true);
  assert.equal(defaultIsTransient(fatal()), false);
});

test("withRetry retries transient up to max_attempts then throws", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => { calls++; throw transient(); }, { max_attempts: 3, sleepFn: noSleep }),
    /rate limit/
  );
  assert.equal(calls, 3);
});

test("withRetry does not retry a fatal error", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => { calls++; throw fatal(); }, { max_attempts: 5, sleepFn: noSleep }),
    /bad request/
  );
  assert.equal(calls, 1);
});

test("withRetry returns once the call succeeds", async () => {
  let calls = 0;
  const out = await withRetry(async () => { calls++; if (calls < 2) throw transient(); return "ok"; }, { sleepFn: noSleep });
  assert.equal(out, "ok");
  assert.equal(calls, 2);
});

test("guardStep returns ok result on success", async () => {
  const r = await guardStep("voice", async () => 42, { retry: { sleepFn: noSleep } });
  assert.deepEqual(r, { ok: true, name: "voice", result: 42 });
});

test("guardStep pauses + calls onFatal on unrecoverable failure (no throw)", async () => {
  let notified = null;
  const r = await guardStep("upload", async () => { throw fatal(); }, {
    retry: { sleepFn: noSleep },
    onFatal: (info) => { notified = info; },
  });
  assert.equal(r.ok, false);
  assert.equal(r.paused, true);
  assert.equal(notified.name, "upload");
});
