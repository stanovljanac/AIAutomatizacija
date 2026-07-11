#!/usr/bin/env node
/**
 * 04b-thumbnails / extractor — produce 3 caption-free candidate stills from the video's OWN
 * timeline, plus content/<id>/thumb_candidates.json (the scoring record for future CTR learning).
 * The owner picks one (recorded via build-metadata --choose-thumb); nothing auto-uploads.
 *
 * Frame source (burned-in-captions problem — stills must NOT carry the caption layer):
 *   - engine:"hyperframes" scenes → grab from the scene's SILENT pre-rendered clip
 *     content/<id>/video/hf/<sceneId>.mp4 (captions live only in the Remotion main comp,
 *     so the clip is caption-free by construction).
 *   - engine:"remotion" scenes → fallback grab from video/final.mp4 at a timestamp where the
 *     timeline shows a CAPTION GAP inside the scene window (skip the scene if none exists).
 *
 * Settled-frame selection needs no vision model: the timeline's reveals say when every element
 * has entered; default ~75% through the scene, clamped before any exit/crossfade tail.
 *
 * CLI:
 *   node pipeline/04b-thumbnails/extract.mjs <id> [--count 3] [--force]
 *                                            [--logos '{"left":"brand/a.png","right":"brand/b.png"}']
 * Outputs (content/<id>/):
 *   images/thumb_candidate_{1..N}.png   caption-free stills, 1280x720
 *   images/thumb_final_{1..N}.png       final-ready (logo-composited when --logos given) for
 *                                       YouTube Studio Test & Compare (native A/B, takes 3)
 *   thumb_candidates.json               schema-valid scoring record (chosen:false until publish)
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { scoreScenes } from "./score-scenes.mjs";

export const CANDIDATE_COUNT = 3;
const CAPTION_PAD_S = 0.15; // a grab must clear a caption window by this much on both sides

/**
 * The SETTLED timestamp of a scene (absolute video-seconds): after the last enter-beat has
 * completed, before any exit/crossfade tail. Default ~75% through the scene; derived from the
 * timeline's reveal beats when present. Pure.
 */
export function settledSeconds(scene, { crossfadeSeconds = 0 } = {}) {
  const start = scene.start_seconds;
  const end = scene.end_seconds;
  const win = Math.max(end - start, 0);
  let t = start + 0.75 * win;
  const reveals = scene.reveals ?? [];
  if (reveals.length) {
    const lastEnter = Math.max(...reveals.map((r) => r.at_seconds));
    t = Math.max(t, lastEnter + Math.min(0.5, 0.1 * win)); // let the last element settle
  }
  const exitGuard = crossfadeSeconds + 0.4; // stay clear of the outgoing transition
  return Math.max(Math.min(t, end - exitGuard), start + 0.2 * win);
}

/**
 * Clip-LOCAL seconds for a frame grab from a pre-rendered HyperFrames scene clip. Mirrors the
 * compile-hyperframes window math EXACTLY (crossfade pull-back on every non-first scene), so the
 * grabbed frame is the same one the final composite shows at `absSeconds`. Pure.
 */
export function hfClipLocalSeconds(timeline, sceneIndex, absSeconds) {
  const fps = timeline.format.fps ?? 30;
  const F = (s) => Math.round(s * fps);
  const crossfadeFrames = F(timeline.crossfade_seconds ?? 0);
  const sc = timeline.scenes[sceneIndex];
  const fromFrame = F(sc.start_seconds) - (sceneIndex > 0 ? crossfadeFrames : 0);
  const durFrames = Math.max(F(sc.end_seconds) - fromFrame, 1);
  const local = Math.min(Math.max(F(absSeconds) - fromFrame, 0), durFrames - 1);
  return local / fps;
}

/**
 * A caption-free timestamp near `preferred` within [from, to], per the timeline's caption cues.
 * Returns `preferred` when it already clears every caption by CAPTION_PAD_S; otherwise the
 * midpoint of the caption gap closest to `preferred`; null when the window has no usable gap. Pure.
 */
export function captionFreeSeconds(captions, { from, to, preferred }) {
  const inWindow = (captions ?? [])
    .filter((c) => c.end_seconds > from && c.start_seconds < to)
    .sort((a, b) => a.start_seconds - b.start_seconds);
  const clear = (t) => inWindow.every((c) => t <= c.start_seconds - CAPTION_PAD_S || t >= c.end_seconds + CAPTION_PAD_S);
  if (preferred > from && preferred < to && clear(preferred)) return preferred;

  // gap boundaries: window start → c0.start, c0.end → c1.start, …, cN.end → window end
  const starts = [from, ...inWindow.map((c) => c.end_seconds)];
  const ends = [...inWindow.map((c) => c.start_seconds), to];
  const midpoints = starts
    .map((s, i) => ({ s, e: ends[i] }))
    .filter((g) => g.e - g.s >= CAPTION_PAD_S * 2)
    .map((g) => (g.s + g.e) / 2)
    .filter((t) => t > from && t < to && clear(t));
  if (!midpoints.length) return null;
  return midpoints.reduce((best, t) => (Math.abs(t - preferred) < Math.abs(best - preferred) ? t : best));
}

/**
 * Pick the top candidate scenes and compute each one's grab point. Pure — file existence is the
 * extractor's problem. Remotion-engine scenes that have no caption gap in their window are
 * skipped (the next-ranked scene takes the slot).
 * @returns candidate descriptors [{ scene_id, sceneIndex, template, score, reasons, timestamp_s, source, clip_local_s? }]
 */
export function pickCandidates(timeline, { count = CANDIDATE_COUNT } = {}) {
  const crossfadeSeconds = timeline.crossfade_seconds ?? 0;
  const out = [];
  for (const row of scoreScenes(timeline)) {
    if (out.length >= count) break;
    if (row.excluded || row.score <= 0) continue;
    const sc = timeline.scenes[row.index];
    const settled = settledSeconds(sc, { crossfadeSeconds });
    if (sc.engine === "hyperframes") {
      out.push({
        scene_id: sc.scene_id,
        sceneIndex: row.index,
        template: sc.template,
        score: row.score,
        reasons: row.reasons,
        timestamp_s: settled,
        source: "hf-clip",
        clip_local_s: hfClipLocalSeconds(timeline, row.index, settled),
      });
    } else {
      const t = captionFreeSeconds(timeline.captions, {
        from: sc.start_seconds,
        to: sc.end_seconds - crossfadeSeconds,
        preferred: settled,
      });
      if (t == null) continue; // no caption-free frame in this scene — next-ranked scene takes the slot
      out.push({
        scene_id: sc.scene_id,
        sceneIndex: row.index,
        template: sc.template,
        score: row.score,
        reasons: row.reasons,
        timestamp_s: t,
        source: "final-mp4",
      });
    }
  }
  return out;
}

/** The thumb_candidates.json records for a picked set (schema: thumb-candidates.schema.json). Pure. */
export function candidateRecords(candidates) {
  return candidates.map((c, i) => ({
    scene: c.scene_id,
    template: c.template,
    score: c.score,
    reasons: c.reasons,
    timestamp_s: Number(c.timestamp_s.toFixed(3)),
    file: `images/thumb_candidate_${i + 1}.png`,
    final: `images/thumb_final_${i + 1}.png`,
    source: c.source,
    chosen: false,
  }));
}

/** Vendored ffmpeg (templates/hyperframes/.bin) first, system ffmpeg otherwise. */
export function ffmpegPath(root) {
  const win = process.platform === "win32";
  const vendored = join(root, "templates", "hyperframes", ".bin", win ? "ffmpeg.exe" : "ffmpeg");
  return existsSync(vendored) ? vendored : "ffmpeg";
}

/** ffmpeg argv for one still grab (1280x720 PNG). Pure — isolated so flags are testable. */
export function buildGrabCommand({ ffmpeg, src, atSeconds, outFile }) {
  return {
    cmd: ffmpeg,
    args: ["-y", "-ss", atSeconds.toFixed(3), "-i", src, "-frames:v", "1", "-vf", "scale=1280:720", "-update", "1", outFile],
  };
}

/**
 * Side-effecting: grab every candidate still into content/<id>/images/. Idempotent: an existing
 * PNG is kept unless `force`. Throws on a missing source or a non-zero ffmpeg exit (fail loud —
 * the phase is resumable).
 */
export function extractStills({ root, cdir, candidates, records, force = false, spawn = spawnSync }) {
  const ffmpeg = ffmpegPath(root);
  const imagesDir = join(cdir, "images");
  mkdirSync(imagesDir, { recursive: true });
  const done = [];
  candidates.forEach((c, i) => {
    const outFile = join(cdir, records[i].file);
    if (existsSync(outFile) && !force) {
      done.push({ scene: c.scene_id, skipped: true });
      return;
    }
    const src =
      c.source === "hf-clip" ? join(cdir, "video", "hf", `${c.scene_id}.mp4`) : join(cdir, "video", "final.mp4");
    if (!existsSync(src)) throw new Error(`thumbnail source missing for ${c.scene_id}: ${src}`);
    const atSeconds = c.source === "hf-clip" ? c.clip_local_s : c.timestamp_s;
    const { cmd, args } = buildGrabCommand({ ffmpeg, src, atSeconds, outFile });
    const res = spawn(cmd, args, { encoding: "utf8" });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(`ffmpeg grab failed for ${c.scene_id} (exit ${res.status}): ${(res.stderr ?? "").slice(-400)}`);
    if (!existsSync(outFile)) throw new Error(`ffmpeg reported success but ${outFile} was not produced`);
    done.push({ scene: c.scene_id, skipped: false });
  });
  return done;
}

/**
 * Side-effecting: make every candidate FINAL-READY (thumb_final_N.png) so all 3 can go straight
 * into YouTube Studio Test & Compare. With `logos` ({left,right,excel} paths relative to
 * templates/remotion/public/) each still is composited through the existing Remotion
 * ThumbComposite; without logos the still is already final — it is copied 1:1 (no browser spawn).
 */
export function compositeFinals({ root, cdir, records, logos = null, force = false, spawn = spawnSync }) {
  const remotionDir = join(root, "templates", "remotion");
  for (const rec of records) {
    const bgAbs = join(cdir, rec.file);
    const outAbs = join(cdir, rec.final);
    if (existsSync(outAbs) && !force) continue;
    if (!logos) {
      copyFileSync(bgAbs, outAbs);
      continue;
    }
    // stage the bg into public/ (staticFile requirement), render the still, point at the result
    const stagedRel = join("_thumb-tmp", `${rec.file.split("/").pop()}`).replace(/\\/g, "/");
    const stagedAbs = join(remotionDir, "public", stagedRel);
    mkdirSync(dirname(stagedAbs), { recursive: true });
    copyFileSync(bgAbs, stagedAbs);
    const props = { bg: stagedRel, ...logos };
    const propsFile = join(remotionDir, "public", "_thumb-tmp", `${rec.file.split("/").pop()}.props.json`);
    writeFileSync(propsFile, JSON.stringify(props) + "\n");
    const winShell = process.platform === "win32";
    const args = ["remotion", "still", "ThumbComposite", outAbs, `--props=${propsFile}`];
    const q = (a) => (winShell ? a.map((x) => (/[\s&|<>^()"]/.test(x) ? `"${x}"` : x)) : a);
    const res = spawn("npx", q(args), { cwd: remotionDir, encoding: "utf8", shell: winShell });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(`ThumbComposite still failed for ${rec.file} (exit ${res.status}): ${(res.stderr ?? "").slice(-400)}`);
  }
}

/**
 * The whole 04b step for one video: read timeline.json → pick → grab stills → composite finals →
 * write thumb_candidates.json (schema-validated). Idempotent/resumable per the pipeline contract:
 * with an existing, complete candidate set and !force this is a no-op.
 */
export function runThumbnails({ root, id, count = CANDIDATE_COUNT, logos = null, force = false, spawn = spawnSync }) {
  const cdir = join(root, "content", id);
  const jsonPath = join(cdir, "thumb_candidates.json");

  if (!force && existsSync(jsonPath)) {
    const existing = JSON.parse(readFileSync(jsonPath, "utf8"));
    const complete = existing.length && existing.every((r) => existsSync(join(cdir, r.file)) && existsSync(join(cdir, r.final ?? r.file)));
    if (complete) return { records: existing, skipped: true };
  }

  const timeline = JSON.parse(readFileSync(join(cdir, "timeline.json"), "utf8"));
  const candidates = pickCandidates(timeline, { count });
  if (!candidates.length) throw new Error(`no thumbnail candidates found for ${id} — no scene scored > 0 (fall back to the 2-image-prompt flow, visual-prompts skill)`);
  const records = candidateRecords(candidates);

  extractStills({ root, cdir, candidates, records, force, spawn });
  compositeFinals({ root, cdir, records, logos, force, spawn });

  const { valid, errors } = validate(records, "thumb_candidates.json");
  if (!valid) throw new Error(`thumb_candidates.json invalid: ${formatErrors(errors)}`);
  writeFileSync(jsonPath, JSON.stringify(records, null, 2) + "\n");
  return { records, skipped: false };
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const argv = process.argv.slice(2);
  const id = argv.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: node pipeline/04b-thumbnails/extract.mjs <content_id> [--count N] [--force] [--logos '{\"left\":\"brand/a.png\"}']");
    process.exit(2);
  }
  const force = argv.includes("--force");
  const countIx = argv.indexOf("--count");
  const count = countIx > -1 ? Number(argv[countIx + 1]) : CANDIDATE_COUNT;
  const logosIx = argv.indexOf("--logos");
  const logos = logosIx > -1 ? JSON.parse(argv[logosIx + 1]) : null;

  const { records, skipped } = runThumbnails({ root: ROOT, id, count, logos, force });
  if (skipped) console.log(`SKIP ${id}: thumb_candidates.json complete (use --force to re-extract)`);
  for (const r of records) {
    console.log(`  ${r.file}  ← ${r.scene} (${r.template}) @ ${r.timestamp_s}s  score ${r.score} [${r.reasons.join(", ")}]${r.chosen ? "  CHOSEN" : ""}`);
  }
  console.log(`OK ${records.length} candidate(s) → content/${id}/images/  (owner picks; Test & Compare takes all 3)`);
}
