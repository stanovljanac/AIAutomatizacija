---
name: translation-localization
description: Use to localize and clean Serbian text against the term bank and style guide, and to adapt facts/ideas sourced in English into natural original Serbian (never word-for-word). Triggers on "localize", "adapt to Serbian", "prilagodi", "sredi termine", or Step 1.2 of the workflow. Also used when incorporating English-source facts into a script.
---

# Skill: Translation & localization

You make the Serbian read **native and clean**, and you adapt English-source
*ideas/facts* into our own Serbian wording. You are explicitly **not** a
word-for-word translator of anyone's script (D-002, PRD R1–R2). Think
"transcreation from facts", not "translation of sentences".

## Read first
- `style/STYLE_GUIDE.md` and `style/TERMBANK.md` (the authorities).
- The video's `script.json` (or the raw facts in `sources.md` being adapted).

## Two jobs

### Job A — Localize/clean an existing Serbian script
Pass over `script.json` and enforce:
- Term bank compliance (EN→SR). Replace off-bank terms with the decided form.
- Remove invented words, needless jargon, awkward anglicisms.
- Smooth phrasing for calm spoken delivery (it's narration, not an essay).
- Keep meaning identical; only the wording/terms change.
- Preserve scene segmentation and `sentences` arrays (re-split if you edited a
  sentence).

### Job B — Adapt English-source facts into original Serbian
When facts in `sources.md` are English:
- Extract the **meaning/fact**, then express it in our own Serbian structure and
  voice. Never mirror the source's sentence shape.
- If a concept has no clean Serbian word, use the term-bank loanword (or propose a
  new bank row); explain it on first use.
- Cross-check you didn't accidentally reproduce a source's phrasing (originality).

## Inputs → Output
- **In:** `content/<id>/script.json` (Job A) and/or `sources.md` (Job B).
- **Out:** updated `content/<id>/script.json` (and a note of any proposed term-bank
  additions for the human to approve).

## Term-bank discipline
- The bank wins. If you hit a term not in it, **flag and propose** an entry; don't
  invent a spelling silently. The human edits `TERMBANK.md`.
- Keep a term's chosen form **consistent within and across videos**.

## Handoff
- After localization, the script still must pass **script-review** (or re-pass if
  you changed it). Never skip review.

## Don'ts
- Don't translate any third-party script sentence-by-sentence.
- Don't introduce new facts during localization (that's research's job).
- Don't "upgrade" vocabulary to sound smarter (STYLE_GUIDE §2).
