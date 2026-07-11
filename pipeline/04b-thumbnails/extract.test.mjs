// 04b — extractor: settled-frame math, caption-gap fallback, candidate picking, and the
// side-effecting still/JSON writes (ffmpeg via an injected spawn — tests never launch it).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  settledSeconds,
  hfClipLocalSeconds,
  captionFreeSeconds,
  pickCandidates,
  candidateRecords,
  buildGrabCommand,
  extractStills,
  compositeFinals,
  runThumbnails,
} from "./extract.mjs";
import { withTempDir, assertValid } from "../shared/testkit/index.mjs";

const XF = 0.3;
function timelineFixture() {
  return {
    version: 1,
    out_id: "099-test",
    format: { width: 1920, height: 1080, fps: 30 },
    crossfade_seconds: XF,
    duration_seconds: 60,
    scenes: [
      { scene_id: "s1.0", engine: "hyperframes", template: "hook-card", start_seconds: 1.5, end_seconds: 12, props: { hf_scene: "hook-x", title: "An AI made this" }, reveals: [{ at_seconds: 2 }, { at_seconds: 9 }] },
      { scene_id: "s2.0", engine: "remotion", template: "stat-callout", start_seconds: 12, end_seconds: 24, props: { value: "60", label: "things a month" } },
      { scene_id: "s3.0", engine: "hyperframes", template: "diagram", start_seconds: 24, end_seconds: 40, props: { hf_scene: "recap-wall", nodes: Array.from({ length: 11 }, (_, i) => ({ id: `node-${i}`, label: `Station ${i}` })) } },
      { scene_id: "s4.0", engine: "hyperframes", template: "term-highlight", start_seconds: 40, end_seconds: 52, props: { hf_scene: "gate-one", term: "GATE 1 — a human" } },
      { scene_id: "s5.0", engine: "hyperframes", template: "cta-card", start_seconds: 52, end_seconds: 58, props: { hf_scene: "lab-outro", title: "Subscribe" } },
    ],
    // s2's window (12-24) is captioned except a gap 18.0-19.0
    captions: [
      { start_seconds: 12.0, end_seconds: 18.0, words: [] },
      { start_seconds: 19.0, end_seconds: 24.0, words: [] },
    ],
  };
}

test("settledSeconds: default ~75% through the scene, no reveals", () => {
  const t = settledSeconds({ start_seconds: 10, end_seconds: 20 }, { crossfadeSeconds: XF });
  assert.equal(t, 17.5);
});

test("settledSeconds: waits for the last enter-beat (late badge lands in the final third)", () => {
  const sc = { start_seconds: 10, end_seconds: 20, reveals: [{ at_seconds: 11 }, { at_seconds: 18.2 }] };
  const t = settledSeconds(sc, { crossfadeSeconds: XF });
  assert.ok(t >= 18.2, `must grab after the last reveal (got ${t})`);
  assert.ok(t <= 20 - (XF + 0.4), "and before the exit/crossfade tail");
});

test("settledSeconds: clamped inside the scene even when reveals crowd the end", () => {
  const sc = { start_seconds: 10, end_seconds: 12, reveals: [{ at_seconds: 11.9 }] };
  const t = settledSeconds(sc, { crossfadeSeconds: XF });
  assert.ok(t > 10 && t < 12, `stays inside the scene (got ${t})`);
});

test("hfClipLocalSeconds mirrors the compile-hyperframes window math (crossfade pull-back)", () => {
  const tl = timelineFixture();
  const fps = 30;
  // scene 0: no pull-back → fromFrame = F(1.5) = 45; abs 9.5s = frame 285 → local (285-45)/30 = 8s
  assert.equal(hfClipLocalSeconds(tl, 0, 9.5), 8);
  // scene 3: fromFrame = F(40) - 9 = 1191; abs 49s = frame 1470 → local (1470-1191)/30 = 9.3s
  assert.equal(hfClipLocalSeconds(tl, 3, 49), 9.3);
  // clamped into the clip: an abs past the scene end stays ≤ (durFrames-1)/fps
  const sc = tl.scenes[3];
  const durFrames = Math.round(sc.end_seconds * fps) - (Math.round(sc.start_seconds * fps) - 9);
  assert.ok(hfClipLocalSeconds(tl, 3, 99) <= (durFrames - 1) / fps);
  assert.equal(hfClipLocalSeconds(tl, 0, 0), 0, "never negative");
});

test("captionFreeSeconds: clear preferred passes through; covered preferred moves to the nearest gap", () => {
  const caps = timelineFixture().captions;
  assert.equal(captionFreeSeconds(caps, { from: 12, to: 24, preferred: 18.5 }), 18.5);
  const moved = captionFreeSeconds(caps, { from: 12, to: 24, preferred: 21 });
  assert.equal(moved, 18.5, "midpoint of the 18-19 gap");
  // wall-to-wall captions → no usable frame
  const wall = [{ start_seconds: 12, end_seconds: 24, words: [] }];
  assert.equal(captionFreeSeconds(wall, { from: 12, to: 24, preferred: 20 }), null);
});

test("pickCandidates: top-3 by score; hf scenes carry clip_local_s; remotion scene lands on a caption gap", () => {
  const cands = pickCandidates(timelineFixture());
  assert.deepEqual(cands.map((c) => c.scene_id), ["s1.0", "s4.0", "s2.0"]);
  assert.equal(cands[0].source, "hf-clip");
  assert.ok(typeof cands[0].clip_local_s === "number");
  const remo = cands[2];
  assert.equal(remo.source, "final-mp4");
  assert.equal(remo.timestamp_s, 18.5, "grab in the caption gap, not under a caption");
  assert.ok(cands.every((c) => c.scene_id !== "s5.0"), "CTA scene never a candidate");
});

test("pickCandidates: a remotion scene with NO caption gap is skipped — next-ranked scene takes the slot", () => {
  const tl = timelineFixture();
  tl.captions = [{ start_seconds: 12, end_seconds: 24, words: [] }];
  const cands = pickCandidates(tl);
  assert.deepEqual(cands.map((c) => c.scene_id), ["s1.0", "s4.0", "s3.0"]);
});

test("candidateRecords: schema-valid, chosen:false, numbered files", () => {
  const recs = candidateRecords(pickCandidates(timelineFixture()));
  assertValid(recs, "thumb_candidates.json");
  assert.deepEqual(recs.map((r) => r.file), ["images/thumb_candidate_1.png", "images/thumb_candidate_2.png", "images/thumb_candidate_3.png"]);
  assert.ok(recs.every((r) => r.chosen === false));
  assert.ok(recs.every((r) => Array.isArray(r.reasons) && r.reasons.length > 0), "score reasons persisted per candidate");
});

test("buildGrabCommand: 1280x720 single-frame grab at the exact second", () => {
  const { cmd, args } = buildGrabCommand({ ffmpeg: "ffmpeg", src: "in.mp4", atSeconds: 8, outFile: "out.png" });
  assert.equal(cmd, "ffmpeg");
  assert.ok(args.includes("-ss") && args[args.indexOf("-ss") + 1] === "8.000");
  assert.ok(args.includes("scale=1280:720"));
  assert.equal(args.at(-1), "out.png");
});

function stageContent(tmp, tl) {
  const cdir = path.join(tmp, "content", "099-test");
  fs.mkdirSync(path.join(cdir, "video", "hf"), { recursive: true });
  fs.writeFileSync(path.join(cdir, "timeline.json"), JSON.stringify(tl));
  for (const sc of tl.scenes) {
    if (sc.engine === "hyperframes") fs.writeFileSync(path.join(cdir, "video", "hf", `${sc.scene_id}.mp4`), "fake");
  }
  fs.writeFileSync(path.join(cdir, "video", "final.mp4"), "fake");
  return cdir;
}

// a spawn fake that "produces" the output file ffmpeg would have written
function fakeSpawn(calls) {
  return (cmd, args) => {
    calls.push({ cmd, args });
    const out = args.at(-1);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, "png");
    return { status: 0 };
  };
}

test("extractStills: hf candidates grab from the scene clip, remotion from final.mp4; existing stills skipped", async () => {
  await withTempDir(async (tmp) => {
    const tl = timelineFixture();
    const cdir = stageContent(tmp, tl);
    const candidates = pickCandidates(tl);
    const records = candidateRecords(candidates);
    const calls = [];
    extractStills({ root: tmp, cdir, candidates, records, spawn: fakeSpawn(calls) });
    assert.equal(calls.length, 3);
    assert.ok(calls[0].args.join(" ").includes(path.join("video", "hf", "s1.0.mp4")));
    assert.ok(calls[2].args.join(" ").includes(path.join("video", "final.mp4")));
    // idempotent: second run grabs nothing
    const again = [];
    extractStills({ root: tmp, cdir, candidates, records, spawn: fakeSpawn(again) });
    assert.equal(again.length, 0);
  });
});

test("extractStills: missing source fails loud (resumable, never silent)", async () => {
  await withTempDir(async (tmp) => {
    const tl = timelineFixture();
    const cdir = stageContent(tmp, tl);
    fs.rmSync(path.join(cdir, "video", "hf", "s1.0.mp4"));
    const candidates = pickCandidates(tl);
    const records = candidateRecords(candidates);
    assert.throws(() => extractStills({ root: tmp, cdir, candidates, records, spawn: fakeSpawn([]) }), /thumbnail source missing/);
  });
});

test("compositeFinals without logos: candidates copied 1:1 to final-ready PNGs (no browser spawn)", async () => {
  await withTempDir(async (tmp) => {
    const tl = timelineFixture();
    const cdir = stageContent(tmp, tl);
    const records = candidateRecords(pickCandidates(tl));
    for (const r of records) {
      fs.mkdirSync(path.dirname(path.join(cdir, r.file)), { recursive: true });
      fs.writeFileSync(path.join(cdir, r.file), "png");
    }
    const calls = [];
    compositeFinals({ root: tmp, cdir, records, spawn: fakeSpawn(calls) });
    assert.equal(calls.length, 0, "no spawn without logos");
    assert.ok(records.every((r) => fs.existsSync(path.join(cdir, r.final))));
  });
});

test("runThumbnails end-to-end: stills + finals + schema-valid thumb_candidates.json; idempotent", async () => {
  await withTempDir(async (tmp) => {
    const tl = timelineFixture();
    const cdir = stageContent(tmp, tl);
    const calls = [];
    const first = runThumbnails({ root: tmp, id: "099-test", spawn: fakeSpawn(calls) });
    assert.equal(first.skipped, false);
    assert.equal(first.records.length, 3);
    const onDisk = JSON.parse(fs.readFileSync(path.join(cdir, "thumb_candidates.json"), "utf8"));
    assertValid(onDisk, "thumb_candidates.json");
    assert.ok(onDisk.every((r) => fs.existsSync(path.join(cdir, r.file)) && fs.existsSync(path.join(cdir, r.final))));

    const second = runThumbnails({ root: tmp, id: "099-test", spawn: fakeSpawn([]) });
    assert.equal(second.skipped, true, "complete candidate set → no-op (pipeline contract)");
  });
});
