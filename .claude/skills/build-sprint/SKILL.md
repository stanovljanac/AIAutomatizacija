---
name: build-sprint
description: Use at the START of and THROUGHOUT any CODE implementation for this repo — building a feature, fixing a bug, refactoring, wiring a pipeline phase, or any change to code under pipeline/, scripts/, templates/, or .claude/. Enforces the build-sprint cycle so quality steps are never skipped: atomize → build → self-test → fix → update docs → commit only when the owner asks. Do NOT use for planning, research, Q&A, or pure prose/doc edits (those skip the cycle). Triggers on "implement", "build", "fix", "add the X module/phase", "wire up", or continuing a build wave.
---

# Skill: Build Sprint (the engineering cycle — never skipped)

Every code change to this repo runs this loop: write → self-test → fix → green. It exists
because the destination is **unattended autonomy** — no human will catch a red test at 2am.

> **No second-model verification.** The owner does the substantive review and knows best what
> they want, so the cycle does **not** spawn another model to check the work (owner decision,
> 2026-06-29). Quality rests on thorough self-testing + green tests + the owner's review.

> **Scope.** Applies to code (`pipeline/`, `scripts/`, `templates/`, `.claude/`). **Skip**
> for planning, research, Q&A, and pure documentation/prose edits. The Stop **test-gate
> hook** (`.claude/hooks/test-gate.mjs`) already no-ops in plan mode and when no code changed.

## The cycle

1. **FRAME.** Break the work into the smallest sensible tasks, each with an explicit
   acceptance criterion and its dependencies (mark what can run in parallel vs what needs a
   prior result). Track them with TodoWrite. Atomize the current wave now; later waves just-in-time.
2. **BUILD.** Implement one task at a time. **Reuse** existing seams instead of new code:
   `pipeline/shared/lib/validate-lib.mjs`, `pipeline/shared/testkit/`, the Runner port
   (`orchestrator/runner.mjs`), the Reviewer port (`review/`), `validate.js`. Honor the
   pipeline contract (read/write only `content/<id>/`, idempotent, resumable, schema-validated)
   and the style/visual rules.
3. **SELF-TEST.** Write or extend tests next to the code (`*.test.mjs`, `node --test`), covering
   the happy path **and** the edge-cases you can think of. Validate every JSON artifact against its
   schema. Where it's cheap, verify the change behaves (run it, render a preview still, etc.).
   `npm test` must be green before moving on.
4. **FIX.** Apply anything the self-test surfaced; re-run until tests are green.
5. **DOCUMENT.** Update the docs the change touched so they are never stale — `docs/PROGRESS.md`
   (log), `docs/DECISIONS.md` (if a decision was made), `docs/ROADMAP.md` (status), the relevant
   skill/`style/` file. Stale docs are a defect.
6. **COMMIT — only when the owner explicitly says so.** Finishing a task or a "continue" is **not**
   commit permission (see [[commit-workflow]]). Leave changes in the working tree; offer push separately.

## Enforcement (why this can't be quietly skipped)

| Step | Enforced by |
|---|---|
| Tests green before "done" | **Stop hook** `.claude/hooks/test-gate.mjs` — mechanical; blocks finishing on red (fail-open; `[skip-tests]` escape). |
| Docs, commit-discipline | **Policy** — this skill + `CLAUDE.md` operating principles + the `build-sprint-cycle` memory (loaded every session). |

## Definition of Done (a unit/wave is done when ALL hold)
- [ ] `npm test` green; every new artifact schema-validates.
- [ ] Affected docs updated.
- [ ] Changes left in the working tree (commit only on explicit owner request).
