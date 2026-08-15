#!/usr/bin/env node
// Generates the shared sound-design cues in `assets/sfx/` (D-063) with the vendored ffmpeg.
//
// Why synthesized and not downloaded: `*.mp3` is git-ignored repo-wide, so an acquired file lives on
// one machine and is gone on the next clone — the library would be unreproducible. A generator is
// tracked, so the recipe IS the asset. It also settles the licence question the README worries about:
// we authored these, nothing to attribute, nothing to strike.
//
// Each cue is one `aevalsrc` expression — the envelope, the pitch sweep and the noise layer are all
// arithmetic on `t`, so a cue is a formula you can read and tune, not an opaque waveform. Regenerating
// gives byte-identical output.
//
//   node scripts/make-sfx.mjs                 # write the cues that don't exist yet
//   node scripts/make-sfx.mjs --force         # regenerate everything (overwrites)
//   node scripts/make-sfx.mjs --only impact   # one cue
//   node scripts/make-sfx.mjs --out <dir>     # somewhere other than assets/sfx/
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SFX_DIR = path.join(ROOT, "assets", "sfx");
export const SAMPLE_RATE = 48000;

// A rising tone's phase is the integral of its frequency, so an exponential sweep from f0 by rate k
// (freq = f0*e^(kt)) has phase (f0/k)*(e^(kt)-1). Precomputed here so the expression stays readable.
const RISER_SECONDS = 10; // the rise itself; the tail is added on top
const RISER_F0 = 120;
const RISER_F1 = 900;
const RISER_K = Math.log(RISER_F1 / RISER_F0) / RISER_SECONDS; // ≈0.2015
const RISER_PHASE = `${(RISER_F0 / RISER_K).toFixed(4)}*(exp(${RISER_K.toFixed(6)}*t)-1)`;

/**
 * The library. `expr` is an aevalsrc expression over `t` (seconds), amplitude in −1..1.
 * `duration` is the file length; `fadeOut` kills the end-of-file click on a tail that hasn't
 * fully decayed. Amplitudes are chosen to land near −1 dBFS after the limiter.
 */
export const CUES = {
  // A slow build under the run: an exponential sweep 120→900 Hz with a detuned partial and an octave
  // for body, a rising air layer, and an accelerating pulse so the last seconds feel like they're
  // pulling. It RESOLVES — the rise peaks at 10s and decays over ~1s instead of stopping dead, so the
  // impact lands in its tail rather than fighting it.
  riser: {
    duration: 11.0,
    fadeOut: 0.08,
    expr: [
      "0.58",
      "*(1-exp(-t/0.05))", // no click on the way in
      "*(lt(t,10)*pow(t/10,2.2)+gte(t,10)*exp(-(t-10)/0.30))", // rise, then the resolve
      "*(1+0.18*sin(2*PI*(2*t+0.35*t*t)))", // pulse that accelerates with the rise
      `*(0.52*sin(2*PI*${RISER_PHASE})`,
      `+0.33*sin(2*PI*1.005*${RISER_PHASE})`, // detune: two voices beating
      `+0.20*sin(2*PI*2*${RISER_PHASE})`, // octave, for presence on small speakers
      "+0.17*(random(1)*2-1)*pow(t/11,3))", // air, only near the top
    ].join(""),
  },

  // One clean low hit for the transformation. Three layers: a sub that drops 110→45 Hz (the weight),
  // a 180 Hz thud (what a phone speaker actually reproduces — a pure sub is inaudible there), and a
  // 18 ms noise transient (the "crack" that makes it read as an impact and not a bass note).
  impact: {
    duration: 1.8,
    fadeOut: 0.05,
    expr: [
      "0.70*(1-exp(-t/0.004))*exp(-t/0.42)*sin(2*PI*(45*t+5.85*(1-exp(-t/0.09))))",
      "+0.26*exp(-t/0.13)*sin(2*PI*180*t)",
      "+0.20*exp(-t/0.018)*(random(1)*2-1)",
    ].join(""),
  },

  // A small high punctuation for `0 deleted`. Three fast-decaying partials (a fifth and an octave
  // above the fundamental) — bright enough to cut through, short enough to never compete with the
  // impact it follows.
  accent: {
    duration: 0.65,
    fadeOut: 0.04,
    expr: [
      "(1-exp(-t/0.0015))",
      "*(0.50*exp(-t/0.10)*sin(2*PI*2100*t)",
      "+0.28*exp(-t/0.065)*sin(2*PI*3150*t)",
      "+0.13*exp(-t/0.035)*sin(2*PI*4200*t))",
    ].join(""),
  },
};

/**
 * ffmpeg parses the filtergraph itself, so a comma inside `min(a,b)` would read as "next filter" and
 * a colon as "next option". Strip whitespace (the parser is happy without it and it keeps the graph
 * on one line) and escape the two separators.
 */
export function escapeExpr(expr) {
  return expr.replace(/\s+/g, "").replace(/[,:\\']/g, (c) => `\\${c}`);
}

/** The one-line filtergraph for a cue: generate → limit (safety, never clips) → fade the tail out. */
export function filterGraph(cue) {
  const src = `aevalsrc=${escapeExpr(cue.expr)}:d=${cue.duration}:s=${SAMPLE_RATE}:c=mono`;
  const fadeStart = (cue.duration - cue.fadeOut).toFixed(4);
  return `${src},alimiter=limit=0.92:level=disabled,afade=t=out:st=${fadeStart}:d=${cue.fadeOut}`;
}

export function ffmpegArgs(cue, outPath) {
  return ["-hide_banner", "-loglevel", "error", "-y", "-filter_complex", filterGraph(cue), "-c:a", "libmp3lame", "-b:a", "192k", outPath];
}

/** Vendored first (that's what make_voice.py uses), then whatever is on PATH. Throws if neither. */
export function resolveFfmpeg() {
  const vendored = path.join(ROOT, "templates", "hyperframes", ".bin", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
  if (existsSync(vendored)) return vendored;
  if (spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).status === 0) return "ffmpeg";
  throw new Error("ffmpeg not found (looked in templates/hyperframes/.bin, then PATH)");
}

/**
 * Write one cue. An existing file is left alone unless `force` — these are shared assets and the
 * owner may have replaced a generated cue with a CC0 file of the same name (principle 6).
 */
export function generateCue({ name, outDir, ffmpeg, force = false }) {
  const cue = CUES[name];
  if (!cue) throw new Error(`unknown cue "${name}" (have: ${Object.keys(CUES).join(", ")})`);
  const outPath = path.join(outDir, `${name}.mp3`);
  if (existsSync(outPath) && !force) return { name, path: outPath, written: false, reason: "exists" };

  mkdirSync(outDir, { recursive: true });
  const res = spawnSync(ffmpeg, ffmpegArgs(cue, outPath), { encoding: "utf8" });
  if (res.status !== 0) throw new Error(`ffmpeg failed on "${name}": ${res.stderr || res.stdout}`);
  return { name, path: outPath, written: true, bytes: statSync(outPath).size };
}

function main(argv) {
  const force = argv.includes("--force");
  const outAt = argv.indexOf("--out");
  const outDir = outAt === -1 ? SFX_DIR : path.resolve(argv[outAt + 1]);
  const onlyAt = argv.indexOf("--only");
  const names = onlyAt === -1 ? Object.keys(CUES) : argv[onlyAt + 1].split(",").map((s) => s.trim());

  const ffmpeg = resolveFfmpeg();
  for (const name of names) {
    const r = generateCue({ name, outDir, ffmpeg, force });
    if (r.written) console.log(`✓ ${path.relative(ROOT, r.path)} — ${CUES[name].duration}s, ${(r.bytes / 1024).toFixed(1)} KB`);
    else console.log(`· ${path.relative(ROOT, r.path)} — kept (use --force to regenerate)`);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    console.error(`make-sfx: ${err.message}`);
    process.exit(1);
  }
}
