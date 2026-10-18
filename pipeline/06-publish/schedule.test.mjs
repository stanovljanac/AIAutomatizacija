// schedule.mjs (3D, D-074) — fixed publish days: long every second Tuesday, Shorts Mon/Wed/Fri.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withTempDir, validateFile } from "../shared/testkit/index.mjs";
import {
  DEFAULT_SCHEDULE,
  addDays,
  assignSchedule,
  calendar,
  onRhythm,
  planSlots,
  promisedDates,
  slotsBetween,
  takenDays,
  uploadType,
  weekdayOf,
} from "./schedule.mjs";

const empty = () => ({ long: new Map(), short: new Map() });

test("onRhythm: the long runs every second Tuesday from its anchor; Shorts Mon/Wed/Fri every week", () => {
  assert.equal(weekdayOf("2026-10-27"), "tue");
  assert.equal(onRhythm(DEFAULT_SCHEDULE.long, "2026-10-27"), true, "the anchor week");
  assert.equal(onRhythm(DEFAULT_SCHEDULE.long, "2026-11-03"), false, "the off week");
  assert.equal(onRhythm(DEFAULT_SCHEDULE.long, "2026-11-10"), true);
  assert.equal(onRhythm(DEFAULT_SCHEDULE.long, "2026-10-13"), true, "weeks before the anchor follow the same beat");
  assert.equal(onRhythm(DEFAULT_SCHEDULE.long, "2026-10-28"), false, "a Wednesday is never a long slot");
  assert.deepEqual(slotsBetween(DEFAULT_SCHEDULE.short, "2026-10-19", 7), ["2026-10-19", "2026-10-21", "2026-10-23"]);
  assert.throws(() => onRhythm({ weekdays: ["tue"], every_weeks: 2 }, "2026-10-27"), /needs an anchor/);
});

test("uploadType: YouTube's type, else the folder key, else the length", () => {
  assert.equal(uploadType({ content_type: "short" }), "short");
  assert.equal(uploadType({ content_type: null, content_key: "025-x/short-2" }), "short");
  assert.equal(uploadType({ content_type: null, content_key: "025-x" }), "long");
  assert.equal(uploadType({ content_type: null, content_key: null, duration_seconds: 58 }), "short");
});

test("takenDays: a scheduled private upload counts on its publish day; a promise already on the channel counts once", () => {
  const catalog = { videos: {
    A: { title: "a", published_at: "2026-10-17", privacy: "public", content_type: "long", content_key: "025-x" },
    B: { title: "b", published_at: "2026-10-18", privacy: "private", scheduled_for: "2026-10-23", content_type: "short", content_key: "025-x/short" },
  } };
  const taken = takenDays({ catalog, plans: [{ type: "short", date: "2026-10-26", key: "026-y/short" }, { type: "short", date: "2026-10-30", key: "025-x/short" }] });
  assert.deepEqual([...taken.long.keys()], ["2026-10-17"]);
  assert.deepEqual([...taken.short.keys()].sort(), ["2026-10-23", "2026-10-26"], "B on its scheduled day; 025-x/short not twice");
});

test("planSlots: the first free long slot, then the Shorts after it, skipping taken days", () => {
  const taken = empty();
  taken.long.set("2026-10-27", ["024"]);
  taken.short.set("2026-11-11", ["x"]);
  const slots = planSlots({ taken, from: "2026-10-18", shorts: 3 });
  assert.equal(slots.long, "2026-11-10", "the 27th is taken → two weeks later");
  assert.deepEqual(slots.shorts, ["2026-11-13", "2026-11-16", "2026-11-18"], "after the long; the 11th is taken");
  assert.deepEqual(planSlots({ taken: empty(), from: "2026-10-18", long: false, shorts: 2 }), { long: null, shorts: ["2026-10-19", "2026-10-21"] }, "a Short-only topic");
  assert.throws(() => planSlots({ taken: empty(), from: "2026-10-18", shorts: 5, horizon: 3 }), /no free long slot|free Short slot/);
});

test("calendar lists every slot in order with what fills it", () => {
  const taken = empty();
  taken.short.set("2026-10-19", ["025-x/short"]);
  const rows = calendar({ taken, from: "2026-10-19", weeks: 2 });
  assert.equal(rows[0].date, "2026-10-19");
  assert.deepEqual(rows[0].filled, ["025-x/short"]);
  assert.equal(rows.filter((r) => r.type === "long").length, 1, "one long slot in two weeks");
  assert.equal(rows.filter((r) => r.type === "short").length, 6);
});

const publish = (extra = {}) => ({ id: "026-y", title_options: ["T"], description: "d", tags: ["t"], status: "draft_pending", short: { title: "S" }, extra_shorts: [{ unit: "short-2", title: "S2" }], ...extra });

test("assignSchedule writes the days into publish.json + publish.md, keeps them, and avoids other videos' days", async () => {
  await withTempDir(async (root) => {
    const write = (rel, doc) => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), JSON.stringify(doc));
    };
    write("content/026-y/publish.json", publish());
    write("content/026-y/brief.json", { format: "long" });
    write("content/025-x/publish.json", publish({ id: "025-x", extra_shorts: [], scheduled_for: "2026-10-27" }));
    assert.deepEqual(promisedDates(path.join(root, "content")).map((p) => p.date), ["2026-10-27"]);

    const r = assignSchedule({ root, id: "026-y", today: "2026-10-17" });
    assert.equal(r.long, "2026-11-10", "025-x already holds the 27th");
    assert.equal(r.short, "2026-11-11");
    assert.deepEqual(r.extra, [["short-2", "2026-11-13"]]);
    const pubPath = path.join(root, "content/026-y/publish.json");
    assert.ok(validateFile(pubPath, "publish").valid);
    assert.match(fs.readFileSync(path.join(root, "content/026-y/publish.md"), "utf8"), /Publish days: long 2026-11-10 · Short 2026-11-11 · Short 2 2026-11-13/);

    const again = assignSchedule({ root, id: "026-y", today: "2026-10-20" });
    assert.equal(again.long, "2026-11-10", "an assigned day is kept");
    assert.equal(assignSchedule({ root, id: "026-y", today: "2026-11-11", reassign: true }).long, "2026-11-24", "--reassign moves it");
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  });
});

test("assignSchedule: a long already out takes no slot; Shorts cut from it later start tomorrow, skipping its own Short", async () => {
  await withTempDir(async (root) => {
    const write = (rel, doc) => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), JSON.stringify(doc));
    };
    write("content/023-a/publish.json", publish({ id: "023-a", status: "published", short: { title: "S" }, extra_shorts: [{ unit: "short-2", title: "S2" }, { unit: "short-3", title: "S3" }] }));
    write("pipeline/state/youtube.json", { videos: {
      L: { title: "long", published_at: "2026-08-25", privacy: "public", content_type: "long", content_key: "023-a" },
      S: { title: "short", published_at: "2026-10-19", privacy: "public", content_type: "short", content_key: "023-a/short" },
    } });
    const r = assignSchedule({ root, id: "023-a", today: "2026-10-18" });
    assert.equal(r.long, null, "no slot for a published long");
    assert.deepEqual(r.extra, [["short-2", "2026-10-21"], ["short-3", "2026-10-23"]], "Mon the 19th is taken by its first Short");
  });
});
