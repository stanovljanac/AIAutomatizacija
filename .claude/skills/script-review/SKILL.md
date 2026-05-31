---
name: script-review
description: Use to QA/review a written script before a human sees it — checking factual consistency against sources, style-guide and term-bank compliance, pacing, scene segmentation, and retention. Triggers on "review the script", "QA the script", "proveri skriptu", or Step 1.3 of the workflow. Always runs after script-writing and before the human gate.
---

# Skill: Script review (QA agent)

You are the language/quality reviewer. Every script passes you **before** a human
reads it (PRD R10, R13). You check, you report, and in the early phase you **flag**
issues for the writer to fix (you do not silently rewrite). The writer fixes and
re-submits until you pass it.

## Read first
- `style/STYLE_GUIDE.md` (esp. §2 hard rules, §10 checklist) and `style/TERMBANK.md`.
- The video's `script.json` and `sources.md`.
- Schema: `pipeline/shared/schemas/script.schema.json`.

## Inputs → Output
- **In:** `content/<id>/script.json`, `content/<id>/sources.md`.
- **Out:** `content/<id>/script.review.json`:
```json
{
  "pass": false,
  "checked_at": "2026-05-31T00:00:00Z",
  "issues": [
    { "scene": "s03", "type": "term", "severity": "high",
      "detail": "Reč 'fičer' nije u term banku.", "suggestion": "Koristi 'funkcija'." },
    { "scene": "s05", "type": "fact", "severity": "high",
      "detail": "Tvrdnja nije pokrivena u sources.md.", "suggestion": "Ukloni ili nađi izvor." }
  ],
  "summary": "2 high issues; fix and re-run."
}
```

## Checklist (run all; cite scene ids)
1. **Facts:** every claim traces to `sources.md`. Flag unsupported claims (`fact`).
2. **Invented words:** any non-word or made-up term → `invented`, high severity.
3. **Term bank:** every EN-origin term matches `TERMBANK.md`. Mismatch → `term`.
   If a term isn't in the bank, flag `term-missing` and **propose a row** (don't
   guess silently).
4. **Anglicisms:** English-spelled-as-Serbian where a clean Serbian word exists →
   `anglicism`.
5. **Jargon:** needless complexity to "sound smart" → `jargon`; suggest simpler.
6. **Pacing:** sentences are clean timing units; no over-long scenes; word count
   roughly fits `target_seconds` (~150–170 wpm) → `pacing`.
7. **Segmentation:** scene roles present & ordered (hook→…→outro); `sentences`
   array matches `narration` → `structure`.
8. **Retention:** hook lands ≤15s and promises payoff; segments have takeaways;
   one subtle CTA; short outro → `retention`.
9. **Tone:** "knowledgeable older brother", not stiff, not hype → `tone`.
10. **Fluency:** reads cleanly aloud at a calm pace → `fluency`.

## Severity & pass rule
- `high` = factual/invented/term/anglicism errors, broken structure.
- `medium` = pacing, jargon, weak hook/CTA.
- `low` = minor polish.
- **`pass: true`** only when there are **no `high`** issues and ≤ a couple of
  `medium` ones. Otherwise `pass: false`.

## Loop
- If `pass: false`, the writer (script-writing) applies fixes and re-runs you.
- Early phase: if it doesn't pass after **3 loops**, stop and surface to the human
  with the outstanding issues (don't loop forever).
- Later phase (ROADMAP P5): you may direct an auto-fix re-run for low/medium issues.

## Don'ts
- Don't rewrite the script yourself in early phase — report and let the writer fix
  (keeps responsibilities clean and the human in the loop).
- Don't pass a script with any unsupported factual claim.
