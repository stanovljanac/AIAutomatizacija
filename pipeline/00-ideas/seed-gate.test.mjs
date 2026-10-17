// D-059 seed-gate: a brief may not be scripted until it carries an idea-pass verdict (value_band).
import { test } from "node:test";
import assert from "node:assert/strict";
import { seedGate, searchDemandGate } from "./seed-gate.mjs";

// 3B: a brief that cleared the idea-pass must also carry a phrase people type.
const searched = { search_term: "context window", search_demand: { phrase: "context window", status: "verified", depth: 10, checked: "2026-10-17" } };

test("seedGate PASSES a brief that cleared the idea-pass (qualify)", () => {
  const { ok } = seedGate({ id: "017-x", value_band: "qualify", ...searched });
  assert.equal(ok, true);
});

test("seedGate PASSES an owner-band brief (owner decides is still a real verdict)", () => {
  assert.equal(seedGate({ value_band: "owner", ...searched }).ok, true);
});

test("seedGate STOPS when value_band is absent (the 015 hole: seed skipped the idea-pass)", () => {
  const { ok, reason } = seedGate({ id: "015-x" });
  assert.equal(ok, false);
  assert.match(reason, /never passed the idea-pass/i);
});

test("seedGate STOPS an empty-string band (treated as absent)", () => {
  assert.equal(seedGate({ value_band: "" }).ok, false);
});

test("seedGate STOPS a rejected brief (idea-pass said no)", () => {
  const { ok, reason } = seedGate({ value_band: "reject" });
  assert.equal(ok, false);
  assert.match(reason, /reject/i);
});

test("seedGate STOPS an unrecognized band (typo/garbage never counts as a pass)", () => {
  assert.equal(seedGate({ value_band: "maybe" }).ok, false);
});

test("seedGate STOPS a retired brief (status=rejected) even if it still carries a qualify band", () => {
  // the 015 case after retirement: value_band inherited "qualify" but the video was retired.
  const { ok, reason } = seedGate({ id: "015-x", value_band: "qualify", status: "rejected" });
  assert.equal(ok, false);
  assert.match(reason, /retired/i);
});

test("seedGate is null-safe on a missing brief", () => {
  assert.equal(seedGate(undefined).ok, false);
  assert.equal(seedGate(null).ok, false);
});

// ── 3B (D-073): the search phrase ────────────────────────────────────────────

test("seedGate STOPS a cleared brief whose phrase was never checked, and says how to check it", () => {
  const { ok, reason } = seedGate({ id: "030-x", value_band: "qualify", search_term: "context window" });
  assert.equal(ok, false);
  assert.match(reason, /never checked — run: node pipeline\/00-ideas\/search-demand\.mjs --brief 030-x/);
});

test("seedGate STOPS a brief with no search_term at all", () => {
  assert.match(seedGate({ value_band: "qualify" }).reason, /no search_term/);
});

test("seedGate STOPS an unverified phrase and names autocomplete's alternatives", () => {
  const brief = {
    value_band: "qualify",
    search_term: "automatically email invoices google sheets",
    search_demand: { phrase: "automatically email invoices google sheets", status: "unverified", depth: 0, alternatives: ["automatically send email from google sheets"], checked: "2026-10-17" },
  };
  const { ok, reason } = seedGate(brief);
  assert.equal(ok, false);
  assert.match(reason, /nobody types "automatically email invoices google sheets"/);
  assert.match(reason, /"automatically send email from google sheets"/);
});

test("seedGate STOPS when the phrase changed after it was checked", () => {
  const brief = { value_band: "qualify", ...searched, search_term: "context window explained" };
  assert.match(seedGate(brief).reason, /changed to "context window explained" after "context window" was checked/);
});

test("seedGate PASSES an owner waiver and reports it", () => {
  const brief = { value_band: "qualify", search_term: "dots launch", search_demand: { phrase: "dots launch", status: "waived", reason: "breaking news, 2 days old", checked: "2026-10-17" } };
  const { ok, reason } = seedGate(brief);
  assert.equal(ok, true);
  assert.match(reason, /waived by the owner \(breaking news, 2 days old\)/);
});

test("searchDemandGate reports the verified depth", () => {
  assert.deepEqual(searchDemandGate(searched), { ok: true, reason: 'search phrase "context window" verified (10 autocomplete suggestion(s))' });
});
