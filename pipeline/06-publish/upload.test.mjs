// P5 — metadata builders + draft upload via an injected fake client (no network/keys).
import { test } from "node:test";
import assert from "node:assert/strict";
import { composeDescription, chosenTitle, buildVideoResource, uploadVideo, YouTubePublisher } from "./upload.mjs";
import { fixturePath } from "../shared/testkit/index.mjs";

const samplePublish = () => ({
  id: "_FIXTURE",
  title_options: ["3 Tiny AI Automations for Invoice Email Triage"],
  chosen_title: null,
  description: "Sorting invoice emails by hand eats about a day every month.",
  tags: ["outbound comms", "Claude"],
  chapters: [
    { time: "0:00", label: "A day a month, gone" },
    { time: "0:05", label: "Label, extract, flag" },
  ],
  altered_content: true,
  status: "draft_pending",
});

test("composeDescription includes chapters, altered-content disclosure and the CTA", () => {
  const d = composeDescription(samplePublish());
  assert.match(d, /0:00 A day a month, gone/);
  assert.match(d, /altered\/synthetic content/i);
  assert.match(d, /@TheAutomationDesk/);
});

test("chosenTitle prefers chosen_title, falls back to the first option", () => {
  assert.equal(chosenTitle({ title_options: ["A", "B"] }), "A");
  assert.equal(chosenTitle({ chosen_title: "Picked", title_options: ["A"] }), "Picked");
});

test("buildVideoResource is private with category + tags", () => {
  const r = buildVideoResource(samplePublish());
  assert.equal(r.status.privacyStatus, "private");
  assert.equal(r.status.selfDeclaredMadeForKids, false);
  assert.equal(r.snippet.categoryId, "27");
  assert.deepEqual(r.snippet.tags, ["outbound comms", "Claude"]);
});

test("uploadVideo calls the client with snippet+status and returns the video id", async () => {
  let seen = null;
  const client = {
    videos: { insert: async (params) => { seen = params; return { data: { id: "vid123" } }; } },
  };
  const { videoId } = await uploadVideo({
    client,
    publish: samplePublish(),
    videoPath: fixturePath("brief.json"), // any existing file; the fake client never reads it
    privacy: "private",
  });
  assert.equal(videoId, "vid123");
  assert.deepEqual(seen.part, ["snippet", "status"]);
  assert.equal(seen.requestBody.status.privacyStatus, "private");
});

test("YouTubePublisher.publishDraft writes back the id + uploaded_private status", async () => {
  const client = {
    videos: { insert: async () => ({ data: { id: "abc" } }) },
    thumbnails: { set: async () => ({ data: {} }) },
  };
  const publish = samplePublish();
  const pub = new YouTubePublisher({ config: { youtube: { upload_privacy: "private" } } });
  const res = await pub.publishDraft(publish, { videoPath: fixturePath("brief.json"), client });
  assert.equal(res.videoId, "abc");
  assert.equal(publish.youtube_video_id, "abc");
  assert.equal(publish.status, "uploaded_private");
  assert.match(res.altered_content_reminder, /Studio/);
});

test("setThumbnail is skipped when no thumbnail file exists", async () => {
  const { setThumbnail } = await import("./upload.mjs");
  const r = await setThumbnail({ client: {}, videoId: "x", thumbPath: "does/not/exist.png" });
  assert.equal(r.skipped, true);
});

// --- VERIFIER TESTS (Wave 1 Batch 1B privacy + gap coverage) ---

// CRITICAL invariant: buildVideoResource must default to "private" when no options supplied.
test("[verifier] buildVideoResource defaults to private when called with no options object", () => {
  const r = buildVideoResource(samplePublish());
  assert.equal(r.status.privacyStatus, "private",
    "CRITICAL: default privacy must be 'private', not 'public'");
});

// CRITICAL invariant: buildVideoResource must default to "private" when privacy is explicitly undefined.
// JS destructuring: { privacy = "private" } fires even when key is present but value is undefined.
test("[verifier] buildVideoResource defaults to private when privacy is explicitly undefined", () => {
  const r = buildVideoResource(samplePublish(), { privacy: undefined });
  assert.equal(r.status.privacyStatus, "private",
    "CRITICAL: explicit undefined must still produce 'private'");
});

// CRITICAL invariant: publishDraft must be private when config.youtube is absent entirely.
test("[verifier] publishDraft is private when config.youtube is missing", async () => {
  let seenPrivacy = null;
  const client = {
    videos: {
      insert: async (params) => {
        seenPrivacy = params.requestBody.status.privacyStatus;
        return { data: { id: "safe-id" } };
      },
    },
    thumbnails: { set: async () => ({ data: {} }) },
  };
  const pub = new YouTubePublisher({ config: {} }); // no youtube key at all
  await pub.publishDraft(samplePublish(), { videoPath: fixturePath("brief.json"), client });
  assert.equal(seenPrivacy, "private",
    "CRITICAL: missing config.youtube must still produce 'private'");
});

// CRITICAL invariant: publishDraft is private when upload_privacy is absent but other youtube keys exist.
test("[verifier] publishDraft is private when upload_privacy is absent from config.youtube", async () => {
  let seenPrivacy = null;
  const client = {
    videos: {
      insert: async (params) => {
        seenPrivacy = params.requestBody.status.privacyStatus;
        return { data: { id: "safe-id-2" } };
      },
    },
    thumbnails: { set: async () => ({ data: {} }) },
  };
  const pub = new YouTubePublisher({ config: { youtube: { category_id: "22" } } }); // upload_privacy absent
  await pub.publishDraft(samplePublish(), { videoPath: fixturePath("brief.json"), client });
  assert.equal(seenPrivacy, "private",
    "CRITICAL: absent upload_privacy key must still produce 'private'");
});

// composeDescription: missing chapters key must not crash and must still emit disclosure + CTA.
test("[verifier] composeDescription survives missing chapters — still emits disclosure + CTA", () => {
  const pub = { description: "Test.", altered_content: true }; // no chapters key
  const d = composeDescription(pub);
  assert.doesNotMatch(d, /undefined/);
  assert.match(d, /altered\/synthetic content/i);
  assert.match(d, /@TheAutomationDesk/);
});

// composeDescription: null chapters must not crash.
test("[verifier] composeDescription survives null chapters", () => {
  const pub = { description: "Test.", altered_content: true, chapters: null };
  const d = composeDescription(pub);
  assert.doesNotMatch(d, /undefined/);
  assert.match(d, /@TheAutomationDesk/);
});

// composeDescription: empty chapters array must not inject a blank paragraph.
test("[verifier] composeDescription with empty chapters array omits chapter block", () => {
  const pub = { description: "Test.", altered_content: false, chapters: [] };
  const d = composeDescription(pub);
  // No chapter content — the description should only be desc + CTA (no double-newline island).
  assert.doesNotMatch(d, /\n\n\n/); // no triple newline (empty block would leave one)
});

// composeDescription: altered_content=false must NOT include disclosure.
test("[verifier] composeDescription omits disclosure when altered_content is false", () => {
  const pub = { description: "Test.", altered_content: false };
  const d = composeDescription(pub);
  assert.doesNotMatch(d, /altered\/synthetic content/i);
  assert.match(d, /@TheAutomationDesk/);
});

// composeDescription: missing description field must not crash.
test("[verifier] composeDescription survives missing description field", () => {
  const pub = { altered_content: false }; // no description key
  const d = composeDescription(pub);
  assert.match(d, /@TheAutomationDesk/);
});

// chosenTitle: both chosen_title and title_options absent → must return "Untitled", not crash.
test("[verifier] chosenTitle returns 'Untitled' when both chosen_title and title_options are absent", () => {
  assert.equal(chosenTitle({}), "Untitled");
  assert.equal(chosenTitle({ chosen_title: null }), "Untitled");
  assert.equal(chosenTitle({ title_options: [] }), "Untitled");
});

// FIXED: id/status are written immediately after uploadVideo, BEFORE setThumbnail, and a
// thumbnail failure no longer fails the publish — it is surfaced as a warning. So an
// already-uploaded private draft can never be orphaned by a thumbnail hiccup.
test("[verifier] publishDraft keeps the id + warns (does not throw) when thumbnail.set fails", async () => {
  const client = {
    videos: { insert: async () => ({ data: { id: "thumb-fail-id" } }) },
    thumbnails: {
      set: async () => { throw new Error("thumbnail quota exceeded"); },
    },
  };
  const publish = samplePublish();
  const pub = new YouTubePublisher({ config: { youtube: { upload_privacy: "private" } } });
  const res = await pub.publishDraft(publish, {
    videoPath: fixturePath("brief.json"),
    thumbPath: fixturePath("brief.json"),
    client,
  });
  assert.equal(publish.youtube_video_id, "thumb-fail-id", "id must be preserved despite thumbnail failure");
  assert.equal(publish.status, "uploaded_private");
  assert.match(res.thumbnail_warning, /thumbnail quota/);
});

// publishDraft: altered_content_reminder is null when altered_content is false.
test("[verifier] publishDraft returns null altered_content_reminder when altered_content is false", async () => {
  const client = {
    videos: { insert: async () => ({ data: { id: "xyz" } }) },
    thumbnails: { set: async () => ({ data: {} }) },
  };
  const publish = { ...samplePublish(), altered_content: false };
  const pub = new YouTubePublisher({ config: { youtube: { upload_privacy: "private" } } });
  const res = await pub.publishDraft(publish, { videoPath: fixturePath("brief.json"), client });
  assert.equal(res.altered_content_reminder, null);
});
