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
 *   then:  cd templates/remotion && npx remotion render Main out/<id>.mp4 --props=props/<id>.json
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const vertical = id.endsWith("-short"); // 002-short → 1080x1920 Short
const dims = vertical ? (cfg.render?.short ?? { width: 1080, height: 1920 }) : (cfg.render?.long ?? { width: 1920, height: 1080 });
const intro = Math.round((vertical ? 1.2 : 1.5) * fps); // Short bumped 0.7→1.2s so the intro underline finishes & wordmark reads
const outro = Math.round((vertical ? 1.2 : 2.5) * fps);
const xf = cfg.render?.crossfadeFrames ?? 9;
const LEAD = Math.round(0.22 * fps); // start reveals slightly BEFORE the word so the animation lands on cue
const audioFrames = F(al.duration);
const total = intro + audioFrames + outro;
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

// caption cues (per sentence, absolute; word offsets relative to the cue)
const words = al.words ?? [];
const cues = al.sentences.map((sent, i) => {
  const from = intro + F(sent.start);
  const nextStart = i + 1 < al.sentences.length ? intro + F(al.sentences[i + 1].start) : intro + audioFrames;
  const ww = words.filter((w) => w.start >= sent.start - 0.001 && w.start < sent.end + 0.05)
    .map((w) => ({ w: /^ai$/i.test(w.w) ? "AI" : w.w, relFrom: F(w.start - sent.start), relDur: Math.max(F(w.end - w.start), 1) }));
  return { fromFrame: from, durFrames: Math.max(nextStart - from, 1), words: ww };
});

// copy narration into Remotion public/
const pubDir = join(ROOT, "templates/remotion/public", id);
mkdirSync(pubDir, { recursive: true });
cpSync(join(cdir, "voice/narration.mp3"), join(pubDir, "narration.mp3"));

const props = {
  fps, width: dims.width ?? 1920, height: dims.height ?? 1080,
  introFrames: intro, outroFrames: outro, totalFrames: total, crossfadeFrames: xf,
  audioSrc: `${id}/narration.mp3`, audioFromFrame: intro,
  intro: { wordmark: "The Automation Desk", tagline: "automate the boring stuff" },
  outro: { cta: "@TheAutomationDesk", brand: "" },
  scenes, captions: cues,
};

const outDir = join(ROOT, "templates/remotion/props");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${id}.json`), JSON.stringify(props, null, 2) + "\n");

console.log(`OK props/${id}.json  (${scenes.length} beats from ${script.scenes.length} scenes, ${cues.length} caption cues)`);
console.log(`   total ${total} frames = ${(total / fps).toFixed(1)}s @ ${fps}fps (xf ${xf})`);
