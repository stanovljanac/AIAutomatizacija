#!/usr/bin/env node
/**
 * 04-render / HyperFrames engine compiler (V6). Reads the SAME engine-agnostic
 * `content/<id>/timeline.json` as compile-remotion.mjs and renders every scene tagged
 * `engine:"hyperframes"` to a SILENT mp4 clip at its EXACT Remotion scene window, so the clip
 * composites 1:1 into the Remotion timeline via OffthreadVideo (see components/HfClip.tsx).
 *
 * Split of responsibilities (the "combo" engine, D-019):
 *   - buildHyperframesJobs()    PURE: timeline (seconds) → render jobs (frames + the variables contract)
 *   - renderHyperframesScenes() side-effecting: write <sceneId>.variables.json + spawn `npx hyperframes render`
 *                               into content/<id>/video/hf/<sceneId>.mp4 (idempotent/resumable)
 *   - copyHyperframesClips()    side-effecting: copy the clips into templates/remotion/public/<outId>/hf/
 *                               and set props.hfSrc on the compiled Remotion props (mirrors copyRemotionAssets)
 *
 * The one continuous narration.mp3 lives ONLY in Remotion — HyperFrames scenes are silent visuals.
 *
 * SCENE-WINDOW MATH — mirrors compile-remotion.mjs compileTimeline EXACTLY (crossfade pull-back on
 * every non-first scene of the WHOLE timeline, reveal lead subtraction, >=1 frame), so the HF clip
 * covers the Remotion scene window frame-for-frame:
 *   F = (s) => Math.round(s * fps)
 *   fromFrame = F(start_seconds) - (k > 0 ? crossfadeFrames : 0)    // k = index in timeline.scenes
 *   durFrames = Math.max(F(end_seconds) - fromFrame, 1)
 *   revealRel = Math.max(F(at_seconds) - fromFrame - leadFrames, 0)
 *
 * Standalone CLI (rendering NEVER happens inside build-props — only here):
 *   node pipeline/04-render/compile-hyperframes.mjs 004-foo [--force]
 *   node pipeline/04-render/compile-hyperframes.mjs 004-foo/short [--force]
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";

/**
 * PURE: timeline (seconds) → HyperFrames render jobs. No fs. Each job carries the fixed VARIABLES
 * CONTRACT the hero scene consumes ({ fps, width, height, durationFrames, durationSeconds,
 * revealsSeconds, props }) plus addressing fields (sceneId, sceneIndex, hfScene, outFile).
 *
 * @param {object} timeline             a timeline.json object
 * @param {object} opts
 * @param {number} opts.leadFrames      start each reveal this many frames early (same as Remotion)
 * @returns {{ jobs: object[], warnings: string[] }}
 */
export function buildHyperframesJobs(timeline, { leadFrames = 0 } = {}) {
  const fps = timeline.format.fps;
  const F = (s) => Math.round(s * fps);
  const crossfadeFrames = F(timeline.crossfade_seconds ?? 0);
  const jobs = [];
  const warnings = [];

  timeline.scenes.forEach((sc, k) => {
    if (sc.engine !== "hyperframes") return;
    // window math — MUST mirror compile-remotion.mjs compileTimeline (k indexes the FULL scene list)
    const fromFrame = F(sc.start_seconds) - (k > 0 ? crossfadeFrames : 0);
    const durationFrames = Math.max(F(sc.end_seconds) - fromFrame, 1);
    const { hf_scene: hfScene, ...props } = sc.props ?? {};
    if (!hfScene) {
      warnings.push(`hyperframes scene ${sc.scene_id} has no props.hf_scene (the templates/hyperframes/scenes/<name> to render) — skipped`);
      return;
    }
    const revealsSeconds = Array.isArray(sc.reveals)
      ? sc.reveals.map((r) => Math.max(F(r.at_seconds) - fromFrame - leadFrames, 0) / fps)
      : [];
    jobs.push({
      sceneId: sc.scene_id,
      sceneIndex: k,
      hfScene,
      fps,
      width: timeline.format.width,
      height: timeline.format.height,
      durationFrames,
      durationSeconds: durationFrames / fps,
      revealsSeconds,
      props,
      outFile: `${sc.scene_id}.mp4`,
    });
  });

  return { jobs, warnings };
}

/**
 * The variables-file payload a HyperFrames hero scene consumes (the fixed contract). Pure.
 * `hfScene` leads the object so the file records WHICH hero template rendered it: it is part of the
 * idempotency cache key (renderHyperframesScenes compares this JSON), so changing only props.hf_scene
 * correctly invalidates a stale clip. The hero scene ignores the extra key.
 */
export function jobVariables(job) {
  return {
    hfScene: job.hfScene,
    fps: job.fps,
    width: job.width,
    height: job.height,
    durationFrames: job.durationFrames,
    durationSeconds: job.durationSeconds,
    revealsSeconds: job.revealsSeconds,
    props: job.props,
  };
}

/**
 * The render-command shapes, isolated so flags are trivial to adjust if the CLI surface moves.
 * Pure. cwd for BOTH steps is templates/hyperframes (where the package lives).
 *
 * hyperframes v0.6.70 takes frame count + canvas size from STATIC entry attributes (its
 * duration probe never receives --variables), so each scene ships a make-entry.mjs pre-step
 * that patches the exact geometry/duration into a disposable entry and prints its path
 * (relative to the scene dir) on stdout — that path is then passed via -c.
 */
export function buildEntryCommand(job, { varsFile }) {
  return { cmd: "node", args: [`scenes/${job.hfScene}/make-entry.mjs`, varsFile] };
}

export function buildRenderCommand(job, { varsFile, outFile, entry }) {
  return {
    cmd: "npx",
    args: [
      "hyperframes", "render",
      `./scenes/${job.hfScene}`,
      "-c", entry,
      "--variables-file", varsFile,
      "--fps", String(job.fps),
      "--quality", "high",
      "--output", outFile,
    ],
  };
}

/**
 * Side-effecting: render each job to content/<id>/video/hf/<sceneId>.mp4 (SILENT clip), writing
 * <sceneId>.variables.json next to it. Idempotent/resumable: a job is SKIPPED when its mp4 already
 * exists AND the variables file content is unchanged AND !force. Throws on a non-zero exit.
 *
 * @param {object} args
 * @param {string} args.root    repo root
 * @param {string} args.cdir    content/<id> dir
 * @param {object[]} args.jobs  from buildHyperframesJobs
 * @param {boolean} [args.force]
 * @param {Function} [args.spawn]  spawnSync-compatible injection point (tests never launch a browser)
 * @returns {{ rendered: string[], skipped: string[] }} sceneIds by outcome
 */
export function renderHyperframesScenes({ root, cdir, jobs, force = false, spawn = spawnSync }) {
  const hfDir = join(cdir, "video", "hf");
  const hfRoot = join(root, "templates", "hyperframes");
  // hyperframes shells out to ffmpeg to encode; the repo vendors a copy in templates/hyperframes/.bin
  // (no system ffmpeg required). Prepend it to the child PATH so the render finds it deterministically.
  const binDir = join(hfRoot, ".bin");
  const childEnv = existsSync(binDir)
    ? { ...process.env, PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}` }
    : { ...process.env };
  const winShell = process.platform === "win32";
  // Under shell:true (needed for npx.cmd on Windows) the cmd + args are concatenated with spaces and
  // re-parsed by cmd.exe, so any arg containing a space (this repo lives under "AI Automatizacija") or a
  // shell metachar must be quoted or it gets split. POSIX shells aren't used here (shell:false), so no-op.
  const q = (args) => (winShell ? args.map((a) => (/[\s&|<>^()"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args);
  const rendered = [];
  const skipped = [];

  for (const job of jobs) {
    mkdirSync(hfDir, { recursive: true });
    const varsFile = join(hfDir, `${job.sceneId}.variables.json`);
    const outFile = join(hfDir, job.outFile);
    const varsJson = JSON.stringify(jobVariables(job), null, 2) + "\n";

    const unchanged = existsSync(outFile) && existsSync(varsFile) && readFileSync(varsFile, "utf8") === varsJson;
    if (unchanged && !force) {
      console.log(`SKIP ${job.sceneId} — ${job.outFile} exists and variables unchanged (use --force to re-render)`);
      skipped.push(job.sceneId);
      continue;
    }

    writeFileSync(varsFile, varsJson);

    // pre-step: derive the disposable render entry (exact geometry/duration) from the variables
    const ec = buildEntryCommand(job, { varsFile });
    const eres = spawn(ec.cmd, q(ec.args), { cwd: hfRoot, env: childEnv, encoding: "utf8", shell: winShell });
    if (eres.error) throw eres.error;
    if (eres.status !== 0) throw new Error(`make-entry failed for ${job.sceneId} (exit ${eres.status}): ${eres.stderr ?? ""}`);
    const entry = String(eres.stdout ?? "").trim();
    if (!entry) throw new Error(`make-entry printed no entry path for ${job.sceneId}`);

    const { cmd, args } = buildRenderCommand(job, { varsFile, outFile, entry });
    console.log(`RENDER ${job.sceneId} → ${job.outFile}  (${job.durationFrames}f @ ${job.fps}fps, ${job.width}x${job.height}, scene ${job.hfScene})`);
    const res = spawn(cmd, q(args), { cwd: hfRoot, env: childEnv, stdio: "inherit", shell: winShell });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(`hyperframes render failed for ${job.sceneId} (exit ${res.status})`);
    if (!existsSync(outFile)) throw new Error(`hyperframes render reported success but ${outFile} was not produced (${job.sceneId})`);
    rendered.push(job.sceneId);
  }

  return { rendered, skipped };
}

/**
 * Side-effecting: copy the pre-rendered HF clips into templates/remotion/public/<outId>/hf/ and
 * resolve each compiled Remotion props scene (engine:"hyperframes") to its public path via
 * props.hfSrc. Mutates props.scenes[*].props. Returns human warnings (mirrors copyRemotionAssets).
 */
export function copyHyperframesClips({ root, cdir, outId, props }) {
  const warnings = [];
  const id = relative(join(root, "content"), cdir).replace(/\\/g, "/");
  for (const sc of props.scenes) {
    if (sc.engine !== "hyperframes") continue;
    const clip = join(cdir, "video", "hf", `${sc.sceneId}.mp4`);
    if (!existsSync(clip)) {
      warnings.push(`hyperframes clip missing for ${sc.sceneId}: ${clip} — run: node pipeline/04-render/compile-hyperframes.mjs ${id} (scene falls back to its Remotion template)`);
      continue;
    }
    const dstDir = join(root, "templates/remotion/public", outId, "hf");
    mkdirSync(dstDir, { recursive: true });
    cpSync(clip, join(dstDir, `${sc.sceneId}.mp4`));
    sc.props.hfSrc = `${outId}/hf/${sc.sceneId}.mp4`;
  }
  return warnings;
}

// ── standalone CLI (render the HF clips for an existing timeline.json) ───────────────────────────
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const id = argv.find((a) => !a.startsWith("--"));
  if (!id) { console.error("usage: compile-hyperframes.mjs <content_id> [--force]"); process.exit(1); }
  const cdir = join(ROOT, "content", id);
  const seg = id.split(/[\\/]/).pop();
  const vertical = seg === "short" || seg.endsWith("-short");

  const timeline = JSON.parse(readFileSync(join(cdir, "timeline.json"), "utf8"));
  const script = JSON.parse(readFileSync(join(cdir, "script.json"), "utf8"));
  const brief = existsSync(join(cdir, "brief.json")) ? JSON.parse(readFileSync(join(cdir, "brief.json"), "utf8")) : {};
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });
  const timings = deriveRenderTimings(fmt, { fps: timeline.format.fps, vertical });

  const { jobs, warnings } = buildHyperframesJobs(timeline, { leadFrames: timings.leadFrames });
  for (const w of warnings) console.warn(w);
  if (!jobs.length) {
    console.log(`No engine:"hyperframes" scenes in ${id}/timeline.json — nothing to render.`);
    process.exit(0);
  }
  const { rendered, skipped } = renderHyperframesScenes({ root: ROOT, cdir, jobs, force });
  console.log(`OK hyperframes: ${rendered.length} rendered, ${skipped.length} skipped → content/${id}/video/hf/`);
  console.log(`   next: node pipeline/04-render/build-props.mjs ${id}  (composites the clips via props.hfSrc)`);
}
