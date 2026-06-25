#!/usr/bin/env node
/**
 * 04-render / Remotion engine compiler (V5). Translates the engine-agnostic `content/<id>/timeline.json`
 * (absolute SECONDS) into the Remotion render props (`templates/remotion/props/<outId>.json`, FRAMES)
 * and copies the engine's assets (narration, capture clips, brand logos, b-roll) into Remotion public/.
 *
 * It is the seam that makes the renderer swappable: build-props.mjs builds the timeline (sync logic);
 * THIS file owns everything Remotion-specific (frame quantization, crossfade pull-back, reveal lead,
 * public/ asset layout). A sibling compile-hyperframes.mjs will read the SAME timeline for HF scenes.
 *
 * Usually invoked in-process by build-props.mjs. Standalone (resume from an existing timeline):
 *   node pipeline/04-render/compile-remotion.mjs 004-foo
 *   node pipeline/04-render/compile-remotion.mjs 004-foo/short
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { localizeCueWindow } from "./lib/focal.mjs";

/**
 * PURE: timeline (seconds) → Remotion render props (frames). No fs. Frame-accurate by construction
 * (see lib/timeline.mjs contract) so the output is byte-identical to the old inline build-props math.
 *
 * @param {object} timeline   a timeline.json object
 * @param {object} opts
 * @param {number} opts.leadFrames    start each reveal this many frames early so it lands on the cue
 * @param {number} opts.tailSeconds   keep a caption this long after its last word
 */
export function compileTimeline(timeline, { leadFrames = 0, tailSeconds = 0 } = {}) {
  const fps = timeline.format.fps;
  const F = (s) => Math.round(s * fps);
  const introFrames = F(timeline.intro.duration_seconds);
  const outroFrames = F(timeline.outro.duration_seconds);
  const totalFrames = F(timeline.duration_seconds);
  const crossfadeFrames = F(timeline.crossfade_seconds ?? 0);
  const narrationEndFrame = totalFrames - outroFrames; // == introFrames + audioFrames

  const scenes = timeline.scenes.map((sc, k) => {
    const fromFrame = F(sc.start_seconds) - (k > 0 ? crossfadeFrames : 0);
    const durFrames = Math.max(F(sc.end_seconds) - fromFrame, 1);
    const props = { ...sc.props };
    if (props.focalZoom) props.focalZoom = localizeCueWindow(props.focalZoom, { fps, sceneFromFrame: fromFrame });
    if (props.pip) props.pip = localizeCueWindow(props.pip, { fps, sceneFromFrame: fromFrame });
    if (Array.isArray(sc.reveals)) {
      props.reveals = sc.reveals.map((r) => Math.max(F(r.at_seconds) - fromFrame - leadFrames, 0));
    }
    // Pass `engine` through ONLY for hyperframes scenes (conditional spread) so remotion-only
    // timelines — including the golden fixture — stay BYTE-IDENTICAL to the pre-V6 props.
    return { sceneId: sc.scene_id, template: sc.template, props, fromFrame, durFrames, ...(sc.engine === "hyperframes" ? { engine: "hyperframes" } : {}) };
  });

  const n = timeline.captions.length;
  const captions = timeline.captions.map((cue, gi) => {
    const from = F(cue.start_seconds);
    const nextFrom = gi + 1 < n ? F(timeline.captions[gi + 1].start_seconds) : narrationEndFrame;
    const cap = F(cue.end_seconds + tailSeconds); // drop the chunk shortly after its last word
    const durFrames = Math.max(Math.min(nextFrom, cap) - from, 1);
    const words = cue.words.map((w) => ({
      w: w.w,
      relFrom: F(w.start_seconds - cue.start_seconds),
      relDur: Math.max(F(w.end_seconds - w.start_seconds), 1),
    }));
    return { fromFrame: from, durFrames, words };
  });

  return {
    fps,
    width: timeline.format.width,
    height: timeline.format.height,
    introFrames,
    outroFrames,
    totalFrames,
    crossfadeFrames,
    audioSrc: timeline.audio.src,
    audioFromFrame: F(timeline.audio.start_seconds),
    intro: { wordmark: timeline.intro.wordmark, tagline: timeline.intro.tagline },
    outro: { cta: timeline.outro.cta, brand: timeline.outro.brand },
    motion: timeline.motion,
    scenes,
    captions,
  };
}

/**
 * PURE: the vendored-ffmpeg argv that copies the VIDEO stream and DROPS the audio. Screen-recorded
 * capture clips often carry the owner's desktop/mic audio; the final video has exactly ONE audio track
 * (the narration in Remotion), so every ingested capture must be provably silent (-an). `-c:v copy`
 * remuxes without re-encoding (fast, lossless); `-map 0:v:0` keeps only the first video stream.
 */
export function stripAudioCommand({ ffbin, src, dst }) {
  return { cmd: ffbin, args: ["-y", "-loglevel", "error", "-i", src, "-map", "0:v:0", "-c:v", "copy", "-an", dst] };
}

/**
 * Side-effecting: copy a capture clip to `dst` with its audio stripped (see stripAudioCommand). Uses the
 * repo's vendored ffmpeg (templates/hyperframes/.bin) when present, else a system `ffmpeg`. If ffmpeg is
 * missing or fails, falls back to a raw copy so a render is never blocked — but returns a LOUD warning
 * (qa-video asserts the clip is silent). `spawn` is injectable for tests.
 * @returns {string[]} warnings
 */
export function copyCaptureSilent({ root, src, dst, spawn = spawnSync }) {
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const vendored = join(root, "templates", "hyperframes", ".bin", exe);
  const ffbin = existsSync(vendored) ? vendored : "ffmpeg";
  const { cmd, args } = stripAudioCommand({ ffbin, src, dst });
  const res = spawn(cmd, args, { encoding: "utf8" });
  if (res?.error || res?.status !== 0 || !existsSync(dst)) {
    cpSync(src, dst); // never block the render — but make the leftover-audio risk impossible to miss
    const why = res?.error ? res.error.message : `exit ${res?.status}`;
    return [`CAPTURE AUDIO NOT STRIPPED: ${src} (ffmpeg ${why}) — copied as-is; the clip may carry desktop/mic audio. Install ffmpeg or vendor it at templates/hyperframes/.bin.`];
  }
  return [];
}

/**
 * Side-effecting: copy this engine's assets into templates/remotion/public/<outId>/ and resolve the
 * logical refs in the (already-compiled) Remotion `props` to public/ paths. Mutates `props.scenes[*].props`.
 * Returns a list of human warnings (missing clips, disabled b-roll…). The narration track lives ONLY in
 * Remotion (HF scenes are silent), so it is always copied here. `spawn` is injectable for tests.
 */
export function copyRemotionAssets({ root, cdir, outId, props, brollEnabled = true, spawn = spawnSync }) {
  const warnings = [];
  const pubDir = join(root, "templates/remotion/public", outId);

  // capture-segment clips → public/<outId>/<capId>.mp4
  for (const sc of props.scenes) {
    if (sc.template !== "capture-segment") continue;
    const capId = sc.props?.capture_id;
    if (!capId) { warnings.push(`capture-segment ${sc.sceneId} has no capture_id`); continue; }
    const srcFile = join(cdir, "captures", `${capId}.mp4`);
    if (!existsSync(srcFile)) { warnings.push(`capture clip missing: ${srcFile}`); continue; }
    mkdirSync(pubDir, { recursive: true });
    for (const w of copyCaptureSilent({ root, src: srcFile, dst: join(pubDir, `${capId}.mp4`), spawn })) warnings.push(w);
    sc.props.src = `${outId}/${capId}.mp4`;
  }

  // brand logos: copy assets/brand/* → public/brand/, then STRIP any logo whose file is missing so a
  // scene falls back to a wordmark instead of crashing the render.
  const brandSrc = join(root, "assets", "brand");
  const brandDst = join(root, "templates/remotion/public/brand");
  if (existsSync(brandSrc)) {
    mkdirSync(brandDst, { recursive: true });
    for (const f of readdirSync(brandSrc)) if (/\.(png|jpe?g|webp|svg)$/i.test(f)) cpSync(join(brandSrc, f), join(brandDst, f));
  }
  for (const sc of props.scenes) for (const key of ["leftLogo", "rightLogo", "logo"]) {
    const v = sc.props?.[key];
    if (v && !existsSync(join(root, "templates/remotion/public", v))) delete sc.props[key];
  }

  // b-roll: only when the format enables it (default off — prefer code-drawn/custom scenes).
  const brollSlug = (q) => String(q).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const sc of props.scenes) {
    if (!sc.props?.broll) continue;
    if (!brollEnabled) {
      warnings.push(`b-roll disabled by format (scene_set.broll.enabled=false): ignoring broll "${sc.props.broll}" on ${sc.sceneId} — use a code-drawn/custom scene instead.`);
      delete sc.props.broll;
      continue;
    }
    const slug = brollSlug(sc.props.broll);
    const f = join(cdir, "broll", `${slug}.mp4`);
    if (existsSync(f)) {
      const d = join(pubDir, "broll");
      mkdirSync(d, { recursive: true });
      cpSync(f, join(d, `${slug}.mp4`));
      sc.props.brollSrc = `${outId}/broll/${slug}.mp4`;
    } else {
      warnings.push(`b-roll missing for "${sc.props.broll}" — run: node pipeline/03-visuals/fetch-stock.mjs (scene renders without b-roll)`);
    }
  }

  // continuous narration → public/<outId>/narration.mp3
  mkdirSync(pubDir, { recursive: true });
  cpSync(join(cdir, "voice/narration.mp3"), join(pubDir, "narration.mp3"));
  return warnings;
}

// ── standalone CLI (resume from an existing timeline.json) ──────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const id = process.argv[2];
  if (!id) { console.error("usage: compile-remotion.mjs <content_id>"); process.exit(1); }
  const cdir = join(ROOT, "content", id);
  const outId = id.replace(/[\\/]/g, "-");
  const seg = id.split(/[\\/]/).pop();
  const vertical = seg === "short" || seg.endsWith("-short");

  const timeline = JSON.parse(readFileSync(join(cdir, "timeline.json"), "utf8"));
  const script = JSON.parse(readFileSync(join(cdir, "script.json"), "utf8"));
  const brief = existsSync(join(cdir, "brief.json")) ? JSON.parse(readFileSync(join(cdir, "brief.json"), "utf8")) : {};
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });
  const timings = deriveRenderTimings(fmt, { fps: timeline.format.fps, vertical });

  const props = compileTimeline(timeline, { leadFrames: timings.leadFrames, tailSeconds: timings.captions.tailSeconds });
  const warnings = copyRemotionAssets({ root: ROOT, cdir, outId, props, brollEnabled: fmt.scene_set?.broll?.enabled !== false });
  for (const w of warnings) console.warn(w);

  const outDir = join(ROOT, "templates/remotion/props");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${outId}.json`), JSON.stringify(props, null, 2) + "\n");
  console.log(`OK props/${outId}.json  (${props.scenes.length} scenes, ${props.captions.length} caption cues) from timeline.json`);
}
