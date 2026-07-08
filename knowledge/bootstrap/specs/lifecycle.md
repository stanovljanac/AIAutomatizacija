# KOS Lifecycle — statuses, promotion, deprecation, Knowledge Evolution

> Read when promoting/deprecating a note or deciding how much to trust one.

## 1. The four statuses

`draft → stable → canonical → deprecated`

| Status | Meaning | Trust |
|--------|---------|-------|
| `draft` | exists, unverified | read, but don't treat as truth |
| `stable` | verified once | usable |
| `canonical` | the single source of truth for its topic | conflicts resolve toward it |
| `deprecated` | superseded | consult only for provenance |

- There is **no fifth "experimental" status**: types classify *what a document is*,
  statuses classify *how much to trust it*. Experimental knowledge =
  `type: experiment, status: draft|stable`.
- Statuses attach to files (frontmatter), and one file has one status.

## 2. Transitions — who promotes, and on what

- **→ `draft`:** anyone/any agent, any time. The only status you can *create* a note in.
- **`draft` → `stable`:** the agent, after verification — the fact checked against its
  source, the lesson's evidence confirmed, the experiment actually run. Record what was
  verified in the body.
- **`stable` → `canonical`:** an **owner call** (or an explicit rule in `PROJECT.md`
  local rules). The validator additionally demands an evidence trail for canonical
  `pattern`/`decision` notes (check 9): links to at least one `lesson`, `experiment`,
  or sourced `research` note. Canon never appears out of thin air. `concept`/`glossary`
  are exempt — a canonical definition needs no lesson.
- **any → `deprecated`:** when a successor exists. Procedure (§3). Demotion
  (`canonical` → `stable`) is also an owner call — record why in the body.

## 3. Deprecation → archive (never delete)

1. The successor file exists and cites what it supersedes (provenance).
2. The superseded file gets `status: deprecated` + `superseded_by: <relative path>` in
   frontmatter and one pointer line at the top of the body.
3. On the next maintenance pass the file **moves to `archive/`** (validator warns while
   a deprecated file sits outside `archive/`); inbound links get re-pointed at the
   successor.
4. Nothing is ever hard-deleted (`philosophy.md` §1).

## 4. Knowledge Evolution — how knowledge matures

```
Observation → [Experiment]* → Evidence → Lesson → Pattern → Canonical → Enforcement
                                                                        (QA gate → automation)
```

\* optional — an incident is also evidence.

**Promotion rules (anti-premature-generalization):**

- 1 occurrence = a `lesson`.
- ≥ 2 independent pieces of evidence (a repeated occurrence, or an experiment) may
  become a `pattern` — which links to its evidence.
- `canonical` = owner call (§2), evidence trail enforced by validator check 9.
- **Enforcement is one stage with two maturity levels:** first a QA/lint check that
  rejects violations, then generation that cannot produce them at all — "enforce in
  code, not prose" as the terminal state of knowledge. When a pattern reaches
  enforcement, note *where* (the check/code) in the pattern's body.

**Entry at any stage:** knowledge may enter the pipeline wherever sufficient evidence
already exists — the pipeline describes *maturation*, not mandatory creation steps.
Official platform documentation (an API spec, a policy change) enters as sourced
`research` and is immediately a canonical *candidate*; it still passes the owner call,
and satisfies check 9 via its own sources. **Never fabricate an experiment** to satisfy
the pipeline's shape.

**Worked example** (from this standard's home project): "no title-card scenes" —
recurring render rejections (observation + evidence) → lesson → motion-spec rule
(pattern → canonical) → hard QA check in the render pipeline (enforcement).

## 5. Staleness

- A `draft` untouched for 90 days triggers a validator warning: verify it (→ `stable`),
  gather the missing evidence, or deprecate it. Drafts are open loops; the warning
  keeps them from becoming permanent residents.
- `stable`/`canonical` notes whose `depends_on` upstream changed should be re-verified
  on the next maintenance pass (`maintenance.md`).
