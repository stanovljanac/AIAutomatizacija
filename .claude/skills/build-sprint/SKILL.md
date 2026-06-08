---
name: build-sprint
description: Use at the START of and THROUGHOUT any CODE implementation for this repo — building a feature, fixing a bug, refactoring, wiring a pipeline phase, or any change to code under pipeline/, scripts/, templates/, or .claude/. Enforces the build-sprint cycle so quality steps are never skipped: atomize → build → self-test → verify with a DIFFERENT model → fix → update docs → commit only when the owner asks. Do NOT use for planning, research, Q&A, or pure prose/doc edits (those skip the cycle). Triggers on "implement", "build", "fix", "add the X module/phase", "wire up", or continuing a build wave.
---

# Skill: Build Sprint (the engineering cycle — never skipped)

Every code change to this repo runs this loop. It is the dev-side analog of the
video review loop: write → verify with another model → fix → green. It exists because
the destination is **unattended autonomy** — no human will catch a red test at 2am.

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
3. **SELF-TEST.** Write or extend tests next to the code (`*.test.mjs`, `node --test`). Validate
   every JSON artifact against its schema. `npm test` must be green before moving on.
4. **VERIFY WITH A DIFFERENT MODEL (mandatory).** Per cohesive unit or wave (not every keystroke),
   spawn an independent verifier sub-agent — **Sonnet 4.6** (`claude-sonnet-4-6`) by default,
   **Haiku 4.5** (`claude-haiku-4-5-20251001`) for trivial typo/rename changes. It must: run
   the suite, scrutinize the logic for bugs/edge-cases, **add regression tests** for any gap,
   and report PASS/FAIL + concrete bugs (`file:line`). Append its verdict to `docs/BUILD_LOG.md`.
   (Wave 0 proved the value: the Sonnet verifier caught a hard-gate scoring bug.)
5. **FIX.** Apply the verifier's findings; re-run until tests are green **and** the verifier signs off.
6. **DOCUMENT.** Update the docs the change touched so they are never stale — `docs/PROGRESS.md`
   (log), `docs/DECISIONS.md` (if a decision was made), `docs/ROADMAP.md` (status), the relevant
   skill/`style/` file. Stale docs are a defect.
7. **COMMIT — only when the owner explicitly says so.** Finishing a task or a "continue" is **not**
   commit permission (see [[commit-workflow]]). Leave changes in the working tree; offer push separately.

## Enforcement (why this can't be quietly skipped)

| Step | Enforced by |
|---|---|
| Tests green before "done" | **Stop hook** `.claude/hooks/test-gate.mjs` — mechanical; blocks finishing on red (fail-open; `[skip-tests]` escape). |
| Different-model verification, docs, commit-discipline | **Policy** — this skill + `CLAUDE.md` operating principles + the `build-sprint-cycle` memory (loaded every session). |

A hook cannot spawn a model, so step 4 lives as strong policy — but it is **not optional**.
If you changed code and did not run an independent verifier for the unit, the sprint is incomplete.

## Definition of Done (a unit/wave is done when ALL hold)
- [ ] `npm test` green; every new artifact schema-validates.
- [ ] An independent **different-model** verifier ran, its bugs are fixed, and its verdict is in `docs/BUILD_LOG.md`.
- [ ] Affected docs updated.
- [ ] Changes left in the working tree (commit only on explicit owner request).
