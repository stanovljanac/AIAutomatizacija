// 3B (D-073) — search demand: autocomplete evidence per idea, re-checked monthly, never recorded as
// "no demand" on a failed request; the brief carries it to the seed-gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertValid } from "../shared/testkit/index.mjs";
import { briefFromIdea } from "./pick-next.mjs";
import {
  RECHECK_DAYS,
  SUGGEST_URL,
  assessDemand,
  checkIdeas,
  demandRecord,
  fetchSuggestions,
  needsCheck,
  normalizePhrase,
  waiveRecord,
} from "./search-demand.mjs";

const NOW = new Date("2026-10-17T12:00:00Z");

/** A fetch that answers like suggestqueries (firefox client) from a phrase → suggestions map. */
function fakeFetch(answers, { fail = new Set() } = {}) {
  const calls = [];
  const impl = async (url) => {
    calls.push(url);
    const q = new URL(url).searchParams.get("q");
    if (fail.has(q)) return { ok: false, status: 503, json: async () => null };
    return { ok: true, status: 200, json: async () => [q, answers[q] ?? [], [], {}] };
  };
  impl.calls = calls;
  return impl;
}

test("normalizePhrase compares the way autocomplete does", () => {
  assert.equal(normalizePhrase("  What's a Token?  "), "whats a token");
  assert.equal(normalizePhrase("PDF-to-Excel"), "pdf to excel");
});

test("fetchSuggestions asks YouTube's autocomplete (English, US) and returns the suggestion list", async () => {
  const f = fakeFetch({ "extract data from pdf to excel": ["extract data from pdf to excel", "extract data from pdf to excel using copilot"] });
  assert.deepEqual(await fetchSuggestions("extract data from pdf to excel", { fetchImpl: f }), ["extract data from pdf to excel", "extract data from pdf to excel using copilot"]);
  const url = new URL(f.calls[0]);
  assert.equal(`${url.origin}${url.pathname}`, SUGGEST_URL);
  assert.equal(url.searchParams.get("ds"), "yt");
  assert.equal(url.searchParams.get("client"), "firefox");
  assert.equal(url.searchParams.get("hl"), "en");
  await assert.rejects(fetchSuggestions("x", { fetchImpl: fakeFetch({}, { fail: new Set(["x"]) }) }), /HTTP 503/);
});

test("assessDemand: the phrase or longer searches starting with it = verified, with depth", () => {
  // real answers, 2026-10-17
  assert.deepEqual(assessDemand("what is a token in ai", ["what is a token in ai", "what is token in ai in hindi"]), { status: "verified", depth: 1 });
  assert.deepEqual(assessDemand("context window", ["context window", "context window management", "context windows ai"]), { status: "verified", depth: 2 });
  assert.deepEqual(assessDemand("automatically email invoices google sheets", ["automatically send email from google sheets"]), {
    status: "unverified",
    depth: 0,
    alternatives: ["automatically send email from google sheets"],
  });
  assert.equal(assessDemand("clean messy data excel", ["clean messy data in excel"]).status, "unverified", "close is not the same search");
  assert.deepEqual(assessDemand("anything", []), { status: "unverified", depth: 0, alternatives: [] });
});

test("demandRecord and waiveRecord are schema-valid idea fields", () => {
  const idea = { id: "x", title: "X", archetype: "ideas", task: "other", score: 50, status: "backlog", search_term: "context window" };
  assertValid({ updated: "2026-10-17", ideas: [{ ...idea, search_demand: demandRecord("context window", ["context window"], { now: NOW }) }] }, "ideas");
  assertValid({ updated: "2026-10-17", ideas: [{ ...idea, search_demand: waiveRecord("context window", "breaking news", { now: NOW }) }] }, "ideas");
  assert.throws(() => waiveRecord("x", "  "), /needs its reason/);
});

test("needsCheck: unchecked, re-phrased or older than a month → yes; a waiver stands", () => {
  const rec = (over) => ({ search_term: "context window", search_demand: { phrase: "context window", status: "verified", checked: "2026-10-10", ...over } });
  assert.equal(needsCheck({ search_term: "x" }, { now: NOW }), true);
  assert.equal(needsCheck({}, { now: NOW }), false, "no phrase, nothing to check");
  assert.equal(needsCheck(rec(), { now: NOW }), false);
  assert.equal(needsCheck({ ...rec(), search_term: "context window explained" }, { now: NOW }), true);
  assert.equal(needsCheck(rec({ checked: "2026-09-01" }), { now: NOW }), true, `older than ${RECHECK_DAYS} days`);
  assert.equal(needsCheck(rec({ status: "waived", checked: "2026-01-01" }), { now: NOW }), false);
});

test("checkIdeas checks only due backlog/in-progress ideas, spaced out, and keeps a failed one as it was", async () => {
  const bank = {
    updated: "2026-10-01",
    ideas: [
      { id: "a", title: "A", archetype: "ideas", task: "other", score: 50, status: "backlog", search_term: "context window" },
      { id: "b", title: "B", archetype: "ideas", task: "other", score: 50, status: "backlog", search_term: "email invoices google sheets" },
      { id: "c", title: "C", archetype: "ideas", task: "other", score: 50, status: "produced", search_term: "whatever" },
      { id: "d", title: "D", archetype: "ideas", task: "other", score: 50, status: "in-progress", search_term: "down" },
      { id: "e", title: "E", archetype: "ideas", task: "other", score: 50, status: "backlog", search_term: "fresh", search_demand: { phrase: "fresh", status: "verified", checked: "2026-10-15" } },
    ],
  };
  const sleeps = [];
  const f = fakeFetch({ "context window": ["context window", "context window llm"], "email invoices google sheets": ["email from google sheets"] }, { fail: new Set(["down"]) });
  const out = await checkIdeas(bank, { fetchImpl: f, now: NOW, sleep: async (ms) => sleeps.push(ms) });
  assert.deepEqual(out.checked.map((c) => [c.id, c.status]), [["a", "verified"], ["b", "unverified"]]);
  assert.deepEqual(out.failed.map((x) => x.id), ["d"]);
  assert.equal(f.calls.length, 3, "produced and freshly-checked ideas are skipped");
  assert.deepEqual(sleeps, [250, 250], "spaced between requests, not before the first");
  const byId = Object.fromEntries(out.ideas.ideas.map((i) => [i.id, i]));
  assert.equal(byId.a.search_demand.depth, 2);
  assert.deepEqual(byId.b.search_demand.alternatives, ["email from google sheets"]);
  assert.equal(byId.d.search_demand, undefined, "a failed request is never recorded as 'no demand'");
  assert.equal(byId.c, bank.ideas[2]);
  assertValid(out.ideas, "ideas");
});

test("briefFromIdea carries the search evidence to the brief (and the brief schema takes it)", () => {
  const idea = { id: "a", title: "A", archetype: "ideas", task: "other", score: 50, status: "backlog", search_term: "context window", search_demand: demandRecord("context window", ["context window"], { now: NOW }) };
  const brief = briefFromIdea(idea);
  assert.deepEqual(brief.search_demand, idea.search_demand);
  assert.notEqual(brief.search_demand, idea.search_demand, "a copy, not a shared object");
  assertValid({ id: "030-a", archetype: "ideas", target_seconds: 300, format: "long", ...brief }, "brief");
});
