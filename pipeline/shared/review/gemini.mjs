// R2 — Gemini reviewer (free tier; 1M context). Calls the Generative Language API with the
// shared rubric and parses the JSON reply. `fetch`/`sleep`/`getKey` are injectable so tests
// need no network or key. Without a key it DEFERS (the orchestrator pauses → owner adds it).
import { Reviewer } from "./reviewer.mjs";
import { buildReviewerPrompt, normalizeReviewResult, extractJson } from "./rubric.mjs";

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export class GeminiReviewer extends Reviewer {
  constructor(spec = {}, deps = {}) {
    super(spec);
    this.model = spec.model || "gemini-3.5-flash";
    this.keyEnv = spec.key_env || "GEMINI_API_KEY";
    this.rpm = spec.rpm || 10;
    this.fetchFn = deps.fetch || ((...a) => globalThis.fetch(...a));
    this.sleepFn = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.getKey = deps.getKey || (() => process.env[this.keyEnv]);
    this._lastCall = 0;
  }

  get configured() {
    return Boolean(this.getKey());
  }

  async _throttle() {
    const minInterval = 60000 / this.rpm;
    const wait = this._lastCall + minInterval - Date.now();
    if (wait > 0) await this.sleepFn(wait);
    this._lastCall = Date.now();
  }

  async review({ stage, artifact, context } = {}) {
    const key = this.getKey();
    if (!key) return { deferred: true, reason: `${this.keyEnv} not set` };
    await this._throttle();

    const prompt = buildReviewerPrompt({ stage, artifact, context });
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await this.fetchFn(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
    if (!res.ok) {
      const err = new Error(`gemini ${res.status}: ${await safeText(res)}`);
      err.status = res.status; // lets error-policy retry 429/5xx
      throw err;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("gemini: empty response");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = JSON.parse(extractJson(text));
    }
    return normalizeReviewResult(parsed, { reviewer: this.name, model: this.model });
  }
}
