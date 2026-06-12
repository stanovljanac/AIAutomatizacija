#!/usr/bin/env node
/**
 * auto-run.mjs — the autonomous driver (Wave 5, T5.1). One pass of the hands-off loop:
 *   • idle  → pick the top backlog idea + scaffold it (pick-next), mark it in-progress, then run;
 *   • busy  → resume the in-progress video (the DAG resumes from its manifest);
 *   • run   → advance the video DAG to its next pause and classify it.
 *
 * It is meant to be LOOPED by the scheduler (a CronCreate cloud agent — owner's choice): each fire
 * advances one step. The classification tells the wrapper what to do next:
 *   - { done }        → the video reached the owner gate / finished; nothing more to automate.
 *   - { ownerGate }   → a human is needed (the 2 gates, a failed review, OAuth) — PushNotify the owner.
 *   - { agentTask }   → a skill hand-off (Claude-Code mode): the wrapping agent runs that skill,
 *                       marks the node done in run-manifest.json, and re-runs auto-run.
 *
 * Pure-ish core (`autoRun`) takes the parsed bank + injected scaffold/runVideo/persist so tests need
 * no fs, network, or `claude` CLI. The CLI wires the real ones and persists ideas.json.
 *
 *   node pipeline/shared/orchestrator/auto-run.mjs            # advance one step
 *   node pipeline/shared/orchestrator/auto-run.mjs --dry-run  # report the pick/resume, run nothing
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runVideo, loadConfig, notifiesOwner, AGENT_DEFERRAL_NODES, REPO_ROOT } from "./run.mjs";
import { planNextVideo, inProgressIdea, pickNextIdea, effectiveScore } from "../../00-ideas/pick-next.mjs";
import { scaffoldVideo } from "../../00-ideas/new-video.mjs";

const IDEAS_PATH = path.join(REPO_ROOT, "pipeline", "00-ideas", "ideas.json");

/** Classify a DAG result's blocking node into the wrapper's next action. */
export function classifyPause(result) {
  if (!result || result.ok) return { kind: "done" };
  const b = result.blocked;
  if (!b) return { kind: "done" };
  if (b.kind === "error") return { kind: "ownerGate", node: b.id, reason: b.error, error: true };
  if (AGENT_DEFERRAL_NODES.has(b.id)) return { kind: "agentTask", node: b.id, reason: b.reason };
  if (notifiesOwner({ node: b.id, kind: b.kind })) return { kind: "ownerGate", node: b.id, reason: b.reason };
  return { kind: "blocked", node: b.id, reason: b.reason };
}

/**
 * Advance the autonomous pipeline by one pass. Picks + scaffolds when idle (persisting the
 * in-progress marker BEFORE running, so a crash can't lose it), else resumes the in-progress video.
 *
 * @param ideas parsed ideas.json
 * @param deps  { scaffold, runVideo, persistIdeas, root, config }
 * @returns { empty } | { busy:true, id:null } | { id, picked|resumed, ideaId, action, result }
 */
export async function autoRun(ideas, { scaffold = scaffoldVideo, runVideo: runVideoFn = runVideo, persistIdeas, root = REPO_ROOT, config } = {}) {
  const plan = planNextVideo(ideas, { scaffold });
  if (plan.empty) return { empty: true };
  if (plan.busy) {
    if (!plan.id) return { busy: true, id: null, ideaId: plan.ideaId }; // in-progress idea never got a folder
  } else if (persistIdeas) {
    await persistIdeas(plan.ideas); // record in-progress BEFORE the run so a crash can't orphan the pick
  }

  const id = plan.id;
  const result = await runVideoFn({ id, root, config });
  return {
    id,
    picked: !plan.busy,
    resumed: !!plan.busy,
    ideaId: plan.ideaId,
    action: classifyPause(result),
    result,
  };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

function reportDryRun(ideas) {
  const busy = inProgressIdea(ideas);
  if (busy) return console.log(`busy: would resume "${busy.produced_video_id ?? busy.id}" (in-progress).`);
  const idea = pickNextIdea(ideas);
  if (!idea) return console.log("empty: no backlog idea to pick.");
  console.log(`would pick [${effectiveScore(idea)}] ${idea.id} — "${idea.title}" and run its DAG.`);
}

async function main() {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const config = loadConfig(REPO_ROOT);
  const ideas = readJson(IDEAS_PATH);

  if (dryRun) return reportDryRun(ideas);

  const out = await autoRun(ideas, {
    config,
    persistIdeas: (updated) => fs.writeFileSync(IDEAS_PATH, JSON.stringify(updated, null, 2) + "\n"),
  });

  if (out.empty) return console.log("empty: no backlog idea to pick — add ideas or fetch news.");
  if (out.busy && !out.id) return console.log(`busy: idea "${out.ideaId}" is in-progress but has no folder — needs manual attention.`);

  const verb = out.picked ? "picked + scaffolded" : "resumed";
  console.log(`${verb} ${out.id} (idea: ${out.ideaId}).`);
  const a = out.action;
  if (a.kind === "done") console.log(`✅ ${out.id}: reached the owner gate / complete — nothing more to automate.`);
  else if (a.kind === "ownerGate") console.log(`🔔 OWNER NEEDED at "${a.node}": ${a.reason}${a.error ? " (error)" : ""}`);
  else if (a.kind === "agentTask") console.log(`🤖 agent hand-off at "${a.node}": ${a.reason}. Run that skill, mark the node done, re-run auto-run.`);
  else console.log(`⏸  blocked at "${a.node}": ${a.reason}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (await import("../lib/load-env.mjs")).loadEnv(); // .env secrets (GEMINI_API_KEY, YOUTUBE_*) before the run
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
