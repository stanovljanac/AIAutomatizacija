# ARCHITECTURE

How the system is wired, how data flows, and the contract every pipeline phase
must honor. Read `docs/PRD.md` first for the *why*; this is the *how*.

---

## 1. Mental model

Three layers:

1. **Orchestrator** — Claude Code on your Windows PC. It reads `CLAUDE.md`, picks
   the right skill, and runs pipeline phases. It holds little state itself.
2. **Pipeline phases** — small, numbered, single-purpose programs under `pipeline/`.
   Each reads the previous phase's files and writes its own. Plain Node/Python.
3. **Compute** — **the core runs locally** (edge-tts, render, stock). GPU work
   (occasional AI images) is **optional, opt-in** on free cloud GPU (Colab/Kaggle);
   AI-video is deferred. (DECISIONS D-015.)

State lives on disk, in **one folder per video** (`content/<id>/`) — inspectable,
resumable, git-friendly. **Per-video content and the idea-bank are git-ignored;** only the
`_TEMPLATE` skeleton and the system (code/docs/skills/schemas/templates) are committed.
001/002 stay tracked for history (gitignore doesn't untrack existing files); 003+ and
`pipeline/00-ideas/ideas.json` are ignored.

## 2. Folder map

```
AIAutomatizacija/
├── CLAUDE.md              Thin router the agent reads first.
├── README.md             Human onboarding.
├── docs/                 The brain (prose).  PRD · ARCHITECTURE · TOOLS · WORKFLOW
│                         · ROADMAP · PROGRESS · DECISIONS · SETUP
├── .claude/
│   ├── skills/<step>/SKILL.md    One rulebook per step (source of truth).
│   └── commands/                 Slash commands (e.g. /novi-video).
├── style/                STYLE_GUIDE · VISUAL_IDENTITY · CHANNEL   (TERMBANK retired)
├── pipeline/             The code, as numbered phases (see §8) + shared/.
├── templates/remotion/   Reusable render project (intro/outro/scene templates).
├── content/              One folder per video (_TEMPLATE skeleton; 001 archived).
├── assets/               Shared fonts/sfx/icons (media git-ignored).
└── scripts/              Helper scripts (setup, OBS profile, optional colab).
```

## 3. One topic = one folder (canonical layout)

> **Git scope:** this whole folder is git-ignored going forward (only `_TEMPLATE` is
> tracked). The layout below still describes what every video folder contains on disk;
> it just isn't committed. 001/002 remain in history by owner choice.

The topic folder **is** the long video; the **Short is a nested lean sub-unit** at
`short/` (its own script/voice/alignment/scene-plan/video; it inherits topic, angle and
sources from the long unit above). `build-props.mjs` detects the Short by the last path
segment (`.../short`) → vertical 1080×1920. Legacy `002-short`/`003-short` stay flat.

```
content/<NNN>-<slug>/
├── brief.json            Idea, archetype, angle, tags, score, sources, status.
├── sources.md            Facts + citable links (Comparisons/stats; not transcripts).
├── script.json           Ordered SCENES, each with a `template` tag (see §5).
├── script.review.json    Review agent's findings + pass/fail (incl. angle check).
├── voice/                (git-ignored) narration.wav — one continuous track.
├── alignment.json        Sentence/word timestamps from forced alignment.
├── scene-plan.json       Per-scene template + props (deterministic; storyboard out).
├── visual-prompts.json   Thumbnail + occasional concept-image prompts only.
├── images/               (git-ignored) thumbnails / rare AI or stock images.
├── captures/             (git-ignored) your OBS recordings for mini-demos.
├── render/               (git-ignored) engine props + intermediate frames.
├── video/                (git-ignored) the long final.mp4 (+ thumb_a/b.png).
├── short/                The nested Short sub-unit:
│   ├── script.json           Short's own ~50–60s script.
│   ├── voice/                (git-ignored) Short narration.
│   ├── alignment.json        Short's timestamps.
│   ├── scene-plan.json       Short's scene plan.
│   └── video/               (git-ignored) the Short final.mp4.
├── qa.report.json        Automated QA results + the 30s digest.
├── publish.json          Title, description, tags, chapters, thumbnail, status.
└── log.md                Human-readable history of this video.
```

## 4. Pipeline contract (every phase obeys this)

1. **I/O via the video folder.** A phase reads named files and writes named files. No hidden state.
2. **Idempotent.** Re-running with the same inputs yields the same outputs.
3. **Resumable + cached.** Heavy work is chunked; finished chunks are cached and skipped.
4. **Status, not crashes.** A phase updates `brief.json.status` and exits cleanly with a
   clear message on failure; it never leaves half-written files.
5. **Free/local by default.** If a phase would incur cost or need cloud, it flags it.
6. **Validates against a schema** in `pipeline/shared/schemas/`.

Status values (`brief.json`):
`new → ideated → scripted → script_approved → voiced → planned → captured →
rendered → qa_passed → ready → published`
(`captured` applies only to the mini-demo archetype.)

## 5. The data spine: `script.json` (scene-segmented, template-tagged)

```jsonc
{
  "id": "002-automate-invoice-emails",
  "language": "en",
  "archetype": "ideas",                 // ideas | mini-demo | diagram | comparison
  "angle": "The one-line opinionated take that makes this video ours.",
  "title_working": "5 Boring Tasks AI Can Automate in Google Sheets",
  "target_seconds": 360,
  "scenes": [
    {
      "id": "s01",
      "role": "hook",                    // hook|intro|point|demo|transition|cta|outro
      "template": "hook-card",           // deterministic → render component
      "narration": "Full sentence(s) spoken in this scene.",
      "sentences": ["Full sentence(s) spoken in this scene."],
      "on_screen_text": "Optional ≤6-word line",
      "capture_id": null                 // or a capture id for a mini-demo scene
    }
    // …more scenes…
  ]
}
```

Why template-tagged: the renderer maps each `template` **deterministically** to a
component (no per-video bespoke layout code). Variety comes from a rich scene
vocabulary + the 4 archetypes. (DECISIONS D-013.)

## 6. The sync mechanism (solving the cut-voice bug) — unchanged

```
script.json (scenes → sentences)
      ▼  02-voice: edge-tts the FULL narration → voice/narration.wav  (continuous)
      ▼  02-voice: forced alignment            → alignment.json { sentence → {start,end} }
      ▼  04-render: buildTimeline(alignment + scene-plan) → content/<id>/timeline.json
         (engine-agnostic, SECONDS, per-scene `engine`; the sync logic lives HERE, once)
      ▼  04-render: compile-remotion (or, later, compile-hyperframes) translates the
         timeline → engine props/blocks (seconds → frames). Captions use the SAME timings.
         scene[i] is visible from alignment[first sentence].start to [last].end → always in sync
```

No phase ever slices the audio. Visuals and captions are *positioned in time* to match
the audio. **Engine seam (V5):** the timeline is the single, renderer-independent source of
truth; `build-props.mjs` builds it, then `compile-remotion.mjs` (the only engine compiler
today) renders byte-identically to the pre-seam output. Adding HyperFrames means adding a
compiler that reads the same timeline — the sync logic is never duplicated. For the mini-demo archetype, a `capture-segment` scene plays the recording
inside its scene window, with auto-zoom/highlight on the cursor.

## 7. Compute split (local vs optional cloud)

| Work | Where | Why |
|------|-------|-----|
| Orchestration, scripts, JSON, validation | Local | Light |
| Script / QA text / angle | Claude Code | Best quality, in-subscription |
| TTS (voice) | **Local (edge-tts)** | Free, fast, good English |
| Forced alignment | Local | Lightweight |
| Render | **Local** (Remotion / engine) | Mostly-2D is feasible local |
| Stock images/video | Local (Pexels/Pixabay API) | Just downloads |
| Screen captures | Local (you record in OBS) | Real demo footage |
| AI images (rare) | **Optional** Colab/Kaggle | Opt-in only; not a critical path |

## 8. The skills ↔ phases mapping

| Phase            | Skill (rulebook)                                   |
|------------------|----------------------------------------------------|
| 00-ideas         | idea-bank logic in `pipeline/00-ideas` + WORKFLOW.md |
| 01-script        | script-writing, then script-review                 |
| 02-voice         | voice-synthesis (edge-tts)                          |
| 03-visuals       | storyboard (scene-plan) → visual-prompts (thumbnails); screen-capture for demos |
| 04-render        | video-render                                       |
| 05-qa            | qa-video                                           |
| 06-publish       | youtube-publish                                    |

> `translation-localization` is retired (single language).

## 9. Render engine (Phase-2 bake-off) — DECISIONS D-019

- Candidates: **Remotion** (React, mature, already set up) and **HyperFrames** (HeyGen,
  open-source HTML→MP4, agent-native, GSAP/Lottie/Three.js).
- Target combo: **Remotion owns the timeline/sync/captions/intro-outro**; **HyperFrames
  optionally renders flashy scene-blocks to MP4** that Remotion imports.
- A `render.engine` flag in `config.json` selects `remotion` | `hyperframes` | `combo`.
  Adopt the combo only if it clearly beats Remotion-solo; else Remotion-solo (HyperFrames
  documented plan-B).

## 10. Configuration & secrets

- `pipeline/shared/config.json` (git-ignored copy from `config.example.json`): paths,
  default lengths, `voice` (edge-tts voice id), `render.engine`, stock keys, review policy.
- `.env` holds API keys (Pexels, YouTube OAuth). Never commit. The agent must never put
  secrets in code, URLs, or committed files.

## 11. Failure & recovery quick reference

| Symptom | What happened | Recovery |
|---------|---------------|----------|
| Scene drifts from audio | alignment.json stale | Re-run 02-voice align, then 04-render |
| Capture unreadable | zoom/region wrong | Re-run screen-capture plan; re-record segment |
| QA flags content | rule violation | QA emits digest; owner approves the proposed fix |
| QA finds technical break | no audio / cut / no captions | QA auto-fixes and re-renders that step |
| Render slow locally | heavy effects | Simplify scene template, or move that block to chosen engine |
| AI image step needs cloud | optional path | Skip (use code-visual/stock) or run the opt-in Colab notebook |

## 12. Autonomy, freshness & swappability (built — Waves 3–5)

These layers make the studio hands-off and keep facts current. All are pure-core + injected-IO
(testable without network/keys), obey the §4 pipeline contract, and route agent steps through the
Runner / Reviewer / Publisher ports.

**Freshness & news (anti-stale).**
- `pipeline/shared/knowledge/facts.json` — curated, source-backed model/price/version/free-tier values
  (each with `source` + `retrieved`), seeded **live, never from memory**. `refresh-facts.mjs` is a
  *staleness auditor*: it flags stale / unreachable / changed facts but **never overwrites a value**
  (auto-parsing a number risks writing a wrong one — the exact thing the anti-stale rule prevents).
  Schema `facts.schema.json`.
- `pipeline/00-ideas/fetch-news.mjs` (the **`NewsSource` port**) — no-dep RSS/Atom + Hacker-News-Algolia
  parsers, dedup across sources by normalized-title hash (≥2 sources ⇒ higher score), writes `news.json`,
  promotes top corroborated items to **Desk Notes** ideas. Every source fails soft. *(Open: some official
  changelogs still serve HTML not RSS → fail-soft to 0 items; wire verified RSS endpoints when found.)*

**Swappability seams (a config flip, not a rewrite).**
- **Render engine** — `render.engine` = `remotion | hyperframes | combo` (§9); the engine-agnostic
  `timeline.json` is the seam (§6), so a second compiler never duplicates the sync logic.
- `pipeline/02-voice/voice-dispatcher.mjs` — the **`TtsProvider`** seam: a Node selector over
  `VOICE_SCRIPTS` (edge-tts → `make_voice.py`, azure → `make_voice_azure.py`); draft = edge-tts,
  `--final` = Azure (D-024). Alignment stays provider-agnostic. Adding a provider = one map entry + one script.
- `pipeline/07-distribute/distributor.mjs` — the **`Distributor`** seam: a pure plan builder →
  schema-valid `distribution.json` + Noop / Mock / Postiz adapters + `createDistributor` (noop while
  `config.distribute.enabled` is false). The live Postiz client is the remaining T5.3 (D-027).

**Growth loop (analytics → re-rank).**
- `pipeline/06-publish/fetch-analytics.mjs` — pulls each produced video's YouTube Analytics
  (views / retention / CTR) into its idea's `metrics`, then **re-ranks the bank**: produced ideas blend
  the predicted `score` → measured `performance`; backlog ideas get a bounded task-cluster nudge.
  Idempotent (`adjusted_score` re-derived from the immutable `score`; effective rank = `adjusted_score ?? score`).
  Numbers arrive once the first upload sets `youtube_video_id`.

**Autonomous driver (the hands-off pass).**
- `pipeline/00-ideas/pick-next.mjs` — auto-pick the top backlog idea by effective score → `scaffoldVideo`
  + seed brief → mark in-progress (persisted **before** the run so a crash can't orphan the pick).
- `pipeline/shared/orchestrator/auto-run.mjs` — one pass: idle → pick; busy → resume the in-progress
  video; then run the DAG and `classifyPause` the result into **done / ownerGate / agentTask**. Gate-aware
  `notifiesOwner` in `run.mjs` pings the owner ONLY at the two real gates / a failed review / OAuth /
  errors — never on a Claude-Code skill hand-off.
- **Scheduling:** a session-local **CronCreate** routine loops `auto-run` (weekly); each fire advances one
  step. In Claude-Code mode the in-session agent fulfils the `agentTask` hand-offs (script-writing, render,
  qa, …) and PushNotifies the owner at the gates. The video is auto-drafted to YouTube **private** — never
  published automatically.

**One-time setup (free):** `GEMINI_API_KEY` (2nd reviewer) + YouTube OAuth (`node pipeline/06-publish/auth.mjs`;
publish the OAuth app to **Production** → non-expiring token; one consent covers upload + read-only Analytics).
See `docs/SETUP.md`.
