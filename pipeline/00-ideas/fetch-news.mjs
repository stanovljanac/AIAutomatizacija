#!/usr/bin/env node
/**
 * fetch-news.mjs — the news watch (Wave 3, T3.2 · the `NewsSource` port).
 *
 * Pulls AI-automation news from the enabled `config.news.sources` — official changelog/RSS
 * feeds + aggregators (The Decoder, TLDR AI) + Hacker News (Algolia JSON API) — normalizes
 * them to `schemas/news.schema.json`, **dedups across sources by normalized-title hash**
 * (≥2 sources ⇒ higher score), writes `pipeline/00-ideas/news.json`, and promotes the top
 * corroborated items into **Desk Notes** ideas in `ideas.json` (`source.origin:"news"`).
 *
 * No external deps: RSS/Atom is parsed with a tiny regex reader; HN is already clean JSON.
 * Every source adapter is **fail-soft** — a dead or non-feed source is skipped with a warning,
 * never breaking the run. Pure logic is exported so tests inject a fake `fetch`.
 *
 *   node pipeline/00-ideas/fetch-news.mjs            # fetch, write news.json, promote to ideas.json
 *   node pipeline/00-ideas/fetch-news.mjs --dry-run  # parse + score, print, write nothing
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHARED = path.join(__dirname, "..", "shared");
export const NEWS_PATH = path.join(__dirname, "news.json");
export const IDEAS_PATH = path.join(__dirname, "ideas.json");

const DAY_MS = 24 * 60 * 60 * 1000;

// ── parsing ───────────────────────────────────────────────────────────────

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isNaN(code) ? m : String.fromCodePoint(code);
    }
    const key = e.toLowerCase();
    return key in ENTITIES ? ENTITIES[key] : m;
  });
}

/** Inner text of the first <tag ...>…</tag>, CDATA-stripped, entity-decoded, tags removed. */
function tagText(block, tag) {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  if (!m) return "";
  let inner = m[1];
  const cdata = /<!\[CDATA\[([\s\S]*?)\]\]>/i.exec(inner);
  if (cdata) inner = cdata[1];
  return decodeEntities(inner.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/** RSS <link>text</link> or Atom <link href="…"/>. */
function linkOf(block) {
  const rss = /<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i.exec(block);
  if (rss && rss[1].trim()) return decodeEntities(rss[1].trim());
  const atom = /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i.exec(block);
  return atom ? decodeEntities(atom[1].trim()) : "";
}

/**
 * Parse an RSS or Atom feed into raw items: { title, url, published, summary }.
 * Tolerant by design — anything that isn't a recognizable item yields [].
 */
export function parseRss(xml) {
  if (typeof xml !== "string" || !xml.includes("<")) return [];
  const blocks =
    xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const out = [];
  for (const block of blocks) {
    const title = tagText(block, "title");
    const url = linkOf(block);
    // Require an absolute http(s) link — relative refs fail news.schema's `format: uri`.
    if (!title || !/^https?:\/\//i.test(url)) continue;
    const published =
      isoOrNull(tagText(block, "pubDate")) ||
      isoOrNull(tagText(block, "published")) ||
      isoOrNull(tagText(block, "updated")) ||
      isoOrNull(tagText(block, "dc:date"));
    const summary = tagText(block, "description") || tagText(block, "summary");
    out.push({ title, url, published, summary });
  }
  return out;
}

/** Parse the Hacker News Algolia search API JSON into raw items. */
export function parseHnAlgolia(json) {
  let data = json;
  if (typeof json === "string") {
    try {
      data = JSON.parse(json);
    } catch {
      return [];
    }
  }
  const hits = Array.isArray(data?.hits) ? data.hits : [];
  const out = [];
  for (const h of hits) {
    const title = (h.title || h.story_title || "").trim();
    if (!title) continue;
    const url = h.url || h.story_url || (h.objectID ? `https://news.ycombinator.com/item?id=${h.objectID}` : "");
    if (!url) continue;
    out.push({
      title,
      url,
      published: isoOrNull(h.created_at),
      summary: (h.story_text || "").replace(/<[^>]+>/g, "").trim(),
    });
  }
  return out;
}

function isoOrNull(s) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

// ── dedup, scoring, classification ──────────────────────────────────────────

/** Lowercase, strip punctuation, collapse whitespace — the dedup key. */
export function normalizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Stable short id from the normalized title (dedup across sources). */
export function newsId(title) {
  return crypto.createHash("sha1").update(normalizeTitle(title)).digest("hex").slice(0, 12);
}

const ARCHETYPE_RULES = [
  [/\bvs\b|versus|compared?|comparison|better than/i, "comparison"],
  [/how to|tutorial|step[- ]by[- ]step|automate |build a /i, "mini-demo"],
  [/architecture|how it works|under the hood|pipeline|workflow|diagram/i, "diagram"],
];

/** Best-guess archetype from the headline (defaults to ideas). */
export function suggestArchetype(item) {
  const hay = `${item.title} ${item.summary || ""}`;
  for (const [re, arch] of ARCHETYPE_RULES) if (re.test(hay)) return arch;
  return "ideas";
}

const TASK_RULES = [
  [/email|invite|reminder|outreach|follow[- ]up|newsletter/i, "outbound-comms"],
  [/invoice|pdf|document|contract|report\b|slide|doc\b/i, "documents"],
  [/schedule|calendar|booking|shift|appointment/i, "scheduling"],
  [/data entry|extract|scrape|clean|dedup|spreadsheet|csv/i, "data-entry"],
  [/dashboard|analytics|summary|lookup|metrics/i, "lookups-reports"],
];

/** Best-guess task cluster for a promoted idea (valid ideas.schema enum; defaults to other). */
export function guessTask(item) {
  const hay = `${item.title} ${item.summary || ""}`;
  for (const [re, task] of TASK_RULES) if (re.test(hay)) return task;
  return "other";
}

/** Deterministic 0–100 score: source authority + corroboration + recency. */
export function scoreItem(item, now = new Date()) {
  const types = new Set((item.sources || []).map((s) => s.type));
  let score = types.has("official") ? 60 : 45;
  const extra = Math.max(0, (item.sources?.length || 1) - 1);
  score += Math.min(24, extra * 12); // corroboration

  if (item.published) {
    const age = (now.getTime() - Date.parse(item.published)) / DAY_MS;
    if (Number.isNaN(age)) score += 5;
    else if (age <= 3) score += 15;
    else if (age <= 7) score += 8;
    else if (age <= 30) score += 3;
  } else {
    score += 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Merge raw items (each carrying a `source`) across sources by normalized-title hash.
 * Returns scored news.schema items, newest/strongest first.
 *
 * @param {Array<{title,url,published,summary,source:{name,type,url?}}>} raw
 */
export function dedupeItems(raw, { now = new Date(), fetched = new Date() } = {}) {
  const byId = new Map();
  for (const r of raw) {
    if (!r?.title || !r?.url) continue;
    const id = newsId(r.title);
    let item = byId.get(id);
    if (!item) {
      item = {
        id,
        title: r.title,
        url: r.url,
        summary: r.summary || "",
        published: r.published || null,
        fetched: fetched.toISOString(),
        sources: [],
        topics: [],
        suggested_archetype: "ideas",
        idea_id: null,
        status: "new",
      };
      byId.set(id, item);
    }
    // Corroboration: add the source if that named source isn't already on the item.
    const src = { name: r.source.name, type: r.source.type, url: r.source.url || r.url };
    if (!item.sources.some((s) => s.name === src.name)) item.sources.push(src);
    // Keep the earliest known publish date and the first non-empty summary.
    if (r.published && (!item.published || Date.parse(r.published) < Date.parse(item.published))) {
      item.published = r.published;
    }
    if (!item.summary && r.summary) item.summary = r.summary;
  }

  const items = [...byId.values()];
  for (const item of items) {
    item.suggested_archetype = suggestArchetype(item);
    item.score = scoreItem(item, now);
  }
  items.sort((a, b) => b.score - a.score);
  return { updated: fetched.toISOString(), items };
}

// ── promotion to the idea-bank ──────────────────────────────────────────────

/**
 * Promote top corroborated news items into Desk Notes ideas (idempotent by idea id).
 * Mutates a COPY of `ideas` and returns it; marks promoted news items in place.
 *
 * @param {object} news   { updated, items } from dedupeItems
 * @param {object} ideas  parsed ideas.json
 */
export function promoteToIdeas(news, ideas, opts = {}) {
  const { minScore = 70, minCorroboration = 1, max = 5, now = new Date() } = opts;
  const out = { updated: now.toISOString().slice(0, 10), ideas: [...(ideas?.ideas || [])] };
  const existing = new Set(out.ideas.map((i) => i.id));

  const eligible = news.items
    .filter((it) => it.status !== "ignored")
    .filter((it) => it.score >= minScore && it.sources.length >= minCorroboration)
    .slice(0, max);

  for (const it of eligible) {
    const ideaId = `news-${it.id}`;
    it.idea_id = ideaId;
    it.status = "promoted";
    if (existing.has(ideaId)) continue; // already in the bank — don't duplicate
    out.ideas.push({
      id: ideaId,
      title: it.title,
      task: guessTask(it),
      sector: "general",
      tool: "AI",
      archetype: it.suggested_archetype,
      angle_hint: "Desk Notes: what changed, why it matters, and the one boring task it unlocks.",
      score: Math.min(100, Math.round(it.score * 0.9)), // slightly below its news signal
      status: "backlog",
      produced_video_id: null,
      source: {
        origin: "news",
        news_id: it.id,
        url: it.url,
        added: now.toISOString().slice(0, 10),
      },
    });
    existing.add(ideaId);
  }
  return out;
}

// ── CLI plumbing ─────────────────────────────────────────────────────────────

function isHnSource(source) {
  return source.name === "hn" || /algolia|ycombinator/i.test(source.url || "");
}

/** Fetch + parse one source. Fail-soft: returns [] on any error. */
export async function fetchSource(source, fetchImpl) {
  try {
    const res = await fetchImpl(source.url);
    if (!res?.ok) return [];
    const body = await res.text();
    const raw = isHnSource(source) ? parseHnAlgolia(body) : parseRss(body);
    return raw.map((r) => ({ ...r, source: { name: source.name, type: source.type, url: r.url } }));
  } catch (e) {
    console.warn(`  ! ${source.name}: ${e.message}`);
    return [];
  }
}

function loadConfig() {
  for (const name of ["config.json", "config.example.json"]) {
    const p = path.join(SHARED, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  return { news: { sources: [] } };
}

function readJsonOr(p, fallback) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

async function nodeFetch(url) {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "AutomationDesk-news/1.0" } });
  return { ok: res.ok, text: () => res.text() };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const cfg = loadConfig();
  const news_cfg = cfg.news || {};
  const sources = (news_cfg.sources || []).filter((s) => s.enabled !== false);
  const minCorroboration = news_cfg.min_corroboration ?? 1;

  console.log(`fetching ${sources.length} source(s)…`);
  const raw = [];
  for (const s of sources) {
    const items = await fetchSource(s, nodeFetch);
    console.log(`  ${s.name} (${s.type}): ${items.length} item(s)`);
    raw.push(...items);
  }

  const news = dedupeItems(raw);
  const ideas = readJsonOr(IDEAS_PATH, { updated: new Date().toISOString().slice(0, 10), ideas: [] });
  const updatedIdeas = promoteToIdeas(news, ideas, { minCorroboration });
  const promoted = news.items.filter((i) => i.status === "promoted").length;

  console.log(`\n${news.items.length} unique item(s); ${promoted} promoted to Desk Notes ideas.`);
  for (const it of news.items.slice(0, 8)) {
    console.log(`  [${it.score}] ${it.title}  (${it.sources.map((s) => s.name).join("+")})`);
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }
  fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2) + "\n");
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(updatedIdeas, null, 2) + "\n");
  console.log(`\nwrote ${path.relative(path.join(__dirname, "..", ".."), NEWS_PATH)} + updated ideas.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
