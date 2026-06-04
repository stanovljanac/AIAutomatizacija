# VISUAL IDENTITY

The channel's look, locked **once** and reused for every video (this is what makes the
visual side automatable). Lock the bracketed values in Phase 2; until then the defaults
below are sane starting points for a clean, modern, dark software-tutorial style.

> Reference feel: a sharp dev tool's UI — calm dark background, one accent color,
> confident motion, real captures with zoom/highlight, code-drawn diagrams, crisp
> kinetic typography. No cinematic Hollywood video. (DECISIONS D-013, D-015.)

---

## 1. Brand essence

- **Mood:** modern, clean, techy, trustworthy. Dark theme, high contrast.
- **Not:** cluttered, neon-overload, meme-y, stocky/corporate, AI-art "slop".
- **Feeling:** "the lazy-smart engineer's workspace" — orderly, confident, readable.

## 2. Color palette  *(lock in Phase 2)*

| Role | Default | Final |
|------|---------|-------|
| Background (base) | `#0B0F14` | `[___]` |
| Surface / card | `#151B23` | `[___]` |
| Primary text | `#F2F5F8` | `[___]` |
| Secondary text | `#9AA7B2` | `[___]` |
| Accent (primary) | `#4F8CFF` (electric blue) | `[___]` |
| Accent (secondary) | `#22D3A7` (mint) | `[___]` |
| Warning/highlight | `#FFB020` | `[___]` |
| Error/red | `#FF5C5C` | `[___]` |

One primary accent used consistently; secondary only for contrast moments. Keep
≥ 4.5:1 contrast for any on-screen text.

## 3. Typography  *(lock in Phase 2)*

| Use | Default font | Final |
|-----|--------------|-------|
| Headlines / on-screen text | Inter / Satoshi (bold) | `[___]` |
| Body / subtitles | Inter (medium) | `[___]` |
| Mono / code / diagrams | JetBrains Mono | `[___]` |

- Subtitles: large, bold, high-contrast, **word/line highlight** as spoken (English).
- On-screen text lines: ≤ ~6 words, big, centered or lower-third.
- Fonts in `assets/fonts/` (commit only if license allows redistribution).

## 4. Motion language

- **Easing:** smooth ease-in-out; ~0.3–0.6s transitions; nothing jarring.
- **Scene transitions:** crossfade or subtle slide/scale; a quiet "whoosh" sfx is the
  only audio garnish (no music on long-form).
- **Screen captures:** never static — slow zoom (Ken Burns), pan to the relevant area,
  highlight box / cursor spotlight on what matters (auto-applied at render).
- **Diagrams:** nodes/edges **draw on** progressively as narrated (code-defined).
- **Kinetic typography:** words animate in on emphasis; key term pops/underlines.
- **Pacing:** a visual change every ~3–7s, always snapped to sentence boundaries (sync).

## 5. Scene vocabulary → reusable components

Each `script.json` scene's `template` maps to one data-driven component (props from
`render/props.json`). Built in Phase 2 under `templates/remotion/src/` (or the chosen
engine):

| `template` | Component | Used by |
|-----------|-----------|---------|
| `hook-card` | `HookCard` | all |
| `section-header` | `SectionHeader` | all |
| `bullet-steps` | `BulletSteps` | Ideas, Mini-demo |
| `stat-callout` | `StatCallout` | Ideas, Comparison |
| `term-highlight` | `TermHighlight` | all |
| `comparison-table` | `ComparisonTable` | Comparison |
| `diagram` | `Diagram` (code-drawn, animated) | Diagram |
| `code-block` | `CodeBlock` | Mini-demo, Diagram |
| `capture-segment` | `ScreenCapture` (zoom/highlight) | Mini-demo |
| `lower-third` | `LowerThird` | all |
| `transition` | `Transition` (+ whoosh sfx) | all |
| `cta-card` | `CtaCard` (subscribe) | all |

Plus the always-on: `Intro` / `IntroShort`, `Outro` / `OutroShort`, `Subtitles`,
`BackgroundFX` (subtle dark gradient/grid), `ThumbnailTemplate`.

### 5.1 Dynamic visuals (D-022)
- **Icons:** `src/icons/Icon.tsx` — a flat, on-brand line+accent set (spreadsheet, email,
  calendar, invoice, document, clock, ai, person, desk, factory, gear, chart, money, check,
  flag, magnifier, coffee, bell…). Extend it; keep them simple.
- **Dynamic templates:** **`flow`** (input → process → output with icons) and **`icon-list`**
  (rows reveal with an icon as the voice names them). Plus **bespoke illustration scenes**
  in `src/custom/` (e.g. `HandCopy`, `AiFlow`, `ChaosX`, `DeskScene`) — used via `template:"custom"`.
- **Reveal-sync:** sub-elements appear in step with the narration (alignment-driven). Text-
  heavy beats must reveal or split — never a static hold.
- **Continuity:** one persistent `BackgroundFX` in `Main`; every scene renders **transparent**
  and crossfades (~9 frames) via `SceneWrapper`. No per-scene backgrounds.

## 6. Layout & safe areas

- **Long (16:9):** 1920×1080, 30fps. Text inside 90% safe area.
- **Short (9:16):** 1080×1920, 30fps. Captions in the middle-upper third.
- Consistent margins; don't crowd edges.

## 7. Intro / outro spec  *(finalize in Phase 2)*

- **Intro (long):** wordmark "The Automation Desk" + tagline, ≤ 3s, accent animation,
  then straight into the hook. **No music** (sound-design hit only).
- **Outro (long):** "subscribe / next video" card + brand, ~5s. **No music.**
- **Short variants:** tighter, vertical, ≤ 1.5s intro, minimal outro; **light music ok**.

## 8. Music & audio aesthetic

- **Long-form: no music.** Clean AI voice + subtle sound-design (transition whooshes,
  soft UI ticks). The narration is the star.
- **Shorts: light music** allowed (energy/retention), kept subtle and on-brand.
- Source: YouTube Audio Library / Pixabay Music (free). Never bury the voice.

## 9. Thumbnail system  *(lock in Phase 2)*

- Dark brand background + one focal element (a clean icon, a cropped UI, or a bold
  graphic — no AI-art clutter).
- 1–4 word **English** phrase, huge, high contrast, brand font.
- Consistent accent + layout so the channel is recognizable in the feed.
- Built as a Remotion still (`ThumbnailTemplate`); **2 variants per video**, owner picks.

## 10. How to lock this (Phase 2 task)

1. Decide the palette/fonts and the 3–4 recurring motion patterns.
2. Fill every `[___]` above and finalize §7/§9.
3. Build the §5 components to match (after the engine bake-off, D-019).
4. After locking, the visual side is automated — no per-video style decisions.
