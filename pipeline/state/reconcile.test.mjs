// Session 2 of the lifecycle-ledger thread (D-062): the reconciler's PURE core.
// Every function is checked for the two invariants the turn-end hook depends on —
// IDEMPOTENT (run twice → no change) and FORWARD-ONLY (never demotes).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateFile, withTempDir } from "../shared/testkit/index.mjs";
import { emptyLedger, validateLedger } from "./ledger.mjs";
import {
  FIRST_SNAPSHOT_DAYS,
  NON_VIDEOS,
  addDays,
  applyPlan,
  baseVideoId,
  contentTypeFor,
  forwardStatus,
  ideaIdOf,
  ingestPublish,
  isLive,
  lessonOwed,
  owedLessons,
  parseArgs,
  planReconcile,
  projectIdeas,
  projectPublishStatus,
  projectSubjects,
  resolveFact,
  scanVideos,
  setLesson,
  stampLesson,
  statePaths,
  subjectOf,
  videoFolders,
} from "./reconcile.mjs";

const NOW = new Date("2026-07-25T09:00:00Z");
const LIVE_ID = "020-everyone-asks-clean-data";
const OLD_ID = "019-next-word-engine/short";

const fact = (patch = {}) => ({
  videoId: LIVE_ID,
  contentType: "long",
  subject: "execution/data-cleaning",
  ideaId: "everyone-asks-clean-data",
  publishStatus: "draft_pending",
  publishExists: true,
  ...patch,
});

const ingest = (ledger, f = fact(), opts = {}) => ingestPublish(ledger, f, { now: NOW, ...opts });

// ── helpers ──────────────────────────────────────────────────────────────────

test("forwardStatus only ever moves forward", () => {
  assert.equal(forwardStatus("draft_pending", "published"), "published");
  assert.equal(forwardStatus("published", "draft_pending"), "published", "never demotes");
  assert.equal(forwardStatus("uploaded_private", "uploaded_private"), "uploaded_private");
  assert.equal(forwardStatus(undefined, "published"), "published", "a new record takes the incoming status");
  assert.equal(forwardStatus("published", undefined), "published");
  assert.equal(forwardStatus("live", "published"), "published", "an unknown status loses to a known one");
});

test("addDays / baseVideoId / contentTypeFor / isLive", () => {
  assert.equal(addDays("2026-07-25", FIRST_SNAPSHOT_DAYS), "2026-08-01");
  assert.equal(addDays("2026-12-28", 7), "2027-01-04", "crosses the year boundary");
  assert.equal(addDays("nope", 7), null);

  assert.equal(baseVideoId(OLD_ID), "019-next-word-engine", "a nested Short belongs to its topic folder");
  assert.equal(baseVideoId("002-short"), "002-short", "legacy flat Short folder is its own topic");

  assert.equal(contentTypeFor(OLD_ID), "short", "the /short suffix decides");
  assert.equal(contentTypeFor(LIVE_ID), "long");
  assert.equal(contentTypeFor(LIVE_ID, "short"), "short", "explicit wins");
  assert.equal(contentTypeFor(LIVE_ID, "garbage"), "long", "an unknown value falls back to the key");

  assert.equal(isLive(LIVE_ID, "020"), true);
  assert.equal(isLive(`${LIVE_ID}/short`, "020"), true, "a live video's Short is governed too");
  assert.equal(isLive(OLD_ID, "020"), false);
  assert.equal(isLive("_TEMPLATE", "020"), false, "no sequence → not governed");
});

// ── ingestPublish ────────────────────────────────────────────────────────────

test("ingestPublish seeds a live record: published + due_at +7d + lesson pending", () => {
  const { ledger, changed, record } = ingest(emptyLedger());
  assert.equal(changed, true);
  assert.deepEqual(record, {
    subject: "execution/data-cleaning",
    idea_id: "everyone-asks-clean-data",
    content_type: "long",
    status: "published",
    published_at: "2026-07-25",
    youtube_video_id: null,
    lesson: { state: "pending", at: null, note: null },
    analytics: { due_at: "2026-08-01", snapshots: [] },
  });
  assert.ok(validateLedger(ledger).valid, "an ingested ledger stays schema-valid");
  assert.deepEqual(Object.keys(record), [
    "subject", "idea_id", "content_type", "status", "published_at", "youtube_video_id", "lesson", "analytics",
  ], "a new record is written in the documented order");
});

test("ingestPublish trusts the publish.json's PRESENCE over its stale status field", () => {
  // 019's Short shipped while its publish.json still said draft_pending — presence is the signal.
  const { record } = ingest(emptyLedger(), fact({ publishStatus: "draft_pending", publishExists: true }));
  assert.equal(record.status, "published");
});

test("ingestPublish is idempotent — a second pass changes nothing", () => {
  const first = ingest(emptyLedger());
  const second = ingest(first.ledger);
  assert.equal(second.changed, false);
  assert.equal(second.ledger, first.ledger, "the input ledger is returned untouched");
  assert.deepEqual(second.record, first.record);
});

test("ingestPublish never re-stamps published_at, re-schedules analytics, or re-opens a lesson", () => {
  const seeded = ingest(emptyLedger()).ledger;
  // The owner settles the lesson and the analytics pass moves the schedule on.
  const evolved = {
    ...seeded,
    videos: {
      [LIVE_ID]: {
        ...seeded.videos[LIVE_ID],
        lesson: { state: "linked", at: "2026-07-26", note: "faithful-not-correct" },
        analytics: { due_at: null, snapshots: [{ fetched: "2026-08-01", views: 120 }] },
      },
    },
  };
  const { ledger, changed } = ingest(evolved, fact(), { now: new Date("2026-09-01T00:00:00Z") });
  assert.equal(changed, false, "later reality does not disturb settled state");
  assert.deepEqual(ledger.videos[LIVE_ID].lesson, { state: "linked", at: "2026-07-26", note: "faithful-not-correct" });
  assert.equal(ledger.videos[LIVE_ID].published_at, "2026-07-25", "the ship date is stamped once");
  assert.equal(ledger.videos[LIVE_ID].analytics.due_at, null, "a finished snapshot schedule is not restarted");
});

test("ingestPublish never demotes a published record", () => {
  const seeded = ingest(emptyLedger()).ledger;
  const { ledger, changed } = ingest(seeded, fact({ publishStatus: "draft_pending", publishExists: false }));
  assert.equal(changed, false);
  assert.equal(ledger.videos[LIVE_ID].status, "published");
});

test("ingestPublish below live_from: closed backfill stamp, no lesson owed, no analytics", () => {
  const { record, changed } = ingest(emptyLedger(), fact({ videoId: OLD_ID, contentType: "short" }));
  assert.equal(changed, true);
  assert.equal(record.content_type, "short");
  assert.equal(record.status, "published");
  assert.equal(record.published_at, null, "we don't fabricate ship dates for pre-live_from history");
  assert.deepEqual(record.lesson, { state: "none", at: "2026-07-25", note: "backfill" });
  assert.deepEqual(record.analytics, { due_at: null, snapshots: [] });
});

test("ingestPublish with no publish.json and no status is a no-op — an unresolved video is not invented", () => {
  const before = emptyLedger();
  const { ledger, changed, record } = ingest(before, fact({ publishExists: false, publishStatus: null }));
  assert.equal(changed, false);
  assert.equal(record, null);
  assert.deepEqual(ledger.videos, {});

  assert.equal(ingest(before, fact({ videoId: null })).changed, false, "no id → nothing to ingest");
});

test("ingestPublish fills a missing subject/idea_id later without erasing a known one", () => {
  const bare = ingest(emptyLedger(), fact({ subject: null, ideaId: null }));
  assert.equal(bare.record.subject, null);

  const filled = ingest(bare.ledger, fact());
  assert.equal(filled.changed, true);
  assert.equal(filled.record.subject, "execution/data-cleaning");

  const forgotten = ingest(filled.ledger, fact({ subject: null, ideaId: null }));
  assert.equal(forgotten.changed, false, "a fact that knows nothing does not clear what the ledger knows");
});

test("ingestPublish honors an explicit liveFrom override", () => {
  const { record } = ingest(emptyLedger(), fact({ videoId: OLD_ID }), { liveFrom: "019" });
  assert.equal(record.lesson.state, "pending", "019 is governed when live_from is 019");
});

// ── projectIdeas ─────────────────────────────────────────────────────────────

const IDEAS = {
  updated: "2026-07-01",
  ideas: [
    { id: "everyone-asks-clean-data", title: "A", archetype: "ideas", task: "t", score: 90, status: "in-progress", produced_video_id: null },
    { id: "everyone-asks-ai-series", title: "B", archetype: "ideas", task: "t", score: 88, status: "backlog", produced_video_id: "009-boring-money-leak" },
    { id: "parked-idea", title: "C", archetype: "ideas", task: "t", score: 40, status: "parked", produced_video_id: null },
  ],
};

const ledgerWith = (videos) => ({ ...emptyLedger(), videos });
const record = (patch = {}) => ({
  subject: "execution/data-cleaning",
  idea_id: "everyone-asks-clean-data",
  content_type: "long",
  status: "published",
  published_at: "2026-07-25",
  youtube_video_id: null,
  lesson: { state: "pending", at: null, note: null },
  analytics: { due_at: "2026-08-01", snapshots: [] },
  ...patch,
});

test("projectIdeas promotes in-progress → produced and binds produced_video_id", () => {
  const { ideas, changed } = projectIdeas(IDEAS, ledgerWith({ [LIVE_ID]: record() }), { now: NOW });
  assert.equal(changed, true);
  assert.equal(ideas.ideas[0].status, "produced");
  assert.equal(ideas.ideas[0].produced_video_id, LIVE_ID);
  assert.equal(ideas.updated, "2026-07-25", "the bank's `updated` stamp moves only when something changed");
  assert.equal(IDEAS.ideas[0].status, "in-progress", "the input bank is not mutated");
});

test("projectIdeas is idempotent and never demotes produced → in-progress", () => {
  const once = projectIdeas(IDEAS, ledgerWith({ [LIVE_ID]: record() }), { now: NOW });
  const twice = projectIdeas(once.ideas, ledgerWith({ [LIVE_ID]: record({ status: "draft_pending" }) }), { now: NOW });
  assert.equal(twice.changed, false);
  assert.equal(twice.ideas, once.ideas, "no change → the input object is handed straight back");
  assert.equal(twice.ideas.ideas[0].status, "produced");
});

test("projectIdeas leaves a recurring series entry untouched (first binding wins)", () => {
  const ledger = ledgerWith({ [LIVE_ID]: record({ idea_id: "everyone-asks-ai-series" }) });
  const { ideas, changed } = projectIdeas(IDEAS, ledger, { now: NOW });
  assert.equal(changed, false, "a series idea stays in the backlog to be spent again");
  assert.equal(ideas.ideas[1].produced_video_id, "009-boring-money-leak", "and keeps the video it was first spent on");
});

test("projectIdeas records a parked idea's video without reversing the parking decision", () => {
  const ledger = ledgerWith({ "021-x": record({ idea_id: "parked-idea", subject: null }) });
  const { ideas } = projectIdeas(IDEAS, ledger, { now: NOW });
  assert.equal(ideas.ideas[2].status, "parked", "only in-progress → produced is projected");
  assert.equal(ideas.ideas[2].produced_video_id, "021-x", "the binding is a fact, and fills an empty field");
});

test("projectIdeas binds a nested Short to its topic folder", () => {
  const ledger = ledgerWith({ [`${LIVE_ID}/short`]: record({ content_type: "short" }) });
  const { ideas } = projectIdeas(IDEAS, ledger, { now: NOW });
  assert.equal(ideas.ideas[0].produced_video_id, LIVE_ID, "not '…/short'");
});

test("projectIdeas is a no-op for a bespoke video and for an idea_id with no bank entry", () => {
  for (const videos of [{ [LIVE_ID]: record({ idea_id: null }) }, { [LIVE_ID]: record({ idea_id: "not-in-the-bank" }) }]) {
    const { ideas, changed } = projectIdeas(IDEAS, ledgerWith(videos), { now: NOW });
    assert.equal(changed, false);
    assert.equal(ideas, IDEAS);
  }
  assert.equal(projectIdeas(IDEAS, emptyLedger(), { now: NOW }).changed, false, "an empty ledger projects nothing");
});

// ── projectSubjects ──────────────────────────────────────────────────────────

const REGISTRY = {
  updated: "2026-07-01",
  note: "Machine mirror of docs/CHANNEL_MAP.md",
  subjects: { "execution/data-cleaning": ["020-everyone-asks-clean-data"] },
};

test("projectSubjects registers a new subject, sorts the coordinates, and keeps the note", () => {
  const ledger = ledgerWith({ "021-inbox": record({ subject: "attention/inbox", idea_id: null }) });
  const { registry, changed } = projectSubjects(REGISTRY, ledger, { now: NOW });
  assert.equal(changed, true);
  assert.deepEqual(Object.keys(registry.subjects), ["attention/inbox", "execution/data-cleaning"]);
  assert.deepEqual(registry.subjects["attention/inbox"], ["021-inbox"]);
  assert.equal(registry.note, REGISTRY.note, "the human explanation survives");
  assert.equal(registry.updated, "2026-07-25");
});

test("projectSubjects appends a cluster-mate in sorted order and never removes one", () => {
  const ledger = ledgerWith({ "013-fail-loud": record({ subject: "execution/data-cleaning", idea_id: null }) });
  const { registry, changed } = projectSubjects(REGISTRY, ledger, { now: NOW });
  assert.equal(changed, true);
  assert.deepEqual(registry.subjects["execution/data-cleaning"], ["013-fail-loud", "020-everyone-asks-clean-data"]);
});

test("projectSubjects is idempotent and skips records with no subject", () => {
  const ledger = ledgerWith({
    [LIVE_ID]: record(),
    [`${LIVE_ID}/short`]: record({ content_type: "short" }),
    "021-bespoke": record({ subject: null, idea_id: null }),
  });
  const { registry, changed } = projectSubjects(REGISTRY, ledger, { now: NOW });
  assert.equal(changed, false, "the Short shares its topic's entry; a subject-less video claims nothing");
  assert.equal(registry, REGISTRY);
});

test("projectSubjects fail-softs on a missing registry", () => {
  const { registry, changed } = projectSubjects(undefined, ledgerWith({ [LIVE_ID]: record() }), { now: NOW });
  assert.equal(changed, true);
  assert.deepEqual(registry.subjects, { "execution/data-cleaning": [LIVE_ID] });
});

// ── projectPublishStatus ─────────────────────────────────────────────────────

test("projectPublishStatus flips draft_pending → published and keeps the file's key order", () => {
  const publish = { id: "019-next-word-engine", status: "draft_pending", youtube_video_id: null };
  const { publishJson, changed } = projectPublishStatus(publish, record());
  assert.equal(changed, true);
  assert.equal(publishJson.status, "published");
  assert.deepEqual(Object.keys(publishJson), ["id", "status", "youtube_video_id"]);
  assert.equal(publish.status, "draft_pending", "the input file object is not mutated");
});

test("projectPublishStatus is idempotent, forward-only, and fail-soft", () => {
  const published = { id: "x", status: "published" };
  assert.equal(projectPublishStatus(published, record()).changed, false);
  assert.equal(projectPublishStatus(published, record()).publishJson, published);
  assert.equal(
    projectPublishStatus(published, record({ status: "draft_pending" })).changed,
    false,
    "a ledger record can never demote a published file"
  );
  assert.equal(projectPublishStatus(null, record()).changed, false);
  assert.equal(projectPublishStatus({ id: "x" }, record()).changed, true, "a file with no status gets one");
  assert.equal(projectPublishStatus(published, {}).changed, false, "a record with no status projects nothing");
});

// ── the lesson obligation ────────────────────────────────────────────────────

test("lessonOwed is true only for a governed record explicitly pending", () => {
  const ledger = ledgerWith({
    [LIVE_ID]: record(),
    [`${LIVE_ID}/short`]: record({ lesson: { state: "linked", at: "2026-07-26", note: "faithful-not-correct" } }),
    "021-none": record({ lesson: { state: "none", at: "2026-07-26", note: null } }),
    [OLD_ID]: record({ lesson: { state: "pending", at: null, note: null } }),
  });
  assert.equal(lessonOwed(ledger, LIVE_ID), true);
  assert.equal(lessonOwed(ledger, `${LIVE_ID}/short`), false, "linked = written");
  assert.equal(lessonOwed(ledger, "021-none"), false, "none = reviewed, nothing durable");
  assert.equal(lessonOwed(ledger, OLD_ID), false, "below live_from the ledger owes nothing");
  assert.equal(lessonOwed(ledger, "no-such-video"), false);
});

test("lessonOwed never infers an obligation from a missing field", () => {
  const ledger = ledgerWith({ [LIVE_ID]: { ...record(), lesson: {} }, "021-x": { ...record() } });
  delete ledger.videos["021-x"].lesson;
  assert.equal(lessonOwed(ledger, LIVE_ID), false, "an empty lesson block does not block the owner's turn");
  assert.equal(lessonOwed(ledger, "021-x"), false);
});

test("owedLessons lists the governed pending records in ledger order", () => {
  const ledger = ledgerWith({
    [OLD_ID]: record({ lesson: { state: "none", at: "2026-07-25", note: "backfill" } }),
    [LIVE_ID]: record(),
    [`${LIVE_ID}/short`]: record(),
  });
  assert.deepEqual(owedLessons(ledger), [LIVE_ID, `${LIVE_ID}/short`]);
  assert.deepEqual(owedLessons(emptyLedger()), []);
  assert.deepEqual(owedLessons(ledger, { liveFrom: "999" }), [], "nothing is governed yet");
});

test("setLesson settles a lesson explicitly and keeps the rest of the record", () => {
  const linked = setLesson(record(), { state: "linked", note: "faithful-not-correct", now: NOW });
  assert.deepEqual(linked.lesson, { state: "linked", at: "2026-07-25", note: "faithful-not-correct" });
  assert.equal(linked.status, "published", "only the lesson block moves");

  const none = setLesson(record(), { state: "none", now: NOW });
  assert.deepEqual(none.lesson, { state: "none", at: "2026-07-25", note: null });

  const reopened = setLesson(linked, { state: "pending", now: NOW });
  assert.deepEqual(reopened.lesson, { state: "pending", at: null, note: null }, "re-opening clears the stamp");

  assert.ok(validateLedger(ledgerWith({ [LIVE_ID]: linked })).valid);
});

test("setLesson clears the obligation for the hook, and is loud on a bad state", () => {
  const settled = ledgerWith({ [LIVE_ID]: setLesson(record(), { state: "none", now: NOW }) });
  assert.deepEqual(owedLessons(settled), []);

  assert.throws(() => setLesson(record(), { state: "written" }), /unknown lesson state/);
  assert.throws(() => setLesson(record(), {}), /unknown lesson state/);
  assert.throws(() => setLesson(record(), { state: "linked" }), /needs the KOS note slug/);
});

// ── the whole pass ───────────────────────────────────────────────────────────

test("a full ingest → project pass is idempotent end to end", () => {
  const facts = [
    fact(),
    fact({ videoId: `${LIVE_ID}/short`, contentType: "short" }),
    fact({ videoId: OLD_ID, contentType: "short", subject: "explanation/llm-basics", ideaId: null }),
  ];
  const pass = (ledger, ideas, registry) => {
    let changed = false;
    for (const f of facts) {
      const res = ingestPublish(ledger, f, { now: NOW });
      ledger = res.ledger;
      changed = changed || res.changed;
    }
    const i = projectIdeas(ideas, ledger, { now: NOW });
    const s = projectSubjects(registry, ledger, { now: NOW });
    return { ledger, ideas: i.ideas, registry: s.registry, changed: changed || i.changed || s.changed };
  };

  const first = pass(emptyLedger(), IDEAS, REGISTRY);
  assert.equal(first.changed, true);
  assert.ok(validateLedger(first.ledger).valid);
  assert.deepEqual(owedLessons(first.ledger), [LIVE_ID, `${LIVE_ID}/short`], "only the governed pair owes a lesson");
  assert.equal(first.ideas.ideas[0].status, "produced");
  assert.deepEqual(Object.keys(first.registry.subjects), ["execution/data-cleaning", "explanation/llm-basics"]);

  const second = pass(first.ledger, first.ideas, first.registry);
  assert.equal(second.changed, false, "the second pass writes nothing");
  assert.deepEqual(second.ledger, first.ledger);
  assert.equal(second.ideas, first.ideas);
  assert.equal(second.registry, first.registry);
});

// ── session 3: the fs edge, on a throwaway repo root ─────────────────────────

const writeJson = (p, doc) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + "\n");
};
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const publishFile = (id, status) => ({
  id,
  title_options: [`${id} title`],
  description: "d",
  tags: ["t"],
  youtube_video_id: null,
  status,
});

const FIXTURE_IDEAS = {
  updated: "2026-07-01",
  ideas: [
    { id: "clean-data", title: "Clean the data first", archetype: "ideas", task: "data-entry", score: 88, status: "in-progress", produced_video_id: "020-clean-data" },
    { id: "old-drift", title: "Shipped but never closed out", archetype: "diagram", task: "documents", score: 80, status: "in-progress", produced_video_id: "019-old-topic" },
    { id: "untouched", title: "Still in the backlog", archetype: "ideas", task: "scheduling", score: 70, status: "backlog", produced_video_id: null },
  ],
};

const FIXTURE_SUBJECTS = {
  updated: "2026-07-01",
  note: "Machine mirror of docs/CHANNEL_MAP.md",
  subjects: { "explanation/llm-basics": ["019-old-topic"] },
};

/**
 * A throwaway repo root to point the reconciler at:
 *   content/020-clean-data/{brief.json, short/publish.json}   ← live (governed) Short
 *   content/019-old-topic/{brief.json, publish.json}          ← pre-live_from history
 *   content/018-no-publish/brief.json                         ← nothing to ingest
 *   content/{001-sta-je-ai,004-hfproof}/publish.json          ← own a publish.json, aren't videos
 *   content/_TEMPLATE/publish.json                            ← not a video folder
 * The ledger file is deliberately ABSENT: a first run must not need a bootstrap step. 019 carries
 * no `idea_id`/`subject` in its brief, so it exercises both reverse lookups.
 */
function makeRoot(root, { ideas = FIXTURE_IDEAS, subjects = FIXTURE_SUBJECTS } = {}) {
  const p = statePaths(root);
  writeJson(path.join(p.content, "020-clean-data", "brief.json"), {
    id: "020-clean-data",
    format: "short",
    idea_id: "clean-data",
    subject: "execution/data-cleaning",
  });
  writeJson(path.join(p.content, "020-clean-data", "short", "publish.json"), publishFile("020-clean-data", "draft_pending"));
  writeJson(path.join(p.content, "019-old-topic", "brief.json"), { id: "019-old-topic", format: "long" });
  writeJson(path.join(p.content, "019-old-topic", "publish.json"), publishFile("019-old-topic", "draft_pending"));
  writeJson(path.join(p.content, "018-no-publish", "brief.json"), { id: "018-no-publish", format: "short" });
  for (const nonVideo of NON_VIDEOS) {
    writeJson(path.join(p.content, nonVideo, "publish.json"), publishFile(nonVideo, "published"));
  }
  writeJson(path.join(p.content, "_TEMPLATE", "publish.json"), publishFile("_TEMPLATE", "draft_pending"));
  if (ideas) writeJson(p.ideas, ideas);
  if (subjects) writeJson(p.subjects, subjects);
  return p;
}

const plan = (root, opts = {}) => planReconcile({ root, now: NOW, ...opts });

test("scanVideos finds the long + the nested Short and skips everything that isn't a video", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    assert.deepEqual(videoFolders(p.content), ["018-no-publish", "019-old-topic", "020-clean-data"]);
    assert.deepEqual(
      scanVideos(p.content).map((s) => s.videoId),
      ["019-old-topic", "020-clean-data/short"],
      "the archived pilot, the render proof and _TEMPLATE all own a publish.json and are all ignored"
    );
    assert.deepEqual(videoFolders(path.join(root, "nope")), [], "a missing content dir is empty, not a crash");
  });
});

test("scanVideos is fail-soft on an unreadable publish.json — presence still counts", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    fs.writeFileSync(path.join(p.content, "019-old-topic", "publish.json"), "{ not json");
    const warnings = [];
    const broken = scanVideos(p.content, { warn: (m) => warnings.push(m) }).find((s) => s.videoId === "019-old-topic");
    assert.equal(broken.publish, null);
    assert.equal(broken.publishExists, true, "the file being there is the owner-approval signal");
    assert.equal(broken.publishStatus, null);
    assert.equal(warnings.length, 1);
  });
});

test("resolveFact prefers the brief and reverse-looks-up what the brief never carries", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const scans = scanVideos(p.content);
    const ideas = readJson(p.ideas);
    const registry = readJson(p.subjects);
    const factFor = (videoId) => {
      const scan = scans.find((s) => s.videoId === videoId);
      const briefPath = path.join(p.content, baseVideoId(videoId), "brief.json");
      return resolveFact(scan, { brief: readJson(briefPath), ideas, registry });
    };

    assert.deepEqual(factFor("020-clean-data/short"), {
      videoId: "020-clean-data/short",
      contentType: "short",
      subject: "execution/data-cleaning",
      ideaId: "clean-data",
      youtubeVideoId: null,
      publishStatus: "draft_pending",
      publishExists: true,
    }, "the topic brief serves its nested Short");

    const old = factFor("019-old-topic");
    assert.equal(old.contentType, "long");
    assert.equal(old.subject, "explanation/llm-basics", "reverse-looked-up from produced_subjects.json");
    assert.equal(old.ideaId, "old-drift", "reverse-looked-up from the idea pointing at this video");

    assert.equal(subjectOf(registry, "020-clean-data"), null, "a video no subject claims yet");
    assert.equal(ideaIdOf(ideas, "017-nobody"), null);
  });
});

test("planReconcile computes the whole pass and writes NOTHING", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const result = plan(root);

    assert.deepEqual(result.scanned, ["019-old-topic", "020-clean-data/short"]);
    assert.deepEqual(
      result.writes.map((w) => w.kind).sort(),
      ["ideas", "ledger", "publish", "publish", "subjects"],
      "the ledger + all three derived projections move on a first run"
    );
    assert.deepEqual(result.owed, ["020-clean-data/short"], "only the governed video owes a lesson");
    assert.deepEqual(result.noPublish, ["018-no-publish"], "reported for the owner, never invented");
    assert.ok(
      result.changes.some((c) => c.includes("+ ledger 020-clean-data/short") && c.includes("lesson pending") && c.includes("analytics due 2026-08-01")),
      `expected a new-record diff line, got:\n${result.changes.join("\n")}`
    );
    assert.ok(result.changes.some((c) => c.includes("ideas.json old-drift") && c.includes("in-progress → produced")));
    assert.ok(result.changes.some((c) => c.includes("execution/data-cleaning += 020-clean-data")));
    assert.ok(result.changes.some((c) => c.includes("publish.json  status: draft_pending → published")));

    assert.equal(fs.existsSync(p.ledger), false, "the dry pass does not even create the ledger");
    assert.equal(readJson(path.join(p.content, "019-old-topic", "publish.json")).status, "draft_pending");
    assert.deepEqual(readJson(p.ideas), FIXTURE_IDEAS);
    assert.deepEqual(readJson(p.subjects), FIXTURE_SUBJECTS);
  });
});

test("applyPlan writes every projection, and a second pass is clean", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const { written } = applyPlan(plan(root), { now: NOW });
    assert.equal(written.length, 5);

    // the ledger
    assert.ok(validateFile(p.ledger).valid, "the ledger on disk is schema-valid");
    const ledger = readJson(p.ledger);
    assert.equal(ledger.updated, "2026-07-25");
    assert.deepEqual(ledger.videos["020-clean-data/short"], {
      subject: "execution/data-cleaning",
      idea_id: "clean-data",
      content_type: "short",
      status: "published",
      published_at: "2026-07-25",
      youtube_video_id: null,
      lesson: { state: "pending", at: null, note: null },
      analytics: { due_at: "2026-08-01", snapshots: [] },
    });
    assert.deepEqual(ledger.videos["019-old-topic"].lesson, { state: "none", at: "2026-07-25", note: "backfill" });
    assert.equal(ledger.videos["019-old-topic"].published_at, null, "no fabricated ship date below live_from");

    // the three derived files
    assert.equal(readJson(path.join(p.content, "019-old-topic", "publish.json")).status, "published");
    assert.equal(readJson(path.join(p.content, "020-clean-data", "short", "publish.json")).status, "published");
    const ideas = readJson(p.ideas);
    assert.deepEqual(ideas.ideas.map((i) => i.status), ["produced", "produced", "backlog"], "the shipped drift clears");
    assert.equal(ideas.ideas[2].produced_video_id, null, "a backlog idea is untouched");
    assert.deepEqual(readJson(p.subjects).subjects, {
      "execution/data-cleaning": ["020-clean-data"],
      "explanation/llm-basics": ["019-old-topic"],
    });
    assert.equal(readJson(p.subjects).note, FIXTURE_SUBJECTS.note, "the human note survives");

    const second = plan(root);
    assert.deepEqual(second.writes, [], "nothing left to project");
    assert.deepEqual(second.changes, []);
    assert.deepEqual(second.owed, ["020-clean-data/short"], "the lesson is still owed until the owner settles it");
  });
});

test("stampLesson settles the obligation on disk, and reconcile never re-opens it", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    applyPlan(plan(root), { now: NOW });

    const { record } = stampLesson({ root, videoId: "020-clean-data/short", state: "none", now: NOW });
    assert.deepEqual(record.lesson, { state: "none", at: "2026-07-25", note: null });
    assert.deepEqual(readJson(p.ledger).videos["020-clean-data/short"].lesson, { state: "none", at: "2026-07-25", note: null });
    assert.ok(validateFile(p.ledger).valid);

    const after = plan(root);
    assert.deepEqual(after.owed, [], "the hook stops blocking");
    assert.deepEqual(after.writes, [], "a settled lesson is not re-opened by the next pass");

    stampLesson({ root, videoId: "020-clean-data/short", state: "linked", note: "faithful-not-correct", now: NOW });
    assert.deepEqual(readJson(p.ledger).videos["020-clean-data/short"].lesson, {
      state: "linked",
      at: "2026-07-25",
      note: "faithful-not-correct",
    });
  });
});

test("stampLesson is loud on an unknown video and on `linked` with no slug", async () => {
  await withTempDir(async (root) => {
    makeRoot(root);
    applyPlan(plan(root), { now: NOW });
    assert.throws(() => stampLesson({ root, videoId: "021-nope", state: "none" }), /no ledger record/);
    assert.throws(() => stampLesson({ root, videoId: "020-clean-data/short", state: "linked" }), /needs the KOS note slug/);
    assert.throws(() => stampLesson({ root, videoId: "020-clean-data/short", state: "guessed" }), /unknown lesson state/);
  });
});

test("planReconcile is fail-soft on missing and broken derived files", async () => {
  await withTempDir(async (root) => {
    // Missing derived files: the ledger is still built and the registry is created from scratch.
    const p = makeRoot(root, { ideas: null, subjects: null });
    const missing = plan(root, { warn: () => {} });
    assert.deepEqual(missing.writes.map((w) => w.kind).sort(), ["ledger", "publish", "publish", "subjects"]);
    assert.equal(missing.ledger.videos["019-old-topic"].idea_id, null, "no bank → no binding, not a crash");
    applyPlan(missing, { now: NOW });
    assert.deepEqual(readJson(p.subjects).subjects, { "execution/data-cleaning": ["020-clean-data"] });
  });

  await withTempDir(async (root) => {
    // A file that EXISTS but won't parse is warned about and left alone — never clobbered.
    const p = makeRoot(root);
    fs.writeFileSync(p.subjects, "{ broken");
    fs.writeFileSync(path.join(p.content, "019-old-topic", "publish.json"), "{ broken");
    const warnings = [];
    const broken = plan(root, { warn: (m) => warnings.push(m) });
    assert.deepEqual(broken.writes.map((w) => w.kind).sort(), ["ideas", "ledger", "publish"], "no subjects write, no broken-publish write");
    assert.equal(broken.ledger.videos["019-old-topic"].status, "published", "an unreadable publish.json is still ingested");
    assert.ok(warnings.some((w) => w.includes("not rewriting it")));
    applyPlan(broken, { now: NOW });
    assert.equal(fs.readFileSync(p.subjects, "utf8"), "{ broken", "the owner's unreadable file is untouched");
  });
});

test("applyPlan validates every document before it reaches disk, and one bad file doesn't abort the pass", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const publishPath = path.join(p.content, "019-old-topic", "publish.json");
    const goodPath = path.join(p.content, "020-clean-data", "short", "publish.json");
    const warnings = [];
    const { written, skipped } = applyPlan(
      {
        writes: [
          { kind: "publish", path: publishPath, doc: { id: "x", status: "shipped" }, schema: "publish" },
          { kind: "publish", path: goodPath, doc: publishFile("020-clean-data", "published"), schema: "publish" },
        ],
      },
      { warn: (m) => warnings.push(m) }
    );

    assert.deepEqual(written, [goodPath], "the valid write still lands — legacy drift must not stall the self-heal");
    assert.equal(skipped.length, 1);
    assert.match(skipped[0].error, /status/);
    assert.ok(warnings.some((w) => w.includes("skipped")));
    assert.equal(readJson(publishPath).status, "draft_pending", "the invalid document never reaches disk");
    assert.deepEqual(applyPlan({}).written, [], "an empty plan writes nothing");
  });
});

test("parseArgs covers the ways the reconciler is invoked", () => {
  assert.deepEqual(parseArgs([]), { videoId: null, fix: false, backfill: false, learned: false, state: null, note: null });
  assert.equal(parseArgs(["--fix"]).fix, true);
  assert.equal(parseArgs(["--dry-run"]).fix, false);
  assert.equal(parseArgs(["--fix", "--dry-run"]).fix, false, "the safer flag wins when both are passed");
  assert.equal(parseArgs(["--backfill"]).backfill, true);
  assert.equal(parseArgs(["--backfill", "--fix"]).fix, true);
  assert.deepEqual(parseArgs(["020-x/short", "--learned", "--nothing"]), {
    videoId: "020-x/short", fix: false, backfill: false, learned: true, state: "none", note: null,
  });
  assert.deepEqual(parseArgs(["020-x", "--learned", "--note", "faithful-not-correct"]), {
    videoId: "020-x", fix: false, backfill: false, learned: true, state: "linked", note: "faithful-not-correct",
  });
  assert.throws(() => parseArgs(["--wat"]), /unknown flag/);
  assert.throws(() => parseArgs(["a", "b"]), /unexpected argument/);
});

// ── session 5: the one-time backfill + the id the upload already knows ────────

test("--backfill narrows the pass to history and leaves the governed video for the live run", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const back = plan(root, { backfill: true });

    assert.deepEqual(back.scanned, ["019-old-topic"], "020 is governed — not part of the historical seeding");
    assert.deepEqual(Object.keys(back.ledger.videos), ["019-old-topic"]);
    assert.deepEqual(back.owed, [], "history is never owed a lesson");
    assert.deepEqual(
      back.noPublish,
      ["018-no-publish"],
      "computed from the FULL scan — a skipped-but-published video is not reported as missing"
    );
    assert.ok(!back.writes.some((w) => String(w.path).includes("020-clean-data")), "no live file is touched");

    applyPlan(back, { now: NOW });
    assert.equal(readJson(path.join(p.content, "019-old-topic", "publish.json")).status, "published");
    assert.equal(readJson(path.join(p.content, "020-clean-data", "short", "publish.json")).status, "draft_pending");
    assert.deepEqual(readJson(p.ledger).videos["019-old-topic"].lesson, { state: "none", at: "2026-07-25", note: "backfill" });

    // Re-running the backfill is a no-op; the ordinary pass then adds only the live record.
    assert.deepEqual(plan(root, { backfill: true }).writes, [], "the backfill is idempotent");
    const live = plan(root);
    assert.deepEqual(live.owed, ["020-clean-data/short"]);
    assert.ok(live.changes.some((c) => c.includes("+ ledger 020-clean-data/short")));
    assert.ok(!live.changes.some((c) => c.includes("019-old-topic")), "history stays settled");
  });
});

test("the ledger captures youtube_video_id from the publish.json, set-once", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const publishPath = path.join(p.content, "019-old-topic", "publish.json");
    writeJson(publishPath, { ...publishFile("019-old-topic", "uploaded_private"), youtube_video_id: "eZXUIn9GZTI" });
    applyPlan(plan(root), { now: NOW });

    const record = readJson(p.ledger).videos["019-old-topic"];
    assert.equal(record.youtube_video_id, "eZXUIn9GZTI");
    assert.equal(record.status, "published", "presence still outranks the file's own uploaded_private");

    // A re-upload under a new id does not rewrite history: the ledger keeps the id it recorded.
    writeJson(publishPath, { ...publishFile("019-old-topic", "published"), youtube_video_id: "OTHER-id-999" });
    const after = plan(root);
    assert.deepEqual(after.writes, [], "nothing to project");
    assert.equal(after.ledger.videos["019-old-topic"].youtube_video_id, "eZXUIn9GZTI");
    assert.equal(
      readJson(p.ledger).videos["020-clean-data/short"].youtube_video_id,
      null,
      "a publish.json with no id yet stays null"
    );
  });
});
