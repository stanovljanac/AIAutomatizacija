// D-060 — the scene BOUNDARY policy. The headline guarantees:
//   1. SYNC IS SAFE: every window ENDS on its alignment mark, whatever the authored transitions.
//   2. OVERLAP ⇔ STYLE: windows abut for cut/match/morph/carry, overlap by xf for dissolve/push.
//   3. THE ONE BEHAVIOR CHANGE: reveals[0] loses its lead runway under a cut (physics — you cannot
//      animate an element in before its scene exists). Pinned to the exact frame count below.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRANSITION_STYLES, BLENDED, overlapFrames, sceneWindow } from "./transitions.mjs";
import { compileTimeline } from "../compile-remotion.mjs";

const fps = 30;
const XF = 9;
const F = (s) => Math.round(s * fps);

/** A 4-scene timeline; every scene's transition_out is caller-chosen (undefined = unauthored). */
function timelineOf(styles) {
  return {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 20,
    audio: { src: "x/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 2.5, cta: "C", brand: "" },
    crossfade_seconds: XF / fps,
    motion: {},
    scenes: [
      { scene_id: "s1.0", template: "hook-card", start_seconds: 1.5, end_seconds: 5, props: { title: "A" } },
      // reveals[0] lands ON the scene start — the realistic case (the first element enters with the
      // scene's first sentence) and the one the golden fixture exercises.
      { scene_id: "s2.0", template: "bullet-steps", start_seconds: 5, end_seconds: 9, props: { title: "B", items: ["a", "b", "c"] }, reveals: [{ at_seconds: 5 }, { at_seconds: 7 }, { at_seconds: 8 }] },
      { scene_id: "s3.0", template: "diagram", start_seconds: 9, end_seconds: 14, props: { title: "C" } },
      { scene_id: "s4.0", template: "cta-card", start_seconds: 14, end_seconds: 17.5, props: { title: "D" } },
    ].map((sc, i) => (styles[i] === undefined ? sc : { ...sc, transition_out: styles[i] })),
    captions: [],
  };
}

// ── overlapFrames ────────────────────────────────────────────────────────────────────────────────

test("overlapFrames: only dissolve/push blend; cut and the authorial styles abut", () => {
  assert.equal(overlapFrames("dissolve", XF), XF);
  assert.equal(overlapFrames("push", XF), XF);
  for (const style of ["cut", "match", "morph", "carry"]) {
    assert.equal(overlapFrames(style, XF), 0, `${style} must compile to a hard cut (overlap 0)`);
  }
});

test("overlapFrames: an unauthored boundary is a CUT (the default is the whole point of D-060)", () => {
  assert.equal(overlapFrames(undefined, XF), 0);
  assert.equal(overlapFrames(null, XF), 0);
});

test("every BLENDED style is a declared style, and match/morph/carry are deliberately NOT blended", () => {
  for (const s of BLENDED) assert.ok(TRANSITION_STYLES.includes(s), `${s} must be in the enum`);
  assert.deepEqual([...BLENDED].sort(), ["dissolve", "push"]);
});

// ── sceneWindow: the k=0 / k=n-1 asymmetry ───────────────────────────────────────────────────────

test("sceneWindow k=0: never pulled back, but still fades IN at xf (it blends out of the intro bumper)", () => {
  const tl = timelineOf(["dissolve", "cut", "cut", "cut"]);
  const w = sceneWindow(tl, 0);
  assert.equal(w.fromFrame, F(1.5), "the first scene has no predecessor to pull back into");
  assert.equal(w.fadeIn, XF, "the intro bumper is extended forward by xf and cross-blends with scene 0");
  assert.equal(w.styleIn, "cut", "there is no incoming boundary — reported as a cut");
  assert.equal(w.fadeOut, XF, "its own authored dissolve");
});

test("sceneWindow k=n-1: fades OUT at xf REGARDLESS of the authored value (outro bumper wins)", () => {
  for (const authored of ["cut", "match", "dissolve"]) {
    const tl = timelineOf(["cut", "cut", "cut", authored]);
    const w = sceneWindow(tl, tl.scenes.length - 1);
    assert.equal(w.fadeOut, XF, `last scene always cross-blends with the outro (authored: ${authored})`);
    assert.equal(w.styleOut, authored, "the authored value is still REPORTED (build-props warns on it)");
  }
});

test("sceneWindow: the pull-back comes from the PREVIOUS scene's exit, not the scene's own", () => {
  const tl = timelineOf(["dissolve", "cut", "cut", "cut"]);
  const w = sceneWindow(tl, 1);
  assert.equal(w.fromFrame, F(5) - XF, "s2 is pulled back because s1 authored a dissolve");
  assert.equal(w.styleIn, "dissolve");
  assert.equal(w.fadeIn, XF, "the fade-in matches the overlap it was given");
  assert.equal(w.fadeOut, 0, "its own exit is a cut → no fade-out");
});

// ── SYNC: the guarantee that makes this change safe ──────────────────────────────────────────────

const MIXED = ["dissolve", "cut", "push", "match"];

test("[SYNC] every window ENDS exactly on its alignment mark, whatever the transitions", () => {
  for (const styles of [MIXED, ["cut", "cut", "cut", "cut"], ["dissolve", "dissolve", "dissolve", "dissolve"], [undefined, undefined, undefined, undefined]]) {
    const tl = timelineOf(styles);
    tl.scenes.forEach((sc, k) => {
      const w = sceneWindow(tl, k);
      assert.equal(w.fromFrame + w.durFrames, F(sc.end_seconds), `window END must not move (${styles[k]} @ ${k})`);
    });
  }
});

test("[SYNC] a CUT window starts exactly on its alignment mark (no 300ms pre-roll ghost)", () => {
  const tl = timelineOf(["cut", "cut", "cut", "cut"]);
  tl.scenes.forEach((sc, k) => {
    assert.equal(sceneWindow(tl, k).fromFrame, F(sc.start_seconds));
  });
});

test("[OVERLAP ⇔ STYLE] windows abut for cut/match/morph/carry and overlap by xf for dissolve/push", () => {
  for (const style of TRANSITION_STYLES) {
    const tl = timelineOf([style, style, style, style]);
    const expected = BLENDED.has(style) ? XF : 0;
    for (let k = 0; k < tl.scenes.length - 1; k++) {
      const a = sceneWindow(tl, k);
      const b = sceneWindow(tl, k + 1);
      assert.equal(b.fromFrame, a.fromFrame + a.durFrames - expected, `${style}: overlap must be exactly ${expected}f at boundary ${k}`);
    }
  }
});

test("[SYNC] reveals[1..] are conserved vs the all-dissolve baseline; ONLY reveals[0] moves, by exactly leadFrames", () => {
  const lead = 7;
  const baseline = compileTimeline(timelineOf(["dissolve", "dissolve", "dissolve", "dissolve"]), { leadFrames: lead });
  const cuts = compileTimeline(timelineOf(["cut", "cut", "cut", "cut"]), { leadFrames: lead });

  const b = baseline.scenes[1]; // s2.0, the scene with reveals — pulled back by xf under dissolve
  const c = cuts.scenes[1];     // …and NOT pulled back under a cut

  // ABSOLUTE reveal time = fromFrame + local offset. It is invariant for every reveal that had runway.
  const absB = b.props.reveals.map((r) => r + b.fromFrame);
  const absC = c.props.reveals.map((r) => r + c.fromFrame);
  assert.deepEqual(absC.slice(1), absB.slice(1), "reveals[1..] land at the same absolute frame under either boundary");

  // reveals[0] is at frame 150, the scene start. Under a dissolve the window starts at 141, so the
  // reveal has room for its 7-frame lead (150-141-7 = 2 → abs 143... i.e. F(start)-lead). Under a cut
  // the window starts AT 150, so Math.max(150-150-7, 0) clamps to 0 → abs 150: exactly `lead` later.
  assert.equal(absB[0], F(5) - lead, "under a dissolve the lead has its full runway");
  assert.equal(absC[0], F(5), "under a cut the lead is clamped away — the reveal lands ON its word");
  assert.equal(absC[0] - absB[0], lead, "the one behavior change, pinned: reveals[0] moves later by exactly leadFrames");
  assert.equal(c.props.reveals[0], 0, "under a cut, the scene's OPENING STATE is the first reveal (storyboard skill teaches this)");
});

// ── backward compatibility ───────────────────────────────────────────────────────────────────────

test("a timeline with NO transition_out anywhere compiles to all cuts", () => {
  const tl = timelineOf([undefined, undefined, undefined, undefined]);
  const props = compileTimeline(tl);
  tl.scenes.forEach((sc, k) => {
    assert.equal(props.scenes[k].fromFrame, F(sc.start_seconds), "no pull-back anywhere");
    assert.equal(props.scenes[k].styleOut, "cut");
  });
  assert.equal(props.scenes[0].fadeIn, XF, "…except the intro blend, which is a bumper, not a scene cut");
  assert.equal(props.scenes[1].fadeIn, 0, "an inner cut has NO fade — SceneWrapper must bypass interpolate (black-flash risk)");
  assert.equal(props.scenes.at(-1).fadeOut, XF, "…and the outro blend");
});

test("crossfade_seconds:0 degrades to cuts everywhere, even where a dissolve is authored", () => {
  const tl = timelineOf(["dissolve", "dissolve", "dissolve", "dissolve"]);
  tl.crossfade_seconds = 0;
  tl.scenes.forEach((sc, k) => {
    const w = sceneWindow(tl, k);
    assert.equal(w.fromFrame, F(sc.start_seconds));
    assert.equal(w.fadeIn, 0);
  });
});

test("sceneWindow is pure — it never mutates the timeline", () => {
  const tl = timelineOf(MIXED);
  const snapshot = JSON.stringify(tl);
  tl.scenes.forEach((_, k) => sceneWindow(tl, k));
  assert.equal(JSON.stringify(tl), snapshot);
});
