// 1A (D-073) — reach: the Reporting API job, CSV parsing, merging days without double-counting,
// impression-weighted CTR, and the two expected non-errors (API disabled · no report yet).
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertValid } from "../shared/testkit/index.mjs";
import { fakeReporting } from "../shared/testkit/youtube-fakes.mjs";
import { emptyCatalog } from "./youtube-catalog.mjs";
import {
  CTR_SCALE,
  REACH_REPORT_TYPE,
  aggregateReach,
  applyReach,
  ctrFraction,
  ensureReachJob,
  isApiDisabled,
  mergeReach,
  normalizeReportDate,
  parseReachCsv,
  pendingReports,
  reachWarnings,
  syncReach,
} from "./reach.mjs";

const NOW = new Date("2026-10-17T12:00:00Z");
const HEADER = "date,channel_id,video_id,video_thumbnail_impressions,video_thumbnail_impressions_ctr";

const catalogWith = (ids) => ({
  ...emptyCatalog({ now: NOW }),
  videos: Object.fromEntries(ids.map((id) => [id, { title: id, published_at: "2026-10-01", content_type: "long", content_key: null, metrics: { fetched: "2026-10-17", views: 10 } }])),
});

test("the CTR column is read as a percentage, converted in one place", () => {
  assert.equal(CTR_SCALE, 100);
  assert.ok(Math.abs(ctrFraction(5.2) - 0.052) < 1e-12);
});

test("isApiDisabled recognises the Cloud project's 'not enabled' refusal, nothing else", () => {
  assert.ok(isApiDisabled(new Error("YouTube Reporting API has not been used in project 281348372291 before or it is disabled.")));
  assert.ok(isApiDisabled({ message: "x", errors: [{ reason: "accessNotConfigured" }] }));
  assert.equal(isApiDisabled(new Error("Request had insufficient authentication scopes.")), false);
  assert.equal(isApiDisabled(undefined), false);
});

test("ensureReachJob reuses the existing reach job and creates one only when missing", async () => {
  const has = fakeReporting({ jobs: [{ id: "j-other", reportTypeId: "channel_basic_a2" }, { id: "j-reach", reportTypeId: REACH_REPORT_TYPE }] });
  assert.deepEqual(await ensureReachJob(has.yr), { jobId: "j-reach", created: false });
  assert.equal(has.yr.calls.some(([n]) => n === "jobs.create"), false);

  const none = fakeReporting();
  assert.deepEqual(await ensureReachJob(none.yr, { create: false }), { jobId: null, created: false });
  const made = await ensureReachJob(none.yr);
  assert.equal(made.created, true);
  assert.equal(none.yr.state.jobs[0].reportTypeId, REACH_REPORT_TYPE);
  assert.deepEqual(await ensureReachJob(none.yr), { jobId: made.jobId, created: false }, "second call finds it");
});

test("pendingReports skips what was merged and orders by delivery (backfill last wins)", () => {
  const reports = [
    { id: "r3", createTime: "2026-10-20T00:00:00Z", startTime: "2026-10-15T07:00:00Z" },
    { id: "r1", createTime: "2026-10-18T00:00:00Z", startTime: "2026-10-16T07:00:00Z" },
    { id: "r2", createTime: "2026-10-18T00:00:00Z", startTime: "2026-10-15T07:00:00Z" },
    { id: "r0", createTime: "2026-10-17T00:00:00Z" },
  ];
  assert.deepEqual(pendingReports(reports, ["r0"]).map((r) => r.id), ["r2", "r1", "r3"]);
  assert.deepEqual(pendingReports(undefined, []), []);
});

test("normalizeReportDate accepts both date spellings", () => {
  assert.equal(normalizeReportDate("20261015"), "2026-10-15");
  assert.equal(normalizeReportDate("2026-10-15"), "2026-10-15");
  assert.equal(normalizeReportDate("15/10/2026"), null);
});

test("parseReachCsv finds the columns by the header row, in any order", () => {
  const csv = [
    "video_id,video_thumbnail_impressions_ctr,date,channel_id,video_thumbnail_impressions",
    "A,4.5,20261015,UC1,120",
    '"B","0",2026-10-15,"UC1","3"',
    "C,abc,20261015,UC1,notanumber",
    "",
  ].join("\r\n");
  assert.deepEqual(parseReachCsv(csv), [
    { date: "2026-10-15", video_id: "A", impressions: 120, ctr_raw: 4.5 },
    { date: "2026-10-15", video_id: "B", impressions: 3, ctr_raw: 0 },
  ]);
});

test("parseReachCsv: a header-only day is empty; a foreign report is refused", () => {
  assert.deepEqual(parseReachCsv(HEADER + "\n"), []);
  assert.deepEqual(parseReachCsv(""), []);
  assert.throws(() => parseReachCsv("date,video_id,views\n20261015,A,3"), /not a reach report header/);
});

test("mergeReach keys rows by day, counts orphans, and never re-lists a report", () => {
  const cat = catalogWith(["A"]);
  const rows = [
    { date: "2026-10-15", video_id: "A", impressions: 100, ctr_raw: 4 },
    { date: "2026-10-15", video_id: "NOT_IN_CATALOG", impressions: 9, ctr_raw: 1 },
  ];
  const once = mergeReach(cat, rows, "r1");
  assert.deepEqual(once.catalog.videos.A.reach_daily, { "2026-10-15": [100, 4] });
  assert.equal(once.merged, 1);
  assert.equal(once.orphans, 1);
  // a backfill re-delivers the same day with corrected numbers → it replaces, never adds
  const again = mergeReach(once.catalog, [{ date: "2026-10-15", video_id: "A", impressions: 110, ctr_raw: 5 }], "r1");
  assert.deepEqual(again.catalog.videos.A.reach_daily, { "2026-10-15": [110, 5] });
  assert.deepEqual(again.catalog.reach.ingested, ["r1"]);
  assert.equal(cat.videos.A.reach_daily, undefined, "pure: the input is untouched");
  assertValid(again.catalog, "youtube");
});

test("aggregateReach weights CTR by impressions", () => {
  // 100 impressions at 10% + 300 at 2% → 16 clicks / 400 = 4%
  assert.deepEqual(aggregateReach({ d1: [100, 10], d2: [300, 2] }), { impressions: 400, ctr: 0.04 });
  assert.deepEqual(aggregateReach({ d1: [0, 0] }), { impressions: 0 });
  assert.deepEqual(aggregateReach(), { impressions: 0 });
});

test("applyReach writes impressions + CTR into metrics, only where rows exist", () => {
  const cat = catalogWith(["A", "B"]);
  cat.videos.A.reach_daily = { "2026-10-15": [200, 5] };
  const out = applyReach(cat);
  assert.deepEqual(out.videos.A.metrics, { fetched: "2026-10-17", views: 10, impressions: 200, ctr: 0.05 });
  assert.equal(out.videos.B, cat.videos.B);
  assertValid(out, "youtube");
});

test("reachWarnings flags a CTR that looks 100x too small (the report may deliver fractions)", () => {
  const cat = catalogWith(["A"]);
  cat.videos.A.reach_daily = { d: [1000, 0.04] }; // 0.04 read as a percent = 0.04%
  const [w] = reachWarnings(cat);
  assert.match(w, /implausibly low/);
  assert.match(w, /CTR_SCALE = 1/);
  cat.videos.A.reach_daily = { d: [1000, 4] };
  assert.deepEqual(reachWarnings(cat), []);
  cat.videos.A.reach_daily = { d: [100, 0.04] };
  assert.deepEqual(reachWarnings(cat), [], "too few impressions to judge");
});

test("syncReach creates the job, merges every new report once, and aggregates", async () => {
  const { yr, auth } = fakeReporting({
    reports: [
      { id: "r1", createTime: "2026-10-18T00:00:00Z", csv: `${HEADER}\n20261016,UC1,A,100,4` },
      { id: "r2", createTime: "2026-10-19T00:00:00Z", csv: `${HEADER}\n20261017,UC1,A,300,8\n20261017,UC1,B,50,2` },
    ],
  });
  const first = await syncReach(catalogWith(["A", "B"]), { yr, auth, now: NOW });
  assert.equal(first.created, true);
  assert.equal(first.status, "ok");
  assert.equal(first.merged, 3);
  assert.equal(first.catalog.reach.job_created, "2026-10-17");
  assert.deepEqual(first.catalog.reach.ingested, ["r1", "r2"]);
  assert.deepEqual(first.catalog.videos.A.metrics, { fetched: "2026-10-17", views: 10, impressions: 400, ctr: 0.07 });
  assertValid(first.catalog, "youtube");

  const second = await syncReach(first.catalog, { yr, auth, now: new Date("2026-10-24T12:00:00Z") });
  assert.equal(second.created, false);
  assert.equal(second.merged, 0, "nothing downloaded twice");
  assert.equal(second.catalog.reach.job_created, "2026-10-17", "the creation date is kept");
  assert.deepEqual(second.catalog.videos.A.metrics, first.catalog.videos.A.metrics);
});

test("syncReach with createJob:false (a dry run) never creates the job", async () => {
  const { yr, auth } = fakeReporting();
  const out = await syncReach(catalogWith(["A"]), { yr, auth, now: NOW, createJob: false });
  assert.match(out.status, /no reach job yet/);
  assert.equal(yr.calls.some(([n]) => n === "jobs.create"), false);
  assert.equal(out.catalog.reach.job_id, null);
});

test("syncReach right after the job is created waits for the first report", async () => {
  const { yr, auth } = fakeReporting();
  const out = await syncReach(catalogWith(["A"]), { yr, auth, now: NOW });
  assert.match(out.status, /waiting for the first report/);
  assert.equal(out.catalog.reach.job_id, "job-1");
});

test("syncReach with the API disabled says how to enable it and keeps the CTR already stored", async () => {
  const { yr, auth } = fakeReporting({ disabled: true });
  const cat = catalogWith(["A"]);
  cat.videos.A.reach_daily = { "2026-10-15": [200, 5] };
  const out = await syncReach(cat, { yr, auth, now: NOW });
  assert.match(out.status, /api disabled — enable the YouTube Reporting API: https:\/\/console\.developers\.google\.com/);
  assert.equal(out.catalog.reach.status, "api disabled");
  assert.equal(out.catalog.videos.A.metrics.ctr, 0.05);
  assertValid(out.catalog, "youtube");
});

test("syncReach does not swallow a real error", async () => {
  const { yr, auth } = fakeReporting();
  yr.jobs.list = async () => {
    throw new Error("Request had insufficient authentication scopes.");
  };
  await assert.rejects(syncReach(catalogWith(["A"]), { yr, auth, now: NOW }), /insufficient authentication scopes/);
});
