// Proves the test runner + validate-lib + testkit are wired correctly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSchema } from "../lib/validate-lib.mjs";
import { validate, assertValid } from "./index.mjs";

test("validate-lib loads an existing schema by short name", () => {
  const schema = loadSchema("ideas");
  assert.equal(schema.title, "ideas.json");
});

test("validate flags a clearly invalid ideas document", () => {
  const { valid } = validate({ nope: true }, "ideas");
  assert.equal(valid, false);
});

test("assertValid passes for a minimal valid ideas document", () => {
  assertValid({ updated: "2026-06-08", ideas: [] }, "ideas");
});
