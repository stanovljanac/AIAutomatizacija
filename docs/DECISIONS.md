# DECISIONS (ADR log)

Why we chose what we chose. Each decision is short: context → decision →
consequences. When you change your mind later, add a new entry that supersedes the
old one (don't delete history).

---

## D-001 — Claude Code subscription is the brain & the text engine
- **Context:** Need an orchestrator and a high-quality Serbian text generator,
  for free.
- **Decision:** Use Claude Code (in the existing subscription) for orchestration
  and all text work (script, translation/localization, QA). Local LLMs aren't good
  enough for Serbian; the API costs per token.
- **Consequences:** Effectively free within subscription limits; space out heavy
  text batches. Claude API remains an option if limits bite.

## D-002 — No YouTube transcripts; use clean sources for facts
- **Context:** We need facts to build scripts. YouTube transcript extraction
  violates YouTube ToS and risks derivative-content issues.
- **Decision:** YouTube is used **only** to discover trending *topics*. Facts come
  from official blogs (Anthropic/OpenAI/Google), docs, GitHub releases,
  newsletters, and press. Scripts are original.
- **Consequences:** Cleaner legally, and the content is genuinely original (better
  for monetization / "reused content" rules). Slightly more research effort.

## D-003 — Voice: free open-source TTS first, ElevenLabs paid as fallback
- **Context:** XTTS-v2 (the popular free cloning model) **doesn't list Serbian**.
  ElevenLabs can do Serbian with a cloned voice but **can't export the model**,
  is **cloud-only**, and its **free tier has no commercial rights** (unusable on a
  monetized channel). The paid Creator tier (~$11/mo) is usable.
- **Decision:** Build a **TTS adapter**. Test free options (Fish Speech S2 first,
  then any Serbian XTTS fine-tune) by listening. Use free if quality is
  acceptable; otherwise fall back to ElevenLabs Creator (~$11/mo), flipped by a
  config flag.
- **Consequences:** Keeps the default at $0; defers the spend decision to an
  empirical listen test in Phase 2. The pipeline never hard-depends on one vendor.

## D-004 — Hybrid visuals; generative video only for rare "hero" shots
- **Context:** True per-scene generative video for a 7–8 min video is hours of GPU
  per video — not free at scale on our hardware/Colab.
- **Decision:** Dynamic look via real screen captures + motion graphics + AI images
  animated with camera moves (parallax/3D). Real generative video clips only for
  occasional hero/intro moments.
- **Consequences:** Same dynamic, professional feel as the reference channels,
  while staying free and feasible. Avoids the biggest cost/quality risk.

## D-005 — (Open) Channel account: grow EconVault then rename, vs new account
- **Context:** New accounts can get flagged as AI and under-promoted; an older
  account may have a small trust advantage. EconVault is older but off-niche and
  has a private piece to remove. YouTube allows renaming.
- **Decision:** **Open / leaning toward** reusing the older EconVault account:
  clear it, change keywords now, and rename once it earns the channel-rename
  threshold (verify current threshold). Final call in `style/CHANNEL.md` after
  checking YouTube's current rename rules.
- **Consequences:** Possible small algorithmic head start; must keep the niche
  clean (no finance + AI mixing). Revisit if it under-performs.

## D-006 — Defer n8n / full automation until the manual pipeline is proven
- **Context:** Full hands-off automation is the end goal, but adds many moving
  parts that fail in non-obvious ways.
- **Decision:** Start with Claude Code + plain Node/Python phases. Add n8n (free,
  self-hosted) — or an agent-driven full run — only after the manual pipeline
  reliably produces good videos.
- **Consequences:** Fewer early failures; clearer debugging. Automation layered on
  a known-good base later (Phase 5).

## D-007 — Render with Remotion (Revideo/Rendervid as alternates)
- **Context:** Need deterministic, code-driven video assembly; free; ideally
  something the owner can read (React).
- **Decision:** Remotion — mature, biggest ecosystem, free for individuals/small
  teams. Revideo is the plan-B (React, open source). Rendervid noted (open source,
  has an agent MCP) but newer/less proven.
- **Consequences:** Lots of examples and stability. Watch the license if the
  project ever incorporates.

## D-008 — Faceless first, stylized 2D avatar later (never a real-you avatar)
- **Context:** A presenter helps audience connection, but free photoreal avatars
  are watermarked demos and "almost-you" avatars look uncanny and are GPU-heavy.
  Owner explicitly does not want a real likeness.
- **Decision:** Ship faceless for the first videos to prove the pipeline, then add
  a **stylized/animated 2D avatar** (never a realistic clone of the owner).
- **Consequences:** Fastest path to a finished video; safer aesthetically and on
  GPU. Avatar is a Phase 5 enhancement.

## D-009 — Code & docs in English; channel output in Serbian
- **Context:** Agents follow English instructions more reliably; the audience is
  Serbian.
- **Decision:** All repo files (code, docs, skills) in English. All published
  output (scripts, subtitles, titles, descriptions) in Serbian.
- **Consequences:** Reliable agent behavior + native-quality output. The style
  guide and term bank govern the Serbian.

## D-010 — Free TTS under test is OpenAudio S1-mini; Serbian unofficial but promising (refines D-003)
- **Context:** D-003 planned "Fish Speech S2 first." In practice the open, free,
  low-VRAM model that runs cleanly on a Colab T4 is **OpenAudio S1-mini**
  (`fishaudio/openaudio-s1-mini`, gated on HuggingFace). Serbian is **not** on its
  official language list (which includes ru/pl and others), but a 22s clone produced
  natural Serbian in the owner's voice — likely via its Slavic (Russian/Polish)
  training. Getting it to run took a specific, fragile recipe.
- **Decision:** Use **OpenAudio S1-mini** as the free candidate and **judge Serbian
  by ear on a full narration** before committing. Pin the working recipe:
  `torchvision==0.23.0`, `transformers==4.57.3`, `apt portaudio19-dev`; authenticate
  with a HF token via Colab Secrets (`HF_TOKEN`); cache the model on Google Drive to
  avoid re-downloading. Keep **ElevenLabs Creator (~$11/mo)** as the documented
  fallback if Serbian quality is insufficient (D-003).
- **Consequences:** The $0 path stays open if Serbian holds up on long text. Thanks
  to the TTS adapter (D-003), switching to ElevenLabs later reuses the whole
  surrounding pipeline. `config.json.voice` is set to the final choice **after** the
  listen test (so config still shows the placeholder until then).

## D-011 — Pivot: Serbian AI explainer → English "Boring AI Automations" (supersedes the niche in D-009 output clause)
- **Context:** Serbian TTS quality is an unfixable free-tier blocker (D-010). Meanwhile
  English "AI/tech" is saturated, but **boring everyday back-office automations** (data
  entry, invoicing, shift scheduling, reminder/invite emails, simple record-keeping)
  are underserved with high RPM. English free TTS (edge-tts) is excellent.
- **Decision:** Re-found the channel as **English, faceless "Boring AI Automations."**
  Audience = builders/freelancers/agencies who make automations for others and want
  inspiration (not the end clerks, who never watch). Depth = ideas + a minimal example,
  "scale it to your own process"; we are not free consultants. Channel **output is now
  English** (this overrides D-009's "output in Serbian"; code/docs stay English).
- **Consequences:** The voice blocker disappears; ~70% of the framework is reused. The
  Serbian work is preserved under git tag `serbian-ai-archive` and `content/001-sta-je-ai`.

## D-012 — Channel name: "Boring AI Automations"
- **Context:** Plain "Boring Automations" already exists; the niche is AI-driven.
- **Decision:** **Boring AI Automations** (the "boring" angle is the differentiation
  and SEO arbitrage). Backup if handle taken: *The AI Automation Desk*.
- **Consequences:** Memorable, keyword-rich, signals the exact niche.

## D-013 — Four archetypes + fixed-template mapping (not LLM-composed scenes)
- **Context:** The owner cannot edit; assembly must be fully automatic and auto-QA-able.
- **Decision:** Support 4 cycling archetypes — Ideas/Listicle, Mini-demo, Diagram, Comparison.
  Each `script.json` scene carries a `template` tag mapped **deterministically** to a
  Remotion component (rich scene vocabulary avoids monotony). No per-video bespoke render code.
- **Consequences:** Predictable, testable, consistent. Variety comes from the scene
  vocabulary + archetypes, not from generative layout.

## D-014 — Voice: edge-tts English, one consistent voice (supersedes the Serbian-TTS path of D-003/D-010)
- **Context:** With English output, the whole Serbian-TTS struggle is moot.
- **Decision:** Use **edge-tts neural** (free) with **one consistent EN voice** chosen by
  A/B listen. No own-voice recording; no ElevenLabs/Fish/OpenAudio for now.
- **Consequences:** Free, professional, local. `voice/RECORDING_SCRIPT.md` and the
  voice-clone flow are retired. config `voice.provider` → edge-tts.

## D-015 — Compute: local-first; Colab/HF optional; AI-video deferred (refines D-004, R17)
- **Context:** Tutorial professionalism comes from clarity (clean motion-graphics,
  readable diagrams, real captures, good audio/sync), not AI-generated b-roll, which can
  read as "slop." Cloud GPU is a fragility/maintenance cost that fights hands-off goals.
- **Decision:** Core pipeline runs **locally** (edge-tts + render + stock). Keep Colab/HF
  as an **optional opt-in** module for occasional AI images only. **AI-video deferred.**
- **Consequences:** Reliable, cheap, automatable core; cloud is garnish, not a critical path.

## D-016 — Account: repurpose EconVault, cleaned & rebranded (resolves open D-005)
- **Decision:** Reuse the older **EconVault** account, fully cleared and rebranded to the
  EN niche; rename when eligible. Keep the niche clean (no old finance content lingering).
- **Consequences:** Possible small age/trust advantage; requires a full repurpose pass.

## D-017 — Monetization: ad RPM + views only for now
- **Context:** Owner is in Serbia without Stripe-class payout rails, so paid products/
  memberships aren't practical yet.
- **Decision:** Optimize for **ad RPM + views**; defer products/affiliate/courses.
  Revisit if a contract/agency engagement appears.
- **Consequences:** Simpler funnel; CTA is "subscribe." High-RPM niche choice carries the income.

## D-018 — Mandatory original human angle in every script (anti-AI-slop)
- **Context:** YouTube 2026 demonetizes templated, value-less mass AI content.
- **Decision:** I draft an **original angle/opinion/experience** per topic; the owner
  approves/tweaks it at the script gate. The script-review skill enforces its presence.
- **Consequences:** Keeps the channel inside YPP eligibility; gives each video a point of view.

## D-019 — Render engine: bake-off Remotion vs HyperFrames, combine best-of-both (refines D-007)
- **Context:** The agent authors every video; HyperFrames (HeyGen, open-source HTML→MP4)
  is agent-native, but Remotion is already set up and mature, and we chose fixed templates
  (so the agent rarely writes new render code).
- **Decision:** **Phase-2 bake-off** of one scene in each. Target combo: Remotion owns the
  timeline/sync/captions/intro-outro; HyperFrames optionally renders flashy scene-blocks to
  MP4 that Remotion imports. Adopt the combo only if it clearly beats Remotion-solo;
  otherwise Remotion-solo with HyperFrames as documented plan-B.
- **Consequences:** De-risks the core of the factory before building the full template library.
- **Bake-off result (2026-06-02):** Built the same Ideas "bullet-steps" hook scene in
  both. **Remotion** (`templates/remotion/src/Bakeoff.tsx`) and **HyperFrames**
  (`templates/hyperframes/bakeoff/`, CLI v0.6.70) rendered **visually near-identical,
  on-brand 1920×1080** output; both deterministic; both worked first try. HyperFrames
  installed cleanly and even ships useful standalone tools (Kokoro TTS, Whisper
  word-timestamps, website capture, snapshot+vision). **Verdict:** since the look is
  equal and we use **fixed templates** (the agent fills JSON props, it doesn't author
  render code per video), **Remotion stays the core** — it's mature, already set up, and
  owns the continuous-audio sync contract. **HyperFrames is kept installed as an opt-in
  block-renderer** for occasional flashy scenes (GSAP/Three/Lottie/shaders) imported into
  the Remotion timeline as MP4 (the "combo" path is proven feasible). `render.engine`
  stays `remotion`; flip to `combo` only when a specific scene needs it.

## D-020 — Fixed templates are a BASE, not the whole look; build bespoke scenes per video (refines D-013)
- **Context:** Owner watched the template gallery and flagged that if every video is just
  the same 12 templates on repeat, all videos look identical and nobody watches. He also
  wants thorough, slower, more detailed videos (never shortened for brevity), and proof/
  examples introduced by judgment (not a forced rule).
- **Decision:** Keep the 12 fixed templates as the **reliable, auto-QA-able base**, but
  **every video must mix in fresh / bespoke scenes** (`template: "custom"`) so the channel
  doesn't feel canned. Build the custom scenes with Remotion + the now-installed
  **HyperFrames agent skills** (`npx skills add heygen-com/hyperframes` → hyperframes, gsap,
  three, lottie, css-animations, animejs, waapi, typegpu, remotion-to-hyperframes, …, in
  `~/.agents/skills`, symlinked to Claude Code). The render engine stays Remotion-core +
  HyperFrames opt-in (D-019); custom scenes may be authored in either and composited.
  Script rule added to `script-writing` SKILL (#6 proof-by-judgment, #7 thorough/never-cut,
  #8 visual variety).
- **Consequences:** More authoring effort per video, but distinctive, watchable videos.
  Auto-QA still anchors on the base templates + sync contract; custom scenes are reviewed
  visually at the final gate.

## D-021 — (Deferred upgrade) Multi-agent review panel
- **Context:** The owner manually pasted a script into a second model and got a useful
  independent review. He wants this as an automated upgrade: several **independent reviewer
  agents** (that did NOT write the script/scene-plan) each rate the work, an **aggregator
  agent** synthesizes/decides, and the **owner still checks the final verdict**.
- **Decision:** **Deferred** — keep the single `script-review` agent for now; build the
  multi-agent panel later (could use the Agent tool / sub-agents). Logged so we don't lose it.
- **Consequences:** None yet; this is a roadmap upgrade note for `script-review` + `qa-video`.

## D-022 — Dynamic, narration-synced scenes + a visual library (extends D-013/D-019)
- **Context:** The first 002 render looked clean but **too static** — long text held on one
  card while the voice talked. The owner wants scenes that move with the narration, a real
  visual arsenal (icons, illustrations, workflows), and continuity between scenes.
- **Decision:** Build a dynamic-scene system:
  - **Reveal-sync** — the builder (`pipeline/04-render/build-props.mjs`) computes per-element
    reveal frames from the alignment (`revealOn: "sentences"` or `cueWords`); list/flow/diagram
    elements appear exactly when the voice names them.
  - **Scene beats** — one script scene can split into several timed visual beats over its
    sentences (no re-voice needed), so text-heavy scenes aren't one static hold.
  - **Visual library** — an icon registry (`templates/remotion/src/icons/Icon.tsx`), new
    reusable templates **`flow`** + **`icon-list`**, and bespoke illustration scenes
    (`HandCopy`, `AiFlow`, `ChaosX`, `DeskScene` in `src/custom/`). Fixed templates are a
    base; every video mixes in custom/illustrated scenes.
  - **Continuity** — one **persistent `BackgroundFX`** in `Main` (templates render transparent)
    + a `SceneWrapper` **crossfade** (~9 frames) between scenes.
  - Rule added to `script-writing` (#6–#8) + `video-render`: visual density follows the
    narration; prefer icons/drawings/workflows over text cards; never a long static hold.
- **Cleanup:** removed the test/proof scaffolding the bake-off/gallery work left behind —
  `Test/Bakeoff/BakeoffLong/KineticText`, `templates/hyperframes/bakeoff/`, and the Serbian
  `scripts/colab|kaggle` + `tts_sample_edge.py`. Kept `TemplateGallery` (dev preview), the
  HyperFrames CLI/skills (opt-in engine, D-019), and the `001-sta-je-ai` archive.
- **Consequences:** Lively, distinctive videos that stay in lockstep with the voice; more
  authoring per video, anchored by the reusable library + the sync contract.

> Superseded: **D-008** (avatar) — dropped permanently; the channel is faceless forever.
> Still in force: **D-002** (no YouTube transcripts; clean sources only).

<!-- Add D-020, D-021, … as new decisions arise. Supersede, don't delete. -->
