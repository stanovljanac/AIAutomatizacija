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
import { isShortUnit } from "../shared/lib/units.mjs";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { runChecks, summarize } from "./lib/check-lib.mjs";
import { portraitSignoffProblems, sceneSources, PORTRAIT_CHECK } from "../04-render/lib/portrait.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const id = process.argv[2];
if (!id) { console.error("usage: check.mjs <content_id>"); process.exit(2); }

const cdir = join(ROOT, "content", id);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const al = readJson(join(cdir, "alignment.json"));
const script = readJson(join(cdir, "script.json"));
const brief = existsSync(join(cdir, "brief.json")) ? readJson(join(cdir, "brief.json")) : {};
const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format, format_recipe: brief.format_recipe });

const vertical = isShortUnit(id);
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
  const { checks } = runChecks(props, fmt, { vertical, durationSeconds: al.duration, approvedTools: brief.approved_tools ?? [] });
  // 1B (D-074): a Short CUT from the long (short_source.json) reuses scenes whose portrait branch was
  // written blind — each needs a sign-off that someone looked at its tall frame (lib/portrait.mjs).
  if (existsSync(join(cdir, "short_source.json"))) {
    const plan = readJson(join(cdir, "scene-plan.json"));
    const unsigned = portraitSignoffProblems(plan.scenes, (name) => sceneSources(ROOT, name));
    checks.push(unsigned.length
      ? { name: "portrait_signoff", pass: false, severity: "high", detail: `tall frame never checked: ${unsigned.join(", ")}`, fix: `${PORTRAIT_CHECK}; then set props.portrait_ok: true on the long's plan entry (or this unit's) and re-run QA` }
      : { name: "portrait_signoff", pass: true, severity: "high" });
  }
  const pass = !checks.some((c) => !c.pass && c.severity === "high");
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
