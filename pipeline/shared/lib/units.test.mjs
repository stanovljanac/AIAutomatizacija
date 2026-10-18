// units.mjs — the one answer to "is this a Short, and whose?" (1B, D-074).
import { test } from "node:test";
import assert from "node:assert/strict";
import { SHORT_KEY_SUFFIX, SHORT_UNIT_RE, isShortUnit, shortIndex, shortUnitName, sortUnits, topicOf } from "./units.mjs";

test("isShortUnit: nested short / short-N and the legacy flat folders; never a long", () => {
  for (const id of ["025-x/short", "025-x/short-2", "025-x/short-9", "002-short", "003-short", "025-x\\short-3"]) assert.equal(isShortUnit(id), true, id);
  for (const id of ["025-x", "025-x/short-1", "025-x/short-10", "025-x/shorts", "025-x/video"]) assert.equal(isShortUnit(id), false, id);
});

test("shortIndex / shortUnitName round-trip; topicOf strips any Short suffix", () => {
  assert.equal(shortIndex("025-x/short"), 1);
  assert.equal(shortIndex("025-x/short-3"), 3);
  assert.equal(shortIndex("025-x"), null);
  assert.equal(shortIndex("002-short"), null, "a legacy flat Short has no unit number");
  assert.equal(shortUnitName(1), "short");
  assert.equal(shortUnitName(2), "short-2");
  assert.throws(() => shortUnitName(10), /1\.\.9/);
  assert.equal(topicOf("025-x/short-2"), "025-x");
  assert.equal(topicOf("025-x/short"), "025-x");
  assert.equal(topicOf("025-x"), "025-x");
});

test("sortUnits keeps the natural order; the key suffix matches what the schemas allow", () => {
  assert.deepEqual(sortUnits(["short-3", "short", "short-2"]), ["short", "short-2", "short-3"]);
  const key = new RegExp(`^[0-9]{3}-[a-z0-9-]+${SHORT_KEY_SUFFIX}$`);
  for (const k of ["024-frozen", "024-frozen/short", "024-frozen/short-2"]) assert.ok(key.test(k), k);
  assert.equal(key.test("024-frozen/short-1"), false);
  assert.ok(SHORT_UNIT_RE.test("short-2"));
});
