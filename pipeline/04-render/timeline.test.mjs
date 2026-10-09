// V5 — the engine-agnostic timeline builder: produces a schema-valid timeline.json (absolute seconds,
// per-scene engine) from the golden fixture, with the forced-alignment sync expressed in seconds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFixture, assertValid } from "../shared/testkit/index.mjs";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { buildTimeline } from "./lib/timeline.mjs";

const fps = 30;

function fixtureTimeline() {
  const script = readFixture("script.json");
  const plan = readFixture("scene-plan.json");
  const alignment = readFixture("alignment.json");
  const brief = readFixture("brief.json");
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format, format_recipe: brief.format_recipe });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  return buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
}

test("buildTimeline emits a schema-valid timeline.json", () => {
  assertValid(fixtureTimeline(), "timeline.json");
});

test("buildTimeline times are ABSOLUTE seconds on one clock (intro → narration → outro)", () => {
  const t = fixtureTimeline();
  assert.equal(t.version, 1);
  assert.equal(t.format.fps, fps);
  assert.equal(t.intro.duration_seconds, 1.5, "long intro 45 frames / 30 = 1.5s");
  assert.equal(t.outro.duration_seconds, 2.5, "long outro 75 frames / 30 = 2.5s");
  assert.equal(t.audio.start_seconds, t.intro.duration_seconds, "narration starts right after intro");
  assert.equal(t.scenes[0].start_seconds, t.audio.start_seconds, "first scene opens with the narration");
  // duration = intro + narration + outro
  const align = readFixture("alignment.json");
  assert.equal(t.duration_seconds, 1.5 + align.duration + 2.5);
});

test("buildTimeline scenes are back-to-back (no crossfade baked in) and carry engine=remotion", () => {
  const t = fixtureTimeline();
  for (let i = 0; i + 1 < t.scenes.length; i++) {
    assert.equal(t.scenes[i].end_seconds, t.scenes[i + 1].start_seconds, "scene end meets next scene start");
  }
  // last scene ends at the narration end (intro + audio duration)
  const align = readFixture("alignment.json");
  assert.equal(t.scenes.at(-1).end_seconds, 1.5 + align.duration);
  for (const s of t.scenes) assert.equal(s.engine, "remotion", "default engine is remotion");
  // crossfade is a separate field, not folded into the scene windows
  assert.equal(t.crossfade_seconds, 9 / fps);
});

test("buildTimeline reveal-sync is stored as absolute seconds on the bullet-steps scene", () => {
  const t = fixtureTimeline();
  const bullets = t.scenes.find((s) => s.template === "bullet-steps");
  assert.ok(bullets.reveals?.length === 3, "one reveal per item");
  // reveals are non-decreasing absolute seconds, each >= the scene start
  let prev = -1;
  for (const r of bullets.reveals) {
    assert.ok(typeof r.at_seconds === "number" && r.at_seconds >= bullets.start_seconds - 1e-9);
    assert.ok(r.at_seconds >= prev, "reveals are ordered");
    prev = r.at_seconds;
  }
  // props stay clean (reveals live at scene level, not in props)
  assert.equal(bullets.props.reveals, undefined);
});

test("buildTimeline: revealOn 'sentences' yields one reveal per sentence even with no list (HF scenes)", () => {
  const script = readFixture("script.json");
  const plan = structuredClone(readFixture("scene-plan.json"));
  const alignment = readFixture("alignment.json");
  const brief = readFixture("brief.json");
  // pick a scene that has NO items/steps/nodes list and >= 2 sentences
  const target = plan.scenes.find((p) => {
    const sc = script.scenes.find((s) => s.id === p.scene_id);
    return sc && sc.sentences.length >= 2 && !(p.props?.items || p.props?.steps || p.props?.nodes);
  });
  assert.ok(target, "fixture has a no-list, multi-sentence scene to mark revealOn:sentences");
  target.revealOn = "sentences";
  const sc = script.scenes.find((s) => s.id === target.scene_id);
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format, format_recipe: brief.format_recipe });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
  const built = t.scenes.find((s) => s.scene_id === `${target.scene_id}.0`);
  assert.equal(built.reveals?.length, sc.sentences.length, "one reveal per sentence");
  let prev = -1;
  for (const r of built.reveals) {
    assert.ok(r.at_seconds >= prev, "reveals are ordered");
    prev = r.at_seconds;
  }
});

test("buildTimeline clamps list/flow reveals to NON-DECREASING order even when cue words resolve out of order", () => {
  // Regression for the 008 flow bug: a downstream node's cue word ("re-checks") was spoken EARLIER in
  // the narration than an upstream node's ("reads"), so the chain assembled out of order on screen.
  // Here step 2's cue ("gamma") is the FIRST word; without the clamp its reveal would precede steps 0/1.
  const script = { archetype: "diagram", scenes: [{ id: "s1", sentences: ["gamma alpha beta"] }] };
  const plan = {
    id: "x",
    scenes: [{
      scene_id: "s1", template: "flow",
      props: { title: "T", steps: [{ label: "a" }, { label: "b" }, { label: "c" }] },
      cueWords: ["alpha", "beta", "gamma"],
    }],
  };
  const alignment = {
    duration: 3,
    sentences: [{ scene: "s1", start: 0.5, end: 3 }],
    words: [
      { scene: "s1", w: "gamma", start: 0.5, end: 0.9 }, // cue for step 2 — earliest in time
      { scene: "s1", w: "alpha", start: 1.0, end: 1.4 }, // cue for step 0
      { scene: "s1", w: "beta", start: 1.5, end: 1.9 },  // cue for step 1
    ],
  };
  const fmt = resolveFormat({ archetype: "diagram" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  const flow = t.scenes.find((s) => s.template === "flow");
  assert.equal(flow.reveals.length, 3, "one reveal per step");
  let prev = -Infinity;
  for (const r of flow.reveals) { assert.ok(r.at_seconds >= prev, "reveals are non-decreasing after the clamp"); prev = r.at_seconds; }
  // step 2 (gamma, time 0.5) is clamped up to step 1's reveal (beta, time 1.5) — never appears first
  assert.equal(flow.reveals[2].at_seconds, flow.reveals[1].at_seconds, "out-of-order downstream reveal is pinned to its upstream neighbour");
});

test("buildTimeline clamp: equal-time reveals are unchanged (clamp is strictly-less-than, not <=)", () => {
  // Two cue words that both happen to resolve to the SAME snapped second must each keep that value —
  // the clamp must not disturb them. This guards against an accidental <= comparison.
  const script = { archetype: "diagram", scenes: [{ id: "s1", sentences: ["alpha alpha beta"] }] };
  const plan = {
    id: "x",
    scenes: [{
      scene_id: "s1", template: "flow",
      props: { title: "T", steps: [{ label: "a" }, { label: "b" }, { label: "c" }] },
      cueWords: ["alpha", "alpha", "beta"], // steps 0 and 1 share the same cue word → same time
    }],
  };
  const alignment = {
    duration: 3,
    sentences: [{ scene: "s1", start: 0.5, end: 3 }],
    words: [
      { scene: "s1", w: "alpha", start: 1.0, end: 1.4 }, // matched by both step 0 and step 1
      { scene: "s1", w: "beta",  start: 2.0, end: 2.4 }, // cue for step 2
    ],
  };
  const fmt = resolveFormat({ archetype: "diagram" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  const flow = t.scenes.find((s) => s.template === "flow");
  assert.equal(flow.reveals.length, 3, "one reveal per step");
  // steps 0 and 1 both resolved to the same second — equal is ok, neither should be pushed later
  assert.equal(flow.reveals[0].at_seconds, flow.reveals[1].at_seconds, "equal-time reveals stay equal");
  assert.ok(flow.reveals[2].at_seconds >= flow.reveals[1].at_seconds, "step 2 is non-decreasing");
});

test("buildTimeline clamp: single-element reveals are untouched (no predecessor to compare against)", () => {
  // A scene with exactly one item must not have its reveal altered by the clamp loop (which starts at i=1).
  const script = { archetype: "diagram", scenes: [{ id: "s1", sentences: ["alpha"] }] };
  const plan = {
    id: "x",
    scenes: [{
      scene_id: "s1", template: "flow",
      props: { title: "T", steps: [{ label: "only" }] },
      cueWords: ["alpha"],
    }],
  };
  const alignment = {
    duration: 2,
    sentences: [{ scene: "s1", start: 1.0, end: 2 }],
    words: [{ scene: "s1", w: "alpha", start: 1.0, end: 1.5 }],
  };
  const fmt = resolveFormat({ archetype: "diagram" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  const flow = t.scenes.find((s) => s.template === "flow");
  assert.equal(flow.reveals.length, 1, "single-item scene gets exactly one reveal");
  // The reveal time must equal snap(1.0) — the clamp loop (starting at i=1) never executes on length=1
  const introFrames = timings.introFrames;
  const expected = (introFrames + Math.round(1.0 * fps)) / fps;
  assert.equal(flow.reveals[0].at_seconds, expected, "single reveal is the snapped cue time, not clamped");
});

test("buildTimeline caption cues are timed word groups in absolute seconds (<= max_words each)", () => {
  const t = fixtureTimeline();
  assert.ok(t.captions.length > 0);
  for (const cue of t.captions) {
    assert.ok(cue.words.length >= 1 && cue.words.length <= 7, "<= max_words per chunk");
    assert.equal(cue.start_seconds, cue.words[0].start_seconds);
    assert.equal(cue.end_seconds, cue.words.at(-1).end_seconds);
    for (const w of cue.words) assert.ok(w.end_seconds >= w.start_seconds);
  }
});

test("buildTimeline upper-cases a standalone 'ai' token in caption copy only", () => {
  // synthesise a tiny input with an 'ai' word to prove the display-casing lives in the timeline
  const script = { archetype: "ideas", scenes: [{ id: "s1", sentences: ["x"] }] };
  const plan = { id: "x", scenes: [{ scene_id: "s1", template: "section-header", props: { title: "x" } }] };
  const alignment = {
    duration: 1, sentences: [{ scene: "s1", start: 0, end: 1 }],
    words: [{ scene: "s1", w: "ai", start: 0, end: 0.5 }, { scene: "s1", w: "rocks", start: 0.5, end: 1 }],
  };
  const fmt = resolveFormat({ archetype: "ideas" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  assert.equal(t.captions[0].words[0].w, "AI", "'ai' is displayed as AI in captions");
});

// 024 Short (2026-10-09): with no intro bumper the first scene must own frame 0. Snapping it to the first
// WORD would leave the few frames of edge-tts lead-in as an empty background before the hook appears.
test("buildTimeline with intro 0: the first scene starts at frame 0, the rest still snap to their words", () => {
  const script = readFixture("script.json");
  const plan = readFixture("scene-plan.json");
  // a real edge-tts track has ~0.1s of lead-in before the first word; the fixture's starts at 0
  const raw = readFixture("alignment.json");
  const shift = (o) => ({ ...o, start: o.start + 0.1, end: o.end + 0.1 });
  const alignment = { ...raw, duration: raw.duration + 0.1, sentences: raw.sentences.map(shift), words: (raw.words ?? []).map(shift) };
  const fmt = resolveFormat({ archetype: script.archetype, format_recipe: { intro: { long_seconds: 0 } } });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  assert.equal(timings.introFrames, 0);
  const t = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
  assert.ok(alignment.sentences[0].start > 0, "precondition: the fixture's first word is not at 0");
  assert.equal(t.scenes[0].start_seconds, 0, "the hook is on screen from the first frame");
  assert.equal(t.audio.start_seconds, 0, "narration starts at 0 too — it is never shifted");
  assert.equal(t.scenes[1].start_seconds, Math.round(t.scenes[1].start_seconds * fps) / fps);
  const withIntro = resolveFormat({ archetype: script.archetype, format_recipe: { intro: { long_seconds: 1.5 } } });
  const tIntro = buildTimeline({ script, plan, alignment, fmt: withIntro, timings: deriveRenderTimings(withIntro, { fps, vertical: false }), fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
  assert.equal(tIntro.scenes[0].start_seconds, (45 + Math.round(0.1 * fps)) / fps, "with an intro, scene 0 still snaps to its first word (unchanged)");
});

// 024 Short (2026-10-09): a key take must be its OWN caption — "chat finally said ankara learning /
// rewrites the" split the take across two chunks and glued it to the line before. Key takes always break
// at their sentence edges; format.captions.sentence_breaks breaks at every sentence (default off).
function captionTimeline({ keyTakes, sentenceBreaks }) {
  const script = {
    id: "x", archetype: "ideas", scenes: [{ id: "s1", template: "hook-card", sentences: ["one two three.", "four five.", "six seven."], ...(keyTakes ? { key_takes: keyTakes } : {}) }],
  };
  const ws = ["one", "two", "three", "four", "five", "six", "seven"];
  const words = ws.map((w, i) => ({ scene: "s1", w, start: 0.1 + i * 0.4 + (i >= 3 ? 0.1 : 0) + (i >= 5 ? 0.1 : 0), end: 0.4 + i * 0.4 + (i >= 3 ? 0.1 : 0) + (i >= 5 ? 0.1 : 0) }));
  const alignment = {
    duration: 3.5, words,
    sentences: [
      { scene: "s1", index: 0, text: "one two three.", start: words[0].start, end: words[2].end },
      { scene: "s1", index: 1, text: "four five.", start: words[3].start, end: words[4].end },
      { scene: "s1", index: 2, text: "six seven.", start: words[5].start, end: words[6].end },
    ],
  };
  const plan = { scenes: [{ scene_id: "s1", template: "hook-card", props: { title: "T" } }] };
  // explicit either way: the default flipped to true at D-068
  const fmt = resolveFormat({ archetype: "ideas", format_recipe: { captions: { sentence_breaks: !!sentenceBreaks } } });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  return buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
}
const chunks = (t) => t.captions.map((c) => c.words.map((w) => w.w).join(" "));

test("captions: without key takes or the knob, chunks still span sentences (unchanged behaviour)", () => {
  assert.deepEqual(chunks(captionTimeline({})), ["one two three four five six seven"]);
});

test("captions: a key take is its own chunk — it breaks before and after the take", () => {
  assert.deepEqual(chunks(captionTimeline({ keyTakes: [1] })), ["one two three", "four five", "six seven"]);
});

test("captions: format.captions.sentence_breaks breaks at every sentence", () => {
  assert.deepEqual(chunks(captionTimeline({ sentenceBreaks: true })), ["one two three", "four five", "six seven"]);
});

test("captions: with sentence edges, a long sentence splits into EVEN chunks — never a one-word orphan", () => {
  const ws = "it will never remember what you told it".split(" ");
  const words = ws.map((w, i) => ({ scene: "s1", w, start: 0.1 + i * 0.3, end: 0.35 + i * 0.3 }));
  const script = { id: "x", archetype: "ideas", scenes: [{ id: "s1", template: "hook-card", sentences: [ws.join(" ") + "."], key_takes: [0] }] };
  const alignment = { duration: 3, words, sentences: [{ scene: "s1", index: 0, text: "x", start: words[0].start, end: words.at(-1).end }] };
  const fmt = resolveFormat({ archetype: "ideas" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan: { scenes: [{ scene_id: "s1", template: "hook-card", props: {} }] }, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  assert.equal(timings.captions.maxWords, 7, "precondition: 8 words would greedily split 7 + 1");
  assert.deepEqual(chunks(t), ["it will never remember", "what you told it"]);
});

test("captions: a sentence splits at its own punctuation when one is near the middle", () => {
  const text = "Fixed the same thing twice? Write it down.";
  const ws = ["fixed", "the", "same", "thing", "twice", "write", "it", "down"];
  const words = ws.map((w, i) => ({ scene: "s1", w, start: 0.1 + i * 0.3, end: 0.35 + i * 0.3 }));
  const script = { id: "x", archetype: "ideas", scenes: [{ id: "s1", template: "hook-card", sentences: [text], key_takes: [0] }] };
  const alignment = { duration: 3, words, sentences: [{ scene: "s1", index: 0, text, start: words[0].start, end: words.at(-1).end }] };
  const fmt = resolveFormat({ archetype: "ideas" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const t = buildTimeline({ script, plan: { scenes: [{ scene_id: "s1", template: "hook-card", props: {} }] }, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  assert.deepEqual(chunks(t), ["fixed the same thing twice", "write it down"]);
});
