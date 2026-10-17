// subtitles.srt for YouTube Studio (D-072, owner 2026-10-17). The video carries no captions in the
// picture any more; the same cues ship as an .srt the owner uploads at publish (Studio → Subtitles →
// Upload file → With timing), so a viewer who wants subtitles turns on CC.
//
// Source of truth = the RENDERED clock: timeline.json `captions` (already on the video's own timeline,
// intro offset included, chunked by the format's caption rules — the same cues the burned-in track
// drew). The aligned words are lowercase and unpunctuated, so the written form (casing, punctuation,
// "$0.00", "one-line") is restored from the script sentences in alignment.json, token by token.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";

// ASCII punctuation (Python's string.punctuation) + the dashes — what make_voice.py / make_alignment.py
// strip around a token before splitting it on hyphens/dashes.
const EDGE = /^[!-/:-@[-`{-~—–]+|[!-/:-@[-`{-~—–]+$/g;
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, "");

/** PURE: seconds → SRT "HH:MM:SS,mmm". */
export function srtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
}

/**
 * PURE: a sentence's spoken tokens, split exactly like make_voice.py's tokens_of (whitespace, then
 * hyphens/dashes), each with the WRITTEN text to show. A hyphenated word is spoken as several tokens:
 * the first shows the whole word, the rest show "". A punctuation-only token (a lone "—") is not
 * spoken; it rides on the token before it.
 * @returns {{spoken:string, show:string}[]}
 */
export function displayTokens(text) {
  const out = [];
  for (const raw of String(text ?? "").split(/\s+/)) {
    if (!raw) continue;
    const core = raw.replace(EDGE, "");
    const parts = core ? core.split(/[-–—]/).map((p) => p.replace(EDGE, "")).filter(Boolean) : [];
    if (!parts.length) {
      if (out.length) out[out.length - 1].show += ` ${raw}`;
      continue;
    }
    parts.forEach((p, i) => out.push({ spoken: p.toLowerCase(), show: i === 0 ? raw : "" }));
  }
  return out;
}

/** PURE: one line, or two broken at the space nearest the middle when longer than maxChars. */
export function wrapLine(text, maxChars = 42) {
  if (text.length <= maxChars) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

/**
 * PURE: the written form of every aligned word, in the order the timeline's caption cues use (words
 * sorted by start). A word's sentence is the last one in its scene that started at or before it —
 * the same rule timeline.mjs uses. A sentence whose tokens do not line up with its words falls back
 * to the spoken words (first one capitalised), so a mismatch costs polish, never sync.
 */
export function writtenWords(alignment) {
  const words = (alignment.words ?? []).filter((w) => w && w.w).slice().sort((a, b) => a.start - b.start);
  const sents = (alignment.sentences ?? []).slice().sort((a, b) => a.start - b.start);
  const bySent = sents.map(() => []);
  const loose = [];
  for (const w of words) {
    let k = -1;
    for (let j = 0; j < sents.length; j++) if (sents[j].scene === w.scene && sents[j].start <= w.start + 1e-6) k = j;
    (k < 0 ? loose : bySent[k]).push(w);
  }
  const shown = new Map();
  const spokenForm = (w) => (/^ai$/i.test(w.w) ? "AI" : w.w);
  sents.forEach((s, j) => {
    const ws = bySent[j];
    const toks = displayTokens(s.text);
    const lined = toks.length === ws.length && toks.every((t, i) => norm(t.spoken) === norm(ws[i].w));
    ws.forEach((w, i) => {
      if (lined) shown.set(w, toks[i].show);
      else {
        const f = spokenForm(w);
        shown.set(w, i === 0 ? f.charAt(0).toUpperCase() + f.slice(1) : f);
      }
    });
  });
  for (const w of loose) shown.set(w, spokenForm(w));
  return words.map((w) => ({ w: w.w, show: shown.get(w) }));
}

/**
 * PURE: timeline.json + alignment.json → the .srt text. Each caption cue is one subtitle, shown from
 * its first word until `tailSeconds` after its last (never past the next cue's start).
 * @param {object} timeline   timeline.json (captions[] in rendered seconds)
 * @param {object} alignment  alignment.json (sentences[] carry the written text)
 * @param {object} [opts]     { tailSeconds = 0.4, maxLineChars = 42 }
 */
export function buildSrt(timeline, alignment, { tailSeconds = 0.4, maxLineChars = 42 } = {}) {
  const written = writtenWords(alignment);
  const cues = timeline.captions ?? [];
  const blocks = [];
  let at = 0;
  cues.forEach((cue, i) => {
    const parts = cue.words.map((cw) => {
      const ww = written[at++];
      return ww && norm(ww.w) === norm(cw.w) ? ww.show : cw.w;
    });
    const text = parts.filter(Boolean).join(" ").trim();
    if (!text) return;
    const start = cue.start_seconds;
    const next = cues[i + 1]?.start_seconds ?? Infinity;
    let end = Math.min(cue.end_seconds + tailSeconds, next);
    if (end <= start) end = cue.end_seconds;
    blocks.push(`${blocks.length + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${wrapLine(text, maxLineChars)}\n`);
  });
  return blocks.join("\n");
}

/** Reads timeline.json + alignment.json (+ the brief's format for the tail), writes video/subtitles.srt. */
export function buildSrtFile(contentDir) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(contentDir, f), "utf8"));
  const briefPath = path.join(contentDir, "brief.json");
  const brief = fs.existsSync(briefPath) ? read("brief.json") : {};
  const fmt = resolveFormat({ archetype: brief.archetype, series: brief.series, format: brief.format, format_recipe: brief.format_recipe });
  const srt = buildSrt(read("timeline.json"), read("alignment.json"), { tailSeconds: fmt.captions.tail_seconds });
  const out = path.join(contentDir, "video", "subtitles.srt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, srt);
  return { out, cues: srt ? srt.split("\n\n").length : 0 };
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────
//   node pipeline/06-publish/build-srt.mjs <id>          → content/<id>/video/subtitles.srt
//   node pipeline/06-publish/build-srt.mjs <id>/short    → content/<id>/short/video/subtitles.srt
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const id = process.argv[2];
  if (!id) {
    console.error("usage: node pipeline/06-publish/build-srt.mjs <content_id>[/short]");
    process.exit(2);
  }
  const { out, cues } = buildSrtFile(path.join(ROOT, "content", id));
  console.log(`OK ${path.relative(ROOT, out)} (${cues} cues)`);
}
