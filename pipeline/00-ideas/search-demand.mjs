#!/usr/bin/env node
/**
 * search-demand.mjs — every idea needs a phrase people actually type (3B, D-073).
 *
 * The idea bank's `search_term`s were written by judgment, and the channel's search traffic shows
 * it: 74 views from search in five months, on terms like "ai employee" (3). This checks each phrase
 * against YouTube's own autocomplete (the free suggest endpoint — no key, no quota) and records the
 * evidence on the idea as `search_demand`:
 *   • verified   — autocomplete offers the phrase itself, or longer searches that start with it
 *                  (`depth` = how many of up to 10 suggestions do; more = more people type it);
 *   • unverified — it offers neither; `alternatives` lists what it does offer, so the idea can be
 *                  re-phrased to a real search (or re-angled) at Gate 1;
 *   • waived     — the owner's call with a reason (breaking news that autocomplete hasn't caught up
 *                  with, or demand seen in Studio → Research).
 * `briefFromIdea` copies the record into the brief, and `seed-gate.mjs` refuses to script a brief
 * whose phrase is unverified, unchecked, or changed since it was checked.
 *
 *   node pipeline/00-ideas/search-demand.mjs                       # check ideas due (backlog + in-progress)
 *   node pipeline/00-ideas/search-demand.mjs --dry-run             # …print only
 *   node pipeline/00-ideas/search-demand.mjs <ideaId> --phrase "…"  # adopt a phrase for one idea and check it
 *   node pipeline/00-ideas/search-demand.mjs <ideaId> --waive "…"   # owner override, with the reason
 *   node pipeline/00-ideas/search-demand.mjs --brief <content-id>  # check a brief's own search_term
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
export const IDEAS_PATH = path.join(__dirname, "ideas.json");

export const SUGGEST_URL = "https://suggestqueries.google.com/complete/search";
/** Demand moves; a check older than this is re-run. */
export const RECHECK_DAYS = 30;
const SOURCE = "youtube-autocomplete";

const todayStr = (now = new Date()) => now.toISOString().slice(0, 10);

/** Lower-case, punctuation to spaces, single-spaced — how autocomplete itself compares queries. */
export function normalizePhrase(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * YouTube autocomplete for a phrase (English, US — the channel's market). `fetchImpl` is injected in
 * tests. The `firefox` client returns plain JSON: [query, [suggestion, …], …].
 */
export async function fetchSuggestions(phrase, { fetchImpl = globalThis.fetch, hl = "en", gl = "us" } = {}) {
  const url = `${SUGGEST_URL}?client=firefox&ds=yt&hl=${hl}&gl=${gl}&q=${encodeURIComponent(phrase)}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`YouTube autocomplete answered HTTP ${res.status} for "${phrase}"`);
  const body = await res.json();
  return Array.isArray(body?.[1]) ? body[1].filter((s) => typeof s === "string") : [];
}

/** Pure: does autocomplete show people typing this phrase? */
export function assessDemand(phrase, suggestions = []) {
  const p = normalizePhrase(phrase);
  const extending = suggestions.filter((s) => {
    const n = normalizePhrase(s);
    return n === p || n.startsWith(`${p} `);
  });
  return extending.length
    ? { status: "verified", depth: extending.length }
    : { status: "unverified", depth: 0, alternatives: suggestions.slice(0, 5) };
}

/** The `search_demand` record for a phrase (pure). */
export function demandRecord(phrase, suggestions, { now = new Date() } = {}) {
  return { phrase, ...assessDemand(phrase, suggestions), checked: todayStr(now), source: SOURCE };
}

/** The owner's override — kept until the phrase changes. */
export function waiveRecord(phrase, reason, { now = new Date() } = {}) {
  if (!String(reason ?? "").trim()) throw new Error("a waiver needs its reason (e.g. --waive \"breaking news, 2 days old\")");
  return { phrase, status: "waived", reason: String(reason).trim(), checked: todayStr(now), source: "owner" };
}

const daysBetween = (a, b) => (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000;

/**
 * Is this idea due a (re)check? Yes when it has a phrase and: no record yet, the phrase changed since
 * the record, or an autocomplete record is older than RECHECK_DAYS. A waiver stands until the phrase
 * changes.
 */
export function needsCheck(idea, { now = new Date(), recheckDays = RECHECK_DAYS } = {}) {
  const phrase = idea?.search_term;
  if (!phrase) return false;
  const d = idea.search_demand;
  if (!d || d.phrase !== phrase) return true;
  if (d.status === "waived") return false;
  return !(daysBetween(d.checked, todayStr(now)) < recheckDays);
}

/**
 * Check every idea that is due (default: backlog + in-progress) and return the new bank. One request
 * per idea, `delayMs` apart, so the free endpoint is never hammered. A failed request leaves that
 * idea as it was and is reported — never recorded as "no demand".
 * @returns {Promise<{ideas, checked: Array<{id, phrase, status, depth, alternatives?}>, failed: Array<{id, error}>}>}
 */
export async function checkIdeas(ideas, { fetchImpl, now = new Date(), statuses = ["backlog", "in-progress"], force = false, delayMs = 250, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const checked = [];
  const failed = [];
  const list = [];
  let first = true;
  for (const idea of ideas?.ideas ?? []) {
    const due = statuses.includes(idea.status) && idea.search_term && (force || needsCheck(idea, { now }));
    if (!due) {
      list.push(idea);
      continue;
    }
    if (!first && delayMs) await sleep(delayMs);
    first = false;
    try {
      const record = demandRecord(idea.search_term, await fetchSuggestions(idea.search_term, { fetchImpl }), { now });
      list.push({ ...idea, search_demand: record });
      checked.push({ id: idea.id, phrase: record.phrase, status: record.status, depth: record.depth, alternatives: record.alternatives });
    } catch (e) {
      list.push(idea);
      failed.push({ id: idea.id, error: e.message });
    }
  }
  return { ideas: { ...ideas, ideas: list }, checked, failed };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function argAfter(argv, flag) {
  const i = argv.indexOf(flag);
  return i > -1 ? argv[i + 1] : undefined;
}

function writeValidated(file, doc, schema) {
  const { valid, errors } = validate(doc, schema);
  if (!valid) throw new Error(`${path.relative(ROOT, file)} would be invalid: ${formatErrors(errors)}`);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
}

const line = (c) =>
  c.status === "verified"
    ? `  ✔ ${c.id}: "${c.phrase}" — ${c.depth} suggestion(s)`
    : `  ✘ ${c.id}: "${c.phrase}" — not typed; autocomplete offers: ${(c.alternatives ?? []).map((a) => `"${a}"`).join(", ") || "nothing"}`;

async function main(argv = process.argv.slice(2)) {
  const dryRun = argv.includes("--dry-run");
  const briefId = argAfter(argv, "--brief");

  if (briefId) {
    const file = path.join(ROOT, "content", briefId, "brief.json");
    const brief = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!brief.search_term) throw new Error(`${briefId}/brief.json has no search_term — write the phrase first`);
    const record = demandRecord(brief.search_term, await fetchSuggestions(brief.search_term));
    console.log(line({ id: briefId, ...record }));
    if (!dryRun) writeValidated(file, { ...brief, search_demand: record }, "brief");
    return;
  }

  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  const ideaId = argv.find((a, i) => !a.startsWith("--") && !["--phrase", "--waive", "--brief"].includes(argv[i - 1]));
  const phrase = argAfter(argv, "--phrase");
  const waive = argAfter(argv, "--waive");

  let next;
  if (ideaId) {
    const idea = ideas.ideas.find((i) => i.id === ideaId);
    if (!idea) throw new Error(`no idea "${ideaId}" in ideas.json`);
    const term = phrase ?? idea.search_term;
    if (!term) throw new Error(`"${ideaId}" has no search_term — pass --phrase "…"`);
    const record = waive !== undefined ? waiveRecord(term, waive) : demandRecord(term, await fetchSuggestions(term));
    console.log(record.status === "waived" ? `  ~ ${ideaId}: "${term}" waived — ${record.reason}` : line({ id: ideaId, ...record }));
    next = { ...ideas, ideas: ideas.ideas.map((i) => (i.id === ideaId ? { ...i, search_term: term, search_demand: record } : i)) };
  } else {
    const res = await checkIdeas(ideas, { fetchImpl: globalThis.fetch, force: argv.includes("--force") });
    for (const c of res.checked) console.log(line(c));
    for (const f of res.failed) console.warn(`  ! ${f.id}: ${f.error}`);
    const verified = res.checked.filter((c) => c.status === "verified").length;
    console.log(`checked ${res.checked.length} idea(s): ${verified} verified, ${res.checked.length - verified} not typed${res.failed.length ? `, ${res.failed.length} failed` : ""}.`);
    next = res.ideas;
  }
  if (dryRun) return console.log("--dry-run: nothing written.");
  writeValidated(IDEAS_PATH, next, "ideas");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
