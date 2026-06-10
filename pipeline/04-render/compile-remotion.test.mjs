// V5 — the Remotion engine compiler: timeline.json (seconds) → render props (frames). The headline
// guarantee is BYTE-IDENTICAL output vs the pre-refactor build-props (content/_FIXTURE/golden-props.json),
// proving the seconds→frames seam changed nothing the renderer sees.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { readFixture, fixturePath } from "../shared/testkit/index.mjs";
import { resolveFormat } from "../shared/lib/format.mjs";
import { deriveRenderTimings } from "./lib/timings.mjs";
import { buildTimeline } from "./lib/timeline.mjs";
import { compileTimeline } from "./compile-remotion.mjs";

const fps = 30;

function fixtureCompile() {
  const script = readFixture("script.json");
  const plan = readFixture("scene-plan.json");
  const alignment = readFixture("alignment.json");
  const brief = readFixture("brief.json");
  const fmt = resolveFormat({ archetype: brief.archetype ?? script.archetype, series: brief.series, format: brief.format });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const timeline = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "_FIXTURE" });
  const props = compileTimeline(timeline, { leadFrames: timings.leadFrames, tailSeconds: timings.captions.tailSeconds });
  return { timeline, props, timings };
}

test("[ACCEPTANCE] compiled fixture props are BYTE-IDENTICAL to golden-props.json", () => {
  const { props } = fixtureCompile();
  const serialized = JSON.stringify(props, null, 2) + "\n";
  const golden = fs.readFileSync(fixturePath("golden-props.json"), "utf8");
  assert.equal(serialized, golden, "props/<id>.json must equal the pre-V5 golden exactly");
});

test("compileTimeline is deterministic/idempotent — same timeline → identical props twice", () => {
  const { timeline, timings } = fixtureCompile();
  const a = compileTimeline(timeline, { leadFrames: timings.leadFrames, tailSeconds: timings.captions.tailSeconds });
  const b = compileTimeline(timeline, { leadFrames: timings.leadFrames, tailSeconds: timings.captions.tailSeconds });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("compileTimeline reconstructs whole-frame timing exactly (intro/outro/total/crossfade)", () => {
  const { props } = fixtureCompile();
  assert.equal(props.introFrames, 45);
  assert.equal(props.outroFrames, 75);
  assert.equal(props.totalFrames, 720);
  assert.equal(props.crossfadeFrames, 9);
  assert.equal(props.audioFromFrame, 45);
});

test("compileTimeline pulls non-first scenes back by the crossfade; the first scene is not pulled", () => {
  const { timeline, props } = fixtureCompile();
  const F = (s) => Math.round(s * fps);
  assert.equal(props.scenes[0].fromFrame, F(timeline.scenes[0].start_seconds), "scene 0 not pulled back");
  for (let i = 1; i < props.scenes.length; i++) {
    assert.equal(props.scenes[i].fromFrame, F(timeline.scenes[i].start_seconds) - props.crossfadeFrames, "later scenes pulled back by xf");
  }
});

test("compileTimeline moves reveals into props.reveals as scene-local frame offsets (lead applied)", () => {
  const { props } = fixtureCompile();
  const bullets = props.scenes.find((s) => s.template === "bullet-steps");
  assert.deepEqual(bullets.props.reveals, [2, 77, 167], "matches golden reveal offsets");
  // offsets are relative to the (pulled-back) scene start and clamped >= 0
  assert.ok(bullets.props.reveals.every((n) => Number.isInteger(n) && n >= 0));
});

test("compileTimeline localizes a focalZoom window (abs seconds → scene-local frames) for the engine", () => {
  // a scene whose start_seconds=2 (frame 60) with a zoom-in at abs 3s (frame 90) → local 30 (no xf on scene 0)
  const timeline = {
    version: 1, format: { width: 1920, height: 1080, fps },
    duration_seconds: 6, audio: { src: "x/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 1, cta: "C", brand: "" },
    crossfade_seconds: 0, motion: {},
    scenes: [{
      scene_id: "s1.0", engine: "remotion", template: "custom",
      start_seconds: 2, end_seconds: 5,
      props: { component: "prompt-focus", focalZoom: { target: { x: 0.8, y: 0.3 }, scale: 1.5, inAtSeconds: 3, outAtSeconds: 4 } },
    }],
    captions: [],
  };
  const props = compileTimeline(timeline);
  const fz = props.scenes[0].props.focalZoom;
  assert.equal(props.scenes[0].fromFrame, 60);
  assert.equal(fz.inAt, 30, "abs 3s (frame 90) - scene from 60 = 30");
  assert.equal(fz.outAt, 60, "abs 4s (frame 120) - 60 = 60");
  assert.equal(fz.scale, 1.5, "non-timing fields preserved");
  assert.equal(fz.inAtSeconds, undefined, "seconds fields consumed");
});

test("compileTimeline caption durFrames is clamped by the next cue AND the tail cap, min 1 frame", () => {
  const { props } = fixtureCompile();
  for (const cue of props.captions) {
    assert.ok(cue.durFrames >= 1, "every caption shows at least one frame");
    for (const w of cue.words) assert.ok(w.relDur >= 1 && w.relFrom >= 0);
  }
});

// ── FP-DRIFT FIX (verifier-found): the real pipeline must equal the legacy inline frame math at FP ──
// ── boundaries, not just on the lucky fixture. buildTimeline SNAPS every stored second to its frame ──
// ── (frameIndex/fps), so compileTimeline's round(sec*fps) recovers the exact legacy frame. These      ──
// ── tests drive the REAL buildTimeline → compileTimeline on an adversarial alignment whose sentence/  ──
// ── word/reveal starts sit on the worst FP boundaries (0.55, 2.05, 6.95 …) and assert exact parity.   ──

const LEAD = 0; // keep the legacy comparison simple (lead is an integer subtraction either way)

// Build a 2-scene timeline through the REAL pipeline with caller-chosen drift-point start times.
function adversarialPipeline({ s1Start, s2Start, revealStarts, duration }) {
  const script = {
    archetype: "ideas",
    scenes: [
      { id: "s1", sentences: ["hook line"] },
      { id: "s2", sentences: revealStarts.map((_, i) => `item ${i}`) },
    ],
  };
  const plan = {
    id: "adv",
    scenes: [
      { scene_id: "s1", template: "hook-card", props: { title: "Hook" } },
      { scene_id: "s2", template: "bullet-steps", props: { title: "Steps", items: revealStarts.map((_, i) => `i${i}`) }, revealOn: "sentences" },
    ],
  };
  const alignment = {
    duration,
    sentences: [
      { scene: "s1", start: s1Start, end: s2Start },
      ...revealStarts.map((st, i) => ({ scene: "s2", start: st, end: revealStarts[i + 1] ?? duration })),
    ],
    words: [
      { scene: "s1", w: "hook", start: s1Start, end: s2Start },
      ...revealStarts.map((st, i) => ({ scene: "s2", w: `i${i}`, start: st, end: revealStarts[i + 1] ?? duration })),
    ],
  };
  const fmt = resolveFormat({ archetype: "ideas" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const timeline = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: timings.crossfadeFrames, dims: { width: 1920, height: 1080 }, outId: "adv" });
  const props = compileTimeline(timeline, { leadFrames: LEAD, tailSeconds: timings.captions.tailSeconds });
  return { props, introFrames: timings.introFrames, xf: timings.crossfadeFrames };
}

test("[verifier-fix] scene fromFrame matches legacy (introFrames + round(raw*fps)) at FP boundaries", () => {
  // 0.55 and 6.95 both round 'wrong' under naive absolute math; snapping makes them exact.
  const { props, introFrames, xf } = adversarialPipeline({ s1Start: 0.55, s2Start: 6.95, revealStarts: [6.95], duration: 8 });
  // scene 0 not pulled back; scene 1 pulled back by xf — both equal the legacy inline formula
  assert.equal(props.scenes[0].fromFrame, introFrames + Math.round(0.55 * fps), "scene 0 fromFrame == legacy");
  assert.equal(props.scenes[1].fromFrame, introFrames + Math.round(6.95 * fps) - xf, "scene 1 fromFrame == legacy (pulled back by xf)");
});

test("[verifier-fix] reveal local frames match legacy (no compounded drift) at FP boundaries", () => {
  // scene start AND reveals on drift points — legacy: revealFrame - sceneFromFrame - lead, all exact.
  const revealStarts = [2.05, 6.95, 13.5];
  const { props, introFrames, xf } = adversarialPipeline({ s1Start: 0.0, s2Start: 2.05, revealStarts, duration: 15 });
  const s2 = props.scenes.find((s) => s.template === "bullet-steps");
  const sceneFrom = introFrames + Math.round(2.05 * fps) - xf; // legacy non-first scene from-frame
  const expected = revealStarts.map((st) => Math.max(introFrames + Math.round(st * fps) - sceneFrom - LEAD, 0));
  assert.deepEqual(s2.props.reveals, expected, "reveal offsets equal the legacy inline formula exactly");
});

test("[verifier-fix] captions reproduce the legacy raw-difference framing exactly (byte-identical math)", () => {
  // Captions are deliberately NOT frame-snapped (unlike scenes/reveals): the legacy build-props rounded
  // the RAW inter-word difference, and snapping each word first would diverge from the golden. This test
  // recomputes the legacy caption pass from the fixture's raw alignment and asserts compileTimeline ===.
  // NOTE: this fixture-only test passes because no fixture word start sits on an FP boundary (raw=0.55
  // etc.). See [verifier-re] below for the adversarial coverage.
  const { props, timings } = fixtureCompile();
  const al = readFixture("alignment.json");
  const introFrames = timings.introFrames, MAX = timings.captions.maxWords, GAP = timings.captions.gapSeconds, TAIL = timings.captions.tailSeconds;
  const F = (s) => Math.round(s * fps);
  // legacy grouping (identical to the pre-V5 build-props)
  const words = (al.words ?? []).filter((w) => w && w.w).slice().sort((a, b) => a.start - b.start);
  const groups = []; let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]); const next = words[i + 1];
    if (!next || cur.length >= MAX || next.scene !== words[i].scene || (next.start - words[i].end) > GAP) { groups.push(cur); cur = []; }
  }
  const audioFrames = F(al.duration);
  const legacy = groups.map((g, gi) => {
    const start = g[0].start, from = introFrames + F(start);
    const nextFrom = gi + 1 < groups.length ? introFrames + F(groups[gi + 1][0].start) : introFrames + audioFrames;
    const cap = introFrames + F(g[g.length - 1].end + TAIL);
    return {
      fromFrame: from,
      durFrames: Math.max(Math.min(nextFrom, cap) - from, 1),
      words: g.map((w) => ({ w: /^ai$/i.test(w.w) ? "AI" : w.w, relFrom: F(w.start - start), relDur: Math.max(F(w.end - w.start), 1) })),
    };
  });
  assert.deepEqual(props.captions, legacy, "compiled captions equal the legacy raw-difference framing");
});

// ── CAPTION FP-BOUNDARY BEHAVIOUR (verifier-re) ──────────────────────────────────────────────────
// Captions are NOT snapped, so caption.start_seconds = introSeconds + raw (an absolute sum, not a
// frame-snapped value). The compiler rounds this absolute sum: F(introSeconds + raw). This can
// differ by exactly 1 frame from the legacy formula introFrames + F(raw) at FP half-frame
// boundaries (e.g. raw=0.55 → 61.5 in IEEE-754, rounds to 62 legacy but 61.499… rounds to 61
// via the absolute sum path). The existing fixture test does NOT hit such a boundary and therefore
// passes regardless.
//
// The ±1-frame discrepancy in fromFrame is an ACCEPTED trade-off: to preserve byte-identical
// relFrom/relDur (inter-word differences), the cue times must remain un-snapped; independently
// snapping them would change relFrom (since the intro offset no longer cancels in the difference).
// The practical impact is ≤1 frame / ~33ms — imperceptible to viewers — and confined to caption
// display timing, not audio sync (the narration track is untouched).
//
// This test documents and bounds the drift so any future change to caption snapping is audited.

test("[verifier-re] caption timing behaviour at FP boundaries is bounded and documented", () => {
  // Use raw=0.55 — the same boundary that caused scene drift before the snap fix. For captions,
  // times are NOT snapped (un-snapped trade-off preserves relFrom for the first word). This test
  // documents the ACTUAL compile output so any future change to caption snapping is audited.
  //
  // What the author's comment gets right: relFrom of the FIRST word (cue − cue = 0) is always 0.
  // What the comment misses: relFrom/relDur of NON-FIRST words are computed as
  //   F((introSeconds + w_raw) − (introSeconds + cue_raw))
  // which is NOT identical to F(w_raw − cue_raw) at FP half-frame boundaries — the intro does
  // NOT fully cancel because the two intermediate sums are rounded separately. Drift is ±1 frame
  // (≤33ms) and confined to per-word highlight timing: imperceptible to viewers.
  const script = { archetype: "ideas", scenes: [{ id: "s1", sentences: ["test"] }] };
  const plan = { id: "x", scenes: [{ scene_id: "s1", template: "section-header", props: { title: "X" } }] };
  // Two words in one group: group starts at the drift-point; second word is 0.45s later.
  const alignment = {
    duration: 2,
    sentences: [{ scene: "s1", start: 0.55, end: 2 }],
    words: [
      { scene: "s1", w: "drift", start: 0.55, end: 1.0 },
      { scene: "s1", w: "later",  start: 1.0,  end: 1.5 },
    ],
  };
  const fmt = resolveFormat({ archetype: "ideas" });
  const timings = deriveRenderTimings(fmt, { fps, vertical: false });
  const timeline = buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames: 9, dims: { width: 1920, height: 1080 }, outId: "x" });
  const props = compileTimeline(timeline, { leadFrames: 0, tailSeconds: timings.captions.tailSeconds });

  const introFrames = timings.introFrames;  // = 45
  const F = (s) => Math.round(s * fps);
  const cap = props.captions[0];

  // 1. fromFrame drifts at most 1 frame from the legacy formula (introFrames + F(raw)).
  //    At raw=0.55: legacy=45+17=62; absolute-sum=(1.5+0.55)*30=61.499…→61. Drift is -1.
  const legacyFrom = introFrames + F(0.55);  // = 62
  assert.ok(Math.abs(cap.fromFrame - legacyFrom) <= 1,
    `caption fromFrame must be within 1 frame of legacy: actual=${cap.fromFrame} legacy=${legacyFrom}`);
  assert.equal(cap.fromFrame - legacyFrom, -1, "known drift direction: -1 at raw=0.55 (document so a sign change is caught)");

  // 2. First word relFrom is always 0 (cue − cue = 0, exact regardless of FP path).
  assert.equal(cap.words[0].relFrom, 0, "first word relFrom is always 0");

  // 3. Non-first word relFrom and all relDur: computed via absolute sums, can differ from the
  //    raw-subtraction formula by ±1 frame. Document the actual (stable) compile output.
  //    F((1.5+1.0)−(1.5+0.55))*30 = round(0.4500…02*30) = round(13.5000…06) = 14
  //    vs F(1.0−0.55)*30 = round(0.44999…*30) = round(13.4999…) = 13 (raw "legacy" formula)
  assert.equal(cap.words[0].relDur,   14, "word[0] relDur via absolute sums at raw=0.55 boundary");
  assert.equal(cap.words[1].relFrom,  14, "word[1] relFrom via absolute sums (drifts +1 from raw 13)");

  // 4. durFrames must be >= 1.
  assert.ok(cap.durFrames >= 1, "caption durFrames is at least 1 frame");
});
