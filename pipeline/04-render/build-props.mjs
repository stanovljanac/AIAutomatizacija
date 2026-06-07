#!/usr/bin/env node
/**
 * 04-render: build Remotion render props from a video's script + scene-plan +
 * alignment. Supports (D-022):
 *  - scene **beats** (one script scene → several visual beats over its sentences),
 *  - **reveal-sync** (sub-elements appear in step with the narration: per sentence,
 *    or on `cueWords`),
 *  - **crossfade overlap** between scenes (each window starts `crossfadeFrames`
 *    early so SceneWrapper can blend over the persistent background).
 *
 *   node pipeline/04-render/build-props.mjs 002-what-is-ai-automation
 *   node pipeline/04-render/build-props.mjs 004-foo/short        # nested Short unit
 *   then:  cd templates/remotion && npx remotion render Main out/<outId>.mp4 --props=props/<outId>.json
 *   (<outId> = the content id with slashes flattened, e.g. 004-foo/short → 004-foo-short)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const id = process.argv[2];
if (!id) { console.error("usage: build-props.mjs <content_id>"); process.exit(1); }

const cdir = join(ROOT, "content", id);
const cfg = JSON.parse(readFileSync(join(ROOT, "pipeline/shared/config.json"), "utf8"));
const script = JSON.parse(readFileSync(join(cdir, "script.json"), "utf8"));
const plan = JSON.parse(readFileSync(join(cdir, "scene-plan.json"), "utf8"));
const al = JSON.parse(readFileSync(join(cdir, "alignment.json"), "utf8"));

const fps = cfg.render?.fps ?? 30;
const F = (s) => Math.round(s * fps);
// Short detection by the LAST path segment, so both schemes work:
//   new nested: content/004-foo/short  (seg === "short")
//   legacy flat: content/002-short     (seg endsWith "-short")
const seg = id.split(/[\\/]/).pop();
const vertical = seg === "short" || seg.endsWith("-short"); // → 1080x1920 Short
const dims = vertical ? (cfg.render?.short ?? { width: 1080, height: 1920 }) : (cfg.render?.long ?? { width: 1920, height: 1080 });
// Flat artifact id so a nested content id (004-foo/short) doesn't put slashes into the
// Remotion public/props/out paths or the --props CLI arg. 004-foo/short → 004-foo-short.
const outId = id.replace(/[\\/]/g, "-");
const intro = Math.round((vertical ? 1.2 : 1.5) * fps); // Short bumped 0.7→1.2s so the intro underline finishes & wordmark reads
const outro = Math.round((vertical ? 1.2 : 2.5) * fps);
const xf = cfg.render?.crossfadeFrames ?? 9;
const LEAD = Math.round(0.22 * fps); // start reveals slightly BEFORE the word so the animation lands on cue
const audioFrames = F(al.duration);
const total = intro + audioFrames + outro;

// HARD RULE ENFORCEMENT (so documented rules can't be silently skipped).
// Short length — STYLE_GUIDE §7 / config.defaults: target 50-60s, min 45, hard max 120.
const durSec = al.duration;
if (vertical && (durSec < 45 || durSec > (cfg.defaults?.short_seconds_max ?? 120))) {
  console.error(`\nSHORT LENGTH RULE (STYLE_GUIDE §7): ${id} narration is ${durSec.toFixed(1)}s — must be 45-${cfg.defaults?.short_seconds_max ?? 120}s (target ~${cfg.defaults?.short_seconds ?? 55}s). Fix the Short script before rendering.\n`);
  process.exit(1);
}
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, "");

const planBy = Object.fromEntries(plan.scenes.map((s) => [s.scene_id, s]));
const sentByScene = {};
for (const s of al.sentences) (sentByScene[s.scene] ??= []).push(s);
const wordsByScene = {};
for (const w of al.words ?? []) (wordsByScene[w.scene] ??= []).push(w);

// flatten scenes → beats
const beats = [];
for (const sc of script.scenes) {
  const sents = sentByScene[sc.id] ?? [];
  const ps = planBy[sc.id] ?? { template: "section-header", props: { title: sc.id } };
  let defs = ps.beats?.length
    ? ps.beats.map((b) => ({ template: b.template, props: { ...b.props }, sentences: b.sentences, revealOn: b.revealOn ?? ps.revealOn, cueWords: b.cueWords ?? ps.cueWords }))
    : [{ template: ps.template, props: { ...ps.props }, revealOn: ps.revealOn, cueWords: ps.cueWords }];

  // assign each beat a contiguous slice of this scene's sentences
  const n = defs.length;
  defs.forEach((d, bi) => {
    let slice;
    if (d.sentences) slice = sents.slice(d.sentences[0], d.sentences[1] + 1);
    else {
      const a = Math.floor((bi * sents.length) / n);
      const b = Math.floor(((bi + 1) * sents.length) / n);
      slice = sents.slice(a, Math.max(b, a + 1));
    }
    if (!slice.length) slice = [sents[Math.min(bi, sents.length - 1)] ?? { start: 0, end: 0.5 }];
    beats.push({ sceneId: `${sc.id}.${bi}`, sid: sc.id, template: d.template, props: d.props, sents: slice, revealOn: d.revealOn, cueWords: d.cueWords });
  });
}

// capture-segment wiring: copy each recorded clip into Remotion public/<outId>/ and
// point the scene at it (the CaptureSegment component plays props.src via staticFile).
const capDir = join(ROOT, "templates/remotion/public", outId);
for (const bt of beats) {
  if (bt.template !== "capture-segment") continue;
  const capId = bt.props?.capture_id;
  if (!capId) { console.warn(`capture-segment ${bt.sceneId} has no capture_id`); continue; }
  const srcFile = join(cdir, "captures", `${capId}.mp4`);
  if (!existsSync(srcFile)) { console.warn(`capture clip missing: ${srcFile}`); continue; }
  mkdirSync(capDir, { recursive: true });
  cpSync(srcFile, join(capDir, `${capId}.mp4`));
  bt.props.src = `${outId}/${capId}.mp4`;
}

// brand logos: copy assets/brand/* into Remotion public/brand/, then STRIP any logo prop
// whose file is missing so a scene (e.g. versus-note) falls back to a wordmark instead of
// crashing the render. Drop chatgpt.png/claude.png/excel.png into assets/brand/ to enable.
const brandSrc = join(ROOT, "assets", "brand");
const brandDst = join(ROOT, "templates/remotion/public/brand");
if (existsSync(brandSrc)) {
  mkdirSync(brandDst, { recursive: true });
  for (const f of readdirSync(brandSrc)) if (/\.(png|jpe?g|webp|svg)$/i.test(f)) cpSync(join(brandSrc, f), join(brandDst, f));
}
for (const bt of beats) for (const k of ["leftLogo", "rightLogo", "logo"]) {
  const v = bt.props?.[k];
  if (v && !existsSync(join(ROOT, "templates/remotion/public", v))) delete bt.props[k];
}

// b-roll (v2-4): a scene with props.broll = "<query>" plays a fetched stock clip behind it.
// fetch-stock.mjs downloads content/<id>/broll/<slug>.mp4; copy it into public/ and set
// props.brollSrc (SceneWrapper renders it dark-graded). If missing, the scene renders plain.
const brollSlug = (q) => String(q).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
for (const bt of beats) {
  if (!bt.props?.broll) continue;
  const slug = brollSlug(bt.props.broll);
  const f = join(cdir, "broll", `${slug}.mp4`);
  if (existsSync(f)) {
    const d = join(ROOT, "templates/remotion/public", outId, "broll");
    mkdirSync(d, { recursive: true });
    cpSync(f, join(d, `${slug}.mp4`));
    bt.props.brollSrc = `${outId}/broll/${slug}.mp4`;
  } else {
    console.warn(`b-roll missing for "${bt.props.broll}" — run: node pipeline/03-visuals/fetch-stock.mjs ${id}  (scene renders without b-roll)`);
  }
}

// nominal start frame (when this beat's first sentence is spoken)
beats.forEach((bt) => { bt.B = intro + F(bt.sents[0].start); });

const scenes = beats.map((bt, k) => {
  const from = k === 0 ? bt.B : bt.B - xf;
  const end = k + 1 < beats.length ? beats[k + 1].B : intro + audioFrames;
  const dur = Math.max(end - from, 1);

  // reveal-sync for list/flow/diagram sub-elements
  const arr = bt.props.items ?? bt.props.steps ?? bt.props.nodes;
  if (Array.isArray(arr) && arr.length) {
    const reveals = [];
    const sw = (wordsByScene[bt.sid] ?? []).filter((w) => w.start >= bt.sents[0].start - 0.01);
    for (let i = 0; i < arr.length; i++) {
      let absSec;
      if (bt.cueWords && bt.cueWords[i]) {
        const cue = norm(bt.cueWords[i]);
        const hit = sw.find((w) => norm(w.w) === cue);
        absSec = hit ? hit.start : (bt.sents[Math.min(i, bt.sents.length - 1)]?.start ?? bt.sents[0].start);
      } else {
        absSec = bt.sents[Math.min(i, bt.sents.length - 1)]?.start ?? bt.sents[0].start;
      }
      reveals.push(Math.max(intro + F(absSec) - from - LEAD, 0));
    }
    bt.props.reveals = reveals;
  }

  return { sceneId: bt.sceneId, template: bt.template, props: bt.props, fromFrame: from, durFrames: dur };
});

// no-empty-scene guard (v2-2): a SPARSE template (lower-third/transition) held long is the
// "empty screen" failure the owner flagged. Content-full scenes (table/code/term/cta) holding
// a while are fine. Warn only for the sparse case → split into beats or use a fuller scene.
const SPARSE = new Set(["lower-third", "transition"]);
for (const s of scenes) {
  const secs = s.durFrames / fps;
  const dynamic = Array.isArray(s.props?.reveals) && s.props.reveals.length > 1;
  if (SPARSE.has(s.template) && secs > 6 && !dynamic) {
    console.warn(`EMPTY/STATIC SCENE: ${s.sceneId} (${s.template}) ${secs.toFixed(1)}s — sparse template held long; split or use a fuller/animated scene (no-empty-scene rule).`);
  }
}

// caption cues — chunked into <=2-line groups, each timed to its words as they are
// spoken. We never dump a whole long sentence at once (that caused 3-6 line blocks and
// text appearing before it was said). A chunk shows only while its words are spoken.
const words = (al.words ?? []).filter((w) => w && w.w).slice().sort((a, b) => a.start - b.start);
const MAX_WORDS = 7;   // keeps a caption to <= 2 lines at the caption font size
const GAP = 0.7;       // start a fresh chunk after a pause this long (seconds)
const TAIL = 0.4;      // keep a chunk on screen this long after its last word (seconds)
const groups = [];
let cur = [];
for (let i = 0; i < words.length; i++) {
  cur.push(words[i]);
  const next = words[i + 1];
  const boundary = !next || cur.length >= MAX_WORDS || next.scene !== words[i].scene || (next.start - words[i].end) > GAP;
  if (boundary) { groups.push(cur); cur = []; }
}
const cues = groups.map((g, gi) => {
  const start = g[0].start;
  const from = intro + F(start);
  const nextFrom = gi + 1 < groups.length ? intro + F(groups[gi + 1][0].start) : intro + audioFrames;
  const cap = intro + F(g[g.length - 1].end + TAIL); // drop the chunk shortly after its last word
  const durFrames = Math.max(Math.min(nextFrom, cap) - from, 1);
  const ww = g.map((w) => ({ w: /^ai$/i.test(w.w) ? "AI" : w.w, relFrom: F(w.start - start), relDur: Math.max(F(w.end - w.start), 1) }));
  return { fromFrame: from, durFrames, words: ww };
});

// copy narration into Remotion public/
const pubDir = join(ROOT, "templates/remotion/public", outId);
mkdirSync(pubDir, { recursive: true });
cpSync(join(cdir, "voice/narration.mp3"), join(pubDir, "narration.mp3"));

const props = {
  fps, width: dims.width ?? 1920, height: dims.height ?? 1080,
  introFrames: intro, outroFrames: outro, totalFrames: total, crossfadeFrames: xf,
  audioSrc: `${outId}/narration.mp3`, audioFromFrame: intro,
  intro: { wordmark: "The Automation Desk", tagline: "automate the boring stuff" },
  outro: { cta: "@TheAutomationDesk", brand: "" },
  scenes, captions: cues,
};

const outDir = join(ROOT, "templates/remotion/props");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${outId}.json`), JSON.stringify(props, null, 2) + "\n");

console.log(`OK props/${outId}.json  (${scenes.length} beats from ${script.scenes.length} scenes, ${cues.length} caption cues)`);
console.log(`   total ${total} frames = ${(total / fps).toFixed(1)}s @ ${fps}fps (xf ${xf})`);
