#!/usr/bin/env node
// Stop-hook publish close-out gate (D-062 — the ship-mode forcing function).
//
// Fires when the agent tries to finish a turn. It runs the lifecycle reconciler
// (pipeline/state/reconcile.mjs) against the real repo: every derived file that drifted from
// the ledger — ideas.json status, produced_subjects.json, a video's publish.json status — is
// SILENTLY self-healed, because a machine can compute all of it. It then BLOCKS on the one
// obligation a machine can't produce: the durable lesson a shipped video owes (D-061). That is
// the whole point — close-out gets skipped precisely while the owner is in ship mode, so it has
// to be code, not a rule.
//
// Detection is the FILESYSTEM, not git: content/ and the idea bank are git-ignored, so a freshly
// shipped video is invisible to `git status`. The reconciler scans content/*/publish.json instead
// (a publish.json exists only once the owner approved the final video — Gate 2).
//
// Safety design (mirrors knowledge-lint.mjs / test-gate.mjs):
//   • FAIL-OPEN: any error in this hook → allow the stop (never break a turn).
//   • Skips in plan mode.
//   • `[skip-close]` in the final message is an intentional escape (also skips the self-heal).
//   • Bounded re-blocks per session (max 2) so it can never infinite-loop.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_BLOCKS = 2;
const SKIP_TOKEN = "[skip-close]";

function allow() {
  process.exit(0); // no output + exit 0 = let the agent stop
}
function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function lastMessageHasSkip(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
    const txt = fs.readFileSync(transcriptPath, "utf8");
    return txt.slice(-4000).includes(SKIP_TOKEN);
  } catch {
    return false;
  }
}

/**
 * Which repo the reconciler should reconcile. The session cwd normally IS the project root, but
 * a turn started from a subfolder would silently reconcile nothing — so cwd only wins when it
 * actually holds a content/ tree; otherwise fall back to the reconciler's own repo root.
 */
function repoRoot(cwd, fallback) {
  return cwd && fs.existsSync(path.join(cwd, "content")) ? cwd : fallback;
}

function readBlocks(stateFile) {
  try {
    if (fs.existsSync(stateFile)) return JSON.parse(fs.readFileSync(stateFile, "utf8")).blocks || 0;
  } catch {
    /* ignore */
  }
  return 0;
}

function clearState(stateFile) {
  try {
    fs.rmSync(stateFile, { force: true });
  } catch {
    /* ignore */
  }
}

function reason(owed, { subjectsMoved, healError }) {
  const list = owed.map((id) => `  • ${id}`).join("\n");
  const one = owed[0];
  return (
    `Publish close-out gate: ${owed.length} shipped video(s) still owe the durable lesson (D-061).\n${list}\n\n` +
    `Write the KOS note (knowledge/desk-knowledge/, per its SYSTEM.md), then link it:\n` +
    `  node pipeline/state/reconcile.mjs ${one} --learned --note <slug>\n` +
    `…or settle it as reviewed-nothing-durable:\n` +
    `  node pipeline/state/reconcile.mjs ${one} --learned --nothing\n` +
    (subjectsMoved
      ? `\nAlso: produced_subjects.json just gained an entry — add the human row to docs/CHANNEL_MAP.md ` +
        `(the reconciler owns the machine mirror, never the prose).\n`
      : "") +
    (healError ? `\nNote: the derived-state self-heal failed — ${healError}\n` : "") +
    `\n(or write ${SKIP_TOKEN} in your message to stop intentionally).`
  );
}

async function main() {
  const raw = readStdin();
  if (!raw.trim()) return allow(); // no session payload at all → nothing to reconcile

  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {
    return allow();
  }

  if (input.permission_mode === "plan") return allow(); // never gate planning
  if (lastMessageHasSkip(input.transcript_path)) return allow(); // intentional escape

  // Imported lazily so a broken/missing reconciler can never crash the turn's end.
  const { ROOT, applyPlan, planReconcile } = await import(
    new URL("../../pipeline/state/reconcile.mjs", import.meta.url)
  );
  const plan = planReconcile({ root: repoRoot(input.cwd, ROOT) });

  // Silent self-heal: everything a machine can compute is just written.
  let healError = null;
  if (plan.writes.length) {
    try {
      applyPlan(plan);
    } catch (e) {
      healError = e.message;
    }
  }

  const stateFile = path.join(os.tmpdir(), `tad-publishclose-${input.session_id || "x"}.json`);
  if (!plan.owed.length) {
    clearState(stateFile);
    return allow();
  }

  const blocks = readBlocks(stateFile);
  if (blocks >= MAX_BLOCKS) {
    // Give up blocking to avoid a loop; let the agent stop and surface to the owner.
    clearState(stateFile);
    return allow();
  }
  try {
    fs.writeFileSync(stateFile, JSON.stringify({ blocks: blocks + 1 }));
  } catch {
    /* ignore */
  }

  block(
    reason(plan.owed, {
      subjectsMoved: plan.writes.some((w) => w.kind === "subjects"),
      healError,
    })
  );
}

try {
  await main();
} catch {
  allow(); // fail-open: a broken gate must never block real work
}
