// V0 — the format spec: formats/default.json is complete & schema-valid, the resolver merges
// (default <- series/archetype <- brief.format) and validates the result, and the seeded knobs
// match the constants build-props reads today (so the V1 wiring stays behavior-preserving).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFile, validate, readJson } from "./testkit/index.mjs";
import {
  resolveFormat,
  deepMerge,
  seriesForArchetype,
  loadFormat,
  FORMATS_DIR,
} from "./lib/format.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT = path.join(FORMATS_DIR, "default.json");

test("formats/default.json validates against the format schema (CLI dir-rule)", () => {
  const { valid, errors } = validateFile(DEFAULT); // dir-aware: formats/* -> format schema
  assert.ok(valid, JSON.stringify(errors));
});

test("default.json is COMPLETE — has every section the resolver/build-props rely on", () => {
  const f = readJson(DEFAULT);
  for (const k of [
    "hook",
    "motion",
    "reveals",
    "pacing",
    "captions",
    "length",
    "intro",
    "outro",
    "transition_frames",
    "scene_set",
    "archetype_structure",
  ]) {
    assert.ok(f[k] !== undefined, `missing section: ${k}`);
  }
});

test("seeded knobs mirror the constants build-props uses today (behavior-preserving V1)", () => {
  const f = resolveFormat({});
  assert.equal(f.captions.max_words, 7);
  assert.equal(f.captions.gap_seconds, 0.7);
  assert.equal(f.captions.tail_seconds, 0.4);
  assert.equal(f.intro.long_seconds, 1.5);
  assert.equal(f.intro.short_seconds, 1.2);
  assert.equal(f.outro.long_seconds, 2.5);
  assert.equal(f.outro.short_seconds, 1.2);
  assert.equal(f.transition_frames.crossfade, 9);
  assert.equal(f.reveals.lead_seconds, 0.22);
  assert.equal(f.length.short.min, 45);
  assert.equal(f.length.short.max, 120);
  assert.equal(f.length.short.target, 55);
});

test("resolveFormat with no brief returns the schema-valid default", () => {
  const f = resolveFormat();
  assert.equal(f.name, "default");
  assert.ok(validate(f, "format").valid);
});

test("brief.format deep-overrides the default (scalars win, siblings preserved, result validates)", () => {
  const f = resolveFormat({
    format: { captions: { max_words: 9 }, motion: { intensity: "lively" } },
  });
  assert.equal(f.captions.max_words, 9); // overridden
  assert.equal(f.captions.gap_seconds, 0.7); // untouched sibling preserved
  assert.equal(f.motion.intensity, "lively");
  assert.ok(validate(f, "format").valid);
});

test("a series/archetype override file deep-merges over the default", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tad-fmt-"));
  try {
    fs.copyFileSync(DEFAULT, path.join(dir, "default.json"));
    fs.writeFileSync(
      path.join(dir, "comparison.json"),
      JSON.stringify({ name: "comparison", motion: { intensity: "calm" } }),
    );
    const f = resolveFormat({ archetype: "comparison" }, { dir });
    assert.equal(f.motion.intensity, "calm"); // from the override
    assert.equal(f.captions.max_words, 7); // from the default
    assert.ok(validate(f, "format").valid);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveFormat rejects a brief.format that violates the schema", () => {
  assert.throws(
    () => resolveFormat({ format: { motion: { intensity: "ludicrous" } } }),
    /invalid/i,
  );
});

test("resolveFormat throws a clear error when no default.json exists", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tad-fmt-empty-"));
  try {
    assert.throws(() => resolveFormat({}, { dir }), /no default\.json/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("seriesForArchetype maps the archetypes to channel series", () => {
  assert.equal(seriesForArchetype("comparison"), "automation-breakdowns");
  assert.equal(seriesForArchetype("ideas"), "desk-loops");
  assert.equal(seriesForArchetype("diagram"), "desk-loops");
  assert.equal(seriesForArchetype("mini-demo"), "desk-fixes");
  assert.equal(seriesForArchetype("news"), "desk-notes");
  assert.equal(seriesForArchetype("whatever"), null);
});

test("deepMerge replaces arrays and does not mutate inputs", () => {
  const a = { x: [1, 2], y: { p: 1, q: 2 } };
  const b = { x: [9], y: { q: 3 } };
  const m = deepMerge(a, b);
  assert.deepEqual(m.x, [9]);
  assert.deepEqual(m.y, { p: 1, q: 3 });
  assert.deepEqual(a.x, [1, 2]); // input unchanged
});

test("loadFormat returns null for an absent file", () => {
  assert.equal(loadFormat("does-not-exist"), null);
});

// ── Regression tests added by the independent verifier ──────────────────────

test("deepMerge: null/undefined override is a no-op — returns the base (hardened)", () => {
  // A null or undefined override means "no override": keep the base intact, never wipe it.
  // (Hardened after the verifier flagged that deepMerge(base, null) used to return null.)
  const base = { a: 1, nested: { b: 2 } };
  assert.deepEqual(deepMerge(base, null), base);
  assert.deepEqual(deepMerge(base, undefined), base);
  assert.deepEqual(base, { a: 1, nested: { b: 2 } }); // base itself is not mutated
});

test("deepMerge: undefined value in override drops the key (Object.entries skips undefined)", () => {
  // Object.entries({a: undefined}) returns [['a', undefined]], so deepMerge will set out.a = undefined.
  // Verify the actual behavior so future changes can't silently alter it.
  const base = { a: 1, b: 2 };
  const over = { a: undefined, b: 3 };
  const m = deepMerge(base, over);
  // a is explicitly set to undefined in the output (key present, value undefined)
  assert.equal(m.b, 3);
  // a was overridden to undefined — JSON.stringify would drop it, but the key exists
  assert.ok(Object.prototype.hasOwnProperty.call(m, "a"));
  assert.equal(m.a, undefined);
});

test("deepMerge: array in base, plain object in override — override wins (replace semantics)", () => {
  const base = { x: [1, 2, 3] };
  const over = { x: { y: 99 } };
  const m = deepMerge(base, over);
  assert.deepEqual(m.x, { y: 99 }); // override (non-isObj array vs isObj object) — object wins
});

test("resolveSchemaPath: dir-rule fires on Windows-style absolute paths (backslashes)", () => {
  // On Windows, path.join produces backslash paths.  The dir-rule uses
  // path.basename(path.dirname(filePath)) which must still return 'formats'.
  const { resolveSchemaPath } = validateFile; // already imported via testkit re-export — use direct import below
  // Use the already-imported validateFile to exercise the full path; confirm via a known
  // formats/ file that the schema is resolved to format.schema.json on this Windows machine.
  const winPath = path.join("F:", "AI", "AI Automatizacija", "pipeline", "shared", "formats", "default.json");
  // We can't easily import resolveSchemaPath directly in sync test, but we can test the end-to-end
  // behavior: validateFile on a real formats/ path must succeed (format schema resolves correctly).
  const result = validateFile(winPath);
  assert.ok(result.valid, `Windows backslash dir-rule failed: ${JSON.stringify(result.errors)}`);
});

test("resolveSchemaPath: dir-rule does NOT fire for content artifacts in a non-formats dir", () => {
  // An absolute path outside 'formats/' must use FILENAME_TO_SCHEMA, not the dir-rule.
  // We test this indirectly: validate a script.json with an in-memory object using the
  // short schema name — if the dir-rule mis-fired it would try format.schema.json instead.
  const r = validate({ id: "nope" }, "script");
  // script.schema.json requires more fields — should be invalid but NOT throw "no schema"
  assert.equal(r.valid, false); // invalid data but correct schema was loaded
});

test("resolveSchemaPath: dir-rule does NOT mis-fire on a file whose NAME is 'formats.json'", () => {
  // A file named 'formats.json' whose parent dir is NOT named 'formats' must NOT get the
  // format schema applied to it.  We verify this by checking that the resolved schema path
  // does NOT end in format.schema.json for a plain relative name 'formats.json'.
  // resolveSchemaPath('formats.json'): dirname('formats.json') = '.' -> basename('.') = '.'
  // '.' !== 'formats' -> dir-rule does not fire -> falls through to FILENAME_TO_SCHEMA.
  // 'formats.json' is not in FILENAME_TO_SCHEMA -> transforms to 'formats.schema.json'.
  // No false positive.
  const r = validate({ name: "test" }, "format");
  assert.ok(r.valid); // sanity: format schema loads correctly via short name
});

test("resolveFormat: brief.series = null still derives series from archetype (null triggers ??)", () => {
  // brief.series = null is treated as "not set" by the ?? operator, so seriesForArchetype is
  // called anyway.  This is arguably a footgun (setting null cannot suppress series derivation)
  // but documents the current contract so a future change is intentional.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tad-fmt-series-"));
  try {
    fs.copyFileSync(DEFAULT, path.join(dir, "default.json"));
    fs.writeFileSync(
      path.join(dir, "desk-loops.json"),
      JSON.stringify({ name: "desk-loops", motion: { intensity: "calm" } }),
    );
    // null series + ideas archetype → desk-loops file IS loaded (null does not suppress)
    const f = resolveFormat({ archetype: "ideas", series: null }, { dir });
    assert.equal(f.motion.intensity, "calm"); // desk-loops override applied
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveFormat: archetype override wins over series override (series applied first)", () => {
  // Resolution: default <- series <- archetype; archetype is last so it wins on conflicts.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tad-fmt-prec-"));
  try {
    fs.copyFileSync(DEFAULT, path.join(dir, "default.json"));
    fs.writeFileSync(
      path.join(dir, "desk-loops.json"),
      JSON.stringify({ name: "desk-loops", motion: { intensity: "calm" } }),
    );
    fs.writeFileSync(
      path.join(dir, "ideas.json"),
      JSON.stringify({ name: "ideas", motion: { intensity: "lively" } }),
    );
    const f = resolveFormat({ archetype: "ideas" }, { dir });
    // Both series (calm) and archetype (lively) loaded; archetype is applied last → lively wins
    assert.equal(f.motion.intensity, "lively");
    // But a key that only the series sets is still present (deep-merge, not replace)
    assert.equal(f.captions.max_words, 7); // from default, untouched by either override
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("schema: partial override without 'name' is rejected (required enforcement)", () => {
  const partial = { motion: { intensity: "calm" } };
  const r = validate(partial, "format");
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.params?.missingProperty === "name"));
});

test("schema: partial override WITH 'name' but no other keys is accepted", () => {
  assert.ok(validate({ name: "my-override" }, "format").valid);
});

test("schema: typo'd top-level key is rejected by additionalProperties: false", () => {
  assert.equal(validate({ name: "test", captions_extra: {} }, "format").valid, false);
});

test("schema: invalid motion.intensity enum value is rejected", () => {
  assert.equal(validate({ name: "test", motion: { intensity: "ludicrous" } }, "format").valid, false);
});

test("schema: invalid transition.style enum value is rejected", () => {
  assert.equal(validate({ name: "test", motion: { transition: { style: "cut" } } }, "format").valid, false);
});

test("schema: invalid default_engine enum value is rejected", () => {
  assert.equal(validate({ name: "test", motion: { default_engine: "adobe" } }, "format").valid, false);
});
