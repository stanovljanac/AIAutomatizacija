// Generates a 10s placeholder narration WAV for the Phase 1 render test.
// No ffmpeg / no deps — writes a small 16-bit PCM mono WAV by hand.
// Output: templates/remotion/public/dummy-narration.wav  (git-ignored media)
//
//   node scripts/make-dummy-audio.mjs
//
// Real narration replaces this in Phase 2 (voice-synthesis -> voice/narration.wav).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;
const SECONDS = 10;
const FREQ = 220; // soft low tone, just so the track is audible
const AMP = 0.1;
const n = SAMPLE_RATE * SECONDS;

const data = Buffer.alloc(n * 2); // 16-bit mono
for (let i = 0; i < n; i++) {
  const t = i / SAMPLE_RATE;
  // short fades in/out to avoid clicks
  const fade = Math.min(1, t / 0.05, (SECONDS - t) / 0.05);
  const sample = Math.sin(2 * Math.PI * FREQ * t) * AMP * fade;
  data.writeInt16LE(Math.max(-1, Math.min(1, sample)) * 32767, i * 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16); // PCM fmt chunk size
header.writeUInt16LE(1, 20); // audioFormat = PCM
header.writeUInt16LE(1, 22); // channels = mono
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byteRate
header.writeUInt16LE(2, 32); // blockAlign
header.writeUInt16LE(16, 34); // bitsPerSample
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const outPath = join(outDir, "dummy-narration.wav");
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, Buffer.concat([header, data]));
console.log(`Wrote ${outPath} (${SECONDS}s, ${SAMPLE_RATE}Hz mono)`);
