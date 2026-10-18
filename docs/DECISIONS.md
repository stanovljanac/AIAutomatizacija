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
    + a `SceneWrapper` **crossfade** (~9 frames) between scenes. _(**Superseded by D-060**: the
    unconditional per-scene crossfade is gone — every boundary now honors the outgoing scene's
    authored `transitionOut`, defaulting to a **hard cut**. The 9 frames survive as the
    dissolve/push blend duration and the intro/outro bumper blend. The persistent `BackgroundFX`
    continuity above is unaffected.)_
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
> **Amended by D-049 (2026-06-29): the DIFFERENT-model verification step is removed.** The rest of the cycle stands.
- **Context:** an autonomous system can't rely on a human catching a red test at 2am; quality steps must be mechanical or always-loaded policy.
- **Decision:** every code change runs **atomize → build → self-test → ~~verify with a DIFFERENT model~~ (removed, see D-049) → fix → update docs → commit only on explicit owner request**. Enforced by a **Stop test-gate hook** (`.claude/hooks/test-gate.mjs` — fail-open, blocks finishing on red when code changed, `[skip-tests]` escape) + the **`build-sprint` skill** + a `CLAUDE.md` rule + a feedback memory. **Not** for planning/research/doc-only edits.
- **Consequences:** tests are mechanically gated; doc-freshness and commit-discipline are always-loaded policy.

## D-042 — Community-tab announcement (YT Posts) for every video
- **Context:** owner wants a short "just published" post on the channel's Community tab for each upload — good for reach/visibility on a fresh video.
- **Decision:** generate a **`community_post`** for **every** video (in `publish.json`): a "just published" opener + a **1–2 sentence** teaser of what the video does + the long-video link. Drafted at **script approval** with the rest of the SEO (D-038); `<LONG_URL>` filled at upload. We automate the **text only** — the **owner posts it manually**, because the YouTube Data API has **no endpoint** to create Community posts. Same pattern as the Short caption + Medium (D-038).
- **Consequences:** every upload ships a ready-to-paste Community post; extends the cross-platform metadata set; documented in the `youtube-publish` skill + `publish.schema.json`.

## D-049 — Drop the second-model verification from the build-sprint cycle (amends D-041)
- **Context:** D-041's build-sprint cycle spawned a DIFFERENT model (Sonnet 4.6) to verify each code unit/wave. The owner does the substantive review of the work and knows best what they want, so a model-on-model check before the owner sees it adds no value.
- **Decision:** **remove the different-model verification step** from the build-sprint cycle. The cycle is now **atomize → build → self-test → fix → update docs → commit only on explicit owner request**; self-testing should cover happy path + edge cases, and verify behavior where cheap (e.g. render a preview still). Updated the `build-sprint` skill, the `CLAUDE.md` golden rule, ROADMAP, and the `build-sprint-cycle` memory. The Stop test-gate hook and commit-discipline are unchanged. This is **scoped to the code/engineering cycle only** — the **video review panel** (script/video review by a Claude sub-agent + Gemini, D-040) is unaffected; the owner still values it.
- **Consequences:** faster cycles, no verifier sub-agent cost on code changes; quality on code now rests on thorough self-tests + green tests (Stop hook) + the owner's review. Historical PROGRESS "different-model verified" entries stay as point-in-time records.

## D-050 — Adopt KOS v1.0 (agent-curated knowledge base: bootstrap standard + desk-knowledge instance)
- **Context:** the repo has canonical docs (this file, `style/*`, `facts.json`, skills) but no home for what the factory **learns** — no lessons/experiments/research store, no glossary, and the review/QA loop wrote its insights nowhere. Three drafts converged into `knowledge/KOSplan.md` (claims verified against primary sources, July 2026).
- **Decision:** implement KOS v1.0 per that plan: a portable, project-agnostic **standard** (`knowledge/bootstrap/` — SYSTEM.md + 9 specs: relative md links only, 4 lifecycle statuses draft→stable→canonical→deprecated, per-role size caps 200/650, supersede+archive with provenance, create-on-demand categories, evidence-before-canon) + this repo's **instance** (`knowledge/desk-knowledge/` — `PROJECT.md` maps canonical knowledge **in place**; decisions stay HERE, KOS `decisions/` stays unused — one decision log per project). Structure is enforced in code by `scripts/knowledge-lint.mjs` (9 checks + `--fix` generation of backlinks/index listings; 18 tests), run **manually after every instance write** at v1.0 — Stop-hook wiring is a candidate once the instance proves stable.
- **Consequences:** one durable, validated home for lessons/experiments/research/glossary with zero duplication of existing canon; the review/QA system gains a write-back target (`lessons/`); `npm test` now also covers `scripts/`; adopting KOS on another repo = copy `bootstrap/` + run its adoption spec.

## D-051 — Fill-the-stage layout contract + no-reflow transitions (owner, 011 final gate)
- **Context:** at the 011 final gate the owner rejected S2 v1 and flagged frames where scene content floated as a small centered cluster ("it should always take as much space as possible… 5% up margin and 15% bottom due to subtitles") and where a height-collapse transition visibly "shifted the page".
- **Decision:** every scene's content spans the **top 5% → 85% band** (bottom ~15% = caption band) with big type/icons; in-scene visual swaps use **absolutely-positioned layers moved by `transform`/`opacity` only** — never animate an element's flow height. Canon: `style/MOTION_SPEC.md` §0 ("Fill the stage"); evidence: KOS lesson `2026-07-07-fill-the-stage-no-reflow-transitions`.
- **Consequences:** 011 S2 rebuilt (fly-out/slide-up swap), S3/S5/S6/S7 upsized + spread; all future bespoke components are authored against the band contract.

## D-052 — No announced honesty; series signatures are explicit owner decisions (owner, 011 final gate)
- **Context:** "Now the honest part." had become a stock spoken beat-opener across videos (009 S6, 011 S6 draft); the owner rejected it — announcing honesty is telling instead of showing, and the repetition reads as a tic.
- **Decision:** the honest-catch beat **opens directly on the strongest limitation** ("It won't ship you a startup…"), phrasing varies per video, and no stock beat-opener repeats across videos. Announced-honesty phrases are blacklisted in `style/STYLE_GUIDE.md` §9; authored via script-writing rule 1c. **Exception:** a deliberate series signature requires an explicit owner decision — currently only "Unsexy — that's the point." in the `everyone-asks-ai` lane.
- **Consequences:** 011 S6 rewritten + re-voiced; the honest-catch beat itself (sensible limits, non-preachy) stays mandatory; KOS lesson `2026-07-07-no-stock-beat-openers` tracks the evidence.

## D-053 — Gemini retired from the review panel; a single-reviewer panel still gates (owner, 2026-07-09)
- **Context:** during 012's script review, `gemini-3.5-flash` returned sustained 503s ("high demand") all day, one mid-window response was malformed JSON, and the retry traffic then exhausted the free-tier daily quota (429 RESOURCE_EXHAUSTED — 20 requests/day/model). The system has outgrown what a free-tier reviewer can serve (idea/script/scene-plan/cut stages × up to 3 iterations each). Owner: remove Gemini from the video **and** from the review procedure/skill entirely.
- **Decision:** the `gemini` reviewer and `llm.providers.gemini` are `enabled: false` in `config.json`/`config.example.json` (entries kept for provenance, marked retired — do not re-enable without the owner). The orchestrator's `reviewStage` guard skips review only on an **empty** panel (`< 1`); a **single-reviewer panel** (claude-subagent, Sonnet 4.6) still gates with the same rubric, thresholds, and loop. `groq` (llama-4-scout, free tier) stays as a **disabled, untested** option if a second reviewer is ever wanted. Pinned in code by `pipeline/shared/review/panel-config.test.mjs`.
- **Consequences:** amends D-040's "two independent reviewers" ideal — review now rests on one independent sub-agent + the owner's human gates; no external free-tier quota sits in the loop's critical path. ROADMAP §C1 updated; `qa-panel-use-gemini` memory superseded; KOS lesson `2026-07-09-free-tier-reviewer-outgrown`.

## D-054 — Video 012 is the minimum visual benchmark; late-appearing elements get reserved space (owner, 2026-07-10)
- **Context:** at 012's final gate the owner approved the video and set the bar: "this must be the minimum standard for visuals/animations/transitions — it can only improve from here." He praised the per-scene icons and the visual flow conceived to follow the script. His two fixes both had the same root: elements are fine alone but collide when they appear (MY DESK off-center in its GATE field; the `lab-outro` "next build" tag + station row landing on the title/subscribe stack).
- **Decision:** 012 (`studio-reveal`) is the **whole-video floor** — every future video meets or beats its visual/animation/transition level (MOTION_SPEC §0). Layout sub-rule: any element that appears later in a scene (badge, CTA, tag) gets its own reserved space and must never land over existing text, in **both** orientations.
- **Consequences:** authoring reviews compare against 012's scenes, not against templates; overlap checks happen at authoring time for landscape AND portrait. Memory `012-minimum-visual-benchmark`.

## D-055 — No API uploads: the owner uploads to YouTube manually (owner, 2026-07-10)
- **Context:** at 012's publish step the owner stopped the API draft-upload: he suspects videos uploaded via the API as private drafts and later flipped to public get fewer first-day views than manual uploads, and wants to test that theory. He also chose to ship 012 with the edge-tts draft voice (skip the Azure re-voice) for this video.
- **Decision:** the publish phase produces the full package (`publish.json`, `medium.md`, thumbnails, captions) and **stops** — no YouTube Data API upload, no draft creation. The owner uploads manually and sets "Altered content = Yes" in Studio himself.
- **Consequences:** amends the youtube-publish skill's upload step (R15's "upload as private draft" is suspended until the owner says otherwise); the weekly autonomous run must halt at the publish-package stage. Memory `manual-yt-upload-preference`.

## D-056 — Thumbnails: candidates-first from the video's own timeline; owner picks; no AI thumbnail reviewer (owner, 2026-07-11)
- **Context:** plan v2 ("Thumbnail Intelligence"), after two external review rounds. The old flow (2 image prompts the owner runs in a free tool) required owner work per video, and plan v1's density heuristic was wrong — best thumbnails are one large focal object, high contrast, minimal text ("crowded ≠ clickable").
- **Decision:** new phase `pipeline/04b-thumbnails/` extracts **3 caption-free candidate stills** from the video's own timeline: scenes scored deterministically from metadata we author (`score-scenes.mjs` — ONE exported `WEIGHTS` object; `reasons` = the fired criteria), a settled frame per scene (after the last enter-beat, before any exit), HF scene clips grabbed directly (caption-free by construction), Remotion scenes grabbed from final.mp4 only at a caption gap. Score+reasons persist to `thumb_candidates.json`; all 3 are composited final-ready for YouTube Studio **Test & Compare**. **The OWNER picks** (recorded as `chosen:true` via `build-metadata.mjs --choose-thumb` — the seed of future CTR↔score learning); **no AI thumbnail reviewer** until real CTR data accumulates. The 2-prompt flow (visual-prompts) stays as the fallback.
- **Consequences:** the orchestrator gains a `thumbnails` node (after render_long, before upload); bare title-on-background cards and CTA/outro scenes are excluded candidates (no-title-card rule); CTR→weights learning + analytics→KOS lessons are a separate future project (not built).
- **Amendment 2026-08-19 — for concept/explainer videos the PROMPTS lead again; extraction is the alternative.** Measured over two Desk Lessons videos: **14 extracted candidates, 0 shipped** (021: 7, scores 55–70, no pick ever recorded; 022: 7, scores 75–**110**, all rejected). The scorer is not wrong, it is answering a different question — one large focal object, high contrast, minimal text is a **legibility floor**, not a click predictor. The missing property is legible only to a human: a stranger scrolling has no narration, and our explainer scenes are deliberately abstract, so a frame lifted out of one shows an **object with no subject** ("nobody seeing stacked paper thinks AI or context window", owner, 2026-08-18). Every thumbnail concept — extracted or prompted — must carry **(1)** an unmistakable AI signifier in frame, **(2)** the mechanism drawn rather than the topic named, **(3)** a reserved headline zone carrying the **search phrase** (022 shipped "WHAT IS A CONTEXT WINDOW", not the thesis line "IT NEVER REMEMBERED" — title and thumbnail front-load the same query). So: **concept/explainer → write the prompts first**, offer the stills as the alternative; **demo/screen-capture**, where a frame shows a real artefact working, keeps extraction first. Extraction still runs on every video (it is free and it is the CTR-learning seed). Unchanged: the owner picks, the owner generates, no AI reviewer, no auto-generated images. Two operational rules the same round paid for: **re-extract after any re-render** (022 offered two frames from the v1 hook that were no longer in the shipped cut), and a hand-added candidate must be written **through the schema** (`source` enum) — a typed-in `"manual-grab"` failed validation and `--choose-thumb` would have thrown on the owner's pick. Written into `.claude/skills/visual-prompts/SKILL.md`; the why is `knowledge/desk-knowledge/lessons/2026-08-19-a-thumbnail-must-say-ai-at-a-glance.md`.

## D-057 — Publish metadata passes the review panel (publish stage) + publish.md human export (agent, 2026-07-11)
- **Context:** operating principle 3 ("every text passes a review agent before a human sees it") — publish copy (titles, description, tags, chapters, Short caption) bypassed the panel; and the owner's manual-upload flow (D-055) needs a copy-paste-friendly surface.
- **Decision:** (1) `build-metadata.mjs` writes **`publish.md`** next to `publish.json` — same fields 1:1, fenced copy-paste blocks + the thumbnail-candidate table; JSON stays canonical (`--md-only` regenerates the md after editing the JSON). (2) A **`publish` review stage** on the existing single-Sonnet panel (D-053): SEO/claims rubric (gates: accuracy, no_overpromise, disclosure_set; categories: title_ctr, seo_keywords, answer_first_description, metadata_consistency; weights in `config.review.panel.stage_overrides.publish`), run by the orchestrator's `review_publish` node between metadata and upload.
- **Consequences:** `reviewStage` now resolves stage overrides via `resolvePanelCfg` (script/cut behavior unchanged); review.schema/config.schema gained the `publish` stage; MockReviewer became stage-aware. First live run on 012 scored 7.4 (pause band) with genuinely useful fixes — the gate works.

## D-058 — Reusable engagement system: Short hook, Short→Long bridge, unified CTA-question (owner plan, 2026-07-14)
- **Context:** owner shared 014 analytics — strong reach (Shorts feed ~75% of views, >50% swipe-stay, ~65% retention) but weak stickiness/engagement and under-fed long-form discovery. Governing principle: **don't confuse what brings views with what builds the channel** — reusable system upgrades improve every future video, so they rank above any single post and ship first.
- **Decision:** three Tier-S system upgrades. **(1) Separate Short hook** — the Short no longer inherits/shortens the long-form hook; `script.short_hook` authors a purpose-built first-~3s opener (own cold-open narration voiced in the Short's own TTS pass — never spliced; optional distinct `on_screen_text` punch and `hook-*` custom component). `make-short` prepends it as s1 and drops the long hook; the QA hook gate is Short-aware (`hook.visual_detail.short_first_seconds`, default 3s, vs long-form 30s). **(2) Short→Long bridge** — `buildBridge` formalizes Short → Long → pin → template → cross-post into `publish.bridge` + a manual checklist in `publish.md`; we upload manually (D-055) so the system builds the package, the owner clicks YouTube's native link/end-screen UI. **(3) Unified CTA-question** — one topical `closing_question` seeds the `pinned_comment` that answers it and invites replies; reconciles with STYLE_GUIDE §9 (a single topical question is a conversation starter, **not** engagement-begging; subscribe stays singular; no like-begging).
- **Consequences:** script/publish/brief/format schemas gained `short_hook`, `closing_question`/`pinned_comment` (script), `bridge` (brief + publish), `hook.visual_detail.short_first_seconds`. `make-short.mjs`, `check-lib.mjs`, `build-props.mjs`, `build-metadata.mjs`, `distributor.mjs` updated; skills (script-writing, script-review, qa-video, youtube-publish) + STYLE_GUIDE §9 updated. Gate-1 threshold was already config-driven (`config.review.panel` idea override 9.0/7.5) — no literal to factor out. **Explicitly NOT doing** the multi-part/"come back next episode" mechanism (owner overruled — tease only when a story splits naturally). Next big systems queued: **Pattern Library** (topic engine, before the teardown format) then the **Learning Loop / analytics→KOS** (ROADMAP).
- **Deferred:** "Make vs Zapier vs n8n" — heavy competition, no authority yet; "here's ONE boring thing" beats "here's every platform."

## D-059 — "The AI Agent" series + channel subject-map; retire 015 as a near-duplicate of 011 (owner plan, 2026-07-15)
- **Context:** the drafted **015** Short ("write emails → find the ones I shouldn't answer") was judged too weak to ship — a **near-duplicate of the shipped 011** (same subject: inbox; same mechanic: read a pile → sort → surface the few that matter; same "you still decide" beat). It reached the script stage as a **free-text seed** inside the `everyone-asks-ai-series` idea in `ideas.json`, consumed at the script gate — **bypassing the idea-pass** (`rubric.mjs`). The picker's soft-cap (`extendsRun` in `pick-next.mjs`) guards lane/archetype/tool but **never subject**, so a same-subject collision was invisible. Root cause: **there is no map of the territory** — no coordinate per idea, so collisions can't be seen.
- **Decision:**
  1. **Retire 015.** It will not ship (revert the `everyone-asks-ai-series` seed to `backlog`, drop the consumed free-text seed, mark 015 `rejected`). Leave `content/015-*` on disk (principle 6 — never delete without asking). Executed with the guard in the idea-system phase.
  2. **Channel subject taxonomy (the map).** Every idea gets a `subject: "branch/leaf"` coordinate under **AI Decision Automation**, four branches: **Attention** (inbox, notifications, meetings) · **Change Detection** (policies, competitors, pricing, docs) · **Failure Detection** (stopped jobs, missing sales, broken flows) · **Execution** (reports, summaries, actions). Current videos slot: **011 → attention/inbox**, **016 → attention/inbox**, **017 → change-detection/policy**. Lives in `docs/CHANNEL_MAP.md` (human map) mirrored by `pipeline/00-ideas/produced_subjects.json` (machine registry).
  3. **Channel identity, named:** **"AI doesn't replace judgment. It removes the things that steal it."** Broad enough to cover Execution, not only watching.
  4. **017 = "The AI Agent" Ep. 1** (Change Detection / policy). The series teaches *agent = a decision layer, not a scraper*. 017 is the first real continuation of the named identity; it **bridges to 016** (shared "automate the deciding" framework).
  5. **016's role** = the human-approval / failure-handling installment of the series (foreground guardrails, failure-handling, the human gate — fail-loud DNA). Its dependency on 015 is removed; the Short→Long bridge now originates from 017.
  6. **Minimal idea guard (smallest thing that stops the next 015):** an optional `subject` field in `ideas.schema.json`; a **subject-collision warning** in `pick-next.mjs` (surfaced in `--dry-run`, **no auto-rejection**); and **seed-gating** — before a script is written the brief's `value_band` must exist (proof it passed the idea-pass), else STOP.
- **Consequences:** ideas gain a visible coordinate and collisions surface at pick time; free-text seeds can no longer skip the idea-pass into a script; the "everyone-asks-ai" lane keeps its format but not a same-subject-as-011 entry. New docs: `docs/CHANNEL_MAP.md`. Cross-link from `style/CHANNEL.md` §3. A spin-off content idea ("Your AI Agent Doesn't Need More Context. It Needs Smaller Tasks.") was captured for a separate plan — not bundled here. Delivered in phases: 0 (this entry) + 1 (build 017) first, owner validates, then 2 (rework 016), 3 (channel map), 4 (guard).

## D-060 — The scene boundary honors the authored transition; the default is a hard cut (owner plan, 2026-07-16)
- **Context:** the agent already wrote real art direction per scene, and the renderer destroyed the part of it that crossed a boundary. `content/017-fine-print-watch/short/scene-plan.json` carried three explicit boundary instructions inside `props.note` ("Match-cut the doc into s3", "Push into s4", "Carry the gold YOU node into s5") — **no renderer reads `props.note`**. `Main.tsx` wrapped **every** scene in `SceneWrapper overlap={crossfadeFrames ?? 9}`, so all three rendered as the same ~300ms dissolve. Worse, the blend was a **pre-roll**: scene *k*'s window started at `F(start_k) − 9`, so every line of narration was preceded by 300ms of the previous scene ghosting into it. `style/MOTION_SPEC.md` §3 already mandated the opposite ("**Default to a hard cut** … Banned: … *relying on transitions instead of cuts*") and then papered over the gap in one sentence ("Our base crossfade stays the small 9-frame blend"). **That sentence was the bug.**
- **Why a mechanized field and not a richer planning prompt:** inside a scene no semantic field can reach pixels (HyperFrames renders author-written HTML — `camera: push-in` becomes pixels only when someone writes the tween), so the only consumer of in-scene direction is the **author**; hence prose. The scene **boundary** is the one place Remotion composites, and therefore the one place a semantic field mechanizes. (Precedent: the archived `storyboard.schema.json` `camera_move` enum — declarative in-scene camera config was tried, shipped once, and replaced by the narration-anchored `focalZoom`.)
- **Decision:**
  1. **`transitionOut`** — a scene-level (and beat-level) enum, **default `cut`**. Mechanized: `cut` (overlap 0, windows abut), `dissolve` (opacity cross-blend), `push`. **Authorial:** `match`/`morph`/`carry` **compile to a hard cut** — two independently pre-rendered clips cannot be aligned by the compositor, and a match cut *is* a hard cut whose frames were composed to rhyme. The value's job is to be recorded, to reach the author, and to be reviewable; faking it would be a lie. The pull-back becomes a property of the **boundary**: `pullback_k = overlapFrames(scenes[k−1].transition_out, xf)`.
  2. **`direction`** (`{ premise*, palette, carry }`) — the schema'd home for the art-direction brief, a **sibling of `props`**, prose for the author. It never enters `timeline.json` → never reaches `jobVariables` → **cannot** enter the HF cache key, fixing "editing prose forces a full re-render" **by construction rather than by filter**. This is a **cache-boundary rule, not a philosophy about creativity**: the HF idempotency key is the whole variables JSON, so every field is either a render input (editing it re-renders) or not. Anything we later want the renderer to obey (per-scene `tempo`, `opening_state`) becomes a **new field next to `transitionOut`**, on the executable side — never "`direction` becoming executable".
  3. **`lib/transitions.mjs`** is the ONE copy of the window math. It had **three** consumers and only two were ever compared — `04b-thumbnails/extract.mjs`'s `hfClipLocalSeconds` was a hand-mirrored copy in another phase dir with no parity test that fails **silently** (a drifted copy grabs the wrong frame out of every HF clip). All three now call `sceneWindow`, and the third parity leg is tested.
  4. **Not retroactive.** This serves 018 onward; 001–017 are not migrated and their `props.note` stays an ignored prop. **`props.note` is untouched** — it is a **live rendered string** on `008-receipt-to-spreadsheet` s06 (`swappable-engine.js` → `setText("honest", props.note)`), so a blanket rename would break 008. Once art direction has a documented home, `note` reverts to being an ordinary prop.
- **Consequences:** **sync is safe and verified** — every window END is bit-identical, every caption byte-identical, every `reveals[i] + fromFrame` conserved; perceived start is unchanged (opacity used to hit 1 at `F(start_k)`; now opacity is 1 from frame 0 of a window that *begins* there — same frame, sharper edge). **The one behavior change:** `reveals[0]` loses its 7-frame lead runway on non-first scenes (clamps to 0). That is physics — you cannot animate an element in before its scene exists — so under a cut **the scene's opening state IS the reveal**; taught in the `storyboard` skill, not "fixed" by keeping a small pull-back (an opaque scene drawn over its predecessor would move the cut 300ms *earlier* than the alignment mark — the only real desync available here). **Intro/outro bumpers stay at `xf`** (brand bumpers, not scene cuts), so the **last** scene's `transitionOut` is ignored — build-props warns rather than dropping direction silently. `SceneWrapper`'s hard-cut path **must bypass `interpolate`** (`interpolate(0,[0,0],[0,1]) === 0` would put a 1-frame background flash at *every* boundary — verified absent by a render probe). `content/_FIXTURE/golden-props.json` was regenerated: its job reverts from "prove the V5 seams changed nothing" to a renderer-visible **regression snapshot**. **Supersedes D-022's** "a `SceneWrapper` **crossfade** (~9 frames) between scenes" — 9 frames is now the dissolve/push duration and the bumper blend, **not** a per-scene default. Phases 2 (`concepts/` KB + making it live) and 3 (HF `_lib/` extraction) are parked in ROADMAP.
- **Phase 2 shipped 2026-07-16** (`knowledge/desk-knowledge/concepts/`), **Phase 3 shipped 2026-07-17** (`templates/hyperframes/_lib/` — one vendored gsap + `hf-scene.js` contract helper; all 60 scenes migrated by codemod, ~21-line preamble → 2 lines, net −1519 lines; a render guard `detectDeadRender` fails loudly on a silently-dead scene). Equivalence proven by render (decoded-pixel hashes under the bit-stable software rasterizer): every migrated scene is bit-identical to its git original or within its own GPU-noise floor — **zero real defects**. Load-bearing detail: `_lib` is referenced `../../_lib/…` because the HF file server roots at the scene dir and the CLI's compiler copies the outside-project asset in (`../_lib` 404s **silently** — the render still exits 0 with a frozen mp4, which is exactly what the guard now catches). See ROADMAP Phase 3 + the `video-render`/`storyboard` skills.
- **Not bundled (noted):** `motion.transition` in `formats/default.json` is read by **zero** code and its enum (`crossfade|shared-element|wipe`) cannot even express `cut` — flagged for deletion, left in place because removing it changes the golden's `motion` block, which the plan's golden-diff audit pins as byte-identical. Owner call.

## D-061 — Two forcing functions so the knowledge base can't silently drift (owner ask, 2026-07-19)
- **Context:** a health check of the KOS instance found the *structure* sound (knowledge-lint: 0/0)
  but the *learning loop* running on memory, not mechanism. `knowledge-lint` was wired into **no**
  hook (only `test-gate.mjs` gated Stop); `docs/WORKFLOW.md` had **zero** mentions of knowledge/
  lesson capture; five 2026-07-07 lessons had sat at `draft` since creation, never promoted; the
  research category was untouched for 11 days; and video 018 shipped with no lesson. Write-back was
  left to the agent *remembering* — so it happened when the focus was the KB (concepts, 07-17) and
  was skipped when the focus was shipping a video (018). The real auto-update (analytics → lessons)
  is a separate, deferred project (ROADMAP "Learning Loop"), explicitly **not** in scope here.
- **Decision (two forcing functions, cheap + policy):**
  1. **Mechanical (structure).** New Stop hook `.claude/hooks/knowledge-lint.mjs`, added alongside
     `test-gate.mjs`. When any `knowledge/desk-knowledge/**.md` changed, it runs `knowledge-lint
     --fix` (self-healing Backlinks footers + AUTO-INDEX blocks) and **blocks finishing on residual
     structural ERRORS**. Mirrors test-gate's safety design exactly: fail-open, plan-mode skip,
     change-scoped, bounded re-blocks (max 2), `[skip-kos]` escape. It guards *structure only* — it
     cannot invent an insight.
  2. **Policy (insight).** `docs/WORKFLOW.md` gains **Step 7 — Capture what we learned (KOS
     write-back)**: after publish, ask "what did we learn?" and owe a note whenever an owner
     rejection/change at a gate, an incident/bug pattern, external research, or a 3rd concept-drawing
     happened — "nothing durable? nothing owed." The build-sprint **DOCUMENT** step carries the same
     obligation for code changes.
- **Also done in the same sweep:** promoted the 5 `draft` lessons → `stable` (evidence confirmed per
  lifecycle §2; two are codified in MOTION_SPEC §0 / STYLE_GUIDE §9, verified present); re-verified
  the studio-reveal research and added YouTube's **2026-07-13** inauthentic-content clarification
  (three demonetization buckets — the "AI personas as experts on sensitive topics" bucket is the one
  to watch for our AI-voice format); wrote the 018 lesson (owner-authored visuals **invert the sync** —
  fit narration to the recorded animation, kept `draft`: one application, one open overrun).
- **Consequences:** structural KB drift is now mechanically impossible to finish a turn on; insight
  capture is a written step in both the video workflow and the engineering cycle instead of relying on
  recall. The bigger analytics→KOS auto-lesson loop (#4) stays deferred to ROADMAP.

## D-062 — One lifecycle ledger; every other lifecycle file is a derived projection (owner plan, 2026-07-25)
- **Context:** a video's lifecycle state lived in *five* mutable files with no owner — `ideas.json`
  (`status`/`produced_video_id`), each `content/<id>/publish.json` (`status`),
  `produced_subjects.json`, `docs/CHANNEL_MAP.md`, the run manifest. Shipping meant hand-editing
  several **while in ship mode**, so it got skipped. Measured drift: **5 videos shipped but still
  `in-progress`**, `produced_subjects.json` half-filled, 019's Short still `draft_pending` weeks after
  it went live. D-061 had just added a *sixth* manual obligation (write the KOS lesson) as a **policy
  rule** — and that is exactly the kind of thing ship mode skips (018, then 019, then 020). The
  owner's point: the mechanism must be **code, not a rule**.
- **Decision (Option B).** `pipeline/state/videos.json` — a tracked, schema-validated **ledger** — is
  the only writable lifecycle state, one record per publish.json. `ideas.json` status,
  `publish.json` status and `produced_subjects.json` become **derived projections**, regenerated
  idempotently by `pipeline/state/reconcile.mjs`. Two invariants: **one-way** (ledger → derived,
  never reverse) and **forward-only** (`published` ↛ `draft_pending`, `produced` ↛ `in-progress`, a
  subject entry is never removed, a settled lesson never re-opens). A Stop hook
  (`.claude/hooks/publish-close.mjs`) runs the reconciler on every turn-end: it **silently self-heals**
  everything a machine can compute and **blocks only** on the one thing it can't — a shipped video
  whose `lesson.state` is still `pending`.
- **Boundary.** `ideas.json` stays authoritative for idea *selection* (backlog, scores, metrics); the
  ledger is authoritative for the *lifecycle of a video that exists*. They overlap at exactly
  `in-progress → produced` + `produced_video_id`, so `pick-next.mjs`, `auto-run.mjs` and
  `fetch-analytics.mjs` were untouched. **`CHANNEL_MAP.md` stays human prose** (retirement
  strikethroughs, cluster-mate notes) — code owns the machine mirror only, and the hook *reminds* the
  owner to add the human row.
- **Lesson state is an explicit enum** (`pending` / `none` / `linked`), never inferred from a missing
  field, so a malformed record can't silently block a turn or silently absolve one. `--learned --note
  <slug>` links a KOS note; `--learned --nothing` records "reviewed, nothing durable".
- **Scope: `live_from: "020"` onward.** Everything ≤019 was backfilled once (`--backfill`) with a
  closed stamp (`lesson: none/"backfill"`, no fabricated ship date, no analytics schedule) — history
  is recorded, never owed. Applying it cleared the whole measured drift and flipped 019's Short to
  `published`.
- **Rejected / deferred:** Option C (append-only `events.jsonl`, state = fold) — revisit only if
  lifecycle branching grows. Auto-writing `CHANNEL_MAP.md`. A richer publish lifecycle (per-platform,
  scheduled) and dated analytics snapshots → the analytics thread.
- **Consequences:** close-out is no longer a rule anyone has to remember; the drift class that
  produced "5 shipped videos still `in-progress`" is now mechanically impossible to leave behind. A
  by-product worth naming: `applyPlan` **skips** (and reports) a derived file that is already
  schema-invalid instead of aborting the pass — two legacy files (004's `medium` is a filename, 007
  predates `title_options`) would otherwise stall the self-heal for every video after them, forever.

## D-063 — Sound design: a bed + one-shot cues alongside the narration; and silence you can script (owner ask, 2026-07-25)
- **Context:** the render mixed **exactly one audio track** — the narration (`Main.tsx`). No music
  bed, no SFX layer. The 016 plan's hero shot (a live workflow run, labels snapping on, `0 deleted`
  landing last) was reviewed as "pulse, zoom, counter, **sound design**" — three quarters available,
  one quarter simply absent. Separately, that beat is designed around **~4s of held silence** before
  the run, and our TTS could not produce it: measured on the real voice, a sentence break buys ~0.42s
  and an ellipsis ~0.79s. Both gaps are about the same thing — the video has no control over its
  own soundtrack.
- **Decision (two parts, both opt-in, both reusable).**
  1. **Sound design layer.** `scene-plan.audio` = `{ bed?: {src, gain}, sfx?: [{src, atSeconds, gain}] }`
     → `timeline.audio_layers` → `props.bed` / `props.sfx` → extra `<Audio>` tracks in `Main.tsx`.
     Cues are authored on the **narration clock** (the clock the author reads off `alignment.json`)
     and frame-snapped, so an impact lands on the frame it was written for. Files come from a
     **shared `assets/sfx/` library** — a riser bought once is reused on every hero moment.
  2. **Scripted pauses.** `script.scenes[].pause_after: [{after_sentence, seconds}]`. `make_voice.py`
     synthesizes the narration in **segments** split at each pause, splices real silence between them
     and shifts every later timestamp. A scene window still runs from one sentence start to the next,
     so the silence simply widens the beat it sits in.
- **The track stays one continuous file.** PRD R11 forbids *cutting* the narration; we are
  *lengthening* it and *adding* tracks beside it. Nothing is ever cut.
- **Mechanics worth remembering.** edge-tts returns CBR MPEG-2 Layer III, 24 kHz mono, 48 kbps —
  every frame exactly 144 bytes and 24 ms. That fixed shape is what makes both the segment durations
  and the spliced silence exact with no decode step and no drift; silence is generated by the repo's
  **vendored ffmpeg** (`templates/hyperframes/.bin`) with `-write_xing 0 -id3v2_version 0`, because a
  Xing header frame or an ID3 tag landing mid-stream would throw the frame count and therefore every
  later timestamp.
- **Deliberately NOT built:** side-chain ducking of the bed under the voice. A bed at gain ~0.08 under
  a −16 LUFS narration does not need it, and a *swell* is expressible as an sfx cue. Revisit only if a
  real mix problem shows up.
- **Fail-soft by design:** a missing sfx file is a warning and the cue is **dropped** (same posture as
  a missing logo). Sound design must never be the reason a render dies. A missing *silence* generator,
  by contrast, **fails loud** — it would silently desync every timestamp after it.
- **Consequences:** a plan with no `audio` block and a script with no `pause_after` produce
  byte-identical output to before (the golden-props acceptance test still passes). 016 s6 is the first
  user: a 3.216s scripted hold before the run, measured end to end at a 3.69s silent region with the
  alignment matching the audio exactly.
- **Amendment 2026-08-15 — the cues are generated, not acquired.** The library shipped empty with a
  README pointing at CC0 catalogues; `git check-ignore` settles why that was the wrong default:
  `*.mp3` is ignored repo-wide, so a downloaded cue is untracked state on one machine and a fresh
  clone silently renders with no sound design. `scripts/make-sfx.mjs` synthesizes the three cues with
  the **vendored ffmpeg** (`aevalsrc`: one arithmetic expression over `t` per cue — envelope, pitch
  sweep, noise layer), so the tracked recipe *is* the asset and regenerating is byte-identical.
  Licence risk drops to zero — we authored them. `generateCue` **never overwrites** an existing file
  without `--force`, so a CC0 file dropped in under the same name wins and survives regeneration; the
  library stays swappable. Verified by measurement: the riser climbs −50 → −24 → −13.5 dB across its
  rise and resolves to −20.8 dB in its tail, and no cue clips (−3.0 / −1.1 / −2.8 dBFS peak).

> Superseded: **D-008** (avatar) — dropped permanently; the channel is faceless forever.
> **D-012** (name) → see D-023. **D-014** (TTS) → see D-024. The old "no AI-disclosure" note → see D-025.
> Still in force: **D-002** (no YouTube transcripts; clean sources only).

<!-- Add D-020, D-021, … as new decisions arise. Supersede, don't delete. -->

## D-064 — A shared cinematic substrate for HyperFrames scenes (`_lib/hf-fx.*`) — the stage is built once (owner note, 2026-08-16)
- **Context:** 021 shipped **24 bespoke scenes** and the owner's verdict was still *"previše plain —
  slideshow sa rečima i običnom pozadinom"*. The scenes were not lazy; the **frame** was. Every scene
  file re-invented a thin stage (one radial gradient + one grid + one glow) in its own CSS and then
  spent its entire budget on typography. Nothing in the picture had depth, grain, light, weight or
  continuous life, so however well a beat was staged it read as text on a background.
- **Decision:** the stage stops being per-scene work. `templates/hyperframes/_lib/hf-fx.css` +
  `hf-fx.js` give every scene, for free:
  - **a six-layer stage** — depth ground, masked blueprint grid, two volumetric light shafts, a
    re-aimable focal bloom, deterministic dust motes, stepped film grain, vignette, caption band;
  - **a camera rig** (`#world` + `FX.camera`), so a scene can push in / pull back as one object;
  - **physical paper** — `.fx-slab` (a page seen edge-on: the unit a pile is built from) and
    `.fx-sheet` (face-on, when its content must be readable), both with layered contact + ambient
    shadows, plus `FX.pile/desk/sweep`;
  - **the shared vocabulary** — gradient gold type, source chips (D-026), quote plates, the gray myth
    plate and the gold slash, `FX.count` counters, `FX.strike`;
  - **`FX.ambient(tl)`** — one line that gives the scene continuous, motivated secondary motion for its
    whole duration. This is the anti-"dead frame" device.
- **Consequence for authoring:** a scene file is now art direction only. It declares its contract in
  two lines (`HF.scene` + `FX.init`) and spends the rest on the idea. `_lib/make-entry.mjs` does the
  same for the render entry (two lines instead of forty).
- **`FX.fromTo` is mandatory for any beat later than 0.** Measured 2026-08-16: `gsap.fromTo` defaults
  to `immediateRender: true`, so a fromTo placed at 12s applies its `from` values at **build** time —
  a gold page meant to fade in late sat at opacity 0.2 from frame 0 and dirtied every earlier frame.
  `FX.fromTo(tl, target, from, to, at)` pins `immediateRender:false`. Do **not** "fix" this with a
  global `gsap.defaults({immediateRender:false})`: `gsap.set()` is a zero-duration tween that relies
  on immediateRender, and the default silently erases every opening state in the scene (tried,
  reverted, one wasted render).
- **First use:** 022 — 14 scene dirs covering 26 long scenes + 5 Short scenes, all 100% HyperFrames.
- **Not changed:** existing scenes keep their own stages; this is additive. Determinism is unchanged
  (no `Math.random`/`Date.now` — `FX.rng(seed)` only), and scenes stay silent + seek-driven.

## D-065

**Fixing one scene patches the rendered mp4; it does not re-render the cut.** (2026-08-23, owner —
*"umesto samo da ponovis render te scene… ti vrtis full novi render svih scena i to traje 2 sata"*.)

- **Context.** The HyperFrames clips are already cached per scene (D-019/D-060), so a scene fix costs
  about a minute of HF render. The whole cost is the Remotion composite pass: 11,331 frames at
  `--concurrency=1` — forced by the Chrome tab OOM across 26 `OffthreadVideo` sources — is roughly two
  hours for a 6-minute cut. Every owner note on a single scene was paying that in full.
- **Decision.** `pipeline/04-render/patch-scenes.mjs` re-renders only the frames the named scenes own
  (`--frames=A-B`) and splices them into the existing `video/final.mp4`. Measured on 023 s1.0:
  **392 of 11,331 frames = 3.5%**, ~4 minutes instead of ~2 hours.
- **Why the splice is exact, not approximate** (all measured on `content/023-attention/video/final.mp4`):
  1. x264 emits an IDR frame at every hard scene cut, because a cut *is* a scene change — the base
     file's keyframes (0, 250, 392, 642, 1070, …) are exactly the compiled `fromFrame` of s2.0/s4.0.
     `snapToKeyframes` widens outward, so both cuts always land on keyframes.
  2. The untouched remainder is a **stream copy** — verified bit-identical by decoded-pixel hash from
     the splice point on. No re-encode, no generation loss, no seam.
  3. The replacement segment is rendered by **Remotion itself**, not by ffmpeg, so it carries the same
     encoder and the same SPS/PPS as the base and the concat demuxer runs with `-c copy`. PSNR of the
     re-rendered head against the original: **50.9 dB avg / 46.1 min** (visually lossless).
  4. The segment is rendered `--muted` and the base's **audio stream is re-muxed untouched** (MD5
     identical). Audio drift is impossible by construction, which keeps PRD R11 ("never slice the
     audio") true through a patch.
  5. Every segment is normalised to the **base file's timebase** (`-video_track_timescale`) before the
     concat, and the run fails closed on **frames + played seconds + tbn**. See the amendment below.
- **Amendment (2026-08-25) — the gate measures TIME, not just frames.** As first shipped, item 5
  checked the decoded frame count only, and it passed two broken files (023 `v1.1`, `v1.2`): the
  picture stopped at 1:04 under a 6:17 track. Remotion writes 90000 tbn, our `final.mp4` carries
  15360, and the **concat demuxer keeps the FIRST input's timebase without rescaling the other
  files' packets** — so patching scene 1 (no head segment ⇒ the Remotion part is first) made the
  tail's 15360-tick stamps be read as 90000: `377.75 s / (90000/15360) = 64.5 s`. A mid-file patch
  breaks the other way (that scene plays 5.86× slow). The container's `Duration` hides it, because it
  reports the intact audio. Fixed by pinning cut/concat/mux to the base's tbn and by verifying frames
  **and** played seconds **and** tbn. The rule this cost us: *verify the property that would break
  (time), not the property that is easy to count (frames)*. Full write-up:
  `knowledge/desk-knowledge/lessons/2026-08-23-patch-the-render-dont-repeat-it.md`.
- **Scope / fallbacks.** A patch is valid when only scene CONTENT changed. Re-render the whole cut when
  there is no base file, when `alignment.json` moved (every scene window shifts), or when the
  intro/outro/caption layer changed. A patched file still runs `repair-dropouts` and `frame-gate`.
- **A patched scene's own frames are still fully composited**, so nothing about caption sync, scene
  windows or transitions is approximated — `affectedFrameRange` reads the same `lib/transitions.mjs`
  `sceneWindow` the compilers do, and a scene's pixels provably never leave its own window (every
  blend in this compositor happens inside the INCOMING scene's window).

## D-066 — A fully-3D cut runs on one shared world kit (`_lib/hf-world.*`) (owner brief, 2026-10-08)

- **Context.** The owner asked for a video built from scratch where *"every scene feels like a dynamic
  3D environment"* — fast-paced, fully animated, 2-3 minutes. D-064 built the shared 2D stage and
  `hf-three.js` gave one scene depth-of-field + bloom; nine 3D scenes on that would each re-invent the
  renderer, lights, floor, post chain and objects, and would not read as one world.
- **Decision.** `templates/hyperframes/_lib/hf-world.js` + `hf-world.css`, loaded after `hf-three.js`:
  `HW.create` (renderer, palette stage — sky, reflective floor, grid, fog, light rig — and an HDR
  half-float MSAA post chain: bloom pyramid, ACES, grade, vignette, grain, DOF, **analytic motion blur
  from the camera path**), `HW.shots` (a shot list; no smear across a hard cut), and builders: the
  number `lattice` (instanced tiles printing real values, wet-floor reflection, heat / frost / shock /
  scan / beam / slice / build uniforms), a real `chat` window, `card`, `frameBox`, `beam`, `sparks`,
  `dust`, `ring`. A 3D scene is a shot list plus its own objects; the props/beats contract is still
  `hf-scene.js`, the clip is still rendered per scene and composited by Remotion (D-019/D-060).
- **Why analytic blur.** The HF capture seeks frames in any order, so nothing may depend on the previous
  frame. The camera is a pure function of time; the smear for frame t is where camera(t) sees the point
  camera(t−1/fps) was looking at. Deterministic, and free.
- **Kept / not changed.** `hf-three.js` and every 023 scene are untouched; 2D scenes keep `hf-fx`.
  The ~50/50 3D/2D target (MOTION_SPEC §14) still holds for normal videos — an all-3D cut is a
  per-video owner choice. Authoring rules learned on the first use: MOTION_SPEC §15.
- **First use:** 024 — nine scenes `fz-*`, ~35-65s per clip at standard quality on the GPU path.

## D-067 — Pace, key takes, intro and motion are knobs; the 024 Short is the test case (owner, 2026-10-09)

- **Context.** Owner on the 024 long cut: *"It is okay but it is too fast paced."* Asked for the Short
  on the same topic **10% slower**, **no intro** (straight to the topic), the **important takes a
  further 5% slower** to let them sink in, and **10% less motion** — *"Motion doesn't need to be
  constantly moving something in the background or anywhere in the scene… it's losing focus to the
  important stuff"* — with the important takes highlighted. The long cut stays as it is; whatever the
  owner prefers in the Short goes into the next video, *"until we get the perfect blend"*.
- **Decision.** Each of those is a number on a knob, so the next tuning step is a one-line change:
  1. **Pace** — `brief.voice_rate` (already existed). A nested Short may now carry its own
     `short/brief.json` (the first brief found wins), so the long cut's pace is untouched.
  2. **Key takes** — `script.json` `scenes[].key_takes` (sentence indexes) spoken at
     `brief.voice_rate_key`. `make_voice.py` splits segments at a rate change (as it already did at a
     pause) and trims the padded tail at that boundary to an ordinary sentence break
     (`RATE_BOUNDARY_TAIL` 0.30s — edge-tts pads a short request to ~1.87s); `make_voice_azure.py`
     builds the same segment plan as SSML `<prosody>` + `<break>` (fixing a latent bug: the Azure final
     dropped every `pause_after`).
  3. **Intro** — `brief.format_recipe` is the per-video format override (`brief.format` is the
     long/short string, so the old object path was dead). `intro.*_seconds: 0` = no bumper: Remotion
     skips the Intro sequence, scene 0 owns frame 0 and has no fade-in.
  4. **Motion** — `HW.motion({ scale, focus, focusScale })` in `_lib/hf-world.js` (MOTION_SPEC §16):
     camera travel and the ambient clock × scale; focus windows on key takes slow both to focusScale,
     dim the dust and pull the vignette in. Opt-in: no `props.motion` = identity, every existing scene
     (the long 024 cut included) renders exactly as before.
  5. **Captions follow the takes** — a key take is always its own caption chunk, and
     `format.captions.sentence_breaks` (default off) breaks at every sentence; in that mode a long
     sentence splits into EVEN chunks at its own punctuation, never leaving a one-word orphan. Found on
     the Short's first cut: "chat finally said ankara learning / rewrites the" split the take in two.
     Videos with neither key takes nor the knob keep the legacy greedy chunking byte-for-byte.
- **Measured, not assumed.** edge-tts is not repeatable run to run, so the pace is measured against a
  reference synthesis of the same text at the long cut's rate (`short/pace.json`), and motion by an
  A/B render of each scene with and without its budget plus a scene-for-scene comparison with the long
  cut (`short/motion.json`). Result: speech **1.10×** (normal) / **1.166×** (key takes); motion
  **0.738×** the long cut — of which the budget knob itself is only ~3%; the rest is authoring (cut
  devices, slower pace, held takes). Hence MOTION_SPEC §16's rule: a motion target is a measured ratio,
  not a knob value.
- **Scope.** Six portrait scenes `fzs-*` (clones of the long's `fz-*`, recomposed for 9:16 — the long
  scene files are untouched). Defaults everywhere else are unchanged; adopting any of these for the
  next video is the owner's call after watching the Short.

## D-068 — No intro; pace, animation and transitions 5% slower; background motion only now and then (owner, 2026-10-09)

- **Context.** Owner on the 024 Short (the D-067 pacing test): *"Okay, but still not good enough."*
  Write down that every video is made **without an intro**, going straight to the topic with a catch
  that actually holds the viewer. The pace is fine in places but **still too fast elsewhere → another
  5% slower**. And *"constantly in the background some animation or transition is running, like the
  shimmering of these numbers. It's fine in some situations, but constantly through the whole video it
  loses the point"* → background animation **only now and then, and 10% calmer**. The training sweep
  over the numbers (`fzs-learn`) was also too fast. *"The rest is okay"* — key takes, take plates,
  sentence captions stay.
- **Decision — defaults for every video, in `pipeline/shared/formats/default.json`** (relative to the
  024 Short; MOTION_SPEC §17 has the table):
  1. **No intro:** `intro.long_seconds` / `short_seconds` **0**. Frame 0 is the topic, sentence 1 is the
     hook (script-writing, script-review, STYLE_GUIDE §5, MOTION_SPEC §2). A bumper comes back only
     through one video's `brief.format_recipe`.
  2. **Pace 5% slower:** new `voice { rate "-11%", rate_key "-15%" }` (the Short: `-6%` / `-11%`, measured
     1.10× / 1.166× the long cut's speech time; targets now ≈ 1.155× / 1.22×). `make_voice.py` and
     `make_voice_azure.py` read it (`recipe_pacing`); a brief's own `voice_rate` still overrides, and then
     keeps its own key rate (or none). Scripted holds ×1.05 of the Short's.
  3. **Animations and transitions 5% slower:** camera travel `motion.budget.scale` **0.855** (0.9 × 0.95);
     compositor dissolve **10 frames** (9 × 1.05 = 9.45 is not a frame — rounded up, so +11%), 0.33s;
     authored tween/transition durations ×1.05 against the MOTION_SPEC §3 / §5 baselines.
  4. **Background only now and then, 10% calmer:** `motion.budget.ambient` **`[]`** (the background clock
     stands still) and `ambient_scale` **0.81** (0.9 × 0.9) inside the windows a scene opens.
     `HW.motion` gained `ambientScale` + `ambient` windows (absent = runs throughout, so existing scenes
     are unchanged); `compile-hyperframes` hands `motion.budget` to every HF scene with no `props.motion`
     of its own. `motion.ambient` false; `FX.ambient` (2D kit) is opt-in, no longer mandatory.
  5. **Sentence captions** (`captions.sentence_breaks` true) — the Short's captions, which the owner kept.
- **What a 5% tempo cannot do.** The sweep the owner flagged crosses the block in ~0.58s per ring
  (30 units/s over ~17 units); ×1.05 is ~0.61s, which no one will see. A device that is far too fast is
  re-timed in its own scene (MOTION_SPEC §17).
- **Scope.** New videos get all of it by default. Already-authored `props.motion` (the 024 Short) wins
  untouched, and the 024 long's `fz-*` scenes never read the budget. 024's own briefs pin their pace
  (`+3%` long, `-6%`/`-11%` Short), so on 024's final render only the no-intro default (the long loses its
  1.5s bumper), the 10-frame dissolve and sentence captions apply. `content/_FIXTURE` pins the pre-D-068
  recipe so its golden props stay a regression snapshot.

## D-069 — The camera is square to the subject, and the subject is an object with parts (owner, 2026-10-10)
- **Context.** Commissioning 025 (the first video outside the Desk Lessons playlist; the agent picks the
  topic), the owner named what the 3D run of 021–024 had turned into: *"ne želim toliko uglova kamera od
  45/65/75 stepeni u odnosu na objekat… drži se 90 osim kad baš želimo 3D dubinu i prikažemo neku ključnu
  ideju koja ne može da stane u samu scenu"*, and *"drugi modeli prave brutalne promo materijale gde se
  rastavljaju svakakvi delovi automobila… a mi pravimo 3D chatove teksta sa LLM modelom. Hoću da ideš all
  out."* Depth and a moving camera had been standing in for motion design; the thing on screen was still text.
- **Decision.**
  1. **Face-on by default.** Camera yaw/pitch 0; dolly and truck carry the pace. At most ONE oblique shot
     per video, for an idea that is about depth itself. This **supersedes the "~50/50 3D" target** of
     2026-08-23 (MOTION_SPEC §14) and extends the no-tilt rule from cards (2026-07-12) to the camera.
  2. **A video's spine is an object with parts**, picked before the storyboard; scenes are that object
     assembling, running, or changing because one part arrived. Chat windows and text panels floating in
     3D are out as a scene's subject.
  3. **A third 3D kit, `_lib/hf-mech.js`** (+ `hf-mech.css`), beside `hf-three` and `hf-world`, which stay
     byte-for-byte (023 and 024 depend on them): a studio environment for metal, a spot + rake light rig,
     object motion blur by sub-frame accumulation, bevelled machined geometry (`HM.G`), and `HM.Part`
     (home + named away poses, so assembly and disassembly are one function). The video's own object is a
     second file on top (025: `_lib/hf-movement.js`, THE MOVEMENT).
  4. **Word marks and SFX come from the alignment, not from typing** — `render/plan.mjs` derives
     `props.marks` and every cue on the scene's own clock; scenes read `K.m(name, fallback)`. This is the
     024 re-voice lesson applied up front instead of repaired afterwards.
- **Why a new file and not an option on `hf-world`.** The briefs are opposites: a room the camera flies
  through, lit for emissive text tiles, with motion blur taken from the camera path; versus one object,
  studio-lit, held still, where the parts move. Sharing a renderer would have meant a flag on every line.
- **Cost.** $0. Eleven scenes render in 15 minutes at 6 sub-frames (8.5 fps at 1080p on the owner's GPU).
- **Rules:** MOTION_SPEC §18. **Lesson:** `lessons/2026-10-10-angle-variety-is-not-motion-design.md`.
  **Tests:** `pipeline/04-render/hf-mech.test.mjs`.

## D-070 — 025 is the new floor; no impact thud; never stop everything (owner review of 025, 2026-10-16)
- **Context.** The owner watched the 025 draft cut. Flow approved, with two defects: a low "dum" at what
  felt like random pauses, and the scene where the video seemed to freeze on "stopping a task".
- **Decision.**
  1. **025 replaces 012 as the minimum benchmark** for every future video (*"od ovoga može samo bolje"*);
     MOTION_SPEC §0. The named next step up: 2–4 scene sets joined by bespoke transitions, so the
     backdrop is not identical for the whole video (025 did not need it — its one machine carried the story).
  2. **`impact.mp3` is retired from scene-plans**, like `riser.mp3` before it. The "dum" was the impact's
     45/180 Hz thud, placed on ten visual hits — also against the storyboard skill's own "be sparing".
     Plans use `accent.mp3` and `whoosh.mp3` only (storyboard skill, `assets/sfx/README.md`).
  3. **A scene never stops all motion** to illustrate a stop. 025 s8 braked the whole machine and eased the
     camera to rest for ~3 s; on a player that is indistinguishable from a freeze. Holds keep a slow drift;
     `freezedetect` is the check (MOTION_SPEC §18).
- **Applied to 025:** s8's machine runs to the end of the scene, the STOPPED tag is gone; s3's tail and
  s10's card / rules holds got a slow dolly; all ten impact cues removed (28 cues remain: 17 accent,
  11 whoosh). The pre-fix cut is kept as `video/_v1/final-v1.mp4`.

## D-071 — One master file per video, at the best quality (owner, 2026-10-16)
- **Context.** 024 shipped three files (final 814 MB, a 7 Mbps "share" copy, a 25 MB "phone" copy) and 025 a
  final plus a share copy. No skill asked for them; it was an agent habit. Owner: *"uvek pravi samo jednu
  najbolju moguću i najkvalitetniju verziju, nebitno koliko prostora zauzima."*
- **Decision.** Every video and Short is delivered as exactly one file, `final.mp4`, encoded at the best
  quality the pipeline makes. No share/phone/preview copies. Size is not a constraint.
- **In code (one place):** `pipeline/shared/lib/encode.mjs` — `MASTER_CRF = 12`, `MASTER_PRESET = medium`.
  Remotion now captures **PNG** frames (was JPEG at quality 80 — a lossy step before x264) and encodes at
  CRF 12 (was its default 18); the HF normalise pass encodes at CRF 12 (was 16, veryfast); `repair-dropouts`
  re-encodes the master at CRF 12 (was 16). `encode.test.mjs` pins `remotion.config.ts` to the constant.
- **Found on the way.** `repair-dropouts` had been re-encoding every repaired master at CRF 16 while
  Remotion renders at 18, so a `patch-scenes` splice put an 18-CRF stretch into a 16-CRF file: a patch
  slightly lower in quality than the cut around it. (Checked whether it could also break decoding — x264
  ties the PPS init QP to the CRF — and it does not: a stream-copy concat of a CRF 16 and a CRF 18 part
  decodes bit-exact, PSNR ∞, with the vendored ffmpeg.) `patch-scenes` now reads the base's CRF from its
  x264 SEI and renders the segment at it (config default when unreadable), so a patch is never a
  different quality from its master.
- **Cost.** $0; larger files and a slower composite (PNG capture). Measured on the 025 Short (PROGRESS).


## D-072 — No captions in the picture; subtitles ship as an .srt uploaded to YouTube (owner, 2026-10-17)
- **Context.** Every video so far burned animated captions into the bottom of the frame (`CaptionsTrack`).
  Owner, after approving the 025 Short: *"u nastavku želimo da izbacimo subtitles koje generišemo na dnu
  videa, već ćemo da pravimo samo subtitles.srt file koji ćemo da ubacimo u YouTube tokom publisha"* —
  the picture stays clean, and a viewer who wants subtitles turns them on.
- **Decision.** From the next video, no captions in the picture. Each cut ships an English
  `subtitles.srt`, which the owner uploads in Studio with the video (Subtitles → Upload file → With
  timing). It also replaces YouTube's auto-captions for search and accessibility.
- **In code.** `format.captions.burn_in` (default **false**; absent = true for legacy recipes) →
  `deriveRenderTimings` → `compileTimeline(…, { burnCaptions })` emits `burnCaptions:false` → `Main.tsx`
  skips `CaptionsTrack`. The cues are still built and kept in the props, because QA's paid-SaaS check
  reads them as the narration text. `pipeline/06-publish/build-srt.mjs <id>[/short]` writes
  `video/subtitles.srt` from `timeline.json` captions (the rendered clock, the same chunks the track
  drew), restoring casing and punctuation from the script sentences token by token (a sentence that
  does not line up falls back to the spoken words); a cue lasts until 0.4 s after its last word, never
  past the next one; > 42 characters wraps to two lines. `publish.json.subtitles` / `short.subtitles`
  name the files and `publish.md` turns them into an upload step.
- **Left as is, on purpose.** The bottom ~15% band stays clear of key content (MOTION_SPEC §0, frame-gate's
  `captionBandFrac`): YouTube's CC, player bar and the Shorts UI sit there.
- **025** was approved with captions in the picture, so its briefs pin `format_recipe.captions.burn_in:
  true` (a re-render keeps the approved look); it still gets both .srt files.

## D-073 — Growth quadrant 1: the analytics loop runs on the channel itself; every idea needs a real search; every video ships a Test & Compare (owner, 2026-10-17)
- **Context.** The growth-options doc (Claude Doc "The Automation Desk — opcije za rast i preporuke",
  2026-10-17) found the channel's limit is reach, not production: long videos have a median of 11 views,
  95% of views come from Shorts, and the system learned nothing from data — 0 of 68 ideas had metrics,
  no snapshot was ever taken, and only 4 of 17 ledger records had a `youtube_video_id`. Owner: *"Kreni da
  implementiraš prvi kvadrant"* — the "do now" quadrant: 1A analytics loop + CTR, 3A package
  (titles + thumbnails), 3B topics people search, 3E playlists as a test.
- **Decision 1 (1A).** The analytics loop reads the CHANNEL, not our files. The id only ever reached the
  ledger when it was typed into a publish.json, and the owner uploads by hand (D-055) and often renames
  at upload — so the loop never had anything to query. Now `fetch-analytics.mjs` lists every upload from
  the YouTube Data API into a channel catalog (`pipeline/state/youtube.json`), ties each to its content
  folder (auto only when the title is certain, else `--map`), binds the ledger once, takes the due
  snapshots (+7 d, then every 28 d), writes idea metrics and re-ranks. Weekly, via Windows Task
  Scheduler (durable; CronCreate expires after 7 days).
- **Decision 2 (1A, CTR).** Impressions + CTR come from the Reporting API report `channel_reach_basic_a1`
  (the Analytics API refuses `videoThumbnailImpressions` in every query shape — tested). Its reports
  expire, so every daily row is kept in the catalog. CTR is read as a percentage (the docs' wording; the
  APIs' other percentage metrics are 0–100) and converted in one place, with a warning if it looks 100×
  too small. The Reporting API must be enabled in the Cloud project (it was not, 2026-10-17).
- **Decision 3 (3B).** Every idea carries YouTube-autocomplete evidence that people type its
  `search_term` (`search-demand.mjs`, free endpoint, re-checked monthly). The seed gate refuses to
  script a brief whose phrase is unverified, unchecked or changed since the check; the owner can waive
  with a reason (breaking news; demand seen in Studio → Research). We do not auto-adopt autocomplete's
  alternatives — re-phrasing changes the topic, so it is a Gate-1 decision. First pass: 14 of 60 verified.
- **Decision 4 (3A).** Every package carries 2–3 genuinely different titles; `publish.md` lists the Test &
  Compare variants (titles + thumbnails), warns on a single title, and `build-metadata.mjs --ab-result`
  records the winner (`publish.json.ab_test`, the winner becomes `chosen_title`). Thumbnails stay the
  owner's step (prompts lead).
- **Decision 5 (3E).** All playlists stay; `pipeline/state/playlist-report.md` compares them weekly on the
  doc's four measures (impressions + CTR, retention, search + suggested views, subs per 1,000 views),
  long and Shorts apart. The test window opened 2026-10-17; review 2026-12-12 → 2026-12-26, only
  playlists with ≥ 3 videos.
- **Not done here, on purpose.** No change to `projectIdeas` (three produced ideas sit at `backlog` —
  flagged in ROADMAP); no re-wording of the 46 unverified phrases; no regeneration of existing
  `publish.md` files (025 gets its Test & Compare block when its package is next regenerated).

## D-074 — Growth quadrant 2: the 1440p upload file, Shorts cut from the long's own scenes, fixed publish days; produced ideas close themselves (owner, 2026-10-17)
- **Context.** After quadrant 1 (D-073) the owner said *"kreni da radiš ove stvari nadalje"*: 2B (1440p
  upscale), 1B/3C (Shorts from the long's scenes — the biggest lever, 95% of views come from Shorts;
  target 3 Shorts a week), 1C (a video assembled from 2–4 scene sets), 3D (fixed publish days), 3E
  (the niche decision, 2026-12-12 → 12-26) — plus three clean-ups: 013/017/023 (and 025) done but not
  marked so; the 46 search phrases nobody types; 020's Short not on the channel (*"loše urađen i
  konstruisan"* — delete it or make a new one on a similar, popular topic).
- **Decision 1 (2B).** The upload file is the approved 1080p master upscaled to 2560×1440 at the very
  end (`pipeline/04-render/finalize.mjs`, orchestrator node `finalize`): lanczos at `MASTER_CRF`, the
  source's pixel format and colour tags kept (Remotion masters are full-range `yuvj420p` — a range
  conversion would shift every black and gold), timebase kept, audio stream-copied, every frame + the
  played seconds + the timebase + the audio MD5 verified before anything is replaced. `video/` still holds
  ONE file (D-071); the 1080p master moves to `render/master.mp4` as the patch base. Long on, Short off
  (`config.render.upscale.short: null`) until the first long upload's codec check (Stats for nerds:
  `vp09` vs `avc1`) shows whether 1440p earns VP9. Measured: ~1.4× real time on the i5-12400F; a still
  from the upscale matches the master's colour and levels. Native 1440p (2C) stays deferred.
- **Decision 2 (1B).** A Short is a CUT of its long, not a second production. The script writer lists 2–3
  `short_cuts` (long scene ids; optional `opening` that replaces the first sentence one-for-one, because
  a verbatim cut inherits the long's back-references — "So…", "Then…", "in this video"; optional `hook`
  with its own portrait scene). `pipeline/01-script/make-shorts.mjs` turns each into the next free unit
  — `short`, `short-2`, `short-3` (one helper, `pipeline/shared/lib/units.mjs`, now answers "is this a
  Short, and whose" for every phase; a hand-built unit, i.e. one without `short_source.json`, is never
  overwritten). The narration is the long's, voiced again as the Short's own continuous track (PRD R11
  holds); the long's plan entries are reused (same HF scene, same props); the first scene is tagged
  `hook-card` for the opening gate (the 025 s1 convention); a `carry`/`match` survives only into the
  long's next scene. After alignment, `--marks` carries every word mark and SFX cue onto the Short's
  clock by a piecewise-linear word warp (the 024 re-voice method). **Portrait is the price of reuse:** a
  scene renders into a Short only with a portrait framing (`lib/portrait.mjs`; compile-hyperframes refuses
  otherwise, `props.portrait_ok` waives after a still is checked), so every new scene ships both framings
  (MOTION_SPEC §10). 022/023's scenes have them; 024/025's (`hf-world`, `hf-mech`) do not — their cuts
  need a portrait branch per reused scene, which is the "medium once" of the plan. *(D-075: the two 023
  cuts were rejected — a branch is not a checked framing; 022–025 are not cut at all.)*
- **Decision 3 (3D).** Long every second Tuesday (anchor 2026-10-27), Shorts Monday, Wednesday, Friday
  (`config.schedule`). `pipeline/06-publish/schedule.mjs --assign` writes `scheduled_for` on the long and
  each Short (Shorts after their long, so the related-video link points at a public video); a slot is
  taken by any catalog upload on its publish day — a scheduled private upload on YouTube's
  `status.publishAt` day, now kept in the catalog as `scheduled_for` — or by a date promised in another
  publish.json. The owner still uploads and schedules by hand (D-055).
- **Decision 4 (clean-ups).** (a) `projectIdeas` promotes `backlog → produced` too; only an idea marked
  `recurring: true` (a series format — `everyone-asks-ai-series`) stays in the backlog. 013, 017, 023
  became produced; 019, 024 and 025 got the idea records their ledger entries pointed at
  (`desk-lessons-llm-next-word`, `desk-lessons-frozen-weights`, `agent-stop-line`). (b) An approved video
  that will never ship is RETIRED (`reconcile <key> --retire --reason`): its record moves to
  `videos.json.retired`, its publish.json is never ingested again, its subject is freed. 020's Short is
  retired; its folder stays on disk until the owner confirms the delete (git-ignored, so irreversible —
  confirmed and deleted 2026-10-18, D-075).
  Its topic is reborn as `clean-imported-data-excel` on the phrase "how to clean data in excel"
  (autocomplete offers 10 continuations), keeping 020's one good idea (flag, don't guess). (c) The owner
  delegated the re-wording: 42 of the 46 unverified phrases now have a verified phrase on the same topic;
  2 ideas with no search of the right intent are `parked` with a `parked_reason`
  (`waitlist-automation`, `pharmacy-refill-reminders`); 013/017's two were produced.
- **Also.** edge-tts 7.2.8 started failing with HTTP 403 (Microsoft's `Sec-MS-GEC` token); upgraded the
  venv to 7.3.1, which voices again (revert: `pip install edge-tts==7.2.8`).
- **Not done here.** 1C is a production decision for the next video (2–4 scene sets joined by
  transitions — the 025-benchmark memory). 3E waits for its window (2026-12-12 → 12-26). 005 and 016
  have sat at Gate ② (`in-progress`) since June/July and block pick-next — the owner's call (D-075:
  parked, kept).

## D-075 — No Shorts cut from 022–025; a portrait framing counts only once its tall frame was looked at (owner, 2026-10-18)
- **Context.** The first two Shorts cut by D-074's 1B — 023's "3 Rules to Make an AI Actually Focus"
  (s21–s24) and "Pasting More Into an AI Costs You Twice" (s16–s19) — passed check.mjs, the frame gate and
  a second-pass review, and the owner deleted both as catastrophic: *"dosta stvari se preklapa vizuelno
  jedno sa drugim i nije jasno šta se radi dok su takođe i kontrasti loši"*. No scene was new: every
  reused scene's `.portrait` branch was written with the 023 library (2026-08-23) and had never been
  rendered tall or looked at; `portraitReady` counted any branch as ready, and the frame gate measures
  neither overlap nor contrast. D-054's "overlap checks … for landscape AND portrait" was prose only.
- **Decision 1.** Shorts are cut from the long only from the next video on; 022–025 are skipped (their
  visuals sit below the 025 floor — visually, not semantically). 023's `short_cuts`, its `extra_shorts`
  and their publish days were removed; the `at3d-pairs` portrait camera change made for the cut was
  reverted. The proposed "two Shorts from 022 + portrait branches for 024/025" is dropped.
- **Decision 2.** A landscape scene's portrait branch makes it RENDERABLE tall, not ready. Each reused
  landscape scene in a derived Short (a unit with `short_source.json`) needs `props.portrait_ok: true`,
  given only after its tall frame was looked at at phone size for **overlap** (nothing over anything —
  MOTION_SPEC §13), **contrast** (subject and every word read against the background) and **fill** (the
  subject uses the frame, not its top half — §10). `05-qa/check.mjs` fails such a Short HARD
  (`portrait_signoff`); `make-shorts.mjs` lists unsigned scenes in its report; the sign-off rides outside
  the render variables (`job.portraitOk`), so giving it never re-renders the clip it was judged on, and a
  re-derive of the same cut keeps it. Native-portrait scenes are exempt (composed for 9:16 and checked
  with their own video). The same look belongs at authoring time, when the branch is written.
- **Decision 3 (owner's calls on D-074's open items).** `content/020-everyone-asks-clean-data/` deleted
  (its Short stays a tombstone in `videos.json.retired`). 005 and 016 are kept to finish some day but
  `parked` (with a `parked_reason`) so they no longer block pick-next; resume = status back to
  `in-progress`.
- **Open.** An automatic overlap/contrast measure for the frame gate; today the sign-off rests on
  looking. Lesson: `knowledge/desk-knowledge/lessons/2026-10-18-a-portrait-branch-written-blind-is-not-a-portrait.md`.
