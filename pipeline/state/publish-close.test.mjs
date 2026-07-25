// Session 4 of the lifecycle-ledger thread (D-062): the Stop-hook forcing function.
// The hook is a real process, so every test SPAWNS it with a stdin payload and a throwaway
// repo root — never the real repo, which it would reconcile and write to for real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withTempDir } from "../shared/testkit/index.mjs";
import { statePaths, stampLesson } from "./reconcile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOK = path.resolve(__dirname, "..", "..", ".claude", "hooks", "publish-close.mjs");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

let seq = 0;
const sessionId = () => `test-${process.pid}-${++seq}`;

/**
 * A throwaway repo root with ONE shipped-but-unclosed video: 020 is at/after `live_from`, so its
 * lesson is owed, and its publish.json still says draft_pending (the derived drift to self-heal).
 * No ideas.json / produced_subjects.json — the reconciler creates or fail-softs those.
 */
function makeRoot(root) {
  const p = statePaths(root);
  const dir = path.join(p.content, "020-clean-data");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "brief.json"),
    JSON.stringify({ id: "020-clean-data", format: "long", subject: "execution/data-cleaning" }, null, 2)
  );
  fs.writeFileSync(
    path.join(dir, "publish.json"),
    JSON.stringify(
      {
        id: "020-clean-data",
        title_options: ["Clean the data first"],
        description: "d",
        tags: ["t"],
        youtube_video_id: null,
        status: "draft_pending",
      },
      null,
      2
    )
  );
  return p;
}

/** Run the hook exactly as Claude Code does: JSON on stdin, decision on stdout. */
function runHook(payload, { raw } = {}) {
  const r = spawnSync(process.execPath, [HOOK], {
    input: raw !== undefined ? raw : JSON.stringify(payload),
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `the hook must always exit 0, got ${r.status}: ${r.stderr}`);
  const out = (r.stdout || "").trim();
  return { allowed: out === "", decision: out ? JSON.parse(out) : null };
}

const stopPayload = (root, patch = {}) => ({
  session_id: sessionId(),
  cwd: root,
  transcript_path: null,
  permission_mode: "acceptEdits",
  ...patch,
});

test("the hook self-heals the derived files and BLOCKS on the owed lesson", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const { allowed, decision } = runHook(stopPayload(root));

    assert.equal(allowed, false, "a shipped video owing a lesson must not be allowed to close");
    assert.equal(decision.decision, "block");
    assert.match(decision.reason, /020-clean-data/);
    assert.match(decision.reason, /--learned --note <slug>/);
    assert.match(decision.reason, /--learned --nothing/);
    assert.match(decision.reason, /CHANNEL_MAP\.md/, "a new subject entry reminds the owner of the human row");
    assert.match(decision.reason, /\[skip-close\]/, "the escape hatch is always spelled out");

    // …and everything a machine CAN compute was written without asking.
    assert.equal(readJson(p.ledger).videos["020-clean-data"].lesson.state, "pending");
    assert.equal(readJson(path.join(p.content, "020-clean-data", "publish.json")).status, "published");
    assert.deepEqual(readJson(p.subjects).subjects, { "execution/data-cleaning": ["020-clean-data"] });
  });
});

test("the hook allows the stop once the lesson is settled", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    assert.equal(runHook(stopPayload(root)).allowed, false);

    stampLesson({ root, videoId: "020-clean-data", state: "none" });
    const ledgerBefore = fs.readFileSync(p.ledger, "utf8");

    assert.equal(runHook(stopPayload(root)).allowed, true, "settled → nothing left to block on");
    assert.equal(fs.readFileSync(p.ledger, "utf8"), ledgerBefore, "a clean pass writes nothing");
  });
});

test("the hook never gates plan mode, and touches nothing there", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    assert.equal(runHook(stopPayload(root, { permission_mode: "plan" })).allowed, true);
    assert.equal(fs.existsSync(p.ledger), false, "planning does not mutate state");
  });
});

test("[skip-close] in the final message is an intentional escape — no block, no writes", async () => {
  await withTempDir(async (root) => {
    const p = makeRoot(root);
    const transcript = path.join(root, "transcript.jsonl");
    fs.writeFileSync(transcript, `{"role":"assistant","text":"holding this one — [skip-close]"}\n`);

    assert.equal(runHook(stopPayload(root, { transcript_path: transcript })).allowed, true);
    assert.equal(fs.existsSync(p.ledger), false, "an intentional stop skips the self-heal too");
  });
});

test("the hook fails open on empty and malformed stdin", () => {
  for (const raw of ["", "   ", "{ not json", "null"]) {
    assert.equal(runHook(null, { raw }).allowed, true, `raw=${JSON.stringify(raw)} must be allowed`);
  }
});

test("re-blocks are bounded per session so the gate can never loop", async () => {
  await withTempDir(async (root) => {
    makeRoot(root);
    const session_id = sessionId();
    const payload = () => stopPayload(root, { session_id });

    assert.equal(runHook(payload()).allowed, false, "block 1");
    assert.equal(runHook(payload()).allowed, false, "block 2");
    assert.equal(runHook(payload()).allowed, true, "MAX_BLOCKS reached → surface to the owner instead");
    assert.equal(runHook(payload()).allowed, false, "the counter reset, so the next turn blocks again");

    fs.rmSync(path.join(os.tmpdir(), `tad-publishclose-${session_id}.json`), { force: true });
  });
});
