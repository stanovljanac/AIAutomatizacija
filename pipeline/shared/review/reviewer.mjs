// Reviewer port — one independent reviewer (locked decision #1, #2).
// Each reviewer returns a result shaped like a review.schema `reviewers[]` item.
// Live adapters (claude-subagent, gemini, groq) are wired in Wave 2 (R2/R3); the
// interface + a MockReviewer live here so the panel math is testable now.

/** @typedef {{reviewer:string,model:string,score:number,hard_gates:object,category_scores:object,fixes:Array,summary?:string}} ReviewResult */

export class Reviewer {
  constructor(spec = {}) {
    this.name = spec.name || "reviewer";
    this.model = spec.model || "unknown";
    this.spec = spec;
  }
  /** @returns {Promise<ReviewResult|{deferred:true,task:object}>} */
  // eslint-disable-next-line no-unused-vars
  async review({ stage, artifact, rubric, context } = {}) {
    throw new Error(`${this.constructor.name}.review not implemented`);
  }
}

/** Tests: returns a canned result (or one computed by `responder`). */
export class MockReviewer extends Reviewer {
  constructor(spec = {}) {
    super(spec);
    this.responder =
      spec.responder ||
      (() => ({
        reviewer: this.name,
        model: this.model,
        score: 9,
        hard_gates: { accuracy: true, original_angle: true, synthetic_data: true, on_screen_source: true },
        category_scores: {
          retention_structure: 9,
          originality_depth: 9,
          hard_rule_craft: 9,
          style_tone: 9,
          readaloud_clarity: 9,
        },
        fixes: [],
      }));
  }
  async review(input) {
    const out = this.responder(input);
    return { reviewer: this.name, model: this.model, ...out };
  }
}

// Lazy registry so optional adapters (with their own deps) only load when used.
const LOADERS = {
  claude_subagent: () => import("./claude-subagent.mjs").then((m) => m.ClaudeSubagentReviewer),
  gemini: () => import("./gemini.mjs").then((m) => m.GeminiReviewer),
  groq: () => import("./groq.mjs").then((m) => m.GroqReviewer),
  mock: () => Promise.resolve(MockReviewer),
};

/** Build a reviewer from a config.review.panel.reviewers[] entry. `deps` carries the runner. */
export async function createReviewer(spec, deps = {}) {
  const key = spec.provider || "mock";
  const loader = LOADERS[key];
  if (!loader) throw new Error(`unknown reviewer provider: ${key} (have: ${Object.keys(LOADERS).join(", ")})`);
  const Cls = await loader();
  return new Cls(spec, deps);
}
