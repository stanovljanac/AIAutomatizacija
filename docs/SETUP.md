# SETUP (Windows)

Install everything from zero on a Windows PC and configure the project. Written for
someone who has never set this up. Commands assume **PowerShell**.

> Hardware note: this PC is the **orchestrator + renderer**. The core stack runs
> **locally** (edge-tts voice, Remotion render, stock). A free cloud GPU (Colab/Kaggle)
> is **optional, opt-in** for occasional AI images only. See `docs/ARCHITECTURE.md` §7.

---

## 0. Prerequisites overview

You'll install: Git, Node.js (LTS), Python 3.11+, FFmpeg, OBS Studio, and the project's
Node/Python deps (including `edge-tts`). Plus free accounts: Google (YouTube API),
Pexels, Pixabay. Optional later: Google Colab/Kaggle (only if you use AI images).

---

## 1. Core tools

### Git
- Install: https://git-scm.com/download/win — verify `git --version`.

### Node.js (LTS) — for Remotion & pipeline scripts
- `winget install OpenJS.NodeJS.LTS` — verify `node --version` (≥ 20), `npm --version`.

### Python 3.11+ — for TTS (edge-tts), alignment & helpers
- https://www.python.org/downloads/ (check "Add python.exe to PATH") — verify `python --version`.

### FFmpeg — audio/video processing (Remotion & QA use it)
- `winget install Gyan.FFmpeg` — verify `ffmpeg -version`.

### OBS Studio — screen capture for mini-demo videos
- https://obsproject.com/ — verify it launches and can record a window. The
  `screen-capture` skill will give you a ready OBS profile + click-list per demo.

> No Audacity / microphone needed — the channel is faceless and uses an AI voice.

---

## 2. Get the repo

```powershell
git clone <your-repo-url>
cd "AI Automatizacija"
```

---

## 3. Node & Remotion

```powershell
npm install                 # from repo root, once package.json exists

cd templates/remotion
npm install
npx remotion studio         # should open the studio in your browser
cd ../..
```

If `npx remotion studio` opens, the render path works locally. (HyperFrames, if adopted
in the Phase-2 bake-off, installs per its own notes — DECISIONS D-019.)

---

## 4. Python environment (incl. edge-tts)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt     # includes edge-tts, alignment deps

# Quick voice sample (Phase 1 A/B test):
edge-tts --voice en-US-AndrewNeural --text "This is a boring task, automated." --write-media sample.mp3
```

Forced alignment uses WhisperX or aeneas — installed per `pipeline/02-voice` notes.
Everything here runs **locally**; no cloud account is required for normal production.

---

## 5. Config & secrets

```powershell
copy pipeline\shared\config.example.json pipeline\shared\config.json
copy .env.example .env
```

`.env` keys:
```
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
# YouTube OAuth: store client_secret.json OUTSIDE git; path set in config.json
YOUTUBE_CLIENT_SECRET_PATH=C:\secure\client_secret.json
```

`config.json` important fields:
```jsonc
{
  "voice": { "provider": "edge-tts", "edge_tts": { "voice": "en-US-AndrewNeural" } },
  "language": "en",
  "render": { "engine": "remotion", "fps": 30 },   // remotion | hyperframes | combo
  "paths": { "content": "content", "assets": "assets" },
  "defaults": { "long_seconds": 360, "short_seconds": 55, "short_seconds_max": 120 }
}
```

**Never commit `.env`, `config.json`, or any `client_secret*.json` / `token.json`.**

---

## 6. Free accounts & API keys

- **Pexels API:** https://www.pexels.com/api/ → key → `.env`.
- **Pixabay API:** https://pixabay.com/api/docs/ → key → `.env`.
- **YouTube Data API v3:**
  1. https://console.cloud.google.com/ → new project.
  2. Enable "YouTube Data API v3".
  3. Create **OAuth client ID** (Desktop app) → download `client_secret.json` → store
     **outside** the repo; point `YOUTUBE_CLIENT_SECRET_PATH` to it.
  4. First publish run opens a browser to authorize; a `token.json` is created (keep
     outside git).
- **Optional (only if you use AI images):** Google Colab (sign in) / Kaggle (API token).

> Security: the agent must never type secrets into code, URLs, or committed files, and
> never create accounts or enter passwords on your behalf — you do auth steps yourself.

---

## 7. Optional cloud GPU (AI images only)

Not required for normal production (local-first, D-015). If you ever want an AI concept
image, the opt-in notebook under `scripts/colab/` runs chunked + cached and pushes the
image back into the video folder. Skip otherwise.

---

## 8. Verify the setup (smoke test)

```powershell
# 1) Schemas validate a sample script
node pipeline/shared/validate.js content/_TEMPLATE/script.sample.json --schema script

# 2) edge-tts produces audio
edge-tts --voice en-US-AndrewNeural --text "Automated." --write-media out.mp3

# 3) Remotion renders a short test
cd templates/remotion
npx remotion render TestComposition out/test.mp4
cd ../..
```

If these succeed, you're ready for Phase 1 (voice & thumbnail). See `docs/ROADMAP.md`.

---

## 9. Common issues

| Issue | Fix |
|------|-----|
| `npx remotion` fails on Chrome/Chromium | Let Remotion download its browser; or install Chrome |
| FFmpeg "not recognized" | Add FFmpeg `bin` to PATH, reopen PowerShell |
| Python venv activate blocked | `Set-ExecutionPolicy -Scope Process RemoteSigned` then activate |
| edge-tts network error | It needs internet (it calls Microsoft's voices); retry |
| YouTube upload quota error | Uploads are quota-heavy; space them; check quota in Cloud Console |
| OBS capture is black | Switch capture mode (Window vs Display); run OBS as admin if needed |
