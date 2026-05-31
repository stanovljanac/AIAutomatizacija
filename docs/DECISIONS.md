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

<!-- Add D-010, D-011, … as new decisions arise. Supersede, don't delete. -->
