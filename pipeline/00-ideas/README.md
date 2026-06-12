# Phase 00-ideas — the idea-bank

This phase owns the **idea-bank** that drives production, and the `/novi-video`
scaffold. See `docs/WORKFLOW.md` Step 0 and `docs/ARCHITECTURE.md`.

## Files
- `ideas.json` — the flat, multi-tagged, scored backlog (schema:
  `pipeline/shared/schemas/ideas.schema.json`).
- `new-video.mjs` — deterministic scaffold: next `NNN` id, copy `content/_TEMPLATE`,
  init `brief.json`. Run via `npm run new-video -- <slug> "Working title"`.
- `fetch-news.mjs` — the **news watch** (Wave 3, `NewsSource` port). Pulls each enabled
  `config.news.sources` entry (official RSS/changelog + The Decoder + TLDR AI + Hacker News
  Algolia JSON), normalizes them (no-dep RSS/Atom parser), **dedups across sources by
  normalized-title hash** (≥2 sources ⇒ higher score), writes `news.json`, and promotes the
  top corroborated items into **Desk Notes** ideas here (`source.origin:"news"`). Every source
  is fail-soft. Run: `node pipeline/00-ideas/fetch-news.mjs [--dry-run]`.
- `news.json` — normalized, deduped, scored news (schema:
  `pipeline/shared/schemas/news.schema.json`). Generated, git-ignored.

> Time-sensitive facts (model/tool versions, prices, free-tier limits) do NOT live here —
> they're the curated freshness cache in `pipeline/shared/knowledge/` (Wave 3, T3.1).

## Idea-bank model (DECISIONS D-013/D-018; CHANNEL §5)
- **Flat list, multi-tagged** (`task`, `sector`, `tool`, `archetype`) **+ a 0–100
  `score`** = predicted popularity (free signals: YouTube/Google search-suggest,
  autocomplete, competitor view counts) blended with judgment.
- Produce in **score order**. After each publish, write CTR/retention into the idea's
  `metrics` and **re-rank** — the bank learns which task/sector/tool/archetype wins.
- Refresh the bank periodically from clean sources (no transcripts — D-002).

## Using it
1. Pick the top `status: "backlog"` idea by `score` (or take one the owner names).
2. Scaffold the video, set `brief.archetype` + draft `brief.angle` → **Gate ①**.
3. On produce, set the idea `status: "in-progress"` → `"produced"` and link
   `produced_video_id`.

> The idea-bank is seeded in Phase 0b and is the single backlog for the channel.
