// Portrait readiness of a HyperFrames scene (1B, D-074). A Short renders at 1080×1920; a scene built
// only for 16:9 crops its subject and pushes its HUD off the frame when it is rendered tall. Shared by
// make-shorts.mjs (the readiness report), compile-hyperframes.mjs (the gate before a Short render) and
// 05-qa/check.mjs (the sign-off before the owner sees a Short).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** PURE: is the scene authored at 1080×1920 (composed for 9:16 from scratch)? */
export function nativePortrait(sources = []) {
  return /HF\.scene\(\{[^}]*width:\s*1080[^}]*height:\s*1920/.test(sources.join("\n"));
}

/**
 * PURE: does a scene have a portrait framing? Native portrait (authored at 1080×1920) or a portrait
 * branch (`S.portrait`, a `.portrait` CSS rule — the class hf-scene.js sets when H > W). Read from its
 * own source text: a heuristic on purpose. Having a branch only makes a scene RENDERABLE tall — it says
 * nothing about how it looks (the rejected 023 Short cuts, 2026-10-18), which is portraitSignoffProblems.
 * @param {string[]} sources  the scene's .js / .css / .html contents
 */
export function portraitReady(sources = []) {
  if (nativePortrait(sources)) return true;
  return /\.portrait\b|\bS\.portrait\b|\bportrait\s*[?:&|)]/.test(sources.join("\n"));
}

/** The scene's own source files, or null when the scene does not exist. */
export function sceneSources(root, name) {
  const dir = join(root, "templates", "hyperframes", "scenes", name);
  if (!existsSync(dir)) return null;
  return readdirSync(dir).filter((f) => /\.(js|css|html)$/.test(f)).map((f) => readFileSync(join(dir, f), "utf8"));
}

/**
 * The HF jobs of a portrait render whose scene has no portrait framing. A plan entry can waive the
 * check for one scene with `props.portrait_ok: true` (compile-hyperframes carries it as `portraitOk`,
 * outside the render variables) — set only after looking at the scene's tall frame.
 * @returns {string[]} one line per offending job
 */
export function portraitProblems(jobs, readSources) {
  return jobs
    .filter((j) => j.height > j.width && j.portraitOk !== true)
    .filter((j) => {
      const src = readSources(j.hfScene);
      return src && !portraitReady(src);
    })
    .map((j) => `${j.sceneId} ${j.hfScene}: no portrait framing (add its .portrait camera + HUD, or set props.portrait_ok after checking a still)`);
}

/** What a portrait sign-off means — the three things the rejected 023 cuts failed (owner, 2026-10-18). */
export const PORTRAIT_CHECK =
  "look at its tall frame at phone size: nothing lands over anything else (layering law), the subject and every word read against the background (contrast), and the subject uses the frame instead of the top half (fill)";

/**
 * PURE: the scenes of a Short CUT from a long (a derived unit) whose tall frame nobody signed off.
 * A landscape scene's portrait branch was written blind when the long was made and is first seen when
 * the Short renders, so every one needs `props.portrait_ok: true` (on the long's plan entry, which the
 * cut copies, or on the unit's) — given only after PORTRAIT_CHECK. A native-portrait scene was composed
 * for 9:16 and checked with its own video, so it needs none.
 * @param {object[]} planScenes  the unit's scene-plan scenes
 * @param {(name: string) => string[] | null} readSources
 * @returns {string[]} one line per unsigned scene
 */
export function portraitSignoffProblems(planScenes = [], readSources) {
  return planScenes
    .filter((e) => e.engine === "hyperframes" && e.props?.hf_scene && e.props.portrait_ok !== true)
    .filter((e) => {
      const src = readSources(e.props.hf_scene);
      return !src || !nativePortrait(src);
    })
    .map((e) => `${e.scene_id} ${e.props.hf_scene}`);
}
