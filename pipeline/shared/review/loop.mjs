// R4 — the self-review loop (locked decisions #2, #3). Run the panel independently; if it
// doesn't pass, the AUTHOR (not a reviewer) merges the best fixes and re-submits; repeat until
// both reviewers pass or maxIterations is hit (then surface to the owner).
//
// `applyFixes(artifact, fixes, review)` is injected: in Claude-Code mode the top agent rewrites;
// in tests it's a fake. If any reviewer can't run inline, the loop surfaces a deferral.
import { runPanelOnce } from "./panel.mjs";

export async function reviewLoop({
  stage,
  target,
  artifact,
  reviewers,
  panelCfg,
  maxIterations = 3,
  applyFixes,
  onIteration,
}) {
  let current = artifact;
  let last = null;
  let reviews = 0;

  for (let i = 0; i < maxIterations; i++) {
    const out = await runPanelOnce({ stage, target, iteration: i, artifact: current, reviewers, panelCfg });
    if (out.deferred) return { deferred: out.deferred, iterations: reviews, artifact: current };
    reviews += 1;
    last = out;
    if (onIteration) await onIteration(out, i);

    if (out.verdict.proceed) {
      return { review: out, artifact: current, iterations: reviews, passed: true, band: out.verdict.band };
    }
    // No revision possible, or we've used our last iteration → stop and surface.
    if (!applyFixes || i === maxIterations - 1) break;

    const fixes = out.reviewers.flatMap((r) => r.fixes || []);
    current = await applyFixes(current, fixes, out);
  }

  return {
    review: last,
    artifact: current,
    iterations: reviews,
    passed: false,
    capped: true,
    band: last?.verdict?.band,
  };
}
