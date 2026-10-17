// 1A (D-073) — the weekly loop end to end against fake clients: catalog sync → reach → which
// upload stands for an idea → idea metrics → re-rank.
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertValid } from "../shared/testkit/index.mjs";
import { fakeAnalytics, fakeReporting, fakeYouTube } from "../shared/testkit/youtube-fakes.mjs";
import { emptyCatalog } from "./youtube-catalog.mjs";
import { applyMetrics, ideaMetricsFromCatalog, rerankBank, runChannelSync, uploadForIdea } from "./fetch-analytics.mjs";

const NOW = new Date("2026-10-17T12:00:00Z");
const HEADER = "date,channel_id,video_id,video_thumbnail_impressions,video_thumbnail_impressions_ctr";

const catalogOf = (videos) => ({ ...emptyCatalog({ now: NOW }), videos });
const v = (content_key, content_type, metrics = { fetched: "2026-10-17", views: 5 }) => ({ title: content_key ?? "x", published_at: "2026-10-01", content_type, content_key, metrics });

test("uploadForIdea prefers the topic's long video, else its Short", () => {
  const catalog = catalogOf({
    S23: v("023-attention/short", "short"),
    L23: v("023-attention", "long"),
    S11: v("011-read-my-inbox", "short"),
    S19: v("019-next-word-engine/short", "short"),
  });
  assert.equal(uploadForIdea({ produced_video_id: "023-attention" }, catalog), "L23");
  assert.equal(uploadForIdea({ produced_video_id: "011-read-my-inbox" }, catalog), "S11", "a Short-only topic keyed at the folder");
  assert.equal(uploadForIdea({ produced_video_id: "019-next-word-engine" }, catalog), "S19", "a Short-only topic keyed at /short");
  assert.equal(uploadForIdea({ produced_video_id: "030-nothing" }, catalog), null);
  assert.equal(uploadForIdea({}, catalog), null);
});

test("ideaMetricsFromCatalog fills produced ideas only, and only with a real reading", () => {
  const ideas = {
    ideas: [
      { id: "attention", status: "produced", produced_video_id: "023-attention" },
      { id: "no-views", status: "produced", produced_video_id: "024-frozen" },
      { id: "series", status: "backlog", produced_video_id: "014-worst-hour" },
    ],
  };
  const catalog = catalogOf({
    L23: v("023-attention", "long", { fetched: "2026-10-17", views: 17, retention_pct: 50, impressions: 400, ctr: 0.05, watch_minutes: 9, traffic: { YT_SEARCH: 1 } }),
    L24: v("024-frozen", "long", { fetched: "2026-10-17" }),
    S14: v("014-worst-hour", "short"),
  });
  const { metricsByVideoId, videoIdByIdeaId } = ideaMetricsFromCatalog(ideas, catalog);
  assert.deepEqual(videoIdByIdeaId, { attention: "L23" });
  assert.deepEqual(metricsByVideoId.L23, { fetched: "2026-10-17", youtube_video_id: "L23", views: 17, retention_pct: 50, impressions: 400, ctr: 0.05 });
});

test("runChannelSync builds the catalog from YouTube, auto-maps, pulls reach — and the bank re-ranks on it", async () => {
  const yt = fakeYouTube({
    uploads: [
      { id: "L23", title: "Attention! It Doesn't Focus. It Spends", publishedAt: "2026-08-25T10:00:00Z", duration: "PT6M18S" },
      { id: "S23", title: "53% of an AI's Attention Goes to a Meaningless Word #shorts", publishedAt: "2026-08-25T11:00:00Z", duration: "PT57S" },
      { id: "NEW", title: "A brand new private upload", publishedAt: "2026-10-17T17:00:00Z", duration: "PT59S", privacy: "private" },
    ],
    playlists: [{ id: "PL1", title: "Desk Lessons", videoIds: ["L23", "S23"] }],
  });
  const ya = fakeAnalytics({
    types: { L23: "long", S23: "short" },
    metrics: {
      L23: { views: 17, estimatedMinutesWatched: 53, averageViewDuration: 189, averageViewPercentage: 50.1, subscribersGained: 1 },
      S23: { views: 9, estimatedMinutesWatched: 2, averageViewDuration: 20, averageViewPercentage: 35, subscribersGained: 0 },
    },
    traffic: { L23: { YT_SEARCH: 3, SUBSCRIBER: 4 }, S23: { SHORTS: 9 } },
  });
  const { yr, auth } = fakeReporting({ reports: [{ id: "r1", createTime: "2026-10-18T00:00:00Z", csv: `${HEADER}\n20261016,UC1,L23,200,6` }] });
  const candidates = [
    { key: "023-attention", content_type: "long", titles: ["AI Attention: It Doesn't Focus. It Spends."] },
    { key: "023-attention/short", content_type: "short", titles: ["53% of an AI's Attention Goes to a Meaningless Word"] },
  ];

  const out = await runChannelSync({ catalog: emptyCatalog({ now: NOW }), yt, ya, yr, auth, candidates, now: NOW });
  assertValid(out.catalog, "youtube");
  assert.deepEqual(out.matched.map((m) => m.key), ["023-attention", "023-attention/short"]);
  assert.deepEqual(out.unmatched.map((u) => u.id), ["NEW"], "no views → no type → never auto-mapped");
  assert.equal(out.catalog.videos.NEW.content_type, null);
  assert.deepEqual(out.catalog.videos.L23.metrics, {
    fetched: "2026-10-17", views: 17, watch_minutes: 53, avg_view_seconds: 189, retention_pct: 50.1, subs_gained: 1,
    traffic: { YT_SEARCH: 3, SUBSCRIBER: 4 }, impressions: 200, ctr: 0.06,
  });
  assert.equal(out.reach.status, "ok");
  assert.equal(out.reach.created, true);
  assert.equal(ya.calls.filter((c) => c.dimensions === "insightTrafficSourceType").length, 2, "traffic only for uploads with views");

  const ideas = {
    updated: "2026-10-01",
    ideas: [
      { id: "desk-lessons-attention", title: "Attention", task: "other", archetype: "diagram", score: 70, status: "produced", produced_video_id: "023-attention" },
      { id: "backlog-one", title: "Next", task: "other", archetype: "diagram", score: 60, status: "backlog", produced_video_id: null },
    ],
  };
  const { metricsByVideoId, videoIdByIdeaId } = ideaMetricsFromCatalog(ideas, out.catalog);
  const ranked = rerankBank(applyMetrics(ideas, metricsByVideoId, videoIdByIdeaId), { now: NOW });
  assertValid(ranked, "ideas");
  const produced = ranked.ideas.find((i) => i.id === "desk-lessons-attention");
  assert.equal(produced.metrics.ctr, 0.06);
  assert.equal(produced.metrics.youtube_video_id, "L23");
  assert.equal(typeof produced.performance, "number");
});

test("runChannelSync without a Reporting client still counts the reach rows already kept", async () => {
  const yt = fakeYouTube({ uploads: [{ id: "L23", title: "x", publishedAt: "2026-08-25T10:00:00Z", duration: "PT6M18S" }] });
  const ya = fakeAnalytics({ types: { L23: "long" }, metrics: { L23: { views: 17 } } });
  const prev = catalogOf({ L23: { ...v("023-attention", "long"), reach_daily: { "2026-10-15": [100, 4] } } });
  const out = await runChannelSync({ catalog: prev, yt, ya, now: NOW });
  assert.match(out.reach.status, /skipped/);
  assert.equal(out.catalog.videos.L23.metrics.impressions, 100);
  assert.equal(out.catalog.videos.L23.metrics.ctr, 0.04);
  assert.equal(out.catalog.videos.L23.content_key, "023-attention", "a mapping survives the refresh");
});
