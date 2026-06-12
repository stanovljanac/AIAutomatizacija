# shared/knowledge — freshness cache (anti-stale)

The single source of truth for any **time-sensitive** fact a script might quote: model/tool
versions, API prices, free-tier limits, specs. The hard rule (CLAUDE.md, `fact-check` +
`script-writing` skills): these are **verified live, never recalled from model memory** — a
recalled price or version goes stale and breaks monetization (the April-2026 free-tier shift
is the worked proof). Wave 3 · T3.1.

## Files
- **`facts.json`** — the curated bank. Flat list of facts, each with `value`, `source`
  (official page), `retrieved` (ISO date last confirmed live), and `kind`
  (`model_version` | `price` | `free_tier_limit` | `spec` | `other`). Schema:
  `pipeline/shared/schemas/facts.schema.json`. `policy.max_age_days` sets the staleness
  window. **Humans/agents curate the values** (after a live web check); nothing auto-writes them.
- **`refresh-facts.mjs`** — the **staleness auditor**. It does NOT change any value. It reports,
  per fact: `stale` (older than `max_age_days`), `unreachable` (its `source` didn't fetch),
  and `value_missing` (the cached value no longer appears on the source page — a "the page
  changed under us" signal). Anything flagged lands in `needs_review` for a human/agent to
  re-confirm live and update `value` + `retrieved`.
- **`freshness-report.json`** — written by the auditor (git-ignored output).

## Use it
```
node pipeline/shared/knowledge/refresh-facts.mjs            # audit + write freshness-report.json
node pipeline/shared/knowledge/refresh-facts.mjs --strict   # exit 1 if anything needs review
node pipeline/shared/knowledge/refresh-facts.mjs --no-fetch  # staleness-by-age only (no network)
```
Why curated + audit (not auto-overwrite): auto-parsing a precise price out of a blog/RSS feed
is fragile and risks writing a *wrong* number — the exact failure the anti-stale rule exists to
prevent. So the auditor only surfaces what to re-check; the value changes only after a live
confirmation (owner decision, Wave 3).

## How the pipeline consumes it
`fact-check` (`freshness` mode) reads `facts.json` first for any model/tool/price/version/limit
claim; a script quoting a different number is **corrected** to the `facts.json` value. Scheduling
the audit on a cadence folds into Wave 5 (T3.3 → T5.1).
