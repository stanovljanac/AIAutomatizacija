// Groq reviewer (free tier, Meta Llama) — the easy "3rd reviewer" upgrade path.
// Disabled by default in config; STUB until we choose to enable it (one config line).
import { Reviewer } from "./reviewer.mjs";

export class GroqReviewer extends Reviewer {
  constructor(spec = {}, deps = {}) {
    super(spec);
    this.model = spec.model || "meta-llama/llama-4-scout-17b-16e-instruct";
    this.keyEnv = spec.key_env || "GROQ_API_KEY";
    this.rpm = spec.rpm || 30;
    this.deps = deps;
  }

  get configured() {
    return Boolean(process.env[this.keyEnv]);
  }

  // eslint-disable-next-line no-unused-vars
  async review(input) {
    throw new Error("GroqReviewer.review is a future upgrade (disabled by default) — enable in config + implement HTTP.");
  }
}
