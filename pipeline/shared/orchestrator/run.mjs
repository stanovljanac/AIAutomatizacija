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
import { deriveShortFile, deriveShortPlanFile } from "../../01-script/make-short.mjs";
import { deriveShorts, remarkShorts } from "../../01-script/make-shorts.mjs";
import { SHORT_UNIT_RE, sortUnits } from "../lib/units.mjs";
import { voiceArgs } from "../../02-voice/voice-dispatcher.mjs";
import { buildMetadataFile } from "../../06-publish/build-metadata.mjs";
import { reviewLoop } from "../review/loop.mjs";
import { buildReviewers } from "../review/build.mjs";
import { resolvePanelCfg } from "../review/panel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const pause = (reason, extra = {}) => ({ __pause: true, reason, ...extra });

function pythonExe(root) {
  const win = process.platform === "win32";
  return path.join(root, win ? ".venv/Scripts/python.exe" : ".venv/bin/python");
}

// Nodes whose pause is an AGENT hand-off, not an owner action: in Claude-Code mode these defer to
// the top agent (it runs the skill); the owner shouldn't be pinged. Everything else that pauses —
// the 2 human gates (review_script, gate_owner), a review that couldn't auto-pass (review_cut),
// the upload OAuth prompt — IS owner-actionable, as is any hard error. (In headless mode these
// nodes run for real and don't defer, so suppression only affects Claude-Code deferrals.)
export const AGENT_DEFERRAL_NODES = new Set(["script", "plan_long", "render_long", "render_short", "qa"]);

/** Should THIS pause ping the owner? Errors always do; gate pauses do unless they're agent deferrals. */
export function notifiesOwner(info) {
  if (info.kind === "error") return true;
  return !AGENT_DEFERRAL_NODES.has(info.node);
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
  // A single-reviewer panel still gates (Gemini retired 2026-07-09, D-053); only an EMPTY panel skips.
  if (reviewers.length < 1) return { proceed: true, note: "review panel disabled (no reviewers)" };
  const out = await reviewLoop({
    stage,
    target: stage,
    artifact,
    reviewers,
    // resolve the stage's panel override (e.g. publish → SEO weights/gates); script/cut inherit global
    panelCfg: resolvePanelCfg(config.review.panel, stage),
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

/** Every Short unit of the topic that has a script, in order: short, short-2, … (1B, D-074). */
export function shortUnitsOf(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  return sortUnits(
    fs.readdirSync(contentDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && SHORT_UNIT_RE.test(e.name) && fs.existsSync(path.join(contentDir, e.name, "script.json")))
      .map((e) => e.name)
  );
}

/** A unit already voiced + aligned from its current script (a hand-built Short) is never re-voiced. */
function unitIsAligned(contentDir, unit) {
  const al = path.join(contentDir, unit, "alignment.json");
  const sc = path.join(contentDir, unit, "script.json");
  return fs.existsSync(al) && fs.statSync(al).mtimeMs >= fs.statSync(sc).mtimeMs;
}

const hasCuts = (contentDir) => {
  const p = path.join(contentDir, "script.json");
  return fs.existsSync(p) && (readJson(p).short_cuts ?? []).length > 0;
};

/** Run one mechanical step for every Short unit still to do. */
async function eachUnit(ctx, label, argsFor, { skipAligned = false } = {}) {
  const done = [];
  for (const unit of shortUnitsOf(ctx.contentDir)) {
    if (skipAligned && unitIsAligned(ctx.contentDir, unit)) continue;
    await mechanical(ctx, ...argsFor(`${ctx.id}/${unit}`), `${label}(${unit})`);
    done.push(unit);
  }
  return { ok: true, units: done };
}

/** Default executors. Each receives (ctx, results). ctx = { id, contentDir, config, runner }. */
export function defaultExecutors() {
  return {
    brief: ({ contentDir }) => readJson(path.join(contentDir, "brief.json")),
    script: ({ contentDir }) => readArtifactOr(contentDir, "script.json", "script-writing (agent) required"),
    review_script: (ctx, results) => reviewStage("script", results.script, ctx),
    // 1B (D-074): a long script with `short_cuts` gives 2-3 Shorts cut from its own scenes (make-shorts);
    // without them, the one lean derived Short of before (make-short).
    short_script: ({ contentDir, config, root, id }) => {
      if (!hasCuts(contentDir)) return deriveShortFile(contentDir, { targetSeconds: config.defaults?.short_seconds });
      const res = deriveShorts({ root, id: id.split("/")[0] });
      if (!res.ok) throw new Error(`short_cuts: ${res.problems.join("; ")}`);
      return { units: res.units };
    },
    plan_long: ({ contentDir }) => readArtifactOr(contentDir, "scene-plan.json", "storyboard (agent)"),
    // The Short scene-plan is DERIVED from the long plan (lean reuse of kept scenes) — no agent
    // pause, no second storyboard pass. Respects a hand-authored short/scene-plan.json if present.
    plan_short: ({ contentDir, config }) =>
      hasCuts(contentDir)
        ? { derived: "make-shorts", units: shortUnitsOf(contentDir) } // the cut plans were written with their scripts
        : deriveShortPlanFile(contentDir, { targetSeconds: config.defaults?.short_seconds }),
    // Mechanical: real Node/Python commands (run in both modes). Voice goes through the TtsProvider
    // seam (T4.2): voiceArgs() picks the synth script from config.voice (edge-tts by default — the
    // voice that ships, D-076). Alignment is provider-agnostic (faster-whisper on the produced narration.mp3).
    voice_long: (ctx) => mechanical(ctx, ctx.python, voiceArgs(ctx.config, ctx.id), "voice(long)"),
    align_long: (ctx) => mechanical(ctx, ctx.python, ["scripts/make_alignment.py", ctx.id], "align(long)"),
    voice_short: (ctx) => eachUnit(ctx, "voice", (unitId) => [ctx.python, voiceArgs(ctx.config, unitId)], { skipAligned: true }),
    // after aligning, a cut's word marks + SFX move from the long's clock to its own (make-shorts --marks)
    align_short: async (ctx) => {
      const res = await eachUnit(ctx, "align", (unitId) => [ctx.python, ["scripts/make_alignment.py", unitId]], { skipAligned: true });
      if (hasCuts(ctx.contentDir)) res.marks = remarkShorts({ root: ctx.root, id: ctx.id.split("/")[0] });
      return res;
    },
    // Agent/skill: render (video-render) + qa (qa-video). Real in headless; deferred to the top agent in Claude-Code mode.
    render_long: (ctx) => agentStep(ctx, "video-render", { target: ctx.id }, "render(long) via the video-render skill"),
    render_short: (ctx) => {
      const targets = shortUnitsOf(ctx.contentDir).map((u) => `${ctx.id}/${u}`);
      return agentStep(ctx, "video-render", { target: targets[0] ?? `${ctx.id}/short`, targets }, `render(${targets.length} Short unit(s)) via the video-render skill`);
    },
    qa: (ctx) => agentStep(ctx, "qa-video", {}, "qa-video (agent) — run the qa-video skill"),
    review_cut: (ctx, results) => reviewStage("cut", { qa: results.qa, scriptId: ctx.id }, ctx),
    // Mechanical: 3 caption-free thumbnail candidate stills from the video's own timeline (04b).
    thumbnails: (ctx) => mechanical(ctx, "node", ["pipeline/04b-thumbnails/extract.mjs", ctx.id], "thumbnails"),
    // Mechanical: the upload file — the approved 1080p master upscaled to config.render.upscale (2B,
    // D-074); the master moves to render/master.mp4. Idempotent, and a no-op for a format set to null.
    finalize: async (ctx) => {
      await mechanical(ctx, "node", ["pipeline/04-render/finalize.mjs", ctx.id], "finalize(long)");
      return eachUnit(ctx, "finalize", (unitId) => ["node", ["pipeline/04-render/finalize.mjs", unitId]]);
    },
    metadata: ({ contentDir }) => buildMetadataFile(contentDir),
    // Publish copy passes the review agent before the owner sees it (operating principle 3).
    review_publish: (ctx, results) => reviewStage("publish", results.metadata, ctx),
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
    node("plan_short", ["short_script", "plan_long"]),
    node("voice_short", ["short_script"]),
    node("align_short", ["voice_short"]),
    node("render_short", ["align_short", "plan_short"]),
    // join
    node("qa", ["render_long", "render_short"]),
    node("review_cut", ["qa"]),
    node("thumbnails", ["render_long"]), // candidates from the long cut's own timeline (04b)
    // after the thumbnails: they grab from the 1080p cut, which finalize moves to render/master.mp4
    node("finalize", ["review_cut", "thumbnails"]),
    node("metadata", ["review_cut"]),
    node("review_publish", ["metadata"]),
    node("upload", ["review_publish", "finalize"]),
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
    // Notify the owner only on owner-actionable pauses (the 2 gates / errors), never on the
    // top-agent skill hand-offs — that keeps a scheduled run quiet until a human is truly needed.
    if (notifiesOwner(info)) {
      await notify({ event: `${id}: ${info.node}`, videoId: id, action: info.reason || info.error });
    }
    if (onPause) await onPause(info);
  };

  return runDag(nodes, { ctx, manifest, retry, onPause: handlePause, saveManifest });
}

// CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  (await import("../lib/load-env.mjs")).loadEnv(); // make .env secrets (GEMINI_API_KEY, YOUTUBE_*) take effect
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
