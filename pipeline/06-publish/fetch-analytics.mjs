#!/usr/bin/env node
/**
 * fetch-analytics.mjs — the analytics loop (Wave 5, T5.2 · Phase B #4).
 *
 * Closes the growth loop: pull each PRODUCED video's real YouTube Analytics
 * (views / retention / CTR), write them into that idea's `metrics` in `ideas.json`,
 * then **re-rank the bank** so the next auto-pick prefers clusters that actually performed.
 *
 * Design (mirrors upload.mjs / build-metadata.mjs): the logic is PURE and testable; the only
 * network call goes through an injected YouTube Analytics client, so tests need no keys.
 *   • fetchVideoAnalytics({ client, videoId })  → one reports.query call
 *   • parseAnalyticsRow(response)               → robust column-name → value map
 *   • toIdeaMetrics(raw)                        → schema fields (views / avg_view_seconds / ctr / retention_pct)
 *   • applyMetrics(ideas, metricsByVideoId, …)  → fill produced ideas' metrics (idempotent)
 *   • performanceScore(metrics, baselines)      → 0..100 measured-performance signal
 *   • rerankBank(ideas, …)                      → effective `adjusted_score` + re-sort (idempotent)
 *
 * Idempotency: re-ranking always derives `adjusted_score` from the immutable predicted `score`
 * plus the (immutable for a run) metrics — never from the previous run's output — so running it
 * twice on the same stats leaves the bank unchanged.
 *
 *   node pipeline/06-publish/fetch-analytics.mjs            # fetch live, update + re-rank ideas.json
 *   node pipeline/06-publish/fetch-analytics.mjs --dry-run  # compute + print, write nothing
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../shared/lib/validate-lib.mjs";

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

// ── orchestration ────────────────────────────────────────────────────────────

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

/** Read content/<id>/publish.json for a produced idea. Fail-soft → null. */
function readPublishFromContent(config) {
  const contentDir = path.join(ROOT, config.paths?.content || "content");
  return (producedVideoId) => {
    const p = path.join(contentDir, producedVideoId, "publish.json");
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
  };
}

/** Build a live google.youtubeAnalytics('v2') client from the YouTube OAuth token (or null). */
async function makeAnalyticsClient(config) {
  const { getAuthorizedClient } = await import("./auth.mjs");
  const yc = config.youtube || {};
  const clientSecretPath = process.env[yc.client_secret_path_env || "YOUTUBE_CLIENT_SECRET_PATH"];
  const tokenPath = process.env[yc.token_path_env || "YOUTUBE_TOKEN_PATH"];
  if (!clientSecretPath || !tokenPath) return null;
  const { client, authorized } = await getAuthorizedClient({ clientSecretPath, tokenPath });
  if (!authorized) return null;
  const { google } = await import("googleapis");
  return google.youtubeAnalytics({ version: "v2", auth: client });
}

async function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const config = loadConfig();
  const ideas = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  const client = await makeAnalyticsClient(config).catch((e) => {
    console.warn(`! analytics auth unavailable: ${e.message}`);
    return null;
  });
  if (!client) {
    console.warn("No YouTube Analytics client (set client_secret + run auth.mjs). Re-ranking existing metrics only.");
  }

  const { ideas: updated, fetched, skipped } = await runAnalyticsLoop({
    ideas,
    client,
    readPublish: readPublishFromContent(config),
  });

  console.log(`fetched ${fetched.length} video(s); skipped ${skipped.length}.`);
  for (const f of fetched) {
    const m = f.metrics;
    console.log(`  ${f.ideaId} (${f.videoId}): views=${m.views ?? "?"} avd=${m.avg_view_seconds ?? "?"}s ret=${m.retention_pct ?? "?"}%`);
  }
  console.log("\ntop of the re-ranked bank:");
  for (const idea of updated.ideas.filter((i) => i.status === "backlog").slice(0, 8)) {
    const eff = effectiveScore(idea);
    const tag = idea.adjusted_score != null ? ` (was ${idea.score})` : "";
    console.log(`  [${eff}${tag}] ${idea.title}`);
  }

  const { valid, errors } = validate(updated, "ideas");
  if (!valid) throw new Error(`ideas.json invalid after re-rank: ${JSON.stringify(errors)}`);
  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    return;
  }
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log(`\nwrote ${path.relative(ROOT, IDEAS_PATH)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (await import("../shared/lib/load-env.mjs")).loadEnv(); // .env secrets (YOUTUBE_*) before the analytics call
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
