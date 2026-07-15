#!/usr/bin/env node
/**
 * pick-next.mjs — the autonomous picker (Wave 5, T5.1). Chooses the next video from the idea-bank
 * and scaffolds its folder, so a scheduled run can produce without a human choosing the topic
 * (Gate 1 is auto — CLAUDE.md). It is the front of the headless `auto-run` loop:
 *   pick top backlog idea (by effective score = analytics-adjusted ?? predicted) → scaffold from
 *   _TEMPLATE with a brief seeded from the idea → mark the idea in-progress so it isn't re-picked.
 *
 * Safe to fire repeatedly: if a video is already in-progress it scaffolds NOTHING and reports it
 * (the caller resumes that one via make-video's manifest) — no piling up of half-built videos.
 *
 * Pure selection is exported (tests inject ideas + a fake scaffold); the CLI does the fs + scaffold.
 *
 *   node pipeline/00-ideas/pick-next.mjs            # pick + scaffold, update ideas.json
 *   node pipeline/00-ideas/pick-next.mjs --dry-run  # report the pick, write/scaffold nothing
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldVideo } from "./new-video.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const IDEAS_PATH = path.join(__dirname, "ideas.json");
export const SUBJECTS_PATH = path.join(__dirname, "produced_subjects.json");

/** Effective rank: the analytics-adjusted score (T5.2) if present, else the prediction. */
export function effectiveScore(idea) {
  return typeof idea?.adjusted_score === "number" ? idea.adjusted_score : idea?.score ?? 0;
}

/** Numeric prefix of a produced_video_id ("008-foo" → 8); -1 when absent/unparseable. */
function videoSeq(idea) {
  const m = String(idea?.produced_video_id ?? "").match(/^(\d+)/);
  return m ? Number(m[1]) : -1;
}

/**
 * The last `n` produced ideas as {lane, archetype, tool}, most-recent-first (ordered by the numeric
 * prefix of produced_video_id). Drives the variety soft-cap. Pure.
 */
export function recentFromBank(ideas, n = 2) {
  return (ideas?.ideas || [])
    .filter((i) => i.status === "produced" && videoSeq(i) >= 0)
    .sort((a, b) => videoSeq(b) - videoSeq(a))
    .slice(0, n)
    .map((i) => ({ lane: i.lane, archetype: i.archetype, tool: i.tool }));
}

/**
 * Would picking `idea` make MORE than a run of `runCap` in a row on ANY of lane/archetype/tool?
 * True only when the last `runCap` produced all share that (defined) value with the candidate.
 * The variety soft-cap (no >2 of the same lane/archetype/tool in a row). Pure.
 */
export function extendsRun(idea, recent = [], runCap = 2) {
  if (recent.length < runCap) return false;
  const lastN = recent.slice(0, runCap);
  return ["lane", "archetype", "tool"].some((k) => idea?.[k] != null && lastN.every((r) => r?.[k] === idea[k]));
}

/**
 * The highest-ranked idea eligible to produce. Default = `backlog` only; sorted by effective score
 * desc, ties broken by id asc (deterministic). Idea-pass REJECTS (value_band="reject") are skipped.
 * Variety soft-cap: among eligible ideas, prefer the highest-scored one that does NOT extend a
 * >runCap run of the same lane/archetype/tool; if every candidate would (rare), fall back to the top
 * score (never hard-block — reach/variety stays a nudge). Returns null when none qualify.
 */
export function pickNextIdea(ideas, { statuses = ["backlog"], recent = [], runCap = 2 } = {}) {
  const eligible = (ideas?.ideas || []).filter((i) => statuses.includes(i.status) && i.value_band !== "reject");
  if (!eligible.length) return null;
  const sorted = eligible
    .slice()
    .sort((a, b) => effectiveScore(b) - effectiveScore(a) || String(a.id).localeCompare(String(b.id)));
  return sorted.find((i) => !extendsRun(i, recent, runCap)) ?? sorted[0];
}

/**
 * Does the chosen idea's `subject` coordinate collide with one already claimed by a prior video?
 * Returns { subject, videos } when the idea carries a subject that already appears in the registry
 * (produced_subjects.json shape: { subjects: { "branch/leaf": [videoId, ...] } }), else null.
 * A WARNING only — the caller surfaces it; it never blocks a pick (D-059: no auto-rejection). Pure.
 */
export function subjectCollision(idea, registry) {
  const subject = idea?.subject;
  if (!subject) return null;
  const videos = registry?.subjects?.[subject];
  return Array.isArray(videos) && videos.length ? { subject, videos } : null;
}

/** The idea already in production (status in-progress), if any — used to avoid double-starting. */
export function inProgressIdea(ideas) {
  return (ideas?.ideas || []).find((i) => i.status === "in-progress") || null;
}

/** Seed brief.json overrides from a chosen idea (the rest come from scaffoldVideo's defaults). */
export function briefFromIdea(idea) {
  const out = {
    title_working: idea.title || "",
    archetype: idea.archetype || "ideas", // ideas | mini-demo | diagram | comparison (shared enum); fall back to "ideas" when absent so the brief never fails schema validation
    angle: idea.angle_hint || "",
    task: idea.task || "",
    status: "new",
  };
  if (idea.search_term) out.search_term = idea.search_term;
  if (idea.tool) out.tool = idea.tool;
  if (idea.sector) out.sector = idea.sector;
  const score = effectiveScore(idea);
  if (typeof score === "number") out.score = score;
  // carry the idea-pass content-value fields so the script-pass can verify the takeaway is delivered
  if (idea.lane) out.lane = idea.lane;
  if (Array.isArray(idea.value_type) && idea.value_type.length) out.value_type = idea.value_type;
  if (idea.takeaway) out.takeaway = idea.takeaway;
  if (typeof idea.value_score === "number") out.value_score = idea.value_score;
  if (idea.value_band) out.value_band = idea.value_band;
  return out;
}

/** Mark an idea in-progress + bind it to its scaffolded video id. Pure (returns a new bank). */
export function markIdeaInProgress(ideas, ideaId, videoId) {
  const list = (ideas?.ideas || []).map((i) =>
    i.id === ideaId ? { ...i, status: "in-progress", produced_video_id: videoId } : i
  );
  return { ...ideas, ideas: list };
}

/**
 * Pick + scaffold the next video. `scaffold(slug, { titleWorking, brief })` is injected (real =
 * scaffoldVideo). Returns one of:
 *   { busy: true, id }      — a video is already in-progress; resume it, don't start a new one
 *   { empty: true }         — no eligible backlog idea
 *   { id, ideaId, brief }   — scaffolded a new video; `ideas` is the updated bank (caller persists)
 * Pure of fs: it takes the parsed bank and returns the new bank; the CLI reads/writes ideas.json.
 */
export function planNextVideo(ideas, { scaffold, statuses } = {}) {
  const busy = inProgressIdea(ideas);
  if (busy) return { busy: true, id: busy.produced_video_id ?? null, ideaId: busy.id };

  const idea = pickNextIdea(ideas, { statuses, recent: recentFromBank(ideas) });
  if (!idea) return { empty: true };

  const brief = briefFromIdea(idea);
  const { id } = scaffold(idea.id, { titleWorking: brief.title_working, brief });
  return { id, ideaId: idea.id, brief, ideas: markIdeaInProgress(ideas, idea.id, id) };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/** Load the subject registry; tolerant of an absent/broken file (the guard is best-effort). */
function loadSubjectRegistry() {
  try {
    return readJson(SUBJECTS_PATH);
  } catch {
    return { subjects: {} };
  }
}

/** Print the subject-collision warning for a chosen idea, if any (D-059). */
function warnSubjectCollision(idea, registry) {
  const hit = subjectCollision(idea, registry);
  if (hit) {
    console.warn(
      `⚠ subject collision: "${idea.id}" is subject "${hit.subject}", already covered by ${hit.videos.join(", ")}. ` +
        `Make sure it's a deliberately distinct angle, not a near-duplicate (D-059). Not blocking.`
    );
  }
}

function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const ideas = readJson(IDEAS_PATH);
  const registry = loadSubjectRegistry();

  // dry-run never scaffolds: just report what WOULD be picked.
  if (dryRun) {
    const busy = inProgressIdea(ideas);
    if (busy) return console.log(`busy: "${busy.id}" is in-progress (${busy.produced_video_id ?? "no folder yet"}).`);
    const idea = pickNextIdea(ideas, { recent: recentFromBank(ideas) });
    if (!idea) return console.log("empty: no backlog idea to pick.");
    console.log(`would pick [${effectiveScore(idea)}] ${idea.id} — "${idea.title}" (${idea.archetype}${idea.lane ? ", " + idea.lane : ""}).`);
    return warnSubjectCollision(idea, registry);
  }

  const res = planNextVideo(ideas, { scaffold: scaffoldVideo });
  if (res.busy) return console.log(`busy: resume "${res.id ?? res.ideaId}" (already in-progress) — nothing scaffolded.`);
  if (res.empty) return console.log("empty: no backlog idea to pick.");
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(res.ideas, null, 2) + "\n");
  console.log(`picked "${res.ideaId}" → scaffolded content/${res.id}/ (brief seeded). Idea marked in-progress.`);
  warnSubjectCollision(ideas.ideas.find((i) => i.id === res.ideaId), registry);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
