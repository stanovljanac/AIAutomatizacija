// F6 — the Runner port dispatches mechanical commands and agent nodes per mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRunner, MockRunner, ClaudeCodeRunner, runCommand } from "./runner.mjs";

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
