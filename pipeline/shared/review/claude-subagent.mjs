// Claude sub-agent reviewer (Sonnet 4.6) — dispatched through the Runner port.
// In "claude-code" mode the runner DEFERS (the top-level agent spawns the sub-agent);
// in "headless" mode it shells `claude -p`. Prompt + parsing are finalized in Wave 2 (R3).
import { Reviewer } from "./reviewer.mjs";

export function buildReviewPrompt({ stage, artifact, rubric }) {
  return [
    `You are an INDEPENDENT reviewer (you did not write this). Stage: ${stage}.`,
    `Score against the rubric and return ONLY JSON matching review.schema reviewers[] item`,
    `(score, hard_gates, category_scores, fixes, summary).`,
    rubric ? `RUBRIC:\n${typeof rubric === "string" ? rubric : JSON.stringify(rubric)}` : "",
    `ARTIFACT:\n${typeof artifact === "string" ? artifact : JSON.stringify(artifact)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export class ClaudeSubagentReviewer extends Reviewer {
  constructor(spec = {}, deps = {}) {
    super(spec);
    this.model = spec.model || "claude-sonnet-4-6";
    this.runner = deps.runner;
  }

  async review({ stage, artifact, rubric, context } = {}) {
    if (!this.runner) throw new Error("ClaudeSubagentReviewer needs deps.runner");
    const task = {
      role: "review",
      stage,
      model: this.model,
      prompt: buildReviewPrompt({ stage, artifact, rubric }),
      context,
    };
    const res = await this.runner.runAgent(task);
    if (res && res.deferred) return { deferred: true, task };
    // TODO(R3): robustly parse res.data; for now expect the sub-agent to return the shaped result.
    const data = res?.data ?? res;
    return { reviewer: this.name, model: this.model, ...data };
  }
}
