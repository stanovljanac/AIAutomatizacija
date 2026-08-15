// D-063 sound design — a bed + one-shot sfx mixed alongside the narration. Two things must hold:
// a plan with no `audio` block produces exactly the timeline/props it produced before (this is the
// whole install base), and a cue authored on the narration clock lands on the frame it was written
// for. A cue that drifts is worse than no cue at all — an impact half a beat off reads as a mistake.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFixture, assertValid } from "../shared/testkit/index.mjs";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { buildTimeline } from "./lib/timeline.mjs";
import { compileTimeline, copyRemotionAssets } from "./compile-remotion.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const fps = 30;

function build(planPatch) {
  const script = readFixture("script.json");
  const plan = { ...readFixture("scene-plan.json"), ...planPatch };
  const alignment = readFixture("alignment.json");
  const brief = readFixture("brief.json");
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  return buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
}

test("a plan with no audio block emits NO audio_layers key (pre-D-063 shape preserved)", () => {
  const t = build({});
  assert.equal("audio_layers" in t, false);
  assertValid(t, "timeline.json");
  const props = compileTimeline(t, { leadFrames: 0, tailSeconds: 0 });
  assert.equal("bed" in props, false);
  assert.equal("sfx" in props, false);
});

test("a bed + sfx compile into a schema-valid timeline", () => {
  const t = build({ audio: { bed: { src: "bed-low.mp3", gain: 0.05 }, sfx: [{ src: "riser.mp3", atSeconds: 2 }] } });
  assertValid(t, "timeline.json");
  assert.equal(t.audio_layers.bed.src, "bed-low.mp3");
  assert.equal(t.audio_layers.bed.gain, 0.05);
  assert.equal(t.audio_layers.sfx.length, 1);
});

test("an sfx cue authored on the narration clock lands on the same absolute frame as narration + atSeconds", () => {
  const at = 2.0;
  const t = build({ audio: { sfx: [{ src: "impact.mp3", atSeconds: at }] } });
  // the narration clock starts at the intro, so cue frame == intro frames + round(at * fps)
  const introFrames = Math.round(t.intro.duration_seconds * fps);
  const props = compileTimeline(t, { leadFrames: 0, tailSeconds: 0 });
  assert.equal(props.sfx[0].fromFrame, introFrames + Math.round(at * fps));
  assert.equal(props.sfx[0].fromFrame, Math.round(t.audio_layers.sfx[0].at_seconds * fps));
});

test("cue times are frame-snapped, so a cue written between frames cannot land off-grid", () => {
  const t = build({ audio: { sfx: [{ src: "impact.mp3", atSeconds: 2.0166 }] } });
  const exact = t.audio_layers.sfx[0].at_seconds * fps;
  assert.ok(Math.abs(exact - Math.round(exact)) < 1e-9, `${exact} is not a whole frame`);
});

test("gains default sensibly — the bed stays quiet under a -16 LUFS voice, a one-shot does not", () => {
  const t = build({ audio: { bed: { src: "bed.mp3" }, sfx: [{ src: "impact.mp3", atSeconds: 1 }] } });
  assert.equal(t.audio_layers.bed.gain, 0.08);
  assert.equal(t.audio_layers.sfx[0].gain, 0.6);
});

test("an authored gain is never overridden by the default", () => {
  const t = build({ audio: { bed: { src: "bed.mp3", gain: 0 }, sfx: [{ src: "s.mp3", atSeconds: 1, gain: 0.25 }] } });
  assert.equal(t.audio_layers.bed.gain, 0);
  assert.equal(t.audio_layers.sfx[0].gain, 0.25);
});

test("a bed alone, or sfx alone, each emit only their own key", () => {
  const bedOnly = build({ audio: { bed: { src: "b.mp3" } } });
  assert.equal("sfx" in bedOnly.audio_layers, false);
  const sfxOnly = build({ audio: { sfx: [{ src: "s.mp3", atSeconds: 1 }] } });
  assert.equal("bed" in sfxOnly.audio_layers, false);
  const empty = build({ audio: { sfx: [] } });
  assert.equal("audio_layers" in empty, false, "an empty sfx list is the same as no sound design");
});

/** A throwaway repo/content root with a stub narration, so copyRemotionAssets can run end to end. */
function stubRoot(sfxFiles = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sfx-"));
  fs.mkdirSync(path.join(dir, "voice"), { recursive: true });
  fs.writeFileSync(path.join(dir, "voice", "narration.mp3"), "FAKEAUDIO");
  if (sfxFiles.length) fs.mkdirSync(path.join(dir, "assets", "sfx"), { recursive: true });
  for (const f of sfxFiles) fs.writeFileSync(path.join(dir, "assets", "sfx", f), `FAKE_${f}`);
  return dir;
}

test("copyRemotionAssets stages every sfx + the bed into public/sfx and rewrites their src", () => {
  const dir = stubRoot(["riser.mp3", "impact.mp3", "bed.mp3"]);
  const props = {
    scenes: [],
    captions: [],
    bed: { src: "bed.mp3", gain: 0.05 },
    sfx: [{ src: "riser.mp3", fromFrame: 100, gain: 0.5 }, { src: "impact.mp3", fromFrame: 200, gain: 0.7 }],
  };
  const warnings = copyRemotionAssets({ root: dir, cdir: dir, outId: "test", props });
  assert.deepEqual(warnings, []);
  assert.equal(props.bed.src, "sfx/bed.mp3");
  assert.deepEqual(props.sfx.map((c) => c.src), ["sfx/riser.mp3", "sfx/impact.mp3"]);
  for (const f of ["riser.mp3", "impact.mp3", "bed.mp3"]) {
    assert.ok(fs.existsSync(path.join(dir, "templates/remotion/public/sfx", f)), `${f} staged`);
  }
});

test("a missing sfx file warns and DROPS the cue — sound design never kills a render", () => {
  const dir = stubRoot(["riser.mp3"]);
  const props = {
    scenes: [],
    captions: [],
    bed: { src: "nope-bed.mp3" },
    sfx: [{ src: "riser.mp3", fromFrame: 10 }, { src: "nope.mp3", fromFrame: 20 }],
  };
  const warnings = copyRemotionAssets({ root: dir, cdir: dir, outId: "test", props });
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every((w) => /sfx missing/.test(w)));
  assert.equal(props.sfx.length, 1, "only the resolvable cue survives");
  assert.equal(props.sfx[0].src, "sfx/riser.mp3");
  assert.equal("bed" in props, false, "an unresolvable bed is removed, not left pointing at nothing");
});

test("copyRemotionAssets touches nothing when a video has no sound design", () => {
  const dir = stubRoot();
  const props = { scenes: [], captions: [] };
  assert.deepEqual(copyRemotionAssets({ root: dir, cdir: dir, outId: "test", props }), []);
  assert.equal(fs.existsSync(path.join(dir, "templates/remotion/public/sfx")), false);
});

test("scene-plan schema accepts an audio block and rejects a malformed one", () => {
  const plan = readFixture("scene-plan.json");
  assertValid({ ...plan, audio: { bed: { src: "b.mp3", gain: 0.05 }, sfx: [{ src: "s.mp3", atSeconds: 3, gain: 0.4 }] } }, "scene-plan.json");
  assert.throws(() => assertValid({ ...plan, audio: { sfx: [{ src: "s.mp3" }] } }, "scene-plan.json"), /atSeconds/i);
  assert.throws(() => assertValid({ ...plan, audio: { bed: { src: "b.mp3", gain: 4 } } }, "scene-plan.json"), /gain|maximum/i);
});
