#!/usr/bin/env node
/**
 * fetch-analytics.mjs — the analytics loop (Wave 5, T5.2 · Phase B #4 · rewired by 1A, D-073).
 *
 * Closes the growth loop, once a week:
 *   1. sync the CHANNEL CATALOG (youtube-catalog.mjs) — every upload, its type, playlists and
 *      lifetime metrics, straight from YouTube; tie each upload to its content folder;
 *   2. pull REACH (reach.mjs) — thumbnail impressions + CTR from the Reporting API;
 *   3. bind the YouTube ids onto the ledger and take every snapshot that is due (reconcile.mjs);
 *   4. write each PRODUCED idea's `metrics` and **re-rank the bank** so the next auto-pick prefers
 *      clusters that actually performed;
 *   5. refresh the playlist test report (3E, playlist-report.mjs).
 *
 * Design (mirrors upload.mjs / build-metadata.mjs): the logic is PURE and testable; every network
 * call goes through an injected client, so tests need no keys.
 *   • fetchVideoAnalytics({ client, videoId })  → one reports.query call (per-video; kept for callers)
 *   • parseAnalyticsRow(response)               → robust column-name → value map
 *   • toIdeaMetrics(raw)                        → schema fields (views / avg_view_seconds / ctr / retention_pct)
 *   • uploadForIdea / ideaMetricsFromCatalog    → the catalog upload + metrics that stand for an idea
 *   • applyMetrics(ideas, metricsByVideoId, …)  → fill produced ideas' metrics (idempotent)
 *   • performanceScore(metrics, baselines)      → 0..100 measured-performance signal
 *   • rerankBank(ideas, …)                      → effective `adjusted_score` + re-sort (idempotent)
 *   • runChannelSync({ catalog, yt, ya, yr, … }) → steps 1–2 against injected clients
 *
 * Idempotency: re-ranking always derives `adjusted_score` from the immutable predicted `score`
 * plus the (immutable for a run) metrics — never from the previous run's output — so running it
 * twice on the same stats leaves the bank unchanged.
 *
 *   node pipeline/06-publish/fetch-analytics.mjs                  # the weekly run: fetch, write, re-rank
 *   node pipeline/06-publish/fetch-analytics.mjs --dry-run        # fetch + print, write nothing
 *   node pipeline/06-publish/fetch-analytics.mjs --map <ytId> <key>   # tie an upload to its folder
 *   node pipeline/06-publish/fetch-analytics.mjs --map <ytId> none    # …or untie it
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../shared/lib/validate-lib.mjs";
import { loadLedger, saveLedger } from "../state/ledger.mjs";
import { bindYoutubeIds, takeDueSnapshots } from "../state/reconcile.mjs";
import {
  contentCandidates,
  contentTypes,
  listPlaylists,
  listUploads,
  loadCatalog,
  matchContentKeys,
  mergeCatalog,
  saveCatalog,
  setContentKey,
  trafficSources,
  videoMetrics,
} from "./youtube-catalog.mjs";
import { applyReach, reachWarnings, syncReach } from "./reach.mjs";
import { playlistReport, reportMarkdown, REPORT_PATH } from "./playlist-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
export const IDEAS_PATH = path.join(ROOT, "pipeline", "00-ideas", "ideas.json");
const SHARED = path.join(ROOT, "pipeline", "shared");

// Core per-video metrics that the YouTube Analytics API reliably exposes for a channel owner.
// (Thumbnail-impressions CTR is Studio-only; when a CTR-like column IS present we map it, else
// the signal is simply dropped from the score — see toIdeaMetrics / performanceScore.)
export const ANALYTICS_METRICS = ["views", "averageViewDuration", "averageViewPercentage"];

// ── network (injected client) ────────────────────────────────────────────────

/**
 * Query the YouTube Analytics API for ONE video. `client` is a
 * google.youtubeAnalytics('v2') instance (injected in tests). Returns the raw `data` payload
 * ({ columnHeaders, rows }). Resolves null on an empty/!rows response so callers fail-soft.
 */
export async function fetchVideoAnalytics({
  client,
  videoId,
  metrics = ANALYTICS_METRICS,
  startDate = "2020-01-01",
  endDate = todayStr(),
} = {}) {
  if (!client || !videoId) return null;
  const res = await client.reports.query({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: metrics.join(","),
    filters: `video==${videoId}`,
  });
  const data = res?.data ?? res ?? null;
  return data && Array.isArray(data.rows) && data.rows.length ? data : null;
}

// ── parsing + mapping ────────────────────────────────────────────────────────

/**
 * Map a YouTube Analytics response to { metricName: value } using `columnHeaders` for the
 * column order (never positional guessing). Reads the first data row. Returns {} when empty.
 */
export function parseAnalyticsRow(data) {
  const headers = data?.columnHeaders;
  const row = data?.rows?.[0];
  if (!Array.isArray(headers) || !Array.isArray(row)) return {};
  const out = {};
  headers.forEach((h, i) => {
    const name = typeof h === "string" ? h : h?.name;
    if (name != null && row[i] != null) out[name] = row[i];
  });
  return out;
}

const num = (v) => (typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : undefined);

/**
 * Translate raw API metric names → the ideas.schema `metrics` shape. Only sets fields that are
 * present (a missing column is simply absent, never 0). CTR is mapped from any of the API's
 * click-through column spellings when present; otherwise it is omitted.
 */
export function toIdeaMetrics(raw = {}, { now = new Date() } = {}) {
  const m = { fetched: now.toISOString().slice(0, 10) };
  const views = num(raw.views);
  if (views !== undefined) m.views = views;
  const avd = num(raw.averageViewDuration);
  if (avd !== undefined) m.avg_view_seconds = avd;
  const avp = num(raw.averageViewPercentage);
  if (avp !== undefined) m.retention_pct = avp;
  const ctr = num(raw.cardClickRate ?? raw.annotationClickThroughRate ?? raw.impressionsClickThroughRate);
  if (ctr !== undefined) m.ctr = ctr;
  return m;
}

// ── apply metrics to the bank ────────────────────────────────────────────────

/**
 * Write `metricsByVideoId` into each produced idea's `metrics`, matching idea → YouTube video id
 * via `videoIdByIdeaId` (resolved from each video's publish.json). Pure: returns a new bank;
 * idempotent (same payload → same metrics). Ideas without a fetched metric are left untouched.
 */
export function applyMetrics(ideas, metricsByVideoId = {}, videoIdByIdeaId = {}) {
  const list = (ideas?.ideas || []).map((idea) => {
    const vid = videoIdByIdeaId[idea.id];
    const metrics = vid ? metricsByVideoId[vid] : undefined;
    return metrics ? { ...idea, metrics: { ...idea.metrics, ...metrics } } : idea;
  });
  return { ...ideas, ideas: list };
}

// ── performance + re-ranking ─────────────────────────────────────────────────

export const DEFAULT_BASELINES = {
  ctr: 0.04, // 4% thumbnail CTR ≈ on-par
  retention: 0.45, // 45% average-view-percentage ≈ on-par
  views: 5000, // log anchor for the views signal
  target_seconds: 360, // long-form target (avg_view_seconds fallback when no retention_pct)
};

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * Measured-performance score 0..100 from a produced video's metrics. Each available signal is
 * normalized against its baseline (1.0 = on-par), clamped to [0,2], and weighted; weights are
 * re-normalized over the signals actually present, so a missing metric never drags the score to 0.
 * Returns null when there is no usable signal at all.
 */
export function performanceScore(metrics = {}, baselines = {}) {
  const b = { ...DEFAULT_BASELINES, ...baselines };
  const signals = [];
  if (typeof metrics.views === "number") {
    signals.push([0.4, clamp(Math.log10(metrics.views + 1) / Math.log10(b.views + 1), 0, 2)]);
  }
  const retentionFrac =
    typeof metrics.retention_pct === "number"
      ? metrics.retention_pct / 100
      : typeof metrics.avg_view_seconds === "number"
        ? metrics.avg_view_seconds / b.target_seconds
        : undefined;
  if (retentionFrac !== undefined) {
    signals.push([0.4, clamp(retentionFrac / b.retention, 0, 2)]);
  }
  if (typeof metrics.ctr === "number") {
    signals.push([0.2, clamp(metrics.ctr / b.ctr, 0, 2)]);
  }
  if (!signals.length) return null;
  const wsum = signals.reduce((a, [w]) => a + w, 0);
  const score = signals.reduce((a, [w, s]) => a + (w / wsum) * s, 0); // 0..2
  return Math.round(clamp(score * 50, 0, 100)); // → 0..100
}

/** Effective rank key: the analytics-adjusted score if present, else the prediction. */
export function effectiveScore(idea) {
  return typeof idea.adjusted_score === "number" ? idea.adjusted_score : idea.score;
}

/**
 * Re-rank the bank from measured performance and re-sort by effective score (Phase B #4).
 *  • PRODUCED ideas with metrics: blend the predicted `score` toward the measured `performance`.
 *  • BACKLOG ideas: nudge by how their task-cluster's mean performance compares to the global
 *    mean — double down on clusters that work, ease off the ones that don't.
 * Pure + idempotent: `adjusted_score`/`performance` are recomputed from `score` + `metrics`
 * each run, never accumulated. The predicted `score` is preserved untouched.
 *
 * @returns new ideas bank (re-sorted; `adjusted_score`/`performance` set only where they move).
 */
export function rerankBank(ideas, opts = {}) {
  const {
    producedWeight = 0.5,
    clusterDim = "task",
    clusterGain = 0.2,
    maxClusterNudge = 6,
    baselines = {},
    now = new Date(),
  } = opts;

  const list = (ideas?.ideas || []).map((idea) => ({ ...idea }));

  // 1) measured performance for every idea that has metrics
  const perf = new Map();
  for (const idea of list) {
    if (idea.metrics) {
      const p = performanceScore(idea.metrics, baselines);
      if (p !== null) perf.set(idea.id, p);
    }
  }

  // 2) cluster stats over PRODUCED ideas that have a performance reading
  const clusterPerf = new Map(); // dim value → [perf, …]
  const allPerf = [];
  for (const idea of list) {
    if (idea.status === "produced" && perf.has(idea.id)) {
      const p = perf.get(idea.id);
      allPerf.push(p);
      const key = idea[clusterDim];
      if (key != null) (clusterPerf.get(key) || clusterPerf.set(key, []).get(key)).push(p);
    }
  }
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const globalMean = mean(allPerf);
  const clusterMean = new Map([...clusterPerf].map(([k, v]) => [k, mean(v)]));

  // 3) per-idea adjusted score
  for (const idea of list) {
    const base = idea.score;
    let adjusted = base;
    if (idea.status === "produced" && perf.has(idea.id)) {
      idea.performance = perf.get(idea.id);
      adjusted = (1 - producedWeight) * base + producedWeight * idea.performance;
    } else if (globalMean !== null && clusterMean.has(idea[clusterDim])) {
      const delta = clamp((clusterMean.get(idea[clusterDim]) - globalMean) * clusterGain, -maxClusterNudge, maxClusterNudge);
      adjusted = base + delta;
    }
    const rounded = Math.round(clamp(adjusted, 0, 100));
    if (rounded !== base) idea.adjusted_score = rounded;
    else delete idea.adjusted_score; // no movement → keep the file clean + idempotent
  }

  // 4) re-sort by effective score (stable for ties to keep diffs minimal)
  list.sort((a, b) => effectiveScore(b) - effectiveScore(a));
  return { ...ideas, updated: now.toISOString().slice(0, 10), ideas: list };
}

// ── the catalog → ideas ──────────────────────────────────────────────────────

/**
 * The upload that stands for a produced idea: its folder's LONG video, else its Short (a Short-only
 * topic, or a long not uploaded yet). Long first because the idea's score predicts how a topic pulls
 * as a video, and Shorts' feed numbers are a different scale. null when nothing is mapped.
 */
export function uploadForIdea(idea, catalog) {
  const folder = idea?.produced_video_id;
  if (!folder) return null;
  const hits = Object.entries(catalog?.videos ?? {})
    .filter(([, v]) => v.content_key === folder || v.content_key === `${folder}/short`)
    .sort(([a], [b]) => a.localeCompare(b));
  const long = hits.find(([, v]) => v.content_key === folder && v.content_type === "long");
  const own = hits.find(([, v]) => v.content_key === folder);
  return (long ?? own ?? hits[0])?.[0] ?? null;
}

const IDEA_METRIC_FIELDS = ["views", "avg_view_seconds", "retention_pct", "subs_gained", "impressions", "ctr"];

/**
 * Every produced idea's metrics from the catalog, in the shape `applyMetrics` takes. An idea whose
 * upload has no views yet is left out (an empty reading must not drag its score down).
 * @returns {{ metricsByVideoId, videoIdByIdeaId }}
 */
export function ideaMetricsFromCatalog(ideas, catalog) {
  const metricsByVideoId = {};
  const videoIdByIdeaId = {};
  for (const idea of ideas?.ideas ?? []) {
    if (idea.status !== "produced") continue;
    const id = uploadForIdea(idea, catalog);
    const m = id ? catalog.videos[id].metrics : null;
    if (!m || typeof m.views !== "number") continue;
    const out = { fetched: m.fetched, youtube_video_id: id };
    for (const f of IDEA_METRIC_FIELDS) if (typeof m[f] === "number") out[f] = m[f];
    metricsByVideoId[id] = out;
    videoIdByIdeaId[idea.id] = id;
  }
  return { metricsByVideoId, videoIdByIdeaId };
}

/**
 * Steps 1–2 of the weekly run against injected clients (google.youtube v3 · youtubeAnalytics v2 ·
 * youtubereporting v1 · the OAuth2 client that signs report downloads): list every upload + playlist,
 * classify, fetch lifetime metrics and per-video traffic sources, merge into the catalog, auto-map
 * what the titles make certain, then pull reach. `yr` may be null (reach skipped, kept rows still
 * counted). Pure of fs.
 * @returns {Promise<{catalog, matched, unmatched, reach: {status, created, merged}}>}
 */
export async function runChannelSync({ catalog, yt, ya, yr = null, auth = null, candidates = [], now = new Date(), createJob = true } = {}) {
  const endDate = now.toISOString().slice(0, 10);
  const uploads = await listUploads(yt);
  const playlists = await listPlaylists(yt);
  const types = await contentTypes(ya, { endDate });
  const metrics = await videoMetrics(ya, { endDate });
  const traffic = {};
  for (const u of uploads) if (metrics[u.id]?.views) traffic[u.id] = await trafficSources(ya, u.id, { endDate });

  const merged = mergeCatalog(catalog, { uploads, playlists, types, metrics, traffic, now });
  const { catalog: mapped, matched, unmatched } = matchContentKeys(merged, candidates);
  if (!yr) return { catalog: applyReach(mapped), matched, unmatched, reach: { status: "skipped (no Reporting client)", created: false, merged: 0 } };
  const { catalog: withReach, status, created, merged: rows } = await syncReach(mapped, { yr, auth, now, createJob });
  return { catalog: withReach, matched, unmatched, reach: { status, created, merged: rows } };
}

// ── orchestration (the pre-catalog path, kept for callers) ───────────────────

/**
 * Resolve produced ideas → their uploaded YouTube video id by reading each video's publish.json.
 * `readPublish(producedVideoId)` returns the parsed publish.json (or null). Returns
 * { videoIdByIdeaId, ideaIdByVideoId } over ideas that are produced AND have a youtube_video_id.
 */
export function resolveProducedVideos(ideas, readPublish) {
  const videoIdByIdeaId = {};
  const ideaIdByVideoId = {};
  for (const idea of ideas?.ideas || []) {
    if (idea.status !== "produced" || !idea.produced_video_id) continue;
    const publish = readPublish(idea.produced_video_id);
    const vid = publish?.youtube_video_id;
    if (!vid) continue;
    videoIdByIdeaId[idea.id] = vid;
    ideaIdByVideoId[vid] = idea.id;
  }
  return { videoIdByIdeaId, ideaIdByVideoId };
}

/**
 * Full loop, pure of fs: resolve produced videos → fetch each one's analytics via `client` →
 * apply metrics → re-rank. `client` may be null (skip fetch, re-rank existing metrics only).
 * @returns { ideas, fetched: [{ideaId, videoId, metrics}], skipped: [...ideaId] }
 */
export async function runAnalyticsLoop({ ideas, client, readPublish, now = new Date(), fetchOpts = {}, rerankOpts = {} } = {}) {
  const { videoIdByIdeaId } = resolveProducedVideos(ideas, readPublish || (() => null));
  const metricsByVideoId = {};
  const fetched = [];
  const skipped = [];
  for (const [ideaId, videoId] of Object.entries(videoIdByIdeaId)) {
    if (!client) {
      skipped.push(ideaId);
      continue;
    }
    let data = null;
    try {
      data = await fetchVideoAnalytics({ client, videoId, ...fetchOpts });
    } catch (e) {
      console.warn(`  ! analytics ${videoId}: ${e.message}`);
    }
    if (!data) {
      skipped.push(ideaId);
      continue;
    }
    const metrics = toIdeaMetrics(parseAnalyticsRow(data), { now });
    metricsByVideoId[videoId] = metrics;
    fetched.push({ ideaId, videoId, metrics });
  }
  const withMetrics = applyMetrics(ideas, metricsByVideoId, videoIdByIdeaId);
  const reranked = rerankBank(withMetrics, { ...rerankOpts, now });
  return { ideas: reranked, fetched, skipped };
}

// ── CLI plumbing ─────────────────────────────────────────────────────────────

function loadConfig() {
  for (const name of ["config.json", "config.example.json"]) {
    const p = path.join(SHARED, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  return {};
}

function todayStr(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Live clients from the YouTube OAuth token, or null when the owner hasn't authorized yet. */
async function makeClients(config) {
  const { getAuthorizedClient } = await import("./auth.mjs");
  const yc = config.youtube || {};
  const clientSecretPath = process.env[yc.client_secret_path_env || "YOUTUBE_CLIENT_SECRET_PATH"];
  const tokenPath = process.env[yc.token_path_env || "YOUTUBE_TOKEN_PATH"];
  if (!clientSecretPath || !tokenPath) return null;
  const { client, authorized } = await getAuthorizedClient({ clientSecretPath, tokenPath });
  if (!authorized) return null;
  const { google } = await import("googleapis");
  return {
    auth: client,
    yt: google.youtube({ version: "v3", auth: client }),
    ya: google.youtubeAnalytics({ version: "v2", auth: client }),
    yr: google.youtubereporting({ version: "v1", auth: client }),
  };
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

/** `--map <ytId> <key|none>`: tie one upload to its folder by hand, and bind the ledger at once. */
function mapOne(argv, { dryRun }) {
  const at = argv.indexOf("--map");
  const [ytId, rawKey] = [argv[at + 1], argv[at + 2]];
  if (!ytId || !rawKey) throw new Error("usage: fetch-analytics.mjs --map <youtubeId> <content-key | none>");
  const catalog = setContentKey(loadCatalog(), ytId, rawKey === "none" ? null : rawKey);
  const { ledger, changed, bound } = bindYoutubeIds(loadLedger(), catalog);
  console.log(`${ytId} ("${catalog.videos[ytId].title}") → ${catalog.videos[ytId].content_key ?? "no folder (deliberate; never re-matched)"}`);
  for (const b of bound) console.log(`  ledger ${b.key}: youtube_video_id = ${b.id}`);
  if (dryRun) return console.log("--dry-run: nothing written.");
  saveCatalog(catalog);
  if (changed) saveLedger(ledger);
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  if (argv.includes("--map")) return mapOne(argv, { dryRun });

  const now = new Date();
  const config = loadConfig();
  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  let catalog = loadCatalog();
  const clients = await makeClients(config).catch((e) => {
    console.warn(`! YouTube auth unavailable: ${e.message}`);
    return null;
  });

  if (clients) {
    const contentDir = path.join(ROOT, config.paths?.content || "content");
    const sync = await runChannelSync({ catalog, ...clients, candidates: contentCandidates(contentDir), now, createJob: !dryRun });
    catalog = sync.catalog;
    const all = Object.values(catalog.videos);
    const count = (t) => all.filter((v) => v.content_type === t).length;
    console.log(`catalog: ${all.length} upload(s) — ${count("long")} long, ${count("short")} Shorts; ${Object.keys(catalog.playlists).length} playlist(s).`);
    for (const m of sync.matched) console.log(`  + mapped ${m.id} → ${m.key} (title ${m.score})`);
    if (sync.unmatched.length) {
      console.log(`  ${sync.unmatched.length} upload(s) not mapped to a folder — tie each one with --map <id> <key>:`);
      for (const u of sync.unmatched) {
        const guess = u.guess ? ` (closest: ${u.guess.key} @ ${u.guess.score})` : "";
        console.log(`    ${u.id} [${u.content_type ?? "type?"}] "${u.title}"${guess}`);
      }
    }
    console.log(`reach: ${sync.reach.status}${sync.reach.created ? " — job CREATED today" : ""}${sync.reach.merged ? ` · ${sync.reach.merged} row(s) merged` : ""}`);
    for (const w of reachWarnings(catalog)) console.warn(`  ! ${w}`);
  } else {
    console.warn("No YouTube client (set client_secret + run auth.mjs). Re-ranking from the catalog as it stands.");
  }

  const bound = bindYoutubeIds(loadLedger(), catalog);
  const snaps = takeDueSnapshots(bound.ledger, catalog, { now });
  for (const b of bound.bound) console.log(`ledger ${b.key}: youtube_video_id = ${b.id}`);
  for (const c of bound.conflicts) console.warn(`! ledger ${c.key} holds ${c.has}, but the catalog maps ${c.catalog} there — left alone`);
  for (const t of snaps.taken) console.log(`ledger ${t.key}: snapshot taken (${t.at})`);

  const { metricsByVideoId, videoIdByIdeaId } = ideaMetricsFromCatalog(ideas, catalog);
  const updated = rerankBank(applyMetrics(ideas, metricsByVideoId, videoIdByIdeaId), { now });
  console.log(`ideas: metrics for ${Object.keys(videoIdByIdeaId).length} produced idea(s).`);
  console.log("top of the re-ranked bank:");
  for (const idea of updated.ideas.filter((i) => i.status === "backlog").slice(0, 8)) {
    const eff = effectiveScore(idea);
    const tag = idea.adjusted_score != null ? ` (was ${idea.score})` : "";
    console.log(`  [${eff}${tag}] ${idea.title}`);
  }
  const { valid, errors } = validate(updated, "ideas");
  if (!valid) throw new Error(`ideas.json invalid after re-rank: ${JSON.stringify(errors)}`);

  const report = reportMarkdown(playlistReport(catalog, { now }), { catalog, now });
  if (dryRun) {
    console.log("\n" + report + "\n--dry-run: nothing written.");
    return;
  }
  if (clients) saveCatalog(catalog, { now });
  const ledgerMoved = bound.changed || snaps.changed;
  if (ledgerMoved) saveLedger(snaps.ledger, { now });
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(updated, null, 2) + "\n");
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\nwrote ${[clients && "pipeline/state/youtube.json", ledgerMoved && "pipeline/state/videos.json", rel(IDEAS_PATH), rel(REPORT_PATH)].filter(Boolean).join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (await import("../shared/lib/load-env.mjs")).loadEnv(); // .env secrets (YOUTUBE_*) before the analytics call
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
