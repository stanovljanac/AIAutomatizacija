# PROJECT.md — The Automation Desk (instance: `desk-knowledge`)

The KOS profile for this repo. Written per `../bootstrap/specs/architecture.md` §4;
approved via the KOS v1.0 plan (`../KOSplan.md`, adoption run 2026-07-04).

## Goal

The Automation Desk is an automated, faceless, English-language YouTube content factory
(see [PRD](../../docs/PRD.md)). This instance stores what the factory **learns**: craft
lessons distilled from owner rejections and analytics, experiment results, external
research, and the concepts/patterns behind them — so every future video starts smarter
than the last one. It fills the gaps the repo's canonical docs don't cover: there was no
lessons store, no research/experiments store, no glossary before KOS.

## Canonical map (in place — KOS points, never copies)

| What | Where | Note |
|------|-------|------|
| Decisions (ADR) | [docs/DECISIONS.md](../../docs/DECISIONS.md) | `D-NNN`, supersede-don't-delete. **KOS `decisions/` stays unused here** — one decision log per project |
| Progress journal | [docs/PROGRESS.md](../../docs/PROGRESS.md) | chronological; lessons distill insights *out of* it, never duplicate its timeline |
| Style canon | [STYLE_GUIDE](../../style/STYLE_GUIDE.md) · [VISUAL_IDENTITY](../../style/VISUAL_IDENTITY.md) · [MOTION_SPEC](../../style/MOTION_SPEC.md) · [CHANNEL](../../style/CHANNEL.md) | already well-sized leaf docs |
| Live facts + staleness | [facts.json](../../pipeline/shared/knowledge/facts.json) + `refresh-facts.mjs` | source-backed key-value facts with an automated auditor; KOS `research/` holds *narrative* findings only |
| Review rubric | [rubric.mjs](../../pipeline/shared/review/rubric.mjs) | scoring lives in code |
| Procedures | [.claude/skills/](../../.claude/skills/) | 15+ skills; KOS never stores workflows |
| Product & system docs | [docs/](../../docs/) (PRD, ARCHITECTURE, WORKFLOW, TOOLS, ROADMAP, SETUP) | system truth stays there |

## Knowledge sources (where new knowledge comes from)

- **Primary — external signals:** YouTube Studio analytics (CTR, retention, traffic
  sources), viewer comments, thumbnail A/B tests, external research.
- **Primary — pipeline outputs:** QA reports (`content/<id>/qa.report.json`),
  review-panel scores and insights (`review.json`), experiment results.
- **Internal harvest** (distill lessons *from* these; don't treat them as fresh
  signals): [docs/PROGRESS.md](../../docs/PROGRESS.md), agent auto-memory (graduate
  durable shareable facts per `../bootstrap/specs/architecture.md` §5),
  [docs/DECISIONS.md](../../docs/DECISIONS.md) context sections.
- **Secondary:** industry reports, competitor analysis, official platform/API docs
  (YouTube, Anthropic, …) — enter as sourced `research`.

## Local rules

- **Instance name:** `desk-knowledge` (this folder).
- **Decisions:** new decisions go to [docs/DECISIONS.md](../../docs/DECISIONS.md) —
  never into KOS `decisions/`.
- **Promotion to `canonical`:** owner call, no standing auto-promotion rule.
- **Validator:** `node scripts/knowledge-lint.mjs` (defaults to this instance; add
  `--fix` to regenerate backlinks + index listings). Run after every write to this
  folder. Wiring is **manual** at v1.0 — Stop-hook candidate once the instance is
  stable (per [ROADMAP](../../docs/ROADMAP.md)).
- **Language:** English, like all repo output.
- **Cadence:** write/update lessons after each video cycle (analytics, QA, owner
  feedback); monthly judgment sweep per `../bootstrap/specs/maintenance.md` §5.
- **Categories live lazily:** only `lessons/` exists as of 2026-07-04; create others
  on first note, per `../bootstrap/specs/architecture.md` §2.
