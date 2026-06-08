// R3 — Claude sub-agent reviewer (Sonnet 4.6), dispatched through the Runner port and scoring
// against the SHARED rubric. In "claude-code" mode the runner DEFERS (the top-level agent spawns
// the Sonnet sub-agent and returns the JSON); in "headless" mode it shells `claude -p`.
import { Reviewer } from "./reviewer.mjs";
import { buildReviewerPrompt, normalizeReviewResult, extractJson } from "./rubric.mjs";

export class ClaudeSubagentReviewer extends Reviewer {
  constructor(spec = {}, deps = {}) {
    super(spec);
    this.model = spec.model || "claude-sonnet-4-6";
    this.runner = deps.runner;
  }

  async review({ stage, artifact, context } = {}) {
    if (!this.runner) throw new Error("ClaudeSubagentReviewer needs deps.runner");
    const task = {
      role: "review",
      stage,
      model: this.model,
      prompt: buildReviewerPrompt({ stage, artifact, context }),
    };
    const res = await this.runner.runAgent(task);
    if (res && res.deferred) return { deferred: true, task };

    // Accept a parsed object, {data}, or raw text and coerce to a valid reviewers[] item.
    let parsed = res?.data ?? res;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = JSON.parse(extractJson(parsed));
      }
    }
    return normalizeReviewResult(parsed, { reviewer: this.name, model: this.model });
  }
}
