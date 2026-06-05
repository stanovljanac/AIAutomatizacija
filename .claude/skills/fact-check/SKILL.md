---
name: fact-check
description: Use to generate and self-verify the factual backbone of a script — extracting every checkable claim (names, dates, numbers, prices, tool versions, free-tier limits, stats), verifying each against live web sources, and writing sources.md + a claims scorecard. Generates the sourced answer AND verifies it. Runs at draft time (after script-writing, feeding script-review) and again at QA on the rendered narration. Triggers on "fact-check", "verify the claims", "source this", or the accuracy step of the workflow.
---

# Skill: Fact-check (generate + self-verify)

Remove the owner's manual "Google it to confirm" step. You GENERATE the sourced factual
core and VERIFY it, so a script's names/dates/numbers/prices/versions are correct and cited
before the human gate — and stay correct at publish. (Answer-first + specific facts: D-026.)

## When to use (activation examples)
- "fact-check the script for 003" / "verify the claims in this comparison".
- A **Comparison/Breakdown** (tool vs tool): pricing, free-tier limits, model names/versions.
- A **Desk Notes / news Short**: dates, who announced what, numbers.
- Any script with a stat ("saves X hours", "Y% of teams") or a version/price.
- Automatically before **Gate ②** (draft) and again in **05-qa** (final) on the narration.

## Modes
- `draft` (primary): read `script.json` (or a claims brief), extract claims, verify, write
  `sources.md` + `claims.json`. Hand HIGH-severity unverified claims back to `script-writing`.
- `freshness`: the time-sensitive subset (versions, pricing, limits) — stamp a retrieved
  date and a `recheck_by`; flag anything older than the recheck window.
- `final`: in QA, re-check the claims actually spoken (from `script.json`/`alignment.json`)
  against `sources.md`; confirm nothing drifted; emit a one-line pass for the publish gate.

## The generate→verify loop
1. **Extract** every checkable claim; classify: entity, date, number/stat, price, version,
   limit, quote. Ignore opinion, predictions, and the original angle — those are not facts.
2. **Generate** the sourced answer: state the specific value (names/dates/numbers). If the
   draft is vague ("a lot of people"), generate a specific sourced replacement or flag it.
3. **Verify**: per claim, `WebSearch` → open the best primary/reputable source with
   `WebFetch` → confirm the exact value. Prefer official docs / vendor pricing pages /
   primary announcements over blogs. (Search snippets are a lead, not proof — always fetch.)
4. **Record** citation (url, publisher, retrieved date) + status:
   `verified` · `corrected` (source disagrees → propose right value+source) ·
   `unverified` (no reliable source) · `stale-risk` (time-sensitive; mark `recheck_by`).
5. **Gate**: block on any HIGH-severity claim that is `unverified` or `corrected`-but-unfixed.
   Synthetic demo data is exempt (intentionally fake — see `screen-capture`/`script-writing`).

## Outputs
- `content/<id>/sources.md` — facts + citable links (the file `script-review` already expects).
- `content/<id>/claims.json` — scorecard: `[{ id, scene_id, type, claim, value, status,
  source_url, publisher, retrieved, recheck_by?, severity, note }]`.
- Append a `factcheck` block to `script.review.json` (draft) / `qa.report.json` (final):
  pass/fail + counts by status.

## Verification step (how to confirm the skill did its own job)
- Every HIGH/MED claim has status ∈ {verified, corrected} with a `source_url` that was
  actually **fetched** (not just searched).
- No claim spoken in the final narration lacks a `sources.md`/`claims.json` entry
  (cross-check `script.json` sentences ↔ `claims.json`).
- `draft` mode is **idempotent** — re-running yields the same scorecard unless sources changed.
- `final` mode passes only if every spoken HIGH claim is `verified` and unchanged since draft.

## Tools this skill needs (and why)
- **WebSearch** — discover candidate sources per claim.
- **WebFetch** — open the chosen source and confirm the exact value + capture the citation
  (the real verification, not snippet-trust).
- **Read** — `script.json`, `brief.json`, existing `sources.md`/`claims.json`.
- **Write / Edit** — `sources.md`, `claims.json`, the review/qa note.
- **Grep / Glob** — locate claims across scenes; reuse existing sources.
- **Bash (`date`)** — stamp `retrieved` and compute `recheck_by` for freshness.
- *(Future)* a reputable-domain allow/deny list + a small source cache; optional YouTube Data
  API to verify channel/stat claims.

## Guardrails
- Sources give **facts only, never sentences** — cite, don't copy.
- ≥1 reputable source for MED; ≥2 (incl. a primary) for HIGH or surprising claims.
- **Never invent a citation.** `unverified` is an honest, acceptable status — surface it.
- Opinions/predictions/the angle are not claims — leave them.

## Integration
- **01-script:** `script-writing` drafts → `fact-check` (`draft`) → `script-review` (its
  accuracy checklist now delegates to `claims.json`) → Gate ②.
- **05-qa:** `fact-check` (`final`) on the rendered narration → feeds the publish gate.
