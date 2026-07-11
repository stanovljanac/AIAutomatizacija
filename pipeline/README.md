# pipeline/

The code, organized as numbered phases. Each phase reads the previous phase's files
from `content/<id>/` and writes its own (the "pipeline contract" in
`docs/ARCHITECTURE.md` §4). Phases are idempotent, resumable, and cached.

| Phase | Purpose | Driven by skill |
|-------|---------|-----------------|
| 00-ideas   | Idea-bank (scored, multi-tagged) + scaffold → ideas.json, brief.json | WORKFLOW Step 0 |
| 01-script  | Write + review script (archetype + angle) → script.json, script.review.json | script-writing, script-review |
| 02-voice   | Continuous edge-tts + forced alignment → narration.wav, alignment.json | voice-synthesis |
| 03-visuals | Scene-plan (templates) + thumbnails + demo captures → scene-plan.json, visual-prompts.json, captures/ | storyboard, visual-prompts, screen-capture |
| 04-render  | Assemble via engine → video/final.mp4 + short.mp4 | video-render |
| 04b-thumbnails | 3 caption-free candidate stills from the video's own timeline (scored, owner picks) → images/thumb_candidate_*.png, thumb_candidates.json | video-render / visual-prompts (fallback prompts) |
| 05-qa      | Auto sync/legibility QA (auto-fix technical, flag content) + digest → qa.report.json | qa-video |
| 06-publish | EN SEO + chapters + Short + publish.json & publish.md (reviewed at the publish stage; owner uploads manually, D-055) | youtube-publish |

`shared/` holds config, JSON schemas, and the validator used by all phases.

> `translation-localization` is retired (single language). Storyboard is now an
> automatic scene-plan (fixed templates → no human gate). Code is added phase-by-phase
> per `docs/ROADMAP.md`.
