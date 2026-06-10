---
name: screen-capture
description: Use for the mini-demo archetype — turn the script's capture-segment scenes into a precise OBS click-list with synthetic data that the owner records, then register the recordings so the render step can auto-zoom and caption them. Triggers on "capture plan", "record the demo", "screen capture", or the capture step of the workflow (Step 3, mini-demo only). The owner records; the agent never fabricates footage.
---

# Skill: Screen-capture plan (mini-demo)

For the **mini-demo** archetype, the trivial example is recorded on a real screen by
the owner. You produce the plan and register the result; you never invent footage.

## 1. Produce the click-list
From each `capture-segment` scene, write `captures/plan.md`:
- The exact app + a trivial example using **synthetic data** (fake names/companies —
  never real client data). Generate the sample file/data and put it in `captures/`.
- Numbered steps tied to the scene's narration sentences (so timing lines up), each
  step = one clear action ("click cell B2", "type =ARRAYFORMULA(...)", "press Enter").
- Keep it small: the point is the idea, not a full build. End-state should visibly
  "work" so the viewer believes it.

## 2. OBS setup (ready profile)
- Provide/confirm the OBS profile: target resolution (1920×1080), 30fps, the right
  capture source (Window vs Display), and **cursor highlight on**. (See `docs/SETUP.md`
  + `scripts/` for the profile.)
- Tell the owner exactly what window to capture and to record one clean take per
  `capture_id`, saving to `content/<id>/captures/<capture_id>.mp4`.

## 3. Register the captures
- Confirm each `capture_id` in the script has a matching file in `captures/`.
- Note the on-screen region to emphasize per step, so `video-render` can apply
  auto-zoom / highlight (the owner never edits). This is now a real, opt-in mechanism:
  set **`props.focalZoom`** on the `capture-segment` scene-plan entry — `{ target:{x,y} (0..1 =
  where the action is, e.g. the cursor/formula bar), scale:~1.4, in:"<cue word>", out:"<cue word>" }`
  — and the render punches into that region exactly when the narration names it, then pulls back.
  (See the `storyboard` skill.) Captions stay put (separate track).

## Output & status
- `captures/plan.md`, `captures/<capture_id>.mp4` (git-ignored), synthetic sample data.
- Set `brief.json.status: "captured"`.

The render step (`video-render`) plays each capture inside its `capture-segment` scene
window, with auto-zoom-to-cursor + highlight + burned-in captions.
