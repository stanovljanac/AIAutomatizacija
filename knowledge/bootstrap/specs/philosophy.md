# KOS Philosophy — the why behind every rule

> Read when a mechanical rule doesn't cover your situation. Decide the way this file
> decides, and the system stays coherent.

## 1. No knowledge loss

Knowledge is expensive to acquire (an owner rejection, a failed render, a week of
research) and cheap to keep. Deleting it re-buys the same lesson later at full price.

- Nothing is ever hard-deleted. The unit of "removal" is **supersede + archive**: the
  better formulation takes the canonical spot; the old file moves to `archive/` with
  `status: deprecated` and a `superseded_by:` pointer (see `lifecycle.md`).
- This applies to *knowledge*, not to typos. Fixing a wrong number in place is an edit,
  not a supersession. Supersede when the *claim or rule itself* changes.

## 2. Compress, don't accumulate

The opposite failure mode: keeping everything forever until the base is unreadable.
Knowledge should get **denser** over time, not longer.

- When five scattered rules turn out to be one better rule, write the one rule and
  archive the five (with provenance — the new file cites what it compressed).
- **Bounded passes:** compress primary sources once; never re-compress a compressed
  file. Each re-summarization loses fidelity (summarization drift). If a compressed
  file needs revisiting, go back to the archived originals.
- No-loss and compression only conflict if compression deletes. It doesn't — it moves.

## 3. Semantic first

Structure follows meaning, never mechanics.

- Files split at **semantic cluster boundaries**, never at "line 500" mid-topic.
- Folders exist because notes of that type exist (**create-on-demand**), never as empty
  scaffolding. An empty folder with an empty index is rot from day one.
- A note covers **one** concept/pattern/lesson. "Misc" files are forbidden — if you
  can't name what a note is about in its title, it's two notes.

## 4. The system outranks any file

Files are nodes in a graph; their value is mostly in being **findable and connected**.

- An unlinked note is functionally lost (orphan = validator error).
- Navigation is **index-first**: agents read `index.md`, then follow links. A note that
  isn't reachable from an index doesn't exist for the next reader.
- Duplication is graph damage: two files about one topic split future updates between
  them and they silently diverge. The Purpose header's "Do not duplicate" line and the
  near-duplicate audit (`maintenance.md`) exist to prevent the classic proliferation
  disease (Prompt Guide / Prompt Tips / Prompt Notes / Prompt Tricks).

## 5. Enforce in code, not prose

A rule that lives only in prose is a promise; promises decay under context pressure.

- Every structural rule in this standard is checked by `knowledge-lint`
  (`validation.md`). If you add a rule, add a check — or expect the rule to die.
- Judgment calls that code can't check (near-duplicates, naming drift, whether evidence
  actually supports a claim) are explicit **agent duties** with a cadence
  (`maintenance.md`) — scheduled judgment, not hoped-for judgment.
- The terminal state of mature knowledge is enforcement: first a QA/lint check that
  rejects violations, then generation that cannot produce them at all
  (`lifecycle.md` — Knowledge Evolution).

## 6. Point, don't copy

On any real project, canonical knowledge already lives somewhere — an ADR log, a style
canon, a fact store, skills. KOS **maps it in place** (`PROJECT.md` canonical map) and
fills only the gaps. A second copy of a decision log is a fork of the truth: the copies
diverge, and readers can't tell which one is real. This is why adoption (`adoption.md`)
is a mapping exercise, not a migration.

## 7. Evidence before generality

Knowledge earns trust; it doesn't start with it.

- One occurrence is a `lesson`. A rule (`pattern`) needs ≥2 independent pieces of
  evidence. `canonical` is an owner call, and the validator demands an evidence trail
  (check 9). Never generalize from a single data point, and never fabricate an
  experiment to make knowledge look more mature than it is.
- A lesson with no evidence stays `draft` forever — that's a feature.

## The five hard rules, expanded

1. **Never delete knowledge** — §1. Deletion destroys provenance; archives are cheap.
2. **Never duplicate a canonical source** — §6. Forked truth is worse than no note.
3. **Always run `knowledge-lint` after instance writes** — §5. Unvalidated structure
   rots silently; the validator is the immune system.
4. **Respect human gates** — the owner's mental model of their own project outranks the
   agent's scan of it. Modifying pre-existing material without approval risks mangling
   knowledge at scale (and most projects forbid it outright).
5. **Relative markdown links only** — the one link form that works everywhere at once:
   agent tooling, grep, GitHub, and Obsidian-style graph views. Wikilinks resolve only
   inside one editor; absolute paths break on every other machine.

## Tone rules for knowledge text

Write like an architect, read like a compiler:

- **Deterministic language.** "Split at 650 lines", not "consider splitting large
  files". A future agent must be able to act on the sentence without judgment calls.
- **Dates absolute** (`2026-07-04`), never relative ("last month").
- **Claims carry sources**; numbers carry units; examples are real, never invented.
- **Short declarative sentences.** No marketing prose, no hedging. If something is
  uncertain, state the uncertainty as a fact ("unverified; single occurrence").
