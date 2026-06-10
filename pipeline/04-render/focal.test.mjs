// Step 3b — the motivated-motion resolver: cue words map to scene-local frames; absent cues fall
// back to numeric defaults; non-cue fields (target/scale/anchor) are preserved; pure (no mutation).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cueSeconds, resolveCueWindow, resolveCueWindowSeconds, localizeCueWindow } from "./lib/focal.mjs";

const WORDS = [
  { w: "Read", start: 1.0 },
  { w: "this", start: 1.3 },
  { w: "invoice", start: 1.6 },
  { w: "and", start: 2.0 },
  { w: "automate", start: 2.4 },
];
const CTX = { introFrames: 45, fps: 30, sceneFromFrame: 36 }; // scene starts at frame 36

test("cueSeconds finds a word's start (case/punctuation-insensitive)", () => {
  assert.equal(cueSeconds("invoice", WORDS), 1.6);
  assert.equal(cueSeconds("Invoice", WORDS), 1.6);
  assert.equal(cueSeconds("automate!", WORDS), 2.4); // punctuation normalized away
});

test("cueSeconds returns null for a missing word / null cue / empty list", () => {
  assert.equal(cueSeconds("missing", WORDS), null);
  assert.equal(cueSeconds(null, WORDS), null);
  assert.equal(cueSeconds("invoice", []), null);
  assert.equal(cueSeconds("invoice", undefined), null);
});

test("resolveCueWindow maps in/out cue words to scene-local frames", () => {
  const fz = { target: { x: 0.8, y: 0.3 }, scale: 1.5, in: "invoice", out: "automate" };
  const r = resolveCueWindow(fz, WORDS, CTX);
  // inAt = introFrames + round(1.6*30) - sceneFromFrame = 45 + 48 - 36 = 57
  assert.equal(r.inAt, 57);
  // outAt = 45 + round(2.4*30) - 36 = 45 + 72 - 36 = 81
  assert.equal(r.outAt, 81);
  // non-cue fields preserved
  assert.deepEqual(r.target, { x: 0.8, y: 0.3 });
  assert.equal(r.scale, 1.5);
});

test("resolveCueWindow falls back when cues are absent (inAt→0, outAt→null), keeps numeric overrides", () => {
  assert.deepEqual(resolveCueWindow({ scale: 1.4 }, WORDS, CTX), { scale: 1.4, inAt: 0, outAt: null });
  assert.equal(resolveCueWindow({ in: "nope", inAt: 12 }, WORDS, CTX).inAt, 12); // numeric fallback kept
  assert.equal(resolveCueWindow({ out: "nope", outAt: 90 }, WORDS, CTX).outAt, 90);
});

test("resolveCueWindow clamps scene-local frames to >= 0 (cue before the scene start)", () => {
  const early = [{ w: "x", start: 0.1 }]; // 45 + 3 - 36 = 12 ... still positive; force negative:
  const ctx2 = { introFrames: 0, fps: 30, sceneFromFrame: 100 };
  const r = resolveCueWindow({ in: "x" }, early, ctx2); // 0 + 3 - 100 = -97 → clamp 0
  assert.equal(r.inAt, 0);
});

test("resolveCueWindow is pure (does not mutate the input) and passes through null", () => {
  const fz = { target: { x: 0.5, y: 0.5 }, scale: 1.5, in: "invoice" };
  const r = resolveCueWindow(fz, WORDS, CTX);
  assert.equal(fz.inAt, undefined, "input must not be mutated");
  assert.notEqual(r, fz);
  assert.equal(resolveCueWindow(null, WORDS, CTX), null);
  assert.equal(resolveCueWindow(undefined, WORDS, CTX), undefined);
});

test("resolveCueWindow works for a pip declaration too (same {in,out} shape, other fields kept)", () => {
  const pip = { anchor: "top-right", content: { kind: "prompt", text: "..." }, in: "Read" };
  const r = resolveCueWindow(pip, WORDS, CTX);
  assert.equal(r.inAt, 45 + 30 - 36); // round(1.0*30)=30 → 39
  assert.equal(r.outAt, null);
  assert.equal(r.anchor, "top-right");
  assert.deepEqual(r.content, { kind: "prompt", text: "..." });
});

// ── regression tests added by the independent verifier ──────────────────────

test("[verifier] resolveCueWindow with sceneWords=undefined falls back to inAt=0/outAt=null", () => {
  // wordsByScene[bt.sid] returns undefined when no words exist for the scene;
  // build-props passes it directly. cueSeconds must handle undefined gracefully.
  const r = resolveCueWindow({ in: "invoice", out: "automate", scale: 1.5 }, undefined, CTX);
  assert.equal(r.inAt, 0, "undefined sceneWords → inAt falls back to 0");
  assert.equal(r.outAt, null, "undefined sceneWords → outAt falls back to null");
  assert.equal(r.scale, 1.5, "non-cue fields still preserved");
});

test("[verifier] resolveCueWindow with inverted cues (out-word before in-word) does not crash", () => {
  // If the 'out' word appears earlier in the timeline than the 'in' word, the envelope
  // stays near 0 (no visible zoom) — silent fallback, no crash.
  const fz = { in: "automate", out: "Read", scale: 1.5 }; // 'automate'@2.4 > 'Read'@1.0
  const r = resolveCueWindow(fz, WORDS, CTX);
  // inAt = 45 + round(2.4*30) - 36 = 81; outAt = 45 + round(1.0*30) - 36 = 39
  assert.equal(r.inAt, 81, "inAt resolved from 'automate'");
  assert.equal(r.outAt, 39, "outAt resolved from 'Read' (earlier in timeline — inverted)");
  // Both are valid non-negative frames; no crash. FocalZoom envelope will be near-zero.
});

test("[verifier] cueSeconds returns 0 (not null) for a word at t=0s (falsy start value)", () => {
  // A word at the very start of the audio has start=0. The truthy check is on `hit` (the object),
  // not hit.start, so 0 is returned correctly instead of falling through to null.
  const words = [{ w: "First", start: 0 }];
  assert.strictEqual(cueSeconds("first", words), 0, "t=0 word must return 0, not null");
});

test("[verifier] resolveCueWindow with a t=0 cue word maps to toLocal(0), not the fallback", () => {
  // inSec=0 is not null, so toLocal(0) is used instead of the fallback (obj.inAt ?? 0).
  // With introFrames=45, fps=30, sceneFromFrame=45: toLocal(0) = max(45+0-45,0) = 0.
  // This is the same as the fallback here, but the CODE PATH is different; future changes
  // to introFrames could expose a discrepancy.
  const words = [{ w: "zero", start: 0 }];
  const ctx = { introFrames: 45, fps: 30, sceneFromFrame: 45 };
  const r = resolveCueWindow({ in: "zero", scale: 1.5 }, words, ctx);
  assert.equal(r.inAt, 0, "cue at t=0 maps to scene-local frame 0");
});

// ── V5: the build-side (seconds) + compile-side (frames) split must equal the legacy resolver ──

test("resolveCueWindowSeconds maps cue words to ABSOLUTE seconds, drops cue words, keeps other fields", () => {
  const fz = { target: { x: 0.8, y: 0.3 }, scale: 1.5, in: "invoice", out: "automate" };
  const r = resolveCueWindowSeconds(fz, WORDS, { introFrames: 45, fps: 30 });
  // frame-snapped: (45 + round(1.6*30)) / 30 = (45+48)/30 = 3.1 ; (45 + round(2.4*30))/30 = 117/30 = 3.9
  assert.equal(r.inAtSeconds, 3.1, "in cue → (introFrames + round(start*fps)) / fps");
  assert.equal(r.outAtSeconds, 3.9);
  assert.deepEqual(r.target, { x: 0.8, y: 0.3 });
  assert.equal(r.scale, 1.5);
  assert.equal(r.in, undefined, "cue words are consumed");
  assert.equal(r.out, undefined);
  assert.equal(fz.inAtSeconds, undefined, "pure: input not mutated");
});

test("resolveCueWindowSeconds → null seconds when a cue is absent (compile reads null as start/hold)", () => {
  const r = resolveCueWindowSeconds({ scale: 1.4, in: "nope" }, WORDS, { introFrames: 45, fps: 30 });
  assert.equal(r.inAtSeconds, null);
  assert.equal(r.outAtSeconds, null);
  assert.equal(r.scale, 1.4);
});

test("localizeCueWindow: null inAtSeconds → inAt 0, null outAtSeconds → outAt null", () => {
  const r = localizeCueWindow({ scale: 1.5, inAtSeconds: null, outAtSeconds: null }, { fps: 30, sceneFromFrame: 36 });
  assert.equal(r.inAt, 0);
  assert.equal(r.outAt, null);
  assert.equal(r.scale, 1.5);
});

test("[equivalence] resolveCueWindowSeconds → localizeCueWindow equals legacy resolveCueWindow (cue case)", () => {
  // The V5 two-step (build seconds → compile frames) must reproduce the old single-step frames exactly.
  const introFrames = 45, fps = 30, sceneFromFrame = 36;
  for (const win of [
    { target: { x: 0.82, y: 0.3 }, scale: 1.5, in: "invoice", out: "automate" },
    { anchor: "top-right", content: { kind: "prompt" }, in: "Read" }, // out absent → hold
    { scale: 1.4, in: "missing", out: "automate" },                   // in absent → start
  ]) {
    const legacy = resolveCueWindow(win, WORDS, { introFrames, fps, sceneFromFrame });
    const v5 = localizeCueWindow(resolveCueWindowSeconds(win, WORDS, { introFrames, fps }), { fps, sceneFromFrame });
    assert.equal(v5.inAt, legacy.inAt, `inAt mismatch for ${JSON.stringify(win)}`);
    assert.equal(v5.outAt, legacy.outAt, `outAt mismatch for ${JSON.stringify(win)}`);
  }
});

// ── FP-DRIFT FIX (verifier-found): cue words at an FP boundary must NOT drift vs the legacy resolver ──
//
// The verifier proved that a naive absolute resolver — round((introSeconds + wordStart) * fps) — drifts
// 1 frame from legacy (introFrames + round(wordStart*fps)) at boundaries like wordStart=0.55, because
// (1.5 + 0.55) * 30 = 61.4999… in IEEE 754 while 0.55 * 30 = 16.5 exactly. The fix: resolveCueWindowSeconds
// SNAPS to (introFrames + round(sec*fps)) / fps, so the round of the raw value happens BEFORE the intro
// offset is folded in — exactly as legacy did. This test guards that the drift is gone for all inputs.
test("[verifier-fix] focal two-step equals legacy at FP boundaries (e.g. cue word at s=0.55)", () => {
  const introFrames = 45, fps = 30, sceneFromFrame = 36;
  for (const start of [0.55, 0.55 + 2, 2.05, 6.95, 0.05, 1.6]) { // boundary + safe values
    const words = [{ w: "foo", start }];
    const win = { in: "foo", scale: 1.5 };
    const legacy = resolveCueWindow(win, words, { introFrames, fps, sceneFromFrame });
    const v5 = localizeCueWindow(resolveCueWindowSeconds(win, words, { introFrames, fps }), { fps, sceneFromFrame });
    assert.equal(v5.inAt, legacy.inAt, `inAt must match legacy at start=${start} (no FP drift)`);
  }
  // the specific boundary the verifier flagged: legacy = 45 + round(16.5) - 36 = 26
  const r = localizeCueWindow(resolveCueWindowSeconds({ in: "foo" }, [{ w: "foo", start: 0.55 }], { introFrames, fps }), { fps, sceneFromFrame });
  assert.equal(r.inAt, 26, "s=0.55 resolves to frame 26, matching legacy (drift fixed)");
});
