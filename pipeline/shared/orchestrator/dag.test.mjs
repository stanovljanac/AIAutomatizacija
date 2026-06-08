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

// ─── [verifier] additional probes ──────────────────────────────────────────

test("[verifier] topoWaves detects a multi-node cycle (a→b→c→a)", () => {
  assert.throws(
    () =>
      topoWaves([
        { id: "a", deps: ["c"] },
        { id: "b", deps: ["a"] },
        { id: "c", deps: ["b"] },
      ]),
    /cycle/,
  );
});

test("[verifier] topoWaves handles a node with no deps key at all", () => {
  // A node object that has no 'deps' property should be treated as deps=[]
  const nodes = [{ id: "root" }, { id: "child", deps: ["root"] }];
  const waves = topoWaves(nodes);
  assert.equal(waves[0][0], "root");
  assert.equal(waves[1][0], "child");
});

test("[verifier] resume: downstream result is available after manifest JSON round-trip", async () => {
  // Simulates a real resume: manifest is serialized to JSON and back (as writeFileSync/readFileSync do).
  // The downstream node must be able to read the upstream node's result from 'results'.
  let downstreamSawResult = undefined;

  const nodes = [
    { id: "up", run: async () => ({ value: 42, nested: { x: 1 } }) },
    {
      id: "gate",
      deps: ["up"],
      gate: true,
      run: async () => ({ __pause: true, reason: "human gate" }),
    },
    {
      id: "down",
      deps: ["gate"],
      run: async (_ctx, results) => {
        downstreamSawResult = results.up;
        return "done";
      },
    },
  ];

  // First run: up completes, gate pauses.
  const saved = [];
  const firstOut = await runDag(nodes, {
    retry: noRetry,
    saveManifest: (m) => saved.push(JSON.stringify(m)),
  });
  assert.equal(firstOut.blocked.id, "gate");
  assert.equal(firstOut.manifest.nodes.up.status, "done");

  // Simulate owner clearing the gate — parse the persisted manifest, mark gate done.
  const persisted = JSON.parse(saved.at(-1));
  persisted.nodes.gate = { status: "done", gate: true, result: { approved: true } };

  // Second run with the round-tripped manifest. 'up' must stay done, 'down' must run
  // and see results.up == { value: 42, nested: { x: 1 } }.
  const secondOut = await runDag(nodes, {
    manifest: persisted,
    retry: noRetry,
  });
  assert.equal(secondOut.ok, true, "run completes after gate is cleared");
  assert.deepEqual(
    downstreamSawResult,
    { value: 42, nested: { x: 1 } },
    "downstream sees upstream result restored from manifest after JSON round-trip",
  );
});

test("[verifier] mixed wave: one sibling pauses (gate), another succeeds — both persisted, next wave never runs", async () => {
  let nextWaveRan = false;
  const nodes = [
    {
      id: "sibling_gate",
      run: async () => ({ __pause: true, reason: "needs approval" }),
      gate: true,
    },
    {
      id: "sibling_ok",
      run: async () => "success",
    },
    {
      // depends on both siblings — must NOT run while one sibling is paused
      id: "next",
      deps: ["sibling_gate", "sibling_ok"],
      run: async () => {
        nextWaveRan = true;
        return "next done";
      },
    },
  ];

  const pauseEvents = [];
  const out = await runDag(nodes, {
    retry: noRetry,
    onPause: (p) => pauseEvents.push(p),
  });

  assert.equal(out.ok, false);
  assert.equal(out.blocked.kind, "gate");

  // Both siblings must be recorded in the manifest:
  assert.equal(out.manifest.nodes.sibling_gate.status, "awaiting", "paused sibling recorded as awaiting");
  assert.equal(out.manifest.nodes.sibling_ok.status, "done", "successful sibling recorded as done");

  // The successful sibling's result must be in 'results':
  assert.equal(out.results.sibling_ok, "success", "successful sibling result available");

  // The next wave must NOT have run:
  assert.equal(nextWaveRan, false, "next wave must not run when an earlier sibling paused");
});

test("[verifier] node returning undefined is stored as done with result:undefined, not a crash", async () => {
  const nodes = [
    { id: "void_node", run: async () => undefined },
    {
      id: "consumer",
      deps: ["void_node"],
      run: async (_ctx, results) => (results.void_node === undefined ? "saw-undefined" : "saw-value"),
    },
  ];
  const out = await runDag(nodes, { retry: noRetry });
  assert.equal(out.ok, true);
  assert.equal(out.manifest.nodes.void_node.status, "done");
  assert.equal(out.results.consumer, "saw-undefined");
});

test("[verifier] blocked returns first blocked node; second blocked sibling is still persisted correctly", async () => {
  // Two siblings both error in the same wave. Only the first becomes 'blocked',
  // but the second must still be persisted (so it can be retried on resume).
  const nodes = [
    {
      id: "err_a",
      run: async () => {
        throw Object.assign(new Error("fail-a"), { status: 400 });
      },
    },
    {
      id: "err_b",
      run: async () => {
        throw Object.assign(new Error("fail-b"), { status: 400 });
      },
    },
  ];
  const out = await runDag(nodes, { retry: noRetry });
  assert.equal(out.ok, false);
  // Both nodes must be paused in the manifest:
  assert.equal(out.manifest.nodes.err_a.status, "paused", "err_a persisted as paused");
  assert.equal(out.manifest.nodes.err_b.status, "paused", "err_b persisted as paused");
  // blocked only reports one (first in settled order), but both must be present:
  assert.ok(["err_a", "err_b"].includes(out.blocked.id), "blocked id is one of the two error nodes");
  // blockedAll now surfaces every blocked sibling:
  assert.equal(out.blockedAll.length, 2, "blockedAll reports both failures");
});

test("runDag tolerates a manifest of literal null (e.g. a corrupt manifest file)", async () => {
  const out = await runDag([{ id: "a", run: async () => 1 }], { manifest: null, retry: noRetry });
  assert.equal(out.ok, true);
  assert.equal(out.manifest.nodes.a.status, "done");
});
