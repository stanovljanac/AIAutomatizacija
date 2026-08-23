import test from "node:test";
import assert from "node:assert/strict";
import { buildFrameCommand, frameSource, ANALYSIS_SIZE } from "./frame-gate.mjs";

const timeline = {
  format: { fps: 30 },
  crossfade_seconds: 0,
  scenes: [
    { scene_id: "s1.0", engine: "hyperframes", start_seconds: 0, end_seconds: 8, reveals: [] },
    { scene_id: "s2.0", engine: "remotion", start_seconds: 8, end_seconds: 20, reveals: [] },
  ],
  captions: [
    { start_seconds: 8.0, end_seconds: 12.0 },
    { start_seconds: 13.5, end_seconds: 19.9 },
  ],
};

test("buildFrameCommand asks ffmpeg for ONE raw grayscale frame at the analysis size", () => {
  const { cmd, args } = buildFrameCommand({ ffmpeg: "ffmpeg", src: "a.mp4", atSeconds: 4.25, width: 960, height: 540 });
  assert.equal(cmd, "ffmpeg");
  const joined = args.join(" ");
  assert.match(joined, /-ss 4\.25/);
  assert.match(joined, /-frames:v 1/);
  assert.match(joined, /scale=960:540/);
  assert.match(joined, /-pix_fmt gray/);
  assert.match(joined, /-f rawvideo/);
  assert.equal(args[args.length - 1], "-", "must write to stdout, never a temp file");
});

test("buildFrameCommand clamps a negative seek to 0", () => {
  const { args } = buildFrameCommand({ ffmpeg: "ffmpeg", src: "a.mp4", atSeconds: -3, width: 960, height: 540 });
  assert.equal(args[args.indexOf("-ss") + 1], "0");
});

test("a hyperframes scene is sampled from its own SILENT clip, so the frame is caption-free", () => {
  const got = frameSource(timeline, 0);
  assert.match(got.src, /video[\\/]hf[\\/]s1\.0\.mp4$/);
  assert.equal(got.captioned, false);
  assert.ok(got.at > 0 && got.at < 8, `clip-local seconds expected, got ${got.at}`);
});

test("a remotion scene is sampled from final.mp4 inside a caption GAP", () => {
  const got = frameSource(timeline, 1);
  assert.match(got.src, /video[\\/]final\.mp4$/);
  assert.equal(got.captioned, false);
  assert.ok(got.at > 12.0 && got.at < 13.5, `expected the 12.0-13.5s caption gap, got ${got.at}`);
});

test("a fully-captioned scene is still measured, and flagged rather than skipped", () => {
  // Skipping would let the plainest scenes through unmeasured — the exact hole the gate exists to close.
  const covered = {
    ...timeline,
    captions: [{ start_seconds: 8, end_seconds: 20 }],
  };
  const got = frameSource(covered, 1);
  assert.equal(got.captioned, true);
  assert.ok(got.at >= 8 && got.at <= 20);
});

test("the analysis size is fixed per orientation — the floors are calibrated to it", () => {
  assert.deepEqual(ANALYSIS_SIZE.long, { width: 960, height: 540 });
  assert.deepEqual(ANALYSIS_SIZE.portrait, { width: 540, height: 960 });
});
