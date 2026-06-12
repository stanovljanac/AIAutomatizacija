// T5.2 — analytics loop: pure builders + re-rank, exercised with fake clients (no network/keys).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fetchVideoAnalytics,
  parseAnalyticsRow,
  toIdeaMetrics,
  applyMetrics,
  performanceScore,
  effectiveScore,
  rerankBank,
  resolveProducedVideos,
  runAnalyticsLoop,
  ANALYTICS_METRICS,
} from "./fetch-analytics.mjs";
import { validate } from "../shared/lib/validate-lib.mjs";

// A YouTube Analytics API response: columnHeaders + one row.
const analyticsResponse = (vals) => ({
  data: {
    columnHeaders: ANALYTICS_METRICS.map((name) => ({ name })),
    rows: [ANALYTICS_METRICS.map((name) => vals[name])],
  },
});

const bank = () => ({
  updated: "2026-06-01",
  ideas: [
    { id: "a-produced-strong", title: "A", task: "documents", archetype: "mini-demo", score: 80, status: "produced", produced_video_id: "010-a" },
    { id: "b-produced-weak", title: "B", task: "scheduling", archetype: "mini-demo", score: 80, status: "produced", produced_video_id: "011-b" },
    { id: "c-backlog-docs", title: "C", task: "documents", archetype: "ideas", score: 70, status: "backlog", produced_video_id: null },
    { id: "d-backlog-sched", title: "D", task: "scheduling", archetype: "ideas", score: 70, status: "backlog", produced_video_id: null },
    { id: "e-backlog-other", title: "E", task: "other", archetype: "ideas", score: 72, status: "backlog", produced_video_id: null },
  ],
});

// ── fetch (injected client) ──────────────────────────────────────────────────

test("fetchVideoAnalytics queries channel==MINE filtered by the video id and returns rows", async () => {
  let seen = null;
  const client = { reports: { query: async (p) => { seen = p; return analyticsResponse({ views: 1200, averageViewDuration: 180, averageViewPercentage: 50 }); } } };
  const data = await fetchVideoAnalytics({ client, videoId: "vid42" });
  assert.equal(seen.ids, "channel==MINE");
  assert.equal(seen.filters, "video==vid42");
  assert.equal(seen.metrics, "views,averageViewDuration,averageViewPercentage");
  assert.equal(data.rows[0][0], 1200);
});

test("fetchVideoAnalytics returns null on an empty rows payload (fail-soft)", async () => {
  const client = { reports: { query: async () => ({ data: { columnHeaders: [], rows: [] } }) } };
  assert.equal(await fetchVideoAnalytics({ client, videoId: "v" }), null);
});

test("fetchVideoAnalytics returns null when client or videoId is missing", async () => {
  assert.equal(await fetchVideoAnalytics({ client: null, videoId: "v" }), null);
  assert.equal(await fetchVideoAnalytics({ client: { reports: { query: async () => ({}) } }, videoId: "" }), null);
});

// ── parse + map ──────────────────────────────────────────────────────────────

test("parseAnalyticsRow maps by columnHeaders, not by position", () => {
  const data = { columnHeaders: [{ name: "averageViewPercentage" }, { name: "views" }], rows: [[55, 999]] };
  const raw = parseAnalyticsRow(data);
  assert.equal(raw.views, 999);
  assert.equal(raw.averageViewPercentage, 55);
});

test("parseAnalyticsRow returns {} for an empty/garbage payload", () => {
  assert.deepEqual(parseAnalyticsRow(null), {});
  assert.deepEqual(parseAnalyticsRow({ columnHeaders: [{ name: "views" }] }), {}); // no rows
});

test("toIdeaMetrics maps API names → schema fields and stamps fetched", () => {
  const m = toIdeaMetrics({ views: 1000, averageViewDuration: 150, averageViewPercentage: 42, cardClickRate: 0.05 }, { now: new Date("2026-06-12") });
  assert.equal(m.views, 1000);
  assert.equal(m.avg_view_seconds, 150);
  assert.equal(m.retention_pct, 42);
  assert.equal(m.ctr, 0.05);
  assert.equal(m.fetched, "2026-06-12");
  assert.deepEqual(validate({ updated: "2026-06-12", ideas: [{ id: "x", title: "x", task: "other", archetype: "ideas", score: 1, status: "produced", metrics: m }] }, "ideas").errors, []);
});

test("toIdeaMetrics omits absent fields (never fabricates a 0)", () => {
  const m = toIdeaMetrics({ views: 5 });
  assert.equal(m.views, 5);
  assert.equal("avg_view_seconds" in m, false);
  assert.equal("ctr" in m, false);
});

// ── apply ────────────────────────────────────────────────────────────────────

test("applyMetrics writes metrics onto matched produced ideas only; others untouched", () => {
  const out = applyMetrics(bank(), { vidA: { views: 9 } }, { "a-produced-strong": "vidA" });
  assert.equal(out.ideas.find((i) => i.id === "a-produced-strong").metrics.views, 9);
  assert.equal("metrics" in out.ideas.find((i) => i.id === "c-backlog-docs"), false);
});

test("applyMetrics is pure (does not mutate the input bank)", () => {
  const src = bank();
  applyMetrics(src, { vidA: { views: 9 } }, { "a-produced-strong": "vidA" });
  assert.equal("metrics" in src.ideas[0], false);
});

// ── performance score ────────────────────────────────────────────────────────

test("performanceScore: on-par metrics land near 50; strong above, weak below", () => {
  const onPar = performanceScore({ views: 5000, retention_pct: 45, ctr: 0.04 });
  assert.ok(onPar >= 45 && onPar <= 55, `on-par ~50, got ${onPar}`);
  const strong = performanceScore({ views: 50000, retention_pct: 80, ctr: 0.09 });
  const weak = performanceScore({ views: 100, retention_pct: 15, ctr: 0.01 });
  assert.ok(strong > onPar && onPar > weak, `${strong} > ${onPar} > ${weak}`);
});

test("performanceScore re-normalizes over present signals (missing ≠ 0) and is null with no signal", () => {
  // views-only, strong → should be well above 50 (not dragged down by absent retention/ctr).
  assert.ok(performanceScore({ views: 50000 }) > 60);
  assert.equal(performanceScore({}), null);
  assert.equal(performanceScore({ fetched: "2026-06-12" }), null);
});

test("performanceScore falls back to avg_view_seconds when retention_pct is absent", () => {
  const p = performanceScore({ avg_view_seconds: 162 }); // 162/360 = 0.45 ≈ on-par retention
  assert.ok(p >= 45 && p <= 55, `got ${p}`);
});

// ── rerank ───────────────────────────────────────────────────────────────────

test("rerankBank: a fake stats payload re-orders the bank (the T5.2 acceptance check)", () => {
  // documents cluster strongly outperforms scheduling → backlog docs (C) should overtake sched (D).
  const withMetrics = applyMetrics(
    bank(),
    { vidA: { views: 80000, retention_pct: 85, ctr: 0.1 }, vidB: { views: 50, retention_pct: 10, ctr: 0.005 } },
    { "a-produced-strong": "vidA", "b-produced-weak": "vidB" }
  );
  const before = withMetrics.ideas.map((i) => i.id);
  const reranked = rerankBank(withMetrics);
  const after = reranked.ideas.map((i) => i.id);
  assert.notDeepEqual(after, before, "order must change");

  const c = reranked.ideas.find((i) => i.id === "c-backlog-docs");
  const d = reranked.ideas.find((i) => i.id === "d-backlog-sched");
  assert.ok(effectiveScore(c) > 70, "docs backlog nudged UP by its strong cluster");
  assert.ok(effectiveScore(d) < 70, "scheduling backlog nudged DOWN by its weak cluster");
  assert.ok(after.indexOf("c-backlog-docs") < after.indexOf("d-backlog-sched"), "C now ranks above D");
});

test("rerankBank preserves the predicted score and only sets adjusted_score where it moves", () => {
  const withMetrics = applyMetrics(bank(), { vidA: { views: 80000, retention_pct: 85, ctr: 0.1 } }, { "a-produced-strong": "vidA" });
  const reranked = rerankBank(withMetrics);
  const a = reranked.ideas.find((i) => i.id === "a-produced-strong");
  assert.equal(a.score, 80, "predicted score is immutable");
  assert.ok(a.adjusted_score > 80, "produced strong performer blends upward");
  assert.equal(typeof a.performance, "number");
  // a backlog idea in a cluster with NO produced data gets no adjustment.
  const e = reranked.ideas.find((i) => i.id === "e-backlog-other");
  assert.equal("adjusted_score" in e, false);
});

test("rerankBank is idempotent — running twice yields the same bank", () => {
  const withMetrics = applyMetrics(
    bank(),
    { vidA: { views: 80000, retention_pct: 85, ctr: 0.1 }, vidB: { views: 50, retention_pct: 10, ctr: 0.005 } },
    { "a-produced-strong": "vidA", "b-produced-weak": "vidB" }
  );
  const once = rerankBank(withMetrics);
  const twice = rerankBank(once);
  assert.deepEqual(twice.ideas, once.ideas);
});

test("rerankBank output validates against ideas.schema", () => {
  const withMetrics = applyMetrics(bank(), { vidA: { views: 9000, retention_pct: 60, ctr: 0.05 } }, { "a-produced-strong": "vidA" });
  const reranked = rerankBank(withMetrics);
  const { valid, errors } = validate(reranked, "ideas");
  assert.ok(valid, JSON.stringify(errors));
});

// ── resolve + full loop ──────────────────────────────────────────────────────

test("resolveProducedVideos maps produced ideas → youtube_video_id via publish.json", () => {
  const readPublish = (vid) => (vid === "010-a" ? { youtube_video_id: "yt-a" } : null);
  const { videoIdByIdeaId, ideaIdByVideoId } = resolveProducedVideos(bank(), readPublish);
  assert.equal(videoIdByIdeaId["a-produced-strong"], "yt-a");
  assert.equal(ideaIdByVideoId["yt-a"], "a-produced-strong");
  assert.equal("b-produced-weak" in videoIdByIdeaId, false, "no publish.json id → skipped");
  assert.equal("c-backlog-docs" in videoIdByIdeaId, false, "backlog ideas are never resolved");
});

test("runAnalyticsLoop fetches per produced video, applies metrics, and re-ranks", async () => {
  const readPublish = (vid) => ({ "010-a": { youtube_video_id: "yt-a" }, "011-b": { youtube_video_id: "yt-b" } }[vid] || null);
  const byVid = {
    "yt-a": analyticsResponse({ views: 80000, averageViewDuration: 300, averageViewPercentage: 85 }),
    "yt-b": analyticsResponse({ views: 40, averageViewDuration: 30, averageViewPercentage: 9 }),
  };
  const client = { reports: { query: async (p) => byVid[p.filters.split("==")[1]] } };
  const { ideas, fetched, skipped } = await runAnalyticsLoop({ ideas: bank(), client, readPublish });

  assert.equal(fetched.length, 2);
  assert.equal(skipped.length, 0);
  assert.equal(ideas.ideas.find((i) => i.id === "a-produced-strong").metrics.views, 80000);
  assert.ok(validate(ideas, "ideas").valid);
  // strong-cluster backlog (docs C) ends up ranked above weak-cluster backlog (sched D).
  const order = ideas.ideas.map((i) => i.id);
  assert.ok(order.indexOf("c-backlog-docs") < order.indexOf("d-backlog-sched"));
});

test("runAnalyticsLoop with no client skips fetching but still re-ranks existing metrics", async () => {
  const seeded = applyMetrics(bank(), { yt: { views: 90000, retention_pct: 90, ctr: 0.12 } }, { "a-produced-strong": "yt" });
  const { fetched, skipped, ideas } = await runAnalyticsLoop({ ideas: seeded, client: null, readPublish: (v) => (v === "010-a" ? { youtube_video_id: "yt" } : null) });
  assert.equal(fetched.length, 0);
  assert.equal(skipped.length, 1);
  assert.ok(ideas.ideas.find((i) => i.id === "a-produced-strong").adjusted_score > 80, "re-rank still runs on seeded metrics");
});

test("runAnalyticsLoop is fail-soft when one video's query throws", async () => {
  const readPublish = (vid) => ({ "010-a": { youtube_video_id: "yt-a" }, "011-b": { youtube_video_id: "yt-b" } }[vid] || null);
  const client = {
    reports: {
      query: async (p) => {
        if (p.filters.endsWith("yt-b")) throw new Error("quota");
        return analyticsResponse({ views: 1000, averageViewDuration: 120, averageViewPercentage: 40 });
      },
    },
  };
  const { fetched, skipped } = await runAnalyticsLoop({ ideas: bank(), client, readPublish });
  assert.equal(fetched.length, 1);
  assert.deepEqual(skipped, ["b-produced-weak"]);
});

// ── [verifier] regression tests ───────────────────────────────────────────────

test("[verifier] rerankBank idempotency — three consecutive runs yield identical output", () => {
  // The author tests 2 runs; this confirms the 3rd run also does not drift.
  const withMetrics = applyMetrics(
    bank(),
    { vidA: { views: 80000, retention_pct: 85, ctr: 0.1 }, vidB: { views: 50, retention_pct: 10, ctr: 0.005 } },
    { "a-produced-strong": "vidA", "b-produced-weak": "vidB" }
  );
  const once = rerankBank(withMetrics);
  const twice = rerankBank(once);
  const thrice = rerankBank(twice);
  assert.deepEqual(thrice.ideas, once.ideas, "run 3 must equal run 1");
});

test("[verifier] rerankBank ignores a stale adjusted_score from a previous run — always derives from score", () => {
  // Inject a bank whose produced idea already carries an adjusted_score from a past run with
  // DIFFERENT metrics. The new run must derive from the immutable `score`, not from `adjusted_score`.
  const bankWithStale = {
    updated: "2026-06-01",
    ideas: [
      {
        id: "p1", title: "P1", task: "documents", archetype: "mini-demo", score: 70,
        adjusted_score: 95,          // stale — came from very high metrics in a prior run
        status: "produced",
        metrics: { views: 5000, retention_pct: 45, ctr: 0.04 },  // now on-par → performance ≈ 50
        produced_video_id: "v1",
      },
      { id: "b1", title: "B1", task: "documents", archetype: "ideas", score: 60, status: "backlog" },
    ],
  };
  const r = rerankBank(bankWithStale);
  const p1 = r.ideas.find((i) => i.id === "p1");
  // adjusted = 0.5*score(70) + 0.5*performance(≈50) ≈ 60 — nowhere near the stale 95
  assert.ok(p1.adjusted_score < 75, `adjusted_score ${p1.adjusted_score} should not be influenced by stale 95`);
  assert.equal(p1.score, 70, "immutable score must not change");
});

test("[verifier] parseAnalyticsRow handles string columnHeaders (not just object form)", () => {
  // The API sometimes returns plain strings instead of {name:string} objects.
  const data = {
    columnHeaders: ["averageViewPercentage", "views"],
    rows: [[55, 999]],
  };
  const raw = parseAnalyticsRow(data);
  assert.equal(raw.views, 999, "string header 'views' must be read correctly");
  assert.equal(raw.averageViewPercentage, 55, "string header 'averageViewPercentage' must be read correctly");
});

test("[verifier] parseAnalyticsRow — ragged row omits missing columns (does not fabricate undefined)", () => {
  // Row has fewer entries than headers; the missing position must be absent, not 0 or null.
  const data = {
    columnHeaders: [{ name: "views" }, { name: "averageViewDuration" }, { name: "averageViewPercentage" }],
    rows: [[1234, 90]],  // averageViewPercentage position is missing
  };
  const raw = parseAnalyticsRow(data);
  assert.equal(raw.views, 1234);
  assert.equal(raw.averageViewDuration, 90);
  assert.equal("averageViewPercentage" in raw, false, "missing row entry must not appear in output");
});

test("[verifier] parseAnalyticsRow — zero row value (0) is preserved, not treated as missing", () => {
  const data = {
    columnHeaders: [{ name: "views" }, { name: "averageViewPercentage" }],
    rows: [[0, 0]],
  };
  const raw = parseAnalyticsRow(data);
  assert.equal(raw.views, 0, "zero views must be preserved");
  assert.equal(raw.averageViewPercentage, 0, "zero retention must be preserved");
});

test("[verifier] toIdeaMetrics CTR fallback chain: annotationClickThroughRate > impressionsClickThroughRate", () => {
  // The author covers cardClickRate; this covers the two lower-priority fallbacks.
  const m1 = toIdeaMetrics({ annotationClickThroughRate: 0.03 });
  assert.equal(m1.ctr, 0.03, "annotationClickThroughRate must map to ctr");

  const m2 = toIdeaMetrics({ impressionsClickThroughRate: 0.05 });
  assert.equal(m2.ctr, 0.05, "impressionsClickThroughRate must map to ctr");

  // When both annotation and impressions are present, annotation wins.
  const m3 = toIdeaMetrics({ annotationClickThroughRate: 0.03, impressionsClickThroughRate: 0.05 });
  assert.equal(m3.ctr, 0.03, "annotationClickThroughRate must beat impressionsClickThroughRate");

  // cardClickRate = 0 (falsy but present) must NOT fall through to next value in the chain.
  const m4 = toIdeaMetrics({ cardClickRate: 0, impressionsClickThroughRate: 0.05 });
  assert.equal(m4.ctr, 0, "cardClickRate=0 must not fall through (??-chain skips only null/undefined)");
});

test("[verifier] cluster accumulation: two produced ideas in the same cluster both contribute to clusterMean", () => {
  // Two docs-cluster produced ideas: one strong (perf≈83) + one on-par (perf≈50) → clusterMean≈66.5.
  // The scheduling produced idea is very weak (perf≈10) → globalMean≈47.
  // clusterMean(66.5) >> globalMean(47) → delta ≈ +3.8 → b-docs backlog should be nudged UP to 64.
  // This also confirms the Map-accumulation idiom fires for the SECOND push to an existing key.
  const twoProduced = {
    updated: "2026-06-01",
    ideas: [
      { id: "p-docs-a", title: "PA", task: "documents", archetype: "mini-demo", score: 70, status: "produced",
        metrics: { views: 90000, retention_pct: 90 } },
      { id: "p-docs-b", title: "PB", task: "documents", archetype: "mini-demo", score: 70, status: "produced",
        metrics: { views: 5000, retention_pct: 45 } },
      { id: "p-sched", title: "PSc", task: "scheduling", archetype: "mini-demo", score: 70, status: "produced",
        metrics: { views: 10, retention_pct: 5 } },
      { id: "b-docs", title: "BD", task: "documents", archetype: "ideas", score: 60, status: "backlog" },
    ],
  };
  const r = rerankBank(twoProduced);
  const pA = r.ideas.find((i) => i.id === "p-docs-a");
  const pB = r.ideas.find((i) => i.id === "p-docs-b");

  // Both produced ideas must have independent performance scores
  assert.ok(pA.performance > pB.performance, "stronger video must have higher performance score");

  // The backlog docs idea must be nudged UP because docs clusterMean > globalMean
  const bDocs = r.ideas.find((i) => i.id === "b-docs");
  assert.ok(effectiveScore(bDocs) > 60, `docs backlog should be nudged UP; got effectiveScore=${effectiveScore(bDocs)}`);
});

test("[verifier] adjusted_score is clamped at 100 (cluster nudge cannot push a high-score idea above 100)", () => {
  // Two clusters; docs is very strong vs scheduling. A docs backlog idea starting at 97
  // would get a +6 nudge → 103 → must be clamped to 100.
  const bankHigh = {
    updated: "2026-06-01",
    ideas: [
      { id: "p-docs", title: "PD", task: "documents", archetype: "mini-demo", score: 80, status: "produced",
        metrics: { views: 999999, retention_pct: 100, ctr: 0.5 } },
      { id: "p-sched", title: "PS", task: "scheduling", archetype: "mini-demo", score: 80, status: "produced",
        metrics: { views: 1, retention_pct: 1, ctr: 0.001 } },
      { id: "b-high", title: "BH", task: "documents", archetype: "ideas", score: 97, status: "backlog" },
    ],
  };
  const r = rerankBank(bankHigh);
  const bHigh = r.ideas.find((i) => i.id === "b-high");
  assert.ok(effectiveScore(bHigh) <= 100, `adjusted_score must not exceed 100; got ${effectiveScore(bHigh)}`);

  const { valid, errors } = validate(r, "ideas");
  assert.ok(valid, `schema must be valid after clamping: ${JSON.stringify(errors)}`);
});

test("[verifier] adjusted_score is clamped at 0 (cluster nudge cannot push a low-score idea below 0)", () => {
  // Two clusters; scheduling is strong, docs is weak. A docs backlog at score=3 gets -6 → -3 → clamped to 0.
  const bankLow = {
    updated: "2026-06-01",
    ideas: [
      { id: "p-sched", title: "PS", task: "scheduling", archetype: "mini-demo", score: 5, status: "produced",
        metrics: { views: 999999, retention_pct: 100, ctr: 0.5 } },
      { id: "p-docs", title: "PD", task: "documents", archetype: "mini-demo", score: 5, status: "produced",
        metrics: { views: 1, retention_pct: 1, ctr: 0.001 } },
      { id: "b-low", title: "BL", task: "documents", archetype: "ideas", score: 3, status: "backlog" },
    ],
  };
  const r = rerankBank(bankLow);
  const bLow = r.ideas.find((i) => i.id === "b-low");
  assert.ok(effectiveScore(bLow) >= 0, `adjusted_score must not go below 0; got ${effectiveScore(bLow)}`);

  const { valid, errors } = validate(r, "ideas");
  assert.ok(valid, `schema must be valid after clamping: ${JSON.stringify(errors)}`);
});
