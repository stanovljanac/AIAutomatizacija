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
- [concepts/](concepts/index.md) — the **visual vocabulary**: the subjects we've drawn 3+ times
  (the gate, the stamp, the agent, the pile, the sheet, the document, failure) — metaphors used,
  what landed, what the owner rejected, recurring elements, colors, proportions. Built bottom-up
  from `templates/hyperframes/scenes/`. **Input to [MOTION_SPEC §0](../../style/MOTION_SPEC.md),
  never a selector** — read before authoring a scene, then still conceive it fresh.
- [lessons/](lessons/index.md) — insights distilled from our own experience (owner
  rejections, incidents, analytics), each with Finding / Evidence / Decision
- [research/](research/index.md) — what external sources say (platform policies, tool
  landscapes, genre scans), every claim sourced with a retrieved-date

Other categories (`patterns/`, `experiments/`, `glossary/`, `archive/`) don't exist yet — they
are created the first time a note of that type exists (create-on-demand; `decisions/` is
permanently unused here, see PROJECT.md).
