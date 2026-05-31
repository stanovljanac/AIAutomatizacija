# STYLE GUIDE (writing law)

This is the law for every word the channel publishes. The script-writing skill
follows it; the script-review skill enforces it. When in doubt, this file wins.
Language of output: **Serbian**. (This guide is in English per D-009.)

---

## 1. Voice & tone

**Persona:** a knowledgeable older brother/colleague who actually uses these tools
and explains them to you. Clear, warm, confident, a little informal — but
professional and accurate. Think "Fireship/MKBHD energy, in Serbian, calmer."

- Serious enough to be trusted on technical topics; relaxed enough to be watchable.
- Never stiff/academic. Never clickbait-hyper. Never condescending.
- Speak **to one person** ("ti"/"ti"-form, second person), not a crowd.
- Confidence without arrogance: explain, don't lecture.

## 2. The hard rules (non-negotiable — from PRD R6–R9)

1. **No invented words.** Every word must be a real Serbian word or an accepted
   loanword listed in `style/TERMBANK.md`.
2. **No needless jargon to sound smart.** If a simpler word carries the meaning,
   use it. Define a term the first time it appears.
3. **No English-spelled-as-Serbian when a clean Serbian word exists.** The term
   bank decides. Accepted loanwords (e.g. *prompt, token, embedding→embedovani*)
   are fine; random anglicisms are not.
4. **Clear, fluent, calm pacing.** Short-to-medium sentences. One idea per
   sentence. The viewer must clearly *hear* every fact.
5. **Scene-segmented.** Write so the script maps to scenes (see §6) — this is what
   lets visuals/audio sync downstream.
6. **Factual.** Every claim traces to `sources.md`. No making things up. If unsure,
   soften or cut.

## 3. Sentence & rhythm guidelines

- Prefer 8–18 word sentences for narration; vary length for rhythm.
- One concept per sentence — the alignment step splits on sentences, so a sentence
  is also a *timing unit*. Don't cram.
- Read it aloud mentally: if you'd stumble, rewrite.
- Avoid long subordinate-clause chains; break them up.
- Numbers: say them naturally ("oko sto miliona", not "100.000.000" in narration).
- Spell out the first mention of an acronym, then use it.

## 4. Originality & sourcing (from PRD R1–R5, D-002)

- We use sources for **topics and facts only**. We never translate or paraphrase
  someone's sentences. The script is written from the *facts* in `sources.md`, in
  our own structure and words.
- No YouTube transcripts as text input (ToS/derivative risk, D-002).
- If the video is about someone's **strictly original IP** (e.g. reviewing their
  named skill/tool), the publish step asks whether to credit them (PRD R4). Most
  videos won't need this.
- Tool screenshots/recordings are of **our own** sessions.

## 5. Structure for retention (long video, 7–10 min)

A reliable high-retention shape:

1. **Hook (0:00–0:15)** — the payoff/promise or a sharp question. No long intro.
   State what the viewer will be able to do/understand by the end.
2. **Intro/orient (15–40s)** — quick framing + tiny channel ident (not a long
   sting). Optionally "do kraja videa ćeš znati …".
3. **Body (the points/demos)** — 3–6 segments. Each: claim → why it matters →
   show it (capture/visual) → one-line takeaway. Use mini-cliffhangers to bridge
   ("ali tu ima jedna caka…").
4. **Payoff/summary** — tie it together; the single thing to remember.
5. **CTA (subtle)** — one ask (subscribe / next video). Not begging.
6. **Outro** — short, branded.

Keep momentum: no dead air, no "uhm, dakle, u ovom videu ćemo…". Cut filler.

## 6. Writing in scenes (how to format)

The script is authored as scenes (schema:
`pipeline/shared/schemas/script.schema.json`). For each scene write:

- `role`: hook | intro | point | demo | transition | cta | outro
- `narration`: the exact words spoken (clean Serbian, obeys §2).
- `sentences`: the narration split into individual sentences (timing units).
- `visual_intent`: plain-language "what's on screen" (the storyboard expands this).
- `on_screen_text`: optional short kinetic-typography line (≤ ~6 words).
- `screen_capture`: id if this scene shows a real tool recording.

Guideline: a scene is usually 1–4 sentences / ~5–20 seconds. A *point* may span a
couple of scenes (e.g. claim scene + demo scene). Don't write a 60-second wall of
narration as one scene.

## 7. Shorts style

- 20–55 seconds, one idea, fast hook in the first 2 seconds.
- Either a key beat lifted from a long video's script, or a standalone news bite.
- Narration only (no music over narration); punchy on-screen text.
- End with a reason to follow / watch the full video.

## 8. Titles, descriptions, thumbnails (SEO) — see also CHANNEL.md

- **Titles:** Serbian, clear benefit/curiosity, front-load keywords, avoid pure
  clickbait. ≤ ~60 chars where possible.
- **Descriptions:** first 1–2 lines carry the hook + main keywords; then a short
  paragraph; then timestamps and links. Natural keyword use, no stuffing.
- **Thumbnail:** big readable Serbian phrase (≤ 3–4 words), high contrast, one
  focal idea; consistent brand look (VISUAL_IDENTITY.md).
- The human reviews title/description/tags before publishing (keyword + SEO pass).

## 9. Things to avoid (quick blacklist)

- Filler: "u suštini", "kao", "u stvari" (overused), "dakle" as a crutch.
- Hype with no substance: "ovo će vam promeniti život", "ludilo", "šok".
- Invented or half-translated words; inconsistent terms (use the term bank).
- Reading walls of text on screen; tiny unreadable screenshots.
- Begging for engagement; multiple CTAs.
- Claims not backed by `sources.md`.

## 10. Self-check the review agent runs (mirror in script-review skill)

- [ ] Hook lands in ≤ 15s and promises a payoff.
- [ ] Every claim maps to a fact in `sources.md`.
- [ ] No invented words; terms match `TERMBANK.md`.
- [ ] Sentences are clean timing units; no over-long scenes.
- [ ] Tone = knowledgeable older brother, not stiff, not hype.
- [ ] Scene roles present and ordered sensibly.
- [ ] One subtle CTA; short branded outro.
- [ ] Reads fluently aloud at a calm pace.
