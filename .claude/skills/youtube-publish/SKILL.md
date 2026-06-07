---
name: youtube-publish
description: Use to prepare and publish a finished video to YouTube — generating English SEO title, description (keyword-first), tags, chapters, picking one of the two thumbnails, building the Short, and uploading as a private/draft via the YouTube Data API for the owner's final review and publish click. Triggers on "publish", "upload to YouTube", "make the description", or Step 6 of the workflow. Never publishes publicly without the owner.
---

# Skill: YouTube publish

You prepare everything and upload a **private/draft** for the owner's final click
(PRD R15). Never publish publicly yourself. Output: `publish.json` (schema
`pipeline/shared/schemas/publish.schema.json`).

## Timing (owner rule 2026-06-07)
- **Draft the SEO now, at SCRIPT APPROVAL — instant, don't wait for publish.** As soon as the
  script is approved, generate `publish.json` with the **title (name) for BOTH the video AND
  the Short**, the description, tags, and the Short's **one-line caption**. Refine here at the
  publish step (chapters need final timings). This gives the owner the names early.

## Generate (English, SEO — STYLE_GUIDE §8, CHANNEL §7)
- **Title:** benefit/curiosity + front-loaded **search keyword** (`brief.search_term`),
  ≤ ~60 chars, no pure clickbait.
- **Description — MAX 3 sentences (owner rule 2026-06-07):** exactly up to 3 SEO-dense
  sentences, packed with the keywords people search, that describe what actually happens in
  the video. Then append **chapters** (timestamps from `alignment.json`/scene starts) and the
  altered-content line. Long utility text (e.g. the copy-pasteable master prompt) goes in a
  **pinned comment** (`publish.json.pinned_comment`), NOT the 3-sentence description.
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
  short title. Length per **STYLE_GUIDE §7** (canonical) — ~50–60s, hard max 2:00.
- **The Short gets a ONE-SENTENCE caption with a LINK to the full video (owner rule
  2026-06-07).** One cross-post sentence that teases the long video and links to it, e.g.
  "… — the faster one quietly got it wrong. Watch the full test: <link>". Store it in
  `publish.json.short.caption` (the real URL is filled at upload); the owner reuses it across
  other socials (X, IG, TikTok, LinkedIn).

## Medium (every video — owner rule 2026-06-07)
For this and every future video, generate a Medium description optimized to be **cited by AI
search engines** (ChatGPT, Google AI Overview, Perplexity, Claude). Run this EXACT prompt on
the **transcript** (the ordered `script.json` sentences) and save the output verbatim to
`content/<id>/medium.md` (output only the description text, nothing else):

> Here's the transcript of my YouTube video. Write a description optimized to be cited by AI
> search engines like ChatGPT, Google AI Overview, Perplexity, and Claude. Follow this
> structure exactly:
> - Open with one sentence that clearly states what the video is about, using natural
>   keywords someone might search.
> - A 2 to 4 sentence overview of the full video.
> - A bulleted "What's covered in this video" section that mirrors the natural sections of
>   the video. Each bullet should be one sentence and reference specific names, places,
>   brands, or details from the transcript.
> - A final line that starts with "Mentioned in this video:" followed by every named person,
>   company, product, location, or specific concept that comes up. Comma-separated.
> Total length: 600 to 700 words. Write in plain declarative sentences. No hype language, no
> emojis, no calls to subscribe, no hashtags. Output only the description text, nothing else.

## Upload
- Via YouTube Data API v3 as **private/draft** with all metadata + thumbnail, plus the
  Short. Uploads are quota-heavy — space them.
- The owner reviews title/description/tags and **clicks publish**.

## After publish
- Set `brief.json.status: "published"`. Append outcome to `content/<id>/log.md`,
  `docs/PROGRESS.md`, and the idea's `metrics` in `pipeline/00-ideas/ideas.json`
  (CTR/retention later) so the idea-bank can be **re-ranked** (growth loop).
