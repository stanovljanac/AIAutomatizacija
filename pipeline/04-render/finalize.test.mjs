// finalize.mjs (2B, D-074) — the 1440p upload file from the approved 1080p master.
// Pure parts first; the end-to-end run uses the vendored ffmpeg on a tiny generated clip and skips
// (never fails) when ffmpeg is absent, so a fresh clone still goes green.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withTempDir } from "../shared/testkit/index.mjs";
import { MASTER_CRF, MASTER_PRESET } from "../shared/lib/encode.mjs";
import {
  DEFAULT_UPSCALE,
  buildUpscaleArgs,
  finalizeDims,
  finalizeVideo,
  isShortId,
  parseMd5,
  parseVideoStream,
  planFinalize,
  verifyUpscale,
} from "./finalize.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const VENDORED = path.join(ROOT, "templates", "hyperframes", ".bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
const FFMPEG = fs.existsSync(VENDORED) ? VENDORED : null;

// The header of 025's real master (2026-10-16).
const HEADER_025 =
  "  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuvj420p(pc, bt470bg/unknown/unknown, progressive), " +
  "1920x1080 [SAR 1:1 DAR 16:9], 20751 kb/s, 30 fps, 30 tbr, 15360 tbn (default)\n" +
  "  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 317 kb/s (default)";

const LONG = { width: 1920, height: 1080 };
const QHD = { width: 2560, height: 1440 };

test("isShortId follows build-props: the last path segment decides", () => {
  assert.equal(isShortId("025-always-on-agents/short"), true);
  assert.equal(isShortId("002-short"), true);
  assert.equal(isShortId("025-always-on-agents"), false);
});

test("finalizeDims: the long goes to 1440p by default, the Short stays as rendered", () => {
  assert.deepEqual(DEFAULT_UPSCALE.long, QHD);
  assert.deepEqual(finalizeDims({ render: { long: LONG } }, { vertical: false }), { renderDims: LONG, target: QHD });
  assert.equal(finalizeDims({ render: {} }, { vertical: true }).target, null);
  const on = { render: { upscale: { long: QHD, short: { width: 1440, height: 2560 } } } };
  assert.deepEqual(finalizeDims(on, { vertical: true }).target, { width: 1440, height: 2560 });
  assert.equal(finalizeDims({ render: { upscale: { long: null } } }, { vertical: false }).target, null, "null switches it off");
});

test("parseVideoStream reads size, pixel format and colour tags from a real master header", () => {
  assert.deepEqual(parseVideoStream(HEADER_025), { width: 1920, height: 1080, pixFmt: "yuvj420p", range: "pc", colorspace: "bt470bg" });
  const plain = "Stream #0:0: Video: h264 (High), yuv420p(progressive), 2560x1440, 30 fps, 30 tbr, 15360 tbn";
  assert.deepEqual(parseVideoStream(plain), { width: 2560, height: 1440, pixFmt: "yuv420p", range: null, colorspace: null });
  assert.equal(parseVideoStream("no video here"), null);
});

test("planFinalize: a fresh render is moved aside and upscaled", () => {
  const base = { target: QHD, renderDims: LONG, finalMtime: 2, masterMtime: 0 };
  assert.deepEqual(planFinalize({ ...base, finalInfo: LONG, masterExists: false }), { action: "upscale" });
});

test("planFinalize is idempotent, redoes after a patch, and is off without a target", () => {
  const base = { target: QHD, renderDims: LONG };
  assert.equal(planFinalize({ ...base, finalInfo: QHD, finalMtime: 5, masterExists: true, masterMtime: 4 }).action, "current");
  assert.equal(planFinalize({ ...base, finalInfo: QHD, finalMtime: 5, masterExists: true, masterMtime: 6 }).action, "redo", "a patched master is newer");
  assert.equal(planFinalize({ ...base, finalInfo: null, masterExists: true }).action, "redo", "a failed upscale is resumable");
  assert.equal(planFinalize({ ...base, target: null, finalInfo: LONG }).action, "off");
  assert.equal(planFinalize({ target: LONG, renderDims: LONG, finalInfo: LONG }).action, "off", "a target equal to the render size does nothing");
  assert.match(planFinalize({ ...base, finalInfo: QHD, finalMtime: 1, masterExists: false }).note, /patching needs/);
});

test("planFinalize never clobbers an older master or a file it does not recognise", () => {
  const base = { target: QHD, renderDims: LONG, finalMtime: 9, masterMtime: 1 };
  assert.throws(() => planFinalize({ ...base, finalInfo: LONG, masterExists: true }), /--replace-master/);
  assert.equal(planFinalize({ ...base, finalInfo: LONG, masterExists: true, replaceMaster: true }).action, "upscale");
  assert.throws(() => planFinalize({ ...base, finalInfo: { width: 1280, height: 720 }, masterExists: false }), /refusing/);
  assert.throws(() => planFinalize({ ...base, finalInfo: null, masterExists: false }), /render the cut first/);
});

test("buildUpscaleArgs: lanczos at the master CRF, source colour kept, audio copied, timebase kept", () => {
  const args = buildUpscaleArgs({ input: "m.mp4", out: "o.mp4", target: QHD, source: parseVideoStream(HEADER_025), timescale: 15360 });
  const after = (flag) => args[args.indexOf(flag) + 1];
  assert.equal(after("-vf"), "scale=2560:1440:flags=lanczos");
  assert.equal(after("-crf"), String(MASTER_CRF));
  assert.equal(after("-preset"), MASTER_PRESET);
  assert.equal(after("-pix_fmt"), "yuvj420p", "no full→limited range conversion");
  assert.equal(after("-color_range"), "pc");
  assert.equal(after("-colorspace"), "bt470bg");
  assert.equal(after("-video_track_timescale"), "15360");
  assert.equal(after("-c:a"), "copy");
  assert.equal(args.at(-1), "o.mp4");
  assert.equal(buildUpscaleArgs({ input: "m", out: "o", target: QHD }).includes("-pix_fmt"), false, "unknown source format → ffmpeg's default");
});

test("verifyUpscale passes an exact copy and names every mismatch", () => {
  const master = { frames: 300, seconds: 10, timescale: 15360, audioMd5: "a".repeat(32) };
  const good = { info: QHD, ...master };
  assert.deepEqual(verifyUpscale({ master, out: good, target: QHD }), []);
  const bad = verifyUpscale({ master, out: { info: LONG, frames: 299, seconds: 9.5, timescale: 90000, audioMd5: "b".repeat(32) }, target: QHD });
  assert.equal(bad.length, 5);
  assert.equal(parseMd5("MD5=0123456789abcdef0123456789abcdef\n"), "0123456789abcdef0123456789abcdef");
  assert.equal(parseMd5("nothing"), null);
});

/** A 1 s clip at 64x36 shaped like a Remotion master: full-range yuvj420p, 15360 tbn, AAC audio. */
function makeMaster(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const r = spawnSync(FFMPEG, [
    "-hide_banner", "-v", "error",
    "-f", "lavfi", "-i", "testsrc2=size=64x36:rate=30:duration=1",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=1",
    "-c:v", "libx264", "-pix_fmt", "yuvj420p", "-crf", "18", "-video_track_timescale", "15360",
    "-c:a", "aac", "-shortest", "-y", file,
  ], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
}

const TINY = { render: { fps: 30, long: { width: 64, height: 36 }, upscale: { long: { width: 128, height: 72 }, short: null } } };

test("finalizeVideo: master moved aside, upload file upscaled + verified, second run is a no-op", { skip: !FFMPEG }, async () => {
  await withTempDir(async (root) => {
    const final = path.join(root, "content", "999-t", "video", "final.mp4");
    const master = path.join(root, "content", "999-t", "render", "master.mp4");
    makeMaster(final);
    const original = fs.readFileSync(final);

    const res = finalizeVideo({ root, id: "999-t", config: TINY, ffmpeg: FFMPEG });
    assert.equal(res.action, "upscale");
    assert.ok(fs.readFileSync(master).equals(original), "the approved cut is kept byte for byte as the master");
    const head = spawnSync(FFMPEG, ["-hide_banner", "-i", final], { encoding: "utf8" }).stderr;
    assert.deepEqual(parseVideoStream(head), { width: 128, height: 72, pixFmt: "yuvj420p", range: "pc", colorspace: null });
    assert.match(head, /15360 tbn/);
    assert.deepEqual(fs.readdirSync(path.dirname(final)), ["final.mp4"], "video/ still holds ONE file");

    assert.equal(finalizeVideo({ root, id: "999-t", config: TINY, ffmpeg: FFMPEG }).action, "current");
    // A patch lands on the master → the upload file is rebuilt from it.
    const later = new Date(Date.now() + 60_000);
    fs.utimesSync(master, later, later);
    assert.equal(finalizeVideo({ root, id: "999-t", config: TINY, ffmpeg: FFMPEG }).action, "redo");
  });
});

test("finalizeVideo --dry-run touches nothing; a format with no target is off", { skip: !FFMPEG }, async () => {
  await withTempDir(async (root) => {
    const final = path.join(root, "content", "999-t", "video", "final.mp4");
    makeMaster(final);
    assert.equal(finalizeVideo({ root, id: "999-t", config: TINY, ffmpeg: FFMPEG, dryRun: true }).action, "upscale");
    assert.equal(fs.existsSync(path.join(root, "content", "999-t", "render", "master.mp4")), false);
    const off = { render: { ...TINY.render, upscale: { long: null } } };
    assert.equal(finalizeVideo({ root, id: "999-t", config: off, ffmpeg: FFMPEG }).action, "off");
  });
});
