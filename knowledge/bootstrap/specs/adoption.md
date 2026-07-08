# KOS Adoption — installing KOS on a project

> Read when setting up KOS on any project — greenfield or brownfield (knowledge
> scattered across docs, comments, and history). The algorithm is **read-only until the
> human gate**; nothing pre-existing is created-over, moved, or modified before Phase C
> approval.

## Doctrine: map in place, never migrate what works

On a real project, canonical knowledge already lives somewhere — an ADR log, a style
canon, a fact store, README trees, skills. Adoption **maps** those in place
(`PROJECT.md` canonical map) and instantiates KOS only for the **gaps**. Migration of
living, owned documents is a fork-and-rot machine: the copy diverges from the original
and readers can't tell which is true. Migration is reserved for content that is dead or
homeless — and even then, only in a later, separately-approved pass.

## Phase A — Inventory scan (read-only)

Walk the repo and find where knowledge already lives. Look for:

- decision records: `DECISIONS.md`, `docs/adr/`, RFC folders
- style/convention canons: style guides, visual identities, contribution guides
- fact stores: config-as-truth files, data files with refresh tooling
- doc trees: `README*`, `docs/`, wikis checked into the repo
- procedures: `.claude/skills/`, runbooks, `Makefile`/script headers with prose
- long-lived knowledge in comments (module-header essays, "why" blocks)
- journals: progress logs, changelogs with reasoning

For each hit record: path · what it holds · apparent owner/liveness (commit recency) ·
KOS type it corresponds to · apparent status (`draft`/`stable`/`canonical`).

## Phase B — Mapping report (read-only artifact)

One document (scratch or `knowledge/` root — not inside the instance yet) proposing,
for **every** Phase A hit, one of four fates:

| Fate | Meaning | Default for |
|------|---------|-------------|
| **canonical-in-place** | KOS points at it; file stays untouched | anything alive and owned |
| **gap** | KOS instance will house it | knowledge with no home (lessons, research, glossary…) |
| **duplicate/conflict** | two+ sources disagree | list them, propose a winner; resolution = supersede, not delete |
| **candidate for later migration** | dead or homeless content | never migrated in this pass |

The report ends with the proposed `PROJECT.md` skeleton: canonical map, knowledge
sources, instance name, local rules.

## Phase C — HUMAN GATE (non-negotiable)

The owner approves or edits the mapping report. Their mental model of the project
outranks the scan. Nothing pre-existing may be created-over, moved, or modified before
this approval — and projects with their own golden rules (e.g. "never overwrite without
asking") make this gate doubly binding.

Gate script (what to put in front of the owner):

1. The mapping table (A→B fates), highlighting anything proposed as duplicate/conflict.
2. The proposed gaps — which categories will be created, and the first real notes that
   will seed them.
3. The 2–3 pointer lines that will be added to the host CLAUDE.md/AGENTS.md (Phase E).
4. Explicit question: "approve as-is, or edit?"

An owner instruction to "implement KOS per the approved plan" — where that plan already
contains the mapping — satisfies this gate; re-asking is ceremony.

## Phase D — Instantiate

Only after Phase C:

1. Create the instance folder (name per profile) + global `index.md` + `PROJECT.md`
   carrying the **approved** canonical map, knowledge sources, and local rules.
2. Create category folders **only for approved gaps**, each with its `index.md`,
   **seeded with real initial notes** — never empty scaffolding (`philosophy.md` §3).
   Good first seeds: lessons already sitting in the journal or the agent's memory.
3. Every seed note passes `metadata.md` (frontmatter + Purpose header + evidence where
   the type demands it) and is listed in its category index.

## Phase E — Install the loop

1. Add the validator (`validation.md`) and run it until the instance is clean.
2. Add 2–3 pointer lines to the host project's CLAUDE.md/AGENTS.md, e.g.:

   > Project knowledge lives in `knowledge/<instance>/` — read `index.md` first; follow
   > `knowledge/bootstrap/SYSTEM.md` when writing to it.

3. Adopt the maintenance cadence (`maintenance.md`): after each work session that
   produced knowledge, plus the periodic sweep.
4. Validator wiring is per-project (local rule): start **manual**, promote to a
   hook/CI gate once the instance is stable.

## Conflicts discovered later

Adoption is not the last word. When work reveals a duplicate or conflict that Phase B
missed: resolve by **supersede + archive** (`lifecycle.md` §3) toward the canonical
source, with the owner's approval if any pre-existing file must change. Never delete;
never silently pick a winner.
