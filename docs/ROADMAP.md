# ROADMAP

Phased plan from zero to a repeatable, mostly-automated channel. Each phase has
**exit criteria** — concrete, checkable conditions to move on. Target: a working
first video in ~3–4 weeks (no hard deadline; quality first).

Update the current phase and check items as you go. Log details in
`docs/PROGRESS.md`.

---

## Phase 0 — Foundation (docs & structure)  ✅ being set up now

**Goal:** the repo, documentation, skills, and style files exist and are coherent
so any session can continue without re-explaining anything.

Exit criteria:
- [ ] Repo structure created and pushed to GitHub.
- [ ] `CLAUDE.md` + all `docs/` + all `style/` + all `.claude/skills/` present.
- [ ] `_TEMPLATE` and worked example `001-sta-je-ai` scaffolded.
- [ ] `docs/SETUP.md` is followable on Windows.

## Phase 1 — Environment & "hello pipeline"

**Goal:** tools installed; a trivial end-to-end dry run with placeholder assets.

Tasks:
- Install Node, Python, Remotion, OBS, Audacity (SETUP.md).
- Create `pipeline/shared/config.json` + `.env` from examples.
- Implement `pipeline/shared` schemas + a validator.
- Implement `/novi-video` scaffolding.
- Render a 10-second Remotion test (intro → one text scene → outro) with a dummy
  audio file, proving the render path works locally.

Exit criteria:
- [ ] `npx remotion studio` opens the template.
- [ ] A dummy 10s mp4 renders locally with intro/outro + one subtitle line.
- [ ] Schema validation runs on a sample `script.json`.

## Phase 2 — Voice that we can live with

**Goal:** decide the voice. Record the clone sample; test free Serbian TTS;
choose free vs ElevenLabs fallback by **listening**.

Tasks:
- Create `voice/RECORDING_SCRIPT.md` (varied Serbian, ~30 min).
- Record your sample in Audacity (treated room), clean it.
- Colab notebook: run Fish Speech (and XTTS if a Serbian fine-tune exists) on the
  same test paragraph; generate samples.
- A/B listen. Pick backend; set `config.json.voice`.
- Implement `02-voice`: continuous TTS + forced alignment → `alignment.json`,
  chunked+cached, resumable.

Exit criteria:
- [ ] A 30–60s Serbian narration sounds professional (not robotic).
- [ ] `alignment.json` has correct per-sentence timestamps for a test script.
- [ ] If free quality is insufficient, ElevenLabs fallback documented & wired
      (flip a config flag), decision logged in `docs/DECISIONS.md`.

## Phase 3 — Visual identity & the visual pipeline

**Goal:** lock the look (once) from your reference screenshots; build
storyboard → prompts → assets.

Tasks:
- Fill `style/VISUAL_IDENTITY.md` from your reference screenshots (colors, fonts,
  motion language, layout) — done **once**, then reused (PRD: style pack).
- Build reusable Remotion components: intro, outro (long + Short variants),
  lower-thirds, kinetic-text, screenshot-with-camera-move, image-with-parallax.
- Implement `03-visuals`: storyboard skill → visual-prompts skill → Pexels/Pixabay
  fetch + Colab image gen (chunked+cached).
- Define the guided **screen-capture list** flow for tool-demo videos.

Exit criteria:
- [ ] Intro/outro render and look on-brand.
- [ ] One scene rendered each way: motion-text, stock, AI-image (with camera move),
      and a screen capture — all looking dynamic (not a static slideshow).
- [ ] `storyboard.json` + `visual-prompts.json` validate against schemas.

## Phase 4 — MVP: first full video (Definition of Done)

**Goal:** produce **"Šta je AI i šta sve može u 2026."** end to end.

Tasks:
- Run the full workflow on `content/001-sta-je-ai/`.
- 7–8 min, faceless, Serbian narration, hybrid dynamic visuals, burned-in animated
  Serbian subtitles, perfect sync.
- Implement `05-qa` checks; pass them.
- Implement `06-publish`: title/description/tags/thumbnail + draft upload.
- Produce **one Short** from the same script.

Exit criteria (this IS the MVP done-definition, mirrors PRD §8):
- [ ] `content/001-sta-je-ai/video/final.mp4` exists, 7–8 min.
- [ ] Audio continuous; scenes & subtitles in sync (QA passed).
- [ ] Human-approved at all three gates.
- [ ] Draft (private) on YouTube with full metadata + thumbnail.
- [ ] One Short produced from the same script.
- [ ] Reusable intro/outro used (long + Short).

## Phase 5 — Repeatability & toward automation

**Goal:** make the second and third videos easy; tighten QA; start automating.

Tasks:
- Produce videos #2 and #3 on new topics; note every manual touch and remove it.
- Mature QA so it can **auto-reject & re-run** common failures (PRD R14).
- Add topic-discovery automation (clean-source scanning + topic proposals).
- Optional: introduce **n8n** to schedule full runs that stop only at gates
  (DECISIONS D-006). Optional: move render/image gen fully to cloud.
- Optional: design a stylized **2D avatar** (PRD §5; faceless → avatar path).

Exit criteria:
- [ ] A new video can go topic → draft with human time only at the 3 gates.
- [ ] At least one common QA failure auto-recovers without human help.
- [ ] A documented "daily Short + video every 2–3 days" cadence is sustainable.

---

## Cadence target (post-Phase 4)

- Long video every 2–3 days (7–10 min), 1 Short/day (mostly repurposed).
- Ramp toward daily long-form once Phase 5 automation is stable.

## What we deliberately deferred

- n8n full automation (until manual pipeline proven) — D-006.
- Avatar (faceless first) — D-008.
- Per-scene generative video (hero shots only) — D-004.
- Cloud storage migration (until local space runs low) — ARCHITECTURE §10.
- Multi-language output — PRD §3.
