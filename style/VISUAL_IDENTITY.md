# VISUAL IDENTITY

The channel's look, locked **once** and reused for every video (this is what makes
the visual side automatable). Fill the bracketed values in Phase 3 from your
reference screenshots; until then, the defaults below are sane starting points
matching the reference channels' clean, modern, dark explainer style.

> Reference style (from your example videos): clean dark UI, real tool footage with
> zoom/highlight, crisp kinetic typography, chapter structure, no cinematic
> Hollywood video. We replicate that feel. (DECISIONS D-004)

---

## 1. Brand essence

- **Mood:** modern, clean, techy, trustworthy. Dark theme. High contrast.
- **Not:** cluttered, neon-overload, meme-y, stocky/corporate.
- **Feeling on screen:** "a sharp dev tool's UI" — calm dark background, one
  accent color, confident motion.

## 2. Color palette  *(lock in Phase 3)*

| Role | Default | Final |
|------|---------|-------|
| Background (base) | `#0B0F14` (near-black) | `[___]` |
| Surface / card | `#151B23` | `[___]` |
| Primary text | `#F2F5F8` | `[___]` |
| Secondary text | `#9AA7B2` | `[___]` |
| Accent (primary) | `#4F8CFF` (electric blue) | `[___]` |
| Accent (secondary) | `#22D3A7` (mint) | `[___]` |
| Warning/highlight | `#FFB020` | `[___]` |
| Error/red | `#FF5C5C` | `[___]` |

Use **one** primary accent consistently; secondary only for contrast moments.
Keep ≥ 4.5:1 contrast for any on-screen text.

## 3. Typography  *(lock in Phase 3)*

| Use | Default font | Final |
|-----|--------------|-------|
| Headlines / on-screen text | Inter / Satoshi (bold) | `[___]` |
| Body / subtitles | Inter (medium) | `[___]` |
| Mono / code | JetBrains Mono | `[___]` |

- Subtitles: large, bold, high-contrast, **word/line highlight** as it's spoken.
- On-screen text lines: ≤ ~6 words, big, centered or lower-third.
- Put fonts in `assets/fonts/` (only commit if license allows redistribution).

## 4. Motion language (how things move)

- **Easing:** smooth ease-in-out; nothing snappy/jarring. ~0.3–0.6s transitions.
- **Scene transitions:** crossfade or subtle slide/scale; avoid flashy wipes.
- **Screenshots/recordings:** never static — apply slow zoom (Ken Burns), pan to
  the relevant area, and a highlight box/cursor spotlight on what matters.
- **AI images:** add a slow parallax / 2.5D camera move so they feel cinematic
  (this is how we get a dynamic look without true generative video).
- **Kinetic typography:** words animate in on emphasis; key term pops/underlines.
- **Pacing:** a visual change roughly every 3–7 seconds to hold attention, but
  always snapped to sentence boundaries (sync, ARCHITECTURE §6).

## 5. Reusable Remotion components (built in Phase 3)

Located in `templates/remotion/src/`. Each is data-driven (props from
`render/props.json`):

- `Intro` (long) and `IntroShort` — brief branded sting (≤ 3s).
- `Outro` (long) and `OutroShort` — CTA + brand.
- `Subtitles` — burned-in animated captions from `alignment.json`.
- `KineticText` — on-screen text lines.
- `ScreenCapture` — frames a recording with zoom/pan/highlight.
- `ImagePan` — Ken Burns / parallax for stock & AI images.
- `LowerThird` — name/term callouts.
- `ChapterCard` — segment title cards.
- `BackgroundFX` — subtle animated dark gradient/grid (brand backdrop).

## 6. Layout & safe areas

- **Long (16:9):** 1920×1080, 30fps. Keep text inside 90% safe area.
- **Short (9:16):** 1080×1920, 30fps. Captions in the middle-upper third (above UI).
- Consistent margins; don't crowd edges.

## 7. Intro / outro spec  *(finalize in Phase 3)*

- **Intro (long):** logo/wordmark + 3-word tagline, ≤ 3s, accent animation, then
  straight into the hook. No long musical sting.
- **Outro (long):** "pretplati se / sledeći video" card + brand, ~5s, light music
  allowed here.
- **Short variants:** tighter, vertical, ≤ 1.5s intro, minimal outro.

## 8. Music & audio aesthetic

- Music **only** on intro/outro (and not over narration). Source: YouTube Audio
  Library / Pixabay Music (free). Keep it subtle and on-brand (clean/techy).
- Narration is the star; never bury it.

## 9. Thumbnail system  *(lock in Phase 3)*

- Dark brand background + one focal element (a screenshot crop, an icon, or a
  bold face/emoji-free graphic).
- 1–4 word Serbian phrase, huge, high contrast, brand font.
- Consistent accent color and layout so the channel is recognizable in the feed.
- Built as a Remotion still (`ThumbnailTemplate`) so it's reproducible.

## 10. How to lock this (Phase 3 task)

1. Collect 5–10 screenshots from the reference videos you like.
2. Extract the palette, fonts, and the 3–4 recurring motion patterns.
3. Fill every `[___]` above and finalize §7/§9.
4. Build the Remotion components in §5 to match.
5. After locking, the visual side is automated — no per-video style decisions.
