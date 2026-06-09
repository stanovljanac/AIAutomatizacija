// V3 — the render-time policy checks: hook-class detection + the "strong hook opens the video"
// rule that build-props warns on and qa-video enforces hard.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isHookClass, openingHasHook, HOOK_TEMPLATES } from "./lib/policy.mjs";

test("isHookClass: a hook-card template is a hook", () => {
  assert.equal(isHookClass({ template: "hook-card" }), true);
});

test("isHookClass: a custom hook-* component is a hook", () => {
  assert.equal(isHookClass({ template: "custom", props: { component: "hook-stat-reveal" } }), true);
});

test("isHookClass: a non-hook custom scene is not a hook", () => {
  assert.equal(isHookClass({ template: "custom", props: { component: "spreadsheet-clean" } }), false);
});

test("isHookClass: a normal content template is not a hook", () => {
  assert.equal(isHookClass({ template: "bullet-steps" }), false);
});

test("isHookClass: null / missing component is not a hook", () => {
  assert.equal(isHookClass(null), false);
  assert.equal(isHookClass({ template: "custom" }), false);
});

test("openingHasHook: true when a hook-class scene starts inside the window", () => {
  const scenes = [
    { template: "hook-card", fromFrame: 0 },
    { template: "bullet-steps", fromFrame: 200 },
  ];
  assert.equal(openingHasHook(scenes, 90), true);
});

test("openingHasHook: false when the only hook starts AFTER the window", () => {
  const scenes = [
    { template: "bullet-steps", fromFrame: 0 },
    { template: "hook-card", fromFrame: 200 },
  ];
  assert.equal(openingHasHook(scenes, 90), false);
});

test("openingHasHook: a custom hook-* inside the window counts", () => {
  const scenes = [{ template: "custom", props: { component: "hook-stat-reveal" }, fromFrame: 10 }];
  assert.equal(openingHasHook(scenes, 90), true);
});

test("openingHasHook: empty / undefined scene list → false (no crash)", () => {
  assert.equal(openingHasHook([], 90), false);
  assert.equal(openingHasHook(undefined, 90), false);
});

test("HOOK_TEMPLATES contains hook-card", () => {
  assert.ok(HOOK_TEMPLATES.has("hook-card"));
});

// V3 REGRESSION SUITE — edge-cases identified during independent verification.

test("isHookClass: component that is not a string (number) is not a hook", () => {
  assert.equal(isHookClass({ template: "custom", props: { component: 42 } }), false);
});

test("isHookClass: template literally named 'hookish' is NOT a hook (only exact 'hook-card' or custom hook-*)", () => {
  assert.equal(isHookClass({ template: "hookish" }), false);
});

test("isHookClass: component = empty string is not a hook", () => {
  assert.equal(isHookClass({ template: "custom", props: { component: "" } }), false);
});

test("isHookClass: component = undefined is not a hook", () => {
  assert.equal(isHookClass({ template: "custom", props: { component: undefined } }), false);
});

test("openingHasHook: boundary — fromFrame exactly equal to openingEndFrame is excluded (strict <)", () => {
  // A hook that starts AT the end of the window does NOT count (comment says 'starts BEFORE openingEndFrame').
  assert.equal(openingHasHook([{ template: "hook-card", fromFrame: 90 }], 90), false);
});

test("openingHasHook: scene with fromFrame one before window end counts (strict < boundary)", () => {
  assert.equal(openingHasHook([{ template: "hook-card", fromFrame: 89 }], 90), true);
});

test("openingHasHook: scene missing fromFrame (undefined) does not crash and returns false", () => {
  // fromFrame missing → undefined < N is false in JS → no crash, no false positive.
  assert.equal(openingHasHook([{ template: "hook-card" }], 90), false);
});

// BUG: null element in scenes crashes (s.fromFrame access before isHookClass guard).
// This test WILL FAIL until policy.mjs line 22 guards s != null before accessing s.fromFrame.
// Fix: change `s.fromFrame < openingEndFrame` to `s?.fromFrame < openingEndFrame` (or add s != null check).
test("openingHasHook: null element in scenes does not crash (defensive guard gap — EXPECTED FAIL until fixed)", () => {
  assert.doesNotThrow(() => openingHasHook([null], 90));
  assert.equal(openingHasHook([null, { template: "hook-card", fromFrame: 10 }], 90), true);
});
