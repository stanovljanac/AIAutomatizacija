/**
 * ledger.mjs — read/write access to the video lifecycle ledger (D-062).
 *
 * `pipeline/state/videos.json` is the ONLY writable lifecycle state: one record per
 * publish.json, owning that video's status / lesson obligation / analytics schedule.
 * `ideas.json` status, `publish.json` status and `produced_subjects.json` are derived
 * projections written by reconcile.mjs — never read back into the ledger.
 *
 * This module stays deliberately tiny: load, save-with-validate, and the id → sequence
 * parsing every `live_from` comparison needs. All lifecycle LOGIC lives in reconcile.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
export const LEDGER_PATH = path.join(ROOT, "pipeline", "state", "videos.json");

export const SCHEMA_VERSION = 1;
/** First sequence the ledger governs; earlier videos are backfilled history. */
export const DEFAULT_LIVE_FROM = "020";

export function todayStr(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** A fresh, schema-valid, empty ledger. */
export function emptyLedger({ now = new Date(), liveFrom = DEFAULT_LIVE_FROM } = {}) {
  return { schema_version: SCHEMA_VERSION, updated: todayStr(now), live_from: liveFrom, videos: {} };
}

/** Validate a ledger document. Returns { valid, errors } (same shape as validate-lib). */
export function validateLedger(ledger) {
  return validate(ledger, "videos");
}

/**
 * Load the ledger. Fail-soft on a MISSING file (returns a fresh empty ledger, so a first run
 * needs no bootstrap step) but loud on a malformed one — silently replacing a corrupt source of
 * truth with an empty one would erase real lifecycle state.
 */
export function loadLedger(filePath = LEDGER_PATH) {
  if (!fs.existsSync(filePath)) return emptyLedger();
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    throw new Error(`ledger ${filePath} is not parseable JSON: ${e.message}`);
  }
  const { valid, errors } = validateLedger(ledger);
  if (!valid) throw new Error(`ledger ${filePath} is invalid: ${formatErrors(errors)}`);
  return ledger;
}

/**
 * Write the ledger, validating FIRST so an invalid document can never reach disk.
 * Stamps `updated`; pass `now` to make that deterministic in tests.
 */
export function saveLedger(ledger, { filePath = LEDGER_PATH, now = new Date() } = {}) {
  const out = { ...ledger, schema_version: SCHEMA_VERSION, updated: todayStr(now) };
  const { valid, errors } = validateLedger(out);
  if (!valid) throw new Error(`refusing to write an invalid ledger: ${formatErrors(errors)}`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + "\n");
  return out;
}

/**
 * Numeric sequence of a video id / ledger key / `live_from` value:
 *   "020-everyone-asks-clean-data" → 20 · "019-next-word-engine/short" → 19 · "020" → 20
 * Returns null when there is no leading 3-digit sequence (so callers decide the fallback
 * instead of silently comparing against 0).
 */
export function videoSeq(id) {
  const m = /^(\d{3})(?:$|[-/])/.exec(String(id ?? ""));
  return m ? Number(m[1]) : null;
}
