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
