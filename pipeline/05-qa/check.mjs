#!/usr/bin/env node
/**
 * 05-qa: deterministic, artifact-level QA over a video's render props + alignment, gated by the
 * resolved FORMAT recipe. Writes content/<id>/qa.report.json (qa.schema.json) and exits 1 on a HARD
 * (high-severity) failure — fails-closed, so an unattended run never ships a broken video.
 *
 *   node pipeline/05-qa/check.mjs 004-foo
 *   node pipeline/05-qa/check.mjs 004-foo/short      # nested Short
 *
 * This is the MECHANICAL half of qa-video. The PERCEPTUAL half (legibility-in-context, emphasis,
 * demo cursor/zoom, scene "fit", weak angle) stays in the qa-video SKILL (agent + vision on stills).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { runChecks, summarize } from "./lib/check-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const id = process.argv[2];
if (!id) { console.error("usage: check.mjs <content_id>"); process.exit(2); }

const cdir = join(ROOT, "content", id);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const al = readJson(join(cdir, "alignment.json"));
const script = readJson(join(cdir, "script.json"));
const brief = existsSync(join(cdir, "brief.json")) ? readJson(join(cdir, "brief.json")) : {};
const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });

const seg = id.split(/[\\/]/).pop();
const vertical = seg === "short" || seg.endsWith("-short");
const outId = id.replace(/[\\/]/g, "-");
const propsPath = join(ROOT, "templates/remotion/props", `${outId}.json`);

let report;
if (!existsSync(propsPath)) {
  // No render props → cannot QA. Fail closed.
  report = {
    pass: false,
    checked_at: new Date().toISOString(),
    checks: [{ name: "render_props_missing", pass: false, severity: "high", detail: `${outId}.json not found`, fix: `node pipeline/04-render/build-props.mjs ${id}` }],
    summary: "Cannot QA: render props missing — run build-props first.",
  };
} else {
  const props = readJson(propsPath);
  const { pass, checks } = runChecks(props, fmt, { vertical, durationSeconds: al.duration });
  report = { pass, checked_at: new Date().toISOString(), checks, summary: summarize(checks) };
}

// The report must satisfy its own schema (catch a checker that emits a malformed entry).
const { valid, errors } = validate(report, "qa");
if (!valid) { console.error(`qa.report.json failed its own schema: ${formatErrors(errors)}`); process.exit(2); }

writeFileSync(join(cdir, "qa.report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`${report.pass ? "QA PASS" : "QA FAIL"} → content/${id}/qa.report.json`);
console.log(`  ${report.summary}`);
for (const c of report.checks.filter((c) => !c.pass)) console.log(`  ✗ [${c.severity}] ${c.name}: ${c.detail ?? ""}`);
console.log("  note: perceptual checks (legibility-in-context, emphasis, fit) are the qa-video skill's job.");
process.exit(report.pass ? 0 : 1);
