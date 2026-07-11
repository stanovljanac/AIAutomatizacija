#!/usr/bin/env node
"use strict";
/**
 * Validate a pipeline JSON artifact against its JSON Schema (pipeline/shared/schemas/).
 *
 *   node pipeline/shared/validate.js content/001-sta-je-ai/script.json
 *   node pipeline/shared/validate.js content/001-sta-je-ai/*.json
 *   node pipeline/shared/validate.js some.json --schema script
 *
 * Schema is inferred from the filename; override with --schema <name>.
 * Exit code 0 = all valid, 1 = at least one invalid, 2 = bad usage.
 */
const fs = require("node:fs");
const path = require("node:path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const SCHEMA_DIR = path.join(__dirname, "schemas");

// content filename -> schema file (the only non-obvious one is qa.report.json)
const FILENAME_TO_SCHEMA = {
  "brief.json": "brief.schema.json",
  "ideas.json": "ideas.schema.json",
  "script.json": "script.schema.json",
  "scene-plan.json": "scene-plan.schema.json",
  "storyboard.json": "storyboard.schema.json",
  "visual-prompts.json": "visual-prompts.schema.json",
  "alignment.json": "alignment.schema.json",
  "qa.report.json": "qa.schema.json",
  "publish.json": "publish.schema.json",
  // Phase B/C artifacts
  "review.json": "review.schema.json",
  "timeline.json": "timeline.schema.json",
  "news.json": "news.schema.json",
  "facts.json": "facts.schema.json",
  "distribution.json": "distribution.schema.json",
  "config.json": "config.schema.json",
  "config.example.json": "config.schema.json",
  "thumb_candidates.json": "thumb-candidates.schema.json",
};

function resolveSchemaPath(filePath, override) {
  if (override) {
    const name = override.endsWith(".json") ? override : `${override}.schema.json`;
    return path.join(SCHEMA_DIR, name);
  }
  // format recipe files live in pipeline/shared/formats/ (default.json + partial overrides);
  // map any file in that folder to the format schema (mirror this rule in validate-lib.mjs).
  if (path.basename(path.dirname(filePath)) === "formats") {
    return path.join(SCHEMA_DIR, "format.schema.json");
  }
  const mapped = FILENAME_TO_SCHEMA[path.basename(filePath)];
  return mapped ? path.join(SCHEMA_DIR, mapped) : null;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const args = process.argv.slice(2);
  let override = null;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--schema" || args[i] === "-s") override = args[++i];
    else files.push(args[i]);
  }
  if (files.length === 0) {
    console.error(
      'Usage: node pipeline/shared/validate.js <file.json> [more.json ...] [--schema <name>]'
    );
    process.exit(2);
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  let anyFail = false;
  for (const file of files) {
    const schemaPath = resolveSchemaPath(file, override);
    if (!schemaPath) {
      anyFail = true;
      console.error(
        `FAIL ${file}\n     no schema mapped for this filename — pass --schema <name> (e.g. script)`
      );
      continue;
    }

    let data;
    let schema;
    try {
      data = readJson(file);
    } catch (e) {
      anyFail = true;
      console.error(`FAIL ${file}\n     cannot read/parse JSON: ${e.message}`);
      continue;
    }
    try {
      schema = readJson(schemaPath);
    } catch (e) {
      anyFail = true;
      console.error(`FAIL ${file}\n     cannot read schema ${schemaPath}: ${e.message}`);
      continue;
    }

    const validate = ajv.compile(schema);
    const schemaName = path.basename(schemaPath);
    if (validate(data)) {
      console.log(`PASS ${file}  (${schemaName})`);
    } else {
      anyFail = true;
      console.error(`FAIL ${file}  (${schemaName}) — ${validate.errors.length} error(s):`);
      for (const err of validate.errors) {
        const where = err.instancePath || "(root)";
        const extra =
          err.params && Object.keys(err.params).length
            ? `  ${JSON.stringify(err.params)}`
            : "";
        console.error(`     ${where} ${err.message}${extra}`);
      }
    }
  }
  process.exit(anyFail ? 1 : 0);
}

main();
