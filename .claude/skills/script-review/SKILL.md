---
name: script-review
description: Use to QA/review a written English script before a human sees it — checking the mandatory original human angle, archetype-appropriate accuracy (sources for comparisons/stats, synthetic data for demos, ideas framed as ideas), style-guide compliance, pacing, valid template tags, scene segmentation, and retention. Triggers on "review the script", "QA the script", or Step 1.3 of the workflow. Always runs after script-writing and before the human gate.
---

# Skill: Script review (QA agent)

You are the quality reviewer. Every script passes you **before** a human sees it
(PRD R10). You read `script.json` against `style/STYLE_GUIDE.md` and the brief, then
write `script.review.json` with `pass: true|false` + a list of issues.

> **Autonomous path (D-040/D-041/D-053):** this same rubric is also scored by the **reviewer
> panel** in `pipeline/shared/review/` — every enabled reviewer scores 1–10 against `rubric.mjs`
> (hard-gates + 5 weighted categories), the author merges fixes, and the loop repeats until every
> reviewer ≥9 (`loop.mjs`, schema `review.schema.json`). **Since 2026-07-09 (D-053) the panel is a
> single Claude sub-agent (Sonnet)** — Gemini was retired when the grown system exceeded its
> free-tier daily quota (20 req/day; sustained 503s); do not add/re-enable a reviewer without the
> owner. The checklist below is the human-readable source of truth for that rubric; keep them in sync.
>
> **This is the SCRIPT pass of ONE unified review.** A pre-script **idea-pass** (`stage:"idea"`,
> same panel/rubric) already decided the topic was worth making and recorded its **value_type +
> one takeaway** in `brief.json`. So this pass does NOT re-judge whether the idea is worth it — it
> checks the script is made well **and** that the promised `brief.takeaway` is actually delivered.

## Checklist (mirror of STYLE_GUIDE §10)
> Numeric thresholds come from the **FORMAT recipe** (`pipeline/shared/formats/default.json` via
> `resolveFormat`): hook timing (`hook.target_seconds`, `hook.answer_first_seconds`), length, pacing.
> Check the script against the resolved recipe; the values below are the current defaults.
- [ ] **Original human angle present** and surfaces in/after the hook (HARD — D-018).
- [ ] Hook lands within `format.hook.target_seconds` (default ~12s) and promises a payoff; the
      planned opening scene is **hook-class** (a `hook-card` or custom `hook-*`).
- [ ] **Accuracy by archetype:** comparison/stats claims trace to sources — **delegate to
      `claims.json`** (the `fact-check` skill's scorecard): every HIGH/MED claim is
      `verified`/`corrected` with a fetched `source_url`, none left `unverified`. Demo steps use
      **synthetic data**; conceptual claims are framed as ideas, not fact. (If `claims.json` is
      missing, run `fact-check` `draft` first.)
- [ ] **Answer-first (D-026):** the topic's core question is answered in the first 30–60s.
- [ ] **Specific, not vague (D-026):** real names/dates/numbers/places where possible; flag
      hand-wavy stats ("a lot of people…") and require a sourced specific instead.
- [ ] **Series + fingerprint (D-028):** a `lane` fits (Desk Fixes/Loops/Breakdowns/Notes or the
      broader AI How-To / Tool Review / AI News — `style/CHANNEL.md`); original angle present; ≥1
      custom/bespoke scene planned.
- [ ] **Takeaway delivered (idea-pass promise):** the one reusable takeaway named in `brief.takeaway`
      is actually landed in the script (a viewer can apply/believe it tomorrow) — not just implied.
- [ ] "Scale it to your own process" close where relevant; we don't build full systems.
- [ ] Sentences are clean timing units; no over-long scenes (≤ ~4 sentences).
- [ ] Every scene has a **valid `template`** tag (script.schema.json) and sensible role order.
- [ ] Tone = sharp practical engineer + warm teacher; no hype, no filler (blacklist §9).
- [ ] One subtle CTA (subscribe); short branded outro. A single topical `closing_question`
      ("Which hour would you hand over first?") is ALLOWED (Phase 1.3) — do **not** flag it as
      engagement-begging; only flag stacked CTAs / like-begging (STYLE_GUIDE §9).
- [ ] Term usage consistent (TERMBANK note); reads fluently aloud for an AI voice.
- [ ] **Editing law (only when `brief.editing_law` exists):** run
      `node pipeline/01-script/lint-vo.mjs <content-id>`. For capture-driven videos this is a HARD
      check — no narration sentence may open with click-narration ("then I", "next I click", "go
      to") and none of the declared setup vocabulary (OAuth, API key, Google Cloud…) may appear in
      any VO line. The picture shows the click; the voice says what changed and why. A brief with no
      `editing_law` skips it.

## Output
- `script.review.json`: `{ pass, issues: [{ scene_id?, severity, rule, note, fix_hint }] }`.
- If `pass: false`, hand back to `script-writing` for the fix loop (cap
  `config.review.script_max_loops`, then surface to the human).
- On `pass: true`, the script is ready for **Gate ② (human reviews the script)**.

Do not rewrite the script yourself — you review and return issues; the writer fixes.
