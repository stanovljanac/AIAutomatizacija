// V1 — the render timing/caption constants now come from the resolved FORMAT recipe and exactly
// reproduce the old hardcoded build-props values (behavior-preserving), a format knob flip
// propagates into the derived timings, and the real _FIXTURE brief resolves through the same path
// build-props uses.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { readJson } from "../shared/testkit/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, "..", "..", "content", "_FIXTURE");
const FPS = 30;

test("long-form timings reproduce the old hardcoded build-props constants", () => {
  const t = deriveRenderTimings(resolveFormat({}), { fps: FPS, vertical: false });
  assert.equal(t.introFrames, 45); // was Math.round(1.5*30)
  assert.equal(t.outroFrames, 75); // was Math.round(2.5*30)
  assert.equal(t.crossfadeFrames, 9);
  assert.equal(t.leadFrames, 7); // was Math.round(0.22*30) = round(6.6)
  assert.equal(t.captions.maxWords, 7);
  assert.equal(t.captions.gapSeconds, 0.7);
  assert.equal(t.captions.tailSeconds, 0.4);
  assert.deepEqual(t.shortLen, { min: 45, max: 120, target: 55 });
});

test("Short (vertical) intro/outro reproduce the old 1.2s band", () => {
  const t = deriveRenderTimings(resolveFormat({}), { fps: FPS, vertical: true });
  assert.equal(t.introFrames, 36); // was Math.round(1.2*30)
  assert.equal(t.outroFrames, 36);
});

test("a brief.format knob flip propagates into the derived timings", () => {
  const fmt = resolveFormat({
    format: { captions: { max_words: 5 }, intro: { long_seconds: 2 }, reveals: { lead_seconds: 0.5 } },
  });
  const t = deriveRenderTimings(fmt, { fps: FPS, vertical: false });
  assert.equal(t.captions.maxWords, 5);
  assert.equal(t.introFrames, 60); // 2.0 * 30
  assert.equal(t.leadFrames, 15); // 0.5 * 30
});

test("crossfade comes from the format when config has no override", () => {
  const fmt = resolveFormat({ format: { transition_frames: { crossfade: 12 } } });
  assert.equal(deriveRenderTimings(fmt, { fps: FPS, vertical: false }).crossfadeFrames, 12);
});

test("a different fps scales frame counts with the same rounding", () => {
  const t = deriveRenderTimings(resolveFormat({}), { fps: 60, vertical: false });
  assert.equal(t.introFrames, 90); // 1.5 * 60
  assert.equal(t.leadFrames, 13); // round(0.22*60) = round(13.2)
});

test("the format carries the no-empty-scene threshold knob (pacing.max_static_hold_seconds)", () => {
  assert.equal(resolveFormat({}).pacing.max_static_hold_seconds, 6); // mirrors the old hardcoded 6
});

test("the real _FIXTURE brief resolves through build-props' format path", () => {
  const brief = readJson(path.join(FIXTURE, "brief.json"));
  const script = readJson(path.join(FIXTURE, "script.json"));
  const fmt = resolveFormat({
    archetype: brief.archetype ?? script.archetype,
    series: brief.series,
    format: brief.format,
  });
  assert.ok(fmt.name, "resolved format has a name");
  const t = deriveRenderTimings(fmt, { fps: FPS, vertical: false });
  assert.ok(t.introFrames > 0 && t.outroFrames > 0);
});

// --- regression tests added by the V1 independent verifier ---

test("[verifier] crossfadeFrames is FPS-independent (specified in frames, not seconds)", () => {
  // crossfadeFrames must NOT scale with fps — it is already a frame count in the format.
  const fmt = resolveFormat({});
  const t30 = deriveRenderTimings(fmt, { fps: 30, vertical: false });
  const t60 = deriveRenderTimings(fmt, { fps: 60, vertical: false });
  assert.equal(t30.crossfadeFrames, 9);
  assert.equal(t60.crossfadeFrames, 9, "crossfadeFrames must not scale with fps");
  // intro/outro DO scale — confirm the pair is correct
  assert.equal(t60.introFrames, 90);
  assert.equal(t60.outroFrames, 150);
});

test("[verifier] deriveRenderTimings survives fmt with missing transition_frames (optional chain)", () => {
  // If a partial override omits transition_frames entirely, the fallback 9 must be returned.
  const fmtNoXf = {
    intro: { long_seconds: 1.5, short_seconds: 1.2 },
    outro: { long_seconds: 2.5, short_seconds: 1.2 },
    reveals: { lead_seconds: 0.22 },
    captions: { max_words: 7, gap_seconds: 0.7, tail_seconds: 0.4 },
    length: { short: { min: 45, max: 120, target: 55 } },
    // transition_frames intentionally absent
  };
  const t = deriveRenderTimings(fmtNoXf, { fps: 30, vertical: false });
  assert.equal(t.crossfadeFrames, 9, "fallback 9 must fire when transition_frames is missing");
});

test("[verifier] build-props config.render.crossfadeFrames override wins over format (fallback chain)", () => {
  // The build-props.mjs expression is: cfg.render?.crossfadeFrames ?? timings.crossfadeFrames
  // This unit-level test simulates that logic to document the expected priority order.
  const fmt = resolveFormat({ format: { transition_frames: { crossfade: 12 } } });
  const timings = deriveRenderTimings(fmt, { fps: 30, vertical: false });
  assert.equal(timings.crossfadeFrames, 12, "format value feeds timings.crossfadeFrames");

  // Simulate cfg.render.crossfadeFrames = 15 override (config wins over format)
  const configOverride = 15;
  const xf = configOverride ?? timings.crossfadeFrames;
  assert.equal(xf, 15, "config.render.crossfadeFrames must win over the format crossfadeFrames");

  // Simulate cfg.render.crossfadeFrames = undefined (format wins)
  const cfgUndefined = undefined;
  const xfFallback = cfgUndefined ?? timings.crossfadeFrames;
  assert.equal(xfFallback, 12, "undefined config must fall through to format crossfadeFrames");
});

test("[verifier] brief without brief.json (no-brief path) resolves from script.archetype, no crash", () => {
  // build-props.mjs: const brief = existsSync(brief.json) ? ... : {};
  //                  resolveFormat({ archetype: brief.archetype ?? script.archetype, ... })
  // When brief={}, brief.archetype is undefined, so script.archetype is used.
  const scriptArchetype = "ideas"; // same as _FIXTURE
  const fmt = resolveFormat({ archetype: undefined ?? scriptArchetype, series: undefined, format: undefined });
  assert.ok(fmt.name, "no-brief path must resolve a valid format");
  const t = deriveRenderTimings(fmt, { fps: FPS, vertical: false });
  assert.equal(t.introFrames, 45, "no-brief path must yield the default intro band");
});
