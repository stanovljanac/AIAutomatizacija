// make_voice.py's pure helpers — MP3 frame accounting, silence generation and the pause map. These
// carry the alignment clock: if a segment's duration or a spliced pause is off by a frame, every
// later timestamp drifts and the render desyncs. make_voice.py is Python and the suite is node, so
// this drives the helpers through a python one-liner and asserts on the JSON it prints. Skips (does
// not fail) when python or the vendored ffmpeg is unavailable, so a fresh clone still goes green.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FFMPEG = path.join(ROOT, "templates", "hyperframes", ".bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");

/** Run a snippet with make_voice.py's helpers in scope; returns whatever it prints as JSON. */
function py(snippet) {
  const code = [
    "import json,sys,importlib.util",
    `spec=importlib.util.spec_from_file_location("mv", r"${path.join(ROOT, "scripts", "make_voice.py")}")`,
    "mv=importlib.util.module_from_spec(spec); spec.loader.exec_module(mv)",
    snippet,
  ].join("\n");
  const res = spawnSync("python", ["-c", code], { encoding: "utf8" });
  if (res.status !== 0) throw new Error(`python failed: ${res.stderr || res.stdout}`);
  return JSON.parse(res.stdout.trim());
}

const havePython = spawnSync("python", ["-c", "import edge_tts"], { encoding: "utf8" }).status === 0;

test("MP3 frame math matches the 24kHz mono 48kbps shape edge-tts returns", { skip: !havePython }, () => {
  const out = py("print(json.dumps({'bytes': mv.MP3_FRAME_BYTES, 'secs': mv.MP3_FRAME_SECONDS}))");
  assert.equal(out.bytes, 144);
  assert.ok(Math.abs(out.secs - 0.024) < 1e-9, "a frame is 576 samples at 24kHz = 24ms");
});

test("mp3_frames skips ID3/junk and counts only real frames", { skip: !havePython }, () => {
  // one synthetic 144-byte frame header (0xFF 0xF3 0x64 0xC4 = MPEG2 L3, 48kbps, 24kHz, mono)
  const out = py(
    "frame=bytes([0xFF,0xF3,0x64,0xC4])+bytes(140)\n" +
      "junk=b'ID3\\x04\\x00\\x00\\x00\\x00\\x00\\x00'\n" +
      "print(json.dumps({'clean': len(mv.mp3_frames(frame*3)), 'tagged': len(mv.mp3_frames(junk+frame*3)), " +
      "'secs': mv.audio_seconds(frame*3)}))",
  );
  assert.equal(out.clean, 3);
  assert.equal(out.tagged, 3, "a leading ID3 tag must not be counted as audio");
  assert.ok(Math.abs(out.secs - 0.072) < 1e-9);
});

test("pause_map flattens per-scene sentence indexes into track-wide ones", { skip: !havePython }, () => {
  const scenes = JSON.stringify([
    { id: "s1", sentences: ["a", "b"] },
    { id: "s2", sentences: ["c", "d", "e"], pause_after: [{ after_sentence: 0, seconds: 3.2 }] },
  ]);
  const out = py(`print(json.dumps({str(k): v for k, v in mv.pause_map(json.loads('''${scenes}''')).items()}))`);
  assert.deepEqual(out, { 2: 3.2 }, "s2's sentence 0 is the 3rd sentence of the track");
});

test("pause_map rejects an out-of-range sentence index instead of silently ignoring it", { skip: !havePython }, () => {
  const scenes = JSON.stringify([{ id: "s1", sentences: ["a"], pause_after: [{ after_sentence: 4, seconds: 1 }] }]);
  assert.throws(() => py(`mv.pause_map(json.loads('''${scenes}'''))`), /out of range|python failed/i);
});

test("pause_map ignores non-positive pauses and sums repeats on one sentence", { skip: !havePython }, () => {
  const scenes = JSON.stringify([
    { id: "s1", sentences: ["a", "b"], pause_after: [{ after_sentence: 0, seconds: 0 }, { after_sentence: 1, seconds: 1 }, { after_sentence: 1, seconds: 0.5 }] },
  ]);
  const out = py(`print(json.dumps({str(k): v for k, v in mv.pause_map(json.loads('''${scenes}''')).items()}))`);
  assert.deepEqual(out, { 1: 1.5 });
});

test("make_silence returns exactly the frames the requested hold needs", { skip: !havePython || !existsSync(FFMPEG) }, () => {
  const out = py(
    "s=mv.make_silence(3.2)\n" +
      "print(json.dumps({'frames': len(mv.mp3_frames(s)), 'secs': round(mv.audio_seconds(s),3), 'bytes': len(s)}))",
  );
  // 3.2s / 0.024s = 133.33 → 134 frames, i.e. 3.216s: rounded UP so a hold is never short.
  assert.equal(out.frames, 134);
  assert.ok(out.secs >= 3.2 && out.secs < 3.2 + 0.024, `got ${out.secs}s for a 3.2s hold`);
  assert.equal(out.bytes, 134 * 144, "CBR: every frame is 144 bytes");
});

test("make_silence rounds a sub-frame request up to one whole frame", { skip: !havePython || !existsSync(FFMPEG) }, () => {
  const out = py("print(json.dumps({'frames': len(mv.mp3_frames(mv.make_silence(0.001)))}))");
  assert.equal(out.frames, 1);
});
