# ARCHITECTURE

How the system is wired, how data flows, and the contract every pipeline phase
must honor. Read `docs/PRD.md` first for the *why*; this is the *how*.

---

## 1. Mental model

Three layers:

1. **Orchestrator** — Claude Code on your Windows PC. It reads `CLAUDE.md`, picks
   the right skill, and runs pipeline phases. It is the "brain"; it holds little
   state itself.
2. **Pipeline phases** — small, numbered, single-purpose programs under
   `pipeline/`. Each reads the previous phase's files and writes its own. They are
   plain Node/Python; no magic.
3. **Compute** — light work runs locally; **GPU-heavy work runs on free cloud GPU**
   (Google Colab / Kaggle) and writes results back into the video folder.

State lives on disk, in **one folder per video** (`content/<id>/`). This makes
every step inspectable, resumable, and git-friendly (text/JSON committed, media
ignored).

## 2. Folder map (what each thing is for)

```
AIAutomatizacija/
├── CLAUDE.md              Thin router the agent reads first.
├── README.md             Human onboarding.
├── .gitignore            Keeps media out of git.
│
├── docs/                 The brain (prose, no code).
│   ├── PRD.md             What & why (product).
│   ├── ARCHITECTURE.md    This file: how it works.
│   ├── TOOLS.md           Every tool: role, free/paid, link, limits.
│   ├── WORKFLOW.md        Step-by-step topic→publish + the 3 gates.
│   ├── ROADMAP.md         Phases 0→5 with concrete exit criteria.
│   ├── PROGRESS.md        Running log (human + agent append).
│   ├── DECISIONS.md       Why we chose X over Y (ADR-style).
│   └── SETUP.md           Install everything from zero on Windows.
│
├── .claude/
│   ├── skills/            One rulebook per step (the source of truth).
│   │   └── <step>/SKILL.md
│   └── commands/          Slash commands (e.g. /novi-video).
│
├── style/                Identity.
│   ├── STYLE_GUIDE.md     Tone + language rules (writing law).
│   ├── TERMBANK.md        EN→SR term decisions (you edit this).
│   ├── VISUAL_IDENTITY.md Colors, fonts, motion language.
│   └── CHANNEL.md         Name, niche, audience, SEO.
│
├── pipeline/             The code, as numbered phases.
│   ├── 00-topic/          Discover/validate a topic; gather sources.
│   ├── 01-script/         Write script (scene-segmented) + run review.
│   ├── 02-voice/          TTS (adapter) + forced alignment → timestamps.
│   ├── 03-visuals/        Storyboard → prompts → images/clips/captures.
│   ├── 04-render/         Feed everything into Remotion; output mp4.
│   ├── 05-qa/             Automated sync/subtitle/scene checks.
│   ├── 06-publish/        Title/desc/tags/thumb + YouTube draft upload.
│   └── shared/            Config, schemas, utils used by all phases.
│
├── templates/remotion/   Reusable Remotion project (intro/outro/scenes).
│
├── content/              One folder per video.
│   ├── _TEMPLATE/         Empty skeleton to copy.
│   └── 001-sta-je-ai/     Worked example.
│
├── assets/               Shared fonts/music/screenshots (media git-ignored).
└── scripts/              Helper scripts (setup, batch, colab launchers).
```

## 3. One video = one folder (the canonical layout)

Everything about a single video lives here. Phases read/write these files.

```
content/<NNN>-<slug>/
├── brief.json            Topic, angle, target length, sources, status.
├── sources.md            Researched facts + citable links (NOT transcripts).
├── script.json           The script as an ordered list of SCENES (see §5).
├── script.review.json    Review agent's findings + pass/fail.
├── voice/                (git-ignored) narration.wav (one continuous track).
├── alignment.json        Sentence/word timestamps from forced alignment.
├── storyboard.json       Per-scene visual plan (on-screen description).
├── visual-prompts.json   Image prompts + derived video-animation prompts.
├── images/               (git-ignored) generated/stock images.
├── captures/             (git-ignored) your screen recordings for tool demos.
├── render/               (git-ignored) Remotion props + intermediate frames.
├── video/                (git-ignored) final.mp4 + short.mp4.
├── qa.report.json        Automated QA results (sync, subtitles, scenes).
├── publish.json          Title, description, tags, thumbnail spec, status.
└── log.md                Human-readable history of this specific video.
```

## 4. Pipeline contract (every phase obeys this)

1. **Input/output via the video folder.** A phase reads named files from
   `content/<id>/` and writes named files back. No hidden state.
2. **Idempotent.** Re-running a phase with the same inputs yields the same outputs
   and must not corrupt prior work.
3. **Resumable + cached.** Long/heavy work is chunked; each finished chunk is
   cached (e.g. per-image, per-scene). A re-run skips done chunks. This is how we
   survive Colab disconnects (PRD R18).
4. **Status, not crashes.** A phase updates `brief.json.status` and exits cleanly
   with a clear message on failure; it does not leave half-written files.
5. **Free by default.** If a phase would incur cost, it stops and flags it.
6. **Validates against a schema.** Shapes of `script.json`, `storyboard.json`,
   etc. are defined in `pipeline/shared/schemas/`. A phase validates its output.

Status values (in `brief.json`):
`new → researched → scripted → script_approved → voiced → storyboarded →
storyboard_approved → visualized → rendered → qa_passed → ready → published`

## 5. The data spine: `script.json` (scene-segmented)

This is the most important schema. Everything downstream maps to **scenes**.

```jsonc
{
  "id": "001-sta-je-ai",
  "language": "sr",
  "title_working": "Šta je AI i šta sve može u 2026.",
  "target_seconds": 465,                 // ~7:45
  "scenes": [
    {
      "id": "s01",
      "role": "hook",                    // hook|intro|point|demo|transition|cta|outro
      "narration": "Cela rečenica koja se izgovara u ovoj sceni.",
      "sentences": [                      // narration split into sentences
        "Cela rečenica koja se izgovara u ovoj sceni."
      ],
      "visual_intent": "What should be on screen, in plain language.",
      "b_roll": ["keyword", "for stock/AI image"],
      "screen_capture": null,             // or a capture id if a tool demo
      "on_screen_text": "Optional kinetic-typography line",
      "notes": "Anything the storyboard/visual steps must know."
    }
    // …more scenes…
  ]
}
```

Why scene-segmented: the voice step generates **one continuous audio** for the
whole `narration` stream, but alignment gives us the **time** each sentence
starts/ends. Because scenes are defined on sentence boundaries, the render step
switches scenes exactly at those times — audio is never cut (PRD R11–R12).

## 6. The sync mechanism (solving the cut-voice bug)

```
script.json (scenes → sentences)
      │
      ▼
02-voice: TTS the FULL narration  ──►  voice/narration.wav   (continuous)
      │
      ▼
02-voice: forced alignment        ──►  alignment.json
      │                                  { sentence_id → {start, end} }
      ▼
04-render: Remotion reads alignment + storyboard
      │   scene[i] is visible from alignment[first sentence of i].start
      │   to alignment[last sentence of i].end
      ▼
   subtitles use the SAME word/sentence timings  →  always in sync
```

No phase ever slices the audio. Visuals and captions are *positioned in time* to
match the audio, not the other way around.

## 7. Compute split (local vs cloud)

| Work | Where | Why |
|------|-------|-----|
| Orchestration, scripts, JSON, validation | Local (PC) | Light, instant |
| Script / translation / QA text | Claude Code | Best Serbian, in-subscription |
| TTS (voice) | **Cloud GPU** (Colab/Kaggle) | 4GB VRAM too small for good TTS |
| Forced alignment | Local or cloud | Lightweight enough for either |
| AI image generation (Flux/SDXL) | **Cloud GPU** | Won't fit 4GB VRAM |
| Stock images (Pexels/Pixabay) | Local (API) | Just downloads |
| Remotion render | Local first → cloud if slow | Mostly-2D 7–8 min is feasible local |
| Screen captures | Local (you record) | Real tool footage |

Cloud jobs are launched via notebooks/scripts in `scripts/colab/` (added in
Phase 2/3). They pull the video folder's inputs, run, and push results back; all
chunked and cached (the contract, §4.3).

## 8. The skills ↔ phases mapping

Skills are *instructions for the agent*; phases are *code*. A skill tells the
agent how to drive (or write) a phase.

| Phase            | Skill (rulebook)                                   |
|------------------|----------------------------------------------------|
| 00-topic         | logic in WORKFLOW.md + 00-topic (no separate skill)|
| 01-script        | script-writing, then script-review, +translation-localization |
| 02-voice         | voice-synthesis                                    |
| 03-visuals       | storyboard → visual-prompts                        |
| 04-render        | video-render                                       |
| 05-qa            | qa-video                                           |
| 06-publish       | youtube-publish                                    |

## 9. Configuration & secrets

- `pipeline/shared/config.example.json` → copy to `config.json` (git-ignored):
  paths, default length, voice provider toggle (`free_tts` | `elevenlabs`),
  stock API keys, etc.
- `.env` (git-ignored) holds API keys (Pexels, YouTube OAuth client). Never
  commit. `.env.example` lists required names. See `docs/SETUP.md`.
- The agent must **never** put secrets in code, URLs, or committed files.

## 10. Extensibility (planned, not built yet)

- **n8n** (free, self-hosted) can later wrap the phases for fully-scheduled,
  hands-off runs. Deferred until the manual pipeline is proven (DECISIONS D-006).
- **Cloud storage** (e.g. Terabox 1TB free) for media when local space runs out;
  swap the `content/**/video` location via config.
- **Multi-language** output later by adding a translation target + TTS voice.

## 11. Failure & recovery quick reference

| Symptom | What happened | Recovery |
|---------|---------------|----------|
| Colab disconnected | Session timed out | Re-run the same phase; cached chunks skip |
| Voice sounds wrong | Free TTS quality | Flip config to `elevenlabs` fallback (D-003) |
| Scene drifts from audio | alignment.json stale | Re-run 02-voice alignment, then 04-render |
| Render too slow locally | Heavy effects | Move render to cloud (OQ2), or simplify scene |
| QA fails sync check | timestamps mismatch | 05-qa report names the scene; re-render it |
