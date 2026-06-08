#!/usr/bin/env node
// Stop-hook test gate (build-sprint policy, decision: hard gate scoped to code changes).
//
// Fires when the agent tries to finish a turn. If our code changed and `node --test`
// fails, it BLOCKS finishing and feeds the failures back so they get fixed — the
// mechanical guarantee that an unattended/autonomous run never "completes" on red.
//
// Safety design:
//   • FAIL-OPEN: any error in this hook → allow the stop (never break a turn).
//   • Skips in plan mode and when no tracked code changed (docs/planning are untouched).
//   • `[skip-tests]` in the final message is an intentional escape.
//   • Bounded re-blocks per session (max 2) so it can never infinite-loop.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_BLOCKS = 2;

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

function countsAsCode(p) {
  if (!p) return false;
  if (p.startsWith(".claude/hooks/")) return true;
  return /^(pipeline|scripts)\//.test(p) && /\.(mjs|cjs|js|py|json)$/.test(p);
}

function changedCodeFiles(cwd) {
  const r = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout
    .split("\n")
    .map((l) => l.slice(3).trim())
    .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p))
    .filter(countsAsCode);
}

function lastMessageHasSkip(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
    const txt = fs.readFileSync(transcriptPath, "utf8");
    return txt.slice(-4000).includes("[skip-tests]");
  } catch {
    return false;
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || "{}");
  } catch {
    return allow();
  }

  if (input.permission_mode === "plan") return allow(); // never gate planning
  const cwd = input.cwd || process.cwd();

  if (changedCodeFiles(cwd).length === 0) return allow(); // no code touched

  if (lastMessageHasSkip(input.transcript_path)) return allow(); // intentional escape

  // Bounded re-blocks per session.
  const stateFile = path.join(os.tmpdir(), `tad-testgate-${input.session_id || "x"}.json`);
  let blocks = 0;
  try {
    if (fs.existsSync(stateFile)) blocks = JSON.parse(fs.readFileSync(stateFile, "utf8")).blocks || 0;
  } catch {
    blocks = 0;
  }

  const test = spawnSync(process.execPath, ["--test", "pipeline/"], { cwd, encoding: "utf8" });
  const passed = test.status === 0;

  if (passed) {
    try {
      fs.rmSync(stateFile, { force: true });
    } catch {
      /* ignore */
    }
    return allow();
  }

  if (blocks >= MAX_BLOCKS) {
    // Give up blocking to avoid a loop; let the agent stop and surface to the owner.
    try {
      fs.rmSync(stateFile, { force: true });
    } catch {
      /* ignore */
    }
    return allow();
  }

  try {
    fs.writeFileSync(stateFile, JSON.stringify({ blocks: blocks + 1 }));
  } catch {
    /* ignore */
  }
  const tail = `${test.stdout || ""}\n${test.stderr || ""}`.trim().slice(-1500);
  block(
    `build-sprint test gate: \`node --test pipeline/\` is failing while code changed. ` +
      `Fix the tests before finishing (or write [skip-tests] in your message to stop intentionally).\n\n${tail}`
  );
}

try {
  main();
} catch {
  allow(); // fail-open: a broken gate must never block real work
}
