# KOS v1.0 — Knowledge Operating System: Final Plan

> **Status:** IMPLEMENTED 2026-07-04 (owner-directed; see `docs/DECISIONS.md` D-050 + the PROGRESS entry) · **Date:** 2026-07-04
> **Supersedes:** `KOS-plan.md`, `KOS-plan1.md`, `KOS-plan2.md` (the three drafts stay in
> place as source material; nothing is deleted — see §9 traceability).
> **Amended 2026-07-04** (external-review discussion, same day): + Knowledge Sources
> (§4.1), + Knowledge Evolution & promotion rules (§4.11), + validator check 9 (§4.9),
> spec outlines updated (§5). No architectural changes.
> **Audience:** the owner + any agent implementing or adopting KOS. This file is read
> on demand, not loaded into every session, so it is allowed to be thorough.

---

## 1. TL;DR

KOS is a **self-maintaining markdown knowledge base that an agent builds and curates**:
a small, portable **bootstrap standard** (`knowledge/bootstrap/`) that can be dropped
into *any existing project*, plus one **per-project instance** (here:
`knowledge/desk-knowledge/`). The agent grows the instance as it works — concepts,
patterns, lessons, experiments, research, glossary — under strict rules for metadata,
linking, sizing, lifecycle, and compression, all **enforced by a validator script**
(`knowledge-lint`), not by prose promises.

The three drafts agreed on the vision and disagreed on mechanics. This plan keeps what
survived verification against Anthropic's own published practice (July 2026), fixes what
didn't (wikilinks, manually maintained backlinks, 4000–7000-line spec bloat, one-pass
ungated bootstrap, a fifth lifecycle status), and adds the piece all three drafts
underspecified: a concrete **adoption algorithm for existing projects** that maps
already-canonical knowledge *in place* instead of migrating it.

### Goals

1. One durable home for project knowledge an agent can navigate, extend, and compress
   without human babysitting.
2. A bootstrap standard portable to any repo in minutes (copy folder + 2–3 pointer lines
   in that repo's CLAUDE.md/AGENTS.md).
3. Zero knowledge loss, zero unbounded growth — both, reconciled via
   supersede-and-archive compression with provenance.
4. Every structural rule machine-checkable (`knowledge-lint`), consistent with this
   repo's ethos: *enforce in code, not prose*.

### Non-goals

- **KOS does not duplicate Agent Skills.** Procedures/how-tos live in `.claude/skills/`
  (or the host project's equivalent). KOS stores *knowledge* (what is true, what was
  decided, what was learned), not *instructions* (how to perform a task).
- **KOS does not replace auto-memory.** Claude's `MEMORY.md` memory is the agent's
  private notebook (per-user, per-machine). KOS is the project's shared, versioned,
  reviewable truth. Rule of thumb: if another agent or a human should see it, it goes
  in KOS; if it's about how *this user* likes to work, it stays in memory.
- **KOS does not replace existing canonical docs.** Where a project already has a
  decision log, style canon, or fact store, KOS *points at it* (map-in-place); it never
  creates a competing copy.
- **KOS is not a RAG/vector system.** Plain markdown + links + grep, by design.

---

## 2. Verified foundations (research, July 2026)

Every load-bearing claim below was checked against a primary source during planning
(first week of July 2026). Where a draft assumed something now known to be wrong, it is
flagged. Nothing was carried over from the drafts unverified.

### 2.1 Findings

| # | Finding | Source (verified 2026-07) | Consequence for KOS |
|---|---------|---------------------------|---------------------|
| F1 | Claude Code does **not** resolve Obsidian `[[wikilinks]]`. Its native mechanisms are `@path` imports in CLAUDE.md, plain relative markdown links, grep, and index files. | Claude Code memory docs — code.claude.com/docs/en/memory | All KOS links are **relative markdown links** (`[title](../concepts/x.md)`). They work for the agent *and* render/graph in Obsidian, which also supports markdown links. Wikilinks (drafts 0 & 2) are out. |
| F2 | Context guidance from Anthropic: aim for "the smallest possible set of high-signal tokens." CLAUDE.md is loaded whole every session — keep it lean and human-readable; official guidance and field practice converge on **< ~200 lines**. | Anthropic engineering: "Claude Code: Best practices for agentic coding" (Apr 2025); "Effective context engineering for AI agents" (Sep 2025) | Size budgets are **per file role**, and index files are the strictest (<200 lines) because they are read most often. |
| F3 | Agent Skills: SKILL.md should stay **< 500 lines**, with deeper material split into reference files loaded on demand ("progressive disclosure"). Agent Skills became an **open standard in Dec 2025**, adopted by 40+ clients (Claude Code, Cursor, OpenAI Codex, GitHub Copilot, Gemini CLI, …). | Anthropic engineering: "Equipping agents for the real world with Agent Skills" (Oct 2025); agentskills.io (standard, Dec 2025); Claude Code skills docs | The bootstrap entry file is written **skill-compatible** (< 500 lines, one level of reference files). That makes KOS portable to any of the 40+ clients, not just Claude Code. |
| F4 | Claude Code's own auto-memory ships the **index-first** model: a `MEMORY.md` index (≤ 200 lines) loaded each session, one fact per file behind it. | Claude Code auto-memory behavior, observed & documented in-product (2026) | Validates the global-index + leaf-file architecture; the pattern is native, not invented here. |
| F5 | Field data on AGENTS.md/CLAUDE.md scale: best results cluster around **~100–150 lines of always-loaded instructions** plus focused reference files; beyond that, instruction-following degrades. Token budget matters more than line count (lines are a proxy). | Aggregated field reports on large AGENTS.md deployments, 2025–2026 (agents.md ecosystem; HumanLayer/ghuntley write-ups) | Draft 1's "4,000–7,000 lines of spec" is an **anti-pattern**. Total bootstrap budget: **~1,200–1,800 lines across all files**, never loaded all at once. |
| F6 | Memory Bank pattern (Cline/Cursor lineage): documented failure modes are **staleness/rot, token bloat, and summarization drift** (each re-summarization loses fidelity). Documented mitigations: index-first loading, bounded/sliding windows, timestamps on entries. | Cline Memory Bank docs — docs.cline.bot; community critiques 2025–2026 | KOS compression is **bounded** (one pass over identified clusters, never re-summarizing summaries), every file carries dates, and reading is index-first. |
| F7 | Manually maintained inverse links (`used_by` / backlinks) rot in practice; systems that keep them working **generate** them (script or CI) from forward links. | Practice across docs-as-code systems (e.g., backlink generation in static-site/docs tooling); consistent with F6 rot findings | Authors write only **forward** edges (`related`, `depends_on`). `used_by` is **generated** by `knowledge-lint --fix`. Draft 0's manual `used_by` requirement is out. |
| F8 | Compression over accumulation is official best practice ("compaction", structured note-taking) — but naive compression is lossy; provenance must be kept. | Anthropic "Effective context engineering for AI agents" (Sep 2025) | "No knowledge loss" (draft 0) and "knowledge should compress" (draft 2) are **both** kept: compress forward, archive the superseded original. §4.7. |
| F9 | Markdown linting is largely off-the-shelf: `markdownlint` / `remark-lint`, **`remark-lint-frontmatter-schema`** (validates YAML frontmatter against a JSON schema), and link checkers (`lychee`, `markdown-link-check`). Orphan detection, graph rules, and role-based size limits are **not** off-the-shelf — custom script territory. | github.com/DavidAnson/markdownlint; github.com/remarkjs/remark-lint; remark-lint-frontmatter-schema; lycheeverse/lychee | `knowledge-lint` = thin custom Node script for the graph/size/orphan rules; it does not reinvent frontmatter or link checking where a library fits. §4.9. |

### 2.2 What the drafts got wrong (flags)

- **Wikilinks everywhere** (drafts 0, 2) → contradicts F1. Replaced by relative md links.
- **Manually maintained `used_by`** (draft 0 §5–6) → contradicts F7. Generated instead.
- **"4,000–7,000 lines of documentation"** (draft 1) → contradicts F2/F5. Budget ~1,200–1,800 total.
- **One-pass bootstrap, no human gates** (draft 0 §10) → contradicts this repo's golden
  rule (never delete/overwrite without asking) and generalizes badly. Adoption is phased
  with a human gate before anything existing is touched (§6).
- **Fifth lifecycle status "Experimental"** (draft 2 §10) → conflates *what a document
  is* (type) with *how much to trust it* (status). Resolved as `type: experiment` (§3.3-C5).
- **"Delete old rules"** (draft 2 §11) → collides with no-loss and with this repo's
  supersede-don't-delete ADR practice. Resolved as supersede + `archive/` (§4.7).

### 2.3 This repo's existing knowledge (inventory, verified 2026-07-04)

Canonical knowledge already lives here — KOS must point at it, not copy it:

| What | Where | Notes |
|------|-------|-------|
| Decisions (ADR) | `docs/DECISIONS.md` | 43 decisions, `D-NNN`, Context/Decision/Consequences, explicit *supersede, don't delete* convention |
| Progress journal | `docs/PROGRESS.md` | per-wave log |
| Style canon | `style/STYLE_GUIDE.md` (134 ln), `style/VISUAL_IDENTITY.md` (170), `style/MOTION_SPEC.md` (198), `style/CHANNEL.md` (109) | already well-sized leaf docs |
| Live facts + staleness | `pipeline/shared/knowledge/facts.json` + `refresh-facts.mjs` | source-backed facts with an automated staleness auditor — KOS's philosophy already running in miniature |
| Review rubric | `pipeline/shared/review/rubric.mjs` | scoring lives in code |
| Procedures | `.claude/skills/*` | 15+ skills; this is where workflows live |

**Gaps KOS fills here:** no lessons-learned store, no research/experiments store, no
glossary, no doc validation (the Stop hook gates only code), and the review system
writes its insights nowhere. `desk-knowledge` appears nowhere outside the three drafts —
it is a blank slate.

---

## 3. Comparative analysis of the three drafts

Drafts: **P0** = `KOS-plan.md` (master-prompt bootstrapper), **P1** = `KOS-plan1.md`
(spec-not-prompt), **P2** = `KOS-plan2.md` (sizing/lifecycle/universality refinements).

### 3.1 Common to all three — each point re-examined

Verdicts: ✅ keep as-is (validated) · ⚠️ keep but upgraded (how + why given).

1. **Agent-maintained markdown knowledge base** — ✅ **keep.** Validated by Anthropic's
   own practice: memory files, CLAUDE.md, skills — all agent-curated markdown (F2–F4).
   Plain files + grep beat heavier machinery at this scale.

2. **Semantic folder taxonomy** (concepts/patterns/decisions/…) — ✅ **keep, with one
   upgrade: create-on-demand.** All drafts imply scaffolding every category upfront.
   Empty folders with empty indexes are rot from day one (F6) and pressure the agent to
   fill categories for their own sake. A category folder + its local `index.md` is
   created the first time a note of that type exists. Recommendation: taxonomy in §4.2,
   instantiated lazily.

3. **Size limits + mandatory split** — ⚠️ **upgrade.** Drafts give one number for all
   files; wrong granularity. Budgets must be **per file role** (an index that is read
   constantly ≠ a leaf read on demand): index < 200, leaf target 300–500, hard cap 650
   (§4.6). Line counts are a proxy — the real budget is tokens (F5); the validator
   warns on token-dense files (tables, code blocks) before the line cap. Splits are
   always **semantic** (P2's clusters rule), never mechanical at line N.

4. **Linking graph** (minimum edges, no orphans) — ⚠️ **upgrade in three ways.**
   (a) `[[wikilinks]]` → **relative markdown links** — the only form that works for
   Claude, grep, GitHub, *and* Obsidian (F1). (b) `used_by` is **generated** by the
   validator, never hand-written (F7). (c) "Every file links 2–5 others" as a *hard*
   rule invites junk links to satisfy a linter; it becomes a **lint warning**, while
   **orphan = error** stays hard (§4.5).

5. **Frontmatter metadata** — ✅ **keep, merged and schema-validated.** P0's machine
   fields (`type`, `status`, `related`, `depends_on`) + P2 §12's human header
   (Purpose / When to read / Do not duplicate) are complementary: one for tooling, one
   for the reader deciding whether to read on. Both required; schema-checked by
   `knowledge-lint` via frontmatter-schema validation (F9). §4.4.

6. **Decision log** — ⚠️ **upgrade with a scoping rule: one canonical decision log per
   project.** P0/P2 assume KOS owns decisions. On a project that already has an ADR log
   (here: `docs/DECISIONS.md`, 43 decisions), a second log is a fork of the truth.
   Rule: `PROJECT.md` declares where decisions live; KOS's `decisions/` is used **only**
   when no log exists. Here it stays empty and points at `docs/DECISIONS.md`.

7. **Lifecycle statuses** — ✅ **keep, exactly four:** `draft → stable → canonical →
   deprecated`. P2's fifth ("experimental") is handled by `type: experiment` — an
   experiment note can itself be draft or stable. Types classify content; statuses
   classify trust. §3.3-C5, §4.3.

8. **Self-audit** — ⚠️ **upgrade from prose to code.** P0 §11 and P1's checklist are
   promises the agent makes to itself; those decay. The audit is a **validator script**
   (`knowledge-lint`, §4.9) an agent must run after touching `knowledge/` — same ethos
   as this repo's Stop-hook-enforced tests. Checks that need judgment (near-duplicate
   concepts) stay agent duties, listed in `maintenance.md`, but everything mechanical
   is code.

9. **No knowledge loss + compression** — ✅ **keep both, reconciled.** They only
   conflict if compression deletes. KOS compresses **with provenance**: the better,
   shorter formulation replaces the old in place; the superseded original moves to
   `archive/` with a pointer both ways; compression passes are **bounded** — compress
   sources, never re-compress a compression (drift, F6/F8). §4.7.

10. **Universality** — ✅ **keep, via the bootstrap/instance split.** The standard
    (`bootstrap/`) is project-agnostic; everything project-specific lives in the
    instance's `PROJECT.md` profile (P2 §13). Adopting KOS elsewhere = copy
    `bootstrap/`, run adoption (§6), fill `PROJECT.md`.

### 3.2 Differences (complementary — all merged)

- **P0 contributes:** the scanning order (→ adoption phases, §6), the self-audit item
  list (→ validator checks, §4.9), refactoring behavior rules (→ `maintenance.md`),
  the knowledge-type classification, and the decision-note format.
- **P1 contributes:** modular spec files instead of a mega-prompt (→ §5 file list),
  versioning of the standard (`SYSTEM.md` carries a version), hard-rules and
  quality-checklist ideas (→ `philosophy.md`, `validation.md`).
- **P2 contributes:** the split algorithm and thresholds, the Purpose header, concrete
  lessons/decision examples, compression-over-growth, the Obsidian stance
  (human-optional), and `PROJECT.md` universality.

### 3.3 Contradictions (each: options → recommendation)

**C1 — Mega-prompt (P0) vs modular spec (P1).**
Options: (a) one master prompt; (b) modular spec files.
→ **Modular spec.** A mega-prompt can't be versioned, partially loaded, or maintained
without whole-file rewrites, and always-loading it burns context (F2). **But** P1's
4,000–7,000-line estimate is rejected (F5): total bootstrap budget **~1,200–1,800
lines**, each spec **< 300**, entry **< 150** — and never all loaded at once
(progressive disclosure, F3).

**C2 — Naming/placement: `/desk-knowledge/` at repo root (P0) vs generic `knowledge/` +
profile (P2 §13) vs the owner's existing scaffold (`knowledge/{bootstrap,desk-knowledge}/`).**
→ **Keep the owner's scaffold.** It already implements the correct split: standard +
instance. The standard states the rule generically: *instance folder name is a profile
concern* — `desk-knowledge/` here, anything elsewhere. No churn for zero benefit.

**C3 — Taxonomy: `workflows/` + `experiments/` (P0) vs `research/` (P2).**
→ **`workflows/` does NOT enter KOS.** Step-by-step procedures are exactly what Agent
Skills are for (F3); a `workflows/` folder would fork `.claude/skills/` — the same
duplication disease KOS exists to cure. **Keep `experiments/`** (our own tested
variations + results; feeds the analytics growth loop) **and keep `research/`**
(external findings with sources and dates — the raw material lessons are distilled
from). Both create-on-demand.

**C4 — Split thresholds: 500–700 "or 3+ clusters" (P0) vs 300–500 target / 650 required
(P2, which itself also says "hard limit 700" earlier in the same draft).**
→ **One algorithm, P2's stricter numbers** (also closer to F2/F5 budgets):
` <500 lines → normal update · 500–650 → split only if ≥2 natural semantic clusters ·
>650 → split REQUIRED · indexes always <200.` P0's "3+ conceptual clusters" survives as
a split trigger *independent of size*. Never split mid-cluster to satisfy a number.

**C5 — Lifecycle: 4 statuses (P0/P1) vs 5 with "Experimental" (P2).**
→ **Four statuses + `type: experiment`** (rationale in §3.1-7). Fewer states, no lost
expressiveness: "experimental knowledge" = `type: experiment, status: draft|stable`.

**C6 — One-pass ungated bootstrap (P0 §10: scan→migrate→refactor in one run) vs this
repo's reality (never delete/overwrite without asking; human gates).**
→ **Phased adoption with a human gate** before anything pre-existing is modified
(§6). One-pass migration by an agent over a repo it just met is how knowledge gets
mangled at scale; and on *this* repo it is outright forbidden by the golden rules.
Everything up to the mapping report is read-only and free to automate.

---

## 4. Final KOS v1.0 architecture

### 4.1 Two-folder layout

```
knowledge/
├── bootstrap/            # THE STANDARD — portable, project-agnostic (§5)
│   ├── SYSTEM.md         #   entry point / orchestrator (<150 lines, skill-compatible)
│   └── specs/            #   nine spec files, each <300 lines
└── desk-knowledge/       # THE INSTANCE — this project's knowledge (name = profile concern)
    ├── index.md          #   global map, <200 lines, the agent's first read
    ├── PROJECT.md        #   profile: goal, canonical map (in-place pointers), local rules
    └── <categories>/     #   created on demand, each with its own index.md:
        concepts/  patterns/  decisions/  lessons/
        experiments/  research/  glossary/  archive/
```

`PROJECT.md` for this repo maps canonical knowledge **in place** (nothing migrates):
decisions → `docs/DECISIONS.md` · style → `style/*` (4 files) · live facts →
`pipeline/shared/knowledge/facts.json` · review rubric →
`pipeline/shared/review/rubric.mjs` · procedures → `.claude/skills/*`. The instance
fills only the gaps: lessons, experiments, research, glossary, concepts/patterns.

`PROJECT.md` also declares **Knowledge Sources** — where the agent looks for *new*
knowledge (the canonical map answers "where does it live"; sources answer "where do I
look"). This repo's list:

- **Primary — external signals:** YouTube Studio analytics (CTR, retention, traffic
  sources), viewer comments, thumbnail A/B tests, external research.
- **Primary — pipeline outputs:** QA reports, review-panel scores and insights,
  experiment results.
- **Internal harvest** (distill lessons from these; don't treat them as fresh signals):
  `docs/PROGRESS.md`, auto-memory (graduation per §4.10), `docs/DECISIONS.md` context.
- **Secondary:** industry reports, competitor analysis, official platform/API docs.

### 4.2 Knowledge types (frontmatter `type`)

`concept` (what something is) · `pattern` (a reusable way it's done) · `decision` (why
something was chosen — only where no external ADR log exists, §3.1-6) · `lesson`
(insight distilled from our own experience) · `experiment` (a test we ran + results) ·
`research` (external findings, sourced + dated) · `glossary` (term definitions).
One primary type per file. **No `workflow` type** (§3.3-C3).

### 4.3 Lifecycle (frontmatter `status`)

`draft` → `stable` → `canonical` → `deprecated`.
- **draft:** exists, unverified; agents may read but not treat as truth.
- **stable:** verified once; usable.
- **canonical:** the single source of truth for its topic; conflicts resolve toward it;
  promotion to canonical is an owner call (or an explicit rule in `PROJECT.md`).
- **deprecated:** superseded — body gains a pointer to the successor; file moves to
  `archive/` on the next maintenance pass. Never silently deleted.

How knowledge moves through these statuses — including when it may enter mid-pipeline —
is the Knowledge Evolution model (§4.11).

### 4.4 Metadata standard (every instance file)

```markdown
---
type: concept | pattern | decision | lesson | experiment | research | glossary
status: draft | stable | canonical | deprecated
created: 2026-07-04
updated: 2026-07-04
related: [../patterns/hook-structure.md]
depends_on: []          # upstream knowledge this builds on
# used_by is ABSENT here — generated into the "Backlinks" footer by knowledge-lint --fix
---

# <Title>

**Purpose:** this file exists to explain <X>.
**When to read:** read this when <situation>.
**Do not duplicate:** if writing about <X>, extend this file instead of creating a new one.

<body…>

## Backlinks
<!-- AUTO-GENERATED by knowledge-lint --fix. Do not edit. -->
```

Machine block (P0) + human header (P2 §12) merged. The schema is checked by
`knowledge-lint` (F9). Dates are absolute, never relative. The "Do not duplicate" line
is the anti-body for the classic agent disease (Prompt Guide / Prompt Tips / Prompt
Notes / Prompt Tricks — P2 §12).

### 4.5 Linking standard

- **Relative markdown links only** (F1): `[caption sizing](../patterns/caption-sizing.md)`.
  Work in Claude Code, grep, GitHub, and Obsidian's graph alike.
- Authors write **forward edges only**: `related`, `depends_on` in frontmatter, inline
  links in the body. **Backlinks (`used_by`) are generated** by `knowledge-lint --fix`
  into the file's footer (F7).
- **Orphan file (no inbound or outbound edges, not reachable from any index) = lint
  error.** "Fewer than 2 outbound links" = lint **warning** — a nudge, not an
  invitation to fabricate edges (§3.1-4).
- Every file must be reachable from its category `index.md`; every category index from
  the global `index.md`.

### 4.6 Sizing & splitting algorithm (one rule set, from C4)

```
role: index     → hard cap 200 lines
role: leaf      → target 300–500
  < 500 lines                     → normal update
  500–650                         → split IF ≥2 natural semantic clusters, else continue
  > 650 (or 3+ clusters any size) → split REQUIRED
```

Splits are semantic (P2 §5: `automation.md` → `automation-prompts.md` /
`automation-patterns.md` / `automation-pitfalls.md`), preserve all content, insert
cross-references, and update the parent index — in the same pass. Don't split early:
below 500 with no clear clusters, wait for material (P2 §4). Line counts proxy tokens;
the validator also flags token-dense files (F5).

### 4.7 Compression with provenance (no-loss ∧ no-growth)

When new knowledge subsumes old (5 scattered rules → 1 better rule):
1. Write the compressed form in the canonical location.
2. Move superseded originals to `archive/` (keep frontmatter, add
   `status: deprecated` + `superseded_by:` pointer). Never hard-delete.
3. The new file's body cites what it compressed (provenance).
4. **Bounded passes:** compress primary sources once; never re-compress a compressed
   file (summarization drift, F6/F8). If a compressed file needs revisiting, go back
   to the archived originals.

### 4.8 Lessons format (the learning loop)

`lessons/YYYY-MM-DD-<slug>.md`, body = three mandatory sections:
**Finding** (one sentence) · **Evidence** (concrete: video IDs, metrics, links —
"Video 003 CTR 9.8% vs Video 006 5.7%") · **Decision** (what we do differently now,
linked to the pattern/concept it updates). A lesson with no evidence is a `draft`
forever. This is the write-back target the review/QA system currently lacks (§2.3).

### 4.9 Validator: `knowledge-lint` (spec)

Thin Node script (this repo: `scripts/knowledge-lint.mjs`; ships with the standard as a
spec, implementations may vary). Leverages off-the-shelf pieces where they exist (F9);
custom logic only for graph/size/role rules.

Checks (**error** unless noted):
1. Frontmatter present + schema-valid (type/status enums, dates ISO, arrays of paths).
2. Purpose header present (Purpose / When to read / Do not duplicate).
3. Relative links resolve (no broken links); **no `[[wikilinks]]`**.
4. Size caps by role: index ≤ 200 hard; leaf > 650 error, 500–650 **warning**.
5. Orphans: unreachable from indexes = error; < 2 outbound links = **warning**.
6. Category folder ⇒ has `index.md`; every file listed in its category index.
7. `deprecated` file outside `archive/` = **warning** (move pending).
8. Stale-draft check: `status: draft` untouched > 90 days = **warning**.
9. Evidence for canon (§4.11): `status: canonical` on a `pattern` or `decision` must
   reference (frontmatter or body link) at least one `lesson`, `experiment`, or sourced
   `research` file — canon never appears out of thin air. `concept`/`glossary` are
   exempt: a canonical definition needs no lesson, and forcing links breeds junk edges
   (same rationale as §4.5's min-links warning).

`--fix` mode: regenerates Backlinks footers from forward edges; regenerates index file
listings (prose in indexes is human/agent-written; listings are mechanical).
Exit non-zero on errors. Wiring into hooks/CI is per-project and optional at v1.0
(here: a candidate for the Stop hook later — start manual, promote when stable).

### 4.10 Boundaries with neighbors

| System | Holds | KOS relationship |
|--------|-------|------------------|
| Agent Skills (`.claude/skills/`) | procedures (how to do) | KOS never stores workflows; skills may *link into* KOS for facts |
| Auto-memory (`MEMORY.md` + files) | agent's private, per-user notes | graduate durable, shareable facts → KOS; memory keeps preferences/corrections |
| `docs/DECISIONS.md` (this repo) | canonical ADR log | `PROJECT.md` points at it; KOS `decisions/` stays empty here |
| `facts.json` + `refresh-facts.mjs` | volatile, source-backed live facts | stays as-is (already automated); KOS `research/` holds *narrative* findings, not key-value facts |
| `docs/PROGRESS.md` | chronological journal | unchanged; lessons distill *insights* out of it, not duplicate its timeline |

### 4.11 Knowledge Evolution (the maturation model)

How knowledge matures, from raw signal to enforced rule:

```
Observation → [Experiment]* → Evidence → Lesson → Pattern → Canonical → Enforcement
                                                                        (QA gate → automation)
```

\* optional — an incident is also evidence (the 008 Gemini-503 lesson ran no experiment).

**Promotion rules (anti-premature-generalization):**

- 1 occurrence = a `lesson`.
- ≥ 2 independent pieces of evidence (a repeated occurrence, or an experiment) = a
  `pattern`.
- `canonical` = owner call (§4.3), with the evidence trail enforced by check 9 (§4.9).
- **Enforcement is one stage with two maturity levels:** first a QA/lint check that
  rejects violations, then generation that cannot produce them at all — this repo's
  "enforce in code, not prose" ethos as the terminal state of knowledge.

**Entry at any stage:** knowledge may enter the pipeline at any stage where sufficient
evidence already exists — the pipeline describes *maturation*, not mandatory creation
steps. Official platform documentation (a YouTube algorithm change, an Anthropic API
spec) enters as sourced `research` and is immediately a canonical *candidate*; it still
passes the owner call and satisfies check 9 via its own sources. Never fabricate an
"experiment" to satisfy the pipeline's shape.

Worked example (this repo): "no title-card scenes" — recurring failure (observation +
evidence) → memory/lesson → `style/MOTION_SPEC.md` §0 (pattern → canonical) → QA gate
in code (enforcement).

---

## 5. Bootstrap standard — exact file list

`knowledge/bootstrap/` — total budget **~1,200–1,800 lines** (C1). Written in English,
project-agnostic, Agent-Skills-compatible format (F3): `SYSTEM.md` is the entry
(< 150 lines, can gain a SKILL.md frontmatter wrapper verbatim), specs are one level
deep, loaded on demand.

| File | Budget | Outline |
|------|--------|---------|
| `SYSTEM.md` | <150 | What KOS is (10 lines); when to engage (triggers); map of the 9 specs with one-line "read when…" each; the 5 hard rules inline (never delete, never duplicate canonical sources, always run knowledge-lint after writes, respect human gates, relative links only) |
| `specs/philosophy.md` | <200 | No-loss; compress-don't-accumulate; semantic-first; system>files; enforce-in-code; hard rules expanded with rationale |
| `specs/architecture.md` | <250 | Two-folder model; instance layout; category taxonomy + create-on-demand rule; index hierarchy; PROJECT.md profile spec (goal, canonical map, **knowledge sources**, local rules, instance name) |
| `specs/metadata.md` | <200 | Frontmatter schema (full, as JSON-schema-in-fence for the linter) + Purpose header spec + type definitions with one example each |
| `specs/linking.md` | <150 | Relative-links rule + rationale (F1); forward-edges-only; generated backlinks; orphan/warning semantics; reachability rule |
| `specs/sizing-and-splitting.md` | <150 | §4.6 algorithm; semantic-split procedure (identify clusters → children → cross-refs → parent index, one pass); wait-for-material rule; token caveat |
| `specs/lifecycle.md` | <200 | 4 statuses + transitions + who promotes; `type: experiment` note; deprecation → archive flow; Knowledge Evolution model + promotion rules + entry-at-any-stage rule (§4.11) |
| `specs/adoption.md` | <300 | The §6 algorithm in full: phase checklists, mapping-report template, human-gate script, map-in-place doctrine, "never migrate what already works" |
| `specs/maintenance.md` | <250 | Update algorithm (when edit/split/new file); compression procedure (§4.7); judgment-audit duties (near-duplicates, naming consistency); refactoring behavior rules (from P0 §9); cadence (after each work session touching knowledge; monthly sweep) |
| `specs/validation.md` | <200 | knowledge-lint spec (§4.9): checks table (incl. check 9, evidence-for-canon), exit codes, --fix behavior, suggested wiring (manual → hook → CI) |

Dropped from P1's spec list: `scanning.md` (→ `adoption.md`), `refactoring.md` +
`update-policy.md` (→ `maintenance.md` + `sizing-and-splitting.md`), `quality-rules.md` +
`hard-rules.md` (→ `philosophy.md` + `validation.md`). Nine files, no overlap.

---

## 6. Adoption algorithm for existing projects (the core ask)

For any repo that has no knowledge system — including brownfield repos with knowledge
scattered across docs, comments, and history. Read-only until the human gate.

- **Phase A — Inventory scan (read-only).** Walk the repo; find where knowledge already
  lives: ADR/decision logs, style guides, README/docs trees, fact stores, skills,
  wikis, long-lived comments. Classify each hit by KOS type + apparent status.
- **Phase B — Mapping report (read-only artifact).** One document proposing, for every
  hit: **canonical-in-place** (KOS points at it; the default for anything alive and
  owned) / **gap** (KOS instance will house it) / **duplicate/conflict** (list, with a
  proposed winner) / **candidate for later migration** (dead or homeless content —
  never migrated in this pass).
- **Phase C — HUMAN GATE.** Owner approves/edits the map. Nothing pre-existing is
  created-over, moved, or modified before this point. (C6; and on this repo, golden
  rule #6 makes this gate non-negotiable.)
- **Phase D — Instantiate.** Create the instance folder + `index.md` + `PROJECT.md`
  (with the approved in-place canonical map), then category folders **only** for
  approved gaps, seeded with real initial notes (never empty scaffolding).
- **Phase E — Install the loop.** Add the validator; add 2–3 pointer lines to the host
  project's CLAUDE.md/AGENTS.md ("Project knowledge lives in `knowledge/<instance>/` —
  read `index.md` first; follow `knowledge/bootstrap/SYSTEM.md` when writing");
  maintenance cadence per `maintenance.md`.

Never delete/overwrite; conflicts resolve by supersede + archive. **For this repo,
Phases A–B are already substantially done** (§2.3) — the mapping report is nearly
free.

---

## 7. Question 5: are the two scaffolded folders the right shape?

Three options considered:

- **(a) Two folders as scaffolded** (`knowledge/bootstrap/` + `knowledge/desk-knowledge/`).
  Spec-vs-instance separation, versionable together, portable by copy. Con: the
  standard travels by copy-paste (drift across projects possible).
- **(b) Bootstrap as an Agent Skill** in `.claude/skills/knowledge-os/`. Auto-triggers;
  native format. Con: ties the *standard* to one harness's directory layout; the
  instance still needs `knowledge/` anyway; knowledge-authoring rules deserve to live
  next to the knowledge, not in tool config.
- **(c) Standalone repo/package** for the standard (submodule/npm). Real versioning,
  no drift. Con: heaviest ceremony; premature at n=1 project.

**Recommendation: (a) + skill-compatible format** — the separation the owner scaffolded
is exactly the validated spec-vs-instance pattern (spec = code, instance = data), and
writing `SYSTEM.md` within Agent-Skills limits (entry < 500 lines, reference files one
level deep, F3) means option (b) stays a 5-minute wrapper away on any project, and the
Dec-2025 open standard makes it portable to 40+ clients. Adoption elsewhere =
copy `bootstrap/`, run §6, add 2–3 pointer lines in that project's CLAUDE.md.
Graduate to (c) only when a third project adopts KOS and drift actually hurts.

---

## 8. Implementation roadmap (after this plan is approved — not part of this task)

1. **Write the bootstrap** — the 10 files of §5, within budgets.
2. **Write `knowledge-lint`** (`scripts/knowledge-lint.mjs`) per §4.9 — a code change:
   full build-sprint cycle, tests green.
3. **Run adoption on this repo** — Phases A–E of §6 (A/B mostly done in §2.3); owner
   gate; instantiate `desk-knowledge/` with `PROJECT.md` + first real notes (seed
   candidates: lessons already sitting in auto-memory and PROGRESS.md, e.g. the
   title-card reject rule, proof-must-be-visible).
4. **Maintenance loop** — after each video cycle the agent writes/updates lessons +
   research and runs the validator; monthly compression sweep; consider Stop-hook wiring
   once stable.

---

## 9. Appendix: traceability table

Every substantive item from the three drafts → where it landed. Guarantee: nothing
dropped silently ("no knowledge loss" applied to the plan itself).

### P0 — `KOS-plan.md`

| # | Item | Fate |
|---|------|------|
| P0-1 | Single master-prompt bootstrapper | **Superseded** by modular spec (C1) |
| P0-2 | Scan repo → understand → build → refactor (objectives) | **Kept**, restructured as adoption phases (§6) |
| P0-3 | No-knowledge-loss rule | **Kept** (§4.7; philosophy.md) |
| P0-4 | No-infinite-growth rule | **Kept** (§4.6) |
| P0-5 | Semantic-first organization | **Kept** (philosophy.md) |
| P0-6 | System > files; files = graph nodes | **Kept** (§4.5) |
| P0-7 | Target structure `/desk-knowledge/` + 8 category folders | **Kept minus `workflows/`** (C3); create-on-demand (§3.1-2); placement per scaffold (C2) |
| P0-8 | New-file / update-file criteria | **Kept** (maintenance.md) |
| P0-9 | Split at 500–700 lines or 3+ clusters | **Merged** into unified algorithm (C4) — 3+-clusters trigger survives |
| P0-10 | 7-type knowledge model (incl. workflow) | **Kept minus `workflow`** (C3) → §4.2 |
| P0-11 | Frontmatter: type/status/related/used_by/depends_on | **Kept**; `used_by` now generated (F7) → §4.4 |
| P0-12 | Min 2–5 links, no orphans, 3 edge directions | **Kept softened**: orphan=error, min-links=warning (§4.5) |
| P0-13 | Global + local index files (navigation layers) | **Kept**, index < 200 (§4.1, §4.6) |
| P0-14 | Decision format (Context/Decision/Reasoning/Alternatives/Impact/Related) | **Kept** for instance decisions; scoped by one-log-per-project rule (§3.1-6) |
| P0-15 | Refactoring behavior rules (dedupe, normalize, never oversimplify) | **Kept** → maintenance.md |
| P0-16 | Strict-order one-pass scanning process | **Superseded** by phased adoption + human gate (C6) |
| P0-17 | Self-audit checklist (orphans, metadata, dupes, size, indexes) | **Upgraded** to knowledge-lint checks (§4.9) |
| P0-18 | Output style: architect/compiler, deterministic | **Kept** → philosophy.md tone rules |
| P0-19 | Final goal: self-maintaining, retrieval-fast, automation-supporting | **Kept** → §1 Goals |

### P1 — `KOS-plan1.md`

| # | Item | Fate |
|---|------|------|
| P1-1 | Specification, not prompt | **Accepted** (C1) |
| P1-2 | `SYSTEM.md` + `specs/` (9 named specs) | **Accepted**; list consolidated 9→9 with merges (§5, "Dropped from P1" note) |
| P1-3 | Modular benefits: partial edits, per-spec reference, reuse | **Accepted** (§5) |
| P1-4 | Versioning the knowledge system | **Accepted**: `SYSTEM.md` carries standard version (§5) |
| P1-5 | Lifecycle Draft→Stable→Canonical→Deprecated | **Accepted** (C5, §4.3) |
| P1-6 | Hard rules (never-do list) | **Accepted** → SYSTEM.md inline + philosophy.md |
| P1-7 | Update algorithm (edit vs split vs new) | **Accepted** → sizing-and-splitting.md + maintenance.md |
| P1-8 | Scoring system for doc quality | **Reworked**: subjective self-scoring drifts; replaced by validator checks + status field. Judgment audits stay as maintenance duties (§3.1-8) |
| P1-9 | Post-update checklist + self-audit | **Accepted** → knowledge-lint + maintenance cadence |
| P1-10 | 4,000–7,000 lines of documentation | **Rejected** — anti-pattern (F5, C1); budget ~1,200–1,800 |
| P1-11 | Generic enough for other projects | **Accepted** → §3.1-10, §7 |

### P2 — `KOS-plan2.md`

| # | Item | Fate |
|---|------|------|
| P2-1 | Knowledge system in its own folder, not repo root | **Accepted** (C2; scaffold) |
| P2-2 | Folder set incl. `research/` | **Accepted**; `research/` kept (C3), create-on-demand |
| P2-3 | Obsidian optional, human-only; Claude reads markdown | **Accepted with upgrade**: relative md links work in both (F1), so the vault stays useful without wikilinks |
| P2-4 | Target 300–500, hard limit 700 / split algorithm <500/500–650/650+ | **Accepted** — the internal 700-vs-650 inconsistency resolved to 650 (C4) |
| P2-5 | Wait-for-material (don't split prematurely) | **Accepted** (§4.6) |
| P2-6 | Split by semantics, not size (automation.md example) | **Accepted** (§4.6) |
| P2-7 | References hard rule (Related/See also/Depends on/Used by) | **Accepted softened + mechanized**: forward edges manual, backlinks generated, min-links = warning (§4.5) |
| P2-8 | Per-folder index files | **Accepted** (§4.1) |
| P2-9 | Decision log + robot-visuals example | **Accepted**, scoped by one-canonical-log rule (§3.1-6) |
| P2-10 | Lessons with dated files + Finding/Evidence/Decision | **Accepted** verbatim (§4.8) |
| P2-11 | Status incl. 5th "Experimental" | **Partially accepted**: 4 statuses + `type: experiment` (C5) |
| P2-12 | Knowledge should compress, delete old rules | **Accepted amended**: compress with provenance; supersede+archive, never delete (§4.7) |
| P2-13 | Purpose / When to read / Do not duplicate header | **Accepted** (§4.4) |
| P2-14 | Anti-pattern: Prompt Guide/Tips/Notes/Tricks proliferation | **Accepted**: Do-not-duplicate header + near-duplicate audit duty (§4.4, maintenance.md) |
| P2-15 | Universal KOS + per-project `PROJECT.md` profile | **Accepted** — cornerstone of §4.1/§6 |

---

*End of plan. Approval of this document green-lights roadmap step 1 (§8).*
