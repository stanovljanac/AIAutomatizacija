// R1 — the reviewer rubric: the prompt every reviewer gets, and the normalizer that turns a
// model's JSON reply into a review.schema reviewers[] item. Shared by every adapter so all
// reviewers score against the SAME rubric (locked decision #4).
//
// STAGE-PARAMETRIC (2026-06-24): the SAME review mechanism serves two passes —
//   - "script" (and scene-plan / cut): is the work MADE WELL? (unchanged; byte-identical)
//   - "idea":   is the topic WORTH MAKING? (the pre-script content-value gate)
// One rubric registry, one scorecard, one panel — no scattered second rulebook. Each stage names
// its own scored categories + hard gates + prose below; everything else (normalizer, panel, loop)
// reads them by stage. The script stage's exported constants stay the canonical defaults so older
// callers that pass no stage keep their exact behavior.

/** Per-stage rubric definition: scored categories, hard gates, and the prose lines for each. */
export const STAGE_RUBRICS = {
  script: {
    blurb: "script",
    categories: ["retention_structure", "originality_depth", "hard_rule_craft", "style_tone", "readaloud_clarity"],
    gates: ["accuracy", "original_angle", "synthetic_data", "on_screen_source"],
    gateLines: [
      `- accuracy: every checkable claim is sourced/verified; no invented facts.`,
      `- original_angle: a genuine original human take is present and surfaces in/after the hook.`,
      `- synthetic_data: any demo data is synthetic, never real client data.`,
      `- on_screen_source: every stated statistic shows its source on screen.`,
    ],
    categoryLines: [
      `- retention_structure: answer-first, hook <=10s, payoff, pacing.`,
      `- originality_depth: real practical value beyond the bare angle; "scale it to your own process".`,
      `- hard_rule_craft: captions <=2 lines/safe-zone, Short 45-120s, visual change every 3-7s, b-roll fits.`,
      `- style_tone: sharp practical engineer + warm teacher; no hype, no filler.`,
      `- readaloud_clarity: clean timing units, consistent terms, natural for an AI voice.`,
    ],
  },
  // The PUBLISH pass reviews the metadata package (title options, description, tags, chapters,
  // Short caption) BEFORE the owner sees it — operating principle 3 applies to publish copy too.
  // One focused SEO/claims rubric on the existing panel; no new reviewer (D-053: single Sonnet).
  publish: {
    blurb: "publish metadata package (title options, description, tags, chapters, Short caption)",
    categories: ["title_ctr", "seo_keywords", "answer_first_description", "metadata_consistency"],
    gates: ["accuracy", "no_overpromise", "disclosure_set"],
    gateLines: [
      `- accuracy: every claim/number in the title, description and chapters matches the video's sourced facts; nothing invented.`,
      `- no_overpromise: the title promises nothing the video does not deliver (honest packaging; no clickbait lie).`,
      `- disclosure_set: altered_content is true — AI voice + visuals must be disclosed at upload, every time.`,
    ],
    categoryLines: [
      `- title_ctr: would the best title option stop the scroll for our audience while staying honest? Specific + curiosity beats generic.`,
      `- seo_keywords: keyword-first description, search-term coverage in tags, no keyword stuffing.`,
      `- answer_first_description: the description answers the core question in its first sentence(s), <=3 sentences.`,
      `- metadata_consistency: chapters chronological and matching the content; Short title/caption present and consistent; tags coherent with the topic.`,
    ],
  },
  // The IDEA pass scores the TOPIC before a script exists — "is this worth a video?" It is tuned so
  // broad/zeitgeist reach plays still score well (variety is a feature), but a topic with no real
  // value or no single reusable takeaway cannot pass.
  idea: {
    blurb: "video IDEA (topic, pre-script)",
    categories: ["audience_value", "reusable_takeaway", "packaging", "audience_fit"],
    gates: ["value_type_present", "takeaway_present", "on_brand"],
    gateLines: [
      `- value_type_present: the idea clearly delivers >=1 value type — saves time, saves money, avoids a costly mistake, teaches a reusable system/mental model, reveals a surprising useful truth, or corrects a common misbelief.`,
      `- takeaway_present: there is ONE concrete thing a viewer could apply or believe differently tomorrow (a prompt, pattern, rule of thumb, corrected belief) — not just "this happened".`,
      `- on_brand: it fits the channel's promise (practical AI you can actually use or understand). News/zeitgeist counts IF it carries a usable lesson.`,
    ],
    categoryLines: [
      `- audience_value: how strong + concrete is the payoff (real magnitude of time/money saved, mistake avoided, or how genuinely surprising/useful the truth is)? Vague or tiny payoff scores low.`,
      `- reusable_takeaway: how clear and reusable is the single thing the viewer walks away with? A sharp, repeatable takeaway scores high; a one-off with nothing to reuse scores low.`,
      `- packaging: can we write a scroll-stopping title AND one concrete thumbnail concept with real CTR potential? An un-packageable topic scores low.`,
      `- audience_fit: real search/interest demand + reach potential for our audience (builders/freelancers + curious AI viewers). Broad or timely topics that pull new viewers score well.`,
    ],
  },
};

function stageDef(stage) {
  return STAGE_RUBRICS[stage] || STAGE_RUBRICS.script;
}

/** Scored categories for a stage (defaults to the script set). */
export function scoredCategories(stage) {
  return stageDef(stage).categories;
}
/** Hard gates for a stage (defaults to the script set). */
export function hardGates(stage) {
  return stageDef(stage).gates;
}

// Back-compat: the script set remains the canonical default export (older imports keep working).
export const SCORED_CATEGORIES = STAGE_RUBRICS.script.categories;
export const HARD_GATES = STAGE_RUBRICS.script.gates;

export function rubricText(stage) {
  const def = stageDef(stage);
  return [
    `You are an INDEPENDENT reviewer of a YouTube ${def.blurb} for "The Automation Desk" — a faceless`,
    `channel about small, boring AI automations (broadening into general AI how-tos, tool reviews, and AI news).`,
    `You did NOT write this. Score it strictly.`,
    ``,
    `HARD GATES (boolean each — any false means the work CANNOT pass):`,
    ...def.gateLines,
    ``,
    `SCORED 1-10 (be discerning; 9+ means genuinely excellent):`,
    ...def.categoryLines,
  ].join("\n");
}

export function responseContract(stage) {
  const def = stageDef(stage);
  const gatesObj = def.gates.map((g) => `"${g}":bool`).join(",");
  const catsObj = def.categories.map((c) => `"${c}":<0-10>`).join(",");
  return [
    `Return ONLY minified JSON, no prose, matching:`,
    `{"score":<0-10>,"hard_gates":{${gatesObj}},`,
    `"category_scores":{${catsObj}},`,
    `"fixes":[{"severity":"blocker|major|minor|nit","area":"...","note":"..."}],"summary":"..."}`,
  ].join("\n");
}

export function buildReviewerPrompt({ stage, artifact, context }) {
  return [
    rubricText(stage),
    context ? `CONTEXT:\n${typeof context === "string" ? context : JSON.stringify(context)}` : "",
    responseContract(stage),
    `ARTIFACT (${stage}):`,
    typeof artifact === "string" ? artifact : JSON.stringify(artifact, null, 2),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Coerce a model's parsed reply into a valid reviewers[] item. Missing gates default to FALSE.
 *  `stage` selects which categories/gates are expected (defaults to the script set for back-compat). */
export function normalizeReviewResult(parsed, { reviewer, model, stage } = {}) {
  const hg = (parsed && parsed.hard_gates) || {};
  const cs = (parsed && parsed.category_scores) || {};
  const gates = hardGates(stage);
  const cats = scoredCategories(stage);
  return {
    reviewer,
    model,
    score: typeof parsed?.score === "number" ? parsed.score : 0,
    hard_gates: Object.fromEntries(gates.map((k) => [k, hg[k] === true])),
    category_scores: Object.fromEntries(cats.map((k) => [k, typeof cs[k] === "number" ? cs[k] : 0])),
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
