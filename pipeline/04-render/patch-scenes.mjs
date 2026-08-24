#!/usr/bin/env node
/**
 * 04-render / PATCH-SCENES — re-render ONLY the frames a changed scene owns and splice them into an
 * already-rendered final.mp4, instead of paying for the whole Remotion pass again.
 *
 * WHY THIS EXISTS. The HyperFrames clips are already cached per scene (compile-hyperframes.mjs), so
 * fixing one scene costs ~1 minute of HF render. The expensive step is the Remotion composite pass:
 * 11,331 frames at --concurrency=1 (forced by the Chrome OOM on 26 OffthreadVideo sources) is ~2
 * hours for a 6-minute cut. Re-running all of it to change 11 seconds is the single biggest waste in
 * the pipeline, and the owner called it out on 023 (2026-08-23).
 *
 * WHAT MAKES THE SPLICE SAFE (measured on content/023-attention/video/final.mp4, 2026-08-23):
 *   1. x264 puts an IDR frame on every hard scene cut, because a cut IS a scene change. Measured
 *      keyframes: n = 0, 250, 392, 642, 892, 1070 — and 392 / 1070 are EXACTLY the compiled
 *      fromFrame of s2.0 / s4.0. So a scene boundary is, in practice, already a splice point.
 *   2. Cutting a mp4 on a keyframe is a STREAM COPY: the untouched 95% of the video is never
 *      re-encoded, so there is no generation loss and no visible seam anywhere.
 *   3. The replacement segment is rendered by REMOTION ITSELF (`--frames=A-B`), not by ffmpeg, so it
 *      comes out of the same encoder with the same settings and the same SPS/PPS as the base file.
 *      That is what lets the concat demuxer run with `-c copy`.
 *   4. The segment is rendered `--muted` and the ORIGINAL audio stream is re-muxed untouched. Audio
 *      drift is therefore impossible by construction — we never cut, re-encode or re-time audio.
 *      (PRD R11: never slice the audio.)
 *   5. EVERY segment is normalised to the BASE FILE'S TIMEBASE before the concat, and the result is
 *      verified on time, not just on frame count. Learned the hard way on 2026-08-24: Remotion writes
 *      90000 tbn, our final.mp4 carries 15360, and the concat demuxer keeps the FIRST input's
 *      timebase without rescaling the rest. Both shipped 023 patches decoded all 11331 frames and
 *      still died at 1:04. See buildSegmentCutCommand + the verify block in runPatch.
 *
 * Split of responsibilities (same shape as compile-hyperframes.mjs):
 *   - affectedFrameRange()/parseKeyframes()/snapToKeyframes()  PURE: which frames must be redone
 *   - build*Command()                                          PURE: the exact commands
 *   - planPatch()                                              PURE: the whole ordered plan
 *   - runPatch()                                               side-effecting: spawn + verify
 *
 *   node pipeline/04-render/patch-scenes.mjs 023-attention --scenes s1.0 --out v1.1
 *   node pipeline/04-render/patch-scenes.mjs 023-attention --scenes s1.0,s7.0 --dry-run
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sceneWindow } from "./lib/transitions.mjs";

/**
 * PURE: the frames a set of scenes actually OWNS on the compiled timeline.
 *
 * This is EXACTLY the compositor window, [fromFrame, fromFrame + durFrames), and the range needs no
 * widening for transitions — which is worth stating because the obvious guess is wrong. Every blend
 * in this compositor happens INSIDE the incoming scene's own window: `sceneWindow` pulls a scene
 * back over its predecessor (`dissolve`/`push`) rather than pushing the predecessor forward, the
 * intro bumper is extended forward INTO scene 0's window, and the outro is pulled back INTO the last
 * scene's window. A scene's pixels therefore never appear outside its own window, so patching scene
 * k can never change a frame that belongs to k−1 or k+1. Widening would only cost render time.
 *
 * @param {object} timeline        a timeline.json object
 * @param {string[]} sceneIds      scene_ids to patch (must exist in the timeline)
 * @returns {{ from:number, to:number }}  half-open frame range [from, to)
 */
export function affectedFrameRange(timeline, sceneIds) {
  const wanted = new Set(sceneIds);
  let from = Infinity;
  let to = -Infinity;
  const seen = new Set();

  timeline.scenes.forEach((sc, k) => {
    if (!wanted.has(sc.scene_id)) return;
    seen.add(sc.scene_id);
    const { fromFrame, durFrames } = sceneWindow(timeline, k);
    from = Math.min(from, fromFrame);
    to = Math.max(to, fromFrame + durFrames);
  });

  const missing = sceneIds.filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`no such scene_id in the timeline: ${missing.join(", ")}`);
  return { from: Math.max(from, 0), to };
}

/**
 * PURE: parse `ffmpeg -vf showinfo` output into the sorted frame indices of the KEYFRAMES.
 * Anchored on `n:<num>` + `iskey:1` from the same showinfo line.
 *
 * @param {string} log  combined ffmpeg output
 * @returns {number[]}  keyframe frame indices, ascending, de-duplicated
 */
export function parseKeyframes(log) {
  const out = new Set();
  const re = /\bn:\s*(\d+)\b[^\n]*\biskey:1\b/g;
  let m;
  while ((m = re.exec(String(log ?? "")))) out.add(Number(m[1]));
  return [...out].sort((a, b) => a - b);
}

/**
 * PURE: widen a frame range to the nearest keyframes, so BOTH cuts are stream-copyable.
 *
 * `startFrame` is the greatest keyframe <= from (0 when there is none — the head is then empty and
 * the patch starts the file). `endFrame` is the least keyframe >= to, or totalFrames when the patch
 * runs to the end of the file (the tail is then empty). Widening only ever RE-RENDERS more frames;
 * it can never move a cut off a keyframe, which is the property the `-c copy` splice depends on.
 *
 * @param {number[]} keyframes  ascending keyframe indices (parseKeyframes)
 * @param {{from:number,to:number}} range
 * @param {number} totalFrames
 * @returns {{ startFrame:number, endFrame:number }}  half-open [startFrame, endFrame)
 */
export function snapToKeyframes(keyframes, { from, to }, totalFrames) {
  if (to > totalFrames) throw new Error(`range end ${to} is past the end of the video (${totalFrames} frames)`);
  const before = keyframes.filter((k) => k <= from);
  const after = keyframes.filter((k) => k >= to);
  const startFrame = before.length ? before[before.length - 1] : 0;
  const endFrame = after.length ? after[0] : totalFrames;
  return { startFrame, endFrame };
}

/** PURE: scan every video frame of `base` for its keyframe flags (decode-only, no output file). */
export function buildKeyframeScanCommand({ ffmpeg, base }) {
  return { cmd: ffmpeg, args: ["-hide_banner", "-v", "info", "-i", base, "-map", "0:v", "-vf", "showinfo", "-f", "null", "-"] };
}

/**
 * PURE: the muxer flag that pins a track's timebase. Missing/invalid is a HARD ERROR, never a
 * silent omission — an unpinned timebase is exactly the bug below.
 */
function timescaleArgs(timescale) {
  if (!Number.isInteger(timescale) || timescale <= 0) {
    throw new Error(`timescale must be a positive integer (got ${timescale}) — every segment of a splice has to share ONE timebase`);
  }
  return ["-video_track_timescale", String(timescale)];
}

/**
 * PURE: cut a frame-exact VIDEO-ONLY segment out of `base` by STREAM COPY, into `timescale` ticks/s.
 *
 * `-ss` (input seek) lands on the keyframe at or before the timestamp — which is exact here because
 * snapToKeyframes guarantees `fromFrame` IS a keyframe. `-frames:v` then takes the exact count, so
 * the segment can never be a frame long or short (`-t` would round against the packet duration).
 *
 * `-video_track_timescale` is not a nicety — it is the fix for the 023 v1.1/v1.2 splice (2026-08-24).
 * Remotion writes 90000 tbn; the base final.mp4 carries 15360; and the concat demuxer takes the
 * OUTPUT timebase from its FIRST input WITHOUT rescaling the other files' packets. Patching scene 1
 * removes the head segment, so the Remotion part comes first, and the tail's 15360-tick stamps were
 * then read as 90000: the picture ran out at 377.75 / (90000/15360) = 64.5s under 6:17 of audio.
 * A mid-file patch breaks the other way (the patched scene plays 5.86x slow). Normalising EVERY
 * segment to one timebase makes the concat demuxer's assumption true by construction.
 */
export function buildSegmentCutCommand({ ffmpeg, base, fromFrame, toFrame, fps, timescale, out }) {
  const args = ["-hide_banner", "-v", "error"];
  if (fromFrame > 0) args.push("-ss", (fromFrame / fps).toFixed(6));
  args.push("-i", base, "-map", "0:v", "-c", "copy", "-frames:v", String(toFrame - fromFrame),
    ...timescaleArgs(timescale), "-y", out);
  return { cmd: ffmpeg, args };
}

/**
 * PURE: concat the segments with the demuxer, stream copy — all parts share one encoder's SPS/PPS
 * and, because buildSegmentCutCommand normalised them, one timebase (see the note there); pinning
 * it again here keeps the output's tbn true even if a part ever arrives unnormalised.
 * (The old `-fflags +genpts` sat AFTER `-i`, i.e. on the OUTPUT, where genpts is a no-op — it never
 * generated a timestamp, so it could not have papered over the mismatch. Dropped.)
 */
export function buildConcatCommand({ ffmpeg, listFile, timescale, out }) {
  return {
    cmd: ffmpeg,
    args: ["-hide_banner", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile,
      "-map", "0:v", "-c", "copy", ...timescaleArgs(timescale), "-movflags", "+faststart", "-y", out],
  };
}

/**
 * PURE: mux the spliced video with the ORIGINAL audio stream, copied bit-for-bit from the base file.
 * The audio is never cut, re-encoded or re-timed — that is what makes drift impossible.
 */
export function buildMuxCommand({ ffmpeg, videoFile, baseFile, timescale, out }) {
  return {
    cmd: ffmpeg,
    args: ["-hide_banner", "-v", "error", "-i", videoFile, "-i", baseFile,
      "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", ...timescaleArgs(timescale),
      "-movflags", "+faststart", "-y", out],
  };
}

/**
 * PURE: the Remotion command that renders ONLY the replacement frames.
 *
 * `--muted` is not an optimisation — it is the correctness guarantee: with no audio in the segment
 * there is nothing to align, and the base file's audio survives untouched through the mux. The
 * memory flags mirror the settled 023 render command (a 26-source cut OOMs the Chrome tab at the
 * default concurrency).
 */
export function buildRemotionRenderCommand({ outId, startFrame, endFrame, out, concurrency = 1 }) {
  return {
    cmd: "npx",
    args: ["remotion", "render", "Main", out,
      `--props=props/${outId}.json`,
      `--frames=${startFrame}-${endFrame - 1}`,
      "--muted",
      `--concurrency=${concurrency}`,
      "--offthread-video-cache-size-in-bytes=134217728",
      "--timeout=180000"],
  };
}

/**
 * PURE: the whole ordered plan — which frames get re-rendered, which segments are stream-copied, and
 * how many frames each part contributes. Lets a caller (and the tests) see the entire patch without
 * spawning anything. `segments` is in output order; exactly one of them is the re-rendered part.
 *
 * @returns {{ startFrame:number, endFrame:number, totalFrames:number, patchedFrames:number,
 *             copiedFrames:number, segments:{name:string,fromFrame:number,toFrame:number,source:string}[] }}
 */
export function planPatch({ timeline, sceneIds, keyframes, totalFrames }) {
  const range = affectedFrameRange(timeline, sceneIds);
  const { startFrame, endFrame } = snapToKeyframes(keyframes, range, totalFrames);
  const segments = [];
  if (startFrame > 0) segments.push({ name: "head", fromFrame: 0, toFrame: startFrame, source: "base" });
  segments.push({ name: "patch", fromFrame: startFrame, toFrame: endFrame, source: "render" });
  if (endFrame < totalFrames) segments.push({ name: "tail", fromFrame: endFrame, toFrame: totalFrames, source: "base" });
  const patchedFrames = endFrame - startFrame;
  return {
    startFrame, endFrame, totalFrames, patchedFrames,
    copiedFrames: totalFrames - patchedFrames,
    segments,
  };
}

/** PURE: the concat demuxer list file body (one `file '…'` directive per segment). */
export function concatListBody(files) {
  const esc = (f) => f.replace(/\\/g, "/").split("'").join("'\\''");
  return files.map((f) => `file '${esc(f)}'`).join("\n") + "\n";
}

/** PURE: count decoded video frames in an `ffmpeg -f null -` log (the last `frame=` it reports). */
export function parseDecodedFrames(log) {
  const all = [...String(log ?? "").matchAll(/frame=\s*(\d+)/g)];
  return all.length ? Number(all[all.length - 1][1]) : null;
}

/**
 * PURE: how many SECONDS of video the run actually played (the last `time=HH:MM:SS.ss`).
 * This is the number a wrong timebase moves while the frame count stays right — the gate the broken
 * 023 v1.1/v1.2 splice would have failed.
 */
export function parseEncodedSeconds(log) {
  const all = [...String(log ?? "").matchAll(/time=\s*(\d+):(\d\d):(\d\d(?:\.\d+)?)/g)];
  if (!all.length) return null;
  const [, h, m, s] = all[all.length - 1];
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * PURE: the video track's TIMEBASE (ticks per second) from an ffmpeg `-v info` stream header —
 * "… 30 fps, 30 tbr, 15360 tbn". ffmpeg abbreviates large values ("90k tbn"), so the k is expanded.
 * Reads the FIRST video stream line, which is the input's (the base being scanned, or the file being
 * verified).
 */
export function parseVideoTimescale(log) {
  const m = /Stream #\d+:\d+[^\n]*: Video:[^\n]*?\b(\d+(?:\.\d+)?)(k?) tbn/.exec(String(log ?? ""));
  if (!m) return null;
  return Math.round(Number(m[1]) * (m[2] === "k" ? 1000 : 1));
}

/** The vendored ffmpeg the rest of the pipeline uses, falling back to one on PATH. */
export function ffmpegBin(root) {
  const vendored = join(root, "templates", "hyperframes", ".bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  return existsSync(vendored) ? vendored : "ffmpeg";
}

// ── side-effecting runner ────────────────────────────────────────────────────────────────────────

/**
 * Side-effecting: execute a plan. Spawns ffmpeg for the scan/cuts/concat/mux and Remotion for the
 * replacement frames, then VERIFIES the result — frame count, played duration AND timebase — before
 * it is accepted. A splice that silently loses or gains a frame would desync every caption after it;
 * one that changes the timebase (the 023 v1.1/v1.2 bug) keeps every frame and still ships a video
 * that stops dead a minute in.
 *
 * @param {object} args
 * @param {string} args.root      repo root
 * @param {string} args.cdir      content/<id> dir
 * @param {string} args.outId     flat artifact id (props/<outId>.json)
 * @param {object} args.plan      from planPatch
 * @param {number} args.fps
 * @param {number} args.timescale the BASE file's video timebase; every segment is normalised to it
 * @param {string} args.base      the already-rendered mp4 to patch
 * @param {string} args.out       destination mp4
 * @param {Function} [args.spawn] spawnSync-compatible injection point
 * @returns {{ out:string, frames:number, seconds:number, timescale:number }}
 */
export function runPatch({ root, cdir, outId, plan, fps, timescale, base, out, spawn = spawnSync }) {
  const ffmpeg = ffmpegBin(root);
  const remotionDir = join(root, "templates", "remotion");
  const work = join(cdir, "video", ".patch");
  mkdirSync(work, { recursive: true });
  // Under shell:true (needed for npx.cmd on Windows) cmd + args are concatenated and re-parsed by
  // cmd.exe, so ANY of them containing a space must be quoted — including the command itself. The
  // vendored ffmpeg lives under "AI Automatizacija", so an unquoted cmd is split at the space and
  // cmd.exe reports `'F:\AI\AI' is not recognized` (measured 2026-08-23).
  const winShell = process.platform === "win32";
  const qs = (s) => (winShell && /[\s&|<>^()"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s);
  const q = (args) => (winShell ? args.map(qs) : args);

  const run = (label, { cmd, args }, opts = {}) => {
    const res = spawn(qs(cmd), q(args), { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: winShell, ...opts });
    if (res.error) throw res.error;
    const log = `${res.stdout ?? ""}${res.stderr ?? ""}`;
    if (res.status !== 0) throw new Error(`${label} failed (exit ${res.status}):\n${log.slice(-4000)}`);
    return log;
  };

  const parts = [];
  for (const seg of plan.segments) {
    const file = join(work, `${seg.name}.mp4`);
    if (seg.source === "render") {
      // Remotion writes into its own project dir, then we move the segment into the work dir.
      const rel = join("out", `${outId}-patch-${seg.fromFrame}-${seg.toFrame}.mp4`);
      const produced = join(remotionDir, rel);
      // Idempotent like compile-hyperframes: a segment newer than the props it was compiled from is
      // still current, so a failure downstream of the render (a bad splice, a killed run) never
      // makes you pay for those frames twice.
      const propsFile = join(remotionDir, "props", `${outId}.json`);
      const fresh = existsSync(produced) && statSync(produced).mtimeMs > statSync(propsFile).mtimeMs;
      if (fresh) {
        console.log(`REUSE frames ${seg.fromFrame}-${seg.toFrame - 1} — ${rel} is newer than props/${outId}.json`);
      } else {
        console.log(`RENDER frames ${seg.fromFrame}-${seg.toFrame - 1} (${seg.toFrame - seg.fromFrame} of ${plan.totalFrames}) via Remotion…`);
        run("remotion render", buildRemotionRenderCommand({ outId, startFrame: seg.fromFrame, endFrame: seg.toFrame, out: rel }), {
          cwd: remotionDir,
          stdio: ["ignore", "inherit", "pipe"],
        });
      }
      if (!existsSync(produced)) throw new Error(`remotion reported success but ${produced} was not produced`);
      run("segment normalise", buildSegmentCutCommand({ ffmpeg, base: produced, fromFrame: 0, toFrame: seg.toFrame - seg.fromFrame, fps, timescale, out: file }));
    } else {
      console.log(`COPY  frames ${seg.fromFrame}-${seg.toFrame - 1} (${seg.name}, stream copy — no re-encode)`);
      run(`cut ${seg.name}`, buildSegmentCutCommand({ ffmpeg, base, fromFrame: seg.fromFrame, toFrame: seg.toFrame, fps, timescale, out: file }));
    }
    parts.push(file);
  }

  const listFile = join(work, "concat.txt");
  writeFileSync(listFile, concatListBody(parts));
  const splicedV = join(work, "spliced-video.mp4");
  run("concat", buildConcatCommand({ ffmpeg, listFile, timescale, out: splicedV }));

  console.log("MUX   original audio stream (copied, never re-timed)");
  run("mux", buildMuxCommand({ ffmpeg, videoFile: splicedV, baseFile: base, timescale, out }));

  // VERIFY. Frame count alone is NOT enough, and saying so cost a shipped file: the broken 023
  // v1.1/v1.2 splices decoded 11331/11331 frames and passed, while the video track ran out after
  // 1:04 of a 6:17 cut. A wrong timebase moves TIME, not frames — so the gate measures time too,
  // and the timebase itself. (The container's Duration is no help either: it reports the audio's
  // 6:17 and hides the truncated picture.)
  const log = run("verify", { cmd: ffmpeg, args: ["-hide_banner", "-v", "info", "-i", out, "-map", "0:v", "-f", "null", "-"] });
  const frames = parseDecodedFrames(log);
  const seconds = parseEncodedSeconds(log);
  const tbn = parseVideoTimescale(log);
  const expected = plan.totalFrames / fps;
  const show = (s) => (typeof s === "number" ? `${s.toFixed(2)}s` : "an unreadable duration");
  const bad = [];
  if (frames !== plan.totalFrames) bad.push(`decodes ${frames} video frames, expected ${plan.totalFrames}`);
  if (seconds === null || Math.abs(seconds - expected) > 2 / fps) {
    bad.push(`plays ${show(seconds)} of video, expected ${show(expected)} (${plan.totalFrames} frames @ ${fps}fps) — a timebase mismatch between the spliced segments`);
  }
  if (tbn !== timescale) bad.push(`carries ${tbn} tbn, expected the base file's ${timescale}`);
  if (bad.length) {
    throw new Error(`SPLICE VERIFY FAILED: ${out} ${bad.join("; ")}. Left in place for inspection; do NOT ship it.`);
  }
  rmSync(work, { recursive: true, force: true });
  return { out, frames, seconds, timescale: tbn };
}

// ── standalone CLI ───────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const argv = process.argv.slice(2);
  const flag = (name, dflt = null) => {
    const i = argv.indexOf(`--${name}`);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
    const eq = argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : dflt;
  };
  const id = argv.find((a) => !a.startsWith("--"));
  const scenes = (flag("scenes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!id || !scenes.length) {
    console.error("usage: patch-scenes.mjs <content_id> --scenes s1.0[,s7.0] [--out <label>] [--base <mp4>] [--dry-run]");
    process.exit(1);
  }
  const cdir = join(ROOT, "content", id);
  const outId = id.replace(/[\\/]/g, "-");
  const timeline = JSON.parse(readFileSync(join(cdir, "timeline.json"), "utf8"));
  const fps = timeline.format.fps;
  const base = flag("base") ?? join(cdir, "video", "final.mp4");
  if (!existsSync(base)) {
    console.error(`no base render at ${base} — there is nothing to patch. Run the full render first.`);
    process.exit(1);
  }
  const props = JSON.parse(readFileSync(join(ROOT, "templates/remotion/props", `${outId}.json`), "utf8"));
  const label = flag("out");
  const out = label ? join(cdir, "video", `final-${label}.mp4`) : base;

  const ffmpeg = ffmpegBin(ROOT);
  const scan = spawnSync(ffmpeg, buildKeyframeScanCommand({ ffmpeg, base }).args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const scanLog = `${scan.stdout ?? ""}${scan.stderr ?? ""}`;
  const keyframes = parseKeyframes(scanLog);
  if (!keyframes.length) { console.error(`could not read any keyframes from ${base}`); process.exit(1); }
  // The base file's timebase is the one every segment gets normalised to — Remotion's own segments
  // come out at 90000 tbn and would otherwise poison the concat (see buildSegmentCutCommand).
  const timescale = parseVideoTimescale(scanLog);
  if (!timescale) { console.error(`could not read the video timebase (tbn) of ${base} — refusing to splice blind`); process.exit(1); }

  const plan = planPatch({ timeline, sceneIds: scenes, keyframes, totalFrames: props.totalFrames });
  const pct = ((plan.patchedFrames / plan.totalFrames) * 100).toFixed(1);
  console.log(`PATCH ${id} scenes [${scenes.join(", ")}]`);
  console.log(`   base       ${base}`);
  console.log(`   keyframes  ${keyframes.length} in the base file`);
  console.log(`   timebase   ${timescale} tbn — every segment is normalised to it before the concat`);
  console.log(`   re-render  frames ${plan.startFrame}-${plan.endFrame - 1}  (${plan.patchedFrames} of ${plan.totalFrames} = ${pct}%, ~${(plan.patchedFrames / fps).toFixed(1)}s)`);
  console.log(`   stream-copy ${plan.copiedFrames} frames untouched (no re-encode, no generation loss)`);
  console.log(`   out        ${out}`);
  if (argv.includes("--dry-run")) process.exit(0);
  if (out === base) {
    console.error("refusing to overwrite the base render in place — pass --out <label> (writes video/final-<label>.mp4)");
    process.exit(1);
  }

  const { frames, seconds } = runPatch({ root: ROOT, cdir, outId, plan, fps, timescale, base, out });
  console.log(`OK ${out} — ${frames} frames / ${seconds.toFixed(2)}s of video at ${timescale} tbn verified (base had ${plan.totalFrames})`);
  console.log(`   next: node scripts/repair-dropouts.mjs ${out}`);
}
