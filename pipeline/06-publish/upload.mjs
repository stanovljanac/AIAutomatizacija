// YouTube upload (P5) — the Publisher port. Uploads the video as a PRIVATE/DRAFT with the
// composed metadata + thumbnail, never public (PRD R15). Pure builders are testable; real
// network calls go through an injected youtube client (googleapis), so tests need no keys.
import fs from "node:fs";

const ALTERED_CONTENT_LINE =
  "Disclosure: this video uses an AI voice and AI-generated visuals (altered/synthetic content).";
const SUBSCRIBE_CTA = "Subscribe → @TheAutomationDesk";

/** Final YouTube description = 3-sentence desc + chapters + altered-content line + CTA. */
export function composeDescription(publish) {
  const parts = [publish.description || ""];
  if (Array.isArray(publish.chapters) && publish.chapters.length) {
    parts.push(publish.chapters.map((c) => `${c.time} ${c.label}`).join("\n"));
  }
  if (publish.altered_content) parts.push(ALTERED_CONTENT_LINE);
  parts.push(SUBSCRIBE_CTA);
  return parts.filter(Boolean).join("\n\n");
}

export function chosenTitle(publish) {
  return publish.chosen_title || publish.title_options?.[0] || "Untitled";
}

export function buildVideoResource(publish, { privacy = "private", categoryId = "27", madeForKids = false } = {}) {
  return {
    snippet: {
      title: chosenTitle(publish),
      description: composeDescription(publish),
      tags: publish.tags || [],
      categoryId,
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: madeForKids,
    },
  };
}

/** Insert a video via an injected youtube client. Resumable upload via a file read stream. */
export async function uploadVideo({ client, publish, videoPath, privacy, categoryId, madeForKids }) {
  const requestBody = buildVideoResource(publish, { privacy, categoryId, madeForKids });
  const res = await client.videos.insert({
    part: ["snippet", "status"],
    requestBody,
    media: { body: fs.createReadStream(videoPath) },
  });
  return { videoId: res.data.id, response: res.data };
}

export async function setThumbnail({ client, videoId, thumbPath }) {
  if (!thumbPath || !fs.existsSync(thumbPath)) return { skipped: true };
  await client.thumbnails.set({ videoId, media: { body: fs.createReadStream(thumbPath) } });
  return { ok: true };
}

/** High-level Publisher: resolve a client (or use an injected one), upload draft, set thumbnail. */
export class YouTubePublisher {
  constructor({ config, auth } = {}) {
    this.config = config || {};
    this.auth = auth;
  }

  async makeClient() {
    const { google } = await import("googleapis");
    return google.youtube({ version: "v3", auth: this.auth });
  }

  async publishDraft(publish, { videoPath, thumbPath, client } = {}) {
    const yt = client || (await this.makeClient());
    const yc = this.config.youtube || {};
    const { videoId } = await uploadVideo({
      client: yt,
      publish,
      videoPath,
      privacy: yc.upload_privacy || "private",
      categoryId: yc.category_id || "27",
      madeForKids: yc.made_for_kids || false,
    });
    // Record id/status IMMEDIATELY — a later thumbnail hiccup must never orphan the upload.
    publish.youtube_video_id = videoId;
    publish.status = "uploaded_private";
    // A thumbnail failure shouldn't fail the publish: the draft is already up; warn instead.
    let thumbnail_warning = null;
    try {
      await setThumbnail({ client: yt, videoId, thumbPath });
    } catch (e) {
      thumbnail_warning = `Thumbnail not set (${e.message}). The draft is uploaded; set it in Studio.`;
    }
    // The Data API does not expose the "altered/synthetic content" disclosure toggle; the
    // owner sets it once in Studio (or it is auto-detected). Surface a reminder.
    return {
      videoId,
      thumbnail_warning,
      altered_content_reminder: publish.altered_content
        ? "Set 'Altered content = Yes' in YouTube Studio (Data API does not expose this field)."
        : null,
    };
  }
}
