// P1 — metadata is schema-valid; chapters start at 0:00 and track alignment; tags + <=3-sentence desc.
// Plus the publish.md human export (fields match 1:1, JSON stays canonical) and the owner's
// thumbnail-pick write-back (chosen:true — the seed of future CTR↔score learning).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildMetadata, buildChapters, buildDescription, buildTags, fmtTime,
  publishMarkdown, writeMarkdownExport, recordThumbnailChoice,
  buildBridge, buildPinnedComment, LONG_URL_PLACEHOLDER,
} from "./build-metadata.mjs";
import { readFixture, assertValid, validate, withTempDir } from "../shared/testkit/index.mjs";

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

// --- Unified CTA-question → pinned-comment (Phase 1.3) ---

test("buildPinnedComment derives a reply-invite from the closing question", () => {
  const pin = buildPinnedComment({ closing_question: "Which hour would you hand over first?" });
  assert.match(pin, /Which hour would you hand over first\?/);
  assert.match(pin, /replies/);
});

test("buildPinnedComment prefers an authored pinned_comment verbatim", () => {
  const pin = buildPinnedComment({ closing_question: "Which hour?", pinned_comment: "Mine was copy-paste. What's yours?" });
  assert.equal(pin, "Mine was copy-paste. What's yours?");
});

test("buildPinnedComment returns empty when there is no closing question", () => {
  assert.equal(buildPinnedComment({}), "");
});

test("buildMetadata emits pinned_comment from the script closing question, and the bridge mirrors it", () => {
  const s = { ...script(), closing_question: "Which inbox chore would you hand over first?" };
  const pub = buildMetadata({ brief: brief(), script: s, alignment: alignment() });
  assertValid(pub, "publish");
  assert.match(pub.pinned_comment, /Which inbox chore/);
  assert.equal(pub.bridge.pinned_comment, pub.pinned_comment, "the bridge mirrors the pin (in sync)");
});

test("buildMetadata omits pinned_comment when the script has no closing question (no empty field)", () => {
  const pub = buildMetadata({ brief: brief(), script: script(), alignment: alignment() });
  assert.equal("pinned_comment" in pub, false);
});

// --- Short → Long bridge (Phase 1.2 — the deliberate ecosystem chain) ---

test("buildMetadata attaches a schema-valid bridge with a <LONG_URL> placeholder", () => {
  const pub = buildMetadata({ brief: brief(), script: script(), alignment: alignment() });
  assertValid(pub, "publish");
  assert.ok(pub.bridge, "bridge is attached");
  assert.equal(pub.bridge.long_url, LONG_URL_PLACEHOLDER);
  assert.ok(pub.bridge.short_caption.includes(LONG_URL_PLACEHOLDER), "caption carries the long link placeholder");
});

test("buildBridge builds the manual checklist from brief.bridge inputs (related long + template)", () => {
  const b = { ...brief(), bridge: { related_long_id: "015-n8n-inbox-triage", related_long_title: "The n8n inbox that triages itself", template_link: "https://example.com/workflow.json" } };
  const bridge = buildBridge({ publish: { short: { caption: "" }, pinned_comment: "Mine was copy-paste. What's yours?" }, brief: b });
  assert.equal(bridge.related_long_id, "015-n8n-inbox-triage");
  assert.equal(bridge.end_screen_target, "015-n8n-inbox-triage");
  assert.equal(bridge.template_link, "https://example.com/workflow.json");
  assert.equal(bridge.pinned_comment, "Mine was copy-paste. What's yours?");
  // checklist: link related video + end screen + pin + template link = 4 steps
  assert.equal(bridge.manual_checklist.length, 4);
  assert.ok(bridge.manual_checklist.some((s) => s.includes("Shorts editor")));
  assert.ok(bridge.manual_checklist.some((s) => s.includes("template link")));
  assert.ok(bridge.short_caption.includes("The n8n inbox that triages itself"));
});

test("buildBridge with no related long / template yields an empty-ish checklist (no bogus steps)", () => {
  const bridge = buildBridge({ publish: { short: { caption: "" } }, brief: brief() });
  assert.equal(bridge.related_long_id, null);
  assert.equal(bridge.template_link, null);
  assert.equal(bridge.manual_checklist.length, 0);
});

test("publishMarkdown renders the bridge section + manual checkboxes when a related long exists", () => {
  const b = { ...brief(), bridge: { related_long_id: "015-n8n-inbox-triage", template_link: "https://example.com/w.json" } };
  const pub = buildMetadata({ brief: b, script: script(), alignment: alignment() });
  const md = publishMarkdown(pub);
  assert.match(md, /## Short → Long bridge/);
  assert.match(md, /Related long video: \*\*015-n8n-inbox-triage\*\*/);
  assert.match(md, /- \[ \] /); // at least one manual checkbox
  assert.match(md, /D-055/); // the manual-upload caveat is surfaced
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

// --- publish.md export (plan v2 Phase 2) ---

const sampleCandidates = () => [
  { scene: "s01.0", template: "hook-card", score: 95, reasons: ["hero_scene", "high_contrast"], timestamp_s: 9.5, file: "images/thumb_candidate_1.png", final: "images/thumb_final_1.png", source: "hf-clip", chosen: false },
  { scene: "s05.0", template: "stat-callout", score: 90, reasons: ["hero_scene", "dominant_focal"], timestamp_s: 63.7, file: "images/thumb_candidate_2.png", final: "images/thumb_final_2.png", source: "hf-clip", chosen: false },
];

test("publishMarkdown: every publish.json field appears 1:1 (titles, description, tags, chapters, short)", () => {
  const pub = buildMetadata({ brief: readFixture("brief.json"), script: readFixture("script.json"), alignment: readFixture("alignment.json") });
  const md = publishMarkdown(pub);
  assert.ok(md.startsWith(`# ${pub.id} — publish pack`));
  for (const t of pub.title_options) assert.ok(md.includes(t), `title option "${t}" missing`);
  assert.ok(md.includes(pub.description), "description missing");
  assert.ok(md.includes(pub.tags.join(", ")), "tags line missing");
  for (const c of pub.chapters) assert.ok(md.includes(`${c.time} ${c.label}`), `chapter ${c.time} missing`);
  assert.ok(md.includes(pub.short.title), "short title missing");
  assert.ok(md.includes("Altered/synthetic content: **Yes**"), "D-025 disclosure reminder missing");
});

test("publishMarkdown: thumbnail candidate table appears when candidates exist, with the pick command", () => {
  const pub = buildMetadata({ brief: readFixture("brief.json"), script: readFixture("script.json"), alignment: readFixture("alignment.json") });
  const md = publishMarkdown(pub, { candidates: sampleCandidates() });
  assert.ok(md.includes("## Thumbnail candidates"));
  assert.ok(md.includes("images/thumb_final_1.png"));
  assert.ok(md.includes("hero_scene, high_contrast"), "score reasons surfaced to the owner");
  assert.ok(md.includes("--choose-thumb"), "pick-recording command included");
  assert.ok(!publishMarkdown(pub).includes("## Thumbnail candidates"), "no table without candidates");
});

test("writeMarkdownExport: writes publish.md next to publish.json, picks up thumb_candidates.json", async () => {
  await withTempDir(async (tmp) => {
    const pub = buildMetadata({ brief: readFixture("brief.json"), script: readFixture("script.json"), alignment: readFixture("alignment.json") });
    fs.writeFileSync(path.join(tmp, "publish.json"), JSON.stringify(pub));
    fs.writeFileSync(path.join(tmp, "thumb_candidates.json"), JSON.stringify(sampleCandidates()));
    const out = writeMarkdownExport(tmp);
    assert.equal(path.basename(out), "publish.md");
    const md = fs.readFileSync(out, "utf8");
    assert.ok(md.includes(pub.description), "reads publish.json from disk");
    assert.ok(md.includes("## Thumbnail candidates"), "candidates auto-discovered");
    // publish.json untouched by the md export
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmp, "publish.json"), "utf8")), pub);
  });
});

test("recordThumbnailChoice: exactly one chosen:true (by index or file), schema-valid, md refreshed", async () => {
  await withTempDir(async (tmp) => {
    const pub = buildMetadata({ brief: readFixture("brief.json"), script: readFixture("script.json"), alignment: readFixture("alignment.json") });
    fs.writeFileSync(path.join(tmp, "publish.json"), JSON.stringify(pub));
    fs.writeFileSync(path.join(tmp, "thumb_candidates.json"), JSON.stringify(sampleCandidates()));
    fs.mkdirSync(path.join(tmp, "images"), { recursive: true });
    for (const c of sampleCandidates()) fs.writeFileSync(path.join(tmp, c.final), `png-${c.scene}`);

    const picked = recordThumbnailChoice(tmp, "2");
    assert.equal(picked.scene, "s05.0");
    assert.equal(
      fs.readFileSync(path.join(tmp, "images", "thumb_final.png"), "utf8"),
      "png-s05.0",
      "chosen final copied to the canonical images/thumb_final.png (medium.cover reference)"
    );
    let onDisk = JSON.parse(fs.readFileSync(path.join(tmp, "thumb_candidates.json"), "utf8"));
    assertValid(onDisk, "thumb_candidates.json");
    assert.deepEqual(onDisk.map((c) => c.chosen), [false, true]);
    assert.ok(fs.readFileSync(path.join(tmp, "publish.md"), "utf8").includes("✔"), "pick visible in publish.md");

    // re-picking by file flips the flags — still exactly one true
    recordThumbnailChoice(tmp, "images/thumb_candidate_1.png");
    onDisk = JSON.parse(fs.readFileSync(path.join(tmp, "thumb_candidates.json"), "utf8"));
    assert.deepEqual(onDisk.map((c) => c.chosen), [true, false]);

    assert.throws(() => recordThumbnailChoice(tmp, "9"), /no thumbnail candidate matches/);
  });
});
