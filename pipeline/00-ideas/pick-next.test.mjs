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
  recentFromBank,
  extendsRun,
  subjectCollision,
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

// ── content-value gate: reject filter + variety soft-cap (decisions #6/#7) ───────────────────────

test("pickNextIdea skips idea-pass REJECTS (value_band='reject') even if highest-scored", () => {
  const ideas = { ideas: [
    { id: "rejected-top", score: 99, status: "backlog", value_band: "reject" },
    { id: "ok", score: 80, status: "backlog" },
  ] };
  assert.equal(pickNextIdea(ideas).id, "ok", "a rejected idea is never picked");
});

test("recentFromBank returns the last N produced ideas, most-recent-first by video number", () => {
  const ideas = { ideas: [
    { id: "a", status: "produced", produced_video_id: "006-a", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
    { id: "b", status: "produced", produced_video_id: "008-b", lane: "desk-notes", archetype: "ideas", tool: "Claude" },
    { id: "c", status: "produced", produced_video_id: "007-c", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
    { id: "d", status: "backlog" },
  ] };
  const recent = recentFromBank(ideas, 2);
  assert.deepEqual(recent.map((r) => r.lane), ["desk-notes", "desk-fixes"], "008 then 007");
});

test("extendsRun is true only when the last runCap produced all share a dimension with the candidate", () => {
  const recent = [{ lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" }, { lane: "desk-fixes", archetype: "ideas", tool: "Excel" }];
  assert.equal(extendsRun({ lane: "desk-fixes" }, recent, 2), true, "third desk-fixes in a row");
  assert.equal(extendsRun({ lane: "desk-notes" }, recent, 2), false, "different lane is fine");
  assert.equal(extendsRun({ lane: "desk-fixes" }, recent.slice(0, 1), 2), false, "only one prior — no run yet");
});

test("pickNextIdea variety soft-cap: nudges off a 2-in-a-row lane to the next-best fresh lane", () => {
  const ideas = { ideas: [
    { id: "more-fixes", score: 95, status: "backlog", lane: "desk-fixes" },
    { id: "a-note", score: 90, status: "backlog", lane: "desk-notes" },
    // last two produced were both desk-fixes
    { id: "p1", status: "produced", produced_video_id: "007-p1", lane: "desk-fixes" },
    { id: "p2", status: "produced", produced_video_id: "008-p2", lane: "desk-fixes" },
  ] };
  const pick = pickNextIdea(ideas, { recent: recentFromBank(ideas) });
  assert.equal(pick.id, "a-note", "top desk-fixes is skipped to avoid a 3rd in a row; next-best fresh lane wins");
});

test("pickNextIdea variety cap is SOFT: if every candidate repeats the lane, fall back to top score", () => {
  const ideas = { ideas: [
    { id: "best-fixes", score: 95, status: "backlog", lane: "desk-fixes" },
    { id: "other-fixes", score: 90, status: "backlog", lane: "desk-fixes" },
    { id: "p1", status: "produced", produced_video_id: "007-p1", lane: "desk-fixes" },
    { id: "p2", status: "produced", produced_video_id: "008-p2", lane: "desk-fixes" },
  ] };
  assert.equal(pickNextIdea(ideas, { recent: recentFromBank(ideas) }).id, "best-fixes", "never hard-block — top score wins when all repeat");
});

test("briefFromIdea carries the idea-pass content-value fields and stays schema-valid", () => {
  const idea = { id: "x", title: "T", task: "documents", archetype: "mini-demo", lane: "desk-fixes",
    value_type: ["saves-time", "avoids-mistake"], takeaway: "Keep a fallback model", value_score: 9.1, value_band: "qualify" };
  const seed = briefFromIdea(idea);
  assert.equal(seed.lane, "desk-fixes");
  assert.deepEqual(seed.value_type, ["saves-time", "avoids-mistake"]);
  assert.equal(seed.takeaway, "Keep a fallback model");
  assert.equal(seed.value_band, "qualify");
  const brief = { id: "010-x", target_seconds: 360, format: "long+short", audience: "x", ...seed };
  const { valid, errors } = validate(brief, "brief");
  assert.ok(valid, JSON.stringify(errors));
});

// ── subject-collision warning (D-059 idea-guard) ─────────────────────────────────

const registry = () => ({
  subjects: {
    "attention/inbox": ["011-read-my-inbox", "016-n8n-inbox-triage"],
    "change-detection/policy": ["017-fine-print-watch"],
  },
});

test("subjectCollision flags an idea whose subject is already claimed by prior videos", () => {
  const hit = subjectCollision({ id: "inbox-week", subject: "attention/inbox" }, registry());
  assert.deepEqual(hit, { subject: "attention/inbox", videos: ["011-read-my-inbox", "016-n8n-inbox-triage"] });
});

test("subjectCollision returns null for a fresh, uncollided subject", () => {
  assert.equal(subjectCollision({ id: "x", subject: "failure-detection/stopped-jobs" }, registry()), null);
});

test("subjectCollision returns null when the idea has no subject (opt-in field)", () => {
  assert.equal(subjectCollision({ id: "x" }, registry()), null);
  assert.equal(subjectCollision({ id: "x", subject: "" }, registry()), null);
});

test("subjectCollision is null-safe on a missing/empty registry (best-effort guard)", () => {
  assert.equal(subjectCollision({ id: "x", subject: "attention/inbox" }, {}), null);
  assert.equal(subjectCollision({ id: "x", subject: "attention/inbox" }, { subjects: {} }), null);
  assert.equal(subjectCollision({ id: "x", subject: "attention/inbox" }, { subjects: { "attention/inbox": [] } }), null);
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

test("[verifier] pickNextIdea: value_band='reject' skips even when it's the only backlog idea → null", () => {
  const ideas = { ideas: [
    { id: "only", score: 99, status: "backlog", value_band: "reject" },
  ] };
  assert.equal(pickNextIdea(ideas), null, "all ideas rejected → null, not an error");
});

test("[verifier] pickNextIdea: value_band='owner' is eligible (only 'reject' is excluded)", () => {
  const ideas = { ideas: [
    { id: "rejected", score: 99, status: "backlog", value_band: "reject" },
    { id: "owner-band", score: 80, status: "backlog", value_band: "owner" },
  ] };
  assert.equal(pickNextIdea(ideas)?.id, "owner-band", "value_band='owner' must still be eligible");
});

test("[verifier] extendsRun: runCap=3 requires at least 3 recent items to trigger (not 2)", () => {
  // Only 2 recent items: never triggers with runCap=3.
  const recent2 = [{ lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" }, { lane: "desk-fixes", archetype: "ideas", tool: "Excel" }];
  assert.equal(extendsRun({ lane: "desk-fixes" }, recent2, 3), false, "runCap=3 needs 3 in recent, not 2");
});

test("[verifier] extendsRun: null/undefined dimension on candidate does NOT trigger the cap", () => {
  const recent = [{ lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" }, { lane: "desk-fixes", archetype: "ideas", tool: "Excel" }];
  // candidate with lane=null: should NOT be blocked (undefined dimension → no run)
  assert.equal(extendsRun({ lane: null, archetype: "diagram" }, recent, 2), false, "null lane on candidate must not trigger the cap");
  assert.equal(extendsRun({ archetype: "diagram" }, recent, 2), false, "absent lane on candidate must not trigger the cap");
});

test("[verifier] recentFromBank excludes ideas with null/unparseable produced_video_id", () => {
  const ideas = { ideas: [
    { id: "a", status: "produced", produced_video_id: null, lane: "desk-fixes" },
    { id: "b", status: "produced", produced_video_id: "008-b", lane: "desk-notes" },
    { id: "c", status: "produced", produced_video_id: "bad-prefix", lane: "desk-loops" }, // no numeric prefix
  ] };
  const recent = recentFromBank(ideas, 3);
  // Only "008-b" has a valid numeric prefix (8 ≥ 0)
  assert.equal(recent.length, 1, "only ideas with valid numeric prefix in produced_video_id are included");
  assert.equal(recent[0].lane, "desk-notes");
});

test("[verifier] pickNextIdea soft-cap never returns null when eligible ideas exist (fall-back to top)", () => {
  // Even when every candidate extends a run, pickNextIdea must return the top-scored one (soft cap).
  const ideas = { ideas: [
    { id: "best", score: 95, status: "backlog", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
    { id: "other", score: 90, status: "backlog", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
    { id: "p1", status: "produced", produced_video_id: "007-p1", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
    { id: "p2", status: "produced", produced_video_id: "008-p2", lane: "desk-fixes", archetype: "mini-demo", tool: "Sheets" },
  ] };
  const pick = pickNextIdea(ideas, { recent: recentFromBank(ideas) });
  assert.ok(pick !== null, "soft-cap must never hard-block when eligible ideas exist");
  assert.equal(pick.id, "best", "falls back to top score when all extend the run");
});
