# _TEMPLATE

Skeleton for one video. `/novi-video` copies this into `content/<NNN>-<slug>/`.
Files get filled as you walk `docs/WORKFLOW.md`:

brief.json → sources.md → script.json (+ script.review.json) → [GATE 1]
→ voice/narration.wav + alignment.json → storyboard.json [GATE 2]
→ visual-prompts.json + images/ + captures/ → render/props.json + video/final.mp4
→ qa.report.json [GATE 3] → publish.json → published

Media folders (voice, images, captures, render, video) are git-ignored.
