// R5 helper — build the enabled reviewer panel from config.review.panel.reviewers.
import { createReviewer } from "./reviewer.mjs";

export async function buildReviewers(config, deps = {}) {
  const specs = (config?.review?.panel?.reviewers || []).filter((r) => r.enabled !== false);
  return Promise.all(specs.map((s) => createReviewer(s, deps)));
}
