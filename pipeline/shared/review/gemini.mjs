// Gemini reviewer (free tier; 1M context, ~10 RPM throttle). STUB — live HTTP call,
// rate-limit throttle, and JSON parsing land in Wave 2 (R2). The class exists now so the
// factory + config wiring are testable; review() is honest about being unimplemented.
import { Reviewer } from "./reviewer.mjs";

export class GeminiReviewer extends Reviewer {
  constructor(spec = {}, deps = {}) {
    super(spec);
    this.model = spec.model || "gemini-3-flash";
    this.keyEnv = spec.key_env || "GEMINI_API_KEY";
    this.rpm = spec.rpm || 10;
    this.deps = deps;
  }

  get configured() {
    return Boolean(process.env[this.keyEnv]);
  }

  // eslint-disable-next-line no-unused-vars
  async review(input) {
    throw new Error("GeminiReviewer.review is implemented in Wave 2 (R2) — needs GEMINI_API_KEY + HTTP client.");
  }
}
