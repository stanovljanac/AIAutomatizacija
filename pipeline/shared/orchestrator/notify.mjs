// Notifications for the 2 human gates + pause events (locked decision #10).
// In Claude-Code mode the default transport DEFERS to the top agent (which calls the
// PushNotification tool); headless mode uses a file/email transport. Transports are injectable.
import fs from "node:fs/promises";

/** Build a short, owner-facing digest line block. Pure + tested. */
export function buildDigest({ event, videoId, title, band, scores, action, link, extra } = {}) {
  const lines = [`[The Automation Desk] ${event || "update"}${videoId ? ` — ${videoId}` : ""}`];
  if (title) lines.push(`Title: ${title}`);
  if (band) lines.push(`Review: band=${band}${Array.isArray(scores) ? ` scores=${scores.join("/")}` : ""}`);
  if (action) lines.push(`Action needed: ${action}`);
  if (link) lines.push(link);
  if (extra) lines.push(extra);
  return lines.join("\n");
}

/** Claude-Code mode: defer to the top agent (it fires PushNotification). */
export const deferredTransport = {
  name: "deferred",
  async send(payload) {
    return { deferred: true, payload };
  },
};

/** Headless mode: append the digest to a notifications log file. */
export function fileTransport(filePath) {
  return {
    name: "file",
    async send(payload) {
      await fs.appendFile(filePath, JSON.stringify({ at: new Date().toISOString(), ...payload }) + "\n");
      return { ok: true, file: filePath };
    },
  };
}

/** Send a notification through the chosen transport (defaults to deferred). */
export async function notify(payload, { channel = "push", transport } = {}) {
  const t = transport || deferredTransport;
  const digest = payload.digest || buildDigest(payload);
  return t.send({ channel, digest, ...payload });
}
