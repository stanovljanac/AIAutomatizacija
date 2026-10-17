// PATCH-SCENES — re-render one scene's frames and splice them into an existing final.mp4.
// The guarantees this file pins:
//   1. FRAME COUNT IS CONSERVED: the segments of a plan tile [0, totalFrames) with no gap/overlap.
//      Anything else desyncs every caption after the splice.
//   2. THE CUTS LAND ON KEYFRAMES: both splice points are keyframes of the base file, always, so the
//      untouched part is a STREAM COPY (no re-encode, no generation loss, no seam).
//   3. BLENDED BOUNDARIES ARE INCLUDED: a dissolve/push neighbour puts this scene's pixels outside
//      its own window, so the patched range has to cover them. A hard cut must NOT widen.
//   4. AUDIO IS NEVER TOUCHED: the render is --muted and the mux copies the base's audio stream.
//   5. ONE TIMEBASE, AND TIME IS VERIFIED: every segment is normalised to the base file's tbn, and
//      the result is checked on played duration + timebase, not only on frame count. Frame count
//      alone passed both broken 023 patches on 2026-08-24 (11331 frames, video dead at 1:04).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  affectedFrameRange, parseKeyframes, snapToKeyframes, planPatch, concatListBody, parseDecodedFrames,
  parseEncodedSeconds, parseVideoTimescale, runPatch,
  buildSegmentCutCommand, buildConcatCommand, buildMuxCommand, buildRemotionRenderCommand, buildKeyframeScanCommand,
} from "./patch-scenes.mjs";

const fps = 30;
const XF = 9;

/** A 4-scene timeline whose transition_out styles the caller chooses (undefined = unauthored cut). */
function timelineOf(styles = []) {
  return {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 20,
    crossfade_seconds: XF / fps,
    scenes: [
      { scene_id: "s1.0", template: "hook-card", start_seconds: 1.5, end_seconds: 5 },
      { scene_id: "s2.0", template: "bullet-steps", start_seconds: 5, end_seconds: 9 },
      { scene_id: "s3.0", template: "diagram", start_seconds: 9, end_seconds: 14 },
      { scene_id: "s4.0", template: "cta-card", start_seconds: 14, end_seconds: 17.5 },
    ].map((sc, i) => (styles[i] === undefined ? sc : { ...sc, transition_out: styles[i] })),
    captions: [],
  };
}

// ── affectedFrameRange ───────────────────────────────────────────────────────────────────────────

test("affectedFrameRange: a hard-cut scene owns exactly its own window", () => {
  // s2.0 under all-cuts: [5s, 9s) = [150, 270). No neighbour blends into it.
  const r = affectedFrameRange(timelineOf(["cut", "cut", "cut", "cut"]), ["s2.0"]);
  assert.deepEqual(r, { from: 150, to: 270 });
});

test("affectedFrameRange: scene 0's cross-blend out of the intro is already inside its own window", () => {
  // s1.0 starts at 1.5s = frame 45. The INTRO is the side that is extended forward, so scene 0's
  // window does not move — the blend happens in frames the scene already owns.
  const r = affectedFrameRange(timelineOf(["cut"]), ["s1.0"]);
  assert.deepEqual(r, { from: 45, to: 150 });
});

test("affectedFrameRange: a dissolve pulls the INCOMING scene back, so the range still never leaks", () => {
  // s1.0 dissolves out, so s2.0's own window already starts xf frames early — no extra widening.
  // s2.0 dissolves out too, but that pulls s3.0 back INTO s2.0's window, not s2.0 past its end.
  const r = affectedFrameRange(timelineOf(["dissolve", "dissolve", "cut", "cut"]), ["s2.0"]);
  assert.equal(r.from, 150 - XF, "s2.0's window itself starts early — that is sceneWindow's doing");
  assert.equal(r.to, 270, "s2.0's pixels stop at its alignment mark; s3.0 blending over it is s3.0's frames");
});

test("affectedFrameRange: match/morph/carry compile to a cut and never widen the range", () => {
  for (const style of ["match", "morph", "carry"]) {
    const r = affectedFrameRange(timelineOf([style, style, style, style]), ["s2.0"]);
    assert.deepEqual(r, { from: 150, to: 270 }, `${style} must not widen`);
  }
});

test("affectedFrameRange: several scenes collapse to one spanning range", () => {
  const r = affectedFrameRange(timelineOf(["cut", "cut", "cut", "cut"]), ["s2.0", "s3.0"]);
  assert.deepEqual(r, { from: 150, to: 420 });
});

test("affectedFrameRange: the LAST scene ends on its own mark — the outro is pulled back into it", () => {
  const r = affectedFrameRange(timelineOf([]), ["s4.0"]);
  assert.deepEqual(r, { from: 420, to: 525 });
});

test("affectedFrameRange: an unknown scene_id is a hard error, never a silent no-op", () => {
  assert.throws(() => affectedFrameRange(timelineOf([]), ["s9.9"]), /no such scene_id/);
});

// ── parseKeyframes ───────────────────────────────────────────────────────────────────────────────

test("parseKeyframes: reads the keyframe indices out of a real showinfo log", () => {
  const log = [
    "[Parsed_showinfo_0 @ 0x1] n:   0 pts:      0 pts_time:0 duration:512 fmt:yuvj420p i:P iskey:1 type:I checksum:19115EEF",
    "[Parsed_showinfo_0 @ 0x1] n:   1 pts:    512 pts_time:0.0333 duration:512 fmt:yuvj420p i:P iskey:0 type:P checksum:AAAA",
    "[Parsed_showinfo_0 @ 0x1] n: 392 pts: 200704 pts_time:13.0666 duration:512 fmt:yuvj420p i:P iskey:1 type:I checksum:FDB1126B",
  ].join("\n");
  assert.deepEqual(parseKeyframes(log), [0, 392]);
});

test("parseKeyframes: de-duplicates and sorts; empty input is an empty list", () => {
  const line = (n, key) => `n: ${n} pts:0 iskey:${key} type:${key ? "I" : "P"}`;
  assert.deepEqual(parseKeyframes([line(9, 1), line(2, 1), line(9, 1)].join("\n")), [2, 9]);
  assert.deepEqual(parseKeyframes(""), []);
  assert.deepEqual(parseKeyframes(null), []);
});

// ── snapToKeyframes ──────────────────────────────────────────────────────────────────────────────

test("snapToKeyframes: widens outward to the enclosing keyframes, never inward", () => {
  const kf = [0, 250, 392, 642, 892];
  assert.deepEqual(snapToKeyframes(kf, { from: 300, to: 400 }, 1000), { startFrame: 250, endFrame: 642 });
});

test("snapToKeyframes: an exact keyframe range is left alone (the scene-cut case)", () => {
  // The 023 case: s1.0 is [36, 392) and 392 IS a keyframe, so nothing is widened at the end.
  assert.deepEqual(snapToKeyframes([0, 250, 392, 642], { from: 36, to: 392 }, 11331), { startFrame: 0, endFrame: 392 });
});

test("snapToKeyframes: no keyframe after the range means the patch runs to the end of the file", () => {
  assert.deepEqual(snapToKeyframes([0, 250], { from: 260, to: 300 }, 300), { startFrame: 250, endFrame: 300 });
});

test("snapToKeyframes: a range past the end of the video is a hard error", () => {
  assert.throws(() => snapToKeyframes([0], { from: 0, to: 501 }, 500), /past the end/);
});

// ── planPatch ────────────────────────────────────────────────────────────────────────────────────

test("planPatch: the segments TILE the whole video — no gap, no overlap, no lost frame", () => {
  const plan = planPatch({ timeline: timelineOf([]), sceneIds: ["s2.0"], keyframes: [0, 100, 150, 270, 400], totalFrames: 600 });
  let cursor = 0;
  for (const seg of plan.segments) {
    assert.equal(seg.fromFrame, cursor, `segment ${seg.name} must start where the previous one ended`);
    cursor = seg.toFrame;
  }
  assert.equal(cursor, plan.totalFrames, "the segments must reach the end of the video");
  assert.equal(plan.patchedFrames + plan.copiedFrames, plan.totalFrames);
});

test("planPatch: exactly one segment is re-rendered; the rest are stream-copied from the base", () => {
  const plan = planPatch({ timeline: timelineOf([]), sceneIds: ["s2.0"], keyframes: [0, 150, 270, 400], totalFrames: 600 });
  assert.equal(plan.segments.filter((s) => s.source === "render").length, 1);
  assert.deepEqual(plan.segments.map((s) => s.name), ["head", "patch", "tail"]);
  assert.equal(plan.patchedFrames, 120, "only s2.0's own 120 frames are re-rendered");
  assert.equal(plan.copiedFrames, 480);
});

test("planPatch: patching the FIRST scene drops the head segment (the patch starts the file)", () => {
  const plan = planPatch({ timeline: timelineOf([]), sceneIds: ["s1.0"], keyframes: [0, 150, 392], totalFrames: 600 });
  assert.deepEqual(plan.segments.map((s) => s.name), ["patch", "tail"]);
  assert.equal(plan.startFrame, 0);
});

test("planPatch: patching the LAST scene drops the tail segment", () => {
  const plan = planPatch({ timeline: timelineOf([]), sceneIds: ["s4.0"], keyframes: [0, 150, 400], totalFrames: 534 });
  assert.deepEqual(plan.segments.map((s) => s.name), ["head", "patch"]);
  assert.equal(plan.endFrame, 534);
});

test("planPatch: the real 023 s1.0 case re-renders 3.5% of the cut", () => {
  // The measured shape of content/023-attention: s1.0 is [48, 392) with a `carry` (= hard cut) exit,
  // 11331 frames total, and x264 put a keyframe on every scene cut — including 392 itself.
  const timeline = {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    crossfade_seconds: XF / fps,
    scenes: [
      { scene_id: "s1.0", template: "hook-card", start_seconds: 1.6, end_seconds: 13.0667, transition_out: "carry" },
      { scene_id: "s2.0", template: "term-highlight", start_seconds: 13.0667, end_seconds: 30.5667, transition_out: "carry" },
    ],
  };
  const plan = planPatch({ timeline, sceneIds: ["s1.0"], keyframes: [0, 250, 392, 642, 892, 1070], totalFrames: 11331 });
  assert.equal(plan.startFrame, 0, "no keyframe before frame 48, so the patch starts the file");
  assert.equal(plan.endFrame, 392, "s1.0's hard cut IS a keyframe — nothing past it is re-rendered");
  assert.equal(plan.patchedFrames, 392);
  assert.ok(plan.patchedFrames / plan.totalFrames < 0.05, "a single hook scene must cost under 5% of a full render");
});

// ── the commands ─────────────────────────────────────────────────────────────────────────────────

test("buildRemotionRenderCommand: an INCLUSIVE --frames range, muted, at concurrency 1", () => {
  const { cmd, args } = buildRemotionRenderCommand({ outId: "023-attention", startFrame: 0, endFrame: 392, out: "out/x.mp4" });
  assert.equal(cmd, "npx");
  assert.ok(args.includes("--frames=0-391"), "Remotion's range is inclusive — endFrame-1 is the last frame");
  assert.ok(args.includes("--muted"), "the segment must carry no audio: the base file's audio is re-used untouched");
  assert.ok(args.includes("--props=props/023-attention.json"));
  assert.ok(args.includes("--concurrency=1"), "26 OffthreadVideo sources OOM the Chrome tab above this");
});

test("buildRemotionRenderCommand: the segment is encoded at the BASE file's CRF when it is known", () => {
  const withCrf = buildRemotionRenderCommand({ outId: "x", startFrame: 0, endFrame: 10, out: "o.mp4", crf: 16 }).args;
  assert.ok(withCrf.includes("--crf=16"), "the patched stretch is encoded at the master's own quality");
  const without = buildRemotionRenderCommand({ outId: "x", startFrame: 0, endFrame: 10, out: "o.mp4" }).args;
  assert.ok(!without.some((a) => a.startsWith("--crf")), "no CRF known → remotion.config.ts decides");
});

test("buildSegmentCutCommand: a frame-exact video-only STREAM COPY", () => {
  const { args } = buildSegmentCutCommand({ ffmpeg: "ffmpeg", base: "b.mp4", fromFrame: 392, toFrame: 11331, fps, timescale: 15360, out: "t.mp4" });
  const i = args.indexOf("-c");
  assert.equal(args[i + 1], "copy", "the untouched part is never re-encoded");
  assert.ok(args.includes("-frames:v"), "an exact frame count, not -t (which rounds against packet duration)");
  assert.equal(args[args.indexOf("-frames:v") + 1], String(11331 - 392));
  assert.ok(args.indexOf("-ss") < args.indexOf("-i"), "input seek, so the copy starts at the keyframe itself");
  assert.ok(args.includes("0:v"), "video only — audio is muxed separately from the base");
});

test("buildSegmentCutCommand: a cut starting at frame 0 needs no seek at all", () => {
  const { args } = buildSegmentCutCommand({ ffmpeg: "ffmpeg", base: "b.mp4", fromFrame: 0, toFrame: 392, fps, timescale: 15360, out: "h.mp4" });
  assert.ok(!args.includes("-ss"));
});

test("buildMuxCommand: takes video from the splice and AUDIO FROM THE BASE, both copied", () => {
  const { args } = buildMuxCommand({ ffmpeg: "ffmpeg", videoFile: "v.mp4", baseFile: "base.mp4", timescale: 15360, out: "o.mp4" });
  assert.equal(args[args.indexOf("-i") + 1], "v.mp4");
  assert.ok(args.includes("0:v:0") && args.includes("1:a:0"), "video from input 0 (spliced), audio from input 1 (base)");
  assert.equal(args[args.indexOf("-c") + 1], "copy", "audio is copied, never re-encoded or re-timed");
});

test("buildConcatCommand / buildKeyframeScanCommand: demuxer concat with copy; scan writes no file", () => {
  const concat = buildConcatCommand({ ffmpeg: "ffmpeg", listFile: "l.txt", timescale: 15360, out: "o.mp4" });
  assert.ok(concat.args.includes("concat") && concat.args.includes("copy"));
  const scan = buildKeyframeScanCommand({ ffmpeg: "ffmpeg", base: "b.mp4" });
  assert.ok(scan.args.includes("showinfo"));
  assert.equal(scan.args[scan.args.indexOf("-f") + 1], "null", "the scan decodes only — it must never write a file");
});

test("concatListBody: forward slashes and escaped quotes, one directive per part", () => {
  const body = concatListBody(["C:\\a\\head.mp4", "C:/a/pa'tch.mp4"]);
  assert.equal(body.split("\n").filter(Boolean).length, 2);
  assert.ok(body.includes("file 'C:/a/head.mp4'"));
  assert.ok(body.includes("pa'\\''tch.mp4"), "a quote in a path must be escaped for the concat demuxer");
});

test("parseDecodedFrames: takes the LAST frame= counter ffmpeg reports", () => {
  assert.equal(parseDecodedFrames("frame=  100 fps=0\rframe= 11331 fps=250 time=00:06:17"), 11331);
  assert.equal(parseDecodedFrames("no counters here"), null);
});

test("parseEncodedSeconds: takes the LAST time= counter, as seconds", () => {
  assert.equal(parseEncodedSeconds("frame= 100 time=00:00:03.33\rframe=11331 time=00:06:17.70 bitrate=N/A"), 377.7);
  assert.equal(parseEncodedSeconds("frame=11331 time=00:01:04.50 speed=12x"), 64.5, "the broken 023 splice");
  assert.equal(parseEncodedSeconds("no counters here"), null);
});

test("parseVideoTimescale: reads tbn off the VIDEO stream line, expanding ffmpeg's k", () => {
  const line = (tbn) => `  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuvj420p, 1920x1080 [SAR 1:1 DAR 16:9], 4274 kb/s, 30 fps, 30 tbr, ${tbn} tbn (default)`;
  const audio = "  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 317 kb/s (default)";
  assert.equal(parseVideoTimescale([line("15360"), audio].join("\n")), 15360, "our final.mp4");
  assert.equal(parseVideoTimescale([line("90k"), audio].join("\n")), 90000, "what Remotion writes — abbreviated");
  assert.equal(parseVideoTimescale(audio), null, "an audio-only log pins nothing");
  assert.equal(parseVideoTimescale(""), null);
});

// ── ONE TIMEBASE (the 023 v1.1/v1.2 regression) ──────────────────────────────────────────────────

test("every ffmpeg step pins the timebase — the concat demuxer never rescales, so we must", () => {
  const cut = buildSegmentCutCommand({ ffmpeg: "ffmpeg", base: "b.mp4", fromFrame: 0, toFrame: 392, fps, timescale: 15360, out: "p.mp4" });
  const concat = buildConcatCommand({ ffmpeg: "ffmpeg", listFile: "l.txt", timescale: 15360, out: "s.mp4" });
  const mux = buildMuxCommand({ ffmpeg: "ffmpeg", videoFile: "s.mp4", baseFile: "b.mp4", timescale: 15360, out: "o.mp4" });
  for (const { args } of [cut, concat, mux]) {
    assert.equal(args[args.indexOf("-video_track_timescale") + 1], "15360");
  }
  assert.ok(!concat.args.includes("+genpts"), "genpts sat on the OUTPUT, where it is a no-op — it never fixed anything");
});

test("a missing or nonsense timescale is a HARD ERROR, never a silently unpinned timebase", () => {
  for (const timescale of [undefined, null, 0, -1, 1.5, "15360"]) {
    assert.throws(() => buildSegmentCutCommand({ ffmpeg: "f", base: "b.mp4", fromFrame: 0, toFrame: 9, fps, timescale, out: "o.mp4" }), /timescale must be a positive integer/);
    assert.throws(() => buildConcatCommand({ ffmpeg: "f", listFile: "l.txt", timescale, out: "o.mp4" }), /timescale must be a positive integer/);
    assert.throws(() => buildMuxCommand({ ffmpeg: "f", videoFile: "v.mp4", baseFile: "b.mp4", timescale, out: "o.mp4" }), /timescale must be a positive integer/);
  }
});

// ── runPatch's verify gate ───────────────────────────────────────────────────────────────────────

/** A repo-shaped tmp dir: props + an already-rendered patch segment + content/<id>/video. */
function patchFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "patch-scenes-"));
  fs.mkdirSync(path.join(root, "templates", "remotion", "props"), { recursive: true });
  fs.mkdirSync(path.join(root, "templates", "remotion", "out"), { recursive: true });
  fs.writeFileSync(path.join(root, "templates", "remotion", "props", "vid.json"), "{}");
  fs.writeFileSync(path.join(root, "templates", "remotion", "out", "vid-patch-0-392.mp4"), "segment");
  const cdir = path.join(root, "content", "vid");
  fs.mkdirSync(path.join(cdir, "video"), { recursive: true });
  return { root, cdir };
}

/** The 023 shape: scene 1 patched, so there is NO head and the Remotion part is first in the concat. */
const PLAN_023 = {
  startFrame: 0, endFrame: 392, totalFrames: 11331, patchedFrames: 392, copiedFrames: 10939,
  segments: [
    { name: "patch", fromFrame: 0, toFrame: 392, source: "render" },
    { name: "tail", fromFrame: 392, toFrame: 11331, source: "base" },
  ],
};

/** An ffmpeg `-v info` verify log: what the gate reads back off the finished file. */
function verifyLog({ frames = 11331, time = "00:06:17.70", tbn = "15360" } = {}) {
  return [
    `  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuvj420p, 1920x1080, 30 fps, 30 tbr, ${tbn} tbn (default)`,
    `frame=${frames} fps=250 q=-0.0 Lsize=N/A time=${time} bitrate=N/A speed=8.5x`,
  ].join("\n");
}

function spyOn(log) {
  const calls = [];
  const spawn = (cmd, args) => { calls.push([cmd, ...args].join(" ")); return { status: 0, stdout: "", stderr: log }; };
  return { spawn, calls };
}

function runFixture(log) {
  const { root, cdir } = patchFixture();
  const { spawn, calls } = spyOn(log);
  const out = path.join(cdir, "video", "final-v1.2.mp4");
  const go = () => runPatch({ root, cdir, outId: "vid", plan: PLAN_023, fps, timescale: 15360, base: path.join(cdir, "video", "final.mp4"), out, spawn });
  return { go, calls, cdir, out };
}

test("runPatch: a clean splice reports frames AND seconds AND timebase, and clears its work dir", () => {
  const { go, calls, cdir } = runFixture(verifyLog());
  const res = go();
  assert.equal(res.frames, 11331);
  assert.equal(res.seconds, 377.7);
  assert.equal(res.timescale, 15360);
  assert.equal(fs.existsSync(path.join(cdir, "video", ".patch")), false, "a verified splice cleans up after itself");
  const pinned = calls.filter((c) => c.includes("-video_track_timescale 15360"));
  assert.equal(pinned.length, 4, "both segment cuts, the concat and the mux are all pinned to the base timebase");
});

test("runPatch: REJECTS the 023 regression — every frame present, video dead at 1:04", () => {
  // The exact file that shipped on 2026-08-23: 11331/11331 frames, so the old frame-count-only gate
  // passed it, while the tail's 15360-tick stamps were being read as 90000.
  const { go, cdir } = runFixture(verifyLog({ time: "00:01:04.50", tbn: "90k" }));
  assert.throws(go, (err) => {
    assert.match(err.message, /SPLICE VERIFY FAILED/);
    assert.match(err.message, /plays 64\.50s of video, expected 377\.70s/);
    assert.match(err.message, /carries 90000 tbn, expected the base file's 15360/);
    return true;
  });
  assert.equal(fs.existsSync(path.join(cdir, "video", ".patch")), true, "a failed splice is LEFT for inspection");
});

test("runPatch: REJECTS a mid-file patch that plays slow, even at the right tbn", () => {
  // The other direction of the same bug (head first, patch second): the patched scene runs 5.86x
  // slow, the frame count is still perfect, and the timebase of the output looks right.
  const { go } = runFixture(verifyLog({ time: "00:37:07.00" }));
  assert.throws(go, /plays 2227\.00s of video, expected 377\.70s/);
});

test("runPatch: an unreadable duration fails the gate — it never assumes the file is fine", () => {
  const { go } = runFixture("  Stream #0:0: Video: h264, 30 fps, 30 tbr, 15360 tbn\nframe=11331 no time here");
  assert.throws(go, /an unreadable duration/);
});

test("runPatch: a lost or gained frame is still a hard failure", () => {
  const { go } = runFixture(verifyLog({ frames: 11330, time: "00:06:17.67" }));
  assert.throws(go, /decodes 11330 video frames, expected 11331/);
});
