#!/usr/bin/env node
/**
 * seed-gate.mjs — the smallest guard that stops the next 015 (D-059).
 *
 * 015 ("emails I shouldn't answer") reached the SCRIPT stage as a free-text seed buried in a
 * repeatable-format idea, never scored by the idea-pass for its OWN merits — a near-duplicate of the
 * shipped 011. Rule: a brief may not be scripted until it carries a `value_band` that proves it
 * cleared the idea-pass (`pipeline/shared/review/`). No band (or a "reject" band) → STOP.
 *
 * This does NOT re-run the idea-pass; it only asserts the pass HAPPENED and the verdict allows a
 * script. Pair it with the subject-collision warning in pick-next.mjs (map-level near-dup check).
 *
 *   node pipeline/00-ideas/seed-gate.mjs <id>   # e.g. 016-n8n-inbox-triage; exit 1 + STOP if not gated
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALID_BANDS = new Set(["qualify", "owner"]); // "reject" fails the gate; absent fails the gate.

/**
 * Is this brief cleared to be scripted? Pure.
 * ok only when brief.value_band proves an idea-pass verdict that ALLOWS a script (qualify|owner).
 * Returns { ok, reason } — reason explains the STOP so the workflow/skill can surface it.
 */
export function seedGate(brief) {
  if (brief?.status === "rejected") {
    return { ok: false, reason: "brief.status is \"rejected\" — this video was retired; do not script it." };
  }
  const band = brief?.value_band;
  if (band == null || band === "") {
    return { ok: false, reason: "no value_band — this brief never passed the idea-pass. Run the idea-pass (Gate 1) first, then script." };
  }
  if (band === "reject") {
    return { ok: false, reason: 'value_band is "reject" — the idea-pass rejected this idea. Do not script it.' };
  }
  if (!VALID_BANDS.has(band)) {
    return { ok: false, reason: `value_band "${band}" is not a recognized idea-pass verdict (expected qualify|owner|reject).` };
  }
  return { ok: true, reason: `value_band "${band}" — idea-pass cleared; ok to script.` };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: node pipeline/00-ideas/seed-gate.mjs <content-id>");
    process.exit(2);
  }
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const briefPath = path.join(__dirname, "..", "..", "content", id, "brief.json");
  const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
  const { ok, reason } = seedGate(brief);
  if (ok) {
    console.log(`seed-gate PASS: ${id} — ${reason}`);
    return;
  }
  console.error(`seed-gate STOP: ${id} — ${reason}`);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
