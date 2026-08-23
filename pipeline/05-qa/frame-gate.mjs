#!/usr/bin/env node
/**
 * FRAME GATE — measure every scene's settled frame and fail the render when a scene is plain,
 * empty, or too small in the frame. The forcing function behind MOTION_SPEC §0/§10, added because
 * the owner rejected 021 and 022 for scenes that "look too simple, plain and generic" while every
 * prose rule about filling the stage sat unchecked (2026-08-22).
 *
 * The measurement and its calibration live in lib/ink-coverage.mjs (pure, unit-tested). This file
 * only decides WHICH frame to measure and reports the verdict.
 *
 * Frame choice mirrors 04b-thumbnails exactly, and for the same reason: a scene must be judged on
 * its SETTLED frame (after the last enter-beat, before the exit tail), and the frame must be
 * caption-free, since burned-in captions are not scene content.
 *   - hyperframes scenes → the scene's own silent clip video/hf/<sceneId>.mp4 (caption-free by
 *     construction), seeked with the shared sceneWindow math.
 *   - everything else    → video/final.mp4 at a timestamp inside a caption GAP; when the scene has
 *     no caption gap the frame is measured anyway and flagged `captioned:true`, because skipping
 *     scenes would let the plainest ones through unmeasured.
 *
 * CLI:
 *   node pipeline/05-qa/frame-gate.mjs <id> [--json] [--warn-only] [--video <path>]
 * Exit codes: 0 all scenes clear · 1 at least one scene failed · 2 usage/IO error.
 * Output: content/<id>/frame-gate.report.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { settledSeconds, hfClipLocalSeconds, captionFreeSeconds, ffmpegPath } from "../04b-thumbnails/extract.mjs";
import { measureFrame, gateFrame } from "./lib/ink-coverage.mjs";

/**
 * The floors are calibrated at this size and are meaningless at any other, because a flat shape's
 * detail contribution is its perimeter — shrink the frame and every blank fill starts scoring as
 * texture. Never make this configurable without re-running the calibration.
 */
export const ANALYSIS_SIZE = { long: { width: 960, height: 540 }, portrait: { width: 540, height: 960 } };

/** ffmpeg argv for one raw grayscale frame grab. Pure — isolated so the flags stay testable. */
export function buildFrameCommand({ ffmpeg, src, atSeconds, width, height }) {
  return {
    cmd: ffmpeg,
    args: [
      "-loglevel", "error",
      "-ss", String(Math.max(0, atSeconds)),
      "-i", src,
      "-frames:v", "1",
      "-vf", `scale=${width}:${height}`,
      "-pix_fmt", "gray",
      "-f", "rawvideo",
      "-",
    ],
  };
}

/**
 * Where to sample scene `i` from, and at what time. Pure — returns { src, at, captioned }.
 * `src` is relative to the content dir so the decision is testable without files on disk.
 */
export function frameSource(timeline, i, { crossfadeSeconds = 0 } = {}) {
  const scene = timeline.scenes[i];
  const abs = settledSeconds(scene, { crossfadeSeconds });
  if (scene.engine === "hyperframes") {
    return { src: join("video", "hf", `${scene.scene_id}.mp4`), at: hfClipLocalSeconds(timeline, i, abs), captioned: false };
  }
  const gap = captionFreeSeconds(timeline.captions ?? [], {
    from: scene.start_seconds,
    to: scene.end_seconds - crossfadeSeconds,
    preferred: abs,
  });
  return { src: join("video", "final.mp4"), at: gap ?? abs, captioned: gap == null };
}

/** Grab one frame and measure it. Returns null when the source cannot be read. */
function measureAt({ ffmpeg, src, at, width, height, spawn }) {
  const { cmd, args } = buildFrameCommand({ ffmpeg, src, atSeconds: at, width, height });
  const res = spawn(cmd, args, { maxBuffer: 1 << 28 });
  if (res.status !== 0 || !res.stdout || res.stdout.length < width * height) return null;
  return measureFrame(res.stdout, { width, height });
}

/** Run the gate over one video id. Returns the report object. */
export function runFrameGate({ root, id, spawn = spawnSync, videoOverride = null }) {
  const cdir = join(root, "content", id);
  const timeline = JSON.parse(readFileSync(join(cdir, "timeline.json"), "utf8"));
  const script = JSON.parse(readFileSync(join(cdir, "script.json"), "utf8"));
  const roleById = new Map((script.scenes ?? []).map((s) => [s.id, s.role]));

  const seg = id.split(/[\\/]/).pop();
  const vertical = seg === "short" || seg.endsWith("-short");
  const { width, height } = vertical ? ANALYSIS_SIZE.portrait : ANALYSIS_SIZE.long;
  const ffmpeg = ffmpegPath(root);
  const crossfadeSeconds = timeline.crossfade_seconds ?? 0;

  const scenes = [];
  for (let i = 0; i < timeline.scenes.length; i++) {
    const scene = timeline.scenes[i];
    // A timeline scene_id carries the phase suffix a multi-phase HF file uses ("s7.1", D-060);
    // the script's role lives under the BASE id ("s7").
    const baseId = String(scene.scene_id).replace(/\.\d+$/, "");
    const role = roleById.get(baseId) ?? "point";
    const { src, at, captioned } = frameSource(timeline, i, { crossfadeSeconds });
    const abs = videoOverride ? settledSeconds(scene, { crossfadeSeconds }) : at;
    const file = videoOverride ?? join(cdir, src);

    if (!existsSync(file)) {
      scenes.push({ scene: scene.scene_id, role, measured: false, pass: false, reasons: [`no frame source at ${src} — render the scene before gating it`] });
      continue;
    }
    const m = measureAt({ ffmpeg, src: file, at: abs, width, height, spawn });
    if (!m) {
      scenes.push({ scene: scene.scene_id, role, measured: false, pass: false, reasons: [`ffmpeg could not decode a frame at ${abs.toFixed(2)}s of ${src}`] });
      continue;
    }
    const verdict = gateFrame(m, role);
    scenes.push({
      scene: scene.scene_id,
      role,
      measured: true,
      at_seconds: Number(abs.toFixed(2)),
      source: src,
      captioned,
      detail: Number(m.detail.toFixed(4)),
      coverage: Number(m.coverage.toFixed(4)),
      box_frac: Number(m.boxFrac.toFixed(4)),
      span_x: Number(m.spanX.toFixed(3)),
      span_y: Number(m.spanY.toFixed(3)),
      floors: verdict.floors,
      pass: verdict.pass,
      reasons: verdict.reasons,
    });
  }

  const failed = scenes.filter((s) => !s.pass);
  const measured = scenes.filter((s) => s.measured);
  const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
  return {
    id,
    generated: new Date().toISOString().slice(0, 10),
    analysis_size: { width, height },
    pass: failed.length === 0,
    summary: {
      scenes: scenes.length,
      failed: failed.length,
      median_detail: Number(median(measured.map((s) => s.detail)).toFixed(4)),
      median_coverage: Number(median(measured.map((s) => s.coverage)).toFixed(4)),
      median_box_frac: Number(median(measured.map((s) => s.box_frac)).toFixed(4)),
    },
    scenes,
  };
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────

function main() {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: node pipeline/05-qa/frame-gate.mjs <id> [--json] [--warn-only] [--video <path>]");
    process.exit(2);
  }
  const warnOnly = args.includes("--warn-only");
  const vi = args.indexOf("--video");
  const videoOverride = vi >= 0 ? args[vi + 1] : null;

  const report = runFrameGate({ root: ROOT, id, videoOverride });
  writeFileSync(join(ROOT, "content", id, "frame-gate.report.json"), JSON.stringify(report, null, 2) + "\n");

  if (args.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const { summary } = report;
    console.log(`frame-gate ${id} — ${summary.scenes} scenes, ${summary.failed} failed`);
    console.log(`  medians: detail ${(summary.median_detail * 100).toFixed(1)}%  coverage ${(summary.median_coverage * 100).toFixed(1)}%  box ${(summary.median_box_frac * 100).toFixed(1)}%`);
    for (const s of report.scenes.filter((x) => !x.pass)) {
      console.log(`  ✗ ${s.scene} (${s.role})`);
      for (const r of s.reasons) console.log(`      ${r}`);
    }
  }
  if (!report.pass && !warnOnly) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
