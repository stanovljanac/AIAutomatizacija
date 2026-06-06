#!/usr/bin/env node
/**
 * Deterministic scaffold for /novi-video (steps 1–3 of .claude/commands/novi-video.md):
 * pick the next NNN id, copy content/_TEMPLATE/ into content/<NNN>-<slug>/, and
 * initialize brief.json. The agent then continues with topic + research (steps 4–6).
 *
 *   node pipeline/00-ideas/new-video.mjs <slug> ["Working title"]
 *   npm run new-video -- invoice-emails-sheets "Automate Invoice Emails in Google Sheets"
 *
 * Idempotent: refuses to overwrite an existing video folder.
 */
import {
  cpSync,
  existsSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = join(ROOT, "content");
const TEMPLATE = join(CONTENT, "_TEMPLATE");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const [, , slugArg, ...titleParts] = process.argv;
if (!slugArg) die('Usage: node pipeline/00-ideas/new-video.mjs <slug> ["Working title"]');

const slug = slugArg
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
if (!slug) die(`Invalid slug: "${slugArg}"`);
const titleWorking = titleParts.join(" ");

if (!existsSync(TEMPLATE)) die(`Template not found: ${TEMPLATE}`);

// next id = highest NNN under content/ + 1
let maxN = 0;
for (const name of readdirSync(CONTENT)) {
  const m = /^(\d{3})-/.exec(name);
  if (m && statSync(join(CONTENT, name)).isDirectory()) {
    maxN = Math.max(maxN, parseInt(m[1], 10));
  }
}
const id = `${String(maxN + 1).padStart(3, "0")}-${slug}`;
const dest = join(CONTENT, id);
if (existsSync(dest)) die(`content/${id} already exists — refusing to overwrite.`);

// copy the template folder (keeps the .gitkeep subfolders) — this is the LONG unit
cpSync(TEMPLATE, dest, { recursive: true });

// nest the Short as a LEAN sub-unit: content/<id>/short/. One topic = one folder.
// The Short only owns script.json / scene-plan.json / alignment.json / voice/ / video/ —
// it inherits the topic, angle and sources from the long unit above. Copy the skeleton
// (for voice/.gitkeep + video/.gitkeep) then prune what the Short doesn't use, matching the
// lean legacy shorts. build-props detects it by the last path segment (".../short"), so
// render it with: build-props.mjs <id>/short
const shortDir = join(dest, "short");
cpSync(TEMPLATE, shortDir, { recursive: true });
for (const extra of ["brief.json", "README.md", "sources.md", "script.sample.json", "captures", "images", "render"]) {
  rmSync(join(shortDir, extra), { recursive: true, force: true });
}

// initialize brief.json (matches brief.schema.json)
const brief = {
  id,
  title_working: titleWorking,
  archetype: "ideas",
  angle: "",
  audience: "Builders/freelancers who automate boring back-office tasks for others",
  target_seconds: 360,
  format: "long+short",
  task: "",
  status: "new",
};
writeFileSync(join(dest, "brief.json"), JSON.stringify(brief, null, 2) + "\n");

console.log(`Created content/${id}/ from _TEMPLATE (+ lean short/ sub-unit for the Short).`);
console.log(`brief.json initialized (status: "new"${titleWorking ? `, title: "${titleWorking}"` : ""}).`);
console.log(`Next: classify archetype + draft the angle (Gate 1), then write the script. See docs/WORKFLOW.md Step 0.`);
