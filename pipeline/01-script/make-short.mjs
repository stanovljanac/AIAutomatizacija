// make-short (Phase B #2, feeds D-033): derive the Short script.json from the approved
// long script — the Short stops being a hand-built folder. Deterministic heuristic:
// hook + the strongest point(s) that fit the target + a short CTA.
import fs from "node:fs";
import path from "node:path";
import { validate } from "../shared/lib/validate-lib.mjs";

/** Estimate spoken seconds from narration word count at a given words-per-minute. */
export function estimateSeconds(scenes, wpm = 160) {
  const words = scenes.reduce(
    (n, s) => n + (s.narration || "").trim().split(/\s+/).filter(Boolean).length,
    0
  );
  return (words / wpm) * 60;
}

/**
 * Choose which LONG scenes make up the Short (hook + the strongest points that fit + a CTA),
 * preserving their original ids. The single source of selection truth — both the Short SCRIPT
 * (makeShort) and the Short SCENE-PLAN (makeShortPlan) derive from this same picked list so their
 * renumbered `s1..sN` ids always line up.
 */
export function pickShortScenes(longScript, { targetSeconds = 55, wpm = 160 } = {}) {
  const scenes = longScript.scenes || [];
  const hook = scenes.find((s) => s.role === "hook") || scenes[0];
  const points = scenes.filter((s) => ["point", "demo"].includes(s.role));
  const cta = scenes.find((s) => s.role === "cta" || s.role === "outro");

  // De-dup by identity: when there is no hook role we fall back to scenes[0], which may also
  // appear in points/cta — never include the same scene twice.
  const picked = [];
  const seen = new Set();
  const add = (s) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      picked.push(s);
    }
  };
  add(hook);
  for (const p of points) {
    add(p);
    if (estimateSeconds(cta && !seen.has(cta) ? [...picked, cta] : picked, wpm) >= targetSeconds) break;
  }
  add(cta);
  return picked;
}

/** Build a Short script object from a long script. Does not write to disk. */
export function makeShort(longScript, { targetSeconds = 55, wpm = 160 } = {}) {
  const picked = pickShortScenes(longScript, { targetSeconds, wpm });
  return {
    id: longScript.id,
    language: longScript.language,
    archetype: longScript.archetype,
    angle: longScript.angle,
    title_working: `${longScript.title_working} (Short)`,
    target_seconds: targetSeconds,
    scenes: picked.map((s, i) => ({ ...s, id: `s${i + 1}` })),
  };
}

/** CLI: node make-short.mjs <id> — reads content/<id>/script.json, writes content/<id>/short/script.json. */
export function deriveShortFile(contentDir, { targetSeconds, wpm } = {}) {
  const longScript = JSON.parse(fs.readFileSync(path.join(contentDir, "script.json"), "utf8"));
  const short = makeShort(longScript, { targetSeconds, wpm });
  const { valid, errors } = validate(short, "script");
  if (!valid) throw new Error(`derived short invalid: ${JSON.stringify(errors)}`);
  const outDir = path.join(contentDir, "short");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "script.json"), JSON.stringify(short, null, 2) + "\n");
  return short;
}

// ── Short scene-plan (T5.2 follow-up: the storyboard wire-up) ─────────────────
// The long video's scene-plan is authored by the storyboard agent. The Short is a LEAN derivative
// of the long script (pickShortScenes), so its scene-plan is DERIVED deterministically — reuse each
// kept scene's long plan entry (the rich props the agent already built) under the Short's renumbered
// `scene_id`. No second storyboard pass; no human gate. This closes the "Short scene-plan" build gap.

/** Minimal plan props when a picked scene has no long-plan entry (fallback only). */
function minimalProps(scene) {
  const title = scene.on_screen_text || (scene.sentences && scene.sentences[0]) || "";
  return title ? { title } : {};
}

/**
 * Strip the long-only render coupling so the Short renders cheaply as pure Remotion: drop the
 * `engine` (and any `hf_scene`) so a hero beat doesn't force a second HyperFrames render at the
 * Short's window. The Short is intentionally lean (D-033); heroes stay a long-video flourish.
 */
function leanForShort(planEntry) {
  const { engine, props, ...rest } = planEntry; // eslint-disable-line no-unused-vars
  if (props && (props.hf_scene || props.engine)) {
    const { hf_scene, engine: _e, ...cleaned } = props; // eslint-disable-line no-unused-vars
    return { ...rest, props: cleaned };
  }
  return props ? { ...rest, props } : { ...rest };
}

/**
 * Derive the Short scene-plan from the long scene-plan. For each picked long scene, reuse its plan
 * entry under the Short's renumbered `scene_id` (falling back to a minimal entry if the long plan
 * has no match). Pure; uses the SAME pickShortScenes selection as makeShort so ids align.
 */
export function makeShortPlan(longScript, longPlan, { targetSeconds = 55, wpm = 160 } = {}) {
  const picked = pickShortScenes(longScript, { targetSeconds, wpm });
  const byId = new Map((longPlan?.scenes || []).map((e) => [e.scene_id, e]));
  const scenes = picked.map((scene, i) => {
    const scene_id = `s${i + 1}`;
    const src = byId.get(scene.id);
    if (src) {
      const { scene_id: _drop, ...rest } = leanForShort(src); // eslint-disable-line no-unused-vars
      return { scene_id, ...rest };
    }
    return { scene_id, template: scene.template, props: minimalProps(scene) };
  });
  return { id: longScript.id, scenes };
}

/**
 * Reads content/<id>/{script.json, scene-plan.json}, writes content/<id>/short/scene-plan.json.
 * Idempotent + non-clobbering: if a Short scene-plan was hand-authored, it is respected (returned
 * as-is), never overwritten. Otherwise it is derived from the long plan and written.
 */
export function deriveShortPlanFile(contentDir, { targetSeconds, wpm } = {}) {
  const outDir = path.join(contentDir, "short");
  const outPath = path.join(outDir, "scene-plan.json");
  if (fs.existsSync(outPath)) return JSON.parse(fs.readFileSync(outPath, "utf8")); // respect an authored plan
  const longScript = JSON.parse(fs.readFileSync(path.join(contentDir, "script.json"), "utf8"));
  const longPlan = JSON.parse(fs.readFileSync(path.join(contentDir, "scene-plan.json"), "utf8"));
  const plan = makeShortPlan(longScript, longPlan, { targetSeconds, wpm });
  const { valid, errors } = validate(plan, "scene-plan");
  if (!valid) throw new Error(`derived short scene-plan invalid: ${JSON.stringify(errors)}`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(plan, null, 2) + "\n");
  return plan;
}
