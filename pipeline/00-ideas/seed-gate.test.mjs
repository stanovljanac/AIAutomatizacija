// D-059 seed-gate: a brief may not be scripted until it carries an idea-pass verdict (value_band).
import { test } from "node:test";
import assert from "node:assert/strict";
import { seedGate } from "./seed-gate.mjs";

test("seedGate PASSES a brief that cleared the idea-pass (qualify)", () => {
  const { ok } = seedGate({ id: "017-x", value_band: "qualify" });
  assert.equal(ok, true);
});

test("seedGate PASSES an owner-band brief (owner decides is still a real verdict)", () => {
  assert.equal(seedGate({ value_band: "owner" }).ok, true);
});

test("seedGate STOPS when value_band is absent (the 015 hole: seed skipped the idea-pass)", () => {
  const { ok, reason } = seedGate({ id: "015-x" });
  assert.equal(ok, false);
  assert.match(reason, /never passed the idea-pass/i);
});

test("seedGate STOPS an empty-string band (treated as absent)", () => {
  assert.equal(seedGate({ value_band: "" }).ok, false);
});

test("seedGate STOPS a rejected brief (idea-pass said no)", () => {
  const { ok, reason } = seedGate({ value_band: "reject" });
  assert.equal(ok, false);
  assert.match(reason, /reject/i);
});

test("seedGate STOPS an unrecognized band (typo/garbage never counts as a pass)", () => {
  assert.equal(seedGate({ value_band: "maybe" }).ok, false);
});

test("seedGate STOPS a retired brief (status=rejected) even if it still carries a qualify band", () => {
  // the 015 case after retirement: value_band inherited "qualify" but the video was retired.
  const { ok, reason } = seedGate({ id: "015-x", value_band: "qualify", status: "rejected" });
  assert.equal(ok, false);
  assert.match(reason, /retired/i);
});

test("seedGate is null-safe on a missing brief", () => {
  assert.equal(seedGate(undefined).ok, false);
  assert.equal(seedGate(null).ok, false);
});
