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

/** Effective rank: the analytics-adjusted score (T5.2) if present, else the prediction. */
export function effectiveScore(idea) {
  return typeof idea?.adjusted_score === "number" ? idea.adjusted_score : idea?.score ?? 0;
}

/**
 * The highest-ranked idea eligible to produce. Default = `backlog` only; sorted by effective
 * score desc, ties broken by id asc (deterministic). Returns null when none qualify.
 */
export function pickNextIdea(ideas, { statuses = ["backlog"] } = {}) {
  const eligible = (ideas?.ideas || []).filter((i) => statuses.includes(i.status));
  if (!eligible.length) return null;
  return eligible
    .slice()
    .sort((a, b) => effectiveScore(b) - effectiveScore(a) || String(a.id).localeCompare(String(b.id)))[0];
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

  const idea = pickNextIdea(ideas, { statuses });
  if (!idea) return { empty: true };

  const brief = briefFromIdea(idea);
  const { id } = scaffold(idea.id, { titleWorking: brief.title_working, brief });
  return { id, ideaId: idea.id, brief, ideas: markIdeaInProgress(ideas, idea.id, id) };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const ideas = readJson(IDEAS_PATH);

  // dry-run never scaffolds: just report what WOULD be picked.
  if (dryRun) {
    const busy = inProgressIdea(ideas);
    if (busy) return console.log(`busy: "${busy.id}" is in-progress (${busy.produced_video_id ?? "no folder yet"}).`);
    const idea = pickNextIdea(ideas);
    if (!idea) return console.log("empty: no backlog idea to pick.");
    return console.log(`would pick [${effectiveScore(idea)}] ${idea.id} — "${idea.title}" (${idea.archetype}).`);
  }

  const res = planNextVideo(ideas, { scaffold: scaffoldVideo });
  if (res.busy) return console.log(`busy: resume "${res.id ?? res.ideaId}" (already in-progress) — nothing scaffolded.`);
  if (res.empty) return console.log("empty: no backlog idea to pick.");
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(res.ideas, null, 2) + "\n");
  console.log(`picked "${res.ideaId}" → scaffolded content/${res.id}/ (brief seeded). Idea marked in-progress.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
