#!/usr/bin/env node
/**
 * Deterministic scaffold for /novi-video (steps 1–3 of .claude/commands/novi-video.md):
 * pick the next NNN id, copy content/_TEMPLATE/ into content/<NNN>-<slug>/, and
 * initialize brief.json. The agent then continues with topic + research (steps 4–6).
 *
 *   node pipeline/00-ideas/new-video.mjs <slug> ["Working title"]
 *   npm run new-video -- invoice-emails-sheets "Automate Invoice Emails in Google Sheets"
 *
 * The scaffolding core is exported as `scaffoldVideo` so the autonomous picker (pick-next.mjs,
 * T5.1) can seed a video from an idea without shelling the CLI.
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = join(ROOT, "content");
const TEMPLATE = join(CONTENT, "_TEMPLATE");

/** lowercase, hyphenate, trim — the folder slug. Returns "" if nothing usable. */
export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Next id = highest NNN under content/ + 1, zero-padded to 3. */
export function nextVideoId(slug, { content = CONTENT } = {}) {
  let maxN = 0;
  for (const name of readdirSync(content)) {
    const m = /^(\d{3})-/.exec(name);
    if (m && statSync(join(content, name)).isDirectory()) {
      maxN = Math.max(maxN, parseInt(m[1], 10));
    }
  }
  return `${String(maxN + 1).padStart(3, "0")}-${slug}`;
}

/**
 * Scaffold a new video folder from _TEMPLATE + the nested lean Short, and write brief.json.
 * `brief` overrides are merged over the defaults (the picker passes archetype/task/angle/etc.
 * from the chosen idea). Returns { id, dest }. Throws (never half-writes) on a bad slug,
 * missing template, or an existing folder.
 *
 * @param {string} slugArg  raw slug (slugified here)
 * @param {{ titleWorking?: string, brief?: object, content?: string, template?: string }} opts
 */
export function scaffoldVideo(slugArg, { titleWorking = "", brief: briefOverrides = {}, content = CONTENT, template = TEMPLATE } = {}) {
  const slug = slugify(slugArg);
  if (!slug) throw new Error(`Invalid slug: "${slugArg}"`);
  if (!existsSync(template)) throw new Error(`Template not found: ${template}`);

  const id = nextVideoId(slug, { content });
  const dest = join(content, id);
  if (existsSync(dest)) throw new Error(`content/${id} already exists — refusing to overwrite.`);

  // copy the template folder (keeps the .gitkeep subfolders) — this is the LONG unit
  cpSync(template, dest, { recursive: true });

  // nest the Short as a LEAN sub-unit: content/<id>/short/. One topic = one folder. The Short only
  // owns script.json / scene-plan.json / alignment.json / voice/ / video/ — it inherits the topic,
  // angle and sources from the long unit above. Copy the skeleton (for voice/.gitkeep +
  // video/.gitkeep) then prune what the Short doesn't use, matching the lean legacy shorts.
  const shortDir = join(dest, "short");
  cpSync(template, shortDir, { recursive: true });
  for (const extra of ["brief.json", "README.md", "sources.md", "script.sample.json", "captures", "images", "render"]) {
    rmSync(join(shortDir, extra), { recursive: true, force: true });
  }

  // initialize brief.json (matches brief.schema.json); overrides win over the defaults
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
    ...briefOverrides,
    id, // id is authoritative — never let an override change it
  };
  writeFileSync(join(dest, "brief.json"), JSON.stringify(brief, null, 2) + "\n");
  return { id, dest };
}

// CLI
function die(msg) {
  console.error(msg);
  process.exit(1);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , slugArg, ...titleParts] = process.argv;
  if (!slugArg) die('Usage: node pipeline/00-ideas/new-video.mjs <slug> ["Working title"]');
  try {
    const titleWorking = titleParts.join(" ");
    const { id } = scaffoldVideo(slugArg, { titleWorking });
    console.log(`Created content/${id}/ from _TEMPLATE (+ lean short/ sub-unit for the Short).`);
    console.log(`brief.json initialized (status: "new"${titleWorking ? `, title: "${titleWorking}"` : ""}).`);
    console.log(`Next: classify archetype + draft the angle (Gate 1), then write the script. See docs/WORKFLOW.md Step 0.`);
  } catch (e) {
    die(e.message);
  }
}
