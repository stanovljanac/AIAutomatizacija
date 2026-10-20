#!/usr/bin/env node
/**
 * make-shorts.mjs — 2-3 Shorts cut from the long video's own scenes (growth option 1B, D-074).
 *
 * WHY. 95% of the channel's views come from Shorts, and every Short so far cost a second production:
 * 022-025 each got 5-7 bespoke portrait scenes (cws-*, ats-*, fzs-*, mvs-*) that told the long's story
 * again. The long's scenes already exist, already sync to their sentences through the beats/marks
 * contract, and most of them are the strongest visuals we have. So a Short is a CUT of the long: a run
 * of its scenes with their narration, voiced again as the Short's own continuous track (the audio is
 * never spliced from the long — PRD R11), rendered in portrait.
 *
 * THE CUTS are authored by the script writer in the long's script.json (`short_cuts`), because picking
 * the 50 seconds that stand alone is an editorial call:
 *   "short_cuts": [{ "title": "My AI Agent Sent 73 Emails Nobody Approved",
 *                    "scenes": ["s3", "s4", "s7"],
 *                    "hook": { "narration": "…", "hf_scene": "mvs-hook" } }]   ← hook optional
 * Without a `hook`, the first listed scene opens the Short (so it must work as a cold open).
 *
 * WHAT IT WRITES, per cut, into the next free unit (`short`, `short-2`, `short-3` — units.mjs):
 *   script.json        the hook (if any) + the listed scenes, narration verbatim, renumbered s1..sN
 *   scene-plan.json    the long's plan entries for those scenes (same HF scene, same props), the first
 *                      one tagged hook-card so the opening gate holds (the 025 s1 convention)
 *   short_source.json  which long scene each Short scene came from + the long's SFX inside them —
 *                      what `--marks` needs, and the marker that this unit is DERIVED: a unit without
 *                      it is hand-built (025's short/) and is never overwritten.
 * Then, after the unit is voiced and aligned (make_voice.py / make_alignment.py <id>/short-2):
 *   --marks            re-times every word mark (props.marks) and every carried SFX cue from the
 *                      long's clock to the Short's, by a piecewise-linear warp on the scene's own words
 *                      (same text → word i maps to word i; the 024 re-voice method).
 *
 * PORTRAIT. A Short renders at 1080×1920, so every reused scene needs a portrait framing (its camera
 * and HUD under `.portrait` / `S.portrait`, or native portrait). The report names the scenes that have
 * none; compile-hyperframes refuses to render them into a Short. A branch only makes a scene renderable
 * tall: it was written blind with the long, so each reused landscape scene also needs `portrait_ok`
 * once its tall frame was looked at (overlap, contrast, fill) — 05-qa/check.mjs refuses the Short
 * without it. The 023 cuts showed why (owner, 2026-10-18: overlapping, unclear, low contrast).
 *
 *   node pipeline/01-script/make-shorts.mjs <id>             # derive the units, print the readiness report
 *   node pipeline/01-script/make-shorts.mjs <id> --dry-run   # report only
 *   node pipeline/01-script/make-shorts.mjs <id> --marks     # after alignment: re-time marks + SFX
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { shortUnitName } from "../shared/lib/units.mjs";
import { validate, formatErrors } from "../shared/lib/validate-lib.mjs";
import { deriveRenderTimings } from "../04-render/lib/timings.mjs";
import { portraitReady, portraitSignoffProblems, sceneSources, PORTRAIT_CHECK } from "../04-render/lib/portrait.mjs";
import { estimateSeconds } from "./make-short.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SOURCE_FILE = "short_source.json";

const clone = (o) => JSON.parse(JSON.stringify(o));
const r3 = (v) => Math.round(v * 1000) / 1000;

/** The HF scene name a plan entry renders, or null for a Remotion template. */
const hfSceneOf = (entry) => (entry?.engine === "hyperframes" ? entry?.props?.hf_scene ?? null : null);

const countWords = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;

/**
 * PURE: check the cuts against the long script + plan and the Short length rule.
 * The length is what the Short will SAY: an `opening` replaces the first scene's first sentence, so its
 * words count instead of that sentence's. `secondsPerWord` is the long's measured pace (alignment
 * duration / words) when there is one — the house voice is slower than `wpm` since D-068, and a cut
 * measured at 160 wpm came out ~9% short of what the voice actually takes (026).
 * @returns {{ problems: string[], cuts: Array<{seconds, scenes}> }}  problems empty = derivable
 */
export function checkCuts(longScript, longPlan, cuts, { min = 45, max = 120, wpm = 160, secondsPerWord = null } = {}) {
  const problems = [];
  const byId = new Map((longScript.scenes ?? []).map((s) => [s.id, s]));
  const planIds = new Set((longPlan?.scenes ?? []).map((p) => p.scene_id));
  const used = new Map();
  const out = [];
  if (!Array.isArray(cuts) || !cuts.length) return { problems: ["the long script has no short_cuts"], cuts: [] };
  if (cuts.length > 9) problems.push(`${cuts.length} cuts — at most 9 Short units per topic`);
  cuts.forEach((cut, i) => {
    const label = `cut ${i + 1}`;
    const ids = cut?.scenes ?? [];
    if (!ids.length) problems.push(`${label}: lists no scenes`);
    const scenes = [];
    for (const id of ids) {
      const s = byId.get(id);
      if (!s) { problems.push(`${label}: scene "${id}" is not in the long script`); continue; }
      if (!planIds.has(id)) problems.push(`${label}: scene "${id}" has no scene-plan entry`);
      if (used.has(id)) problems.push(`${label}: scene "${id}" is already in ${used.get(id)} — each scene goes in one Short`);
      used.set(id, label);
      scenes.push(s);
    }
    const all = cut?.hook?.narration ? [{ narration: cut.hook.narration }, ...scenes] : scenes;
    const opened = cut?.opening && scenes.length ? countWords(cut.opening) - countWords(scenes[0].sentences?.[0]) : 0;
    const seconds = secondsPerWord
      ? (all.reduce((n, s) => n + countWords(s.narration), 0) + opened) * secondsPerWord
      : estimateSeconds(all, wpm) + (opened * 60) / wpm;
    if (seconds < min || seconds > max) problems.push(`${label}: ~${Math.round(seconds)}s of narration — a Short runs ${min}-${max}s`);
    if (!cut?.title) problems.push(`${label}: no title`);
    out.push({ seconds, scenes: ids });
  });
  return { problems, cuts: out };
}

/**
 * PURE: one Short unit from one cut — its script, its scene plan and its source map.
 * `id` is the unit's content id ("025-x/short-2"). The long plan's SFX that fall inside the reused
 * scenes travel along in the source map (re-timed by `rebaseMarks` once the Short is aligned).
 */
export function makeShortUnit({ longScript, longPlan, longAlignment = null, cut, id, targetSeconds = 55 }) {
  const byId = new Map(longScript.scenes.map((s) => [s.id, s]));
  const planById = new Map(longPlan.scenes.map((p) => [p.scene_id, p]));
  const scenes = [];
  const plan = [];
  const map = [];

  if (cut.hook?.narration) {
    const sid = "s1";
    scenes.push({
      id: sid, role: "hook", template: "custom",
      narration: cut.hook.narration,
      sentences: cut.hook.sentences?.length ? cut.hook.sentences : [cut.hook.narration],
      on_screen_text: cut.hook.on_screen_text ?? null,
    });
    plan.push({
      scene_id: sid, engine: "hyperframes", template: "hook-card", revealOn: "sentences", transitionOut: "cut",
      props: { hf_scene: cut.hook.hf_scene ?? null, title: cut.hook.on_screen_text ?? cut.hook.narration },
    });
    map.push({ scene_id: sid, source: null });
  }
  for (const longId of cut.scenes) {
    const sid = `s${scenes.length + 1}`;
    const { id: _drop, ...rest } = byId.get(longId);
    scenes.push({ id: sid, ...clone(rest), source_scene: longId });
    const entry = { ...clone(planById.get(longId)), scene_id: sid };
    plan.push(entry);
    map.push({ scene_id: sid, source: longId });
  }
  // `opening` replaces the FIRST sentence of the first reused scene — the long's "So…" / "Then…" /
  // "in this video" becomes a line that stands alone. One sentence for one: the scene keeps its sentence
  // count, so its beats (K.b(i)) still land on the same sentences.
  if (cut.opening) {
    const k = cut.hook?.narration ? 1 : 0;
    const first = scenes[k];
    const was = first.sentences[0];
    const sentences = [cut.opening, ...first.sentences.slice(1)];
    const narration = first.narration.startsWith(was) ? cut.opening + first.narration.slice(was.length) : sentences.join(" ");
    scenes[k] = { ...first, sentences, narration };
    map[k] = { ...map[k], opening: true };
  }
  // A "carry"/"match" out of a long scene was composed for the long's NEXT scene. In a cut it holds only
  // when the Short plays that same next scene; anywhere else (and on the last scene) it is a hard cut.
  const longOrder = longScript.scenes.map((s) => s.id);
  for (let k = 0; k < plan.length; k++) {
    const t = plan[k].transitionOut;
    if (t !== "carry" && t !== "match") continue;
    const here = map[k].source;
    const next = map[k + 1]?.source;
    const adjacent = here && next && longOrder.indexOf(next) === longOrder.indexOf(here) + 1;
    if (!adjacent) plan[k] = { ...plan[k], transitionOut: "cut" };
  }
  // The opening gate wants a hook-class scene in the first ~3 s: with no authored hook, the first reused
  // scene is the opener — tagged hook-card, rendered by its HF scene all the same (025 s1).
  if (!cut.hook?.narration) {
    scenes[0] = { ...scenes[0], role: "hook" };
    plan[0] = { ...plan[0], template: "hook-card" };
  }

  // SFX of the long that sit inside a reused scene — kept as (source scene, seconds into it).
  const sfx = [];
  const starts = longAlignment ? sceneStarts(longAlignment) : null;
  for (const cue of longPlan.audio?.sfx ?? []) {
    if (!starts) break;
    const owner = sceneAt(longAlignment, starts, cue.atSeconds);
    if (owner && cut.scenes.includes(owner)) {
      const { atSeconds, ...restCue } = cue;
      sfx.push({ ...restCue, source: owner, offset: r3(atSeconds - starts.get(owner)) });
    }
  }

  const script = {
    id,
    language: longScript.language,
    archetype: longScript.archetype,
    angle: longScript.angle,
    title_working: cut.title,
    target_seconds: targetSeconds,
    ...(cut.closing_question ? { closing_question: cut.closing_question } : longScript.closing_question ? { closing_question: longScript.closing_question } : {}),
    scenes,
  };
  const scenePlan = { id, ...(longPlan.audio?.bed ? { audio: { bed: clone(longPlan.audio.bed) } } : {}), scenes: plan };
  const source = { derived_from: longScript.id, title: cut.title, scenes: map, sfx };
  return { script, plan: scenePlan, source };
}

/** First sentence start of every scene; the video's first scene starts at 0 (no intro — D-068). */
export function sceneStarts(alignment) {
  const starts = new Map();
  for (const s of alignment.sentences ?? []) if (!starts.has(s.scene)) starts.set(s.scene, s.start);
  const first = alignment.sentences?.[0]?.scene;
  if (first) starts.set(first, 0);
  return starts;
}

/** The scene a narration-clock second belongs to (the last scene that started at or before it). */
function sceneAt(alignment, starts, t) {
  let owner = null;
  for (const [scene, start] of starts) if (start <= t + 1e-9) owner = scene;
  return owner;
}

/**
 * PURE: a piecewise-linear warp through (from, to) time pairs on the narration clock, monotone pairs
 * only. Extrapolates before the first and past the last pair at slope 1.
 */
export function warpFromPairs(pairs) {
  const X = [];
  const Y = [];
  for (const [x, y] of pairs) {
    if (!X.length || (x > X.at(-1) && y >= Y.at(-1))) { X.push(x); Y.push(y); }
  }
  return (t) => {
    if (!X.length) return t;
    if (t <= X[0]) return Y[0] + (t - X[0]);
    const j = X.findIndex((x) => x >= t);
    if (j < 0) return Y.at(-1) + (t - X.at(-1));
    return Y[j - 1] + ((Y[j] - Y[j - 1]) * (t - X[j - 1])) / (X[j] - X[j - 1]);
  };
}

/**
 * PURE: the warp from one voicing of a scene's words to another (word i → word i — the 024 re-voice
 * method). Throws when the word counts differ: then the text is not the same and no mark can be
 * carried honestly.
 */
export function wordWarp(fromWords, toWords) {
  if (fromWords.length !== toWords.length) {
    throw new Error(`the Short says ${toWords.length} words where the long says ${fromWords.length} — the narration was changed`);
  }
  return warpFromPairs(fromWords.map((w, i) => [w.start, toWords[i].start]));
}

/**
 * PURE: the warp for one reused scene. Word for word — except a scene whose first sentence the cut
 * replaced (`opening`): that sentence maps start-to-start and end-to-end (its words differ, so a mark
 * inside it lands proportionally), and the sentences after it map word for word again.
 */
export function sceneWarp(longAlignment, shortAlignment, longId, sid, { opening = false } = {}) {
  const words = (al, scene) => (al.words ?? []).filter((w) => w.scene === scene);
  if (!opening) return wordWarp(words(longAlignment, longId), words(shortAlignment, sid));
  const ls = (longAlignment.sentences ?? []).filter((s) => s.scene === longId);
  const ss = (shortAlignment.sentences ?? []).filter((s) => s.scene === sid);
  if (!ls.length || ls.length !== ss.length) throw new Error(`${ss.length} sentences where the long has ${ls.length}`);
  const pairs = [[ls[0].start, ss[0].start], [ls[0].end, ss[0].end]];
  if (ls.length > 1) {
    const after = (al, scene, t) => words(al, scene).filter((w) => w.start >= t - 1e-6);
    const lw = after(longAlignment, longId, ls[1].start);
    const sw = after(shortAlignment, sid, ss[1].start);
    if (lw.length !== sw.length) throw new Error(`the Short says ${sw.length} words after its opening where the long says ${lw.length}`);
    lw.forEach((w, i) => pairs.push([w.start, sw[i].start]));
  }
  return warpFromPairs(pairs);
}

/**
 * PURE: carry the long's word marks and SFX onto the Short's clock. Marks live on the SCENE clock
 * (seconds after the scene starts, minus the reveal lead — the plan.mjs convention), so each goes
 * long scene clock → narration clock → warp → Short narration clock → Short scene clock.
 * @returns {{ plan: object, moved: number, worst: number, warnings: string[] }}
 */
export function rebaseMarks({ plan, source, longAlignment, shortAlignment, leadLong, leadShort }) {
  const next = clone(plan);
  const warnings = [];
  const longStarts = sceneStarts(longAlignment);
  const shortStarts = sceneStarts(shortAlignment);
  const warps = new Map();
  let moved = 0;
  let worst = 0;

  for (const { scene_id: sid, source: longId, opening } of source.scenes) {
    if (!longId) continue;
    let warp;
    try {
      warp = sceneWarp(longAlignment, shortAlignment, longId, sid, { opening });
    } catch (e) {
      warnings.push(`${sid} (long ${longId}): ${e.message} — its marks stay on the long's clock`);
      continue;
    }
    warps.set(longId, { warp, sid });
    const entry = next.scenes.find((p) => p.scene_id === sid);
    const marks = entry?.props?.marks;
    if (marks && typeof marks === "object") {
      for (const [k, t] of Object.entries(marks)) {
        if (typeof t !== "number") continue;
        const abs = longStarts.get(longId) + t + leadLong;
        const v = r3(warp(abs) - shortStarts.get(sid) - leadShort);
        worst = Math.max(worst, Math.abs(v - t));
        marks[k] = v;
        moved++;
      }
    }
    if (entry?.props?.offsets) warnings.push(`${sid}: props.offsets (024-style typed offsets) are not re-timed — check the scene`);
  }

  const cues = [];
  for (const cue of source.sfx ?? []) {
    const w = warps.get(cue.source);
    if (!w) continue;
    const { source: _s, offset, ...rest } = cue;
    cues.push({ ...rest, atSeconds: r3(w.warp(longStarts.get(cue.source) + offset)) });
  }
  if (cues.length) next.audio = { ...(next.audio ?? {}), sfx: cues.sort((a, b) => a.atSeconds - b.atSeconds) };
  return { plan: next, moved, worst, warnings };
}

// ── fs edge ──────────────────────────────────────────────────────────────────

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readSoft = (p) => (fs.existsSync(p) ? readJson(p) : null);

/** PURE: a freshly derived plan with the marks + SFX (and portrait sign-offs) of the previous plan. */
export function keepTimings(plan, prev) {
  if (!prev) return plan;
  const next = clone(plan);
  for (const entry of next.scenes) {
    const old = prev.scenes?.find((p) => p.scene_id === entry.scene_id);
    if (old?.props?.marks && entry.props) entry.props.marks = clone(old.props.marks);
    // a portrait sign-off given on the unit (05-qa/check.mjs) survives a re-derive of the same cut
    if (old?.props?.portrait_ok === true && entry.props) entry.props.portrait_ok = true;
  }
  if (prev.audio?.sfx) next.audio = { ...(next.audio ?? {}), sfx: clone(prev.audio.sfx) };
  return next;
}

/** Write JSON only when it differs — re-deriving an unchanged cut must not make its voice look stale. */
function writeIfChanged(file, doc) {
  const text = JSON.stringify(doc, null, 2) + "\n";
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) return false;
  fs.writeFileSync(file, text);
  return true;
}

/**
 * The unit each cut goes to: units in order, skipping a unit that exists and was hand-built (a
 * script.json but no short_source.json) — a derived unit is re-derived in place. The `_TEMPLATE`
 * skeleton every topic starts with (`short/` holding only log.md + empty voice/ and video/) is no unit
 * yet, so the first cut lands in `short/` (026 would otherwise have started at short-2).
 */
export function assignUnits(topicDir, count) {
  const units = [];
  for (let n = 1; n <= 9 && units.length < count; n++) {
    const name = shortUnitName(n);
    const dir = path.join(topicDir, name);
    const handBuilt = fs.existsSync(path.join(dir, "script.json")) && !fs.existsSync(path.join(dir, SOURCE_FILE));
    if (!handBuilt) units.push(name);
  }
  if (units.length < count) throw new Error(`only ${units.length} free Short unit(s) for ${count} cut(s)`);
  return units;
}

function fmtFor(topicDir) {
  const brief = readSoft(path.join(topicDir, "brief.json")) ?? {};
  const script = readJson(path.join(topicDir, "script.json"));
  return resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: "short", format_recipe: brief.format_recipe });
}

/** Derive every cut's unit on disk (or only report, with dryRun). */
export function deriveShorts({ root = ROOT, id, dryRun = false, fps = 30, script = null } = {}) {
  const topicDir = path.join(root, "content", id);
  // `script` lets a dry run try cuts that are not written into the long's script.json yet.
  const longScript = script ?? readJson(path.join(topicDir, "script.json"));
  const longPlan = readJson(path.join(topicDir, "scene-plan.json"));
  const longAlignment = readSoft(path.join(topicDir, "alignment.json"));
  const cuts = longScript.short_cuts ?? [];
  const timings = deriveRenderTimings(fmtFor(topicDir), { fps, vertical: true });
  const spw = longAlignment?.words?.length && longAlignment.duration > 0 ? longAlignment.duration / longAlignment.words.length : null;
  const { problems, cuts: sized } = checkCuts(longScript, longPlan, cuts, { min: timings.shortLen.min, max: timings.shortLen.max, secondsPerWord: spw });
  if (problems.length) return { ok: false, problems, units: [] };

  const names = assignUnits(topicDir, cuts.length);
  const units = cuts.map((cut, i) => {
    const unitId = `${id}/${names[i]}`;
    const built = makeShortUnit({ longScript, longPlan, longAlignment, cut, id: unitId, targetSeconds: timings.shortLen.target });
    const notPortrait = [];
    const missing = [];
    for (const entry of built.plan.scenes) {
      const name = hfSceneOf(entry);
      if (!name) { if (entry.engine === "hyperframes") missing.push(`${entry.scene_id}: no hf_scene (author the hook scene)`); continue; }
      const src = sceneSources(root, name);
      if (!src) missing.push(`${entry.scene_id}: scene "${name}" does not exist`);
      else if (!portraitReady(src)) notPortrait.push(`${entry.scene_id} ${name}`);
    }
    for (const doc of [["script", built.script], ["scene-plan", built.plan]]) {
      const { valid, errors } = validate(doc[1], doc[0]);
      if (!valid) throw new Error(`${unitId} ${doc[0]} would be invalid: ${formatErrors(errors)}`);
    }
    if (!dryRun) {
      const dir = path.join(topicDir, names[i]);
      fs.mkdirSync(dir, { recursive: true });
      writeIfChanged(path.join(dir, "script.json"), built.script);
      // while the cut is unchanged, marks + SFX already re-timed by --marks are kept (the rest is re-derived)
      const planPath = path.join(dir, "scene-plan.json");
      const prevSource = readSoft(path.join(dir, SOURCE_FILE));
      const sameCut = prevSource && JSON.stringify(prevSource) === JSON.stringify(built.source);
      writeIfChanged(planPath, sameCut ? keepTimings(built.plan, readSoft(planPath)) : built.plan);
      writeIfChanged(path.join(dir, SOURCE_FILE), built.source);
    }
    const unsigned = portraitSignoffProblems(built.plan.scenes, (name) => sceneSources(root, name));
    return { unit: unitId, title: cut.title, seconds: Math.round(sized[i].seconds), scenes: built.plan.scenes.length, sfx: built.source.sfx.length, notPortrait, missing, unsigned, ready: !notPortrait.length && !missing.length };
  });
  return { ok: true, problems: [], units };
}

/** Re-time every derived unit's marks + SFX from its own alignment (`--marks`). */
export function remarkShorts({ root = ROOT, id, fps = 30 } = {}) {
  const topicDir = path.join(root, "content", id);
  const longAlignment = readJson(path.join(topicDir, "alignment.json"));
  const brief = readSoft(path.join(topicDir, "brief.json")) ?? {};
  const longScript = readJson(path.join(topicDir, "script.json"));
  const fmtLong = resolveFormat({ archetype: brief.archetype ?? longScript.archetype, series: brief.series, format: "long", format_recipe: brief.format_recipe });
  const leadLong = deriveRenderTimings(fmtLong, { fps, vertical: false }).leadFrames / fps;
  const leadShort = deriveRenderTimings(fmtFor(topicDir), { fps, vertical: true }).leadFrames / fps;
  const results = [];
  for (const name of fs.readdirSync(topicDir)) {
    const dir = path.join(topicDir, name);
    const source = readSoft(path.join(dir, SOURCE_FILE));
    if (!source) continue;
    const shortAlignment = readSoft(path.join(dir, "alignment.json"));
    if (!shortAlignment) { results.push({ unit: `${id}/${name}`, skipped: "no alignment.json yet — voice + align the unit first" }); continue; }
    const planPath = path.join(dir, "scene-plan.json");
    const res = rebaseMarks({ plan: readJson(planPath), source, longAlignment, shortAlignment, leadLong, leadShort });
    const { valid, errors } = validate(res.plan, "scene-plan");
    if (!valid) throw new Error(`${id}/${name} scene-plan would be invalid: ${formatErrors(errors)}`);
    fs.writeFileSync(planPath, JSON.stringify(res.plan, null, 2) + "\n");
    results.push({ unit: `${id}/${name}`, moved: res.moved, worst: res.worst, sfx: res.plan.audio?.sfx?.length ?? 0, warnings: res.warnings });
  }
  return results;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const id = argv.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: make-shorts.mjs <id> [--dry-run | --marks]");
    process.exit(1);
  }
  try {
    if (argv.includes("--marks")) {
      for (const r of remarkShorts({ id })) {
        if (r.skipped) { console.log(`  ~ ${r.unit}: ${r.skipped}`); continue; }
        console.log(`  ✔ ${r.unit}: ${r.moved} mark(s) re-timed (largest move ${r.worst.toFixed(3)}s), ${r.sfx} SFX cue(s)`);
        for (const w of r.warnings) console.log(`    ! ${w}`);
      }
    } else {
      const dryRun = argv.includes("--dry-run");
      const res = deriveShorts({ id, dryRun });
      if (!res.ok) {
        console.error(`cannot derive Shorts for ${id}:\n  - ${res.problems.join("\n  - ")}`);
        process.exit(1);
      }
      for (const u of res.units) {
        console.log(`${u.ready ? "✔" : "✘"} ${u.unit} — "${u.title}" · ~${u.seconds}s · ${u.scenes} scenes · ${u.sfx} SFX`);
        for (const m of u.missing) console.log(`    needs: ${m}`);
        if (u.notPortrait.length) console.log(`    no portrait framing yet: ${u.notPortrait.join(", ")}`);
        if (u.unsigned.length) console.log(`    tall frame not signed off (05-qa refuses the Short until it is): ${u.unsigned.join(", ")} — ${PORTRAIT_CHECK}, then set props.portrait_ok: true`);
      }
      console.log(dryRun ? "--dry-run: nothing written." : `next, per unit: voice → align → node pipeline/01-script/make-shorts.mjs ${id} --marks → compile-hyperframes → build-props → render`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
