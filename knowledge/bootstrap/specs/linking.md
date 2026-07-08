# KOS Linking — edges, backlinks, orphans, reachability

> Read when adding links between notes, or when the validator reports orphan/link
> issues.

## 1. Link form: relative markdown links only

```markdown
[caption sizing](../patterns/caption-sizing.md)
```

- Works everywhere at once: agent file tools, grep, GitHub rendering, and
  Obsidian-style graph views (Obsidian supports markdown links natively).
- **Forbidden:** `[[wikilinks]]` (resolve only inside one editor — validator error) and
  absolute paths (break on any other machine).
- Paths are relative **to the linking file**. Links may point outside the instance
  (into the host repo — e.g. a style canon or a code file); they must still resolve.
- Anchors are allowed: `[rule](../patterns/x.md#the-rule)` — the file part must resolve.

## 2. Authors write forward edges only

Three author-written edge kinds:

| Edge | Where | Meaning |
|------|-------|---------|
| `related:` | frontmatter | sideways — a reader of this should know that exists |
| `depends_on:` | frontmatter | upstream — this note builds on that one |
| inline links | body | in-context references |

**Backlinks are never hand-written.** `knowledge-lint --fix` generates each note's
`## Backlinks` footer (the last section of the file, marked with an AUTO-GENERATED
comment) from all forward edges in the instance. Hand-maintained inverse links rot the
moment anyone forgets one; generated ones are always exactly right. Never edit the
footer; never add content below it.

## 3. Edge quality

- Link because a reader would benefit, **never to satisfy the linter**. Junk edges are
  graph damage — they make real edges indistinguishable from noise.
- Prefer linking to the **most specific** note (the pattern, not the category index).
- When compressing or superseding, re-point edges at the successor file
  (`maintenance.md`); `knowledge-lint` reports the broken links if you miss one.

## 4. Orphans and reachability (what the validator enforces)

- **Orphan = error.** Every note must be reachable by following links from the global
  `index.md` (in practice: listed in its category index — `architecture.md` §3). An
  unreachable note is functionally lost.
- **Fewer than 2 outbound edges = warning**, not an error. It's a nudge to consider
  whether the note is genuinely connected to nothing — sometimes true (a fresh lesson
  in an empty instance), usually not. Do not fabricate edges to silence it.
- **Broken link = error** (target file doesn't exist). Fix the path or restore the
  target; a broken edge is worse than no edge.
- Backlink-footer links don't count as the note's outbound edges (they're generated,
  not authored).
