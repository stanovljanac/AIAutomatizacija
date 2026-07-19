#!/usr/bin/env node
// Stop-hook KOS gate (D-061 — forcing function for knowledge-base hygiene).
//
// Fires when the agent tries to finish a turn. If any note under the KOS instance
// (knowledge/desk-knowledge/) changed, it runs `knowledge-lint --fix` — self-healing
// the auto-generated Backlinks footers + category AUTO-INDEX blocks — and, if structural
// ERRORS remain, BLOCKS finishing and feeds them back so they get fixed. This is the
// mechanical guarantee that the KB never drifts into broken links / orphans / bad
// frontmatter while nobody is watching (the write-BACK of new knowledge is a policy
// forcing function in WORKFLOW.md Step 7 — this hook only guards structural health).
//
// Safety design (mirrors test-gate.mjs):
//   • FAIL-OPEN: any error in this hook → allow the stop (never break a turn).
//   • Skips in plan mode and when no KOS note changed.
//   • `[skip-kos]` in the final message is an intentional escape.
//   • Bounded re-blocks per session (max 2) so it can never infinite-loop.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_BLOCKS = 2;
const INSTANCE_PREFIX = "knowledge/desk-knowledge/";

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

function countsAsKnowledge(p) {
  if (!p) return false;
  return p.startsWith(INSTANCE_PREFIX) && p.toLowerCase().endsWith(".md");
}

function changedKnowledgeFiles(cwd) {
  const r = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout
    .split("\n")
    .map((l) => l.slice(3).trim())
    .map((p) => (p.includes(" -> ") ? p.split(" -> ")[1] : p))
    .filter(countsAsKnowledge);
}

function lastMessageHasSkip(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
    const txt = fs.readFileSync(transcriptPath, "utf8");
    return txt.slice(-4000).includes("[skip-kos]");
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

  if (changedKnowledgeFiles(cwd).length === 0) return allow(); // no KOS note touched

  if (lastMessageHasSkip(input.transcript_path)) return allow(); // intentional escape

  // Bounded re-blocks per session.
  const stateFile = path.join(os.tmpdir(), `tad-koslint-${input.session_id || "x"}.json`);
  let blocks = 0;
  try {
    if (fs.existsSync(stateFile)) blocks = JSON.parse(fs.readFileSync(stateFile, "utf8")).blocks || 0;
  } catch {
    blocks = 0;
  }

  // --fix self-heals footers/indexes AND reports residual structural errors (exit 1).
  const lint = spawnSync(process.execPath, ["scripts/knowledge-lint.mjs", "--fix"], {
    cwd,
    encoding: "utf8",
  });
  const clean = lint.status === 0;

  if (clean) {
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
  const tail = `${lint.stdout || ""}\n${lint.stderr || ""}`.trim().slice(-1500);
  block(
    `KOS gate: \`knowledge-lint --fix\` reports structural errors while a knowledge note changed. ` +
      `Fix them before finishing (or write [skip-kos] in your message to stop intentionally).\n\n${tail}`
  );
}

try {
  main();
} catch {
  allow(); // fail-open: a broken gate must never block real work
}
