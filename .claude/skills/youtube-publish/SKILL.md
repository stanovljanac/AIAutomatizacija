---
name: youtube-publish
description: Use to prepare and publish a finished video to YouTube — generating SEO title, description, tags, chapters, and a thumbnail spec, building the Short variant, and uploading as a private/draft via the YouTube Data API for the human's final review and publish click. Triggers on "publish", "upload to YouTube", "objavi", "napravi opis i tagove", or Step 6 of the workflow. Never publishes publicly without the human.
---

# Skill: YouTube publish

You prepare everything for publishing and upload a **private/draft** so the human
does the final review and clicks publish (PRD R15, semi-automatic). You also build
the Short. You never make a video public on your own.

## Read first
- `style/CHANNEL.md` (SEO strategy, niche, name) and `style/STYLE_GUIDE.md` §8.
- The video's `script.json`, `alignment.json` (for chapter timestamps),
  `video/final.mp4` (+ `video/short.mp4`).
- Schema: `pipeline/shared/schemas/publish.schema.json`.

## Inputs → Output
- **In:** the files above + `config.json` (channel/account, paths) + YouTube OAuth
  creds (path from `.env`, stored outside git).
- **Out:** `content/<id>/publish.json` + a private/draft upload on YouTube.

## Step 1 — Metadata (Serbian, SEO-aware)
- **Title:** benefit/curiosity + front-loaded keyword, ≤ ~60 chars, no pure
  clickbait (STYLE_GUIDE §8). Offer 2 variants for the human to pick.
- **Description:** first 1–2 lines = hook + main keywords; then a short summary;
  then **chapters** (from `alignment.json` scene starts) and any links. Natural
  keywords, no stuffing.
- **Tags:** topic + entity names (models/tools) + Serbian variants.
- **Thumbnail spec:** 1–4 word Serbian phrase, brand layout (VISUAL_IDENTITY §9),
  rendered via the Remotion `ThumbnailTemplate` (reproducible).
- Write all of it to `publish.json`.

## Step 2 — Originality / credit check (PRD R4)
- If this video is about someone's **strictly original IP** (e.g. reviewing their
  named skill/tool), **ask the human** whether to credit the source in the
  description, and how. Most videos won't need this — only when it's clearly one
  person's original work.

## Step 3 — Short
- Build/confirm `video/short.mp4` (from the same script's key beats or standalone),
  with its own short title + a few tags. Shorts funnel to the long video (pin a
  comment / link).

## Step 4 — Upload as draft
- Use YouTube Data API v3 to upload `final.mp4` as **private** (or unlisted draft)
  with the metadata + thumbnail attached.
- Auth: OAuth via the human's own consent flow; creds/token live **outside git**.
  Never create accounts, never enter passwords, never put secrets in code/URLs/
  committed files. Uploads are quota-heavy — don't retry blindly.

## Step 5 — Hand to human (Gate after QA already passed)
- Surface: chosen title/description/tags/thumbnail + the draft link. The human does
  the **keyword + SEO pass** and clicks publish.
- After publish: set `status = "published"`; append outcome (title, link, date) to
  `content/<id>/log.md` and a line to `docs/PROGRESS.md`.

## Don'ts
- Don't publish publicly without explicit human action.
- Don't fabricate stats or keywords; base tags on the actual topic/sources.
- Don't store OAuth tokens or client secrets in the repo.
- Don't keyword-stuff or use misleading clickbait (channel trust, monetization).
