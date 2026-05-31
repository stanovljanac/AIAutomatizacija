# SETUP (Windows)

Install everything from zero on a Windows PC and configure the project. Written
for someone who has never set this up. Commands assume **PowerShell**.

> Hardware note: this PC (GTX 1050Ti 4GB VRAM, 16GB RAM) is the **orchestrator**.
> GPU-heavy steps (TTS, AI images) run on **free cloud GPU** (Colab/Kaggle), not
> here. See `docs/ARCHITECTURE.md` §7.

---

## 0. Prerequisites overview

You'll install: Git, Node.js (LTS), Python 3.11+, FFmpeg, OBS Studio, Audacity,
and the project's Node/Python deps. Plus free accounts: Google (Colab + YouTube
API), Kaggle, Pexels, Pixabay. Optional later: ElevenLabs.

---

## 1. Core tools

### Git
- Install: https://git-scm.com/download/win
- Verify: `git --version`

### Node.js (LTS) — for Remotion & pipeline scripts
- Install LTS: https://nodejs.org/ (or `winget install OpenJS.NodeJS.LTS`)
- Verify: `node --version` (want ≥ 20), `npm --version`

### Python 3.11+ — for alignment & helper scripts
- Install: https://www.python.org/downloads/ (check "Add python.exe to PATH")
- Verify: `python --version`, `pip --version`

### FFmpeg — audio/video processing (Remotion & QA use it)
- `winget install Gyan.FFmpeg` (or download static build, add to PATH)
- Verify: `ffmpeg -version`

### OBS Studio — screen capture for tool demos
- https://obsproject.com/ — verify it launches and can record a window.

### Audacity — record your voice-clone sample
- https://www.audacityteam.org/ — verify it launches and records from your mic.

---

## 2. Get the repo

```powershell
git clone https://github.com/stanovljanac/AIAutomatizacija.git
cd AIAutomatizacija
```

(If you're setting up the repo for the first time from these generated files,
copy them in, then `git init`, `git remote add origin <url>`, commit, push.)

---

## 3. Node & Remotion

```powershell
# From repo root, once package.json exists (Phase 1):
npm install

# Remotion lives in templates/remotion
cd templates/remotion
npm install
npx remotion studio    # should open the studio in your browser
cd ../..
```

If `npx remotion studio` opens, the render path works locally.

---

## 4. Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
# requirements.txt is added in Phase 1/2 (alignment, helpers)
pip install -r requirements.txt
```

For forced alignment you'll use WhisperX or aeneas — installed per
`pipeline/02-voice` instructions (some parts may run on Colab instead of locally).

---

## 5. Config & secrets

```powershell
# Copy examples, then fill in real values (these copies are git-ignored):
copy pipeline\shared\config.example.json pipeline\shared\config.json
copy .env.example .env
```

`.env` keys you'll need (get them in step 6):
```
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
# YouTube OAuth: store client_secret.json outside git; path set in config.json
YOUTUBE_CLIENT_SECRET_PATH=C:\secure\client_secret.json
# Optional, only if you adopt the paid fallback:
ELEVENLABS_API_KEY=...
```

`config.json` important fields:
```jsonc
{
  "voice": { "provider": "free_tts" },   // or "elevenlabs"
  "render": { "location": "local" },     // or "cloud"
  "paths": { "content": "content", "assets": "assets" },
  "defaults": { "long_seconds": 465, "short_seconds": 45, "fps": 30 }
}
```

**Never commit `.env`, `config.json`, or any `client_secret*.json` / `token.json`.**
`.gitignore` already excludes them.

---

## 6. Free accounts & API keys

- **Google Colab** (free GPU): just sign in at https://colab.research.google.com/
- **Kaggle** (free ~30h/wk GPU, longer sessions): https://www.kaggle.com/ →
  Account → create API token if running via CLI.
- **Pexels API:** https://www.pexels.com/api/ → copy key → `.env`.
- **Pixabay API:** https://pixabay.com/api/docs/ → copy key → `.env`.
- **YouTube Data API v3:**
  1. https://console.cloud.google.com/ → new project.
  2. Enable "YouTube Data API v3".
  3. Create **OAuth client ID** (Desktop app) → download `client_secret.json` →
     store it **outside** the repo; point `YOUTUBE_CLIENT_SECRET_PATH` to it.
  4. First publish run will open a browser to authorize; a `token.json` is created
     (also keep outside git).
- **ElevenLabs (optional, only if free TTS loses the listen test):**
  https://elevenlabs.io/ → Creator plan → API key → `.env`.

> Security: the agent must never type secrets into code, URLs, or committed files,
> and never create accounts or enter passwords on your behalf — you do auth steps
> yourself.

---

## 7. Cloud GPU usage (Colab/Kaggle)

Heavy steps ship as notebooks/scripts under `scripts/colab/` (added in Phase 2/3).
Pattern:
1. Open the notebook in Colab/Kaggle, set runtime to GPU.
2. It mounts/pulls the target `content/<id>/` inputs.
3. Runs the job **chunked + cached** (a disconnect only repeats the current chunk).
4. Pushes results (audio/images) back; you sync them into the video folder.

Use **Kaggle** for long batches (steadier, ~30h/wk). Use **Colab** for quick jobs.

---

## 8. Verify the whole setup (Phase 1 smoke test)

```powershell
# 1) Schemas validate a sample script
node pipeline/shared/validate.js content/001-sta-je-ai/script.json   # (added Phase 1)

# 2) Remotion renders a 10s test with intro/outro + one subtitle
cd templates/remotion
npx remotion render TestComposition out/test.mp4
cd ../..
```

If both succeed, you're ready for Phase 2 (voice). See `docs/ROADMAP.md`.

---

## 9. Common issues

| Issue | Fix |
|------|-----|
| `npx remotion` fails on Chrome/Chromium | Let Remotion download its browser; or install Chrome |
| FFmpeg "not recognized" | Add FFmpeg `bin` to PATH, reopen PowerShell |
| Python venv activate blocked | `Set-ExecutionPolicy -Scope Process RemoteSigned` then activate |
| Colab disconnects | Expected; re-run the cell — cached chunks are skipped |
| YouTube upload quota error | Uploads are quota-heavy; space them; check quota in Cloud Console |
| Mic noisy in Audacity | Use Effect → Noise Reduction; treat the room (soft surfaces) |
