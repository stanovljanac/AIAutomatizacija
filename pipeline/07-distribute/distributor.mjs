// Distributor port — the cross-platform distribution seam (Wave 4 / T4.3; consumed by Wave 5 /
// T5.3 + D-027). It defines the port + a PURE plan builder so adding a real channel hub (Postiz,
// self-hosted = free) is a config flip + one adapter, never a pipeline rewrite — the same shape as
// the Runner / Reviewer / Publisher ports.
//
// SCOPE THIS WAVE: the seam only. There is NO live network here — Postiz needs the owner's
// one-time self-hosted setup, so PostizDistributor.post() is a declared stub that throws until
// Wave 5 (T5.3) injects the HTTP client. createDistributor() defaults to a no-op so the pipeline
// runs unchanged while distribution is disabled.
//
// Flow (Wave 5): after upload.mjs sets publish.youtube_video_id → buildDistributionPlan(publish,…)
// → createDistributor(config).post(plan) → cross-post the Short caption + link to the channels.

const CHANNEL_HANDLE = "@TheAutomationDesk";

/** Watch URL for an uploaded video id (null when not uploaded yet). */
export function watchUrl(videoId) {
  return videoId ? `https://youtu.be/${videoId}` : null;
}

/**
 * Build the Short cross-post derivative (D-038): the one-line caption + a link back to the long
 * video. Pure. Prefers the Short→Long BRIDGE caption (publish.bridge.short_caption — the formalized
 * ecosystem chain) so cross-post and pin stay in sync, then short.caption, then the chosen/first
 * title. The link falls back to the bridge's long_url placeholder when no real URL exists yet.
 */
export function buildCrossPost(publish = {}, { videoUrl, channels = [] } = {}) {
  const short = publish.short || {};
  const bridge = publish.bridge || {};
  const caption =
    bridge.short_caption ||
    short.caption ||
    publish.chosen_title ||
    (Array.isArray(publish.title_options) ? publish.title_options[0] : "") ||
    "";
  const link = videoUrl || watchUrl(publish.youtube_video_id) || bridge.long_url || "";
  const post = { kind: "short_crosspost", caption, channels, status: "pending" };
  if (link) post.link = link;
  return post;
}

/**
 * Build the full distribution.json plan from publish.json + the uploaded URL. Pure + schema-valid
 * (schemas/distribution.schema.json). Wave 4 emits the Short cross-post only; Wave 5 (T5.3) appends
 * link_post / pin / blog derivatives.
 */
export function buildDistributionPlan(publish = {}, { videoUrl, config = {}, provider } = {}) {
  const dist = config.distribute || {};
  const channelsByKind = dist.channels || {};
  const resolvedProvider = provider || (dist.enabled ? dist.provider || "postiz" : "noop");
  const url = videoUrl || watchUrl(publish.youtube_video_id) || undefined;
  const plan = {
    version: 1,
    source_video_id: publish.youtube_video_id ?? null,
    provider: resolvedProvider,
    posts: [buildCrossPost(publish, { videoUrl: url, channels: channelsByKind.short_crosspost || [] })],
  };
  if (url) plan.source_url = url;
  return plan;
}

// ── the port: post(plan) is the swappable part; adapters share the base ──────────────────────

export class Distributor {
  constructor(opts = {}) {
    this.opts = opts;
    this.config = opts.config || {};
    this.provider = "base";
  }
  // eslint-disable-next-line no-unused-vars
  async post(plan) {
    throw new Error(`${this.constructor.name}.post not implemented`);
  }
}

/** Distribution disabled: a safe no-op so the pipeline runs unchanged. */
export class NoopDistributor extends Distributor {
  constructor(opts = {}) {
    super(opts);
    this.provider = "noop";
  }
  async post(plan = {}) {
    return { skipped: true, provider: "noop", posts: (plan.posts || []).length };
  }
}

/** Tests: records the plans it was given; `responder(plan)` may override the result. */
export class MockDistributor extends Distributor {
  constructor(opts = {}) {
    super(opts);
    this.provider = "mock";
    this.calls = [];
    this.responder = opts.responder || (() => ({ ok: true }));
  }
  async post(plan) {
    this.calls.push(plan);
    return this.responder(plan);
  }
}

/**
 * Postiz (self-hosted, free — D-027). STUB this wave: post() throws until Wave 5 (T5.3) injects an
 * HTTP client (`opts.client`). With a client present it delegates, so T5.3 is one adapter, not a
 * rewrite of this seam.
 */
export class PostizDistributor extends Distributor {
  constructor(opts = {}) {
    super(opts);
    this.provider = "postiz";
    this.client = opts.client || null;
  }
  async post(plan) {
    if (!this.client) {
      throw new Error(
        "Postiz distributor not wired yet — owner sets up self-hosted Postiz + POSTIZ_* env in Wave 5 / T5.3 (D-027)"
      );
    }
    // Wave 5 (T5.3): map each plan.post → a Postiz schedule/post call via this.client.
    return this.client.post(plan);
  }
}

const REGISTRY = {
  noop: NoopDistributor,
  mock: MockDistributor,
  postiz: PostizDistributor,
};

/** Pick a distributor by explicit opts.provider, else config.distribute (noop when disabled). */
export function createDistributor(config = {}, opts = {}) {
  const dist = config.distribute || {};
  const provider = opts.provider || (dist.enabled ? dist.provider || "postiz" : "noop");
  const Cls = REGISTRY[provider];
  if (!Cls) {
    throw new Error(`unknown distributor "${provider}" (have: ${Object.keys(REGISTRY).join(", ")})`);
  }
  return new Cls({ ...opts, config });
}

export { CHANNEL_HANDLE };
