// T4.3 — the Distributor seam. Pure plan builder (schema-valid) + the port registry. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  watchUrl,
  buildCrossPost,
  buildDistributionPlan,
  createDistributor,
  Distributor,
  NoopDistributor,
  MockDistributor,
  PostizDistributor,
} from "./distributor.mjs";
import { assertValid } from "../shared/testkit/index.mjs";

const samplePublish = () => ({
  id: "005-foo",
  title_options: ["3 Tiny AI Automations for Invoice Triage"],
  chosen_title: "Stop Sorting Invoice Emails by Hand",
  description: "…",
  tags: ["automation"],
  short: { caption: "I automated invoice-email triage in 60 seconds → full build:", tags: ["ai"] },
  youtube_video_id: "abc123",
  status: "uploaded_private",
});

test("watchUrl builds a youtu.be link from an id, null when not uploaded", () => {
  assert.equal(watchUrl("abc123"), "https://youtu.be/abc123");
  assert.equal(watchUrl(null), null);
  assert.equal(watchUrl(undefined), null);
});

test("buildCrossPost uses the Short caption + the link, passing channels through", () => {
  const p = buildCrossPost(samplePublish(), { videoUrl: "https://youtu.be/abc123", channels: ["instagram"] });
  assert.equal(p.kind, "short_crosspost");
  assert.match(p.caption, /invoice-email triage/);
  assert.equal(p.link, "https://youtu.be/abc123");
  assert.deepEqual(p.channels, ["instagram"]);
  assert.equal(p.status, "pending");
});

test("buildCrossPost falls back to chosen_title, then the first title option", () => {
  const noCaption = { ...samplePublish(), short: {} };
  assert.match(buildCrossPost(noCaption, {}).caption, /Stop Sorting Invoice Emails/);
  const noTitle = { title_options: ["Only Option"], short: {} };
  assert.equal(buildCrossPost(noTitle, {}).caption, "Only Option");
});

test("buildCrossPost derives the link from youtube_video_id when no videoUrl is passed; omits link when neither", () => {
  assert.equal(buildCrossPost(samplePublish(), {}).link, "https://youtu.be/abc123");
  const notUploaded = { ...samplePublish(), youtube_video_id: null };
  assert.equal("link" in buildCrossPost(notUploaded, {}), false, "no link key when nothing to link to");
});

test("buildCrossPost prefers the bridge caption + falls back to the bridge long_url placeholder", () => {
  // The Short→Long bridge (Phase 1.2) is the formalized chain — its caption/link win so cross-post,
  // pin, and end screen stay in sync.
  const withBridge = {
    title_options: ["T"],
    short: { caption: "old short caption" },
    youtube_video_id: null,
    bridge: { short_caption: "Full breakdown → <LONG_URL>", long_url: "<LONG_URL>" },
  };
  const p = buildCrossPost(withBridge, {});
  assert.equal(p.caption, "Full breakdown → <LONG_URL>");
  assert.equal(p.link, "<LONG_URL>", "falls back to the bridge placeholder when not uploaded yet");
});

test("buildDistributionPlan is schema-valid and carries the source id + url", () => {
  const plan = buildDistributionPlan(samplePublish(), {
    config: { distribute: { enabled: true, provider: "postiz", channels: { short_crosspost: ["youtube", "tiktok"] } } },
  });
  assertValid(plan, "distribution.json");
  assert.equal(plan.version, 1);
  assert.equal(plan.source_video_id, "abc123");
  assert.equal(plan.source_url, "https://youtu.be/abc123");
  assert.equal(plan.provider, "postiz");
  assert.deepEqual(plan.posts[0].channels, ["youtube", "tiktok"]);
});

test("buildDistributionPlan: provider resolves to noop when distribution is disabled", () => {
  const plan = buildDistributionPlan(samplePublish(), { config: {} });
  assertValid(plan, "distribution.json");
  assert.equal(plan.provider, "noop");
});

test("buildDistributionPlan stays schema-valid for a not-yet-uploaded video (null id, no url)", () => {
  const plan = buildDistributionPlan({ ...samplePublish(), youtube_video_id: null }, { config: {} });
  assertValid(plan, "distribution.json");
  assert.equal(plan.source_video_id, null);
  assert.equal("source_url" in plan, false);
});

// ── the port registry ────────────────────────────────────────────────────────
test("createDistributor returns noop when disabled, postiz when enabled, and honors an explicit provider", () => {
  assert.equal(createDistributor({}).provider, "noop");
  assert.equal(createDistributor({ distribute: { enabled: false, provider: "postiz" } }).provider, "noop");
  assert.equal(createDistributor({ distribute: { enabled: true } }).provider, "postiz");
  assert.equal(createDistributor({ distribute: { enabled: true, provider: "postiz" } }).provider, "postiz");
  assert.equal(createDistributor({}, { provider: "mock" }).provider, "mock");
});

test("createDistributor throws on an unknown provider", () => {
  assert.throws(() => createDistributor({}, { provider: "buffer" }), /unknown distributor "buffer".*noop, mock, postiz/s);
});

test("the base Distributor.post is abstract (throws)", async () => {
  await assert.rejects(() => new Distributor().post({}), /Distributor\.post not implemented/);
});

test("NoopDistributor.post skips and reports the post count", async () => {
  const r = await new NoopDistributor().post({ posts: [{ kind: "short_crosspost" }] });
  assert.deepEqual(r, { skipped: true, provider: "noop", posts: 1 });
});

test("MockDistributor records the plan and returns its responder result", async () => {
  const d = new MockDistributor({ responder: () => ({ ok: true, ids: ["p1"] }) });
  const plan = buildDistributionPlan(samplePublish(), { config: { distribute: { enabled: true } } });
  const r = await d.post(plan);
  assert.deepEqual(r, { ok: true, ids: ["p1"] });
  assert.equal(d.calls.length, 1);
  assert.equal(d.calls[0].source_video_id, "abc123");
});

test("PostizDistributor.post throws until a client is injected (Wave 5 / T5.3)", async () => {
  await assert.rejects(() => new PostizDistributor().post({ posts: [] }), /not wired yet.*T5\.3/s);
});

test("PostizDistributor delegates to an injected client when present (proves the seam)", async () => {
  let seen = null;
  const client = { post: async (plan) => { seen = plan; return { ok: true }; } };
  const d = new PostizDistributor({ client });
  const plan = buildDistributionPlan(samplePublish(), { config: { distribute: { enabled: true } } });
  const r = await d.post(plan);
  assert.deepEqual(r, { ok: true });
  assert.equal(seen.posts[0].kind, "short_crosspost");
});

// --- [verifier] regression: caption fallback chain and link omission ---

test("[verifier] buildCrossPost caption fallback: empty title_options array falls through to empty string", () => {
  const p = buildCrossPost({ title_options: [], short: {} }, {});
  assert.equal(p.caption, "", "empty title_options must produce empty string, not crash");
});

test("[verifier] buildCrossPost caption fallback: non-array title_options treated as absent (falls to empty string)", () => {
  // If title_options is a non-array truthy value the Array.isArray guard must not throw.
  const p = buildCrossPost({ title_options: "bad-scalar", short: {} }, {});
  assert.equal(p.caption, "");
});

test("[verifier] buildCrossPost: empty-string videoUrl is treated as falsy — link derived from youtube_video_id", () => {
  // Callers that pass videoUrl: '' should still get a link from the id.
  const p = buildCrossPost({ youtube_video_id: "abc123" }, { videoUrl: "" });
  assert.equal(p.link, "https://youtu.be/abc123", "empty-string videoUrl must fall through to watchUrl(id)");
});

test("[verifier] buildCrossPost: channels default is empty array when not provided", () => {
  const p = buildCrossPost(samplePublish(), {});
  assert.ok(Array.isArray(p.channels), "channels must be an array");
  assert.equal(p.channels.length, 0);
});

test("[verifier] buildDistributionPlan: explicit provider override ignores enabled:false", () => {
  // A caller may force the provider even when distribution is disabled in config (e.g. tests, dry-run).
  const plan = buildDistributionPlan(samplePublish(), {
    config: { distribute: { enabled: false, provider: "postiz" } },
    provider: "postiz",
  });
  assert.equal(plan.provider, "postiz");
  assertValid(plan, "distribution.json");
});

test("[verifier] buildDistributionPlan: publish={} (completely empty) emits a schema-valid noop plan", () => {
  const plan = buildDistributionPlan({}, { config: {} });
  assertValid(plan, "distribution.json");
  assert.equal(plan.provider, "noop");
  assert.equal(plan.source_video_id, null);
  assert.equal("source_url" in plan, false, "source_url must be absent when no url available");
  assert.equal(plan.posts[0].caption, "");
  assert.equal(plan.posts[0].status, "pending");
});

test("[verifier] config.example.json validates against config.schema.json", async () => {
  // Regression guard: validate.js does NOT auto-map config.example.json, so we use the ESM validate here.
  // This test documents the gap and ensures the example stays valid as the schema evolves.
  const { validateFile } = await import("../shared/lib/validate-lib.mjs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const examplePath = path.resolve(__dirname, "../shared/config.example.json");
  const result = validateFile(examplePath, "config.schema.json");
  assert.ok(result.valid, `config.example.json failed schema validation: ${JSON.stringify(result.errors)}`);
});
