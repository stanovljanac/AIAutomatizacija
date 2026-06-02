# PROGRESS LOG

Running history of what was done, by whom (human/agent), and what's next. Newest
entries on top. Keep entries short and factual. Per-video history goes in each
video's `content/<id>/log.md`; this file is the project-level log.

Format:
```
## YYYY-MM-DD — <short title>
- who: human | agent
- did: …
- next: …
- blockers: … (optional)
```

---

## 2026-05-31 — Project foundation created
- who: agent (planning session)
- did: Defined the whole project with the owner via a long Q&A. Created repo
  structure, `CLAUDE.md`, full `docs/` (PRD, ARCHITECTURE, TOOLS, WORKFLOW,
  ROADMAP, PROGRESS, DECISIONS, SETUP), `style/` files, all `.claude/skills/`,
  command `/novi-video`, Remotion template stubs, `_TEMPLATE`, and the worked
  example `001-sta-je-ai`.
- decisions logged: D-001…D-009 in `docs/DECISIONS.md`.
- next: Phase 1 — install environment per `docs/SETUP.md`, push repo to GitHub,
  then render the 10s Remotion test.
- blockers: none. Open questions OQ1 (free Serbian TTS quality), OQ2 (local render
  speed), OQ3 (channel account) tracked in PRD §10.

<!-- New entries below this line, newest on top. Add as you build each phase. -->

## 2026-06-02 — PIVOT: Serbian-AI → "Boring AI Automations" (English, faceless)
- who: agent + owner (long decision interview)
- did: After Serbian TTS proved an unfixable free blocker (D-010), re-founded the
  project as an **English, faceless** channel about **boring everyday AI automations**
  for builders/freelancers. Ran a full design interview (9 rounds) and executed the
  Phase-0 doc migration:
  - Tagged `serbian-ai-archive` at HEAD (old work preserved; nothing deleted).
  - Logged **D-011…D-019** (pivot, name, archetypes+fixed-templates, edge-tts EN voice,
    local-first compute, EconVault account, ad-RPM, human-angle rule, render bake-off).
  - Rewrote `CLAUDE.md`, `README.md`, all `docs/` (PRD, ARCHITECTURE, WORKFLOW, ROADMAP,
    TOOLS, SETUP) and `style/` (CHANNEL, STYLE_GUIDE, VISUAL_IDENTITY); retired
    `TERMBANK.md` → EN note.
  - Updated skills: retired `translation-localization`, rewrote the rest for EN +
    4 archetypes + 3 gates, added new `screen-capture` skill.
  - Schemas: updated `brief`/`script` (archetype, angle, template tags), added
    `ideas` + `scene-plan`; wired the validator. Updated `config.json` (edge-tts, en,
    `render.engine`). Renamed phase `00-topic` → `00-ideas`.
  - Seeded the **idea-bank**: `pipeline/00-ideas/ideas.json` (50 scored, multi-tagged
    ideas) — validates. Added a `_TEMPLATE/script.sample.json` (validates).
- decisions: D-011…D-019 added (supersede, don't delete; D-008 avatar dropped).
- next: **Phase 1** — A/B a few edge-tts EN voices, owner picks the channel voice;
  build the thumbnail template. Then Phase 2 render bake-off (Remotion vs HyperFrames)
  + the scene-template library. Owner actions: confirm EconVault access, approve name.
- blockers: none. (`content/001-sta-je-ai` kept as an archived example.)


## 2026-06-01 — Phase 2: voice clone WORKS (OpenAudio S1-mini); Colab recipe + open Serbian question
- who: agent + human (recording + Colab runs)
- did:
  - Owner recorded the voice sample in Audacity; analyzed both takes with a quick
    WAV meter (16-bit mono 48kHz, ~3.4 min): **clean room** (noise floor −71..−81
    dBFS, SNR ~37–40 dB, 0 clipping), just low level. Verdict: **usable for
    cloning**. Kept the louder take as `voice/reference/owner-sample.wav`.
  - **Voice cloning works:** a 22s test produced natural **Serbian** in the owner's
    voice via **OpenAudio S1-mini** (open, free) on a free Colab GPU.
  - Hard-won **working Colab recipe** (also in `scripts/colab/`, DECISIONS D-010):
    clone fish-speech → `apt portaudio19-dev` → `pip install -e .` → pin
    `torchvision==0.23.0` and `transformers==4.57.3`. The model is **gated** on HF
    (needs a free token via Colab Secrets `HF_TOKEN`); it's **cached on Google
    Drive** so later sessions copy it instead of re-downloading 3.6 GB.
  - Built `scripts/colab/fish_speech_full_narration.ipynb` (v2): token login + Drive
    cache + fast sanity check + full "Šta je AI" narration. Dropped the throwaway
    clone-test/disguise notebooks (their job is folded in).
- open question (OQ1): **Serbian is NOT on S1-mini's official language list** (it
  lists ru/pl + others). The 22s test sounded right anyway (Slavic proximity), but
  we judge the **full narration by ear** before committing. If insufficient →
  ElevenLabs paid fallback (D-003).
- decisions: **D-010** added.
- next: owner finishes HF-token setup, runs the full-narration notebook, listens to
  the whole Serbian narration → decide free vs paid. Then implement `02-voice`
  (continuous TTS + forced alignment) or flip to ElevenLabs. Voice-disguise
  (pitch/formant) only if owner dislikes own voice after hearing the full take.
- blockers: none (pending the owner's listen).

## 2026-05-31 — Phase 2 started: voice recording script written
- who: agent
- did: wrote `voice/RECORDING_SCRIPT.md` — 8 varied sections (neutral narration,
  lists, questions, excitement, technical terms, conversational, numbers/names,
  CTA) in the channel "ti"-tone. Gave the owner Audacity install + recording/cleanup
  settings (mono, 44.1/48kHz, peaks −12..−6 dB, noise reduction, export to
  `voice/reference/owner-sample.wav`, normalize toward −16 LUFS). Script is
  git-ignored (personal). Current text ≈ 6–8 min of speech — enough for a first
  clone test; can extend toward ~30 min later for max quality.
- next: owner installs Audacity now, records the sample (next session). Then Colab
  A/B — Fish Speech S2 vs XTTS on the same paragraph — + forced alignment →
  `alignment.json`. Pick a backend by listening; log in DECISIONS.
- blockers: none.

## 2026-05-31 — Phase 1 COMPLETE (validator, scaffold, config)
- who: agent
- did: closed the remaining Phase-1 items so all three exit criteria pass.
  - **Schema validator:** root `package.json` + `ajv`/`ajv-formats`; wrote
    `pipeline/shared/validate.js` (infers schema from filename, `--schema`
    override, precise error paths). `npm run validate -- <file>` or
    `node pipeline/shared/validate.js <file>`.
    - Ran on `content/001-sta-je-ai/script.json` → **PASS** (SETUP §8 step 1).
    - Bonus: all 7 worked-example artifacts (brief, script, storyboard,
      visual-prompts, alignment, qa.report, publish) **PASS** — schemas + example
      are coherent.
    - Negative test (missing `scenes`, `language:"en"`) correctly **FAILs** with
      exit 1 and pinpointed errors — proves it's a real validator.
  - **/novi-video scaffold:** `pipeline/00-topic/new-video.mjs` deterministically
    picks the next id, copies `_TEMPLATE`, writes a schema-valid `brief.json`
    (idempotent; refuses to overwrite). Wired as `npm run new-video`. Added a note
    to `.claude/commands/novi-video.md`. Verified by scaffolding + validating a
    throwaway `002-test-scaffold` (then removed).
  - **Local config:** created `pipeline/shared/config.json` and `.env` from the
    examples (no secrets — `.env` keys left blank to fill in Phase 4/6).
  - **Fixed a gap:** `.gitignore` did NOT actually ignore `pipeline/shared/config.json`
    even though SETUP/CLAUDE.md said it should — added the rule. Verified with
    `git check-ignore` that `.env`, `config.json`, `out/`, `*.wav`, and
    `node_modules/` are all ignored; `git status` shows only text/source.
- result: **Phase 1 exit criteria all met** — `remotion studio` opens, 10s test
  renders (intro/outro + subtitle, continuous audio), schema validation runs.
- next: **Phase 2 — Voice.** Write `voice/RECORDING_SCRIPT.md` (varied Serbian,
  ~30 min), record the sample in Audacity (now is when Audacity is needed), then a
  Colab notebook to A/B Fish Speech vs XTTS on the same paragraph and pick a
  backend by listening. (Install FFmpeg on PATH before Phase 5 QA.)
- blockers: none.

## 2026-05-31 — Phase 1: Remotion render path working
- who: agent (+ human did the Windows installs)
- did:
  - Verified toolchain: Git 2.39, Node v20.17, npm 9.6, Python 3.11 all present.
    FFmpeg NOT installed and `winget` unavailable on this PC — flagged, but **not
    blocking**: Remotion ships its own ffmpeg, so the render works; system FFmpeg
    is only needed for the QA scripts in Phase 5 (install manually before then).
  - Installed Remotion 4.0.470 + React 19 + TypeScript in `templates/remotion`.
  - Built the Phase-1 `TestComposition` (10s @ 30fps, 1920×1080): `Root` + `Test`
    + components `Intro`, `Outro`, `KineticText`, `Subtitles` (word-highlight),
    `BackgroundFX`, and `theme.ts` (color/type tokens from VISUAL_IDENTITY
    defaults). Added `scripts/make-dummy-audio.mjs` (deps-free 10s WAV) and a
    single continuous `Audio` track — never cut, proving the production timing
    contract (ARCHITECTURE §6).
  - Rendered `templates/remotion/out/test.mp4`: 1.3 MB, **10.05s, h264 1920×1080
    30fps + aac stereo audio** (verified with Remotion's bundled ffprobe).
  - Confirmed `npx remotion studio` boots the template (Server ready on :3000).
  - Tooling decision for the owner: **defer OBS and Audacity** — OBS is only for
    Phase 3+ screen-capture demos, Audacity only for the Phase 2 voice sample;
    neither is needed for Phase 1.
- next: finish the remaining Phase-1 item — implement the `pipeline/shared`
  schema validator (`validate.js`) and run it on `content/001-sta-je-ai/script.json`
  (SETUP §8 step 1). Install FFmpeg on PATH before Phase 5 QA. Then start Phase 2
  (voice): write `voice/RECORDING_SCRIPT.md` and record the sample in Audacity.
- blockers: none. (FFmpeg + winget missing are noted, non-blocking for now.)
