// Test helpers shared by every Phase B/C unit/integration test.
// Keep this dependency-light: only node built-ins + the validate-lib.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, validateFile, formatErrors } from "../lib/validate-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
export const FIXTURE_DIR = path.join(REPO_ROOT, "content", "_FIXTURE");

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function fixturePath(...parts) {
  return path.join(FIXTURE_DIR, ...parts);
}

export function readFixture(name) {
  return readJson(fixturePath(name));
}

/** Throw with a readable message if `data` does not satisfy `schemaName`. */
export function assertValid(data, schemaName) {
  const { valid, errors } = validate(data, schemaName);
  if (!valid) throw new Error(`schema ${schemaName} invalid: ${formatErrors(errors)}`);
  return true;
}

/** Run `fn(dir)` against a throwaway temp dir, always cleaned up. Awaits async fns. */
export async function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tad-test-"));
  try {
    return await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export { validate, validateFile, formatErrors };
