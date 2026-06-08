// R1 — the reviewer rubric: the prompt every reviewer gets, and the normalizer that turns a
// model's JSON reply into a review.schema reviewers[] item. Shared by every adapter so all
// reviewers score against the SAME rubric (locked decision #4).
export const SCORED_CATEGORIES = [
  "retention_structure",
  "originality_depth",
  "hard_rule_craft",
  "style_tone",
  "readaloud_clarity",
];
export const HARD_GATES = ["accuracy", "original_angle", "synthetic_data", "on_screen_source"];

export function rubricText(stage) {
  return [
    `You are an INDEPENDENT reviewer of a YouTube ${stage} for "The Automation Desk" — a faceless`,
    `channel about small, boring AI automations. You did NOT write this. Score it strictly.`,
    ``,
    `HARD GATES (boolean each — any false means the work CANNOT pass):`,
    `- accuracy: every checkable claim is sourced/verified; no invented facts.`,
    `- original_angle: a genuine original human take is present and surfaces in/after the hook.`,
    `- synthetic_data: any demo data is synthetic, never real client data.`,
    `- on_screen_source: every stated statistic shows its source on screen.`,
    ``,
    `SCORED 1-10 (be discerning; 9+ means genuinely excellent):`,
    `- retention_structure: answer-first, hook <=10s, payoff, pacing.`,
    `- originality_depth: real practical value beyond the bare angle; "scale it to your own process".`,
    `- hard_rule_craft: captions <=2 lines/safe-zone, Short 45-120s, visual change every 3-7s, b-roll fits.`,
    `- style_tone: sharp practical engineer + warm teacher; no hype, no filler.`,
    `- readaloud_clarity: clean timing units, consistent terms, natural for an AI voice.`,
  ].join("\n");
}

export function responseContract() {
  return [
    `Return ONLY minified JSON, no prose, matching:`,
    `{"score":<0-10>,"hard_gates":{"accuracy":bool,"original_angle":bool,"synthetic_data":bool,"on_screen_source":bool},`,
    `"category_scores":{"retention_structure":<0-10>,"originality_depth":<0-10>,"hard_rule_craft":<0-10>,"style_tone":<0-10>,"readaloud_clarity":<0-10>},`,
    `"fixes":[{"severity":"blocker|major|minor|nit","area":"...","note":"..."}],"summary":"..."}`,
  ].join("\n");
}

export function buildReviewerPrompt({ stage, artifact, context }) {
  return [
    rubricText(stage),
    context ? `CONTEXT:\n${typeof context === "string" ? context : JSON.stringify(context)}` : "",
    responseContract(),
    `ARTIFACT (${stage}):`,
    typeof artifact === "string" ? artifact : JSON.stringify(artifact, null, 2),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Coerce a model's parsed reply into a valid reviewers[] item. Missing gates default to FALSE. */
export function normalizeReviewResult(parsed, { reviewer, model }) {
  const hg = (parsed && parsed.hard_gates) || {};
  const cs = (parsed && parsed.category_scores) || {};
  return {
    reviewer,
    model,
    score: typeof parsed?.score === "number" ? parsed.score : 0,
    hard_gates: Object.fromEntries(HARD_GATES.map((k) => [k, hg[k] === true])),
    category_scores: Object.fromEntries(SCORED_CATEGORIES.map((k) => [k, typeof cs[k] === "number" ? cs[k] : 0])),
    fixes: Array.isArray(parsed?.fixes) ? parsed.fixes : [],
    summary: typeof parsed?.summary === "string" ? parsed.summary : "",
  };
}

/** Best-effort extraction of a JSON object from a model reply that wrapped it in prose/fences. */
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found in reply");
  return body.slice(start, end + 1);
}
