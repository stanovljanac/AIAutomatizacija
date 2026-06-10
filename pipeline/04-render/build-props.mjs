#!/usr/bin/env node
/**
 * 04-render: build the engine-agnostic TIMELINE for a video, then compile it to Remotion render props.
 *
 * Pipeline (V5): script + scene-plan + alignment ──► buildTimeline() ──► content/<id>/timeline.json
 * (absolute SECONDS, per-scene `engine`, the forced-alignment SYNC logic) ──► compileTimeline() +
 * asset copy ──► templates/remotion/props/<outId>.json (FRAMES). The seconds→frames math + Remotion
 * public/ assets live in compile-remotion.mjs, so swapping/adding a render engine doesn't touch sync.
 *
 *   node pipeline/04-render/build-props.mjs 002-what-is-ai-automation
 *   node pipeline/04-render/build-props.mjs 004-foo/short        # nested Short unit
 *   then:  cd templates/remotion && npx remotion render Main out/<outId>.mp4 --props=props/<outId>.json
 *   (<outId> = the content id with slashes flattened, e.g. 004-foo/short → 004-foo-short)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { openingHasHook, SPARSE_TEMPLATES } from "./lib/policy.mjs";
import { buildTimeline } from "./lib/timeline.mjs";
import { compileTimeline, copyRemotionAssets } from "./compile-remotion.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const id = process.argv[2];
if (!id) { console.error("usage: build-props.mjs <content_id>"); process.exit(1); }

const cdir = join(ROOT, "content", id);
const cfg = JSON.parse(readFileSync(join(ROOT, "pipeline/shared/config.json"), "utf8"));
const script = JSON.parse(readFileSync(join(cdir, "script.json"), "utf8"));
const plan = JSON.parse(readFileSync(join(cdir, "scene-plan.json"), "utf8"));
const al = JSON.parse(readFileSync(join(cdir, "alignment.json"), "utf8"));
// Resolve the FORMAT recipe (the "show bible") — single source of truth for production-policy knobs
// (intro/outro, crossfade, caption density, length, motion). brief.json carries archetype/series and
// any per-video override; fall back to the script's archetype.
const brief = existsSync(join(cdir, "brief.json")) ? JSON.parse(readFileSync(join(cdir, "brief.json"), "utf8")) : {};
const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });

const fps = cfg.render?.fps ?? 30;
// Short detection by the LAST path segment, so both schemes work:
//   new nested: content/004-foo/short  (seg === "short")  · legacy flat: content/002-short (-short)
const seg = id.split(/[\\/]/).pop();
const vertical = seg === "short" || seg.endsWith("-short"); // → 1080x1920 Short
const dims = vertical ? (cfg.render?.short ?? { width: 1080, height: 1920 }) : (cfg.render?.long ?? { width: 1920, height: 1080 });
const outId = id.replace(/[\\/]/g, "-"); // flat artifact id: 004-foo/short → 004-foo-short
const timings = deriveRenderTimings(fmt, { fps, vertical });
const xf = cfg.render?.crossfadeFrames ?? timings.crossfadeFrames; // config override wins, else format

// HARD RULE: Short length — format.length.short (target ~55s, min 45, hard max 120). Fail closed.
if (vertical && (al.duration < timings.shortLen.min || al.duration > timings.shortLen.max)) {
  console.error(`\nSHORT LENGTH RULE (format.length.short): ${id} narration is ${al.duration.toFixed(1)}s — must be ${timings.shortLen.min}-${timings.shortLen.max}s (target ~${timings.shortLen.target}s). Fix the Short script before rendering.\n`);
  process.exit(1);
}

// 1) Build the engine-agnostic timeline (the sync logic), validate it, and persist it.
const timeline = buildTimeline({ script, plan, alignment: al, fmt, timings, fps, crossfadeFrames: xf, dims, outId });
const { valid, errors } = validate(timeline, "timeline");
if (!valid) { console.error(`timeline.json failed its schema: ${formatErrors(errors)}`); process.exit(1); }
writeFileSync(join(cdir, "timeline.json"), JSON.stringify(timeline, null, 2) + "\n");

// 2) Compile it to Remotion props (frames) + copy this engine's assets into public/.
const props = compileTimeline(timeline, { leadFrames: timings.leadFrames, tailSeconds: timings.captions.tailSeconds });
const warnings = copyRemotionAssets({ root: ROOT, cdir, outId, props, brollEnabled: fmt.scene_set?.broll?.enabled !== false });
for (const w of warnings) console.warn(w);

// 3) Render-time POLICY warnings on the compiled cut (build-props warns; qa-video enforces HARD).
// no-empty-scene: a SPARSE template (lower-third/transition) held > the static-hold budget reads as the
// "empty screen" the owner flagged. Content-full or animated (multi-reveal) scenes are fine.
const maxHold = fmt.pacing?.max_static_hold_seconds ?? 6;
for (const s of props.scenes) {
  const secs = s.durFrames / fps;
  const dynamic = Array.isArray(s.props?.reveals) && s.props.reveals.length > 1;
  if (SPARSE_TEMPLATES.has(s.template) && secs > maxHold && !dynamic) {
    console.warn(`EMPTY/STATIC SCENE: ${s.sceneId} (${s.template}) ${secs.toFixed(1)}s — sparse template held >${maxHold}s; split or use a fuller/animated scene (no-empty-scene rule).`);
  }
}
// strong-hook: a hook-class opener (hook-card or a custom hook-* scene) must start within the window.
const hookVD = fmt.hook?.visual_detail ?? {};
if (hookVD.require_hook_class_scene) {
  const openSec = hookVD.first_seconds ?? 30;
  const openingEnd = timings.introFrames + Math.round(openSec * fps);
  if (!openingHasHook(props.scenes, openingEnd)) {
    console.warn(`HOOK RULE (format.hook.visual_detail): no hook-class scene opens ${id} within the first ${openSec}s — start with a hook-card or a custom hook-* scene (strong first impression).`);
  }
}

// 4) Persist the Remotion props.
const outDir = join(ROOT, "templates/remotion/props");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${outId}.json`), JSON.stringify(props, null, 2) + "\n");

console.log(`OK timeline.json + props/${outId}.json  (${props.scenes.length} beats from ${script.scenes.length} scenes, ${props.captions.length} caption cues)`);
console.log(`   total ${props.totalFrames} frames = ${(props.totalFrames / fps).toFixed(1)}s @ ${fps}fps (xf ${props.crossfadeFrames})`);
