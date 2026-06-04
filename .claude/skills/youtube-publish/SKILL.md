---
name: youtube-publish
description: Use to prepare and publish a finished video to YouTube — generating English SEO title, description (keyword-first), tags, chapters, picking one of the two thumbnails, building the Short, and uploading as a private/draft via the YouTube Data API for the owner's final review and publish click. Triggers on "publish", "upload to YouTube", "make the description", or Step 6 of the workflow. Never publishes publicly without the owner.
---

# Skill: YouTube publish

You prepare everything and upload a **private/draft** for the owner's final click
(PRD R15). Never publish publicly yourself. Output: `publish.json` (schema
`pipeline/shared/schemas/publish.schema.json`).

## Generate (English, SEO — STYLE_GUIDE §8, CHANNEL §7)
- **Title:** benefit/curiosity + front-loaded **search keyword** (`brief.search_term`),
  ≤ ~60 chars, no pure clickbait.
- **Description:** hook + main keyword in the first 1–2 lines; short summary; then
  **chapters** (timestamps from `alignment.json`/scene starts); then any links.
- **Tags:** task + tool names (Sheets, Excel, Outlook, Notion, Claude…) + variants.
- **Thumbnail:** the owner picks `thumb_a` or `thumb_b`.
- **Always disclose altered content (D-025).** We use an AI voice + AI visuals, so set
  **"altered content = yes"** at upload (YouTube Studio toggle; check if the Data API exposes
  it, else the owner toggles it in Studio). `publish.json.altered_content` is `true`.
- **Answer-first description (D-026):** the first 1–2 lines should directly answer the video's
  core question with specific facts, then the keyword — this feeds AI overviews.
- Monetization = ad RPM + views; single CTA = **subscribe → @TheAutomationDesk**.

## Short
- Build the **Short** from the 1–2 key beats (vertical, light music ok), with its own
  short title/description.

## Upload
- Via YouTube Data API v3 as **private/draft** with all metadata + thumbnail, plus the
  Short. Uploads are quota-heavy — space them.
- The owner reviews title/description/tags and **clicks publish**.

## After publish
- Set `brief.json.status: "published"`. Append outcome to `content/<id>/log.md`,
  `docs/PROGRESS.md`, and the idea's `metrics` in `pipeline/00-ideas/ideas.json`
  (CTR/retention later) so the idea-bank can be **re-ranked** (growth loop).
