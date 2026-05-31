# pipeline/

The code, organized as numbered phases. Each phase reads the previous phase's
files from `content/<id>/` and writes its own (the "pipeline contract" in
`docs/ARCHITECTURE.md` §4). Phases are idempotent, resumable, and cached.

| Phase | Purpose | Driven by skill |
|-------|---------|-----------------|
| 00-topic   | Discover/validate topic; research facts → brief.json, sources.md | WORKFLOW Step 0 |
| 01-script  | Write + review script → script.json, script.review.json | script-writing, script-review, translation-localization |
| 02-voice   | Continuous TTS + forced alignment → narration.wav, alignment.json | voice-synthesis |
| 03-visuals | Storyboard → prompts → assets → storyboard.json, visual-prompts.json, images/ | storyboard, visual-prompts |
| 04-render  | Assemble in Remotion → video/final.mp4 | video-render |
| 05-qa      | Automated sync/subtitle/scene QA → qa.report.json | qa-video |
| 06-publish | Metadata + thumbnail + draft upload → publish.json | youtube-publish |

`shared/` holds config, JSON schemas, and utilities used by all phases.

> Code is added phase-by-phase per `docs/ROADMAP.md`. Until then these folders
> hold this contract description and (soon) the implementation.
