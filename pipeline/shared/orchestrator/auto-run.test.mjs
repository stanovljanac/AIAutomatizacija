// T5.1 — autonomous driver: pick/resume planning + pause classification, all with injected deps.
import { test } from "node:test";
import assert from "node:assert/strict";
import { autoRun, classifyPause } from "./auto-run.mjs";
import { AGENT_DEFERRAL_NODES } from "./run.mjs";

const bank = () => ({
  updated: "2026-06-12",
  ideas: [
    { id: "top", title: "Top", task: "documents", archetype: "ideas", score: 90, status: "backlog", produced_video_id: null },
    { id: "low", title: "Low", task: "scheduling", archetype: "ideas", score: 50, status: "backlog", produced_video_id: null },
  ],
});
const busyBank = () => ({
  ideas: [
    { id: "wip", title: "WIP", archetype: "ideas", score: 90, status: "in-progress", produced_video_id: "009-wip" },
    { id: "next", title: "Next", archetype: "ideas", score: 99, status: "backlog", produced_video_id: null },
  ],
});

const fakeScaffold = (calls = []) => (slug, opts) => (calls.push({ slug, opts }), { id: `010-${slug}`, dest: `c/010-${slug}` });
const dagResult = (blocked) => (blocked ? { ok: false, blocked } : { ok: true });

// ── classifyPause ─────────────────────────────────────────────────────────────

test("classifyPause: a completed run is done", () => {
  assert.deepEqual(classifyPause({ ok: true }), { kind: "done" });
  assert.deepEqual(classifyPause({ ok: false, blocked: null }), { kind: "done" });
});

test("classifyPause: the owner gate + a failed review are owner gates", () => {
  assert.equal(classifyPause(dagResult({ id: "gate_owner", kind: "gate", reason: "review draft" })).kind, "ownerGate");
  assert.equal(classifyPause(dagResult({ id: "review_script", kind: "gate", reason: "below threshold" })).kind, "ownerGate");
});

test("classifyPause: a hard error is an owner gate flagged as error", () => {
  const a = classifyPause(dagResult({ id: "voice_long", kind: "error", error: "ffmpeg died" }));
  assert.equal(a.kind, "ownerGate");
  assert.equal(a.error, true);
  assert.match(a.reason, /ffmpeg/);
});

test("classifyPause: a Claude-Code skill hand-off is an agentTask (not an owner ping)", () => {
  for (const node of ["script", "render_long", "render_short", "qa", "plan_long"]) {
    assert.equal(classifyPause(dagResult({ id: node, kind: "gate", reason: "via skill" })).kind, "agentTask", node);
  }
});

// ── autoRun ─────────────────────────────────────────────────────────────────--

test("autoRun (idle): picks the top idea, persists in-progress BEFORE running, runs its DAG", async () => {
  const order = [];
  const persisted = [];
  const ranWith = [];
  const out = await autoRun(bank(), {
    scaffold: fakeScaffold(),
    persistIdeas: async (u) => { order.push("persist"); persisted.push(u); },
    runVideo: async (args) => { order.push("run"); ranWith.push(args); return dagResult({ id: "render_long", kind: "gate", reason: "render" }); },
  });
  assert.equal(out.picked, true);
  assert.equal(out.id, "010-top");
  assert.equal(out.ideaId, "top");
  assert.equal(out.action.kind, "agentTask");
  assert.equal(ranWith[0].id, "010-top", "runVideo got the scaffolded id");
  assert.deepEqual(order, ["persist", "run"], "the in-progress marker is persisted BEFORE the run");
  assert.equal(persisted[0].ideas.find((i) => i.id === "top").status, "in-progress");
});

test("autoRun (busy): resumes the in-progress video, scaffolds nothing, persists nothing", async () => {
  const scaffoldCalls = [];
  let persisted = false;
  const ranWith = [];
  const out = await autoRun(busyBank(), {
    scaffold: fakeScaffold(scaffoldCalls),
    persistIdeas: async () => { persisted = true; },
    runVideo: async (args) => { ranWith.push(args); return dagResult({ id: "gate_owner", kind: "gate", reason: "approve" }); },
  });
  assert.equal(out.resumed, true);
  assert.equal(out.id, "009-wip");
  assert.equal(out.action.kind, "ownerGate");
  assert.equal(scaffoldCalls.length, 0, "must not scaffold while busy");
  assert.equal(persisted, false, "must not persist while busy");
  assert.equal(ranWith[0].id, "009-wip");
});

test("autoRun (empty): nothing to do", async () => {
  const out = await autoRun({ ideas: [{ id: "x", status: "produced" }] }, {
    scaffold: fakeScaffold(),
    runVideo: async () => { throw new Error("must not run"); },
  });
  assert.deepEqual(out, { empty: true });
});

test("autoRun (busy but no folder): surfaces the manual case without running", async () => {
  const wip = { ideas: [{ id: "orphan", status: "in-progress", produced_video_id: null }] };
  const out = await autoRun(wip, { scaffold: fakeScaffold(), runVideo: async () => { throw new Error("must not run"); } });
  assert.deepEqual(out, { busy: true, id: null, ideaId: "orphan" });
});

test("autoRun (idle): a completed run reports done", async () => {
  const out = await autoRun(bank(), {
    scaffold: fakeScaffold(),
    persistIdeas: async () => {},
    runVideo: async () => dagResult(null),
  });
  assert.equal(out.action.kind, "done");
});

// ── [verifier] regression tests ───────────────────────────────────────────────

test("[verifier] classifyPause completeness: every known pausing node classifies to agentTask or ownerGate (never blocked)", () => {
  // Enumerate all nodes in the video DAG that can produce a __pause in normal (non-error) flow.
  // None of them should fall through to { kind: 'blocked' } — that would silently suppress a notification.
  const ownerGateNodes = ["review_script", "review_cut", "upload", "gate_owner"];
  const agentDeferralNodes = [...AGENT_DEFERRAL_NODES]; // script, plan_long, render_long, render_short, qa

  for (const node of ownerGateNodes) {
    const a = classifyPause({ ok: false, blocked: { id: node, kind: "gate", reason: "test" } });
    assert.equal(a.kind, "ownerGate", `${node} (gate pause) must classify as ownerGate, got: ${a.kind}`);
  }
  for (const node of agentDeferralNodes) {
    const a = classifyPause({ ok: false, blocked: { id: node, kind: "gate", reason: "deferred" } });
    assert.equal(a.kind, "agentTask", `${node} (deferral) must classify as agentTask, got: ${a.kind}`);
  }
  // Error pauses on ANY node must always be ownerGate
  for (const node of [...ownerGateNodes, ...agentDeferralNodes, "voice_long", "align_long", "metadata"]) {
    const a = classifyPause({ ok: false, blocked: { id: node, kind: "error", error: "boom" } });
    assert.equal(a.kind, "ownerGate", `${node} error must always be ownerGate, got: ${a.kind}`);
    assert.equal(a.error, true, `${node} error must set error:true`);
  }
});

test("[verifier] classifyPause: null/undefined result and result.ok=false with no blocked are both 'done'", () => {
  assert.deepEqual(classifyPause(null), { kind: "done" });
  assert.deepEqual(classifyPause(undefined), { kind: "done" });
  assert.deepEqual(classifyPause({ ok: false }), { kind: "done" });
});

test("[verifier] autoRun (idle): persist-before-run ordering is preserved even if runVideo throws", async () => {
  // If runVideo throws (unhandled crash), the in-progress marker should ALREADY be persisted.
  // autoRun currently awaits persistIdeas then awaits runVideo, so the persist always completes first.
  const order = [];
  await assert.rejects(
    () => autoRun(bank(), {
      scaffold: fakeScaffold(),
      persistIdeas: async () => { order.push("persist"); },
      runVideo: async () => { order.push("run"); throw new Error("crash"); },
    }),
    /crash/,
  );
  assert.deepEqual(order, ["persist", "run"], "persist must complete before runVideo is awaited");
});

test("[verifier] autoRun (busy with folder): resumes correct video, does not re-pick next backlog idea", async () => {
  // The busy bank has wip (in-progress, folder=009-wip) and next (backlog score:99).
  // auto-run must resume wip, NOT pick next.
  const ranWith = [];
  const out = await autoRun(busyBank(), {
    scaffold: fakeScaffold(),
    runVideo: async (args) => { ranWith.push(args.id); return dagResult(null); },
  });
  assert.equal(out.resumed, true);
  assert.equal(out.id, "009-wip");
  assert.equal(ranWith[0], "009-wip", "must run the in-progress id, not the top backlog");
  assert.equal(ranWith.length, 1, "must only run once");
});
