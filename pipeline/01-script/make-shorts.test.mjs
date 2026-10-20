// make-shorts.mjs (1B, D-074) — Shorts cut from the long's own scenes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { withTempDir, validateFile } from "../shared/testkit/index.mjs";
import { nativePortrait, portraitProblems, portraitReady, portraitSignoffProblems } from "../04-render/lib/portrait.mjs";
import {
  SOURCE_FILE,
  assignUnits,
  checkCuts,
  keepTimings,
  deriveShorts,
  makeShortUnit,
  rebaseMarks,
  remarkShorts,
  sceneStarts,
  sceneWarp,
  warpFromPairs,
  wordWarp,
} from "./make-shorts.mjs";

// A five-scene long: s1 hook, s2..s4 points, s5 cta. ~12 words a sentence → ~4.5 s each at 160 wpm.
const SENT = (n) => `This is sentence number ${n} of the long and it carries about twelve words.`;
const scene = (id, role, n) => ({ id, role, template: "custom", narration: Array.from({ length: n }, (_, i) => SENT(`${id}.${i}`)).join(" "), sentences: Array.from({ length: n }, (_, i) => SENT(`${id}.${i}`)) });
const LONG = {
  id: "030-t", language: "en", archetype: "ideas", angle: "a", title_working: "Long", target_seconds: 200, closing_question: "Which one?",
  scenes: [scene("s1", "hook", 2), scene("s2", "point", 4), scene("s3", "point", 4), scene("s4", "point", 4), scene("s5", "cta", 2)],
};
const entry = (id, hf, marks) => ({ scene_id: id, engine: "hyperframes", template: "custom", revealOn: "sentences", transitionOut: "cut", props: { hf_scene: hf, ...(marks ? { marks } : {}) } });
const PLAN = {
  id: "030-t",
  audio: { bed: { src: "bed.mp3", gain: 0.05 }, sfx: [{ src: "accent.mp3", atSeconds: 21.0, gain: 0.3 }, { src: "whoosh.mp3", atSeconds: 2.0, gain: 0.3 }] },
  scenes: [entry("s1", "t-hook"), entry("s2", "t-two", { forty: 1.5 }), entry("s3", "t-three", { ten: 2.0 }), entry("s4", "t-four"), entry("s5", "t-five")],
};

/** An alignment: each sentence 4 s long, words evenly inside it; `speed` stretches the whole voice. */
function alignment(script, { speed = 1, gap = 0.4 } = {}) {
  const sentences = [];
  const words = [];
  let t = 0.1;
  for (const sc of script.scenes) {
    sc.sentences.forEach((text, index) => {
      const w = text.split(/\s+/);
      const dur = 4 * speed;
      sentences.push({ scene: sc.id, index, text, start: t, end: t + dur });
      w.forEach((word, i) => words.push({ scene: sc.id, w: word.toLowerCase(), start: t + (i * dur) / w.length, end: t + ((i + 1) * dur) / w.length }));
      t += dur + gap;
    });
  }
  return { audio: "voice/narration.mp3", duration: t, sentences, words };
}

test("checkCuts: unknown, missing-plan, reused scenes and the Short length rule are named", () => {
  assert.deepEqual(checkCuts(LONG, PLAN, [{ title: "A", scenes: ["s2", "s3", "s4"] }]).problems, []);
  const bad = checkCuts(LONG, PLAN, [
    { title: "A", scenes: ["s2", "s9"] },
    { title: "B", scenes: ["s2"] },
    { scenes: ["s5"] },
  ]).problems;
  assert.ok(bad.some((p) => /"s9" is not in the long script/.test(p)));
  assert.ok(bad.some((p) => /"s2" is already in cut 1/.test(p)));
  assert.ok(bad.some((p) => /cut 3: no title/.test(p)));
  assert.ok(bad.some((p) => /a Short runs 45-120s/.test(p)), "one 2-sentence scene is far below 45 s");
  assert.match(checkCuts(LONG, PLAN, []).problems[0], /no short_cuts/);
});

test("checkCuts measures what the Short will say: the opening's words, at the long's own pace", () => {
  const cut = { title: "C", scenes: ["s1", "s5"] };                 // 4 sentences × 14 words = 56 words
  const at = (opt, c = cut) => checkCuts(LONG, PLAN, [c], opt);
  assert.ok(at({}).problems.some((p) => /~21s/.test(p)), "56 words at 160 wpm = 21 s");
  assert.deepEqual(at({ secondsPerWord: 0.9 }).problems, [], "56 words at the measured 0.9 s/word = 50 s");
  assert.equal(Math.round(at({ secondsPerWord: 0.9 }).cuts[0].seconds), 50);
  // an opening replaces the first sentence (14 words) — a 40-word opening adds 26 words
  const opening = Array.from({ length: 40 }, (_, i) => `w${i}`).join(" ");
  assert.equal(Math.round(at({ secondsPerWord: 0.5 }, { ...cut, opening }).cuts[0].seconds), Math.round((56 - 14 + 40) * 0.5));
  assert.equal(Math.round(at({}, { ...cut, opening }).cuts[0].seconds), Math.round(((56 - 14 + 40) * 60) / 160));
});

test("makeShortUnit: narration verbatim, renumbered, first scene is the hook-class opener, plan reused", () => {
  const { script, plan, source } = makeShortUnit({ longScript: LONG, longPlan: PLAN, cut: { title: "Cut", scenes: ["s3", "s4"] }, id: "030-t/short-2" });
  assert.equal(script.id, "030-t/short-2");
  assert.deepEqual(script.scenes.map((s) => s.id), ["s1", "s2"]);
  assert.equal(script.scenes[0].narration, LONG.scenes[2].narration, "the long's words, not a rewrite");
  assert.equal(script.scenes[0].role, "hook");
  assert.equal(script.scenes[0].source_scene, "s3");
  assert.equal(script.closing_question, "Which one?", "inherits the long's question");
  assert.deepEqual(plan.scenes.map((p) => [p.scene_id, p.props.hf_scene, p.template]), [["s1", "t-three", "hook-card"], ["s2", "t-four", "custom"]]);
  assert.deepEqual(plan.scenes[0].props.marks, { ten: 2.0 }, "marks stay on the long's clock until --marks");
  assert.deepEqual(plan.audio, { bed: { src: "bed.mp3", gain: 0.05 } });
  assert.deepEqual(source.scenes, [{ scene_id: "s1", source: "s3" }, { scene_id: "s2", source: "s4" }]);
  assert.equal(PLAN.scenes[2].template, "custom", "the long plan is not mutated");
});

test("makeShortUnit: an authored hook leads; an opening replaces exactly one sentence", () => {
  const cut = { title: "Cut", scenes: ["s2", "s3"], hook: { narration: "Hook line here.", hf_scene: "t-hook-p" }, opening: "A line that stands alone." };
  const { script, plan, source } = makeShortUnit({ longScript: LONG, longPlan: PLAN, cut, id: "030-t/short" });
  assert.deepEqual(script.scenes.map((s) => s.role), ["hook", "point", "point"]);
  assert.equal(plan.scenes[0].props.hf_scene, "t-hook-p");
  assert.equal(plan.scenes[1].template, "custom", "with a hook, the reused scene keeps its own template");
  const opened = script.scenes[1];
  assert.equal(opened.sentences.length, LONG.scenes[1].sentences.length, "same sentence count — the beats still land");
  assert.equal(opened.sentences[0], "A line that stands alone.");
  assert.ok(opened.narration.startsWith("A line that stands alone. "));
  assert.equal(opened.narration.includes(LONG.scenes[1].sentences[0]), false);
  assert.deepEqual(source.scenes[1], { scene_id: "s2", source: "s2", opening: true });
});

test("makeShortUnit: a carry/match out of a scene survives only into the long's next scene", () => {
  const plan = { ...PLAN, scenes: PLAN.scenes.map((e) => ({ ...e, transitionOut: e.scene_id === "s2" || e.scene_id === "s3" ? "carry" : "match" })) };
  const { plan: out } = makeShortUnit({ longScript: LONG, longPlan: plan, cut: { title: "C", scenes: ["s2", "s4", "s5"] }, id: "030-t/short" });
  assert.deepEqual(out.scenes.map((e) => e.transitionOut), ["cut", "match", "cut"], "s2→s4 skips s3; s4→s5 is adjacent; the last scene never carries");
});

test("keepTimings: a re-derived plan keeps marks + SFX already re-timed for the same cut", () => {
  const fresh = { id: "x", scenes: [{ scene_id: "s1", props: { hf_scene: "a", marks: { k: 1 } }, transitionOut: "cut" }] };
  const prev = { id: "x", audio: { sfx: [{ src: "a.mp3", atSeconds: 3 }] }, scenes: [{ scene_id: "s1", props: { hf_scene: "a", marks: { k: 1.4 } }, transitionOut: "carry" }] };
  const kept = keepTimings(fresh, prev);
  assert.equal(kept.scenes[0].props.marks.k, 1.4);
  assert.equal(kept.scenes[0].transitionOut, "cut", "everything else is the fresh derivation");
  assert.deepEqual(kept.audio.sfx, prev.audio.sfx);
  assert.equal(keepTimings(fresh, null), fresh);
});

test("keepTimings: a portrait sign-off given on the unit survives a re-derive; it is never invented", () => {
  const fresh = { id: "x", scenes: [{ scene_id: "s1", props: { hf_scene: "a" } }, { scene_id: "s2", props: { hf_scene: "b" } }] };
  const prev = { id: "x", scenes: [{ scene_id: "s1", props: { hf_scene: "a", portrait_ok: true } }, { scene_id: "s2", props: { hf_scene: "b", portrait_ok: false } }] };
  const kept = keepTimings(fresh, prev);
  assert.equal(kept.scenes[0].props.portrait_ok, true);
  assert.equal(kept.scenes[1].props.portrait_ok, undefined);
});

test("makeShortUnit carries the long's SFX that sit inside the reused scenes, as offsets into them", () => {
  const al = alignment(LONG);
  const { source } = makeShortUnit({ longScript: LONG, longPlan: PLAN, longAlignment: al, cut: { title: "C", scenes: ["s2"] }, id: "030-t/short" });
  const s2 = sceneStarts(al).get("s2");
  assert.equal(source.sfx.length, 1, "the s1 whoosh at 2.0 s stays behind");
  assert.equal(source.sfx[0].source, "s2");
  assert.ok(Math.abs(source.sfx[0].offset - (21.0 - s2)) < 1e-6);
});

test("sceneStarts: the first scene starts at 0 (no intro), the others on their first sentence", () => {
  const starts = sceneStarts(alignment(LONG));
  assert.equal(starts.get("s1"), 0);
  assert.ok(Math.abs(starts.get("s2") - 8.9) < 1e-9);
});

test("warps: word for word, proportional inside a replaced opening, loud on changed text", () => {
  const w = warpFromPairs([[0, 0], [10, 20]]);
  assert.equal(w(5), 10);
  assert.equal(w(12), 22, "slope 1 past the last pair");
  assert.throws(() => wordWarp([{ start: 1 }], [{ start: 1 }, { start: 2 }]), /narration was changed/);

  const longAl = alignment(LONG);
  const cut = { title: "C", scenes: ["s2", "s3"], opening: "Short one." };
  const { script } = makeShortUnit({ longScript: LONG, longPlan: PLAN, cut, id: "030-t/short" });
  const shortAl = alignment(script, { speed: 1.25 });
  const warp = sceneWarp(longAl, shortAl, "s2", "s1", { opening: true });
  const ls = longAl.sentences.filter((s) => s.scene === "s2");
  const ss = shortAl.sentences.filter((s) => s.scene === "s1");
  assert.ok(Math.abs(warp(ls[0].end) - ss[0].end) < 1e-9, "the replaced sentence maps end to end");
  assert.ok(Math.abs(warp(ls[2].start) - ss[2].start) < 1e-9, "later sentences map word for word");
  assert.throws(() => sceneWarp(longAl, shortAl, "s2", "s1"), /narration was changed/, "without the flag the word counts differ");
});

test("rebaseMarks moves marks + SFX onto the Short's clock (a slower voice → later marks)", () => {
  const longAl = alignment(LONG);
  const { plan, source } = makeShortUnit({ longScript: LONG, longPlan: PLAN, longAlignment: longAl, cut: { title: "C", scenes: ["s2", "s3"] }, id: "030-t/short" });
  const shortAl = alignment({ scenes: plan.scenes.map((p, i) => ({ ...LONG.scenes[i + 1], id: p.scene_id })) }, { speed: 1.5 });
  const res = rebaseMarks({ plan, source, longAlignment: longAl, shortAlignment: shortAl, leadLong: 0.2, leadShort: 0.2 });
  assert.equal(res.moved, 2);
  assert.deepEqual(res.warnings, []);
  // Long s2 starts on its first sentence (8.9 s), so the mark sits 1.5 + 0.2 lead = 1.7 s into it. In the
  // Short it is the FIRST scene (scene clock from 0, first sentence at 0.1) and the voice is 1.5× slower.
  assert.ok(Math.abs(res.plan.scenes[0].props.marks.forty - ((1.5 + 0.2) * 1.5 + 0.1 - 0.2)) < 0.02);
  assert.ok(res.plan.scenes[1].props.marks.ten > 2.0, "the slower Short pushes the second scene's mark later");
  assert.equal(res.plan.audio.sfx.length, 1);
  assert.equal(res.plan.audio.bed.src, "bed.mp3", "the bed is kept");
  assert.equal(plan.scenes[0].props.marks.forty, 1.5, "the input plan is not mutated");
});

test("rebaseMarks leaves a scene whose words changed on the long's clock, and says so", () => {
  const longAl = alignment(LONG);
  const { plan, source } = makeShortUnit({ longScript: LONG, longPlan: PLAN, longAlignment: longAl, cut: { title: "C", scenes: ["s2"] }, id: "030-t/short" });
  const shortAl = alignment({ scenes: [{ ...LONG.scenes[1], id: "s1", sentences: LONG.scenes[1].sentences.slice(1) }] });
  const res = rebaseMarks({ plan, source, longAlignment: longAl, shortAlignment: shortAl, leadLong: 0.2, leadShort: 0.2 });
  assert.equal(res.moved, 0);
  assert.match(res.warnings[0], /stay on the long's clock/);
});

test("portraitReady / portraitProblems: native portrait or a portrait branch; a waiver per scene", () => {
  assert.equal(portraitReady(['var S = HF.scene({ id: "x", width: 1080, height: 1920, frames: 9 });']), true);
  assert.equal(portraitReady(["if (S.portrait) cam.z *= 1.6;"]), true);
  assert.equal(portraitReady([".portrait #k1 { top: 10px; }"]), true);
  assert.equal(portraitReady(['var S = HF.scene({ id: "x", width: 1920, height: 1080 });']), false);
  const jobs = [
    { sceneId: "s1", hfScene: "wide", width: 1080, height: 1920, props: {} },
    { sceneId: "s2", hfScene: "wide", width: 1080, height: 1920, props: {}, portraitOk: true },
    { sceneId: "s3", hfScene: "wide", width: 1920, height: 1080, props: {} },
  ];
  const problems = portraitProblems(jobs, () => ["width: 1920"]);
  assert.equal(problems.length, 1, "only the un-waived portrait job");
  assert.match(problems[0], /^s1 wide: no portrait framing/);
});

// Owner, 2026-10-18, on the 023 cuts: overlapping, unclear, low contrast — every scene HAD a portrait
// branch, written blind in August and never looked at. A branch makes a scene renderable, not good.
test("portraitSignoffProblems: a reused landscape scene needs portrait_ok even with a portrait branch", () => {
  const src = {
    branch: ['var S = HF.scene({ id: "b", width: 1920, height: 1080 });', ".portrait .k { top: 9px; }"],
    native: ['var S = HF.scene({ id: "n", width: 1080, height: 1920, frames: 9 });'],
  };
  assert.equal(nativePortrait(src.native), true);
  assert.equal(nativePortrait(src.branch), false);
  assert.equal(portraitReady(src.branch), true, "renderable tall");
  const plan = [
    { scene_id: "s1", engine: "hyperframes", props: { hf_scene: "branch" } },
    { scene_id: "s2", engine: "hyperframes", props: { hf_scene: "branch", portrait_ok: true } },
    { scene_id: "s3", engine: "hyperframes", props: { hf_scene: "native" } },
    { scene_id: "s4", engine: "hyperframes", props: { hf_scene: "gone" } },
    { scene_id: "s5", engine: "remotion", template: "cta-card", props: {} },
    { scene_id: "s6", engine: "hyperframes", props: {} },
  ];
  assert.deepEqual(portraitSignoffProblems(plan, (n) => src[n] ?? null), ["s1 branch", "s4 gone"]);
  assert.deepEqual(portraitSignoffProblems([], () => null), []);
});

/** A throwaway repo: content/030-t (long + alignment), a hand-built short/, three HF scenes. */
function makeRoot(root, { handBuiltShort = true } = {}) {
  const topic = path.join(root, "content", "030-t");
  fs.mkdirSync(topic, { recursive: true });
  const script = { ...LONG, short_cuts: [{ title: "First cut", scenes: ["s2", "s3", "s4"] }, { title: "Second cut", scenes: ["s1", "s5", "s2x"].slice(0, 2) }] };
  fs.writeFileSync(path.join(topic, "script.json"), JSON.stringify(script));
  fs.writeFileSync(path.join(topic, "scene-plan.json"), JSON.stringify(PLAN));
  fs.writeFileSync(path.join(topic, "alignment.json"), JSON.stringify(alignment(LONG)));
  if (handBuiltShort) {
    fs.mkdirSync(path.join(topic, "short"));
    fs.writeFileSync(path.join(topic, "short", "script.json"), "{}");
  }
  const sceneFile = (name, body) => {
    const dir = path.join(root, "templates", "hyperframes", "scenes", name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.js`), body);
  };
  sceneFile("t-two", "var S = HF.scene({ width: 1920, height: 1080 }); if (S.portrait) {}");
  sceneFile("t-three", "var S = HF.scene({ width: 1920, height: 1080 }); /* .portrait #hud {} */");
  sceneFile("t-four", "var S = HF.scene({ width: 1920, height: 1080 });");
  return topic;
}

test("assignUnits skips a hand-built unit and re-uses a derived one", async () => {
  await withTempDir(async (root) => {
    const topic = makeRoot(root);
    assert.deepEqual(assignUnits(topic, 2), ["short-2", "short-3"], "025's hand-built short/ is never overwritten");
    fs.mkdirSync(path.join(topic, "short-2"));
    fs.writeFileSync(path.join(topic, "short-2", SOURCE_FILE), "{}");
    assert.deepEqual(assignUnits(topic, 2), ["short-2", "short-3"], "a derived unit is re-derived in place");
  });
});

test("assignUnits: the _TEMPLATE short/ skeleton (log.md, empty voice/ + video/) is a free unit", async () => {
  await withTempDir(async (root) => {
    const topic = makeRoot(root, { handBuiltShort: false });
    for (const d of ["voice", "video"]) { fs.mkdirSync(path.join(topic, "short", d), { recursive: true }); fs.writeFileSync(path.join(topic, "short", d, ".gitkeep"), ""); }
    fs.writeFileSync(path.join(topic, "short", "log.md"), "# Log — <video title>\n");
    assert.deepEqual(assignUnits(topic, 2), ["short", "short-2"]);
  });
});

test("deriveShorts writes schema-valid units and reports scenes without a portrait framing", async () => {
  await withTempDir(async (root) => {
    const topic = makeRoot(root);
    const script = JSON.parse(fs.readFileSync(path.join(topic, "script.json"), "utf8"));
    script.short_cuts = [{ title: "First cut", scenes: ["s2", "s3", "s4"] }];
    const dry = deriveShorts({ root, id: "030-t", dryRun: true, script });
    assert.equal(dry.ok, true, dry.problems.join("; "));
    assert.equal(fs.existsSync(path.join(topic, "short-2")), false, "a dry run writes nothing");
    assert.deepEqual(dry.units[0].notPortrait, ["s3 t-four"]);
    assert.equal(dry.units[0].ready, false);

    const res = deriveShorts({ root, id: "030-t", script });
    assert.equal(res.units[0].unit, "030-t/short-2");
    for (const [f, schema] of [["script.json", "script"], ["scene-plan.json", "scene-plan"]]) {
      assert.ok(validateFile(path.join(topic, "short-2", f), schema).valid, f);
    }
    assert.equal(JSON.parse(fs.readFileSync(path.join(topic, "short-2", SOURCE_FILE), "utf8")).derived_from, "030-t");
  });
});

test("deriveShorts refuses cuts that break the rules and writes nothing", async () => {
  await withTempDir(async (root) => {
    const topic = makeRoot(root);
    const res = deriveShorts({ root, id: "030-t" }); // the fixture's second cut is two short scenes
    assert.equal(res.ok, false);
    assert.ok(res.problems.some((p) => /cut 2/.test(p)));
    assert.equal(fs.existsSync(path.join(topic, "short-2")), false);
  });
});

test("remarkShorts re-times a derived unit once it is aligned, and skips one that is not", async () => {
  await withTempDir(async (root) => {
    const topic = makeRoot(root);
    const script = { ...JSON.parse(fs.readFileSync(path.join(topic, "script.json"), "utf8")), short_cuts: [{ title: "First cut", scenes: ["s2", "s3", "s4"] }] };
    deriveShorts({ root, id: "030-t", script });
    assert.match(remarkShorts({ root, id: "030-t" })[0].skipped, /no alignment/);
    const unitScript = JSON.parse(fs.readFileSync(path.join(topic, "short-2", "script.json"), "utf8"));
    fs.writeFileSync(path.join(topic, "short-2", "alignment.json"), JSON.stringify(alignment(unitScript, { speed: 1.2 })));
    const [r] = remarkShorts({ root, id: "030-t" });
    assert.equal(r.unit, "030-t/short-2");
    assert.equal(r.moved, 2);
    assert.ok(validateFile(path.join(topic, "short-2", "scene-plan.json"), "scene-plan").valid);
  });
});
