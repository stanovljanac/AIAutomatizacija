# /novi-video

Scaffold and start a new video. Creates a fresh video folder from the template and
walks Step 0 (pick a scored idea → archetype → angle) of `docs/WORKFLOW.md`.

## Usage
`/novi-video <slug> [idea or "next"]`

Examples:
- `/novi-video invoice-emails-sheets "Automate Invoice Emails in Google Sheets"`
- `/novi-video shift-scheduler "Auto-build Café Shift Schedules"`
- `/novi-video next next`  ← take the top-scored idea from the idea-bank

## What you (the agent) do

> Steps 1–3 are automated by a deterministic scaffold — run
> `npm run new-video -- <slug> "Working title"` (or
> `node pipeline/00-ideas/new-video.mjs <slug> "Working title"`). It picks the next id,
> copies `_TEMPLATE`, and writes a schema-valid `brief.json`. It refuses to overwrite an
> existing folder. Then continue from step 4.

1. **Pick the next id.** Highest `NNN` in `content/` + 1 (zero-padded). → `content/<NNN>-<slug>/`.
2. **Copy the template** `content/_TEMPLATE/` into the new folder.
3. **Init `brief.json`** (schema-valid; archetype defaults to `ideas`, status `new`).
4. **Idea path:**
   - If an idea was given → use it.
   - If `next` → read `pipeline/00-ideas/ideas.json` and take the top-`score`
     `backlog` idea; copy its `task`/`sector`/`tool`/`archetype`/`angle_hint` into the brief.
5. **Classify + angle.** Set `brief.archetype` (ideas | mini-demo | diagram | comparison)
   and draft the **original angle** (`brief.angle`). For Comparison/stats, research →
   `sources.md` (paraphrased facts + links; never transcripts — D-002).
6. **Set `status: "ideated"`**, then present topic + archetype + **angle** for
   **GATE ①**. Do not start the script until the owner approves.

## Guardrails
- Free/local by default; flag any cost.
- Originality + the mandatory human angle apply from the first step (PRD R1–R6, D-018).
- Synthetic demo data only. Do not proceed past a gate without the owner.

See `docs/WORKFLOW.md` for the full pipeline and the three gates.
