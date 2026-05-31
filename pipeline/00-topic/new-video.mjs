#!/usr/bin/env node
/**
 * Deterministic scaffold for /novi-video (steps 1–3 of .claude/commands/novi-video.md):
 * pick the next NNN id, copy content/_TEMPLATE/ into content/<NNN>-<slug>/, and
 * initialize brief.json. The agent then continues with topic + research (steps 4–6).
 *
 *   node pipeline/00-topic/new-video.mjs <slug> ["Working title"]
 *   npm run new-video -- sta-je-ai "Šta je AI i šta sve može u 2026."
 *
 * Idempotent: refuses to overwrite an existing video folder.
 */
import {
  cpSync,
  existsSync,
  readdirSync,
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
if (!slugArg) die('Usage: node pipeline/00-topic/new-video.mjs <slug> ["Working title"]');

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

// copy the template folder (keeps the .gitkeep subfolders)
cpSync(TEMPLATE, dest, { recursive: true });

// initialize brief.json (matches brief.schema.json)
const brief = {
  id,
  title_working: titleWorking,
  angle: "",
  audience: "Serbian AI-curious viewers",
  target_seconds: 465,
  format: "long+short",
  sources: [],
  status: "new",
};
writeFileSync(join(dest, "brief.json"), JSON.stringify(brief, null, 2) + "\n");

console.log(`Created content/${id}/ from _TEMPLATE.`);
console.log(`brief.json initialized (status: "new"${titleWorking ? `, title: "${titleWorking}"` : ""}).`);
console.log(`Next: research the topic -> sources.md, then set status "researched". See docs/WORKFLOW.md Step 0.`);
