#!/usr/bin/env node
/**
 * refresh-facts.mjs — the knowledge-freshness AUDITOR (Wave 3, T3.1).
 *
 * facts.json is a CURATED, source-backed cache: the single source of truth for any
 * model / tool / price / version claim. The hard rule (CLAUDE.md + fact-check skill) is
 * that such claims are verified LIVE against `source`, NEVER recalled from model memory.
 *
 * This module does NOT write facts. It only audits staleness and reports what must be
 * re-verified by a human/agent before use:
 *   - `stale`        — older than policy.max_age_days (by its `retrieved` date),
 *   - `unreachable`  — its `source` URL didn't fetch OK,
 *   - `value_missing`— the cached value no longer literally appears on the source page
 *                      (a cheap "the page changed under us" signal).
 * Anything flagged lands in `needs_review`. Curating the new value stays a human/agent
 * step (the owner chose "curated + staleness", not auto-overwrite — see WAVES_3-5_PLAN T3.1).
 *
 *   node pipeline/shared/knowledge/refresh-facts.mjs            # audit + write freshness-report.json
 *   node pipeline/shared/knowledge/refresh-facts.mjs --strict   # exit 1 if anything needs review
 *   node pipeline/shared/knowledge/refresh-facts.mjs --no-fetch # staleness only (skip network)
 *
 * Pure logic lives in auditFacts() so tests can inject a fake fetch and clock.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FACTS_PATH = path.join(__dirname, "facts.json");
export const REPORT_PATH = path.join(__dirname, "freshness-report.json");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two dates (>=0). Returns null if `retrieved` is unparseable. */
export function ageInDays(retrieved, now) {
  const t = Date.parse(retrieved);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / DAY_MS));
}

/**
 * Audit a facts bank without mutating it. Returns a freshness report.
 *
 * @param {object}   facts        Parsed facts.json ({ updated, policy, facts: [...] }).
 * @param {object}   [opts]
 * @param {Date}     [opts.now]        Clock (defaults to new Date()).
 * @param {number}   [opts.maxAgeDays] Override policy.max_age_days.
 * @param {Function} [opts.fetchImpl]  async (url) => { ok, text() }. When omitted, network
 *                                     checks are skipped (reachable/value_present = null).
 * @param {number}   [opts.timeoutMs]  Per-source fetch timeout (default 10s).
 */
export async function auditFacts(facts, opts = {}) {
  const now = opts.now ?? new Date();
  const maxAgeDays = opts.maxAgeDays ?? facts?.policy?.max_age_days ?? 45;
  const fetchImpl = opts.fetchImpl ?? null;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const list = Array.isArray(facts?.facts) ? facts.facts : [];

  const results = [];
  for (const fact of list) {
    const age = ageInDays(fact.retrieved, now);
    const stale = age === null ? true : age > maxAgeDays;

    let reachable = null; // null = not checked
    let valuePresent = null;
    if (fetchImpl && fact.source) {
      try {
        const res = await withTimeout(fetchImpl(fact.source), timeoutMs);
        reachable = !!res?.ok;
        if (reachable && typeof res.text === "function") {
          const body = await res.text();
          valuePresent = textIncludesValue(body, fact.value);
        }
      } catch {
        reachable = false;
      }
    }

    const reasons = [];
    if (stale) reasons.push("stale");
    if (reachable === false) reasons.push("unreachable");
    if (valuePresent === false) reasons.push("value_missing");

    results.push({
      id: fact.id,
      subject: fact.subject,
      kind: fact.kind,
      value: fact.value,
      source: fact.source,
      retrieved: fact.retrieved,
      age_days: age,
      stale,
      reachable,
      value_present: valuePresent,
      needs_review: reasons.length > 0,
      reasons,
    });
  }

  const needs_review = results.filter((r) => r.needs_review).map((r) => r.id);
  return {
    checked: now.toISOString(),
    max_age_days: maxAgeDays,
    total: results.length,
    stale_count: results.filter((r) => r.stale).length,
    unreachable_count: results.filter((r) => r.reachable === false).length,
    value_missing_count: results.filter((r) => r.value_present === false).length,
    needs_review,
    results,
  };
}

/** Case-insensitive literal match of the cached value somewhere on the page text. */
export function textIncludesValue(body, value) {
  if (typeof body !== "string" || !body) return false;
  return body.toLowerCase().includes(String(value).toLowerCase());
}

function withTimeout(promise, ms) {
  // Wrap a fetch promise so a hung source can't stall the whole audit.
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export function loadFacts(p = FACTS_PATH) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const noFetch = args.includes("--no-fetch");

  const facts = loadFacts();
  const fetchImpl = noFetch ? null : nodeFetch;
  const report = await auditFacts(facts, { fetchImpl });

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

  console.log(
    `facts: ${report.total} | stale ${report.stale_count} | ` +
      `unreachable ${report.unreachable_count} | value_missing ${report.value_missing_count}`
  );
  if (report.needs_review.length) {
    console.log("needs re-verification (live, never recalled):");
    for (const r of report.results.filter((x) => x.needs_review)) {
      console.log(`  - ${r.id} [${r.reasons.join(", ")}] -> ${r.source}`);
    }
  } else {
    console.log("all facts fresh and corroborated.");
  }
  console.log(`report -> ${REPORT_PATH}`);

  process.exit(strict && report.needs_review.length ? 1 : 0);
}

/** Global fetch with a soft failure shape the auditor understands. */
async function nodeFetch(url) {
  const res = await fetch(url, { redirect: "follow" });
  return { ok: res.ok, text: () => res.text() };
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
