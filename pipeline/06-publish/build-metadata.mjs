// Auto-metadata (Phase B #3): deterministically fill publish.json from brief + script +
// alignment — title options, an answer-first <=3-sentence description, tags, and chapters
// timed from the alignment. Titles/description are sensible BASELINES the review refines.
// publish.md is the HUMAN interface (copy-paste into YouTube Studio); publish.json stays
// the canonical machine interface. The owner's thumbnail pick is recorded back into
// thumb_candidates.json (chosen:true) — without the pick, score↔CTR learning is impossible.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** One chapter per scene at its first sentence start (+ intro offset). First chapter is 0:00. */
export function buildChapters(script, alignment, { introOffset = 0 } = {}) {
  const sceneStart = new Map();
  for (const sen of alignment.sentences || []) {
    if (!sceneStart.has(sen.scene)) sceneStart.set(sen.scene, sen.start);
  }
  const entries = [];
  for (const sc of script.scenes) {
    if (!sceneStart.has(sc.id)) continue;
    const label = (sc.on_screen_text || sc.sentences?.[0] || sc.role || "").slice(0, 60);
    entries.push({ start: sceneStart.get(sc.id) + introOffset, label });
  }
  // YouTube requires chronological, monotonic chapters with the first at 0:00.
  entries.sort((a, b) => a.start - b.start);
  const chapters = entries.map((e) => ({ time: fmtTime(e.start), label: e.label }));
  if (chapters.length) chapters[0].time = "0:00";
  return chapters;
}

export function buildTags(brief) {
  const tags = new Set();
  if (brief.task) tags.add(String(brief.task).replace(/-/g, " "));
  if (brief.tool) tags.add(brief.tool);
  if (brief.sector) tags.add(brief.sector);
  if (brief.search_term) brief.search_term.split(/\s+/).forEach((w) => tags.add(w.toLowerCase()));
  ["ai automation", "automation", "small business"].forEach((t) => tags.add(t));
  return [...tags].filter(Boolean);
}

export function buildTitleOptions(brief) {
  const opts = [];
  if (brief.title_working) opts.push(brief.title_working);
  if (brief.search_term) {
    const s = brief.search_term;
    opts.push(s.charAt(0).toUpperCase() + s.slice(1));
  }
  return [...new Set(opts)].filter(Boolean);
}

/** Answer-first (D-026): the hook's first sentences (the answer) + one keyword sentence. <=3 sentences. */
export function buildDescription(script, brief) {
  const first = script.scenes?.[0];
  const answer = (first?.sentences || []).slice(0, 2).join(" ");
  const kw = brief.search_term ? `A quick, practical look at ${brief.search_term}.` : "";
  return [answer, kw].filter(Boolean).join(" ").trim();
}

// The owner fills the real long-video URL at upload; until then every link that needs it carries
// this placeholder (mirrors the community_post convention, D-042).
export const LONG_URL_PLACEHOLDER = "<LONG_URL>";

/**
 * The unified CTA-question → pinned-comment (Phase 1.3): the video ends on ONE specific topical
 * question (script.closing_question); the pin ANSWERS it and invites replies — a single system, not
 * "like and subscribe" (reconciled with STYLE_GUIDE §9: one topical question is allowed, not begging).
 * Prefers an authored script.pinned_comment; otherwise derives a reply-invite from the question.
 * Returns "" when there is no closing question (nothing to seed). Pure.
 */
export function buildPinnedComment(script = {}) {
  if (script.pinned_comment) return script.pinned_comment;
  const q = (script.closing_question || "").trim();
  if (!q) return "";
  return `${q} Drop yours in the replies 👇`;
}

/**
 * Assemble the deliberate Short → Long → pin → template → cross-post chain (the "bridge"), so Shorts
 * feed the under-fed long-form discovery. We upload MANUALLY (D-055) and never touch YouTube's native
 * link/end-screen UI, so this returns a PACKAGE + a one-line manual_checklist the owner follows in the
 * Shorts/long editor. Pure — driven by brief.bridge inputs + whatever the publish object already holds.
 */
export function buildBridge({ publish = {}, brief = {} }) {
  const b = brief.bridge || {};
  const relatedLongId = b.related_long_id || null;
  const relatedLongTitle = b.related_long_title || null;
  const templateLink = b.template_link || null;
  const pinned = publish.pinned_comment || "";
  const shortCaption =
    publish.short?.caption ||
    (relatedLongTitle
      ? `Full breakdown of "${relatedLongTitle}" → ${LONG_URL_PLACEHOLDER}`
      : `Full breakdown → ${LONG_URL_PLACEHOLDER}`);

  const checklist = [];
  if (relatedLongId) {
    checklist.push(`In the Shorts editor, link the related video (${relatedLongTitle || relatedLongId}) — paste ${LONG_URL_PLACEHOLDER}.`);
    checklist.push(`On the long video, add an end screen pointing to the related/next video.`);
  }
  if (pinned) checklist.push("Post the pinned comment below as the first comment, then pin it.");
  if (templateLink) checklist.push(`Put the template link in the description AND the pinned comment: ${templateLink}`);

  return {
    related_long_id: relatedLongId,
    long_url: LONG_URL_PLACEHOLDER,
    short_caption: shortCaption,
    pinned_comment: pinned,
    template_link: templateLink,
    end_screen_target: relatedLongId,
    manual_checklist: checklist,
  };
}

export function buildMetadata({ brief, script, alignment, introOffset = 0 }) {
  const tags = buildTags(brief);
  const publish = {
    id: brief.id,
    title_options: buildTitleOptions(brief),
    chosen_title: null,
    description: buildDescription(script, brief),
    tags,
    chapters: buildChapters(script, alignment, { introOffset }),
    altered_content: true,
    short: { title: `${brief.title_working || ""} (Short)`.trim(), tags: tags.slice(0, 8), caption: "" },
    youtube_video_id: null,
    status: "draft_pending",
  };
  // 1.3 → the closing-question-seeded pin FIRST, so 1.2's bridge mirrors it into the ecosystem chain.
  const pinned = buildPinnedComment(script);
  if (pinned) publish.pinned_comment = pinned;
  publish.bridge = buildBridge({ publish, brief });
  return publish;
}

/** Reads brief/script/alignment from contentDir, writes publish.json + publish.md, returns it. */
export function buildMetadataFile(contentDir, opts = {}) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(contentDir, f), "utf8"));
  const publish = buildMetadata({
    brief: read("brief.json"),
    script: read("script.json"),
    alignment: read("alignment.json"),
    ...opts,
  });
  const { valid, errors } = validate(publish, "publish");
  if (!valid) throw new Error(`publish.json invalid: ${JSON.stringify(errors)}`);
  fs.writeFileSync(path.join(contentDir, "publish.json"), JSON.stringify(publish, null, 2) + "\n");
  writeMarkdownExport(contentDir, publish);
  return publish;
}

const fence = (text) => "```text\n" + (text ?? "") + "\n```";

/**
 * Human-readable Markdown of a publish.json — SAME fields, copy-paste-friendly for YouTube
 * Studio. Pure. `candidates` (thumb_candidates.json) adds the thumbnail-pick table.
 */
export function publishMarkdown(publish, { candidates = null } = {}) {
  const lines = [
    `# ${publish.id} — publish pack`,
    "",
    "> Copy-paste interface for YouTube Studio. `publish.json` stays the canonical, machine-readable source — edit THAT, then regenerate this file (`build-metadata.mjs <id> --md-only`).",
    "",
    "## Title",
    ...publish.title_options.map((t, i) => `${i + 1}. ${t}`),
    "",
    `**Chosen:** ${publish.chosen_title ?? "_pick one_"}`,
    "",
    "## Description",
    fence(publish.description),
    "",
    "## Tags",
    fence((publish.tags ?? []).join(", ")),
  ];
  if (publish.chapters?.length) {
    lines.push("", "## Chapters", fence(publish.chapters.map((c) => `${c.time} ${c.label}`).join("\n")));
  }
  if (publish.pinned_comment) lines.push("", "## Pinned comment", fence(publish.pinned_comment));
  if (publish.community_post) lines.push("", "## Community post", fence(publish.community_post));
  if (publish.short) {
    lines.push("", "## Short", `- Title: ${publish.short.title ?? ""}`, `- Caption: ${publish.short.caption ?? ""}`, `- Tags: ${(publish.short.tags ?? []).join(", ")}`);
  }
  const bridge = publish.bridge;
  if (bridge && (bridge.manual_checklist?.length || bridge.related_long_id || bridge.template_link)) {
    lines.push("", "## Short → Long bridge");
    if (bridge.related_long_id) lines.push(`- Related long video: **${bridge.related_long_id}** (link ${bridge.long_url} once uploaded)`);
    if (bridge.template_link) lines.push(`- Template link: ${bridge.template_link}`);
    if (bridge.end_screen_target) lines.push(`- End-screen target: ${bridge.end_screen_target}`);
    lines.push(`- Short cross-post caption: ${bridge.short_caption}`);
    if (bridge.manual_checklist?.length) {
      lines.push("", "**Manual steps (YouTube can't be scripted here — D-055):**", ...bridge.manual_checklist.map((s) => `- [ ] ${s}`));
    }
  }
  if (candidates?.length) {
    lines.push(
      "",
      "## Thumbnail candidates",
      "",
      "| # | final | scene | score | reasons | chosen |",
      "| - | ----- | ----- | ----- | ------- | ------ |",
      ...candidates.map((c, i) => `| ${i + 1} | ${c.final ?? c.file} | ${c.scene} | ${c.score} | ${c.reasons.join(", ")} | ${c.chosen ? "✔" : ""} |`),
      "",
      "Upload all 3 finals to YouTube Studio **Test & Compare**; record your pick with:",
      "`node pipeline/06-publish/build-metadata.mjs <id> --choose-thumb <#>`"
    );
  }
  lines.push(
    "",
    "## Upload checklist",
    "- Altered/synthetic content: **Yes** (always — AI voice + visuals, D-025)",
    `- Status: ${publish.status}`,
    ""
  );
  return lines.join("\n");
}

/**
 * Write publish.md next to publish.json (same fields, human interface). Reads publish.json from
 * disk when `publish` is not passed; picks up thumb_candidates.json automatically when present.
 */
export function writeMarkdownExport(contentDir, publish = null) {
  publish = publish ?? JSON.parse(fs.readFileSync(path.join(contentDir, "publish.json"), "utf8"));
  const candPath = path.join(contentDir, "thumb_candidates.json");
  const candidates = fs.existsSync(candPath) ? JSON.parse(fs.readFileSync(candPath, "utf8")) : null;
  const outPath = path.join(contentDir, "publish.md");
  fs.writeFileSync(outPath, publishMarkdown(publish, { candidates }));
  return outPath;
}

/**
 * Record the owner's thumbnail pick: set chosen:true on exactly one thumb_candidates.json entry
 * (1-based index or a file/final path fragment), false on the rest, copy the chosen final to the
 * CANONICAL images/thumb_final.png (what publish.json's medium.cover et al. reference), and
 * refresh publish.md. The pick is the seed of the future CTR↔score learning loop — never skip it.
 */
export function recordThumbnailChoice(contentDir, pick) {
  const candPath = path.join(contentDir, "thumb_candidates.json");
  const candidates = JSON.parse(fs.readFileSync(candPath, "utf8"));
  const byIndex = Number.isInteger(Number(pick)) ? candidates[Number(pick) - 1] : null;
  const byFile = candidates.find((c) => c.file === pick || c.final === pick || String(c.file).includes(String(pick)));
  const chosen = byIndex ?? byFile;
  if (!chosen) throw new Error(`no thumbnail candidate matches "${pick}" (have 1..${candidates.length})`);
  for (const c of candidates) c.chosen = c === chosen;
  const { valid, errors } = validate(candidates, "thumb_candidates.json");
  if (!valid) throw new Error(`thumb_candidates.json invalid after choice: ${formatErrors(errors)}`);
  fs.writeFileSync(candPath, JSON.stringify(candidates, null, 2) + "\n");
  const finalSrc = path.join(contentDir, chosen.final ?? chosen.file);
  if (fs.existsSync(finalSrc)) fs.copyFileSync(finalSrc, path.join(contentDir, "images", "thumb_final.png"));
  if (fs.existsSync(path.join(contentDir, "publish.json"))) writeMarkdownExport(contentDir);
  return chosen;
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────
//   node pipeline/06-publish/build-metadata.mjs <id>                    build publish.json + publish.md
//   node pipeline/06-publish/build-metadata.mjs <id> --md-only          regenerate publish.md from the EXISTING publish.json
//   node pipeline/06-publish/build-metadata.mjs <id> --choose-thumb 2   record the owner's thumbnail pick (chosen:true)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const argv = process.argv.slice(2);
  const id = argv.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: node pipeline/06-publish/build-metadata.mjs <content_id> [--md-only | --choose-thumb <n|file>]");
    process.exit(2);
  }
  const contentDir = path.join(ROOT, "content", id);
  const chooseIx = argv.indexOf("--choose-thumb");
  if (chooseIx > -1) {
    const rec = recordThumbnailChoice(contentDir, argv[chooseIx + 1]);
    console.log(`OK chosen: ${rec.final ?? rec.file} (${rec.scene}, score ${rec.score}) → thumb_candidates.json + publish.md updated`);
  } else if (argv.includes("--md-only")) {
    console.log(`OK ${writeMarkdownExport(contentDir)} (publish.json untouched)`);
  } else {
    buildMetadataFile(contentDir);
    console.log(`OK publish.json + publish.md → content/${id}/`);
  }
}
