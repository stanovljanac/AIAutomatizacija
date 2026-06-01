# scripts/colab

Notebooks for the GPU-heavy steps that don't fit the local 4GB GPU — run them on
free Colab/Kaggle GPU (see `docs/SETUP.md` §7). Inputs come from / outputs go back
to Google Drive.

## fish_speech_clone_test.ipynb — Phase 2 voice-clone smoke test

Clones the owner's voice from `voice/reference/owner-sample.wav` and speaks a
Serbian test paragraph, so we can decide by listening whether free TTS is good
enough for Serbian (PRD OQ1). Backend: **OpenAudio S1-mini** (open, free) via the
[fish-speech](https://github.com/fishaudio/fish-speech) repo.

### Before you run
1. Open https://colab.research.google.com/ → **File → Upload notebook** → pick this
   `.ipynb` (or open it from GitHub once pushed).
2. **Runtime → Change runtime type → GPU** (free T4 is fine).
3. Put `owner-sample.wav` on your Drive at `MyDrive/ai-glas/` (the notebook reads it
   from there; there's also an upload fallback in cell 2).

### What it does (run cells top to bottom)
1. GPU check · 2. mount Drive · 3. install fish-speech · 4. download the model ·
5. make a ~22s reference slice + you type its exact transcript and the target
Serbian sentence · 6–8. the 3-step inference (encode → text→tokens → decode) ·
9. play `fake.wav` inline and save `clone-test-fish.wav` to Drive.

The reference **transcript must match** what's actually said in the 22s slice —
that's the single biggest quality lever for zero-shot cloning.

### Interactive alternative (Gradio WebUI)
Instead of cells 6–8 you can launch the UI and experiment with text/reference:
```
!python tools/run_webui.py
```
On Colab a Gradio link is needed; if the UI doesn't auto-share, prefer the scripted
cells (they're more reliable on Colab and play the result inline).

### After: the decision
- **Sounds like you + natural Serbian** → proceed to full narration + forced
  alignment (`pipeline/02-voice`), and set `config.json → voice.provider`.
- **Bad Serbian / robotic** → try XTTS-v2 (separate notebook) and/or re-record a
  longer, louder sample; if all free options fail the listen test, the ElevenLabs
  paid fallback is the documented escape hatch (TOOLS §2, log in `DECISIONS.md`).

Commands follow the official inference docs (https://speech.fish.audio/inference/);
if a script path differs in a newer version, the notebook's *Rešavanje problema*
cell shows how to check the installed layout.
