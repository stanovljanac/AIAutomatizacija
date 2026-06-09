// Resolve a video's FORMAT recipe (the channel "show bible"): the single source of truth for
// the production-policy knobs (hook, motion, pacing, captions, length, intro/outro, scene set,
// per-archetype structure) that used to be scattered across prose (STYLE_GUIDE/skills) and
// hardcoded constants (build-props/anim/theme).
//
// Resolution order (later wins, deep-merged):
//   formats/default.json  <-  formats/<series>.json  <-  formats/<archetype>.json  <-  brief.format
// Override files are PARTIAL (omit sections), so only the MERGED result is validated against
// format.schema.json — never validate an override standalone.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "./validate-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FORMATS_DIR = path.join(__dirname, "..", "formats");

/** Channel series tag for an archetype (see script-writing rule #10 / CHANNEL.md). */
export function seriesForArchetype(archetype) {
  switch (archetype) {
    case "mini-demo":
      return "desk-fixes";
    case "ideas":
    case "diagram":
      return "desk-loops";
    case "comparison":
      return "automation-breakdowns";
    case "news":
    case "short":
      return "desk-notes";
    default:
      return null;
  }
}

const isObj = (v) => v != null && typeof v === "object" && !Array.isArray(v);

/** Deep-merge plain objects (arrays REPLACE — override semantics). Pure: never mutates inputs.
 *  A null/undefined override is a no-op (returns the base) so a missing override never wipes it. */
export function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (!isObj(base) || !isObj(override)) return override;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = isObj(v) && isObj(base[k]) ? deepMerge(base[k], v) : v;
  }
  return out;
}

/** Load a format file by name from a formats dir; returns null if it is absent. */
export function loadFormat(name, dir = FORMATS_DIR) {
  const p = path.join(dir, `${name}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

/**
 * Resolve the effective format for a brief.
 * @param {object} brief  may carry { archetype, series, format } — all optional.
 * @param {object} opts   { dir } the formats directory (default: repo formats).
 * @returns {object} the merged, schema-valid format recipe.
 */
export function resolveFormat(brief = {}, opts = {}) {
  const dir = opts.dir ?? FORMATS_DIR;
  const base = loadFormat("default", dir);
  if (!base) throw new Error(`format: no default.json in ${dir}`);

  const archetype = brief?.archetype ?? null;
  const series = brief?.series ?? (archetype ? seriesForArchetype(archetype) : null);

  let merged = base;
  for (const name of [series, archetype].filter(Boolean)) {
    const ov = loadFormat(name, dir);
    if (ov) merged = deepMerge(merged, ov);
  }
  if (isObj(brief?.format)) merged = deepMerge(merged, brief.format);

  const { valid, errors } = validate(merged, "format");
  if (!valid) throw new Error(`format: resolved recipe invalid: ${formatErrors(errors)}`);
  return merged;
}
