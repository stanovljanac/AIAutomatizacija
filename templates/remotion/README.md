# Remotion template

The reusable, data-driven video project. A single composition renders any video
from `render/props.json` (built by the video-render skill from script.json +
alignment.json + storyboard.json + assets).

## Build order (Phase 1 then Phase 3)
- Phase 1: get `npx remotion studio` running; render a 10s TestComposition
  (intro → one KineticText scene → outro) with a dummy audio + one subtitle line.
- Phase 3: build the branded components to match `style/VISUAL_IDENTITY.md`.

## Components (src/) — to implement
- Root.tsx          registers compositions (Main long, MainShort, Thumbnail, Test)
- Main.tsx          maps props.scenes → scene components, places them in time
- Intro.tsx / IntroShort.tsx
- Outro.tsx / OutroShort.tsx
- Subtitles.tsx     burned-in animated captions from alignment.json (wordHighlight)
- KineticText.tsx   on-screen kinetic typography
- ScreenCapture.tsx frames a recording with zoom/pan/highlight
- ImagePan.tsx      Ken Burns / parallax for stock & AI images
- LowerThird.tsx    name/term callouts
- ChapterCard.tsx   segment title cards
- BackgroundFX.tsx  subtle animated dark gradient/grid
- ThumbnailTemplate.tsx  reproducible thumbnail still

## Timing contract (critical — ARCHITECTURE §6)
Each scene is shown from `scene.start` to `scene.end` (seconds), which come from
`alignment.json` (first/last sentence of that scene). Subtitles use the same
alignment timings. The audio (`voice/narration.wav`) plays continuously and is
NEVER cut. Convert seconds→frames with `Math.round(t * fps)`.

## Install / run (see docs/SETUP.md)
    npm install
    npx remotion studio
    npx remotion render Main out/final.mp4 --props=../../content/<id>/render/props.json
