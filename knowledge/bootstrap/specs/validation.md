# KOS Validation — the `knowledge-lint` spec

> Read when running or implementing the validator, or interpreting its output. This
> spec ships with the standard; implementations may vary (the reference implementation
> in this repo is `scripts/knowledge-lint.mjs`). Custom logic exists only for
> graph/size/role rules — frontmatter validation should reuse an off-the-shelf JSON
> Schema validator.

## Scope and file roles

The validator scans **one instance folder** recursively for `.md` files:

| Role | Files | Gets |
|------|-------|------|
| **index** | any `index.md` | size cap 200; link checks |
| **infrastructure** | `PROJECT.md` (instance root) | leaf size caps; link checks |
| **note** | every other `.md` | all checks |

Notes live exactly one level deep (`<category>/<note>.md`); a note at the instance
root or nested deeper is a check-6 error. The `bootstrap/` standard is not scanned.

## The checks (**error** unless marked warning)

| # | Check | Detail |
|---|-------|--------|
| 1 | Frontmatter present + schema-valid | notes only; schema in `metadata.md` §2 (type/status enums, ISO dates, arrays of paths). Conditionals: `status: deprecated` ⇒ `superseded_by` required; `superseded_by` present ⇒ status must be `deprecated` |
| 2 | Purpose header present | notes only; the three `**Purpose:**` / `**When to read:**` / `**Do not duplicate:**` lines |
| 3 | Links resolve; no wikilinks | all files; body links + `related`/`depends_on`/`superseded_by` paths, resolved relative to the file (anchors stripped); `[[wikilink]]` anywhere = error. Code blocks are ignored |
| 4 | Size caps by role | index > 200 lines = error; note/infrastructure > 650 = error, 500–650 = **warning** |
| 5 | Orphans & thin linking | note unreachable by following authored links from the global `index.md` = error; note with < 2 authored outbound links = **warning** |
| 6 | Category integrity | category folder ⇒ has `index.md`; every note is inside a category and linked from its category index |
| 7 | Deprecated placement | `status: deprecated` outside `archive/` = **warning** (move pending) |
| 8 | Stale draft | `status: draft` with `updated:` older than 90 days = **warning** |
| 9 | Evidence for canon | `status: canonical` on a `pattern` or `decision` must link (frontmatter or body) ≥ 1 note under `lessons/`, `experiments/`, or `research/`. `concept`/`glossary` exempt |

"Authored" links = frontmatter edges + body links **above** the `## Backlinks` footer;
generated backlinks never count as authored edges (check 5) and are not traversed for
reachability.

## `--fix` mode (regenerates the mechanical parts, nothing else)

1. **Backlinks footers** — for every note: replace everything from the `## Backlinks`
   heading to EOF (or append the section) with the AUTO-GENERATED comment plus one
   `- [Title](relative/path.md)` line per note that links to this one (authored edges,
   notes only, sorted; `- _none yet_` when empty). The footer is always the last
   section of a note.
2. **Category index listings** — in each category `index.md`: replace the block between
   `<!-- AUTO-INDEX:BEGIN -->` and `<!-- AUTO-INDEX:END -->` (or append the block) with
   one line per note in the folder, sorted by filename:
   `- [Title](note.md) — <type>, <status>`.
   Prose around the block is human/agent-written and untouched. The global `index.md`
   is hand-written (it's small and carries judgment).

`--fix` never edits frontmatter, bodies above the footer, or `updated:` dates.

## CLI contract

```
node scripts/knowledge-lint.mjs [instanceDir] [--fix]
```

- `instanceDir` defaults to the project's instance (local wiring; here
  `knowledge/desk-knowledge`).
- Output: one line per finding (`ERROR <file> :: <message>` / `WARN <file> :: <message>`)
  plus a summary line.
- **Exit codes:** `0` = clean or warnings only · `1` = one or more errors · `2` = usage
  or I/O failure (instance dir missing, unreadable file).

## Wiring (per-project local rule)

Start **manual**: the agent runs the validator after every write to the instance
(hard rule 3). Once the instance is stable, promote to a hook or CI gate — the same
maturation path as any KOS knowledge (`lifecycle.md` §4: check first, then automation).
Record the chosen wiring in `PROJECT.md` local rules.

## Interpreting findings

- **Errors block**: fix before finishing the task. Never weaken the note to silence the
  finding (`maintenance.md` §6) — fix the cause (restore the target, add the missing
  index line, split the file at a semantic boundary…).
- **Warnings get judgment**: a fresh lesson with one link is fine; a 640-line file one
  cluster wide is fine (record rare owner-approved exceptions in `PROJECT.md`). Process
  warnings on the periodic sweep (`maintenance.md` §5).
