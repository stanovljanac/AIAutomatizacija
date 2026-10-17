// 3E (D-073) — the playlist test: the four measures per playlist × content type, the "too few
// videos" flag, the 8–10-week review window, and the rendered report.
import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyCatalog } from "./youtube-catalog.mjs";
import { MIN_VIDEOS, NO_PLAYLIST, measure, playlistReport, reportMarkdown, testWindow } from "./playlist-report.mjs";

const vid = (content_type, metrics) => ({ title: "t", published_at: "2026-09-01", content_type, content_key: null, metrics: { fetched: "2026-10-17", ...metrics } });

const catalog = () => ({
  ...emptyCatalog(),
  playlist_test: { started: "2026-10-17" },
  playlists: {
    PL1: { title: "Desk Lessons", video_ids: ["L1", "L2", "L3", "S1"] },
    PL2: { title: "Desk News", video_ids: ["L3"] },
  },
  videos: {
    L1: vid("long", { views: 100, retention_pct: 50, impressions: 1000, ctr: 0.05, subs_gained: 2, traffic: { YT_SEARCH: 10, RELATED_VIDEO: 5, SUBSCRIBER: 20 } }),
    L2: vid("long", { views: 300, retention_pct: 30, impressions: 3000, ctr: 0.03, subs_gained: 1, traffic: { RELATED_VIDEO: 30 } }),
    L3: vid("long", { views: 0 }),
    S1: vid("short", { views: 250, retention_pct: 88, subs_gained: 1, traffic: { SHORTS: 240 } }),
    LOOSE: vid("short", { views: 50 }),
    UNTYPED: { title: "private", published_at: "2026-10-17", content_type: null, content_key: null },
  },
});

test("measure weights retention by views and CTR by impressions", () => {
  const c = catalog();
  const m = measure([c.videos.L1, c.videos.L2]);
  assert.equal(m.videos, 2);
  assert.equal(m.views, 400);
  assert.equal(m.impressions, 4000);
  assert.ok(Math.abs(m.ctr - 0.035) < 1e-12, "(50 + 90) / 4000");
  assert.equal(m.retention_pct, 35, "(100·50 + 300·30) / 400");
  assert.equal(m.discovery_views, 45, "search + suggested only");
  assert.equal(m.discovery_share, 45 / 400);
  assert.equal(m.subs_per_1000, 7.5);
  assert.equal(m.enough, false, `< ${MIN_VIDEOS} videos`);
});

test("measure on zero views reports gaps, not zeros or NaN", () => {
  const m = measure([vid("long", { views: 0 })]);
  assert.equal(m.ctr, null);
  assert.equal(m.retention_pct, null);
  assert.equal(m.subs_per_1000, null);
});

test("playlistReport splits long and Short, counts shared videos in both lists, buckets the loose ones", () => {
  const rows = playlistReport(catalog());
  const key = (r) => `${r.playlist}/${r.type}`;
  assert.deepEqual(rows.map(key), ["Desk Lessons/long", "Desk Lessons/short", "Desk News/long", `${NO_PLAYLIST}/short`]);
  const lessons = rows.find((r) => key(r) === "Desk Lessons/long");
  assert.equal(lessons.videos, 3);
  assert.equal(lessons.enough, true);
  assert.equal(rows.find((r) => key(r) === "Desk News/long").videos, 1);
  assert.ok(!rows.some((r) => r.type == null), "an unclassified upload has nothing to compare");
});

test("testWindow opens on the first fetch and reviews 8–10 weeks later", () => {
  assert.deepEqual(testWindow(catalog()), { started: "2026-10-17", reviewFrom: "2026-12-12", reviewTo: "2026-12-26" });
  assert.equal(testWindow(emptyCatalog()), null);
});

test("reportMarkdown renders both tables, flags thin playlists, and says when the review is due", () => {
  const c = catalog();
  const md = reportMarkdown(playlistReport(c), { catalog: c, now: new Date("2026-10-17T12:00:00Z") });
  assert.match(md, /^# Playlist test \(3E\)/);
  assert.match(md, /Compare the playlists between 2026-12-12 and 2026-12-26/);
  assert.doesNotMatch(md, /review is due/);
  assert.match(md, /\| Desk Lessons \| 3 \| 400 \| 4,000 \| 3\.5% \| 35% \| 45 \(11%\) \| 7\.5 \|/);
  assert.match(md, /Desk News _\(< 3 videos\)_/);
  assert.match(md, /## Shorts/);
  const due = reportMarkdown(playlistReport(c), { catalog: c, now: new Date("2026-12-13T12:00:00Z") });
  assert.match(due, /\*\*The review is due\.\*\*/);
});
