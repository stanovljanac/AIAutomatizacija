// Single-video orchestrator (O1b) — composes the production DAG on top of dag.mjs and runs
// it for one video. Nodes fan out into LONG + SHORT branches (D-033) and stop at the owner
// gate. Executors are injectable. Mechanical phases (voice/align via Python) run for real;
// agent phases (script/render/qa/review) go through the Runner — real in headless mode, deferred
// to the top agent in Claude-Code mode; upload needs the one-time OAuth token.
//
// CLI:  npm run make-video -- <id>           e.g.  npm run make-video -- 005-foo
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runDag } from "./dag.mjs";
import { createRunner } from "./runner.mjs";
import { notify } from "./notify.mjs";
import { deriveShortFile } from "../../01-script/make-short.mjs";
import { buildMetadataFile } from "../../06-publish/build-metadata.mjs";
import { reviewLoop } from "../review/loop.mjs";
import { buildReviewers } from "../review/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const pause = (reason, extra = {}) => ({ __pause: true, reason, ...extra });

function pythonExe(root) {
  const win = process.platform === "win32";
  return path.join(root, win ? ".venv/Scripts/python.exe" : ".venv/bin/python");
}

/** Run a mechanical step (Node/Python/ffmpeg). Throws on non-zero so the DAG pauses + notifies. */
async function mechanical(ctx, cmd, args, label, extra = {}) {
  const r = await ctx.runner.runCommand({ cmd, args, cwd: ctx.root, ...extra });
  if (r.code !== 0) throw new Error(`${label} failed (exit ${r.code}): ${(r.stderr || r.stdout || "").slice(-400)}`);
  return { ok: true, label };
}

/** Run an agent/skill step via the Runner. Claude-Code mode DEFERS → the node pauses for the top agent. */
async function agentStep(ctx, role, payload, deferReason) {
  const res = await ctx.runner.runAgent({ role, id: ctx.id, ...payload });
  if (res && res.deferred) return pause(deferReason, { task: res.task });
  return res?.data ?? res ?? { ok: true };
}

/** Run the live review panel loop for one stage; pause (surface to owner) if it can't pass inline. */
async function reviewStage(stage, artifact, { config, runner }) {
  const reviewers = await buildReviewers(config, { runner });
  if (reviewers.length < 2) return { proceed: true, note: "review panel disabled (<2 reviewers)" };
  const out = await reviewLoop({
    stage,
    target: stage,
    artifact,
    reviewers,
    panelCfg: config.review.panel,
    maxIterations: config.review?.panel?.max_iterations,
  });
  if (out.deferred) {
    return pause(`${stage} review deferred (add GEMINI_API_KEY or run headless): ${out.deferred.map((d) => d.reason || "agent").join("; ")}`);
  }
  if (!out.passed) return pause(`${stage} review below threshold after ${out.iterations} iteration(s) — owner revise`);
  return { proceed: true, band: out.band };
}

export function loadConfig(root = REPO_ROOT) {
  const live = path.join(root, "pipeline/shared/config.json");
  const example = path.join(root, "pipeline/shared/config.example.json");
  return readJson(fs.existsSync(live) ? live : example);
}

function readArtifactOr(dir, file, deferReason) {
  const p = path.join(dir, file);
  return fs.existsSync(p) ? readJson(p) : pause(deferReason);
}

/** Default executors. Each receives (ctx, results). ctx = { id, contentDir, config, runner }. */
export function defaultExecutors() {
  return {
    brief: ({ contentDir }) => readJson(path.join(contentDir, "brief.json")),
    script: ({ contentDir }) => readArtifactOr(contentDir, "script.json", "script-writing (agent) required"),
    review_script: (ctx, results) => reviewStage("script", results.script, ctx),
    short_script: ({ contentDir, config }) =>
      deriveShortFile(contentDir, { targetSeconds: config.defaults?.short_seconds }),
    plan_long: ({ contentDir }) => readArtifactOr(contentDir, "scene-plan.json", "storyboard (agent)"),
    plan_short: ({ contentDir }) => readArtifactOr(path.join(contentDir, "short"), "scene-plan.json", "storyboard short (agent)"),
    // Mechanical: real Node/Python commands (run in both modes).
    voice_long: (ctx) => mechanical(ctx, ctx.python, ["scripts/make_voice.py", ctx.id], "voice(long)"),
    align_long: (ctx) => mechanical(ctx, ctx.python, ["scripts/make_alignment.py", ctx.id], "align(long)"),
    voice_short: (ctx) => mechanical(ctx, ctx.python, ["scripts/make_voice.py", `${ctx.id}/short`], "voice(short)"),
    align_short: (ctx) => mechanical(ctx, ctx.python, ["scripts/make_alignment.py", `${ctx.id}/short`], "align(short)"),
    // Agent/skill: render (video-render) + qa (qa-video). Real in headless; deferred to the top agent in Claude-Code mode.
    render_long: (ctx) => agentStep(ctx, "video-render", { target: ctx.id }, "render(long) via the video-render skill"),
    render_short: (ctx) => agentStep(ctx, "video-render", { target: `${ctx.id}/short` }, "render(short) via the video-render skill"),
    qa: (ctx) => agentStep(ctx, "qa-video", {}, "qa-video (agent) — run the qa-video skill"),
    review_cut: (ctx, results) => reviewStage("cut", { qa: results.qa, scriptId: ctx.id }, ctx),
    metadata: ({ contentDir }) => buildMetadataFile(contentDir),
    upload: () => pause("YouTube OAuth/token not configured — run auth.mjs once, then resume"),
    gate_owner: (_ctx, results) =>
      pause("Owner: review the private draft, set the thumbnail, click publish", {
        videoId: results.upload?.videoId ?? null,
      }),
  };
}

/** The video DAG. Every node delegates to ex[id]; deps encode the long‖short fan-out (D-033). */
export function videoNodes(ex) {
  const node = (id, deps, opts = {}) => ({ id, deps, run: (ctx, results) => ex[id](ctx, results), ...opts });
  return [
    node("brief", []),
    node("script", ["brief"]),
    node("review_script", ["script"]),
    // fan-out
    node("short_script", ["review_script"]),
    node("plan_long", ["review_script"]),
    node("voice_long", ["review_script"]),
    node("align_long", ["voice_long"]),
    node("render_long", ["align_long", "plan_long"]),
    node("plan_short", ["short_script"]),
    node("voice_short", ["short_script"]),
    node("align_short", ["voice_short"]),
    node("render_short", ["align_short", "plan_short"]),
    // join
    node("qa", ["render_long", "render_short"]),
    node("review_cut", ["qa"]),
    node("metadata", ["review_cut"]),
    node("upload", ["metadata"]),
    node("gate_owner", ["upload"], { gate: true }),
  ];
}

/**
 * Run the pipeline for one video.
 * @returns dag result { ok, blocked?, manifest, results }
 */
export async function runVideo({ id, root = REPO_ROOT, config, executors, runner, manifest, onPause } = {}) {
  config = config || loadConfig(root);
  const contentDir = path.join(root, config.paths?.content || "content", id.split("/")[0]);
  const ex = { ...defaultExecutors(), ...(executors || {}) };
  runner = runner || createRunner();
  const nodes = videoNodes(ex);
  const ctx = { id, root, contentDir, config, runner, python: pythonExe(root) };

  const manifestPath = path.join(contentDir, "run-manifest.json");
  manifest = manifest || (fs.existsSync(manifestPath) ? readJson(manifestPath) : { nodes: {} });
  const saveManifest = (m) => fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");

  const retry = {
    max_attempts: config.error?.retry?.max_attempts ?? 3,
    backoff_ms: config.error?.retry?.backoff_ms ?? 2000,
    backoff_factor: config.error?.retry?.backoff_factor ?? 2,
  };

  const handlePause = async (info) => {
    await notify({ event: `${id}: ${info.node}`, videoId: id, action: info.reason || info.error });
    if (onPause) await onPause(info);
  };

  return runDag(nodes, { ctx, manifest, retry, onPause: handlePause, saveManifest });
}

// CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: node pipeline/shared/orchestrator/run.mjs <id>");
    process.exit(2);
  }
  runVideo({ id })
    .then((r) => {
      if (r.ok) console.log(`✅ ${id}: pipeline complete`);
      else console.log(`⏸  ${id}: paused at "${r.blocked.id}" — ${r.blocked.reason || r.blocked.error}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
