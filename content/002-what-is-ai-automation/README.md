# _TEMPLATE

Skeleton for one video. `/novi-video` copies this into `content/<NNN>-<slug>/`.
Files get filled as you walk `docs/WORKFLOW.md`:

brief.json (archetype + angle) [GATE ①]
→ script.json (+ script.review.json) [GATE ②]
→ voice/narration.wav + alignment.json
→ scene-plan.json (+ visual-prompts.json; captures/ for mini-demos)
→ render/props.json + video/final.mp4 + short.mp4 + thumb_a/b.png
→ qa.report.json (+ digest) [GATE ③]
→ publish.json → published

Media folders (voice, images, captures, render, video) are git-ignored.
`script.sample.json` is a tiny valid example used by the SETUP smoke test.
