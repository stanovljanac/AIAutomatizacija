# Progress Tracker — "The AI Agent" series launch + channel map + idea-guard

**Plan source:** `C:\Users\Mihailo\.claude\plans\partitioned-twirling-coral.md`
**Decision:** [D-059](../../DECISIONS.md) · **Started:** 2026-07-15 · **Owner:** stanovljanac

> Living tracker. Update the status boxes as phases complete. Delivery order:
> **Phase 0 + 1 → owner validates → Phase 2 → Phase 3 + 4 → Phase 5.**

| Phase | What | Status |
| --- | --- | --- |
| 0 | Decision lock (D-059) | ✅ **DONE** |
| 1 | Build 017 Short → Gate 2 | ✅ **DONE — owner approved 2026-07-15** |
| 2 | Rework 016 long → Gate 2 | ✅ **DONE — owner approved 2026-07-15** |
| 3 | Channel Map doc | ✅ **DONE** |
| 4 | Minimal idea guard (stops the next 015) | ✅ **DONE** |
| 5 | Cleanup (tests, docs, skills, KOS lesson) | ✅ **DONE** |

> **Code/docs implementation of the plan (Phases 3–5) shipped 2026-07-15** (594 tests green).
> Remaining is **content production**, not plan code: 017 & 016 → voice → storyboard → render → QA →
> Gate ③. 016's render is blocked on the owner's real n8n-canvas screenshot for s3.

---

## ✅ Phase 0 — Decision lock (no code)
- [x] `docs/DECISIONS.md` → **D-059**: retire 015; 017 = "The AI Agent" Ep.1 (change-detection/policy);
      subject map (Attention / Change Detection / Failure Detection / Execution); identity
      "AI doesn't replace judgment. It removes the things that steal it."; 016 = human-approval/
      failure-handling installment.
- **DONE:** decision entry exists. ✔

## ✅ Phase 1 — Build 017 (creative; no pipeline code)
- [x] **1.1** Scored idea `agent-fine-print-watch` in `pipeline/00-ideas/ideas.json`
      (`value_score 9 / qualify`, `subject: change-detection/policy`).
- [x] **1.2** `content/017-fine-print-watch/brief.json` — problem-first hook; agent-vs-scraper lesson;
      human-approval posture; real-world change-detection research; tool modular.
- [x] **1.3** `content/017-fine-print-watch/short/script.json` — 5 bespoke scenes, ~55s; DECISION-CARD
      money shot (refund 30→14, Impact HIGH, −53%); s4 kept-judgment; s5 close + closing_question + bridge to 016.
- [x] **1.4** Validated (schema PASS) + `script.review.json` **PASS 9/qualify**; picker tests green.
- [x] **Owner round 1 (2026-07-15):** s2 number reframed to a scenario ("Imagine forty pings…", not a
      measured result); s5 de-cluttered (dropped "I automate the boring stuff in public"; examples voice-only).
- **DONE criteria:** review passes → **STOP at Gate ② (owner reads).** No voice/render before approval. ✔
- **✅ Owner approved 2026-07-15** → unblocked Phase 2.

## ✅ Phase 2 — Rework 016 (creative; no idea-system code)
- [x] **2.1** Removed the 015 dependency in `brief.angle` + rewrote old s2 (bridge now originates from 017;
      no 015 reference remains anywhere in brief/script).
- [x] **2.2** Restructured: open on **failure** (naive inbox automation deletes the email that mattered, silently)
      → why plain automation fails (s2) → how the agent thinks (s3 reframe + real-canvas proof; s4 one reasoning
      beat) → safe design/dry-run (s5). The node-by-node middle collapsed **5 scenes → 2**; 13 scenes → **10**.
- [x] **2.3** Foregrounded human-approval / failure-handling / guardrails (s6 fragile classifier · s7 auto-trash
      line-you-don't-cross + explicit human gate · s8 two guardrail catches); kept copy-paste template CTA (s9) +
      on-screen sources (4876 / 14852, CE-is-free); tagged `subject: "attention/inbox"`; moved to `series: "The AI Agent"`
      with the shared series signature in the outro (s10).
- **Touched:** `content/016-n8n-inbox-triage/{brief.json, script.json, script.review.json}` only. Validator PASS + review PASS.
- [x] **Owner notes round 1 (2026-07-15):** (a) s4/s5 were still tutorial-ish → reframed as a universal
      safe-agent pipeline **Input → Context → Decision → Output**, punch = what's MISSING ("no delete node,
      no reply node, no irreversible action"; s5 lands "it set you up to act"). (b) s7 attacked a specific
      public template → now **attacks the evergreen PATTERN** (wiring an AI guess to an irreversible action);
      14852 shown only as one "seen in the wild" example (public templates change). brief.angle aligned.
- **✅ Owner approved the reworked 016 script 2026-07-15** (series move Desk Loops → "The AI Agent" kept).
- **⏭ NEXT ACTION (content, separate from plan code):** 016 → voice → storyboard (grab the real n8n canvas
  for s3; keep 14852 chip on s7) → render → QA → Gate ③. **Blocked** on the owner's real n8n-canvas
  screenshot for s3. 017 (also approved) is fully unblocked and can be produced first.

## ✅ Phase 3 — Channel Map (no code)
- [x] `docs/CHANNEL_MAP.md` — the taxonomy (root *AI Decision Automation*; 4 branches) with videos
      slotted (011 & 016 → attention/inbox, 017 → change-detection/policy, 015 struck through as retired).
- [x] Cross-linked from `style/CHANNEL.md` §3 (subject axis vs the lane/format axis).

## ✅ Phase 4 — Minimal idea guard (smallest thing that stops the next 015)
- [x] **4.1** Optional `subject` (+ `series`) string in `pipeline/shared/schemas/ideas.schema.json`.
- [x] **4.2** `pipeline/00-ideas/produced_subjects.json` (machine mirror of the channel map).
- [x] **4.3** Subject-collision **warning** in `pick-next.mjs` (`subjectCollision`, surfaced in
      `--dry-run` **and** the real pick; no auto-reject). Verified against the real registry.
- [x] **4.4** Seed-gate `pipeline/00-ideas/seed-gate.mjs` (`seedGate` + CLI): a brief can't be
      scripted without an idea-pass `value_band` (and not `rejected`); wired as script-writing **Step 0.0**.
      Retired 015: `everyone-asks-ai-series` reverted to backlog + inbox seed dropped; `content/015-*`
      `brief.json` → `status: rejected` (+ retired_note/subject); folder kept on disk.
- **DONE:** guards live; `brief.schema` gained `rejected`; 8 new unit tests; `npm test` green (594).

## ✅ Phase 5 — Cleanup
- [x] Tests hardening (subjectCollision null-safety + seedGate reject/absent/retired paths).
- [x] Docs cross-links (CHANNEL.md §3 ↔ CHANNEL_MAP.md ↔ schemas/registry/guards).
- [x] `script-writing` skill Step 0.0 seed-gate STOP + subject check. (novi-video unchanged — it
      scaffolds, doesn't script; the gate lives at the script step.)
- [x] `knowledge-lint --fix` clean; KOS lesson `2026-07-15-subject-map-stops-near-duplicates`.

---

## Spin-off (SEPARATE initiative — do NOT bundle here)
Content idea born from this process: **"Your AI Agent Doesn't Need More Context. It Needs Smaller Tasks."**
→ graduates to its own idea entry (`subject: execution/agent-design`) + its own plan when we reach it.

## Open decisions (defaults; adjust at approval)
- **017 bridge target:** 016 (shared "automate the deciding" framework).
- **Tagline:** "AI doesn't replace judgment. It removes the things that steal it." (shown once in 017 s5 as the series signature).
- **Series lane:** "The AI Agent" isn't in the lane enum yet — 017 rides `lane: desk-notes` + `series: "The AI Agent"`.
  A real lane value is a small schema add if wanted (fits Phase 4).
