#!/usr/bin/env node
/**
 * 04-render / FINALIZE — the file YouTube receives: the approved 1080p master upscaled to 1440p
 * (growth option 2B, D-074).
 *
 * WHY. YouTube re-encodes every upload, so viewers never see our CRF-12 master; they see YouTube's
 * copy. YouTube's own recommended bitrates are twice as high at 1440p as at 1080p (16 vs 8 Mbps,
 * SDR 30 fps), and an independent analysis (2021-22) found uploads above 1080p get VP9 while small
 * channels' 1080p uploads get H.264. A lanczos upscale of the finished master costs minutes, a
 * native 1440p render ~1.8× the render time on a 4 GB GPU — so the cheap path first, and the codec is
 * checked in "Stats for nerds" (vp09 vs avc1) after the first upload.
 *
 * WHAT IT DOES. Runs once, after the owner approved the cut (Gate 3), before the manual upload:
 *   video/final.mp4 (1920×1080, the cut the owner watched)  ──move──►  render/master.mp4
 *   render/master.mp4  ──lanczos 2560×1440, MASTER_CRF, audio stream-copied──►  video/final.mp4
 * So video/ still holds ONE file (D-071) and it is the best one we have; the 1080p master stays in
 * render/ as an intermediate — the base patch-scenes splices into — and is never uploaded.
 * Every frame, the played seconds, the timebase and the audio (MD5 of the copied stream) are verified
 * against the master before the new file replaces anything.
 *
 * Idempotent: a final already at the target size with a master that is not newer is left alone; a
 * master newer than the final (a patch landed on it) is re-upscaled. Off when the format has no
 * target (`config.render.upscale.<long|short>` = null — the Short is off by default: phones get
 * little from 1440p; switch it on if the long's codec check shows VP9).
 *
 *   node pipeline/04-render/finalize.mjs <id>              # the long
 *   node pipeline/04-render/finalize.mjs <id>/short        # the nested Short
 *   node pipeline/04-render/finalize.mjs <id> --dry-run    # print the plan only
 *   node pipeline/04-render/finalize.mjs <id> --replace-master   # a NEW render replaces an older master
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MASTER_CRF, MASTER_PRESET } from "../shared/lib/encode.mjs";
import { isShortUnit } from "../shared/lib/units.mjs";
import { ffmpegBin, parseDecodedFrames, parseEncodedSeconds, parseVideoTimescale } from "./patch-scenes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The defaults when config.render.upscale is absent: the long goes to 1440p, the Short stays. */
export const DEFAULT_UPSCALE = { long: { width: 2560, height: 1440 }, short: null };

/** "004-foo/short", "004-foo/short-2" → true (units.mjs — the rule every phase shares). */
export const isShortId = isShortUnit;

/** PURE: the render size and the upload size for one cut (`target` null = finalize is off). */
export function finalizeDims(config, { vertical }) {
  const render = config?.render ?? {};
  const renderDims = vertical ? (render.short ?? { width: 1080, height: 1920 }) : (render.long ?? { width: 1920, height: 1080 });
  const upscale = render.upscale ?? DEFAULT_UPSCALE;
  const target = (vertical ? upscale.short : upscale.long) ?? null;
  return { renderDims, target };
}

/**
 * PURE: the first video stream of an `ffmpeg -i` header —
 * "Video: h264 (High) (avc1 / …), yuvj420p(pc, bt470bg/unknown/unknown, progressive), 1920x1080 [SAR …"
 * → { width, height, pixFmt, range, colorspace }. Unknown parts are null.
 */
export function parseVideoStream(log) {
  const line = /Stream #\d+:\d+[^\n]*: Video: ([^\n]*)/.exec(String(log ?? ""))?.[1];
  if (!line) return null;
  const size = /\b(\d{2,5})x(\d{2,5})\b/.exec(line);
  const fmt = /,\s*([a-z0-9]+)(?:\(([^)]*)\))?,\s*\d{2,5}x\d{2,5}/.exec(line);
  const tags = (fmt?.[2] ?? "").split(",").map((s) => s.trim());
  const range = tags.find((t) => t === "pc" || t === "tv") ?? null;
  const colorspace = tags.find((t) => t.includes("/"))?.split("/")[0] ?? null;
  return {
    width: size ? Number(size[1]) : null,
    height: size ? Number(size[2]) : null,
    pixFmt: fmt?.[1] ?? null,
    range,
    colorspace: colorspace && colorspace !== "unknown" ? colorspace : null,
  };
}

const sameDims = (a, b) => Boolean(a && b) && a.width === b.width && a.height === b.height;

/**
 * PURE: what finalize must do, from the state of the two files.
 *   off      — no target for this format
 *   upscale  — final.mp4 is a fresh render at render size: move it to render/master.mp4, upscale
 *   redo     — final is already upscaled but the master is newer (a patch landed): upscale again
 *   current  — final is at the target size and not older than the master: nothing to do
 * Throws when it would clobber an older master, when there is nothing to finalize, or when final.mp4
 * is neither size (someone else's file — never guess).
 */
export function planFinalize({ target, renderDims, finalInfo, finalMtime, masterExists, masterMtime, replaceMaster = false }) {
  if (!target) return { action: "off" };
  if (sameDims(target, renderDims)) return { action: "off" };
  if (!finalInfo) {
    if (masterExists) return { action: "redo" };
    throw new Error("no video/final.mp4 to finalize — render the cut first");
  }
  if (sameDims(finalInfo, renderDims)) {
    if (masterExists && !replaceMaster) {
      throw new Error(
        "render/master.mp4 already exists from an earlier finalize, and video/final.mp4 is a new render at render size. " +
          "Pass --replace-master to make the new render the master (the old one is overwritten)."
      );
    }
    return { action: "upscale" };
  }
  if (sameDims(finalInfo, target)) {
    if (!masterExists) return { action: "current", note: "no render/master.mp4 beside it — patching needs the 1080p master" };
    return masterMtime > finalMtime ? { action: "redo" } : { action: "current" };
  }
  throw new Error(`video/final.mp4 is ${finalInfo.width}x${finalInfo.height} — neither the render size nor the upload size; refusing to touch it`);
}

/**
 * PURE: the upscale encode. Lanczos to the target size at the master's CRF and preset; the pixel
 * format and colour tags are carried over from the source (Remotion's masters are full-range
 * yuvj420p — converting the range here would shift every black and gold), the timebase too, and the
 * audio is stream-copied, never re-encoded.
 */
export function buildUpscaleArgs({ input, out, target, source = {}, timescale }) {
  const args = ["-hide_banner", "-v", "error", "-i", input, "-map", "0:v:0", "-map", "0:a?"];
  args.push("-vf", `scale=${target.width}:${target.height}:flags=lanczos`);
  args.push("-c:v", "libx264", "-preset", MASTER_PRESET, "-crf", String(MASTER_CRF));
  if (source.pixFmt) args.push("-pix_fmt", source.pixFmt);
  if (source.range) args.push("-color_range", source.range);
  if (source.colorspace) args.push("-colorspace", source.colorspace);
  if (timescale) args.push("-video_track_timescale", String(timescale));
  args.push("-c:a", "copy", "-movflags", "+faststart", "-y", out);
  return args;
}

/** PURE: the MD5 line of `ffmpeg -f md5 -` ("MD5=…"), or null. */
export function parseMd5(log) {
  return /MD5=([0-9a-f]{32})/.exec(String(log ?? ""))?.[1] ?? null;
}

/**
 * PURE: compare the upscaled file against its master. Every check must hold — a lost frame desyncs
 * every subtitle after it, and a changed timebase ends the picture early under intact audio (023).
 * @returns {string[]} problems (empty = good)
 */
export function verifyUpscale({ master, out, target, fps = 30 }) {
  const problems = [];
  if (!sameDims(out.info, target)) problems.push(`size ${out.info?.width}x${out.info?.height}, expected ${target.width}x${target.height}`);
  if (out.frames !== master.frames) problems.push(`${out.frames} frames, the master has ${master.frames}`);
  if (master.seconds != null && (out.seconds == null || Math.abs(out.seconds - master.seconds) > 1 / fps)) {
    problems.push(`${out.seconds}s of video, the master has ${master.seconds}s`);
  }
  if (out.timescale !== master.timescale) problems.push(`timebase ${out.timescale} tbn, the master has ${master.timescale}`);
  if (master.audioMd5 !== out.audioMd5) problems.push("the audio stream is not a bit-exact copy of the master's");
  return problems;
}

// ── side effects ─────────────────────────────────────────────────────────────

function ffmpegRun(bin, args, spawn) {
  const res = spawn(bin, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (res.error) throw res.error;
  return { status: res.status, log: `${res.stdout ?? ""}${res.stderr ?? ""}` };
}

/** Header (size, pixel format, colour, timebase) of a file; null when it does not exist. */
function probe(bin, file, spawn) {
  if (!existsSync(file)) return null;
  const { log } = ffmpegRun(bin, ["-hide_banner", "-i", file], spawn); // exits 1 (no output) by design
  const info = parseVideoStream(log);
  if (!info?.width) throw new Error(`could not read the video stream of ${file}`);
  return { ...info, timescale: parseVideoTimescale(log) };
}

/** Decode every frame (frames + played seconds) and MD5 the audio stream, for verifyUpscale. */
function measure(bin, file, spawn) {
  const decode = ffmpegRun(bin, ["-hide_banner", "-v", "info", "-stats", "-i", file, "-map", "0:v:0", "-f", "null", "-"], spawn);
  const audio = ffmpegRun(bin, ["-hide_banner", "-v", "error", "-i", file, "-map", "0:a?", "-c", "copy", "-f", "md5", "-"], spawn);
  return {
    frames: parseDecodedFrames(decode.log),
    seconds: parseEncodedSeconds(decode.log),
    timescale: parseVideoTimescale(decode.log),
    audioMd5: parseMd5(audio.log),
  };
}

/**
 * Finalize one cut on disk. `root` points at a repo (tests pass a temp one).
 * @returns {{action: string, final: string, master: string, target: object|null, note?: string}}
 */
export function finalizeVideo({ root = ROOT, id, config, replaceMaster = false, dryRun = false, ffmpeg, spawn = spawnSync, log = () => {} } = {}) {
  config = config ?? JSON.parse(readFileSync(join(root, "pipeline", "shared", "config.json"), "utf8"));
  const cdir = join(root, "content", id);
  const final = join(cdir, "video", "final.mp4");
  const master = join(cdir, "render", "master.mp4");
  const { renderDims, target } = finalizeDims(config, { vertical: isShortId(id) });
  const bin = ffmpeg ?? ffmpegBin(root);

  const finalInfo = probe(bin, final, spawn);
  const masterExists = existsSync(master);
  const plan = planFinalize({
    target,
    renderDims,
    finalInfo,
    finalMtime: finalInfo ? statSync(final).mtimeMs : 0,
    masterExists,
    masterMtime: masterExists ? statSync(master).mtimeMs : 0,
    replaceMaster,
  });
  const result = { ...plan, final, master, target };
  if (dryRun || plan.action === "off" || plan.action === "current") return result;

  if (plan.action === "upscale") {
    mkdirSync(dirname(master), { recursive: true });
    if (masterExists) unlinkSync(master); // only reachable with replaceMaster (planFinalize)
    renameSync(final, master);
    log(`moved the approved 1080p cut to ${master}`);
  }

  const source = probe(bin, master, spawn);
  const tmp = join(cdir, "video", "final.upscale.mp4");
  log(`upscaling ${source.width}x${source.height} → ${target.width}x${target.height} (lanczos, CRF ${MASTER_CRF})…`);
  const enc = ffmpegRun(bin, buildUpscaleArgs({ input: master, out: tmp, target, source, timescale: source.timescale }), spawn);
  if (enc.status !== 0) {
    if (existsSync(tmp)) unlinkSync(tmp);
    throw new Error(`upscale failed (exit ${enc.status}): ${enc.log.slice(-2000)}`);
  }

  const problems = verifyUpscale({
    master: measure(bin, master, spawn),
    out: { info: probe(bin, tmp, spawn), ...measure(bin, tmp, spawn) },
    target,
    fps: config.render?.fps ?? 30,
  });
  if (problems.length) {
    unlinkSync(tmp);
    throw new Error(`the upscaled file failed verification, nothing replaced (the master is at ${master}):\n  - ${problems.join("\n  - ")}`);
  }
  if (existsSync(final)) unlinkSync(final); // the previous upscale of an older master (redo)
  renameSync(tmp, final);
  return result;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const id = argv.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: finalize.mjs <content_id>[/short] [--dry-run] [--replace-master]");
    process.exit(1);
  }
  try {
    const res = finalizeVideo({
      id,
      dryRun: argv.includes("--dry-run"),
      replaceMaster: argv.includes("--replace-master"),
      log: (m) => console.log(`   ${m}`),
    });
    const size = res.target ? `${res.target.width}x${res.target.height}` : "—";
    const said = {
      off: "finalize is off for this format (config.render.upscale) — video/final.mp4 is uploaded as rendered",
      current: `video/final.mp4 is already the ${size} upload file${res.note ? ` (${res.note})` : ""}`,
      upscale: `video/final.mp4 is now the ${size} upload file; the 1080p master is render/master.mp4`,
      redo: `video/final.mp4 re-upscaled to ${size} from the newer render/master.mp4`,
    }[res.action];
    console.log(`${argv.includes("--dry-run") ? "DRY RUN " : ""}${id}: ${said}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
