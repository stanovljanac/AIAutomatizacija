// O1a — the DAG runner: topo waves, parallelism, resumability, error pause, gate pause.
import { test } from "node:test";
import assert from "node:assert/strict";
import { topoWaves, runDag } from "./dag.mjs";

const noRetry = { sleepFn: () => Promise.resolve(), max_attempts: 1 };

test("topoWaves groups by dependency level (parallel siblings together)", () => {
  const waves = topoWaves([
    { id: "a" },
    { id: "b", deps: ["a"] },
    { id: "c", deps: ["a"] },
    { id: "d", deps: ["b", "c"] },
  ]);
  assert.deepEqual(waves[0], ["a"]);
  assert.deepEqual(new Set(waves[1]), new Set(["b", "c"]));
  assert.deepEqual(waves[2], ["d"]);
});

test("topoWaves throws on unknown dep and on cycles", () => {
  assert.throws(() => topoWaves([{ id: "a", deps: ["x"] }]), /unknown node/);
  assert.throws(() => topoWaves([{ id: "a", deps: ["b"] }, { id: "b", deps: ["a"] }]), /cycle/);
});

test("runDag runs all nodes and passes upstream results downstream", async () => {
  const ran = [];
  const nodes = [
    { id: "a", run: async () => { ran.push("a"); return 2; } },
    { id: "b", deps: ["a"], run: async (_ctx, results) => { ran.push("b"); return results.a * 10; } },
  ];
  const out = await runDag(nodes, { retry: noRetry });
  assert.equal(out.ok, true);
  assert.equal(out.results.b, 20);
  assert.deepEqual(ran, ["a", "b"]);
});

test("runDag runs independent siblings in parallel (both execute)", async () => {
  const ran = new Set();
  const nodes = [
    { id: "a", run: async () => { ran.add("a"); return 1; } },
    { id: "b", run: async () => { ran.add("b"); return 1; } },
  ];
  await runDag(nodes, { retry: noRetry });
  assert.deepEqual(ran, new Set(["a", "b"]));
});

test("runDag resumes: a node already 'done' in the manifest is skipped", async () => {
  let bRuns = 0;
  const nodes = [
    { id: "a", run: async () => 1 },
    { id: "b", deps: ["a"], run: async () => { bRuns++; return 2; } },
  ];
  const manifest = { nodes: { a: { status: "done", result: 1 }, b: { status: "done", result: 2 } } };
  const out = await runDag(nodes, { manifest, retry: noRetry });
  assert.equal(out.ok, true);
  assert.equal(bRuns, 0, "b should not re-run when already done");
});

test("runDag pauses on a node error and does not run its dependents", async () => {
  let cRan = false;
  const nodes = [
    { id: "a", run: async () => 1 },
    { id: "b", deps: ["a"], run: async () => { throw Object.assign(new Error("boom"), { status: 400 }); } },
    { id: "c", deps: ["b"], run: async () => { cRan = true; } },
  ];
  const out = await runDag(nodes, { retry: noRetry });
  assert.equal(out.ok, false);
  assert.equal(out.blocked.id, "b");
  assert.equal(out.blocked.kind, "error");
  assert.equal(cRan, false);
  assert.equal(out.manifest.nodes.b.status, "paused");
});

test("runDag pauses at a human gate (__pause) and calls onPause", async () => {
  let paused = null;
  const nodes = [
    { id: "render", run: async () => "cut" },
    { id: "gate", deps: ["render"], gate: true, run: async () => ({ __pause: true, reason: "final approval" }) },
    { id: "upload", deps: ["gate"], run: async () => "uploaded" },
  ];
  const out = await runDag(nodes, { retry: noRetry, onPause: (p) => { paused = p; } });
  assert.equal(out.ok, false);
  assert.equal(out.blocked.kind, "gate");
  assert.equal(out.manifest.nodes.gate.status, "awaiting");
  assert.equal(paused.reason, "final approval");
  assert.ok(!("upload" in out.results), "upload must not run before the gate clears");
});

test("runDag persists the manifest via saveManifest", async () => {
  const saved = [];
  const nodes = [{ id: "a", run: async () => 1 }];
  await runDag(nodes, { retry: noRetry, saveManifest: (m) => saved.push(JSON.parse(JSON.stringify(m))) });
  assert.ok(saved.length >= 1);
  assert.equal(saved.at(-1).nodes.a.status, "done");
});
