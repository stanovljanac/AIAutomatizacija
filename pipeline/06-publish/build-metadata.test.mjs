// P1 — metadata is schema-valid; chapters start at 0:00 and track alignment; tags + <=3-sentence desc.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMetadata, buildChapters, buildDescription, buildTags, fmtTime } from "./build-metadata.mjs";
import { readFixture, assertValid, validate } from "../shared/testkit/index.mjs";

const brief = () => readFixture("brief.json");
const script = () => readFixture("script.json");
const alignment = () => readFixture("alignment.json");

test("fmtTime formats seconds as m:ss", () => {
  assert.equal(fmtTime(0), "0:00");
  assert.equal(fmtTime(75), "1:15");
});

test("buildMetadata produces a schema-valid publish.json", () => {
  const pub = buildMetadata({ brief: brief(), script: script(), alignment: alignment() });
  assertValid(pub, "publish");
  assert.ok(pub.title_options.length >= 1);
  assert.equal(pub.altered_content, true);
  assert.equal(pub.status, "draft_pending");
});

test("chapters start at 0:00 and cover every aligned scene", () => {
  const ch = buildChapters(script(), alignment());
  assert.equal(ch[0].time, "0:00");
  assert.equal(ch.length, script().scenes.length); // all 3 fixture scenes are aligned
});

test("tags include the task and tool", () => {
  const tags = buildTags(brief());
  assert.ok(tags.includes("outbound comms"));
  assert.ok(tags.includes("Claude"));
});

test("description is answer-first and at most 3 sentences", () => {
  const pub = buildMetadata({ brief: brief(), script: script(), alignment: alignment() });
  assert.ok(pub.description.length > 0);
  const sentences = pub.description.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  assert.ok(sentences.length <= 3, `got ${sentences.length} sentences`);
});

// --- VERIFIER TESTS (Wave 1 Batch 1A scrutiny) ---

// BUG: The existing "description ≤3 sentences" test uses split(/[.!?]+/) which splits
// on interior dots in abbreviations like "U.S.", producing false positives.
// buildDescription is structurally capped at 3 (2 hook sentences + 1 keyword sentence),
// so the test should verify the structural cap, not count by regex.
test("[verifier] description ≤3 sentences even when hook contains 'U.S.' abbreviation", () => {
  // Demonstrates that the existing test's regex-split would false-fail here.
  // buildDescription guarantees ≤3 structurally (slice(0,2) + 1 kw line).
  const scriptUS = {
    scenes: [{
      role: "hook",
      sentences: ["In the U.S. this costs $5M annually.", "Here is the fix."],
    }],
  };
  const briefUS = { search_term: "AI invoice automation" };
  const desc = buildDescription(scriptUS, briefUS);
  // Structural guarantee (robust, not regex sentence-counting): the description is exactly
  // the first <=2 hook sentences + one keyword sentence — so it can never exceed 3 sentences,
  // even when a hook sentence contains an abbreviation like "U.S.".
  assert.equal(
    desc,
    "In the U.S. this costs $5M annually. Here is the fix. A quick, practical look at AI invoice automation."
  );
});

// BUG: buildChapters produces non-monotonic chapter times when alignment sentences
// are not ordered by start time across scenes. YouTube's API rejects non-monotonic chapters.
test("[verifier] buildChapters — non-monotonic alignment produces non-monotonic chapters (BUG)", () => {
  const scriptThree = {
    scenes: [
      { id: "s1", role: "hook", sentences: ["Hook."] },
      { id: "s2", role: "point", sentences: ["Point."] },
      { id: "s3", role: "cta", sentences: ["CTA."] },
    ],
  };
  // s3 starts at 8s, s2 starts at 10s — backwards!
  const backwardsAlignment = {
    sentences: [
      { scene: "s1", start: 0, index: 0, text: "Hook." },
      { scene: "s2", start: 10, index: 0, text: "Point." },
      { scene: "s3", start: 8, index: 0, text: "CTA." },
    ],
  };
  const chapters = buildChapters(scriptThree, backwardsAlignment);
  // Demonstrate the bug: chapters[2].time < chapters[1].time
  const times = chapters.map((c) => {
    const [m, s] = c.time.split(":").map(Number);
    return m * 60 + s;
  });
  // The production code does NOT enforce monotonicity. This test FAILS when the bug is present.
  // Author fix: sort chapters by time before forcing chapters[0] to "0:00".
  for (let i = 1; i < times.length; i++) {
    assert.ok(times[i] > times[i - 1], `chapters not monotonic at index ${i}: ${JSON.stringify(chapters)}`);
  }
});

// BUG: makeShort — when no hook role exists, scenes[0] is used as the hook AND it
// still appears in the `points` array, causing it to be duplicated in the Short.
// (Confirmed separately in make-short.test.mjs — included here for cross-module coverage.)

// CORRECTNESS: buildChapters with empty alignment returns [] (no crash)
test("[verifier] buildChapters with empty alignment returns empty array", () => {
  const sc = { scenes: [{ id: "s1", role: "hook", sentences: ["Hook."] }] };
  const ch = buildChapters(sc, { sentences: [] });
  assert.deepEqual(ch, []);
});

// CORRECTNESS: buildChapters with missing alignment.sentences returns []
test("[verifier] buildChapters with undefined alignment.sentences returns empty array", () => {
  const sc = { scenes: [{ id: "s1", role: "hook", sentences: ["Hook."] }] };
  const ch = buildChapters(sc, {});
  assert.deepEqual(ch, []);
});

// CORRECTNESS: an invalid publish.json (missing status) is rejected by the schema
test("[verifier] invalid publish.json is rejected by schema", () => {
  const bad = { id: "x", title_options: ["T"], description: "D", tags: [] };
  const { valid, errors } = validate(bad, "publish");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.message.includes("status")));
});
