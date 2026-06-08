// Review panel — runs reviewers independently, computes the authoritative score
// (weighted, clamped by hard gates) and the gate band (locked decisions #2, #3, #4).
//
// Score authority lives HERE, not in the model: the panel recomputes each reviewer's
// score from category_scores * weights, then clamps below 9 if any hard gate failed.
// That keeps "≥9 / ≥9.2" deterministic and model-independent.
import { validate } from "../lib/validate-lib.mjs";

const HARD_GATE_CAP = 8.5; // any hard-gate fail caps the score here (cannot auto-pass)
// All four must be explicitly present AND true. A reviewer that omits a gate key
// (or reports nothing) is treated as failing — never silently gates-OK.
const REQUIRED_GATES = ["accuracy", "original_angle", "synthetic_data", "on_screen_source"];

/** Authoritative per-reviewer score from category_scores + weights, clamped by hard gates. */
export function panelScore(result, weights) {
  const c = result.category_scores || {};
  let sum = 0;
  let tw = 0;
  for (const k of Object.keys(weights)) {
    sum += (typeof c[k] === "number" ? c[k] : 0) * weights[k];
    tw += weights[k];
  }
  let score = tw ? sum / tw : 0;
  const gates = result.hard_gates || {};
  const gatesOk = REQUIRED_GATES.every((k) => gates[k] === true);
  if (!gatesOk) score = Math.min(score, HARD_GATE_CAP);
  return { score: Number(score.toFixed(2)), gatesOk };
}

/**
 * Compute the panel verdict for one review pass.
 * @param results reviewer results (review.schema reviewers[] items)
 * @param panelCfg config.review.panel ({ score_threshold, auto_pass_threshold, weights })
 */
export function verdict(results, panelCfg) {
  const { weights, score_threshold, auto_pass_threshold } = panelCfg;
  const scored = results.map((r) => {
    const ps = panelScore(r, weights);
    return { ...r, score: ps.score, _gatesOk: ps.gatesOk };
  });
  const hard_gate_ok = scored.every((r) => r._gatesOk);
  const scores = scored.map((r) => r.score);
  const min_score = Math.min(...scores);
  const allAtLeast = (t) => scores.every((s) => s >= t);
  const both_pass = hard_gate_ok && allAtLeast(score_threshold);
  const autoOk = hard_gate_ok && allAtLeast(auto_pass_threshold);

  let band;
  if (!hard_gate_ok) band = "fail";
  else if (autoOk) band = "auto";
  else if (both_pass) band = "soft";
  else band = "pause";

  const proceed = band === "auto" || band === "soft";
  return {
    scored,
    verdict: {
      min_score: Number(min_score.toFixed(2)),
      both_pass,
      hard_gate_ok,
      band,
      proceed,
    },
  };
}

/** Assemble a review.schema-valid document from one pass and validate it. */
export function assembleReview({ stage, target, iteration, results, panelCfg, merged }) {
  const { scored, verdict: v } = verdict(results, panelCfg);
  const doc = {
    stage,
    target,
    iteration,
    created: new Date().toISOString(),
    reviewers: scored.map(({ _gatesOk, ...r }) => r),
    verdict: v,
  };
  if (merged) doc.merged = merged;
  const { valid, errors } = validate(doc, "review");
  if (!valid) throw new Error(`assembled review invalid: ${JSON.stringify(errors)}`);
  return doc;
}

/** Run every reviewer once (in parallel) and assemble the review doc. Reviewers are injected. */
export async function runPanelOnce({ stage, target, iteration = 0, artifact, rubric, context, reviewers, panelCfg }) {
  const settled = await Promise.all(
    reviewers.map((rv) => rv.review({ stage, artifact, rubric, context }))
  );
  // Defer if any reviewer (e.g. claude-code mode) could not run inline.
  const deferred = settled.filter((r) => r && r.deferred);
  if (deferred.length) return { deferred };
  return assembleReview({ stage, target, iteration, results: settled, panelCfg });
}
