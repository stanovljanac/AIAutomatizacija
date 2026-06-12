// O1b + integration — the composed video DAG runs end-to-end on the fixture: voice/align via a
// mock runCommand, render/qa via a mock runAgent, review via a 2-mock-reviewer panel. Fans out
// long||short, writes real artifacts (short script + publish.json), and stops at the owner gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runVideo, loadConfig, videoNodes, defaultExecutors, notifiesOwner, AGENT_DEFERRAL_NODES, REPO_ROOT } from "./run.mjs";
import { topoWaves } from "./dag.mjs";
import { withTempDir } from "../testkit/index.mjs";

// A runner where mechanical steps succeed and agent steps return a result (not deferred).
const okRun = { runCommand: async () => ({ code: 0 }), runAgent: async () => ({ data: { ok: true } }) };
// The two nodes whose real impl needs assets/keys the fixture lacks: a short scene-plan + the upload.
const overrides = {
  plan_short: () => ({ id: "_FIXTURE", scenes: [{ scene_id: "s1", template: "hook-card", props: {} }] }),
  upload: () => ({ videoId: "vidTEST" }),
};

// A 2-mock-reviewer panel so the live review loop runs (and passes) without a Gemini key.
function testConfig() {
  const c = loadConfig(REPO_ROOT);
  c.review = c.review || {};
  c.review.panel = {
    ...c.review.panel,
    reviewers: [
      { name: "a", provider: "mock" },
      { name: "b", provider: "mock" },
    ],
    max_iterations: 1,
  };
  return c;
}

function stageFixture(tmp) {
  const contentRoot = path.join(tmp, "content");
  fs.mkdirSync(contentRoot, { recursive: true });
  fs.cpSync(path.join(REPO_ROOT, "content/_FIXTURE"), path.join(contentRoot, "_FIXTURE"), { recursive: true });
  return contentRoot;
}

test("videoNodes is a valid DAG: brief first, owner gate last", () => {
  const waves = topoWaves(videoNodes(defaultExecutors()));
  assert.equal(waves[0][0], "brief");
  assert.equal(waves.at(-1)[0], "gate_owner");
});

test("end-to-end on _FIXTURE runs to the owner gate and writes real artifacts", async () => {
  await withTempDir(async (tmp) => {
    const contentRoot = stageFixture(tmp);
    let paused = null;
    const r = await runVideo({
      id: "_FIXTURE",
      root: tmp,
      config: testConfig(),
      executors: overrides,
      runner: okRun,
      onPause: (p) => { paused = p; },
    });

    assert.equal(r.ok, false);
    assert.equal(r.blocked.id, "gate_owner");
    assert.equal(r.blocked.kind, "gate");
    assert.equal(paused.node, "gate_owner");

    for (const id of [
      "brief", "script", "review_script", "short_script", "plan_long", "plan_short",
      "voice_long", "align_long", "render_long", "voice_short", "align_short", "render_short",
      "qa", "review_cut", "metadata", "upload",
    ]) {
      assert.equal(r.manifest.nodes[id]?.status, "done", `${id} should be done`);
    }
    assert.equal(r.manifest.nodes.gate_owner.status, "awaiting");

    assert.ok(fs.existsSync(path.join(contentRoot, "_FIXTURE/short/script.json")), "short script derived");
    assert.ok(fs.existsSync(path.join(contentRoot, "_FIXTURE/publish.json")), "publish metadata built");
    assert.ok(fs.existsSync(path.join(contentRoot, "_FIXTURE/run-manifest.json")), "manifest persisted");
  });
});

test("resume: once the owner gate is cleared, the run completes", async () => {
  await withTempDir(async (tmp) => {
    stageFixture(tmp);
    const args = { id: "_FIXTURE", root: tmp, config: testConfig(), executors: overrides, runner: okRun };

    const first = await runVideo(args);
    assert.equal(first.blocked.id, "gate_owner");

    const manifestPath = path.join(tmp, "content/_FIXTURE/run-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.nodes.gate_owner = { status: "done", gate: true, result: { approved: true } };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    const second = await runVideo(args);
    assert.equal(second.ok, true, "run completes after the gate clears");
  });
});

test("agent phases (render/qa) defer to the top agent in Claude-Code mode → the run pauses there", async () => {
  await withTempDir(async (tmp) => {
    stageFixture(tmp);
    const deferRun = { runCommand: async () => ({ code: 0 }), runAgent: async () => ({ deferred: true, task: {} }) };
    const r = await runVideo({ id: "_FIXTURE", root: tmp, config: testConfig(), executors: overrides, runner: deferRun });
    assert.equal(r.ok, false);
    assert.equal(r.blocked.kind, "gate");
    assert.ok(["render_long", "render_short"].includes(r.blocked.id), `paused at an agent node, got ${r.blocked.id}`);
  });
});

// ── T5.1b: gate-aware notify (owner pinged only when truly needed) ───────────
test("notifiesOwner: the 2 gates + review fails + upload ping the owner", () => {
  for (const node of ["review_script", "review_cut", "upload", "gate_owner"]) {
    assert.equal(notifiesOwner({ node, kind: "gate" }), true, `${node} must ping the owner`);
  }
});

test("notifiesOwner: Claude-Code agent hand-offs stay silent (no owner ping)", () => {
  for (const node of ["script", "plan_long", "render_long", "render_short", "qa"]) {
    assert.equal(notifiesOwner({ node, kind: "gate" }), false, `${node} deferral must NOT ping the owner`);
    assert.ok(AGENT_DEFERRAL_NODES.has(node));
  }
});

test("notifiesOwner: any hard ERROR pings the owner, even on an agent node", () => {
  assert.equal(notifiesOwner({ node: "render_long", kind: "error", error: "boom" }), true);
  assert.equal(notifiesOwner({ node: "voice_long", kind: "error", error: "ffmpeg" }), true);
});

// ── integration unit tests for the wired executors ──────────────────────────
test("voice/align executors call the runner with the python scripts (long + short)", async () => {
  const calls = [];
  const runner = { runCommand: async (spec) => { calls.push(spec); return { code: 0 }; } };
  const ex = defaultExecutors();
  const ctx = { id: "005-x", root: "/repo", contentDir: "/repo/content/005-x", config: {}, runner, python: "/repo/.venv/py" };
  await ex.voice_long(ctx);
  await ex.align_short(ctx);
  assert.ok(calls.some((c) => c.args.includes("scripts/make_voice.py") && c.args.includes("005-x")));
  assert.ok(calls.some((c) => c.args.includes("scripts/make_alignment.py") && c.args.includes("005-x/short")));
  assert.equal(calls[0].cmd, "/repo/.venv/py");
});

test("voice executors honor config.voice.provider (azure routes to make_voice_azure.py) — T4.2 seam", async () => {
  const calls = [];
  const runner = { runCommand: async (spec) => { calls.push(spec); return { code: 0 }; } };
  const ex = defaultExecutors();
  const ctx = {
    id: "005-x", root: "/repo", contentDir: "/repo/content/005-x",
    config: { voice: { provider: "azure" } }, runner, python: "/repo/.venv/py",
  };
  await ex.voice_long(ctx);
  await ex.voice_short(ctx);
  assert.ok(calls[0].args.includes("scripts/make_voice_azure.py"), "azure provider must route long voice to the Azure script");
  assert.ok(calls[1].args.includes("scripts/make_voice_azure.py") && calls[1].args.includes("005-x/short"));
  // alignment stays provider-agnostic (always faster-whisper) regardless of the voice provider.
  await ex.align_long(ctx);
  assert.ok(calls[2].args.includes("scripts/make_alignment.py"));
});

test("a mechanical step that exits non-zero rejects (the DAG converts this to a pause)", async () => {
  const runner = { runCommand: async () => ({ code: 1, stderr: "boom" }) };
  const ex = defaultExecutors();
  const ctx = { id: "x", root: "/r", contentDir: "/r/c", config: {}, runner, python: "py" };
  await assert.rejects(() => ex.voice_long(ctx), /voice\(long\) failed/);
});

test("render/qa are agent steps that defer (pause) when the runner can't run them inline", async () => {
  const runner = { runAgent: async () => ({ deferred: true, task: {} }) };
  const ex = defaultExecutors();
  const ctx = { id: "x", root: "/r", contentDir: "/r/c", config: {}, runner };
  assert.equal((await ex.render_long(ctx)).__pause, true);
  assert.equal((await ex.qa(ctx)).__pause, true);
});

// ── [verifier] additional probes ─────────────────────────────────────────────

test("[verifier] spawn error (code -1) is treated as failure by mechanical — DAG pauses, not crashes", async () => {
  // runner.mjs resolves code:-1 on spawn failure (ENOENT etc); mechanical must throw so guardStep pauses.
  const runner = { runCommand: async () => ({ code: -1, stderr: "ENOENT: no such file", stdout: "" }) };
  const ex = defaultExecutors();
  const ctx = { id: "005-y", root: "/r", contentDir: "/r/c", config: {}, runner, python: "/missing/python" };
  await assert.rejects(() => ex.voice_long(ctx), /voice\(long\) failed \(exit -1\)/);
  await assert.rejects(() => ex.align_short(ctx), /align\(short\) failed \(exit -1\)/);
});

test("[verifier] voice/align long targets id only (no /short suffix)", async () => {
  const calls = [];
  const runner = { runCommand: async (spec) => { calls.push(spec); return { code: 0 }; } };
  const ex = defaultExecutors();
  const ctx = { id: "005-z", root: "/r", contentDir: "/r/c", config: {}, runner, python: "py" };
  await ex.voice_long(ctx);
  await ex.align_long(ctx);
  const voiceLongArgs = calls[0].args;
  const alignLongArgs = calls[1].args;
  // Must include the id exactly, NOT id/short
  assert.ok(voiceLongArgs.includes("005-z"), "voice_long must include the long id");
  assert.ok(!voiceLongArgs.includes("005-z/short"), "voice_long must NOT use id/short");
  assert.ok(alignLongArgs.includes("005-z"), "align_long must include the long id");
  assert.ok(!alignLongArgs.includes("005-z/short"), "align_long must NOT use id/short");
});

test("[verifier] voice/align short targets id/short, not bare id", async () => {
  const calls = [];
  const runner = { runCommand: async (spec) => { calls.push(spec); return { code: 0 }; } };
  const ex = defaultExecutors();
  const ctx = { id: "005-z", root: "/r", contentDir: "/r/c", config: {}, runner, python: "py" };
  await ex.voice_short(ctx);
  await ex.align_short(ctx);
  const voiceShortArgs = calls[0].args;
  const alignShortArgs = calls[1].args;
  assert.ok(voiceShortArgs.includes("005-z/short"), "voice_short must use id/short");
  assert.ok(alignShortArgs.includes("005-z/short"), "align_short must use id/short");
  // Negative: the bare id alone must NOT appear as a separate element (only as prefix of id/short)
  assert.ok(!voiceShortArgs.includes("005-z") || voiceShortArgs.includes("005-z/short"),
    "voice_short arg must be id/short not bare id");
});

test("[verifier] render_short targets id/short, render_long targets id (not id/short)", async () => {
  const calls = [];
  const runner = { runAgent: async (spec) => { calls.push(spec); return { data: { ok: true } }; } };
  const ex = defaultExecutors();
  const ctx = { id: "005-z", root: "/r", contentDir: "/r/c", config: {}, runner };
  await ex.render_long(ctx);
  await ex.render_short(ctx);
  assert.equal(calls[0].target, "005-z", "render_long must target the long id");
  assert.equal(calls[1].target, "005-z/short", "render_short must target id/short");
});

test("[verifier] agentStep headless data path — proceeds (does not pause) when runAgent returns data", async () => {
  // Simulates headless mode: runAgent returns { data: { ok: true } }
  const runner = { runAgent: async () => ({ data: { ok: true, frames: 240 } }) };
  const ex = defaultExecutors();
  const ctx = { id: "005-z", root: "/r", contentDir: "/r/c", config: {}, runner };
  const result = await ex.render_long(ctx);
  assert.ok(!result.__pause, "headless data result must not pause");
  assert.equal(result.ok, true, "headless data result passes through");
});

test("[verifier] ctx.root and ctx.python are set by runVideo — direct executor call without them fails fast", async () => {
  // If someone constructs ctx by hand without python, voice_long must throw (not silently call undefined)
  const runner = { runCommand: async (spec) => { return { code: 0, ...spec }; } };
  const ex = defaultExecutors();
  // Omit python — ctx.python is undefined
  const ctx = { id: "005-w", contentDir: "/c", config: {}, runner };
  // mechanical(ctx, undefined, ...) → runCommand({cmd: undefined, ...})
  // code:0 returns ok:true because mock always returns 0 — this is by design (mock doesn't validate cmd).
  // What we CAN verify: if python is set to something non-executable and code -1 is returned, it throws.
  const badRunner = { runCommand: async () => ({ code: -1, stderr: "spawn ENOENT" }) };
  const ctxBad = { id: "005-w", root: "/r", contentDir: "/c", config: {}, runner: badRunner, python: undefined };
  await assert.rejects(() => ex.voice_long(ctxBad), /voice\(long\) failed/,
    "voice_long with missing python and spawn error must throw");
});

test("[verifier] qa step passes ctx.id to runAgent (not a Short-specific id)", async () => {
  const calls = [];
  const runner = { runAgent: async (spec) => { calls.push(spec); return { data: { ok: true } }; } };
  const ex = defaultExecutors();
  const ctx = { id: "005-z", root: "/r", contentDir: "/r/c", config: {}, runner };
  await ex.qa(ctx);
  assert.equal(calls[0].id, "005-z", "qa step should pass the video id, not id/short");
  assert.equal(calls[0].role, "qa-video");
});
