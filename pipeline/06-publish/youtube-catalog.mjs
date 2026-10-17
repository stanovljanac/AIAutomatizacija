/**
 * youtube-catalog.mjs — the channel catalog (1A, D-073).
 *
 * The analytics loop sat empty for months because it only knew a video's YouTube id when that id
 * was typed into the video's publish.json — and the owner uploads by hand (D-055), so 4 of 17 ledger
 * records ever got one. This module asks YouTube instead: every upload, its type (Short or long),
 * its playlists and its lifetime metrics, written to `pipeline/state/youtube.json` keyed by the
 * YouTube id. Each upload is then tied to the content folder it came from (`content_key`, the ledger
 * key shape), automatically when the title leaves no doubt, otherwise by hand (`--map`).
 *
 * Same split as the rest of 06-publish: pure logic first (testable with fake clients), the fs edge
 * at the bottom.
 *   listUploads / listPlaylists / contentTypes / videoMetrics / trafficSources   (injected clients)
 *   mergeCatalog(prev, fetched)        fresh YouTube facts + what we already knew → a new catalog
 *   contentCandidates(contentDir)      every content folder as {key, content_type, titles}
 *   matchContentKeys(catalog, cands)   confident title matches only; the rest is reported
 *   setContentKey(catalog, ytId, key)  the manual mapping (`fetch-analytics.mjs --map`)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { NON_VIDEOS, VIDEO_DIR_RE, readJsonSoft } from "../state/reconcile.mjs";
import { REACH_REPORT_TYPE } from "./reach.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
export const CATALOG_PATH = path.join(ROOT, "pipeline", "state", "youtube.json");
export const SCHEMA_VERSION = 1;

/** Analytics queries cover the channel's whole life; the API clips to what exists. */
export const LIFETIME_START = "2020-01-01";

const todayStr = (now = new Date()) => now.toISOString().slice(0, 10);

// ── the file ─────────────────────────────────────────────────────────────────

/** A fresh, schema-valid, empty catalog. */
export function emptyCatalog({ now = new Date() } = {}) {
  return {
    schema_version: SCHEMA_VERSION,
    updated: todayStr(now),
    fetched: null,
    playlists: {},
    reach: { report_type: REACH_REPORT_TYPE, job_id: null, job_created: null, ingested: [] },
    videos: {},
  };
}

/** Load the catalog: a missing file is a fresh one, a broken one is loud (it holds expired reach rows). */
export function loadCatalog(filePath = CATALOG_PATH) {
  if (!fs.existsSync(filePath)) return emptyCatalog();
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    throw new Error(`catalog ${filePath} is not parseable JSON: ${e.message}`);
  }
  const { valid, errors } = validate(catalog, "youtube");
  if (!valid) throw new Error(`catalog ${filePath} is invalid: ${formatErrors(errors)}`);
  return catalog;
}

/** Write the catalog, validating FIRST so an invalid document never reaches disk. */
export function saveCatalog(catalog, { filePath = CATALOG_PATH, now = new Date() } = {}) {
  const out = { ...catalog, schema_version: SCHEMA_VERSION, updated: todayStr(now) };
  const { valid, errors } = validate(out, "youtube");
  if (!valid) throw new Error(`refusing to write an invalid catalog: ${formatErrors(errors)}`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + "\n");
  return out;
}

// ── YouTube (injected clients) ───────────────────────────────────────────────

/** "PT4M4S" → 244 · "PT59S" → 59 · "P0D" → 0. null when unparseable. */
export function parseIsoDuration(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(iso ?? ""));
  if (!m) return null;
  const [, d = 0, h = 0, min = 0, s = 0] = m.map((x) => (x === undefined ? 0 : Number(x)));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** Every page of a list call. `call(pageToken)` returns the API response. */
async function allPages(call) {
  const items = [];
  let pageToken;
  do {
    const res = await call(pageToken);
    const data = res?.data ?? res ?? {};
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return items;
}

async function playlistVideoIds(yt, playlistId) {
  const items = await allPages((pageToken) =>
    yt.playlistItems.list({ playlistId, part: "contentDetails", maxResults: 50, pageToken })
  );
  return items.map((i) => i.contentDetails?.videoId).filter(Boolean);
}

/**
 * Every upload on the authorized channel (private ones included — the owner's token sees them).
 * `yt` = google.youtube('v3'). Returns [{id, title, published_at, duration_seconds, privacy}].
 */
export async function listUploads(yt) {
  const channel = (await yt.channels.list({ mine: true, part: "contentDetails" }))?.data?.items?.[0];
  const uploads = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("the authorized account has no channel uploads playlist");
  const ids = await playlistVideoIds(yt, uploads);
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await yt.videos.list({ id: ids.slice(i, i + 50).join(","), part: "snippet,contentDetails,status" });
    for (const v of res?.data?.items ?? []) {
      out.push({
        id: v.id,
        title: v.snippet?.title ?? "",
        published_at: String(v.snippet?.publishedAt ?? "").slice(0, 10),
        duration_seconds: parseIsoDuration(v.contentDetails?.duration),
        privacy: v.status?.privacyStatus ?? "unknown",
      });
    }
  }
  return out;
}

/** The channel's own playlists → { [playlistId]: {title, video_ids} }. */
export async function listPlaylists(yt) {
  const lists = await allPages((pageToken) =>
    yt.playlists.list({ mine: true, part: "snippet", maxResults: 50, pageToken })
  );
  const out = {};
  for (const p of lists) {
    out[p.id] = { title: p.snippet?.title ?? "", video_ids: await playlistVideoIds(yt, p.id) };
  }
  return out;
}

/** Map an Analytics result table to [{column: value}] rows, by header name (never by position). */
export function tableRows(data) {
  const headers = (data?.columnHeaders ?? []).map((h) => (typeof h === "string" ? h : h?.name));
  return (data?.rows ?? []).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}

const query = async (ya, params) => (await ya.reports.query({ ids: "channel==MINE", ...params }))?.data ?? {};

/**
 * Short or long, as YouTube classifies it. The API refuses `video,creatorContentType` as a pair of
 * dimensions, so it is one filtered query per type. A video with no views yet appears in neither.
 * `ya` = google.youtubeAnalytics('v2'). Returns { [ytId]: "short" | "long" }.
 */
export async function contentTypes(ya, { startDate = LIFETIME_START, endDate = todayStr() } = {}) {
  const out = {};
  for (const [type, filter] of [["short", "shorts"], ["long", "videoOnDemand"]]) {
    const data = await query(ya, {
      startDate, endDate, dimensions: "video", metrics: "views",
      filters: `creatorContentType==${filter}`, sort: "-views", maxResults: 200,
    });
    for (const r of tableRows(data)) out[r.video] = type;
  }
  return out;
}

export const VIDEO_METRICS = ["views", "estimatedMinutesWatched", "averageViewDuration", "averageViewPercentage", "subscribersGained"];

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : undefined);

/** Lifetime metrics for every video in ONE query → { [ytId]: {views, watch_minutes, …} }. */
export async function videoMetrics(ya, { startDate = LIFETIME_START, endDate = todayStr() } = {}) {
  const data = await query(ya, {
    startDate, endDate, dimensions: "video", metrics: VIDEO_METRICS.join(","), sort: "-views", maxResults: 200,
  });
  const out = {};
  for (const r of tableRows(data)) {
    const m = {
      views: num(r.views),
      watch_minutes: num(r.estimatedMinutesWatched),
      avg_view_seconds: num(r.averageViewDuration),
      retention_pct: num(r.averageViewPercentage),
      subs_gained: num(r.subscribersGained),
    };
    out[r.video] = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined));
  }
  return out;
}

/** Views by traffic source for ONE video → { SHORTS: n, YT_SEARCH: n, … }. */
export async function trafficSources(ya, videoId, { startDate = LIFETIME_START, endDate = todayStr() } = {}) {
  const data = await query(ya, {
    startDate, endDate, dimensions: "insightTrafficSourceType", metrics: "views", filters: `video==${videoId}`,
  });
  const out = {};
  for (const r of tableRows(data)) {
    const v = num(r.views);
    if (r.insightTrafficSourceType && v !== undefined) out[r.insightTrafficSourceType] = v;
  }
  return out;
}

// ── merge (pure) ─────────────────────────────────────────────────────────────

/** Past 3 minutes it can't be a Short; under that, only YouTube's own classification decides. */
export function inferContentType(durationSeconds) {
  return typeof durationSeconds === "number" && durationSeconds > 180 ? "long" : null;
}

/**
 * Fold one live fetch into the catalog. What YouTube owns (title, privacy, type, playlists,
 * metrics) is refreshed; what only WE know is kept: the content_key mapping and the reach rows.
 * An upload that vanished from YouTube keeps its record — its history is still ours.
 */
export function mergeCatalog(prev, { uploads = [], playlists = {}, types = {}, metrics = {}, traffic = {}, now = new Date() } = {}) {
  const base = prev ?? emptyCatalog({ now });
  const fetched = todayStr(now);
  const videos = { ...base.videos };
  for (const u of uploads) {
    const old = base.videos?.[u.id];
    const rec = {
      title: u.title,
      published_at: u.published_at,
      duration_seconds: u.duration_seconds ?? null,
      privacy: u.privacy,
      content_type: types[u.id] ?? old?.content_type ?? inferContentType(u.duration_seconds),
      content_key: old?.content_key ?? null,
    };
    if (old?.key_source) rec.key_source = old.key_source;
    rec.metrics = { fetched, ...(metrics[u.id] ?? {}) };
    if (traffic[u.id] && Object.keys(traffic[u.id]).length) rec.metrics.traffic = traffic[u.id];
    if (old?.reach_daily) rec.reach_daily = old.reach_daily;
    videos[u.id] = rec;
  }
  return {
    ...base,
    fetched,
    playlist_test: base.playlist_test ?? { started: fetched },
    playlists,
    videos,
  };
}

// ── content folders → match candidates (fs edge) ─────────────────────────────

const titlesOf = (doc) => [doc?.chosen_title, ...(doc?.title_options ?? []), doc?.medium?.title, doc?.title_working];

/**
 * Every content folder as the uploads it can stand for: {key, content_type, titles}.
 *  • a long or long+short topic → `<folder>` (long) and, when it has a Short, `<folder>/short`;
 *  • a Short-only topic → `<folder>` (short), or `<folder>/short` when its package lives there
 *    (019, 020) — the same key the ledger gives it;
 *  • the two legacy flat Shorts (`002-short`, `003-short`) → themselves.
 * Titles are every name the video had locally; the owner may still rename it at upload.
 */
export function contentCandidates(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  const read = (...p) => readJsonSoft(path.join(contentDir, ...p));
  const out = [];
  const folders = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && VIDEO_DIR_RE.test(e.name) && !NON_VIDEOS.has(e.name))
    .map((e) => e.name)
    .sort();
  for (const folder of folders) {
    const brief = read(folder, "brief.json");
    const pub = read(folder, "publish.json") ?? read(folder, "publish.draft.json");
    const script = read(folder, "script.json");
    const shortPub = read(folder, "short", "publish.json");
    const shortScript = read(folder, "short", "script.json");
    const hasShortDir = fs.existsSync(path.join(contentDir, folder, "short"));
    const clean = (list) => [...new Set(list.filter((t) => typeof t === "string" && t.trim()))];

    if (!brief && /-short$/.test(folder)) {
      out.push({ key: folder, content_type: "short", titles: clean([script?.title_working]) });
      continue;
    }
    const shortTitles = clean([pub?.short?.title, ...titlesOf(shortPub), shortScript?.title_working]);
    if (brief?.format === "short") {
      const key = shortPub ? `${folder}/short` : folder;
      out.push({ key, content_type: "short", titles: clean([...titlesOf(pub), ...shortTitles, ...titlesOf(brief), script?.title_working]) });
      continue;
    }
    out.push({ key: folder, content_type: "long", titles: clean([...titlesOf(pub), ...titlesOf(brief), script?.title_working]) });
    if (hasShortDir || pub?.short) out.push({ key: `${folder}/short`, content_type: "short", titles: shortTitles });
  }
  return out;
}

// ── matching (pure) ──────────────────────────────────────────────────────────

// "ai" is in nearly every title we make, so it carries no signal; hashtags are channel boilerplate.
const STOPWORDS = new Set(
  ("a an the to of in on at by for from with as and or but it its is are was be can do does did not no " +
    "so up just i me my we our you your this that these those how why what when who it's ai shorts").split(" ")
);

/** Lower-cased content words of a title, hashtags and punctuation dropped. */
export function titleTokens(title) {
  return new Set(
    String(title ?? "")
      .toLowerCase()
      .replace(/#\S+/g, " ")
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOPWORDS.has(w))
  );
}

/** Jaccard overlap of two titles' content words, 0..1. */
export function titleSimilarity(a, b) {
  const A = titleTokens(a);
  const B = titleTokens(b);
  if (!A.size || !B.size) return 0;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

export const MATCH_THRESHOLD = 0.5;
export const MATCH_MARGIN = 0.15;

/**
 * Map unmapped uploads onto content folders — only when the title leaves no doubt: same type, best
 * similarity >= `threshold`, and ahead of the runner-up by `margin`. One folder key stands for one
 * upload, and a key someone set by hand (or a deliberate "none") is never touched. Everything else is reported (with its best
 * guess) for `--map`, because a wrong mapping would quietly put one video's numbers on another idea.
 * Oldest uploads first, so a re-upload can't steal its original's key.
 * @returns {{catalog, matched: Array<{id, key, score}>, unmatched: Array<{id, title, content_type, guess}>}}
 */
export function matchContentKeys(catalog, candidates = [], { threshold = MATCH_THRESHOLD, margin = MATCH_MARGIN } = {}) {
  const videos = { ...catalog.videos };
  const taken = new Set(Object.values(videos).map((v) => v.content_key).filter(Boolean));
  const matched = [];
  const unmatched = [];
  const order = Object.entries(videos)
    .filter(([, v]) => !v.content_key && v.key_source !== "none")
    .sort(([ia, a], [ib, b]) => String(a.published_at).localeCompare(String(b.published_at)) || ia.localeCompare(ib));
  for (const [id, v] of order) {
    const scored = candidates
      .filter((c) => !taken.has(c.key) && (v.content_type == null || c.content_type === v.content_type))
      .map((c) => ({ key: c.key, score: Math.max(0, ...c.titles.map((t) => titleSimilarity(v.title, t))) }))
      .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    const [best, second] = scored;
    const sure = best && v.content_type != null && best.score >= threshold && best.score - (second?.score ?? 0) >= margin;
    if (sure) {
      videos[id] = { ...v, content_key: best.key, key_source: "title" };
      taken.add(best.key);
      matched.push({ id, key: best.key, score: Number(best.score.toFixed(2)) });
    } else {
      unmatched.push({ id, title: v.title, content_type: v.content_type, guess: best ? { key: best.key, score: Number(best.score.toFixed(2)) } : null });
    }
  }
  return { catalog: matched.length ? { ...catalog, videos } : catalog, matched, unmatched };
}

/**
 * Map one upload to a content folder by hand (`--map <ytId> <key>`), or mark it as deliberately
 * folder-less (`key` = null → `key_source: "none"`: e.g. 007's second Short — a folder has one Short
 * slot). A "none" upload is never auto-matched or reported again; it still counts in the channel
 * and playlist numbers. Refuses an unknown upload, a malformed key, and a key another upload
 * already holds — moving a key is two explicit steps, never a silent steal.
 */
export function setContentKey(catalog, ytId, key) {
  const v = catalog?.videos?.[ytId];
  if (!v) throw new Error(`no upload "${ytId}" in the catalog — run fetch-analytics first`);
  if (key === null) {
    return { ...catalog, videos: { ...catalog.videos, [ytId]: { ...v, content_key: null, key_source: "none" } } };
  }
  if (!/^[0-9]{3}-[a-z0-9-]+(\/short)?$/.test(key)) throw new Error(`"${key}" is not a content key (e.g. 024-frozen or 024-frozen/short)`);
  const holder = Object.entries(catalog.videos).find(([id, other]) => id !== ytId && other.content_key === key);
  if (holder) throw new Error(`"${key}" already belongs to ${holder[0]} ("${holder[1].title}") — unmap it first (--map ${holder[0]} none)`);
  return { ...catalog, videos: { ...catalog.videos, [ytId]: { ...v, content_key: key, key_source: "manual" } } };
}
