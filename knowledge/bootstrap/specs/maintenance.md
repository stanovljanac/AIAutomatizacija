# KOS Maintenance — upkeep, compression, audits, cadence

> Read for routine care of an instance: when to edit vs split vs create, how to
> compress, which audits are yours (not the validator's), and how often.

## 1. The update algorithm (on new knowledge)

```
new knowledge arrives
├─ a canonical source (PROJECT.md map) owns the topic → update/point there, not KOS
├─ an existing note owns the topic ("Do not duplicate" header)
│    ├─ refines/extends it            → EDIT that note (update `updated:`)
│    ├─ contradicts it                → resolve: correct in place (typo-class) or
│    │                                   supersede (claim-class, lifecycle.md §3)
│    └─ pushes it past sizing limits  → SPLIT (sizing-and-splitting.md)
└─ no owner → NEW note (metadata.md), placed per architecture.md §2,
              linked per linking.md, listed in its category index
```

After any of these: run `knowledge-lint` (with `--fix` to regenerate backlinks and
index listings). Errors block; warnings get judgment.

## 2. Compression procedure (with provenance)

When accumulated notes turn out to be one better rule (5 scattered rules → 1):

1. Write the compressed form in the canonical location (usually a `pattern`).
2. The new file's body **cites what it compressed** (links to the originals).
3. Move the superseded originals to `archive/` — keep their frontmatter, set
   `status: deprecated`, add `superseded_by:` (lifecycle.md §3).
4. Re-point inbound links at the new file; `knowledge-lint` reports any missed.
5. **Bounded passes:** compress primary sources once; never re-compress a compressed
   file — revisit the archived originals instead (philosophy.md §2).

## 3. Refactoring behavior rules

When reorganizing existing notes (renames, moves, merges, splits):

- **Deduplicate toward the better formulation** — merge the weaker note into the
  stronger, supersede the husk; never keep two files on one topic.
- **Normalize names**: file names are kebab-case, descriptive, and match the H1; a
  rename re-points all inbound links in the same pass.
- **Never oversimplify**: compression removes redundancy, not nuance. If evidence,
  caveats, or numbers would be lost, they move with the text (or the compression is
  wrong).
- **One pass, nothing dangling**: any restructuring ends with indexes updated, links
  re-pointed, `knowledge-lint --fix` run, zero errors.
- Refactors touch structure, not truth: changing *what a note claims* is an edit or a
  supersession, never a silent side effect of a move.

## 4. Judgment audits (agent duties the validator can't do)

The validator (`validation.md`) checks structure. These need reading and judgment:

| Audit | Question | Typical action |
|-------|----------|----------------|
| Near-duplicates | do two notes own overlapping topics? | merge + supersede |
| Naming consistency | do titles/filenames still say what notes contain? | rename, re-point |
| Evidence quality | does the Evidence section actually support the Finding? | demote to `draft`, gather more |
| Staleness (semantic) | did the world change under a `stable`/`canonical` note (upstream `depends_on` edits, external changes)? | re-verify or supersede |
| Compression candidates | are ≥3 notes circling one underlying rule? | §2 |
| Graduation | is durable, shareable knowledge sitting in agent memory or the journal? | distill into a note |

## 5. Cadence

- **After each work session that produced knowledge** (an insight, an experiment, a
  review finding, an incident): write/update the note(s) while context is fresh; run
  `knowledge-lint --fix`. Don't batch lessons — deferred lessons don't get written.
- **Periodic sweep** (monthly, or per `PROJECT.md` local rules): run the §4 judgment
  audits over the instance; process validator warnings (stale drafts, deprecated files
  awaiting archive, thin linking); compress where §2 applies.
- **On upstream change**: when a canonical source in the `PROJECT.md` map moves or a
  `depends_on` target changes substantively, re-verify the dependents on the next
  sweep at the latest.

## 6. What maintenance never does

- Never hard-deletes a knowledge file (philosophy.md §1).
- Never modifies the `bootstrap/` standard to fit one project (architecture.md §1).
- Never edits generated content by hand (Backlinks footers, AUTO-INDEX blocks).
- Never "fixes" a validator error by weakening the note (stripping edges to dodge a
  broken-link error, deleting evidence to shrink a file). Fix the cause.
