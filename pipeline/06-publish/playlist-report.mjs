/**
 * playlist-report.mjs — the playlist test (3E, D-073).
 *
 * The channel keeps ALL its playlists; after 8–10 weeks, and with at least 3 videos in a playlist,
 * the playlists are compared on the same four measures, and the one that leads becomes the channel's
 * main promise (it gets the biggest share of videos; the others continue less often). This module
 * computes those measures from the channel catalog — pure — and renders the weekly report that
 * fetch-analytics.mjs writes to pipeline/state/playlist-report.md.
 *
 * The four measures (one table row per playlist × content type, because a Short's numbers are a
 * different scale from a long video's):
 *   • impressions + CTR        — does the topic and its package earn the click?  (Reporting API)
 *   • average retention        — view-weighted averageViewPercentage
 *   • search + suggested views — does the topic have demand beyond our own feed?
 *   • subscribers per 1,000 views — does this kind of video build an audience?
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addDays } from "../state/reconcile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
export const REPORT_PATH = path.join(ROOT, "pipeline", "state", "playlist-report.md");

export const REVIEW_WEEKS = [8, 10];
export const MIN_VIDEOS = 3;
/** Traffic that comes from outside our own feed: YouTube search and the suggested-videos rail. */
export const DISCOVERY_SOURCES = ["YT_SEARCH", "RELATED_VIDEO"];
export const NO_PLAYLIST = "(no playlist)";

/** The test window: opened on the first fetch, reviewed 8–10 weeks later. */
export function testWindow(catalog) {
  const started = catalog?.playlist_test?.started ?? null;
  if (!started) return null;
  return { started, reviewFrom: addDays(started, REVIEW_WEEKS[0] * 7), reviewTo: addDays(started, REVIEW_WEEKS[1] * 7) };
}

/** Aggregate one group of uploads (all one content type) into the four measures. */
export function measure(videos) {
  let views = 0;
  let impressions = 0;
  let clicks = 0;
  let retentionWeighted = 0;
  let discovery = 0;
  let subs = 0;
  for (const v of videos) {
    const m = v.metrics ?? {};
    const vv = m.views ?? 0;
    views += vv;
    if (typeof m.impressions === "number") {
      impressions += m.impressions;
      clicks += m.impressions * (m.ctr ?? 0);
    }
    if (typeof m.retention_pct === "number") retentionWeighted += vv * m.retention_pct;
    for (const s of DISCOVERY_SOURCES) discovery += m.traffic?.[s] ?? 0;
    subs += m.subs_gained ?? 0;
  }
  return {
    videos: videos.length,
    views,
    impressions,
    ctr: impressions ? clicks / impressions : null,
    retention_pct: views ? retentionWeighted / views : null,
    discovery_views: discovery,
    discovery_share: views ? discovery / views : null,
    subs_per_1000: views ? (subs / views) * 1000 : null,
    enough: videos.length >= MIN_VIDEOS,
  };
}

/**
 * One row per playlist × content type, plus a "(no playlist)" bucket for uploads that sit in none.
 * Uploads YouTube hasn't classified yet (no views) are left out — they have nothing to compare.
 */
export function playlistReport(catalog) {
  const groups = Object.entries(catalog?.playlists ?? {}).map(([id, p]) => ({ id, title: p.title, ids: p.video_ids }));
  const listed = new Set(groups.flatMap((g) => g.ids));
  const loose = Object.keys(catalog?.videos ?? {}).filter((id) => !listed.has(id));
  if (loose.length) groups.push({ id: null, title: NO_PLAYLIST, ids: loose });

  const rows = [];
  for (const g of groups) {
    for (const type of ["long", "short"]) {
      const videos = g.ids.map((id) => catalog.videos[id]).filter((v) => v && v.content_type === type && v.metrics);
      if (videos.length) rows.push({ playlist_id: g.id, playlist: g.title, type, ...measure(videos) });
    }
  }
  return rows.sort((a, b) => (a.playlist === NO_PLAYLIST) - (b.playlist === NO_PLAYLIST) || b.views - a.views);
}

const int = (n) => Math.round(n).toLocaleString("en-US");
const pct = (f, digits = 1) => (f == null ? "—" : `${(f * 100).toFixed(digits)}%`);

function table(rows) {
  const lines = [
    "| Playlist | Videos | Views | Impressions | CTR | Avg retention | Search + suggested | Subs / 1,000 views |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const r of rows) {
    const name = r.enough ? r.playlist : `${r.playlist} _(< ${MIN_VIDEOS} videos)_`;
    lines.push(
      `| ${name} | ${r.videos} | ${int(r.views)} | ${r.impressions ? int(r.impressions) : "—"} | ${pct(r.ctr)} | ` +
        `${r.retention_pct == null ? "—" : `${r.retention_pct.toFixed(0)}%`} | ${int(r.discovery_views)} (${pct(r.discovery_share, 0)}) | ` +
        `${r.subs_per_1000 == null ? "—" : r.subs_per_1000.toFixed(1)} |`
    );
  }
  return lines;
}

/** The weekly report as Markdown. */
export function reportMarkdown(rows, { catalog, now = new Date() } = {}) {
  const today = now.toISOString().slice(0, 10);
  const win = testWindow(catalog);
  const long = rows.filter((r) => r.type === "long");
  const short = rows.filter((r) => r.type === "short");
  const out = [
    "# Playlist test (3E)",
    "",
    `> Generated by \`pipeline/06-publish/fetch-analytics.mjs\` on ${today} — regenerated every run, do not edit.`,
    "",
  ];
  if (win) {
    const due = today >= win.reviewFrom ? " **The review is due.**" : "";
    out.push(
      `Test opened ${win.started}. Compare the playlists between ${win.reviewFrom} and ${win.reviewTo} (8–10 weeks), ` +
        `only those with at least ${MIN_VIDEOS} videos.${due} The leader gets the biggest share of videos; the others continue less often.`,
      ""
    );
  }
  out.push(
    `Lifetime numbers per video. Impressions and CTR cover only the days the YouTube Reporting API has delivered (reach: ${catalog?.reach?.status ?? "not started"}). ` +
      "A video in two playlists counts in both.",
    "",
    "## Long videos",
    "",
    ...(long.length ? table(long) : ["_No long videos with views yet._"]),
    "",
    "## Shorts",
    "",
    ...(short.length ? table(short) : ["_No Shorts with views yet._"]),
    ""
  );
  return out.join("\n");
}
