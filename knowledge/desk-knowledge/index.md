# desk-knowledge — index

The Automation Desk's knowledge instance (KOS). What the factory has **learned** —
lessons, experiments, research, concepts — as opposed to what it *is* (docs/) and *how
it works* (skills). Read [PROJECT.md](PROJECT.md) first for the canonical map (where
decisions, style, facts, and procedures already live — KOS points at them, never copies)
and for where new knowledge comes from. Authoring rules: follow
[the KOS standard](../bootstrap/SYSTEM.md); validate with
`node scripts/knowledge-lint.mjs --fix` after every write here.

## Map

- [PROJECT.md](PROJECT.md) — profile: goal, canonical map, knowledge sources, local rules
- [lessons/](lessons/index.md) — insights distilled from our own experience (owner
  rejections, incidents, analytics), each with Finding / Evidence / Decision

Other categories (`concepts/`, `patterns/`, `experiments/`, `research/`, `glossary/`,
`archive/`) don't exist yet — they are created the first time a note of that type
exists (create-on-demand; `decisions/` is permanently unused here, see PROJECT.md).
