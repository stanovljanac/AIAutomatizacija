# Design — Video 010: "AI wrote the citations. A lawyer signed them." (Trust design in AI workflows)

**Date:** 2026-07-03
**Lane / archetype:** Desk Notes (news) — but its *real* subject is **trust design in AI workflows**.
**Assets:** one long (~5–6 min) + one paired Short (~45–55s). Bespoke HyperFrames-first scenes.
**Status:** design approved by owner (2026-07-03) with 3 corrections baked in. Ready for spec review → plan.

---

## 1. Positioning (why this video exists)

The channel is raising altitude ([[channel-altitude-shift]]): from "here's a process AI can
automate" to "here's how people who use AI seriously actually think." This is the **pilot** of that
Phase-2 direction. Its subject is **not** "AI hallucinations" — it is **trust design in AI
workflows**: where in a workflow you are allowed to trust a machine's output, and what has to be
true before you do.

- **A1 (this long)** = flagship philosophy video.
- **C1 (paired Short)** = viral distillation of the same idea.
- Topical news (Fable-5-is-back, model flood) = momentum around it, separate pieces.

This is the move that gives the channel a *brain*, not just a catalog of use cases.

## 2. The angle (mandatory human fingerprint)

**The failure is a usage failure, expressed as mechanics, not a moral scolding.** The tool did
exactly what it does — it generated plausible text. The break happened at **the point of trust**: a
human shipped an answer that had no source to stand on, into a place (a court) where being wrong has
teeth.

**Creator-defining line (the thesis):**
> "The model didn't lie. It generated. The failure happened at the point of trust."

We never say "RAG." We show *why* grounding exists by showing what its absence costs.

## 3. The three corrections (owner, non-negotiable)

1. **No single-cause / anti-ChatGPT framing.** Reality is always: AI hallucination **+** a broken
   verification process **+** a disciplinary system broader than one tool. Do not render it as
   "ChatGPT → license revoked." It is fact-check-fragile and comment-section bait.
   - **Hook = "A lawyer got suspended after filing AI-generated fake cases."** (owner-chosen,
     2026-07-03). Alt on file: "AI wrote the citations. A lawyer signed them." Blame the *point of
     trust*, not the entity.
2. **Grounding is a behavior principle, not "RAG solves hallucinations."** RAG *helps*, does not
   *solve*; these cases aren't purely a retrieval problem. Frame it as: **"systems allowed to fail
   loudly instead of silently"** / **"AI that refuses when it can't anchor an answer to a source."**
3. **Strengthen the closing trust-mechanism statement** — a behavior, not a disclaimer. Video lands
   on: **"Good AI doesn't always answer. Good AI knows when it doesn't know."**

## 4. Production guardrails

- **Tone: analytical, not true-crime.** Court-filing + red-stamp + "SUSPENDED" imagery is powerful
  but must stay clean and forensic, not dramatized horror. We are a *"serious AI systems thinking"*
  channel, **not** an "AI fear" channel. Cool, precise, brand black+gold — no ominous red-alert
  theatrics beyond the single functional "NOT FOUND / REVOKED" stamps.
- **Stat budget: 2–3 numbers, total, clustered into two beats** — "this is not one case" and "this
  is a pattern." No stat-overload middle. Each number that stays shows its source on-screen (D-026).
- **Bespoke scenes only** — every non-CTA scene visualizes its subject with motion
  ([[no-title-card-scenes]], [[strategist-scene-standard]]); no title-on-background cards.
- **The irony guardrail (see §7).**

## 5. Film beats → bespoke scenes (long)

Ordered; each is a HyperFrames-first bespoke scene unless noted. Exact scene list finalized in the
storyboard after the script.

1. **Hook** — a real-looking filing scrolls; citations look flawless; red stamps land: *NOT FOUND ·
   NOT FOUND · DOESN'T EXIST* → hard cut to **SUSPENDED**. Voice: "AI wrote the citations. A lawyer
   signed them."
2. **"How is this even possible?"** — anatomy of one hallucinated citation: a fake case name +
   reporter number *builds* letter-by-letter, looks authoritative, then dissolves — nothing behind
   it, no source link. (Mechanic, calm.)
3. **Not one case → a pattern** — the single dramatic human anchor (one case: "X of Y citations were
   fake") **then** the pattern number = **the count of documented AI-hallucination court cases in
   Damien Charlotin's database** (owner deferred the choice; decided 2026-07-03 — the database, NOT
   the $145k sanctions figure, because it is a primary maintained source). **Exactly 2 numbers in the
   whole video.** Both shown with on-screen sources. This is the entire stat budget.
4. **The turn (thesis)** — "Whose fault?" resolves to the mechanic: prompt → confident answer with
   **no source** → shipped with **no check**. Land the line: *"The model didn't lie. It generated.
   The failure happened at the point of trust."*
5. **Why it happens (≤15s)** — an LLM predicts *plausible* text; with nothing to retrieve from,
   plausible ≠ true. This is the "show why grounding exists" beat — **we never say "RAG."**
6. **How serious workflows handle it** — the behavior principle: **fail loudly, not silently** —
   AI that **refuses** when it can't anchor to a source. Show a good exchange where it says *"I
   couldn't verify this"* instead of inventing.
7. **The artifact (pause & screenshot)** — the copy-pasteable **cite-or-refuse prompt** on screen
   ([[lead-with-copy-pasteable-prompt]]); full text in the description. Draft in §6.
8. **The human gate** — money/legal always crosses a human. Brief.
9. **Close** — *"Good AI doesn't always answer. Good AI knows when it doesn't know."* → subscribe.

## 6. The takeaway artifact — cite-or-refuse prompt (draft, to be refined at script time)

> For every factual claim in your answer, name the specific source it comes from (title, site/author,
> date). If you can't point to a real, checkable source for a claim, don't include the claim — say
> "I couldn't verify this" instead. Never invent citations, quotes, case names, numbers, or links.
> If the whole answer can't be sourced, say that.

## 7. The irony guardrail (fact-check is the point)

A video about verification that gets a fact wrong is dead on arrival. Every claim below is currently
sourced only to **search-result summaries** and MUST be verified against **primary sources** by the
`fact-check` skill before scripting. Anything that can't be verified is **cut or softened, never
smoothed over** — we practice the video's thesis on the video itself.

Claims to verify (primary source in parentheses):
- **Number 1 — the human anchor:** the dramatic single case: attorney, jurisdiction, "X of Y
  citations fabricated" (the disciplinary order / court docket / state bar). **Do not assert "first
  in US history" unless a primary source supports it — soften to "one of the first" otherwise.**
  Candidate: the Nebraska suspension (Greg Lake, ~57 of 63 citations defective) — verify the exact
  figures and the suspension against the primary bar/court order before using.
- **Number 2 — the pattern (decided):** the count of documented AI-hallucination court cases in
  **Damien Charlotin's AI hallucination cases database** (damiencharlotin.com/hallucinations). Pull
  the live count at fact-check time; cite the database on-screen. **Not** the $145k lead-gen figure.
- Background only (context in the VO, *not* on-screen numbered claims): Sullivan & Cromwell "40+
  errors" apology (CNN Business, Apr 2026); the Oregon/Brigandi sanction. Use as narrative texture,
  not as extra on-screen stats.
- **Exactly 2 on-screen numbers total** (§4) — everything else is background.

## 8. C1 — paired Short (~45–55s)

One **visible escalating chain** ([[proof-must-be-visible]]), mobile-legible, bespoke:
fake citation appears (looks real) → magnifier: **NOT FOUND** → most of them flip red → license stamp
**REVOKED** → "one rule could've stopped it" → cite-or-refuse flash → close line. Same analytical
tone (no fear-channel). One-line cross-post caption at script approval ([[seo-at-script-approval]]).

## 9. Compliance & housekeeping

- Altered-content disclosure = yes; Azure final voice for publish, edge-tts for drafts (D-024/025).
- Sources shown on-screen next to every retained number (D-026, [[on-screen-source-for-stats]]).
- SEO (title/desc/tags + Short caption) generated at the **script gate** ([[seo-at-script-approval]]).
- Thumbnail: 2 prompts for the owner to generate; never auto ([[thumbnails-prompts-not-auto]]).

## 10. Out of scope (separate later thread)

The **pipeline grounding upgrade** ("cite-or-refuse" enforced in `fact-check` + "we couldn't find
this" as a valid output) is the owner's "RAG" idea as an *engine*. This video *demonstrates* the
principle and does **not** require that build. It gets its own spec later. True vector-RAG is likely
overkill; the discipline is live-search + strict cite-or-refuse verification.

## 11. Success criteria

- Passes `fact-check` against primary sources with **zero** unverifiable retained claims.
- Passes `script-review` (angle present, news-archetype accuracy, takeaway present, style).
- QA: bespoke ratio high, no title-card scenes, ≤3 on-screen numbers each with a source, captions
  legible/safe-zone, one continuous audio track.
- Reads as "serious AI systems thinking," not "AI fear."
