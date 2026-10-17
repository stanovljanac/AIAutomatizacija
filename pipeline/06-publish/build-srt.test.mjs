import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { srtTime, displayTokens, wrapLine, writtenWords, buildSrt, buildSrtFile } from "./build-srt.mjs";

// A two-sentence alignment + the timeline cues build-props would make from it (words lowercase, no
// punctuation — exactly what make_alignment.py writes).
const W = (scene, w, start, end) => ({ scene, w, start, end });
const alignment = {
  sentences: [
    { scene: "s1", index: 0, text: "You can't stop an AI agent — not with a one-line prompt.", start: 0.1, end: 3.0 },
    { scene: "s2", index: 0, text: "It sent $0.00, twice.", start: 3.5, end: 5.0 },
  ],
  words: [
    W("s1", "you", 0.1, 0.2), W("s1", "can't", 0.2, 0.4), W("s1", "stop", 0.4, 0.6), W("s1", "an", 0.6, 0.7),
    W("s1", "ai", 0.7, 0.9), W("s1", "agent", 0.9, 1.3), W("s1", "not", 1.5, 1.7), W("s1", "with", 1.7, 1.8),
    W("s1", "a", 1.8, 1.9), W("s1", "one", 1.9, 2.1), W("s1", "line", 2.1, 2.4), W("s1", "prompt", 2.4, 3.0),
    W("s2", "it", 3.5, 3.6), W("s2", "sent", 3.6, 3.9), W("s2", "0.00", 3.9, 4.5), W("s2", "twice", 4.5, 5.0),
  ],
};
const cue = (ws) => ({ start_seconds: ws[0].start, end_seconds: ws.at(-1).end, words: ws.map((w) => ({ w: /^ai$/.test(w.w) ? "AI" : w.w, start_seconds: w.start, end_seconds: w.end })) });
const timeline = {
  captions: [cue(alignment.words.slice(0, 6)), cue(alignment.words.slice(6, 12)), cue(alignment.words.slice(12))],
};

test("srtTime formats HH:MM:SS,mmm and never goes negative", () => {
  assert.equal(srtTime(0), "00:00:00,000");
  assert.equal(srtTime(3.0005), "00:00:03,001");
  assert.equal(srtTime(206.1), "00:03:26,100");
  assert.equal(srtTime(3723.25), "01:02:03,250");
  assert.equal(srtTime(-1), "00:00:00,000");
});

test("displayTokens splits like make_voice.py and keeps the written word on the first part", () => {
  const t = displayTokens("Not with a one-line prompt — ever.");
  assert.deepEqual(t.map((x) => x.spoken), ["not", "with", "a", "one", "line", "prompt", "ever"]);
  assert.deepEqual(t.map((x) => x.show), ["Not", "with", "a", "one-line", "", "prompt —", "ever."]);
  assert.deepEqual(displayTokens("$0.00").map((x) => [x.spoken, x.show]), [["0.00", "$0.00"]]);
});

test("writtenWords restores casing and punctuation from the sentences", () => {
  const shown = writtenWords(alignment).map((x) => x.show).filter(Boolean).join(" ");
  assert.equal(shown, "You can't stop an AI agent — not with a one-line prompt. It sent $0.00, twice.");
});

test("a sentence that does not line up with its words falls back to the spoken words, capitalised", () => {
  const a = structuredClone(alignment);
  a.sentences[1].text = "It sent nothing at all."; // 5 tokens for 4 words
  const shown = writtenWords(a).slice(12).map((x) => x.show);
  assert.deepEqual(shown, ["It", "sent", "0.00", "twice"]);
});

test("buildSrt: one numbered cue per caption, timed to the words + tail, never past the next cue", () => {
  const srt = buildSrt(timeline, alignment, { tailSeconds: 0.4 });
  const blocks = srt.trim().split("\n\n");
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0], "1\n00:00:00,100 --> 00:00:01,500\nYou can't stop an AI agent —");
  // cue 1 ends at 1.3 + 0.4 = 1.7 but cue 2 starts at 1.5 → clamped to 1.5
  assert.equal(blocks[1], "2\n00:00:01,500 --> 00:00:03,400\nnot with a one-line prompt.");
  assert.equal(blocks[2], "3\n00:00:03,500 --> 00:00:05,400\nIt sent $0.00, twice.");
  assert.ok(srt.endsWith("twice.\n"));
});

test("buildSrt wraps a long cue onto two lines at the space nearest the middle", () => {
  assert.equal(wrapLine("short line"), "short line");
  assert.equal(wrapLine("Never send an email: save drafts only, every single time.", 42), "Never send an email: save\ndrafts only, every single time.");
  const srt = buildSrt(timeline, alignment, { maxLineChars: 20 });
  assert.match(srt, /\nYou can't stop\nan AI agent —\n/);
});

test("buildSrt with no captions is an empty file, not a crash", () => {
  assert.equal(buildSrt({ captions: [] }, { sentences: [], words: [] }), "");
});

test("buildSrtFile writes video/subtitles.srt from the content folder", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "srt-"));
  fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(timeline));
  fs.writeFileSync(path.join(dir, "alignment.json"), JSON.stringify(alignment));
  const { out, cues } = buildSrtFile(dir);
  assert.equal(out, path.join(dir, "video", "subtitles.srt"));
  assert.equal(cues, 3);
  assert.match(fs.readFileSync(out, "utf8"), /^1\n00:00:00,100 --> /);
  fs.rmSync(dir, { recursive: true, force: true });
});
