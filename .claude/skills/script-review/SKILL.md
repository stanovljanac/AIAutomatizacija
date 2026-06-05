---
name: script-review
description: Use to QA/review a written English script before a human sees it — checking the mandatory original human angle, archetype-appropriate accuracy (sources for comparisons/stats, synthetic data for demos, ideas framed as ideas), style-guide compliance, pacing, valid template tags, scene segmentation, and retention. Triggers on "review the script", "QA the script", or Step 1.3 of the workflow. Always runs after script-writing and before the human gate.
---

# Skill: Script review (QA agent)

You are the quality reviewer. Every script passes you **before** a human sees it
(PRD R10). You read `script.json` against `style/STYLE_GUIDE.md` and the brief, then
write `script.review.json` with `pass: true|false` + a list of issues.

## Checklist (mirror of STYLE_GUIDE §10)
- [ ] **Original human angle present** and surfaces in/after the hook (HARD — D-018).
- [ ] Hook lands in ≤ 10s and promises a payoff.
- [ ] **Accuracy by archetype:** comparison/stats claims trace to sources — **delegate to
      `claims.json`** (the `fact-check` skill's scorecard): every HIGH/MED claim is
      `verified`/`corrected` with a fetched `source_url`, none left `unverified`. Demo steps use
      **synthetic data**; conceptual claims are framed as ideas, not fact. (If `claims.json` is
      missing, run `fact-check` `draft` first.)
- [ ] **Answer-first (D-026):** the topic's core question is answered in the first 30–60s.
- [ ] **Specific, not vague (D-026):** real names/dates/numbers/places where possible; flag
      hand-wavy stats ("a lot of people…") and require a sourced specific instead.
- [ ] **Series + fingerprint (D-028):** a series tag fits (Desk Fixes/Loops/Breakdowns/Notes);
      original angle present; ≥1 custom/bespoke scene planned.
- [ ] "Scale it to your own process" close where relevant; we don't build full systems.
- [ ] Sentences are clean timing units; no over-long scenes (≤ ~4 sentences).
- [ ] Every scene has a **valid `template`** tag (script.schema.json) and sensible role order.
- [ ] Tone = sharp practical engineer + warm teacher; no hype, no filler (blacklist §9).
- [ ] One subtle CTA (subscribe); short branded outro.
- [ ] Term usage consistent (TERMBANK note); reads fluently aloud for an AI voice.

## Output
- `script.review.json`: `{ pass, issues: [{ scene_id?, severity, rule, note, fix_hint }] }`.
- If `pass: false`, hand back to `script-writing` for the fix loop (cap
  `config.review.script_max_loops`, then surface to the human).
- On `pass: true`, the script is ready for **Gate ② (human reviews the script)**.

Do not rewrite the script yourself — you review and return issues; the writer fixes.
