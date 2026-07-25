// Session 1 of the lifecycle-ledger thread (D-062): the schema + the read/write helper.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validateFile } from "../shared/lib/validate-lib.mjs";
import { withTempDir } from "../shared/testkit/index.mjs";
import {
  LEDGER_PATH,
  SCHEMA_VERSION,
  emptyLedger,
  loadLedger,
  saveLedger,
  validateLedger,
  videoSeq,
} from "./ledger.mjs";

const FULL_RECORD = {
  subject: "execution/data-cleaning",
  idea_id: "everyone-asks-clean-data",
  content_type: "short",
  status: "published",
  published_at: "2026-07-24",
  youtube_video_id: null,
  lesson: { state: "pending", at: null, note: null },
  analytics: { due_at: "2026-07-31", snapshots: [] },
};

const withVideos = (videos) => ({ ...emptyLedger(), videos });
const withRecord = (patch) => withVideos({ "020-everyone-asks-clean-data": { ...FULL_RECORD, ...patch } });

// ── schema ───────────────────────────────────────────────────────────────────

test("videos.schema accepts a full record", () => {
  const { valid, errors } = validateLedger(withVideos({ "020-everyone-asks-clean-data": FULL_RECORD }));
  assert.ok(valid, JSON.stringify(errors));
});

test("videos.schema accepts a minimal record and a nested Short key", () => {
  const doc = withVideos({
    "019-next-word-engine/short": {
      content_type: "short",
      status: "published",
      lesson: { state: "none", at: "2026-07-25", note: "backfill" },
      analytics: { due_at: null, snapshots: [] },
    },
  });
  const { valid, errors } = validateLedger(doc);
  assert.ok(valid, JSON.stringify(errors));
});

test("videos.schema rejects a bad lesson.state", () => {
  // The whole point of the explicit enum: an unknown state must fail loud, not read as "owed".
  assert.equal(validateLedger(withRecord({ lesson: { state: "written" } })).valid, false);
});

test("videos.schema requires lesson.state — an empty lesson object is NOT 'no obligation'", () => {
  assert.equal(validateLedger(withRecord({ lesson: {} })).valid, false);
});

test("videos.schema rejects bad status / content_type / unknown record field", () => {
  assert.equal(validateLedger(withRecord({ status: "live" })).valid, false, "status enum is closed");
  assert.equal(validateLedger(withRecord({ content_type: "long+short" })).valid, false, "one record per publish.json → long OR short");
  assert.equal(validateLedger(withRecord({ lessonOwed: true })).valid, false, "additionalProperties:false — derived flags don't get stored");
});

test("videos.schema rejects a record with a missing required block", () => {
  const { analytics, ...noAnalytics } = FULL_RECORD;
  assert.equal(validateLedger(withVideos({ "020-x": noAnalytics })).valid, false);
  assert.equal(validateLedger(withVideos({ "020-x": { ...FULL_RECORD, analytics: { due_at: null } } })).valid, false, "snapshots is required");
});

test("videos.schema rejects a malformed video key", () => {
  for (const key of ["clean-the-data", "20-short-seq", "020-everyone-asks-clean-data/long", "020_underscores"]) {
    assert.equal(validateLedger(withVideos({ [key]: FULL_RECORD })).valid, false, `${key} must be rejected`);
  }
});

test("videos.schema pins schema_version and the live_from shape", () => {
  assert.equal(validateLedger({ ...emptyLedger(), schema_version: 2 }).valid, false, "a future version needs a migration, not a silent accept");
  assert.equal(validateLedger({ ...emptyLedger(), live_from: "20" }).valid, false, "live_from is a 3-digit sequence");
  const { live_from, ...noLiveFrom } = emptyLedger();
  assert.equal(validateLedger(noLiveFrom).valid, false);
});

test("the committed ledger is valid, empty, and resolves its schema by filename", () => {
  const { valid, errors } = validateFile(LEDGER_PATH);
  assert.ok(valid, `pipeline/state/videos.json invalid: ${JSON.stringify(errors)}`);
  const onDisk = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
  assert.equal(onDisk.schema_version, SCHEMA_VERSION);
  assert.equal(onDisk.live_from, "020");
});

// ── load / save ──────────────────────────────────────────────────────────────

test("emptyLedger is schema-valid and stamps the given date", () => {
  const doc = emptyLedger({ now: new Date("2026-07-25T10:00:00Z") });
  assert.deepEqual(doc, { schema_version: 1, updated: "2026-07-25", live_from: "020", videos: {} });
  assert.ok(validateLedger(doc).valid);
});

test("save → load round-trips a record and stamps `updated`", async () => {
  await withTempDir((dir) => {
    const filePath = path.join(dir, "state", "videos.json");
    const written = saveLedger(withVideos({ "020-everyone-asks-clean-data": FULL_RECORD }), {
      filePath,
      now: new Date("2026-08-01T00:00:00Z"),
    });
    assert.equal(written.updated, "2026-08-01", "saveLedger owns the `updated` stamp");
    const loaded = loadLedger(filePath);
    assert.deepEqual(loaded, written);
    assert.deepEqual(loaded.videos["020-everyone-asks-clean-data"], FULL_RECORD);
  });
});

test("loadLedger fail-softs on a MISSING file (no bootstrap step needed)", async () => {
  await withTempDir((dir) => {
    const loaded = loadLedger(path.join(dir, "nope.json"));
    assert.deepEqual(loaded.videos, {});
    assert.equal(loaded.schema_version, SCHEMA_VERSION);
  });
});

test("loadLedger throws on unparseable or invalid content — never silently empties the truth", async () => {
  await withTempDir((dir) => {
    const broken = path.join(dir, "broken.json");
    fs.writeFileSync(broken, "{ not json");
    assert.throws(() => loadLedger(broken), /not parseable JSON/);

    const invalid = path.join(dir, "invalid.json");
    fs.writeFileSync(invalid, JSON.stringify(withRecord({ lesson: { state: "written" } })));
    assert.throws(() => loadLedger(invalid), /is invalid/);
  });
});

test("saveLedger validates BEFORE writing — an invalid ledger never reaches disk", async () => {
  await withTempDir((dir) => {
    const filePath = path.join(dir, "videos.json");
    assert.throws(
      () => saveLedger(withRecord({ status: "live" }), { filePath }),
      /refusing to write an invalid ledger/
    );
    assert.equal(fs.existsSync(filePath), false, "nothing written");
  });
});

// ── videoSeq ─────────────────────────────────────────────────────────────────

test("videoSeq parses ids, nested Short keys and a bare live_from", () => {
  assert.equal(videoSeq("020-everyone-asks-clean-data"), 20);
  assert.equal(videoSeq("019-next-word-engine/short"), 19);
  assert.equal(videoSeq("020"), 20);
  assert.equal(videoSeq("002-short"), 2, "legacy flat Short folder");
});

test("videoSeq returns null when there is no leading sequence", () => {
  for (const id of ["_TEMPLATE", "short", "", null, undefined, "20-x", "0201-x"]) {
    assert.equal(videoSeq(id), null, `${id} has no 3-digit sequence`);
  }
});

test("videoSeq orders a Short against live_from the way the hook will compare it", () => {
  const liveFrom = videoSeq("020");
  assert.ok(videoSeq("020-everyone-asks-clean-data/short") >= liveFrom, "020's Short is governed");
  assert.ok(videoSeq("019-next-word-engine/short") < liveFrom, "019 is backfilled history");
});
