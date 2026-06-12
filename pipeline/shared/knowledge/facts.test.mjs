import { test } from "node:test";
import assert from "node:assert/strict";

import { validateFile } from "../testkit/index.mjs";
import {
  auditFacts,
  ageInDays,
  textIncludesValue,
  loadFacts,
  FACTS_PATH,
} from "./refresh-facts.mjs";

// A tiny fake fetch: maps url -> { ok, body } or "throw" to simulate a dead source.
function fakeFetch(map) {
  return async (url) => {
    const entry = map[url];
    if (entry === "throw") throw new Error(`network down: ${url}`);
    if (!entry) return { ok: false, text: async () => "" };
    return { ok: true, text: async () => entry };
  };
}

const NOW = new Date("2026-06-12T00:00:00Z");

function sampleFacts() {
  return {
    updated: "2026-06-01",
    policy: { max_age_days: 45 },
    facts: [
      {
        id: "x.fresh",
        subject: "x",
        kind: "price",
        label: "fresh fact",
        value: 5.0,
        source: "https://example.com/fresh",
        retrieved: "2026-06-01", // 11 days old at NOW
      },
      {
        id: "x.old",
        subject: "x",
        kind: "price",
        label: "old fact",
        value: 9.0,
        source: "https://example.com/old",
        retrieved: "2026-01-01", // ~162 days old at NOW
      },
    ],
  };
}

test("seed facts.json validates against facts.schema.json", () => {
  const { valid, errors } = validateFile(FACTS_PATH);
  assert.ok(valid, JSON.stringify(errors));
});

test("loadFacts reads the seed and exposes the policy", () => {
  const facts = loadFacts();
  assert.ok(Array.isArray(facts.facts) && facts.facts.length > 0);
  assert.equal(typeof facts.policy.max_age_days, "number");
});

test("ageInDays counts whole days and returns null for bad dates", () => {
  assert.equal(ageInDays("2026-06-01", NOW), 11);
  assert.equal(ageInDays("2026-06-12", NOW), 0);
  assert.equal(ageInDays("not-a-date", NOW), null);
});

test("textIncludesValue is a case-insensitive literal match", () => {
  assert.equal(textIncludesValue("Price is $5.00 today", 5.0), true);
  assert.equal(textIncludesValue("model CLAUDE-OPUS-4-8 ships", "claude-opus-4-8"), true);
  assert.equal(textIncludesValue("nothing here", "gpt-5.5"), false);
  assert.equal(textIncludesValue("", "x"), false);
});

test("staleness-only audit (no fetch): old fact flagged, fresh one clean", async () => {
  const report = await auditFacts(sampleFacts(), { now: NOW });
  assert.equal(report.total, 2);
  assert.equal(report.stale_count, 1);
  assert.equal(report.unreachable_count, 0);
  assert.equal(report.value_missing_count, 0);
  assert.deepEqual(report.needs_review, ["x.old"]);

  const fresh = report.results.find((r) => r.id === "x.fresh");
  assert.equal(fresh.stale, false);
  assert.equal(fresh.reachable, null); // not checked without a fetch impl
  assert.equal(fresh.value_present, null);
  assert.equal(fresh.needs_review, false);

  const old = report.results.find((r) => r.id === "x.old");
  assert.equal(old.stale, true);
  assert.deepEqual(old.reasons, ["stale"]);
});

test("fetch audit flags unreachable and value-missing sources", async () => {
  const facts = sampleFacts();
  // fresh source still carries its value; old source is down.
  const fetchImpl = fakeFetch({
    "https://example.com/fresh": "Today the price is $5.00 per unit",
    "https://example.com/old": "throw",
  });
  const report = await auditFacts(facts, { now: NOW, fetchImpl });

  const fresh = report.results.find((r) => r.id === "x.fresh");
  assert.equal(fresh.reachable, true);
  assert.equal(fresh.value_present, true);
  assert.equal(fresh.needs_review, false);

  const old = report.results.find((r) => r.id === "x.old");
  assert.equal(old.reachable, false);
  assert.ok(old.reasons.includes("unreachable"));
  assert.ok(old.reasons.includes("stale"));
});

test("fetch audit flags a value that no longer appears on its source", async () => {
  const facts = {
    updated: "2026-06-10",
    policy: { max_age_days: 45 },
    facts: [
      {
        id: "x.changed",
        subject: "x",
        kind: "price",
        label: "price that moved",
        value: 5.0,
        source: "https://example.com/changed",
        retrieved: "2026-06-10",
      },
    ],
  };
  const fetchImpl = fakeFetch({
    "https://example.com/changed": "The price is now $7.00 — it changed",
  });
  const report = await auditFacts(facts, { now: NOW, fetchImpl });
  const r = report.results[0];
  assert.equal(r.stale, false);
  assert.equal(r.reachable, true);
  assert.equal(r.value_present, false);
  assert.deepEqual(r.reasons, ["value_missing"]);
  assert.equal(report.value_missing_count, 1);
  assert.deepEqual(report.needs_review, ["x.changed"]);
});

test("auditFacts never mutates the input bank (curated, not auto-overwrite)", async () => {
  const facts = sampleFacts();
  const before = JSON.stringify(facts);
  await auditFacts(facts, {
    now: NOW,
    fetchImpl: fakeFetch({
      "https://example.com/fresh": "$5.00",
      "https://example.com/old": "stale page without the number",
    }),
  });
  assert.equal(JSON.stringify(facts), before);
});

// ── regression tests added by verifier ─────────────────────────────────────

test("ageInDays: future retrieved date returns 0, not negative", () => {
  // If a fact has retrieved set to a future date (clock skew / manual edit), age must be 0.
  assert.equal(ageInDays("2027-01-01", NOW), 0);
});

test("ageInDays: exactly max_age_days old is NOT stale (boundary is exclusive)", async () => {
  // staleness check uses age > maxAgeDays, so age === max is still fresh.
  const facts = {
    updated: "2026-06-12",
    policy: { max_age_days: 45 },
    facts: [{
      id: "boundary.fact",
      subject: "x",
      kind: "price",
      label: "boundary",
      value: "1",
      source: "https://example.com/b",
      retrieved: "2026-04-28", // exactly 45 days before 2026-06-12
    }],
  };
  const report = await auditFacts(facts, { now: NOW });
  assert.equal(report.results[0].age_days, 45);
  assert.equal(report.results[0].stale, false, "45 days old with max 45 should NOT be stale");
  assert.equal(report.stale_count, 0);
});

test("auditFacts: empty facts list produces a zero-count report without crashing", async () => {
  const report = await auditFacts({ updated: "2026-06-12", policy: { max_age_days: 45 }, facts: [] }, { now: NOW });
  assert.equal(report.total, 0);
  assert.equal(report.stale_count, 0);
  assert.deepEqual(report.needs_review, []);
});

test("auditFacts: missing/null facts array handled gracefully", async () => {
  const report = await auditFacts({ updated: "2026-06-12", policy: { max_age_days: 45 } }, { now: NOW });
  assert.equal(report.total, 0);
  assert.deepEqual(report.needs_review, []);
});
