// make-sfx.mjs — the cue formulas and the write policy. The expressions go into an ffmpeg
// filtergraph, where an unescaped comma silently becomes "next filter" and the render either dies or
// produces something that isn't the cue, so the escaping is tested on its own. The integration tests
// skip (never fail) when ffmpeg is absent, so a fresh clone still goes green.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CUES, SAMPLE_RATE, escapeExpr, filterGraph, ffmpegArgs, resolveFfmpeg, generateCue } from "./make-sfx.mjs";

let FFMPEG = null;
try {
  FFMPEG = resolveFfmpeg();
} catch {
  /* skipped below */
}

test("escapeExpr strips whitespace and escapes the filtergraph separators", () => {
  assert.equal(escapeExpr("min(1, t/2)"), "min(1\\,t/2)");
  assert.equal(escapeExpr("a:b"), "a\\:b");
  assert.equal(escapeExpr("lt(t,10)\n  *2"), "lt(t\\,10)*2");
});

test("every cue is a well-formed expression with a fade that fits inside it", () => {
  for (const [name, cue] of Object.entries(CUES)) {
    assert.ok(cue.duration > 0, `${name}: duration`);
    assert.ok(cue.fadeOut > 0 && cue.fadeOut < cue.duration, `${name}: fadeOut must fit inside the file`);
    let depth = 0;
    for (const ch of cue.expr) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      assert.ok(depth >= 0, `${name}: unbalanced ")"`);
    }
    assert.equal(depth, 0, `${name}: unbalanced "("`);
    assert.match(cue.expr, /\bt\b/, `${name}: an expression that ignores t is a constant, not a cue`);
  }
});

test("filterGraph escapes the expression and fades out at the end, not past it", () => {
  const graph = filterGraph({ duration: 2, fadeOut: 0.05, expr: "min(1, t)" });
  assert.ok(graph.includes("min(1\\,t)"), "the comma must be escaped inside the graph");
  assert.ok(graph.includes(`:d=2:s=${SAMPLE_RATE}:c=mono`));
  assert.ok(graph.includes("st=1.9500:d=0.05"), `fade starts at duration-fadeOut: ${graph}`);
  assert.ok(graph.includes("alimiter"), "the limiter is the guarantee a cue never clips");
});

test("ffmpegArgs encodes mp3 to the given path and overwrites without prompting", () => {
  const args = ffmpegArgs(CUES.accent, "/tmp/accent.mp3");
  assert.ok(args.includes("-y"), "ffmpeg must not block on a prompt");
  assert.deepEqual(args.slice(-5), ["-c:a", "libmp3lame", "-b:a", "192k", "/tmp/accent.mp3"]);
});

test("generateCue rejects a name that isn't in the library", () => {
  assert.throws(() => generateCue({ name: "whoosh", outDir: os.tmpdir(), ffmpeg: "ffmpeg" }), /unknown cue/);
});

test("generateCue writes the cue, then keeps it until --force", { skip: !FFMPEG }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "make-sfx-"));
  const first = generateCue({ name: "accent", outDir: dir, ffmpeg: FFMPEG });
  assert.equal(first.written, true);
  assert.ok(first.bytes > 1024, `a real cue, not an empty file: ${first.bytes} bytes`);

  fs.writeFileSync(first.path, "an owner-supplied CC0 file");
  const second = generateCue({ name: "accent", outDir: dir, ffmpeg: FFMPEG });
  assert.equal(second.written, false, "an existing asset is never silently overwritten");
  assert.equal(fs.readFileSync(first.path, "utf8"), "an owner-supplied CC0 file");

  const forced = generateCue({ name: "accent", outDir: dir, ffmpeg: FFMPEG, force: true });
  assert.equal(forced.written, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("the accent really decays — its head is louder than its tail", { skip: !FFMPEG }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "make-sfx-"));
  const { path: mp3 } = generateCue({ name: "accent", outDir: dir, ffmpeg: FFMPEG });
  const meanDb = (ss, t) => {
    const res = spawnSync(FFMPEG, ["-hide_banner", "-ss", String(ss), "-t", String(t), "-i", mp3, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
    const m = (res.stderr || "").match(/mean_volume:\s*(-?[\d.]+) dB/);
    assert.ok(m, `volumedetect gave nothing: ${res.stderr}`);
    return Number(m[1]);
  };
  const head = meanDb(0, 0.1);
  const tail = meanDb(0.5, 0.1);
  assert.ok(head > tail + 20, `a ping must be front-loaded (head ${head} dB vs tail ${tail} dB)`);
  assert.ok(head < 0, "and it must not clip");
  fs.rmSync(dir, { recursive: true, force: true });
});
