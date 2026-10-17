// ENCODE — the master video's quality lives in one place (owner, 2026-10-16: ONE file, best quality).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MASTER_CRF, MASTER_PRESET, parseX264Crf, readX264Crf } from "./encode.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SEI = "x264 - core 164 r3192 c24e06c - H.264/MPEG-4 AVC codec - Copyleft 2003-2024 - http://www.videolan.org/x264.html - options: cabac=1 ref=3 deblock=1:0:0 rc=crf mbtree=1 crf=16.0 qcomp=0.60";

test("MASTER_CRF is a high-quality x264 CRF (below the 18 'visually lossless' default)", () => {
  assert.ok(Number.isInteger(MASTER_CRF) && MASTER_CRF > 0 && MASTER_CRF < 18);
  assert.equal(MASTER_PRESET, "medium", "Remotion passes no -preset, so ffmpeg's medium is what the composite uses");
});

test("remotion.config.ts renders lossless PNG frames at MASTER_CRF (a TS config cannot import the constant)", () => {
  const cfg = fs.readFileSync(path.join(ROOT, "templates", "remotion", "remotion.config.ts"), "utf8");
  assert.match(cfg, /setVideoImageFormat\("png"\)/, "JPEG frames are a lossy step before x264 even starts");
  const m = /setCrf\((\d+)\)/.exec(cfg);
  assert.ok(m, "the composite must pin its CRF, not fall back to Remotion's 18");
  assert.equal(Number(m[1]), MASTER_CRF, "remotion.config.ts and encode.mjs must agree");
});

test("parseX264Crf reads the CRF from x264's option string", () => {
  assert.equal(parseX264Crf(`\u0000\u0005junk${SEI}\u0000more`), 16);
  assert.equal(parseX264Crf(SEI.replace("crf=16.0", "crf=12.0")), 12);
  assert.equal(parseX264Crf(SEI.replace("crf=16.0", "crf=18.5")), 18.5);
});

test("parseX264Crf: no x264 header, or no CRF (ABR / CQP), is null — never a guess", () => {
  assert.equal(parseX264Crf(""), null);
  assert.equal(parseX264Crf(undefined), null);
  assert.equal(parseX264Crf("crf=16.0 but no encoder header"), null);
  assert.equal(parseX264Crf(SEI.replace("rc=crf mbtree=1 crf=16.0", "rc=abr bitrate=8000")), null);
});

test("readX264Crf finds the SEI inside a file's head and respects the byte bound", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "encode-"));
  try {
    const f = path.join(dir, "v.mp4");
    fs.writeFileSync(f, Buffer.concat([Buffer.alloc(4096, 1), Buffer.from(SEI, "latin1"), Buffer.alloc(1024, 2)]));
    assert.equal(readX264Crf(f), 16);
    assert.equal(readX264Crf(f, 1024), null, "the SEI past the bound is not read");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
