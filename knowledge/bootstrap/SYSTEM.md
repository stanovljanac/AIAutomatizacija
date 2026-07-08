# KOS — Knowledge Operating System (bootstrap standard)

> **Standard version: 1.0.0** (2026-07-04). This folder is the portable, project-agnostic
> standard. Everything project-specific lives in the instance folder next to it (see
> `specs/architecture.md`). To adopt KOS in another repo: copy this `bootstrap/` folder,
> run the adoption algorithm (`specs/adoption.md`), add 2–3 pointer lines to that repo's
> CLAUDE.md/AGENTS.md.
>
> Format note: this file is Agent-Skills-compatible (entry < 150 lines, reference files
> one level deep). To expose KOS as a skill, wrap this file with a `name`/`description`
> frontmatter block verbatim — no other change needed.

## What KOS is

A self-maintaining markdown knowledge base that an agent builds and curates while it
works. It stores **knowledge** — what is true (`concept`, `glossary`), how it's done
(`pattern`), why it was chosen (`decision`), what we learned (`lesson`, `experiment`,
`research`) — as small linked markdown files with strict metadata, sizing, and lifecycle
rules, all machine-checked by a validator (`knowledge-lint`). It is **not** a place for
procedures (those are Agent Skills), not a private agent notebook (that is auto-memory),
and never a competing copy of a project's existing canonical docs (it points at them).

## When to engage KOS

Engage (read the relevant spec, then act) whenever you:

- **Learn something durable** while working — an insight backed by evidence, an
  experiment result, external research worth keeping → write/update a note
  (`specs/maintenance.md`, `specs/metadata.md`).
- **Need project knowledge** — read the instance `index.md` first, follow links; check
  `PROJECT.md` for where canonical sources live before searching the repo.
- **Touch any file under the instance folder** — after writing, run `knowledge-lint`
  (`specs/validation.md`).
- **See a note growing past ~500 lines** or covering 3+ distinct topics →
  `specs/sizing-and-splitting.md`.
- **Find duplicated or contradictory knowledge** → `specs/maintenance.md` (compression),
  `specs/lifecycle.md` (supersede/archive).
- **Set up KOS on a project** → `specs/adoption.md`.

## The five hard rules (inline — the full rationale is in `specs/philosophy.md`)

1. **Never delete knowledge.** Supersede and archive with provenance; hard-deleting a
   knowledge file is forbidden.
2. **Never duplicate a canonical source.** If the project already owns the truth (ADR
   log, style canon, fact store), KOS points at it in `PROJECT.md` — it never creates a
   competing copy.
3. **Always run `knowledge-lint` after writing** to the instance; fix errors before
   moving on.
4. **Respect human gates.** Nothing pre-existing is overwritten, moved, or modified
   without explicit owner approval (adoption Phase C; any project golden rules on top).
5. **Relative markdown links only.** `[title](../concepts/x.md)` — never `[[wikilinks]]`,
   never absolute paths.

## The nine specs (read on demand, never all at once)

| Spec | Read when… |
|------|------------|
| [philosophy.md](specs/philosophy.md) | you need the why behind a rule, or a call isn't covered by a mechanical rule |
| [architecture.md](specs/architecture.md) | creating instance folders/categories, writing `PROJECT.md`, or deciding where something lives |
| [metadata.md](specs/metadata.md) | creating or editing any note — frontmatter schema, Purpose header, the 7 types |
| [linking.md](specs/linking.md) | adding links/edges, wondering about backlinks or orphans |
| [sizing-and-splitting.md](specs/sizing-and-splitting.md) | a file is growing, or you're tempted to split one |
| [lifecycle.md](specs/lifecycle.md) | promoting/deprecating a note, or deciding how much to trust one |
| [adoption.md](specs/adoption.md) | installing KOS on a project (new or brownfield) |
| [maintenance.md](specs/maintenance.md) | routine upkeep — when to edit vs split vs create, compression, audits, cadence |
| [validation.md](specs/validation.md) | running or implementing `knowledge-lint`, interpreting its errors |

## The shape at a glance

```
knowledge/
├── bootstrap/            # this standard (portable; do not project-customize)
│   ├── SYSTEM.md
│   └── specs/            # the nine specs above
└── <instance>/           # per-project knowledge (name is a profile concern)
    ├── index.md          # global map, <200 lines — the agent's first read
    ├── PROJECT.md        # profile: goal, canonical map, knowledge sources, local rules
    └── <categories>/     # created on demand, each with its own index.md:
        concepts/ patterns/ decisions/ lessons/
        experiments/ research/ glossary/ archive/
```

Every note: frontmatter (`type`, `status`, dates, forward edges) + a three-line Purpose
header + body. Statuses: `draft → stable → canonical → deprecated`. Indexes stay under
200 lines; leaves target 300–500. The validator enforces all of it.
