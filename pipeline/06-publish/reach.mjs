/**
 * reach.mjs — thumbnail impressions + CTR from the YouTube Reporting API (1A, D-073).
 *
 * The Analytics API we already query refuses `videoThumbnailImpressions` in every query shape, so
 * reach only exists as a BULK report: `channel_reach_basic_a1` (added 2026-01-15) — one CSV per day,
 * columns date · channel_id · video_id · video_thumbnail_impressions · video_thumbnail_impressions_ctr.
 * Mechanics that shape this module (developers.google.com/youtube/reporting/v1/reports):
 *  • a reporting JOB must exist first; the first report arrives within ~48h, plus a 30-day backfill;
 *  • reports EXPIRE (30 days for backfill, 60 for the rest) — so every daily row is copied into the
 *    catalog (`videos[].reach_daily`) and the report ids are remembered, never re-counted;
 *  • a backfill re-delivers a day under a new report id — reports are merged oldest-first, so the
 *    newer delivery of a day overwrites the older one;
 *  • the API must be ENABLED in the Google Cloud project (separately from the Data/Analytics APIs).
 *
 * CTR scale: the docs call the metric "the percentage of impressions…", and the YouTube APIs' other
 * percentage metrics are 0..100 (averageViewPercentage arrives as 30.61), so the raw value is read
 * as a percent. Rows are stored exactly as delivered and converted in ONE place (`ctrFraction`), and
 * `reachWarnings` flags a CTR that looks 100x too small — compare one video against Studio once the
 * first report lands.
 */

export const REACH_REPORT_TYPE = "channel_reach_basic_a1";
export const REACH_JOB_NAME = "automation-desk-reach";
export const ENABLE_URL = "https://console.developers.google.com/apis/api/youtubereporting.googleapis.com/overview";

/** The raw CTR column is a percentage (see the header): 5.2 → 0.052. */
export const CTR_SCALE = 100;
export const ctrFraction = (raw) => raw / CTR_SCALE;

/** Is this the Cloud project's "API not enabled" refusal (a setup step, not a bug)? */
export function isApiDisabled(err) {
  const text = [err?.message, ...(err?.errors ?? []).map((e) => `${e?.reason} ${e?.message}`)].join(" ");
  return /has not been used in project|it is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(text);
}

async function pages(call, key) {
  const out = [];
  let pageToken;
  do {
    const data = (await call(pageToken))?.data ?? {};
    out.push(...(data[key] ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

/**
 * Find the reach job, or create it once. `yr` = google.youtubereporting('v1').
 * @returns {Promise<{jobId: string|null, created: boolean}>}
 */
export async function ensureReachJob(yr, { create = true } = {}) {
  const jobs = await pages((pageToken) => yr.jobs.list({ pageToken }), "jobs");
  const job = jobs.find((j) => j.reportTypeId === REACH_REPORT_TYPE);
  if (job) return { jobId: job.id, created: false };
  if (!create) return { jobId: null, created: false };
  const res = await yr.jobs.create({ requestBody: { reportTypeId: REACH_REPORT_TYPE, name: REACH_JOB_NAME } });
  return { jobId: res?.data?.id ?? null, created: true };
}

/** Every report the job has produced so far: [{id, startTime, endTime, createTime, downloadUrl}]. */
export async function listReachReports(yr, jobId) {
  return pages((pageToken) => yr.jobs.reports.list({ jobId, pageToken }), "reports");
}

/** Reports not merged yet, oldest delivery first (so a backfill overwrites what it replaces). */
export function pendingReports(reports = [], ingested = []) {
  const done = new Set(ingested);
  return reports
    .filter((r) => r?.id && !done.has(r.id))
    .sort((a, b) => String(a.createTime).localeCompare(String(b.createTime)) || String(a.startTime).localeCompare(String(b.startTime)));
}

/** Download one report's CSV. `auth` = the authorized OAuth2 client (it signs the request). */
export async function downloadReport(auth, url) {
  const res = await auth.request({ url, responseType: "text" });
  return typeof res?.data === "string" ? res.data : String(res?.data ?? "");
}

/** "20261015" or "2026-10-15" → "2026-10-15"; anything else → null. */
export function normalizeReportDate(value) {
  const s = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const unquote = (s) => s.trim().replace(/^"(.*)"$/, "$1");

/**
 * Parse a reach CSV into [{date, video_id, impressions, ctr_raw}], finding the columns by the header
 * row (the docs say to — the column order is not a contract). A header-only file (a day with no
 * data) yields []. A header without the reach columns throws: that is a different report.
 */
export function parseReachCsv(text) {
  const lines = String(text ?? "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const header = lines[0].split(",").map(unquote);
  const at = (name) => header.indexOf(name);
  const cols = { date: at("date"), video: at("video_id"), imp: at("video_thumbnail_impressions"), ctr: at("video_thumbnail_impressions_ctr") };
  if (Object.values(cols).some((i) => i < 0)) throw new Error(`not a reach report header: ${lines[0]}`);
  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map(unquote);
    const date = normalizeReportDate(cells[cols.date]);
    const impressions = Number(cells[cols.imp]);
    const ctr = Number(cells[cols.ctr]);
    if (!date || !cells[cols.video] || !Number.isFinite(impressions)) continue;
    rows.push({ date, video_id: cells[cols.video], impressions, ctr_raw: Number.isFinite(ctr) ? ctr : 0 });
  }
  return rows;
}

/**
 * Merge one report's rows into the catalog (pure): `reach_daily[date] = [impressions, ctr_raw]` per
 * video, and the report id joins `reach.ingested`. Rows for an upload the catalog doesn't hold are
 * counted, not invented.
 * @returns {{catalog, merged: number, orphans: number}}
 */
export function mergeReach(catalog, rows = [], reportId) {
  const videos = { ...catalog.videos };
  let merged = 0;
  let orphans = 0;
  for (const r of rows) {
    const v = videos[r.video_id];
    if (!v) {
      orphans++;
      continue;
    }
    videos[r.video_id] = { ...v, reach_daily: { ...(v.reach_daily ?? {}), [r.date]: [r.impressions, r.ctr_raw] } };
    merged++;
  }
  const ingested = reportId && !catalog.reach.ingested.includes(reportId) ? [...catalog.reach.ingested, reportId] : catalog.reach.ingested;
  return { catalog: { ...catalog, videos, reach: { ...catalog.reach, ingested } }, merged, orphans };
}

/** Lifetime impressions + impression-weighted CTR (a fraction) from the daily rows. */
export function aggregateReach(reachDaily = {}) {
  let impressions = 0;
  let clicks = 0;
  for (const [imp, ctrRaw] of Object.values(reachDaily)) {
    impressions += imp;
    clicks += imp * ctrFraction(ctrRaw);
  }
  if (!impressions) return { impressions: 0 };
  return { impressions, ctr: Number((clicks / impressions).toFixed(4)) };
}

/** Put each video's aggregated reach into its `metrics` (pure; videos without rows are untouched). */
export function applyReach(catalog) {
  const videos = {};
  for (const [id, v] of Object.entries(catalog.videos)) {
    if (!v.reach_daily || !Object.keys(v.reach_daily).length || !v.metrics) {
      videos[id] = v;
      continue;
    }
    videos[id] = { ...v, metrics: { ...v.metrics, ...aggregateReach(v.reach_daily) } };
  }
  return { ...catalog, videos };
}

/**
 * Sanity checks a human should see. A channel-wide CTR under 0.3% over 500+ impressions is far below
 * anything YouTube shows in Studio — the likelier story is that the report delivers fractions, not
 * percentages (then CTR_SCALE must be 1).
 */
export function reachWarnings(catalog) {
  let impressions = 0;
  let clicks = 0;
  for (const v of Object.values(catalog.videos)) {
    const agg = aggregateReach(v.reach_daily ?? {});
    impressions += agg.impressions;
    clicks += (agg.ctr ?? 0) * agg.impressions;
  }
  if (impressions >= 500 && clicks / impressions < 0.003) {
    return [
      `channel CTR reads ${((clicks / impressions) * 100).toFixed(2)}% over ${impressions} impressions — ` +
        `implausibly low; check one video against Studio → Reach and, if Studio shows ~${((clicks / impressions) * 10000).toFixed(1)}%, set CTR_SCALE = 1 in reach.mjs.`,
    ];
  }
  return [];
}

/**
 * The whole reach step against live clients: ensure the job, merge every new report, aggregate.
 * Never throws for the two expected states (API not enabled yet · job just created, no report yet) —
 * it returns the catalog unchanged with a plain-words `status` instead.
 * @returns {Promise<{catalog, status: string, created: boolean, merged: number}>}
 */
export async function syncReach(catalog, { yr, auth, now = new Date(), createJob = true } = {}) {
  const today = now.toISOString().slice(0, 10);
  let out = catalog;
  try {
    const { jobId, created } = await ensureReachJob(yr, { create: createJob });
    if (!jobId) {
      const status = "no reach job yet (a dry run never creates one)";
      return { catalog: applyReach({ ...out, reach: { ...out.reach, status } }), status, created: false, merged: 0 };
    }
    out = { ...out, reach: { ...out.reach, job_id: jobId, job_created: created ? today : (out.reach.job_created ?? null) } };
    const reports = pendingReports(await listReachReports(yr, jobId), out.reach.ingested);
    let merged = 0;
    for (const report of reports) {
      const res = mergeReach(out, parseReachCsv(await downloadReport(auth, report.downloadUrl)), report.id);
      out = res.catalog;
      merged += res.merged;
    }
    const status = out.reach.ingested.length ? "ok" : "waiting for the first report (~48h after the job was created)";
    return { catalog: applyReach({ ...out, reach: { ...out.reach, status } }), status, created, merged };
  } catch (e) {
    if (!isApiDisabled(e)) throw e;
    const status = `api disabled — enable the YouTube Reporting API: ${ENABLE_URL}`;
    // The rows already kept still count: a week without the API must not wipe the CTR we have.
    return { catalog: applyReach({ ...out, reach: { ...out.reach, status: "api disabled" } }), status, created: false, merged: 0 };
  }
}
