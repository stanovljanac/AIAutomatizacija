// 1A (D-073) — the channel catalog: YouTube readers against fake clients, the pure merge, the
// content-folder candidates and the title matcher (confident matches only).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertValid, withTempDir } from "../shared/testkit/index.mjs";
import { fakeAnalytics, fakeYouTube } from "../shared/testkit/youtube-fakes.mjs";
import {
  contentCandidates,
  contentTypes,
  emptyCatalog,
  inferContentType,
  listPlaylists,
  listUploads,
  loadCatalog,
  matchContentKeys,
  mergeCatalog,
  parseIsoDuration,
  saveCatalog,
  setContentKey,
  tableRows,
  titleSimilarity,
  titleTokens,
  trafficSources,
  videoMetrics,
} from "./youtube-catalog.mjs";

const NOW = new Date("2026-10-17T12:00:00Z");

const UPLOADS = [
  { id: "LONG1", title: "Attention! It Doesn't Focus. It Spends", publishedAt: "2026-08-25T10:00:00Z", duration: "PT6M18S" },
  { id: "SHORT1", title: "53% of an AI's Attention Goes to a Meaningless Word #shorts #ai", publishedAt: "2026-08-25T11:00:00Z", duration: "PT57S" },
  { id: "LONG2", title: "This is how my AI Agent Sent 73 Emails Nobody Approved", publishedAt: "2026-10-17T17:52:00Z", duration: "PT3M27S", privacy: "private" },
];

// ── readers ──────────────────────────────────────────────────────────────────

test("parseIsoDuration reads YouTube's ISO-8601 durations", () => {
  assert.equal(parseIsoDuration("PT4M4S"), 244);
  assert.equal(parseIsoDuration("PT59S"), 59);
  assert.equal(parseIsoDuration("PT1H2M3S"), 3723);
  assert.equal(parseIsoDuration("P0D"), 0);
  assert.equal(parseIsoDuration("nonsense"), null);
  assert.equal(parseIsoDuration(undefined), null);
});

test("listUploads walks every page of the uploads playlist and keeps private uploads", async () => {
  const yt = fakeYouTube({ uploads: UPLOADS });
  const out = await listUploads(yt);
  assert.deepEqual(out.map((u) => u.id), ["LONG1", "SHORT1", "LONG2"]);
  assert.deepEqual(out[2], { id: "LONG2", title: UPLOADS[2].title, published_at: "2026-10-17", duration_seconds: 207, privacy: "private" });
  assert.equal(yt.calls.filter(([n]) => n === "playlistItems.list").length, 2, "3 ids at 2 per page = 2 pages");
});

test("listUploads fails loudly when the account has no channel", async () => {
  const yt = fakeYouTube();
  yt.channels.list = async () => ({ data: { items: [] } });
  await assert.rejects(listUploads(yt), /no channel uploads playlist/);
});

test("listPlaylists returns each playlist's title and every video id across pages", async () => {
  const yt = fakeYouTube({
    playlists: [
      { id: "PL1", title: "Desk Lessons", videoIds: ["LONG1", "SHORT1", "X"] },
      { id: "PL2", title: "Desk News", videoIds: [] },
      { id: "PL3", title: "Desk Loops", videoIds: ["LONG2"] },
    ],
  });
  const out = await listPlaylists(yt);
  assert.deepEqual(out, {
    PL1: { title: "Desk Lessons", video_ids: ["LONG1", "SHORT1", "X"] },
    PL2: { title: "Desk News", video_ids: [] },
    PL3: { title: "Desk Loops", video_ids: ["LONG2"] },
  });
});

test("tableRows maps an Analytics table by header name", () => {
  const rows = tableRows({ columnHeaders: [{ name: "video" }, { name: "views" }], rows: [["a", 3], ["b", 5]] });
  assert.deepEqual(rows, [{ video: "a", views: 3 }, { video: "b", views: 5 }]);
  assert.deepEqual(tableRows({}), []);
});

test("contentTypes asks once per creatorContentType (the API refuses video×type as dimensions)", async () => {
  const ya = fakeAnalytics({ types: { LONG1: "long", SHORT1: "short" }, metrics: { LONG1: { views: 17 }, SHORT1: { views: 9 } } });
  assert.deepEqual(await contentTypes(ya, { endDate: "2026-10-17" }), { SHORT1: "short", LONG1: "long" });
  assert.deepEqual(ya.calls.map((c) => c.filters), ["creatorContentType==shorts", "creatorContentType==videoOnDemand"]);
  assert.ok(ya.calls.every((c) => c.ids === "channel==MINE" && c.dimensions === "video"));
});

test("videoMetrics maps one query's columns to catalog names and drops absent values", async () => {
  const ya = fakeAnalytics({
    metrics: {
      LONG1: { views: 17, estimatedMinutesWatched: 40, averageViewDuration: 189, averageViewPercentage: 50.1, subscribersGained: 1 },
      SHORT1: { views: 9, estimatedMinutesWatched: 2 },
    },
  });
  const out = await videoMetrics(ya, { endDate: "2026-10-17" });
  assert.deepEqual(out.LONG1, { views: 17, watch_minutes: 40, avg_view_seconds: 189, retention_pct: 50.1, subs_gained: 1 });
  assert.deepEqual(out.SHORT1, { views: 9, watch_minutes: 2 });
  assert.equal(ya.calls.length, 1, "every video in ONE query");
});

test("trafficSources returns views per traffic source for one video", async () => {
  const ya = fakeAnalytics({ traffic: { SHORT1: { SHORTS: 244, YT_SEARCH: 3 } } });
  assert.deepEqual(await trafficSources(ya, "SHORT1"), { SHORTS: 244, YT_SEARCH: 3 });
  assert.equal(ya.calls[0].filters, "video==SHORT1");
});

// ── merge ────────────────────────────────────────────────────────────────────

const upload = (id, over = {}) => ({ id, title: `T ${id}`, published_at: "2026-08-25", duration_seconds: 378, privacy: "public", ...over });

test("inferContentType: past 3 minutes is long; under that only YouTube can tell", () => {
  assert.equal(inferContentType(207), "long");
  assert.equal(inferContentType(132), null, "024 was a 2:12 long video");
  assert.equal(inferContentType(null), null);
});

test("mergeCatalog refreshes what YouTube owns and keeps what only we know", () => {
  const prev = {
    ...emptyCatalog({ now: NOW }),
    playlist_test: { started: "2026-10-01" },
    videos: {
      LONG1: {
        title: "old title", published_at: "2026-08-25", content_type: "long", content_key: "023-attention", key_source: "manual",
        metrics: { fetched: "2026-10-01", views: 3, impressions: 40, ctr: 0.05 }, reach_daily: { "2026-09-30": [40, 5] },
      },
      GONE: { title: "deleted upload", published_at: "2026-06-01", content_type: "short", content_key: null },
    },
  };
  const next = mergeCatalog(prev, {
    uploads: [upload("LONG1", { title: "new title" }), upload("NEW", { duration_seconds: 59 })],
    playlists: { PL1: { title: "Desk Lessons", video_ids: ["LONG1"] } },
    types: { NEW: "short" },
    metrics: { LONG1: { views: 17 } },
    traffic: { LONG1: { YT_SEARCH: 2 }, NEW: {} },
    now: NOW,
  });
  const l = next.videos.LONG1;
  assert.equal(l.title, "new title");
  assert.equal(l.content_key, "023-attention");
  assert.equal(l.key_source, "manual");
  assert.deepEqual(l.reach_daily, { "2026-09-30": [40, 5] });
  assert.deepEqual(l.metrics, { fetched: "2026-10-17", views: 17, traffic: { YT_SEARCH: 2 } }, "reach is re-applied later, never carried stale");
  assert.equal(l.content_type, "long", "kept when the type query has no row for it");
  assert.equal(next.videos.NEW.content_type, "short");
  assert.equal(next.videos.NEW.metrics.traffic, undefined, "an empty traffic map is not written");
  assert.ok(next.videos.GONE, "a vanished upload keeps its record");
  assert.equal(next.fetched, "2026-10-17");
  assert.deepEqual(next.playlist_test, { started: "2026-10-01" }, "the test window opens once");
  assert.deepEqual(next.playlists, { PL1: { title: "Desk Lessons", video_ids: ["LONG1"] } });
  assertValid(next, "youtube");
});

test("mergeCatalog on an empty catalog opens the playlist test today and validates", () => {
  const next = mergeCatalog(null, { uploads: [upload("A")], now: NOW });
  assert.deepEqual(next.playlist_test, { started: "2026-10-17" });
  assert.equal(next.videos.A.content_type, "long", "378 s → long by length");
  assertValid(next, "youtube");
});

// ── titles + matching ────────────────────────────────────────────────────────

test("titleTokens drops hashtags, punctuation, stopwords and the ubiquitous 'ai'", () => {
  assert.deepEqual([...titleTokens("53% of an AI's Attention Goes to a Meaningless Word #shorts #ai")], ["53", "ais", "attention", "goes", "meaningless", "word"]);
  assert.equal(titleSimilarity("Never Trust the Green Checkmark #ai #shorts", "Never Trust the Green Checkmark"), 1);
  assert.equal(titleSimilarity("", "anything"), 0);
});

const CANDS = [
  { key: "023-attention", content_type: "long", titles: ["AI Attention: It Doesn't Focus. It Spends.", "AI Doesn't Focus. It Spends."] },
  { key: "023-attention/short", content_type: "short", titles: ["53% of an AI's Attention Goes to a Meaningless Word"] },
  { key: "025-always-on-agents", content_type: "long", titles: ["AI Agents Make Mistakes. One Line Makes Them Undoable.", "My AI Agent Sent 73 Emails Nobody Approved"] },
  { key: "024-frozen", content_type: "long", titles: ["Correcting Your AI Teaches It Nothing"] },
];

const catalogOf = (videos) => ({ ...emptyCatalog({ now: NOW }), videos });

test("matchContentKeys maps only confident, same-type title matches", () => {
  const cat = catalogOf({
    LONG1: { title: "Attention! It Doesn't Focus. It Spends", published_at: "2026-08-25", content_type: "long", content_key: null },
    SHORT1: { title: "53% of an AI's Attention Goes to a Meaningless Word #shorts", published_at: "2026-08-25", content_type: "short", content_key: null },
    LONG2: { title: "This is how my AI Agent Sent 73 Emails Nobody Approved", published_at: "2026-10-17", content_type: "long", content_key: null },
    UNKNOWN: { title: "Something unrelated entirely", published_at: "2026-10-17", content_type: "long", content_key: null },
  });
  const { catalog, matched, unmatched } = matchContentKeys(cat, CANDS);
  assert.deepEqual(matched.map((m) => [m.id, m.key]), [["LONG1", "023-attention"], ["SHORT1", "023-attention/short"], ["LONG2", "025-always-on-agents"]]);
  assert.equal(catalog.videos.LONG1.key_source, "title");
  assert.deepEqual(unmatched.map((u) => u.id), ["UNKNOWN"]);
  assertValid(catalog, "youtube");
});

test("matchContentKeys never maps a Short onto a long folder, an untyped upload, or a taken key", () => {
  const cat = catalogOf({
    S: { title: "Attention! It Doesn't Focus. It Spends", published_at: "2026-08-25", content_type: "short", content_key: null },
    T: { title: "Correcting Your AI Teaches It Nothing", published_at: "2026-10-09", content_type: null, content_key: null },
    HELD: { title: "x", published_at: "2026-10-01", content_type: "long", content_key: "025-always-on-agents", key_source: "manual" },
    L: { title: "My AI Agent Sent 73 Emails Nobody Approved", published_at: "2026-10-17", content_type: "long", content_key: null },
  });
  const { matched, unmatched, catalog } = matchContentKeys(cat, CANDS);
  assert.deepEqual(matched, []);
  assert.deepEqual(unmatched.map((u) => u.id).sort(), ["L", "S", "T"]);
  assert.equal(catalog.videos.HELD.content_key, "025-always-on-agents", "a manual key is never touched");
  assert.equal(unmatched.find((u) => u.id === "T").guess.key, "024-frozen", "an untyped upload still gets a guess for --map");
});

test("matchContentKeys leaves a tie unmatched (a wrong mapping is worse than none)", () => {
  const cat = catalogOf({ A: { title: "Invoice reminders", published_at: "2026-10-01", content_type: "long", content_key: null } });
  const tie = [
    { key: "030-a", content_type: "long", titles: ["Invoice reminders"] },
    { key: "031-b", content_type: "long", titles: ["Invoice reminders"] },
  ];
  assert.deepEqual(matchContentKeys(cat, tie).matched, []);
});

test("matchContentKeys is idempotent: a second pass maps nothing new", () => {
  const cat = catalogOf({ LONG1: { title: "Attention! It Doesn't Focus. It Spends", published_at: "2026-08-25", content_type: "long", content_key: null } });
  const once = matchContentKeys(cat, CANDS).catalog;
  const twice = matchContentKeys(once, CANDS);
  assert.deepEqual(twice.matched, []);
  assert.equal(twice.catalog, once, "nothing moved → the same object back");
});

test("setContentKey maps by hand, refuses a stolen or malformed key, and unmaps", () => {
  const cat = catalogOf({
    A: { title: "a", published_at: "2026-01-01", content_type: "long", content_key: "021-what-is-a-token" },
    B: { title: "b", published_at: "2026-01-02", content_type: "short", content_key: null },
  });
  const mapped = setContentKey(cat, "B", "021-what-is-a-token/short");
  assert.deepEqual(mapped.videos.B, { title: "b", published_at: "2026-01-02", content_type: "short", content_key: "021-what-is-a-token/short", key_source: "manual" });
  assert.throws(() => setContentKey(cat, "B", "021-what-is-a-token"), /already belongs to A/);
  assert.throws(() => setContentKey(cat, "B", "Not A Key"), /not a content key/);
  assert.throws(() => setContentKey(cat, "ZZZ", "021-what-is-a-token/short"), /no upload "ZZZ"/);
  const unmapped = setContentKey(mapped, "B", null);
  assert.equal(unmapped.videos.B.content_key, null);
  assert.equal(unmapped.videos.B.key_source, "none");
  assertValid(unmapped, "youtube");
});

test("a deliberately folder-less upload is neither auto-matched nor reported again", () => {
  const cat = setContentKey(
    catalogOf({ S: { title: "53% of an AI's Attention Goes to a Meaningless Word", published_at: "2026-08-25", content_type: "short", content_key: null } }),
    "S",
    null
  );
  const { matched, unmatched } = matchContentKeys(cat, CANDS);
  assert.deepEqual(matched, []);
  assert.deepEqual(unmatched, []);
});

// ── content folders ──────────────────────────────────────────────────────────

function writeJson(dir, rel, doc) {
  const p = path.join(dir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc));
}

test("contentCandidates gives each folder the keys the ledger would give it", async () => {
  await withTempDir((dir) => {
    // long+short with the Short packaged inside the long's publish.json
    writeJson(dir, "023-attention/brief.json", { format: "long+short", title_working: "AI Doesn't Focus. It Spends." });
    writeJson(dir, "023-attention/publish.json", { title_options: ["AI Attention: It Doesn't Focus. It Spends."], chosen_title: null, short: { title: "53% of attention" } });
    fs.mkdirSync(path.join(dir, "023-attention", "short"));
    // Short-only, package at the folder
    writeJson(dir, "013-fail-loud/brief.json", { format: "short", title_working: "Never Trust the Green Checkmark" });
    writeJson(dir, "013-fail-loud/publish.json", { title_options: ["Never Trust the Green Checkmark"] });
    // Short-only, package under short/ (019, 020)
    writeJson(dir, "019-next-word-engine/brief.json", { format: "short", title_working: "AI is never unsure." });
    writeJson(dir, "019-next-word-engine/short/publish.json", { title_options: ["Why Does ChatGPT Sound So Confident"] });
    // legacy flat Short
    writeJson(dir, "002-short/script.json", { title_working: "What AI automation actually is (in 40 seconds)" });
    // a long with no publish yet, and the non-videos
    writeJson(dir, "010-point-of-trust/brief.json", { format: "long+short", title_working: "AI wrote the citations." });
    writeJson(dir, "004-hfproof/brief.json", { format: "long" });
    fs.mkdirSync(path.join(dir, "_TEMPLATE"));

    const out = contentCandidates(dir);
    const byKey = Object.fromEntries(out.map((c) => [c.key, c]));
    assert.deepEqual(Object.keys(byKey).sort(), ["002-short", "010-point-of-trust", "013-fail-loud", "019-next-word-engine/short", "023-attention", "023-attention/short"]);
    assert.equal(byKey["023-attention"].content_type, "long");
    assert.deepEqual(byKey["023-attention"].titles, ["AI Attention: It Doesn't Focus. It Spends.", "AI Doesn't Focus. It Spends."]);
    assert.deepEqual(byKey["023-attention/short"], { key: "023-attention/short", content_type: "short", titles: ["53% of attention"] });
    assert.equal(byKey["013-fail-loud"].content_type, "short");
    assert.ok(byKey["019-next-word-engine/short"].titles.includes("Why Does ChatGPT Sound So Confident"));
    assert.equal(byKey["002-short"].content_type, "short");
  });
});

test("contentCandidates on a missing folder is empty, not an error", () => {
  assert.deepEqual(contentCandidates(path.join("no", "such", "dir")), []);
});

// ── the file ─────────────────────────────────────────────────────────────────

test("saveCatalog validates first; loadCatalog round-trips and is loud on a broken file", async () => {
  await withTempDir((dir) => {
    const file = path.join(dir, "youtube.json");
    assert.deepEqual(loadCatalog(file).videos, {}, "missing → fresh");
    const cat = mergeCatalog(null, { uploads: [upload("A")], now: NOW });
    saveCatalog(cat, { filePath: file, now: NOW });
    assert.deepEqual(loadCatalog(file), { ...cat, updated: "2026-10-17" });
    assert.throws(() => saveCatalog({ ...cat, videos: { A: { title: 1 } } }, { filePath: file }), /refusing to write an invalid catalog/);
    fs.writeFileSync(file, "{ not json");
    assert.throws(() => loadCatalog(file), /not parseable JSON/);
  });
});
