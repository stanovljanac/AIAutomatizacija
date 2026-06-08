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

## D-023 — Rename: "Boring AI Automations" → "The Automation Desk" (supersedes D-012)
- **Context:** Nothing is published yet, so a rename is cheap. The owner wants a brand that
  lasts beyond the narrow "boring automations" niche — room to grow into bigger systems,
  tools, comparisons, and news.
- **Decision:** Channel name **The Automation Desk**, handle **@TheAutomationDesk**.
  "Boring automations" survives as a *series* inside it (see D-028). Rebrand all assets/docs.
- **Consequences:** Broader, more durable brand; supersedes the D-012 name.

## D-024 — TTS: edge-tts for drafts, **Azure AI Speech for the final** (supersedes D-014)
- **Context:** edge-tts commercially **violates Microsoft's ToS** (it reverse-engineers the
  Edge read-aloud endpoint) and is unreliable — unfit for a monetized channel's published
  audio. Azure AI Speech offers the **same neural voices** (incl. Andrew), **500k chars/month
  free**, and a real commercial license.
- **Decision:** Provider-aware TTS adapter. **edge-tts = drafts only** (free, fast iteration,
  never in a published file); **Azure = the final voice** (and Shorts), regenerated once the
  video is locked so we don't burn the quota per iteration. faster-whisper alignment works on
  either. Owner adds a free Azure Speech key (`AZURE_SPEECH_KEY`/`REGION`).
- **Consequences:** Legal, reliable published audio at $0 within quota; edge stays a dev tool.

## D-025 — Always disclose "altered content" at upload (supersedes the old no-disclosure note)
- **Context:** YouTube's 2026 policy requires disclosing realistic synthetic content; an AI
  voice narrating qualifies. Disclosure is the obligation; SynthID is Google's *detection*,
  not a requirement (the popular video overstates it).
- **Decision:** **Always set altered-content = yes** for our videos (AI voice + AI visuals).
  `publish.json` carries `altered_content: true`; set the flag at upload (Studio toggle; verify
  if the Data API exposes it). Disclosure alone doesn't save mass-produced/templated content —
  originality (D-018/D-022/D-028) still does the heavy lifting.
- **Consequences:** Reverses the earlier "no disclosure"; keeps us inside YPP rules.

## D-026 — Write for the answer-engine: answer-first + specific, citable facts
- **Context:** YouTube/Google now reward topical authority and citation-friendly structure;
  AI overviews weight the first 30–60s most.
- **Decision:** Scripts **answer the topic's core question in the first 30–60s**, then hook,
  then deeper build. Use **specific names, dates, numbers, places** (e.g. "26,000 workers in
  Malaysia were laid off in 2026 because…"), not vague claims. Specifics ⇒ **`sources.md`
  mandatory**; the review agent flags vague/uncited stats.
- **Consequences:** More research per video; better pickup by search/AI-overviews.

## D-027 — Cross-platform distribution via Postiz (self-hosted, free)
- **Context:** Faceless AI channels need a real off-platform presence (matching socials,
  Pinterest, Medium, a store) to avoid "content-farm" flags, and the owner wants it automated.
- **Decision:** A new `pipeline/07-distribute` phase posts derivatives **after** the YouTube
  upload (passing the video link), through **Postiz** (open-source, self-hosted = free, 30+
  channels, API/agent-friendly) as the hub. Per-platform skills: Short/Reel → YT/IG/TikTok,
  link-post → FB/X, Pinterest pin, blog-from-transcript (Medium's API is retired → Hashnode/
  dev.to or semi-manual). MCP-native alternative: Zernio (paid). Honest gating caveats apply
  (TikTok audit, X write tier, IG Business account).
- **Consequences:** One connected brand, mostly automated; some platforms stay semi-manual.

## D-028 — Anti-slop core: human fingerprint + the "Desk" series system + topical clusters; staged sequencing
- **Context:** The #1 monetization risk is "mass-produced / templated / low-original-value,"
  not the AI voice. Full automation and a human fingerprint are in tension.
- **Decision:**
  - **Human fingerprint (owner: angle + occasional real demo):** every video has an
    owner-approved original angle/POV + honest "not worth it" takes; **every Nth video includes
    a real owner-recorded screen demo** (genuine human footage = strongest anti-farm signal).
  - **Series system → archetypes:** **Desk Fixes** (mini-demo) · **Desk Loops** (ideas/diagram)
    · **Automation Breakdowns** (comparison) · **Desk Notes** (news/short).
  - **Topical clusters:** publish the idea-bank in owned clusters (spreadsheets, then email…)
    to build topical authority — not random one-offs.
  - **Sequencing:** compliance + brand presence BEFORE clip 1; the auto-posting machinery is
    built in parallel and goes live by clips 1–3 (don't block the launch). Build for durable
    truths, not unverified hype specifics.
- **Consequences:** Distinctive, authority-building, monetizable channel with a small but real
  human touch.

## D-029 — Brand mark locked: gold-on-black "desk" logo (Logo 1); hybrid accent; embedding deferred
- **Context:** Owner reviewed four candidate logos while creating the socials. Two cyberpunk
  robot options were off-brand (cluttered / "AI-art slop", illegible at avatar size). Two
  gold-on-black "desk" options fit the premium, faceless identity.
- **Decision:**
  - **Brand mark = Logo 1** — minimal gold crescent + desk/laptop/plant on a dark/near-black
    background. Used as the **avatar** everywhere (legible when small). Save to
    `assets/brand/logo.png`.
  - **Accent = hybrid:** the logo is gold; the **in-video accent stays electric blue**
    (theme.ts unchanged). The dark background carries both; blue text against a gold-mark
    brand is acceptable, not a clash to "fix".
  - **Embedding deferred:** do **not** bake the logo into the intro/thumbnail components or
    re-render 002 to insert it. The logo enters the **next** videos to avoid a needless re-render.
- **Consequences:** One recognizable avatar now; visual system (blue accent) untouched; a
  future small task wires the gold mark into `Intro`/`ThumbnailTemplate`.

## D-030 — Git scope: ignore new per-video content + the idea-bank; keep existing history
- **Context:** Content text/JSON was committed alongside code. As the channel scales, per-video
  folders and the topic backlog are working data, not the system — they shouldn't live in git.
- **Decision:** `.gitignore` now ignores `content/*` (except the `_TEMPLATE` skeleton) and
  `pipeline/00-ideas/ideas.json`. Only the system (code/docs/skills/schemas/templates) is
  committed going forward. **No history rewrite:** gitignore doesn't untrack files, so 001/002
  and the existing `ideas.json` stay in history by design (owner choice). New videos (003+) and
  future idea-bank edits are local-only.
- **Consequences:** Cleaner repo; the idea-bank/topics stay private; 001/002 remain for
  reference. Docs realigned (CLAUDE.md "One video = one folder", ARCHITECTURE §1/§3).

## D-031 — Short length: ~50–60s default, hard max 2:00 (supersedes the old 20–55s / 40s)
- **Context:** The old "20–55s" guidance and `short_seconds: 40` skewed Shorts too short for a
  single complete idea.
- **Decision:** Canonical Short length lives in **STYLE_GUIDE §7**: **~50–60s**, one idea, fast
  hook in the first 2s; go longer only if the material justifies it, **hard max 2:00**, never
  pad. Config: `short_seconds: 55`, `short_seconds_max: 120`. CHANNEL §5 and the
  video-render / youtube-publish skills link to STYLE_GUIDE §7 instead of restating a number.
- **Consequences:** One source of truth for Short length; room for a complete idea without bloat.

## D-032 — `fact-check` skill: generate AND self-verify the factual backbone (removes manual "Google it")
- **Context:** The owner manually searched to confirm AI-written facts before approving. To move
  toward full automation, that verification must be a skill, not a human step (answer-first +
  specific facts: D-026).
- **Decision:** One robust skill `.claude/skills/fact-check/SKILL.md` does **all three layers** —
  draft-time fact-check (after script-writing, feeding script-review), a freshness pass for
  time-sensitive values, and a final claim-check at QA on the rendered narration. It extracts
  every checkable claim, verifies each against a **fetched** primary/reputable source, and writes
  `sources.md` + `claims.json`; `unverified` is an honest, surfaced status; synthetic demo data is
  exempt. Wired into WORKFLOW Step 1 (write → fact-check → review) and Step 5 (QA).
- **Consequences:** Accuracy is built-in and auditable before the human gate; unblocks
  comparisons/news; script-review's "claims trace to sources" check now delegates to `claims.json`.

## D-033 — Parallel short-vs-long branches (DESIGN; build deferred)
- **Context:** Short and long for one topic are **separate content folders** (`002` vs
  `002-short`) sharing only the topic — no shared mutable state — so the pipeline contract
  (ARCHITECTURE §4: folder I/O, idempotent, status-based) already makes them safe to run
  concurrently.
- **Decision (design only — not built this round):** after the long script is approved (Gate ②),
  an orchestrator runs two branches as background Agents — Branch A (long): voice → align →
  scene-plan → render; Branch B (short): derive short (`make-short`, D-027) → voice → align →
  render. Each writes only its own folder/props. Orchestrator would live in `/novi-video` or a
  new `pipeline/orchestrate.mjs`.
- **Honest caveat:** on one PC the two **renders** are CPU-bound and serialize; the real
  wall-clock win is overlapping the LLM/IO-bound authoring/voice/align work. The structure scales
  when rendering later moves to a second machine/cloud. Tracked in ROADMAP "Phase B".
- **Consequences:** A safe, documented path to parallelism; no orchestrator code yet.

## D-034 — Comparisons are experiments, not reviews (video #4 reframed)
- **Context:** the theory "Claude vs ChatGPT for spreadsheets" read like "here's what I read," not "here's what I tried."
- **Decision:** turn "X vs Y" into a hands-on experiment on a shared real task with **planted ground truth** + a deterministic scorer; **free-vs-free** matchup; **never fabricate results**. #4 = "I Gave Claude & ChatGPT the Same Messy Spreadsheet" (mini-demo). Owner records the real runs.
- **Consequences:** far more credible, story-shaped content; needs owner screen recordings; results verified vs the answer key.

## D-035 — Forced-alignment root fix: difflib sequence alignment
- **Context:** the pointer-walk aligner drifted whenever a hyphenated compound ("upload-a-file-and-say-wow") didn't match whisper's separate words — recurred across clips and broke caption sync mid-video.
- **Decision:** tokenize on hyphens too, and map script tokens → whisper words via `difflib.SequenceMatcher` (interpolate unmatched gaps) in `make_alignment.py`.
- **Consequences:** captions track the voice reliably; the recurring drift is gone.

## D-036 — No empty/static scenes + b-roll guardrails
- **Context:** a ~20s near-empty `lower-third`; and an off-topic Pexels clip that looped/flickered.
- **Decision:** HARD no-empty-scene rule (split/animate long beats; `lower-third` for short overlays only). B-roll only when it genuinely **fits the point**, **never looped** (play once via `OffthreadVideo`, no flicker), **prefer code-drawn over irrelevant footage**.
- **Consequences:** `VersusNote` scene; SceneWrapper b-roll layer fixed; enforced in `build-props` + qa-video + VISUAL_IDENTITY.

## D-037 — Thumbnails: owner generates from 2 prompts; agent only composites
- **Context:** agent code-drawn / auto thumbnails were poor, and the agent can't generate raster images here.
- **Decision:** always give exactly **2 image prompts** for the owner to generate in a **free** tool; the agent **only composites** (logos, no title unless asked) via `ThumbComposite`. Legacy code-drawn `Thumbnail` retired for production.
- **Consequences:** better thumbnails for $0; the owner owns the base image + the thumbnail step.

## D-038 — Cross-platform metadata: timing + formats
- **Context:** owner wants names early and tight, platform-fit copy.
- **Decision:** generate SEO (**title for the video AND the Short** + description + tags) at **script approval**; the YouTube description is **max 3 SEO-dense sentences** (+ chapters + altered-content line; long utility text like the master prompt → **pinned comment**); the **Short** gets **one sentence + a link** to the full video; every video also gets a **Medium** description (600–700 words, "cited by AI search engines" prompt) generated from the transcript → `medium.md`.
- **Consequences:** faster naming; platform-appropriate copy; AI-search (ChatGPT/Perplexity/AI Overview) discoverability.

## D-039 — North star: self-reviewing autonomous studio (ROADMAP Phase C)
- **Context:** the owner should do **only** final video approval + the thumbnail.
- **Decision:** build a loop where the agent writes, **two OTHER (different) models** review + score each stage (script, scene-plan/video-prep, the cut), the best fixes are merged and applied, repeating **until both reviewers score ≥ 9/10**; then final render + **auto-draft to YouTube**. Needs **2 external model API keys** (prefer free tiers) + a one-time YouTube OAuth.
- **Consequences:** max quality/throughput with min owner time; documented in ROADMAP "Phase C"; not built yet.

## D-040 — Phase B/C build architecture: hexagonal ports + the reviewer panel
- **Context:** Phase B/C must stay swappable (replace Remotion, TTS, reviewer models, publisher) and reach hands-off autonomy without the owner touching the terminal.
- **Decision:** build behind **ports/adapters** — `Runner` (hybrid: Claude Code sub-agents now / headless `claude -p` later), `Reviewer` (panel), `RenderEngine` (Remotion+HyperFrames **combo** now, with an engine-agnostic `timeline.json` seam reserving a future full swap), `TtsProvider`, `Publisher`, `NewsSource` (a *list*, deduped). Reviewer panel = **Sonnet 4.6 sub-agent + Gemini 3 Flash (free)**, pluggable (Groq Llama free as a config-line 3rd); **not OpenAI** (no free API tier as of Apr 2026). Authoritative scoring lives in `pipeline/shared/review/panel.mjs` (weighted, hard-gate-clamped): loop passes at **both ≥9**; the human script gate is skipped at **both ≥9.2** + hard gates green; else surfaced.
- **Consequences:** components swap via config, not rewrites; scoring is deterministic/model-independent. v1 = Waves 0–2 (hands-off to YouTube draft **including** the multi-model loop). New schemas: review/news/timeline/config. Wave 0 shipped + Sonnet-verified.

## D-041 — Build-sprint engineering cycle (enforced, never skipped)
- **Context:** an autonomous system can't rely on a human catching a red test at 2am; quality steps must be mechanical or always-loaded policy.
- **Decision:** every code change runs **atomize → build → self-test → verify with a DIFFERENT model (Sonnet 4.6; Haiku 4.5 for trivial) → fix → update docs → commit only on explicit owner request**. Enforced by a **Stop test-gate hook** (`.claude/hooks/test-gate.mjs` — fail-open, blocks finishing on red when code changed, `[skip-tests]` escape) + the **`build-sprint` skill** + a `CLAUDE.md` rule + a feedback memory. **Not** for planning/research/doc-only edits.
- **Consequences:** tests are mechanically gated; different-model verification, doc-freshness and commit-discipline are always-loaded policy; verifier verdicts logged in `docs/BUILD_LOG.md`.

> Superseded: **D-008** (avatar) — dropped permanently; the channel is faceless forever.
> **D-012** (name) → see D-023. **D-014** (TTS) → see D-024. The old "no AI-disclosure" note → see D-025.
> Still in force: **D-002** (no YouTube transcripts; clean sources only).

<!-- Add D-020, D-021, … as new decisions arise. Supersede, don't delete. -->
