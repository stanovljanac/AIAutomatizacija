# CHANNEL_MAP — the territory (subject taxonomy)

> The map that was missing when **015** slipped through as a near-duplicate of **011**. Every idea
> gets a `subject: "branch/leaf"` coordinate so collisions are **visible** before we script. Human
> map here; machine mirror in [`pipeline/00-ideas/produced_subjects.json`](../pipeline/00-ideas/produced_subjects.json).
> Rationale: [`docs/DECISIONS.md` D-059](DECISIONS.md). Lanes (the *format* axis) live in
> [`style/CHANNEL.md` §2](../style/CHANNEL.md); this is the orthogonal *subject* axis.

## Channel identity

**"AI doesn't replace judgment. It removes the things that steal it."** — broad enough to cover
*doing* (Execution), not only *watching*. Everything on the channel is **AI Decision Automation**:
automate the **deciding** (which emails need you, which change matters, which job broke), keep the
human on the call that carries risk.

## The four branches

Under the root **AI Decision Automation**, an idea is one of four kinds of decision:

| Branch | The decision it automates | Example leaves (`branch/leaf`) |
| --- | --- | --- |
| **Attention** | *What deserves my attention right now?* | `attention/inbox`, `attention/notifications`, `attention/meetings` |
| **Change Detection** | *Did something I rely on change, and does it matter?* | `change-detection/policy`, `change-detection/pricing`, `change-detection/competitors`, `change-detection/docs` |
| **Failure Detection** | *Did something that should have happened not happen?* | `failure-detection/stopped-jobs`, `failure-detection/missing-sales`, `failure-detection/broken-flows` |
| **Execution** | *Do the routine action / produce the routine artifact.* | `execution/reports`, `execution/summaries`, `execution/actions`, `execution/data-cleaning` |

> A `subject` is always `branch/leaf`. Add a new leaf freely; add a new **branch** only with an
> owner decision (it reshapes the channel).

## Videos slotted

| Video | Subject | Series / lane | Note |
| --- | --- | --- | --- |
| **011** — Read My Inbox | `attention/inbox` | everyone-asks-ai | shipped; the inbox anchor |
| **016** — n8n Inbox Triage | `attention/inbox` | The AI Agent · ai-how-to | the *buildable* inbox teardown (deliberate cluster-mate of 011, not a dup) |
| **017** — Watch the Fine Print | `change-detection/policy` | The AI Agent (Ep. 1) · desk-notes | agent = a decision layer, not a scraper |
| ~~**015**~~ — Emails I Shouldn't Answer | ~~`attention/inbox`~~ | — | **RETIRED (D-059):** near-duplicate of 011; replaced by 017 |
| **019** — The Next-Word Engine | `llm-mental-model` | desk-notes | Short; an **explainer**, not a decision-automation slot — the coordinate is a bare leaf on purpose, since none of the four branches covers "how the tool itself works" (owner call, 2026-07-25) |
| **020** — Clean the Data First | `execution/data-cleaning` | everyone-asks-ai · desk-notes | Short; "write code → clean the mess underneath" seed; first Execution-branch slot |
| **021** — AI Can't See the Letters | `llm-mental-model` | Desk Lessons (Ep. 2) · desk-notes | long + Short; deliberate cluster-mate of 019, one rung further in (019 = how the next word is picked → 021 = what a "word" even is to the model). Signs off into Ep. 3, the context window |

**Open territory** (branches with no video yet): most of Change Detection, all of Failure
Detection, all of Execution. Bias new ideas here for reach without cannibalizing 011/016.

## How the guard uses this map

1. **Tag** each idea with a `subject` in `ideas.json` (optional field; [`ideas.schema.json`](../pipeline/shared/schemas/ideas.schema.json)).
2. **Register** a subject in `produced_subjects.json` when a video commits to it (keep it in sync
   with the table above).
3. **Pick time:** `pick-next.mjs --dry-run` prints a ⚠ **subject-collision warning** (never blocks —
   a same-subject video can be a deliberate cluster-mate; the warning just forces the "is this a
   *distinct* angle?" check). See [`pick-next.mjs`](../pipeline/00-ideas/pick-next.mjs).
4. **Script gate:** `seed-gate.mjs <id>` refuses to let a brief be scripted unless it carries an
   idea-pass `value_band` (and isn't `rejected`) — so a free-text seed can't skip the idea-pass into
   a script, the way 015 did. See [`seed-gate.mjs`](../pipeline/00-ideas/seed-gate.mjs).
