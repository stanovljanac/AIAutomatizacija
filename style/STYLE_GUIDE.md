# STYLE GUIDE (writing law)

This is the law for every word the channel publishes. The script-writing skill
follows it; the script-review skill enforces it. When in doubt, this file wins.
**Language of output: English.**

> **Numeric/structural knobs live in the FORMAT recipe**, not in this prose:
> `pipeline/shared/formats/default.json` (resolved by `pipeline/shared/lib/format.mjs`) owns hook
> length (`hook.target_seconds`), the answer-first window (`hook.answer_first_seconds`), pacing,
> length targets, caption density, and the per-archetype beat skeleton (`archetype_structure`). This
> file keeps the *taste* (voice, originality, what makes a good hook); the recipe keeps the *numbers*.
> If they ever disagree, the recipe wins on numbers — update it in one place.

---

## 1. Voice & tone

**Persona:** a **sharp, practical engineer who also teaches warmly** — someone who
actually automates dull work and shows you the lazy-smart shortcut. Clear, confident,
a little dry wit; beginner-accessible but never dumbed-down. "Show the trick, respect
the viewer's time."

- Practical over theoretical: lead with the payoff, then the how.
- Warm and plain-spoken; explain a term the first time it appears.
- No hype, no clickbait energy, no "this will change your life."
- Speak **to one person** ("you"), like a colleague at the next desk.
- Confidence without arrogance: demonstrate, don't lecture.

## 2. The hard rules (non-negotiable — from PRD R1–R12, D-018)

1. **Original human angle, every video.** Each script states a genuine point of view,
   experience, or opinionated take (owner-approved). No generic, faceless info-dump.
2. **Ideas + minimal example.** We show the idea on a tiny case, then say "scale this
   to your own process." We do not build full production systems on screen.
3. **Accuracy, hybrid by type.** Comparisons/stats trace to `sources.md`. Demos must
   actually work (with **synthetic data** — fake names/companies, never real client
   data). Pure-conceptual ideas are clearly framed as ideas, not as tested fact.
4. **Clear, calm pacing.** Short-to-medium sentences. One idea per sentence — the
   alignment step splits on sentences, so a sentence is also a timing unit.
5. **Scene-segmented with template tags.** Write so the script maps to scenes and each
   scene names its render `template` (see §6).
6. **No reproduced sentences / no transcripts.** Sources give facts and topics only (D-002).

## 3. Sentence & rhythm guidelines

- Prefer 8–18 word sentences for narration; vary length for rhythm.
- One concept per sentence — don't cram (it's a timing unit).
- Read it aloud mentally: if you'd stumble, rewrite. Avoid long subordinate chains.
- Numbers spoken naturally ("about a hundred rows", not "100").
- Spell out an acronym on first use, then use it.
- Write for an AI voice: avoid tongue-twisters and ambiguous homographs.

## 4. Originality & sourcing (PRD R1–R6, D-002)

- Sources are for **topics and facts only**; never translate or paraphrase someone's
  sentences. Build from the *facts*, in our own structure and words.
- No YouTube transcripts as input.
- Tool screenshots/recordings are of **our own** sessions, with synthetic data.
- If a video is about someone's **strictly original IP** (a named tool we're reviewing),
  the publish step asks whether to credit them (PRD R4-legacy). Most videos won't need it.

## 5. Structure for retention (per archetype)

Every archetype: **hook in ≤ 10s** (the payoff/promise or a sharp question), no long
intro, end with **one subtle CTA (subscribe)** + a short branded outro. The original
angle should surface early (in or right after the hook).

**Open on the idea, not the anecdote (owner rule, 2026-07-12).** When the video carries a
reframe, the **thesis/reversal is the hook** — lead with it so the curiosity gap opens on
line one; the personal "my thing happened" is the *transition into* the story, not the
opener. `"The most dangerous automation isn't the one that crashes… it's the one that keeps
going. Mine crashed last month."` beats `"My thing crashed. Best thing it ever did."` (a
predictable setup the viewer can finish for you). A bookend refrain is fine — transform the
**question** by the end (e.g. "does it work?" → "will it tell me?"), don't just repeat the line.

**Speak the viewer's language, not the engineer's (owner rule, 2026-07-12).** Say what the
viewer *thinks*, not our internal names: "the wrong way vs the right way", "silent vs loud" —
never "Pipeline A / Pipeline B", "the orchestrator", "the retry handler". The audience doesn't
model our architecture; they model their own risk.

**Symbol on screen, plain language in voice (owner rule, 2026-07-12).** Error codes and
technical values belong **on screen, not in the narration** — the VO says "the model went
down / it waited longer each time" while the frame shows `503` and the doubling bars. Viewers
don't care about the code; the symbol does the specificity, the voice stays human.

- **Ideas/Listicle (5–7m):** hook → quick framing → N items, each: idea → why it's
  worth money/time → tiny illustration → one-line takeaway → "scale it" close.
- **Mini-demo (3–5m):** hook → the boring task stated → do the trivial example on
  screen (capture) → "here's how you'd scale it to real volume" → close.
- **Diagram/Architecture (5–8m):** hook → build the diagram piece by piece while
  narrating → walk the flow end to end → caveats → close.
- **Comparison (6–10m):** hook → the contenders + criteria → comparison table → honest
  verdict (with the angle) → "pick X if…, pick Y if…" → close.

Keep momentum: no dead air, no "um, so, in this video we'll…". Cut filler.

## 6. Writing in scenes (how to format)

The script is authored as scenes (schema:
`pipeline/shared/schemas/script.schema.json`). For each scene write:

- `role`: hook | intro | point | demo | transition | cta | outro
- `template`: the render component (e.g. `hook-card`, `bullet-steps`, `stat-callout`,
  `comparison-table`, `diagram`, `code-block`, `capture-segment`, `lower-third`,
  `cta-card`) — see `style/VISUAL_IDENTITY.md` for the vocabulary.
- `narration`: the exact words spoken (clean English, obeys §2).
- `sentences`: the narration split into individual sentences (timing units).
- `on_screen_text`: optional short kinetic line (≤ ~6 words).
- `capture_id`: id if this scene is a real screen recording (mini-demo only).

Guideline: a scene is usually 1–4 sentences / ~5–20 seconds. Don't write a 60-second
wall of narration as one scene.

## 7. Shorts style

- **Length (canonical — other docs link here):** ~50–60 seconds, one idea, fast hook in the
  first 2 seconds. Go longer only if the material justifies it — **hard max 2:00**. Never pad
  to hit a length. (Config: `short_seconds: 55`, `short_seconds_max: 120`.)
- A key beat lifted from a long video, or a standalone idea.
- Punchy on-screen text; **light music allowed** (unlike long-form).
- End with a reason to follow / watch the full video.

## 8. Titles, descriptions, thumbnails (SEO) — see also CHANNEL.md

- **Titles:** English, clear benefit/curiosity, front-load the search keyword, avoid
  pure clickbait. ≤ ~60 chars where possible.
- **Front the symbol, not the abstraction (owner rule, 2026-07-12).** When the video has a
  concrete villain/symbol, name it in the title/thumbnail — people remember a symbol, not an
  abstract principle. "Never Trust the Green Checkmark" beats "The Most Dangerous Automation
  Isn't the One That Fails"; the green checkmark is the thing they'll recall and repeat.
- **Descriptions:** first 1–2 lines carry the hook + main keyword; then a short
  paragraph; then chapters/timestamps and links. Natural keyword use, no stuffing.
- **Thumbnail:** big readable phrase (≤ 3–4 words), high contrast, one focal idea;
  consistent brand look (VISUAL_IDENTITY §9); **2 variants**, owner picks.
- The owner reviews title/description/tags before publishing.

## 9. Things to avoid (quick blacklist)

- Filler: "basically", "literally", "in this video we'll…", "without further ado".
- Hype with no substance: "this will change your life", "insane", "mind-blowing".
- **Announced honesty (owner rule, 2026-07-07):** "now the honest part", "to be honest",
  "honestly", "let me be real". The honest-catch beat opens **directly on the strongest
  limitation** ("It won't ship you a startup…") — honesty is shown by content, never
  announced. Vary the beat's phrasing per video; no stock beat-opener repeats across videos.
  (Exception: "Unsexy — that's the point." is the **kept series signature** of the
  `everyone-asks-ai` lane only — deliberate, owner-approved; don't use it outside that lane.)
- Pretend authority: don't claim a concept is tested if it's just an idea (§2.3).
- **Engineer jargon / spoken error codes (owner rule, 2026-07-12):** internal labels the
  viewer doesn't share ("Pipeline A/B", "the orchestrator") and read-aloud codes/values
  ("five-oh-three", "two, four, eight seconds"). Use viewer language; put the code on screen.
- **Predictable hook setups:** a hook whose second beat the viewer can finish for you
  ("My thing broke." → "…best thing that happened", everyone sees it coming). Open on the
  reframe instead (§5).
- Walls of text on screen; tiny unreadable screenshots.
- Begging for engagement; multiple CTAs.
- Any real client data; any claim a Comparison can't back from `sources.md`.

## 10. Self-check the review agent runs (mirror in script-review skill)

- [ ] Hook lands in ≤ 10s and promises a payoff.
- [ ] **An original human angle is present** and surfaces early.
- [ ] Accuracy rule for the archetype is met (sources for comparisons/stats; demos use
      synthetic data; concepts framed as ideas).
- [ ] Sentences are clean timing units; no over-long scenes.
- [ ] Every scene has a valid `template` tag and sensible role order.
- [ ] Tone = sharp practical engineer + warm teacher; no hype, no filler.
- [ ] One subtle CTA (subscribe); short branded outro; "scale it" close where relevant.
- [ ] Reads fluently aloud at a calm pace for an AI voice.
