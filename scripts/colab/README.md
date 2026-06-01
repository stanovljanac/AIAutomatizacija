# scripts/colab

Notebooks for the GPU-heavy steps that don't fit the local 4GB GPU — run them on a
free Colab GPU (see `docs/SETUP.md` §7). Inputs come from / outputs go back to
Google Drive (`MyDrive/ai-glas/`).

## fish_speech_full_narration.ipynb — Phase 2 voice (the main one)

Clones the owner's voice from `owner-sample.wav` and speaks Serbian — first a 1-line
sanity check, then the full "Šta je AI" narration — so we can decide by listening
whether free TTS is good enough for Serbian (PRD OQ1, DECISIONS D-010).

Backend: **OpenAudio S1-mini** (`fishaudio/openaudio-s1-mini`, open & free, **gated**).

### One-time setup (before the first run)
1. Free HuggingFace account: https://huggingface.co/join
2. Accept the model: https://huggingface.co/fishaudio/openaudio-s1-mini → **Agree and
   access repository**.
3. Token (Read): https://huggingface.co/settings/tokens → copy `hf_...`.
4. In Colab: left sidebar → 🔑 **Secrets** → add `HF_TOKEN` = your token, enable
   *Notebook access*. (Persists across all your notebooks; you never paste it again.)
5. Put `owner-sample.wav` on Drive at `MyDrive/ai-glas/`.

### Run
Open from GitHub (File → Open notebook → GitHub → this repo →
`scripts/colab/fish_speech_full_narration.ipynb`), set Runtime → **GPU**, then
**Run all**. The model downloads once (~3.6 GB) and is **cached on Drive**; later
sessions just copy it (no re-download, no token needed).

### Why it's structured this way
- Colab runtimes are **ephemeral** — the VM is wiped on disconnect, so the
  fish-speech install (~3 min) repeats every session. The **model** does not
  re-download because it's cached on Drive.
- Cells are split (setup / model / params / sanity / full) so a failure is isolated
  and you re-run only that step. The **sanity** cell gives pass/fail in ~1 min before
  committing to the long generation.

### The working recipe (hard-won — keep these pins)
`git clone fish-speech` → `apt-get install portaudio19-dev` → `pip install -e .` →
`pip install torchvision==0.23.0 "transformers==4.57.3"`. Inference is the documented
3-step (encode ref → text→tokens → decode), driven by subprocess so long Serbian text
passes cleanly. (https://speech.fish.audio/inference/)

### Troubleshooting
- **`GatedRepoError 401`** → finish the one-time setup (accept model + `HF_TOKEN`).
- **`torchvision::nms does not exist`** → `pip install torchvision==0.23.0`.
- **tokenizer `NoneType ... encode`** → `pip install "transformers==4.57.3"`.
- **`pyaudio` build fails** → `apt-get install portaudio19-dev` then reinstall.
- **codec `FileNotFoundError`** → the model didn't download (see the model cell's
  printed reason — usually the gating/token).

### After: the decision
- **Natural Serbian on the full narration** → implement `pipeline/02-voice`
  (continuous TTS + forced alignment) and set `config.json → voice`.
- **Bad Serbian / robotic** → ElevenLabs paid fallback (TOOLS §2 / D-003).
- Voice disguise (pitch/formant via the `SHIFTS` param) only if the owner dislikes
  their own voice after hearing the full take.

## fish_speech_clone_test.ipynb — minimal smoke test (kept for reference)
The original step-by-step single-sentence clone. Superseded by the sanity cell in the
full-narration notebook; kept as the smallest reproducible example.
