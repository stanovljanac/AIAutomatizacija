// Auto-metadata (Phase B #3): deterministically fill publish.json from brief + script +
// alignment — title options, an answer-first <=3-sentence description, tags, and chapters
// timed from the alignment. Titles/description are sensible BASELINES the review refines.
import fs from "node:fs";
import path from "node:path";
import { validate } from "../shared/lib/validate-lib.mjs";

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

export function buildMetadata({ brief, script, alignment, introOffset = 0 }) {
  const tags = buildTags(brief);
  return {
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
}

/** CLI: reads brief/script/alignment from contentDir, writes publish.json, returns it. */
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
  return publish;
}
