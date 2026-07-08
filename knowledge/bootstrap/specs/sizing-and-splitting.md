# KOS Sizing & Splitting — one rule set

> Read when a file is growing, or before splitting one.

## 1. The algorithm

```
role: index     → hard cap 200 lines (validator error above)
role: leaf      → target 300–500
  < 500 lines                       → normal update, no action
  500–650                           → split IF ≥2 natural semantic clusters, else continue
  > 650  (or 3+ clusters, any size) → split REQUIRED (validator error above 650)
```

- **Lines are a proxy for tokens.** A 400-line file dense with tables or code blocks
  can cost more context than a 600-line prose file — treat dense files as one size
  class larger.
- Indexes get the strictest cap because they are read most often (index-first
  navigation); a bloated index taxes every session.

## 2. Split by semantics, never by line number

A split happens at **cluster boundaries** — coherent sub-topics that stand alone:

```
automation.md (620 lines, 3 clusters)
  → automation-prompts.md      (the prompt patterns)
  → automation-patterns.md     (the workflow patterns)
  → automation-pitfalls.md     (the failure modes)
```

Never cut mid-cluster to satisfy a number; a file at 660 lines that is genuinely one
cluster stays one file (silence the validator only by owner-recorded exception in
`PROJECT.md` local rules — rare).

## 3. Split procedure (one pass, nothing dangling)

1. Identify the clusters; name each child by what it *owns* (its future "Do not
   duplicate" line).
2. Create the children: full frontmatter (fresh `created`, edges carried over as
   relevant), Purpose header, **all content preserved** — a split moves text, it never
   summarizes it.
3. Cross-reference the children (`related:` each other where useful).
4. The parent either becomes one of the children (rename) or a thin pointer that is
   then superseded per `lifecycle.md` — no hollowed-out husk files.
5. Update the category `index.md`; re-point inbound links at the right child
   (`knowledge-lint` reports any you miss); run `knowledge-lint --fix`.

## 4. Wait for material (don't split early)

Below 500 lines with no clear clusters: **wait**. Premature splits create stub files
that never grow and multiply navigation cost. The 3+-clusters trigger exists precisely
so that a file that *reads* like three topics splits regardless of size — and a file
that reads like one topic doesn't, until it must.
