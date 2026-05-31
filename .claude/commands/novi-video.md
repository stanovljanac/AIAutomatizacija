# /novi-video

Scaffold and start a new video. This command creates a fresh video folder from the
template and walks Step 0 (topic + research) of `docs/WORKFLOW.md`.

## Usage
`/novi-video <slug> [topic or "discover"]`

Examples:
- `/novi-video sta-je-ai "Šta je AI i šta sve može u 2026."`
- `/novi-video novi-opus "Anthropic je izbacio novi model"`
- `/novi-video discover discover`  ← let the agent propose topics

## What you (the agent) do

1. **Pick the next id.** Find the highest `NNN` in `content/` and add 1
   (zero-padded to 3 digits). Combine with the slug: `content/<NNN>-<slug>/`.
2. **Copy the template.** Duplicate `content/_TEMPLATE/` into the new folder.
3. **Init `brief.json`:**
   ```json
   {
     "id": "<NNN>-<slug>",
     "title_working": "<topic or empty>",
     "angle": "",
     "audience": "Serbian AI-curious viewers",
     "target_seconds": 465,
     "format": "long",
     "sources": [],
     "status": "new"
   }
   ```
4. **Topic path:**
   - If a topic was given → confirm the angle and why-now with the human.
   - If `discover` → scan **clean sources** (official blogs, docs, GitHub
     releases, newsletters; YouTube only to see what's trending as a *topic*,
     never as a text source — D-002) and propose 3–5 topics with angle + why-now.
5. **Research → `sources.md`.** Gather paraphrased facts, each with a citable link.
   Never copy sentences; never use transcripts (D-002).
6. **Set `status: "researched"`** and tell the human the next step is Step 1
   (script-writing → script-review → Gate ①).

## Guardrails
- Free by default; flag any cost.
- Originality rules apply from the first step (PRD R1–R5).
- Do not proceed past Gate ① (script approval) without the human.

See `docs/WORKFLOW.md` for the full pipeline and the three gates.
