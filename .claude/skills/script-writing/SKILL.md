---
name: script-writing
description: Use when writing or drafting a video script for the channel — turning a researched topic (brief.json + sources.md) into a scene-segmented, high-retention Serbian script (script.json). Triggers on "write the script", "draft the video", "napiši skriptu", or starting Step 1 of the workflow. Do NOT use for translating someone else's script (we don't do that) or for reviewing a script (use script-review).
---

# Skill: Script writing

You write the **original Serbian** script for a video, as scene-segmented JSON.
This is Step 1 of `docs/WORKFLOW.md`. You are NOT translating anyone — you write
from the *facts* in `sources.md`, in our own words and structure.

## Read first
- `style/STYLE_GUIDE.md` — the writing law (tone, hard rules, structure, scenes).
- `style/TERMBANK.md` — EN→SR term decisions you MUST follow.
- The video's `brief.json` (topic, angle, target_seconds, format) and `sources.md`
  (the facts you may use).
- Schema: `pipeline/shared/schemas/script.schema.json`.

## Inputs → Output
- **In:** `content/<id>/brief.json`, `content/<id>/sources.md`.
- **Out:** `content/<id>/script.json` (valid against the schema).

## Method

1. **Internalize the facts.** List the 4–6 key facts/points from `sources.md` worth
   covering for this `target_seconds`. Drop the rest. Never invent facts.
2. **Plan the arc** (STYLE_GUIDE §5): hook → intro → 3–6 body points/demos →
   payoff → subtle CTA → outro. Decide which points need a **screen capture** or
   an **AI image** vs **motion text**.
3. **Write scene by scene** (STYLE_GUIDE §6). For each scene:
   - `narration`: exact spoken Serbian, obeying every hard rule.
   - `sentences`: split narration into individual sentences (timing units).
   - `visual_intent`: plain "what's on screen".
   - `on_screen_text` (optional, ≤ ~6 words), `screen_capture` (id or null).
   - `role`: hook | intro | point | demo | transition | cta | outro.
   - Keep scenes ~1–4 sentences / ~5–20s. Don't write a 60s monologue scene.
4. **Pace to length.** Estimate ~150–170 spoken Serbian words/min (calm pace).
   For 7–8 min that's ~1100–1350 words total. Don't pad; trim filler.
5. **Hook discipline.** The first ≤15s must promise a payoff or pose a sharp
   question. No "u ovom videu ćemo…".
6. **Self-pass** the STYLE_GUIDE §10 checklist before handing off.

## Hard rules (from STYLE_GUIDE §2 — do not break)
- No invented words. No needless jargon. Terms per `TERMBANK.md`.
- No English-spelled-as-Serbian when a clean Serbian word exists.
- Every claim maps to `sources.md`. Calm, fluent, one idea per sentence.
- Scene-segmented so audio/visual sync works downstream.

## Output rules
- Write valid `script.json`; fill all required fields per the schema.
- Set `brief.json.status = "scripted"` when done (or note it for the orchestrator).
- Then hand off to **script-review** (Step 1.3). Do not skip review.

## Don'ts
- Don't translate or closely paraphrase any source's sentences (D-002, R1–R2).
- Don't write visuals here beyond `visual_intent` — that's the storyboard's job.
- Don't exceed target length "to be safe"; respect pacing.

## Example (one scene)
```json
{
  "id": "s01",
  "role": "hook",
  "narration": "Veštačka inteligencija u 2026. više nije naučna fantastika — danas ti piše kod, pravi slike i odgovara na pitanja bolje nego ikad. Za sedam minuta objasniću ti šta ona zaista jeste i šta sve može.",
  "sentences": [
    "Veštačka inteligencija u 2026. više nije naučna fantastika — danas ti piše kod, pravi slike i odgovara na pitanja bolje nego ikad.",
    "Za sedam minuta objasniću ti šta ona zaista jeste i šta sve može."
  ],
  "visual_intent": "Brz montažni niz: model piše kod, generiše sliku, vodi razgovor. Energično, brend-tamna pozadina.",
  "on_screen_text": "ŠTA JE AI — 2026",
  "screen_capture": null
}
```
