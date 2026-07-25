// Shared ESM validation helpers over the JSON Schemas in pipeline/shared/schemas/.
// Reused by the testkit and by pipeline modules. The CLI (validate.js, CJS) stays as-is;
// keep the FILENAME_TO_SCHEMA map here in sync with it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_DIR = path.join(__dirname, "..", "schemas");

// content filename -> schema file. Mirror of validate.js plus the Phase B/C artifacts.
export const FILENAME_TO_SCHEMA = {
  "brief.json": "brief.schema.json",
  "ideas.json": "ideas.schema.json",
  "script.json": "script.schema.json",
  "scene-plan.json": "scene-plan.schema.json",
  "storyboard.json": "storyboard.schema.json",
  "visual-prompts.json": "visual-prompts.schema.json",
  "alignment.json": "alignment.schema.json",
  "qa.report.json": "qa.schema.json",
  "publish.json": "publish.schema.json",
  // Phase B/C
  "review.json": "review.schema.json",
  "timeline.json": "timeline.schema.json",
  "news.json": "news.schema.json",
  "facts.json": "facts.schema.json",
  "distribution.json": "distribution.schema.json",
  "config.json": "config.schema.json",
  "config.example.json": "config.schema.json",
  "thumb_candidates.json": "thumb-candidates.schema.json",
  // The lifecycle ledger (pipeline/state/videos.json) — D-062.
  "videos.json": "videos.schema.json",
};

let _ajv = null;
function ajv() {
  if (!_ajv) {
    _ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(_ajv);
  }
  return _ajv;
}

const _compiled = new Map();

/** Resolve a schema by short name ("review"), file ("review.schema.json") or a data filename ("review.json"). */
export function resolveSchemaPath(nameOrFile) {
  if (!nameOrFile) return null;
  const base = path.basename(nameOrFile);
  // format recipe files (pipeline/shared/formats/*.json) → format schema (mirror of validate.js).
  if (path.basename(path.dirname(nameOrFile)) === "formats") {
    return path.join(SCHEMA_DIR, "format.schema.json");
  }
  if (FILENAME_TO_SCHEMA[base]) return path.join(SCHEMA_DIR, FILENAME_TO_SCHEMA[base]);
  const file = base.endsWith(".schema.json")
    ? base
    : base.endsWith(".json")
      ? base.replace(/\.json$/, ".schema.json")
      : `${base}.schema.json`;
  return path.join(SCHEMA_DIR, file);
}

export function loadSchema(nameOrFile) {
  const p = resolveSchemaPath(nameOrFile);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function compileFor(nameOrFile) {
  const p = resolveSchemaPath(nameOrFile);
  if (!_compiled.has(p)) _compiled.set(p, ajv().compile(JSON.parse(fs.readFileSync(p, "utf8"))));
  return _compiled.get(p);
}

/** Validate in-memory data. Returns { valid, errors }. `schemaName` may be a short name or filename. */
export function validate(data, schemaName) {
  const fn = compileFor(schemaName);
  const valid = fn(data);
  return { valid, errors: valid ? [] : fn.errors };
}

/** Validate a JSON file on disk. Schema inferred from filename unless `override` given. */
export function validateFile(filePath, override = null) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  // Pass the FULL path (not just the basename) so dir-aware rules (e.g. formats/*) apply;
  // resolveSchemaPath still derives the basename for the FILENAME_TO_SCHEMA lookup.
  return validate(data, override || filePath);
}

/** Format AJV errors into a short human string. */
export function formatErrors(errors) {
  return (errors || [])
    .map((e) => `${e.instancePath || "(root)"} ${e.message}`)
    .join("; ");
}
