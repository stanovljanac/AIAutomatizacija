#!/usr/bin/env node
/**
 * repair-dropouts.mjs — find and repair SINGLE-FRAME video dropouts in a rendered mp4.
 *
 * WHY THIS EXISTS (measured 2026-08-17/18, 022 v2). Compositing a HyperFrames 3D clip through
 * Remotion's `OffthreadVideo` deterministically loses a handful of individual frames: the video
 * layer renders as pure black for exactly one frame while the caption layer above it still draws.
 * Five frames out of 11,262 in the 022 long cut, always inside a Three.js clip, never in a 2D one.
 *
 * WHAT WAS RULED OUT (so nobody re-runs these experiments):
 *   · the source clips — a full sequential decode of every hf/*.mp4 finds NO black frame, and the
 *     PTS ladder is perfectly regular (no dropped/duplicated frame, exact frame counts);
 *   · GOP structure — re-encoding the clip ALL-INTRA (`-g 1`) leaves the dropouts at the SAME
 *     local frame indices, so it is not a keyframe-seek problem;
 *   · render concurrency — `--concurrency=1` reproduces them at the same frames, and so does a
 *     five-frame render (`--frames=946-950`), so it is not a worker/chunk race. It is deterministic
 *     per composition frame.
 * That leaves the extractor itself, which we do not own. So this repairs the output instead of
 * pretending the defect is not there.
 *
 * HOW THE REPAIR WORKS. A dropout is, by definition, one frame far darker than BOTH of its
 * neighbours. ffmpeg's `select` drops those frames while leaving every other frame's timestamp
 * alone; the following `fps` filter then re-fills the resulting one-frame holes by repeating the
 * previous frame. The result is the same length, the same timing, and the same audio — with each
 * black frame replaced by a duplicate of the frame before it. At 30fps a 33ms repeat is invisible.
 *
 *   node scripts/repair-dropouts.mjs <video.mp4> [--out <path>] [--threshold 12] [--drop 8]
 *
 * With no `--out` the file is repaired in place via a temporary file. Exits 0 and copies nothing
 * when the scan finds no dropouts, so it is safe to run unconditionally after every render.
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The vendored ffmpeg the rest of the pipeline uses, falling back to one on PATH. */
export function ffmpegBin() {
  const vendored = join(ROOT, "templates", "hyperframes", ".bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (existsSync(vendored)) return vendored;
  return "ffmpeg";
}

/**
 * PURE: parse `signalstats`+`metadata=print` output into a per-frame luma series.
 * The filter emits two lines per frame (`frame:N pts_time:T` then `lavfi.signalstats.YAVG=V`).
 *
 * @param {string} log  combined ffmpeg output
 * @returns {number[]}  YAVG indexed by frame number
 */
export function parseLuma(log) {
  const out = [];
  const re = /frame:(\d+)[^\n]*\n[^\n]*YAVG=([0-9.]+)/g;
  let m;
  while ((m = re.exec(String(log ?? "")))) out[Number(m[1])] = Number(m[2]);
  return out;
}

/**
 * PURE: a dropout is a frame that is BOTH near-black in absolute terms and far darker than the
 * frames on either side. Both tests are required: the first alone would flag a legitimate cut to
 * black, the second alone would flag any hard cut between two bright scenes.
 *
 * @param {number[]} luma
 * @param {object} [o] @param {number} [o.threshold] absolute YAVG below which a frame counts as black
 *                     @param {number} [o.drop] how much darker than BOTH neighbours it must be
 * @returns {number[]} frame indices, ascending
 */
export function findDropouts(luma, { threshold = 12, drop = 8 } = {}) {
  const bad = [];
  for (let i = 1; i < luma.length - 1; i++) {
    const [p, v, n] = [luma[i - 1], luma[i], luma[i + 1]];
    if (![p, v, n].every((x) => typeof x === "number")) continue;
    if (v < threshold && v < p - drop && v < n - drop) bad.push(i);
  }
  return bad;
}

/** PURE: the ffmpeg filter that removes `frames` and lets `fps` repeat the previous frame into the hole. */
export function repairFilter(frames, fps = 30) {
  const drop = frames.map((f) => `eq(n\\,${f})`).join("+");
  return `select='not(${drop})',fps=${fps}`;
}

function scan(bin, file) {
  const r = spawnSync(bin, [
    "-v", "error", "-i", file,
    "-vf", "scale=160:90,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-",
    "-f", "null", "-",
  ], { encoding: "utf8", maxBuffer: 1 << 28 });
  return parseLuma(`${r.stdout ?? ""}${r.stderr ?? ""}`);
}

function main(argv) {
  const file = argv[0];
  if (!file || !existsSync(file)) {
    console.error("usage: node scripts/repair-dropouts.mjs <video.mp4> [--out <path>] [--threshold N] [--drop N]");
    process.exit(1);
  }
  const arg = (name, dflt) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
  };
  const outArg = arg("out", null);
  const threshold = Number(arg("threshold", 12));
  const drop = Number(arg("drop", 8));
  const bin = ffmpegBin();

  const luma = scan(bin, file);
  if (!luma.length) {
    console.error(`could not read luma from ${file}`);
    process.exit(1);
  }
  const bad = findDropouts(luma, { threshold, drop });
  if (!bad.length) {
    console.log(`OK ${file} — ${luma.length} frames scanned, no dropouts`);
    return;
  }
  console.log(`found ${bad.length} dropout(s): ${bad.map((f) => `${f} (${(f / 30).toFixed(2)}s)`).join(", ")}`);

  const tmp = `${file}.repair.mp4`;
  const r = spawnSync(bin, [
    "-v", "error", "-i", file,
    "-vf", repairFilter(bad),
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
    "-c:a", "copy", "-movflags", "+faststart", "-y", tmp,
  ], { encoding: "utf8", stdio: "inherit" });
  if (r.status !== 0 || !existsSync(tmp)) {
    console.error("ffmpeg repair failed");
    process.exit(1);
  }

  const after = findDropouts(scan(bin, tmp), { threshold, drop });
  if (after.length) {
    console.error(`repair did not take — ${after.length} dropout(s) remain: ${after.join(", ")}`);
    process.exit(1);
  }

  if (outArg) {
    renameSync(tmp, outArg);
    console.log(`OK repaired → ${outArg}`);
  } else {
    unlinkSync(file);
    renameSync(tmp, file);
    console.log(`OK repaired in place → ${file}`);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href) {
  main(process.argv.slice(2));
}
