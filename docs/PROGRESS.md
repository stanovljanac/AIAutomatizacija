# PROGRESS LOG

Project-level log of what was done and what's next. **Newest entries on top.** Keep entries
short and factual. Per-video history goes in each video's `content/<id>/log.md`.

The long per-wave build history (Waves 0–5 + Wave V step logs) was trimmed once the work shipped —
the **decisions** live in `docs/DECISIONS.md`, the **implementation methods** in `docs/ARCHITECTURE.md`
(§6 sync, §9 engine, §12 autonomy/freshness/swappability), and the full step-by-step history is
recoverable from git.

Format:
```
## YYYY-MM-DD — <short title>
- who: human | agent
- did: …
- next: …
- blockers: … (optional)
```

---

## Where the system stands (2026-06-12)

**The hands-off studio is built and wired end-to-end** (`npm test` = 456 green). The pipeline runs
`00-ideas → 01-script → 02-voice → 03-visuals → 04-render → 05-qa → 06-publish`, idempotent and
resumable, one folder per video.

Shipped (all built behind ports, different-model verified):
- **v1 (Waves 0–2) + orchestrator** — resumable DAG, multi-model review loop (Sonnet sub-agent +
  Gemini, loop to ≥9, fails-closed), publish path (auto-metadata, make-short, −16 LUFS, OAuth +
  private YouTube upload).
- **Wave V** — modular FORMAT recipe (`formats/default.json`), real motion vocabulary, strong-hook
  enforcement, deterministic QA gate, the engine-agnostic `timeline.json` seam, and the
  Remotion + HyperFrames **combo** (1–3 hero scenes/video).
- **Waves 3–5** — anti-stale facts cache + multi-source news watch; `TtsProvider` + `Distributor`
  seams; the analytics → re-rank growth loop; the autonomous driver (`pick-next` → `auto-run` →
  classify) with gate-aware owner notifications; **YouTube OAuth live** (Production app, non-expiring
  token) and a **weekly CronCreate** autonomous run. Methods: `docs/ARCHITECTURE.md` §12.

**Owner does only:** the script gate, the final-video gate, and the thumbnail pick. The system
auto-drafts to YouTube **private** and pings the owner at the gates.

**Open follow-ups** (none block the first hands-off video) are tracked in `docs/ROADMAP.md`:
hero recolor (brand black/yellow), live Postiz (T5.3), thumbnail auto-scoring (T5.4), official-source
RSS endpoints, and re-registering the weekly run (session-local, expires after 7 days).

**Next:** produce the first full video — `005-bulk-personalized-emails` is scaffolded and scripted,
parked at the review hand-off (it will pause for the owner to record the Gmail screen capture).

<!-- New per-session entries below this line, newest on top. -->

## 2026-06-13 — FIRST VIDEO SHIPPED (006 uploaded as private draft)
- who: agent
- did: Took 006 through finalization. Swapped the voice to the **Azure final** (licensed Andrew) on
  long + Short, re-aligned + re-rendered (same approved visuals), QA 5/5. Generated the publish package
  (owner-edited 3–4 sentence long description + Short cross-post caption, 15 chapters, pinned validator
  prompt, `medium.md` 633-word AI-citation post). Thumbnail = the Sarah-scene still (owner's pick over the
  AI images, which had gibberish text + a watermark). **Uploaded both as PRIVATE drafts** via the
  YouTubePublisher port (OAuth live) — long + Short, with the long URL auto-filled into the Short caption.
- next: owner clicks Publish (after setting "Altered content = Yes" + pinning the comment in Studio).
  The end-to-end hands-off pipeline is proven on a real upload. Next idea: "gate a form" (006's CTA).
- note: this completes the **"first full video"** open item from the build-status memory.

## 2026-06-13 — Visual upgrade wave (owner feedback on 006) + re-render
- who: agent
- did: Acted on the owner's review of 006. Shipped, behind the build-sprint cycle (457 tests green;
  **different-model verify = Sonnet, verdict PASS, no blocking bugs**):
  1. **`hook-prism` re-skin** — removed the prism/glass shards (Three.js), kept the aurora plasma +
     particle tunnel, recolored to brand **black+gold** (`#ffb020`). Now the go-to bold opener.
  2. **`bad-row-gate`** — a NEW cinematic HyperFrames scene (GSAP): one bad row (Sarah, `31/02/2026`)
     slides to the gate, is rejected with an "Invalid date" stamp, drops into quarantine while the clean
     table stays pristine. The owner-requested concrete mini-example.
  3. **Cinematic intro/outro** — `Intro`/`Outro` rebuilt with the gold desk mark over a gold
     `BrandBackdrop` aurora (deterministic drifting blobs/particles). Black+gold; gold-mark baked in.
  4. **`CodeBlock` fix** — line-number gutter no longer shrinks on long lines (`flex:0 0 36px`); added
     `showLineNumbers`/`fontSize` props (Short drops numbers, per owner rule "no line numbers when code
     wraps").
  5. **`timeline.mjs`** — `revealOn:"sentences"` now generates per-sentence reveals for list-less scenes
     (so the HF Sarah scene syncs its 5 motion beats to its 5 narration sentences) + a regression test.
  Then re-wired 006 (s01→`hook-prism`; inserted `s07b` Sarah between s07/s08), re-voiced + re-aligned
  (75 sentences, 313s), re-rendered long (5:13, 52 MB) + Short (47.7s), QA 5/5 both, perceptual frames
  verified (gold intro, gold aurora hook, Sarah scene, aligned code-block, gold outro).
- next: owner **GATE ③** on the re-rendered `content/006-validated-cleanup-system/video/final.mp4`.
- docs: `style/VISUAL_IDENTITY.md` §7 (palette split + gold mark baked), `docs/ROADMAP.md` (hero-recolor
  marked DONE), `.claude/skills/storyboard/SKILL.md` (hero list updated).

## 2026-06-13 — First full autonomous video produced end-to-end (006)
- who: agent
- did: Ran the whole new pipeline on `006-validated-cleanup-system` (Diagram / "Desk Loops",
  the sequel 004 teased). Picked the top *producible-hands-off* idea (score 84; the literal
  top, 005 bulk-emails @88, is a mini-demo blocked on an owner screen-capture). Script (21
  scenes) → fact-check (1-10-100 rule verified, Labovitz & Chang 1992, on-screen source) →
  **independent multi-model review loop** (Gemini live + Sonnet subagent, 3 iterations →
  Gemini 9.65 / Sonnet 9.00, band "soft", gates ✓) → Andrew voice (edge-tts) + faster-whisper
  align (290s, 70/70) → storyboard (combo engine, HyperFrames `hook-kinetic` hero) →
  hand-authored 50s Short → combo render (long 4:54 1080p, short 47.7s 9:16) → QA gate 5/5 on
  both + perceptual frame review. 2 thumbnail prompts written (owner generates).
- next: **owner GATE ③** — watch `content/006-validated-cleanup-system/video/final.mp4`,
  approve, pick a thumbnail. Then publish (not done — never upload/commit without the owner).
- blockers: none. (Combo engine, multi-model review, voice/align, render, QA all worked first
  full run.)
