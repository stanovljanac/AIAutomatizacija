// F6 — the Runner port dispatches mechanical commands and agent nodes per mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRunner, MockRunner, ClaudeCodeRunner, HeadlessRunner, runCommand } from "./runner.mjs";

test("createRunner selects an adapter by mode, defaults to claude-code", () => {
  assert.ok(createRunner({ mode: "mock" }) instanceof MockRunner);
  assert.equal(createRunner().mode, "claude-code");
});

test("createRunner throws on an unknown mode", () => {
  assert.throws(() => createRunner({ mode: "nope" }), /unknown runner mode/);
});

test("MockRunner returns canned agent results and records calls", async () => {
  const runner = new MockRunner({ responder: (t) => ({ ok: true, data: { echoed: t.role } }) });
  const r = await runner.runAgent({ role: "review", prompt: "x" });
  assert.deepEqual(r, { ok: true, data: { echoed: "review" } });
  assert.equal(runner.calls.length, 1);
});

test("ClaudeCodeRunner defers agent nodes to the top-level agent", async () => {
  const r = await new ClaudeCodeRunner().runAgent({ role: "write-script" });
  assert.equal(r.deferred, true);
  assert.equal(r.task.role, "write-script");
});

test("runCommand captures stdout and exit code from a real child process", async () => {
  const { code, stdout } = await runCommand({
    cmd: process.execPath,
    args: ["-e", "process.stdout.write('hello-runner')"],
  });
  assert.equal(code, 0);
  assert.equal(stdout.trim(), "hello-runner");
});

test("runCommand reports a non-zero exit without throwing", async () => {
  const { code } = await runCommand({ cmd: process.execPath, args: ["-e", "process.exit(3)"] });
  assert.equal(code, 3);
});

// ── HeadlessRunner (T5.1): shells `claude -p`, parses --output-format json ─────
// `this.runCommand` is overridden per-instance to inject canned CLI output (no real `claude`).

test("HeadlessRunner builds `claude -p <prompt> --output-format json` and parses the JSON result", async () => {
  const runner = new HeadlessRunner();
  let seen = null;
  runner.runCommand = async (spec) => { seen = spec; return { code: 0, stdout: '{"result":"done","cost_usd":0}' }; };
  const r = await runner.runAgent({ prompt: "do the thing" });
  assert.equal(seen.cmd, "claude");
  assert.deepEqual(seen.args, ["-p", "do the thing", "--output-format", "json"]);
  assert.deepEqual(r, { ok: true, data: { result: "done", cost_usd: 0 } });
});

test("HeadlessRunner appends --model when the task names one", async () => {
  const runner = new HeadlessRunner({ cli: "claude" });
  let seen = null;
  runner.runCommand = async (spec) => { seen = spec; return { code: 0, stdout: "{}" }; };
  await runner.runAgent({ prompt: "x", model: "claude-sonnet-4-6" });
  assert.ok(seen.args.includes("--model") && seen.args.includes("claude-sonnet-4-6"));
});

test("HeadlessRunner surfaces a non-zero exit as { ok:false, error }", async () => {
  const runner = new HeadlessRunner();
  runner.runCommand = async () => ({ code: 1, stderr: "auth required" });
  assert.deepEqual(await runner.runAgent({ prompt: "x" }), { ok: false, error: "auth required" });
});

test("HeadlessRunner falls back to { text } when stdout is not JSON", async () => {
  const runner = new HeadlessRunner();
  runner.runCommand = async () => ({ code: 0, stdout: "plain text answer" });
  assert.deepEqual(await runner.runAgent({ prompt: "x" }), { ok: true, data: { text: "plain text answer" } });
});

test("createRunner builds a HeadlessRunner in headless mode", () => {
  assert.ok(createRunner({ mode: "headless" }) instanceof HeadlessRunner);
});
