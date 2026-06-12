// T5.1 — autonomous picker: effective-score ranking, brief seeding, busy/empty/pick planning.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  effectiveScore,
  pickNextIdea,
  inProgressIdea,
  briefFromIdea,
  markIdeaInProgress,
  planNextVideo,
} from "./pick-next.mjs";
import { validate } from "../shared/lib/validate-lib.mjs";
import { suggestArchetype } from "./fetch-news.mjs";

const bank = () => ({
  updated: "2026-06-12",
  ideas: [
    { id: "low", title: "Low", task: "documents", archetype: "mini-demo", score: 70, status: "backlog", produced_video_id: null },
    { id: "high-adjusted", title: "High via analytics", task: "outbound-comms", archetype: "ideas", score: 60, adjusted_score: 95, status: "backlog", produced_video_id: null },
    { id: "mid", title: "Mid", task: "scheduling", archetype: "comparison", score: 80, status: "backlog", produced_video_id: null },
    { id: "done", title: "Done", task: "documents", archetype: "ideas", score: 99, status: "produced", produced_video_id: "002-x" },
  ],
});

const fakeScaffold = (calls = []) => (slug, opts) => {
  calls.push({ slug, opts });
  return { id: `010-${slug}`, dest: `content/010-${slug}` };
};

test("effectiveScore prefers adjusted_score, else score, else 0", () => {
  assert.equal(effectiveScore({ score: 70 }), 70);
  assert.equal(effectiveScore({ score: 70, adjusted_score: 88 }), 88);
  assert.equal(effectiveScore({}), 0);
});

test("pickNextIdea ranks backlog by effective score (adjusted wins) and excludes non-backlog", () => {
  const pick = pickNextIdea(bank());
  assert.equal(pick.id, "high-adjusted", "adjusted_score 95 beats raw scores 80/70 and the produced 99");
});

test("pickNextIdea breaks ties by id ascending (deterministic)", () => {
  const ideas = { ideas: [
    { id: "b", score: 80, status: "backlog" },
    { id: "a", score: 80, status: "backlog" },
  ] };
  assert.equal(pickNextIdea(ideas).id, "a");
});

test("pickNextIdea returns null when nothing is in backlog", () => {
  assert.equal(pickNextIdea({ ideas: [{ id: "x", score: 9, status: "produced" }] }), null);
  assert.equal(pickNextIdea({ ideas: [] }), null);
});

test("inProgressIdea finds an in-progress idea or null", () => {
  assert.equal(inProgressIdea(bank()), null);
  const wip = { ideas: [{ id: "w", status: "in-progress", produced_video_id: "009-w" }] };
  assert.equal(inProgressIdea(wip).id, "w");
});

test("briefFromIdea maps idea fields to a schema-valid brief seed", () => {
  const idea = { id: "invoice-emails", title: "Email Invoices", task: "documents", archetype: "mini-demo", angle_hint: "freelancer gets paid", search_term: "email invoices", tool: "Sheets", sector: "accounting", score: 86 };
  const seed = briefFromIdea(idea);
  assert.equal(seed.archetype, "mini-demo");
  assert.equal(seed.angle, "freelancer gets paid");
  assert.equal(seed.task, "documents");
  assert.equal(seed.search_term, "email invoices");
  // a full brief built from the seed + the scaffold defaults must validate.
  const brief = { id: "010-invoice-emails", target_seconds: 360, format: "long+short", audience: "x", ...seed };
  const { valid, errors } = validate(brief, "brief");
  assert.ok(valid, JSON.stringify(errors));
});

test("markIdeaInProgress sets status + produced_video_id, purely", () => {
  const src = bank();
  const out = markIdeaInProgress(src, "mid", "010-mid");
  const moved = out.ideas.find((i) => i.id === "mid");
  assert.equal(moved.status, "in-progress");
  assert.equal(moved.produced_video_id, "010-mid");
  assert.equal(src.ideas.find((i) => i.id === "mid").status, "backlog", "input not mutated");
});

test("planNextVideo scaffolds the top idea and marks it in-progress", () => {
  const calls = [];
  const res = planNextVideo(bank(), { scaffold: fakeScaffold(calls) });
  assert.equal(res.ideaId, "high-adjusted");
  assert.equal(res.id, "010-high-adjusted");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].slug, "high-adjusted");
  assert.equal(calls[0].opts.brief.archetype, "ideas");
  const moved = res.ideas.ideas.find((i) => i.id === "high-adjusted");
  assert.equal(moved.status, "in-progress");
  assert.equal(moved.produced_video_id, "010-high-adjusted");
});

test("planNextVideo is a no-op scaffold when a video is already in-progress (safe to re-fire)", () => {
  const calls = [];
  const wip = { ideas: [
    { id: "w", status: "in-progress", produced_video_id: "009-w" },
    { id: "next", score: 90, status: "backlog" },
  ] };
  const res = planNextVideo(wip, { scaffold: fakeScaffold(calls) });
  assert.deepEqual(res, { busy: true, id: "009-w", ideaId: "w" });
  assert.equal(calls.length, 0, "must not scaffold while busy");
});

test("planNextVideo reports empty when there is no backlog idea", () => {
  const calls = [];
  const res = planNextVideo({ ideas: [{ id: "x", status: "produced" }] }, { scaffold: fakeScaffold(calls) });
  assert.deepEqual(res, { empty: true });
  assert.equal(calls.length, 0);
});

// ── [verifier] regression tests ───────────────────────────────────────────────

test("[verifier] effectiveScore: adjusted_score:0 is a valid score (0 < raw score)", () => {
  // adjusted_score:0 is the number 0, not absent — it must be used instead of the raw score.
  assert.equal(effectiveScore({ score: 80, adjusted_score: 0 }), 0, "0 is a valid adjusted score");
  // And it must rank below an unadjusted idea with score 60
  const bank = { ideas: [
    { id: "a", score: 80, adjusted_score: 0, status: "backlog" },
    { id: "b", score: 60, status: "backlog" },
  ]};
  assert.equal(pickNextIdea(bank).id, "b", "adjusted_score:0 (a) must lose to raw score:60 (b)");
});

test("[verifier] briefFromIdea: missing archetype falls back to 'ideas' (never produces undefined)", () => {
  // An idea without an archetype field must not propagate undefined into brief.json
  // (which would fail the brief.schema required enum check).
  const seed = briefFromIdea({ id: "x", title: "Test", task: "documents" });
  assert.equal(seed.archetype, "ideas", "missing archetype must default to 'ideas'");
  // The seeded brief must also be schema-valid when combined with scaffoldVideo's defaults.
  const brief = { id: "010-x", target_seconds: 360, format: "long+short", audience: "x", ...seed };
  const { valid, errors } = validate(brief, "brief");
  assert.ok(valid, `brief with missing-archetype idea must be schema-valid: ${JSON.stringify(errors)}`);
});

test("[verifier] news suggestArchetype outputs are a strict subset of the brief archetype enum", () => {
  // fetch-news.mjs's ARCHETYPE_RULES map headlines to archetypes; every possible output must be
  // in brief.schema.json's enum so a news-promoted idea never produces an invalid brief.
  const briefEnum = new Set(["ideas", "mini-demo", "diagram", "comparison"]);
  // These are all possible return values of suggestArchetype (the four rule outputs + the default).
  const testCases = [
    // default (no rule matches)
    { title: "Generic AI topic", summary: "" },
    // comparison rule
    { title: "Claude vs GPT-4", summary: "" },
    // mini-demo rule
    { title: "How to automate invoices", summary: "" },
    { title: "Tutorial: Build a reminder bot", summary: "" },
    // diagram rule
    { title: "AI pipeline architecture explained", summary: "" },
    { title: "Under the hood: how LLM workflows work", summary: "" },
  ];
  for (const item of testCases) {
    const arch = suggestArchetype(item);
    assert.ok(briefEnum.has(arch), `suggestArchetype returned "${arch}" for "${item.title}" — not in brief enum`);
  }
});

test("[verifier] briefFromIdea: invalid archetype string is passed through (not silently corrected)", () => {
  // A manually-typed invalid archetype (e.g. 'news') should flow through so validation downstream
  // catches it rather than silently masking it. Only 'absent' (falsy) gets the fallback.
  const seed = briefFromIdea({ id: "x", archetype: "invalid-value" });
  assert.equal(seed.archetype, "invalid-value", "non-falsy invalid archetype passes through for downstream detection");
});
