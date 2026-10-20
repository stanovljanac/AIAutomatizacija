// make_voice.py's pure helpers — MP3 frame accounting, silence generation and the pause map. These
// carry the alignment clock: if a segment's duration or a spliced pause is off by a frame, every
// later timestamp drifts and the render desyncs. make_voice.py is Python and the suite is node, so
// this drives the helpers through a python one-liner and asserts on the JSON it prints. Skips (does
// not fail) when python or the vendored ffmpeg is unavailable, so a fresh clone still goes green.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
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

// MEASURED 2026-08-15 (en-US-AndrewMultilingualNeural, edge-tts 7.2.8): edge-tts emits a hyphenated
// compound as ONE WordBoundary event ("seventy-five"), while tokens_of splits it into two tokens. The
// word→event walk is strictly 1:1, so every such compound used to shift every LATER timestamp by one
// word — on 021 the drift reached the takeaway scene and exposed a spliced pause 1.4s early.
test("expand_boundaries splits a hyphenated event so the 1:1 word walk stays in step", { skip: !havePython }, () => {
  const wbs = JSON.stringify([
    { w: "up", start: 1.0, end: 1.2 },
    { w: "seventy-five", start: 1.2, end: 2.0 },
    { w: "percent", start: 2.0, end: 2.4 },
  ]);
  const out = py(`print(json.dumps(mv.expand_boundaries(json.loads('''${wbs}'''))))`);
  assert.equal(out.length, 4, "3 events, one of them a compound → 4 word slots");
  assert.deepEqual(out.map((w) => w.w), ["up", "seventy", "five", "percent"]);
  assert.equal(out[1].start, 1.2, "the compound's first part keeps the event's start");
  assert.equal(out[2].end, 2.0, "its last part keeps the event's end");
  assert.equal(out[1].end, out[2].start, "the split is contiguous — no gap invented inside a word");
  assert.ok(out[1].end > 1.2 && out[1].end < 2.0, "the span is shared, not duplicated");
});

test("expand_boundaries leaves ordinary events untouched", { skip: !havePython }, () => {
  const wbs = JSON.stringify([{ w: "chunks", start: 0.5, end: 0.9 }]);
  const out = py(`print(json.dumps(mv.expand_boundaries(json.loads('''${wbs}'''))))`);
  assert.deepEqual(out, [{ w: "chunks", start: 0.5, end: 0.9 }]);
});

test("expanded events line up 1:1 with tokens_of on the same sentence", { skip: !havePython }, () => {
  // the real 021 s16 line; edge sends 8 events (twenty-one style compound merged), tokens_of wants 9
  const sentence = "Same meaning, same work — up to seventy-five percent more chunks.";
  const events = ["Same", "meaning", "same", "work", "up", "to", "seventy-five", "percent", "more", "chunks"];
  const wbs = JSON.stringify(events.map((w, i) => ({ w, start: i * 0.3, end: i * 0.3 + 0.25 })));
  const out = py(
    `print(json.dumps({'toks': len(mv.tokens_of('''${sentence}''')), ` +
      `'events': len(mv.expand_boundaries(json.loads('''${wbs}''')))}))`,
  );
  assert.equal(out.events, out.toks, "a drift of even one here desyncs every later scene");
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

// ── key takes (024 Short, 2026-10-09): the lines the viewer must remember are spoken slower ──────

test("key_take_set flattens per-scene key takes into track-wide sentence indexes", { skip: !havePython }, () => {
  const scenes = JSON.stringify([
    { id: "s1", sentences: ["a", "b"], key_takes: [0] },
    { id: "s2", sentences: ["c", "d", "e"], key_takes: [2] },
  ]);
  const out = py(`print(json.dumps(sorted(mv.key_take_set(json.loads('''${scenes}''')))))`);
  assert.deepEqual(out, [0, 4], "s2's sentence 2 is the 5th sentence of the track");
});

test("key_take_set rejects an out-of-range index instead of silently ignoring it", { skip: !havePython }, () => {
  const scenes = JSON.stringify([{ id: "s1", sentences: ["a"], key_takes: [3] }]);
  assert.throws(() => py(`mv.key_take_set(json.loads('''${scenes}'''))`), /out of range|python failed/i);
});

test("plan_segments: no pauses and no key takes is the one segment the track always was", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.plan_segments(4, {}, set(), '+3%', '-11%')))");
  assert.deepEqual(out, [[[0, 1, 2, 3], "+3%", 0.0]]);
});

test("plan_segments: a key take mid-run gets its own segment at the key rate", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.plan_segments(5, {}, {2}, '-6%', '-11%')))");
  assert.deepEqual(out, [[[0, 1], "-6%", 0.0], [[2], "-11%", 0.0], [[3, 4], "-6%", 0.0]]);
});

test("plan_segments: adjacent key takes share one segment; a pause still ends it", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.plan_segments(4, {2: 0.5}, {1, 2}, '-6%', '-11%')))");
  assert.deepEqual(out, [[[0], "-6%", 0.0], [[1, 2], "-11%", 0.5], [[3], "-6%", 0.0]]);
});

// D-078 (owner, 2026-10-20): the hook + after-hook are spoken 10–15% faster than the body.
test("faster: edge-tts rates scale the speed, so the opening's rate multiplies (-11% × 1.12 → +0%)", { skip: !havePython }, () => {
  const out = py("print(json.dumps([mv.faster('-11%', 1.12), mv.faster('-15%', 1.12), mv.faster('+3%', 1.12), mv.faster('-6%', 1.0)]))");
  assert.deepEqual(out, ["+0%", "-5%", "+15%", "-6%"]);
});

test("plan_segments: the opening is its own faster segment, key takes in it faster too, the body unchanged", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.plan_segments(5, {}, {1, 3}, '-11%', '-15%', {0, 1}, 1.12)))");
  assert.deepEqual(out, [[[0], "+0%", 0.0], [[1], "-5%", 0.0], [[2], "-11%", 0.0], [[3], "-15%", 0.0], [[4], "-11%", 0.0]]);
  const none = py("print(json.dumps(mv.plan_segments(3, {}, set(), '-11%', '-15%')))");
  assert.deepEqual(none, [[[0, 1, 2], "-11%", 0.0]], "no opening → the one segment it always was");
});

test("opening_sentences: the first sentence always, then each next one that ends by max_seconds, inside max_scenes", { skip: !havePython }, () => {
  const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ") + ".";
  const open = (scenes) => py(`print(json.dumps(mv.opening_sentences(json.loads('''${JSON.stringify(scenes)}'''), 1.12, 15, 3, 2.42)))`);
  // at 2.42 w/s × 1.12 ≈ 2.71 w/s: 20 words ≈ 7.4 s, +13 ≈ 12.2 s, +30 ≈ 23.2 s
  assert.deepEqual(open([{ id: "s1", sentences: [words(20)] }, { id: "s2", sentences: [words(13), words(30)] }, { id: "s3", sentences: [words(2)] }]), [0, 1],
    "a long after-hook scene is sped up only for its sentences inside the 15 s");
  assert.deepEqual(open([{ id: "s1", sentences: [words(80)] }, { id: "s2", sentences: [words(5)] }]), [0], "a long first sentence is still the opening");
  assert.deepEqual(open([{ id: "s1", sentences: [words(20)], pause_after: [{ after_sentence: 0, seconds: 4 }] }, { id: "s2", sentences: [words(13)] }]), [0],
    "a scripted hold counts toward the 15 s");
  assert.deepEqual(open([{ id: "s1", sentences: [words(5)] }, { id: "s2", sentences: [words(5)] }, { id: "s3", sentences: [words(5)] }, { id: "s4", sentences: [words(5)] }]), [0, 1, 2],
    "never past max_scenes, even when time is left");
});

test("read_opening: the recipe's opening by default; a brief's format_recipe.opening tempo 1 switches it off", { skip: !havePython }, () => {
  const recipe = JSON.parse(readFileSync(path.join(ROOT, "pipeline", "shared", "formats", "default.json"), "utf8")).opening;
  const dir = mkdtempSync(path.join(process.env.TEMP || os.tmpdir(), "mv-open-"));
  try {
    const unit = path.join(dir, "short");
    mkdirSync(unit);
    assert.equal(py(`from pathlib import Path\nprint(json.dumps(mv.read_opening(Path(r"${unit}"))))`).tempo, recipe.tempo, "no brief → the recipe");
    writeFileSync(path.join(dir, "brief.json"), JSON.stringify({ format_recipe: { opening: { tempo: 1 } } }));
    assert.equal(py(`from pathlib import Path\nprint(json.dumps(mv.read_opening(Path(r"${unit}"))))`), null, "a Short inherits its long's switch-off");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("plan_segments: without a key rate, key takes change nothing (back-compatible)", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.plan_segments(3, {0: 0.4}, {1}, '+3%', None)))");
  assert.deepEqual(out, [[[0], "+3%", 0.4], [[1, 2], "+3%", 0.0]]);
});

test("read_pacing: the video's own brief wins, else the parent's; the key rate is optional", { skip: !havePython }, () => {
  const out = py(
    "import tempfile,pathlib\n" +
      "d=pathlib.Path(tempfile.mkdtemp()); s=d/'short'; s.mkdir()\n" +
      "(d/'brief.json').write_text(json.dumps({'voice_rate':'+3%'}))\n" +
      "a=mv.read_pacing(s,'+0%')\n" +
      "(s/'brief.json').write_text(json.dumps({'voice_rate':'-6%','voice_rate_key':'-11%'}))\n" +
      "b=mv.read_pacing(s,'+0%')\n" +
      "(s/'brief.json').write_text(json.dumps({'title_working':'x'}))\n" +
      "c=mv.read_pacing(s,'+0%')\n" +
      "print(json.dumps([a,b,c]))",
  );
  assert.deepEqual(out[0], ["+3%", null], "no own brief → inherit the parent's pace");
  assert.deepEqual(out[1], ["-6%", "-11%"]);
  assert.deepEqual(out[2], ["+0%", null], "the first brief found wins even when it sets no pace");
});

// D-068 (owner, 2026-10-09): the default pace lives in the format recipe. A brief that sets no pace
// takes BOTH recipe rates; a brief that sets its own voice_rate keeps its old meaning (key takes at
// its own key rate, or at voice_rate) — so 024's briefs voice exactly as before.
test("read_pacing: the recipe's key rate applies only when the brief sets no pace of its own", { skip: !havePython }, () => {
  const out = py(
    "import tempfile,pathlib\n" +
      "d=pathlib.Path(tempfile.mkdtemp())\n" +
      "a=mv.read_pacing(d,'-11%','-15%')\n" +
      "(d/'brief.json').write_text(json.dumps({'title_working':'x'}))\n" +
      "b=mv.read_pacing(d,'-11%','-15%')\n" +
      "(d/'brief.json').write_text(json.dumps({'voice_rate':'+3%'}))\n" +
      "c=mv.read_pacing(d,'-11%','-15%')\n" +
      "print(json.dumps([a,b,c]))",
  );
  assert.deepEqual(out[0], ["-11%", "-15%"], "no brief → the recipe");
  assert.deepEqual(out[1], ["-11%", "-15%"], "a brief with no pace → the recipe");
  assert.deepEqual(out[2], ["+3%", null], "a brief's own pace is not mixed with the recipe's key rate");
});

test("recipe_pacing: formats/default.json voice wins over the config rate", { skip: !havePython }, () => {
  const out = py("print(json.dumps(mv.recipe_pacing('+0%')))");
  const recipe = JSON.parse(readFileSync(path.join(ROOT, "pipeline", "shared", "formats", "default.json"), "utf8")).voice;
  assert.deepEqual(out, [recipe.rate, recipe.rate_key]);
});

// MEASURED 2026-10-09: edge-tts pads a short request to ~1.87s, so a lone key take carries ~1s of
// trailing silence. trim_tail cuts a rate-change boundary back to an ordinary sentence break.
test("trim_tail drops whole trailing frames after last word + keep, never leading ones", { skip: !havePython }, () => {
  const out = py(
    "frame=bytes([0xFF,0xF3,0x64,0xC4])+bytes(140)\n" +
      "a=frame*78\n" + // 78 × 24ms = 1.872s, the measured padded length
      "t=mv.trim_tail(a, 0.857, 0.30)\n" + // 'Not one had moved.' at -11%: last word ends 0.857s in
      "print(json.dumps({'frames': len(mv.mp3_frames(t)), 'secs': round(mv.audio_seconds(t),3), 'prefix': t == a[:len(t)]}))",
  );
  assert.equal(out.frames, 49, "ceil((0.857 + 0.30) / 0.024) = 49 frames");
  assert.ok(out.secs >= 0.857 + 0.3 && out.secs < 0.857 + 0.3 + 0.024);
  assert.equal(out.prefix, true, "only the tail is cut — the kept audio is byte-identical");
});

test("trim_tail leaves a segment that already ends soon enough untouched", { skip: !havePython }, () => {
  const out = py(
    "frame=bytes([0xFF,0xF3,0x64,0xC4])+bytes(140)\n" +
      "a=frame*20\n" +
      "print(json.dumps({'same': mv.trim_tail(a, 0.4, 0.3) == a}))",
  );
  assert.equal(out.same, true, "0.48s of audio, want 0.70s → nothing to trim");
});
