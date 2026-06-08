// Generic resumable DAG runner — the orchestration core (the user's "split into small
// tasks, parallel or sequential by dependency" requirement). Nodes declare deps; the runner
// executes them in topological WAVES (siblings in a wave run in parallel), is idempotent/
// resumable via a manifest, applies the error policy, and pauses at human gates.
//
// Node:    { id, deps?: string[], run: async (ctx, results) => any, gate?: boolean }
//          A node may return { __pause: true, reason } to pause the run (e.g. a human gate).
// Manifest:{ nodes: { [id]: { status: 'done'|'paused'|'awaiting', result?, error?, reason? } } }
import { guardStep } from "./error-policy.mjs";

/** Group nodes into dependency levels (Kahn). Throws on unknown dep or cycle. */
export function topoWaves(nodes) {
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    for (const d of n.deps || []) {
      if (!ids.has(d)) throw new Error(`node "${n.id}" depends on unknown node "${d}"`);
    }
  }
  const waves = [];
  const done = new Set();
  while (done.size < nodes.length) {
    const wave = nodes.filter((n) => !done.has(n.id) && (n.deps || []).every((d) => done.has(d))).map((n) => n.id);
    if (wave.length === 0) throw new Error("cycle detected in DAG");
    waves.push(wave);
    wave.forEach((id) => done.add(id));
  }
  return waves;
}

/**
 * Run a DAG. Stops at the first blocking node (a failed/paused step or a human gate) and returns.
 * Re-running with the same manifest resumes: nodes already 'done' are skipped.
 */
export async function runDag(nodes, { ctx = {}, manifest = { nodes: {} }, retry = {}, onPause, saveManifest } = {}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const waves = topoWaves(nodes);
  manifest.nodes = manifest.nodes || {};

  const results = {};
  for (const [id, rec] of Object.entries(manifest.nodes)) {
    if (rec.status === "done") results[id] = rec.result;
  }

  const persist = async () => {
    if (saveManifest) await saveManifest(manifest);
  };

  for (const wave of waves) {
    const pending = wave.filter((id) => manifest.nodes[id]?.status !== "done");
    if (pending.length === 0) continue;

    const settled = await Promise.all(
      pending.map(async (id) => {
        const node = byId.get(id);
        const r = await guardStep(id, () => node.run(ctx, results), { retry });
        return { id, node, r };
      })
    );

    let blocked = null;
    for (const { id, node, r } of settled) {
      if (r.ok && r.result && r.result.__pause) {
        manifest.nodes[id] = { status: "awaiting", gate: !!node.gate, reason: r.result.reason };
        if (onPause) await onPause({ node: id, kind: "gate", reason: r.result.reason, manifest });
        blocked = blocked || { id, kind: "gate", reason: r.result.reason };
      } else if (r.ok) {
        results[id] = r.result;
        manifest.nodes[id] = { status: "done", gate: !!node.gate, result: r.result };
      } else {
        manifest.nodes[id] = { status: "paused", error: r.error };
        if (onPause) await onPause({ node: id, kind: "error", error: r.error, manifest });
        blocked = blocked || { id, kind: "error", error: r.error };
      }
    }

    await persist();
    if (blocked) return { ok: false, blocked, manifest, results };
  }

  return { ok: true, manifest, results };
}
