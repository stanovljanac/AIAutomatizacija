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
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });
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
