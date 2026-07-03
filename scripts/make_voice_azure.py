"""02-voice (FINAL): synthesize the published narration with Azure AI Speech (the
licensed, commercial path — D-024). Same Andrew voice as the edge-tts draft.

  python scripts/make_voice_azure.py <content_id>

Needs a free Azure Speech resource:  AZURE_SPEECH_KEY + AZURE_SPEECH_REGION in .env
(or the environment). After this, re-run make_alignment.py to refresh timings on the
new audio, then rebuild props + render.

edge-tts is drafts only; this is what goes into a published video / Short.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]


def load_env(root: Path):
    env = root / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def main(cid: str):
    load_env(ROOT)
    cfg = json.loads((ROOT / "pipeline/shared/config.json").read_text(encoding="utf-8"))
    az = cfg["voice"]["azure"]
    key = os.environ.get(az.get("key_env", "AZURE_SPEECH_KEY"))
    region = os.environ.get(az.get("region_env", "AZURE_SPEECH_REGION"))
    if not key or not region:
        sys.exit("Missing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION (set them in .env). "
                 "Create a free Azure Speech resource first.")

    cdir = ROOT / "content" / cid
    script = json.loads((cdir / "script.json").read_text(encoding="utf-8"))
    text = " ".join(s for sc in script["scenes"] for s in sc["sentences"])
    voice = az.get("voice", "en-US-AndrewMultilingualNeural")
    rate = az.get("rate", "+0%")
    # Per-video pacing override (brief.json.voice_rate) — matches the draft so the final voice keeps
    # the same pace. The Short inherits the parent brief.
    for bdir in (cdir, cdir.parent):
        bpath = bdir / "brief.json"
        if bpath.exists():
            vr = json.loads(bpath.read_text(encoding="utf-8")).get("voice_rate")
            if isinstance(vr, str) and vr.strip():
                rate = vr.strip()
            break

    ssml = (
        f"<speak version='1.0' xml:lang='en-US'>"
        f"<voice name='{voice}'><prosody rate='{rate}'>{escape(text)}</prosody></voice></speak>"
    )

    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    req = urllib.request.Request(url, data=ssml.encode("utf-8"), method="POST", headers={
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "the-automation-desk",
    })
    (cdir / "voice").mkdir(parents=True, exist_ok=True)
    out = cdir / "voice" / "narration.mp3"
    with urllib.request.urlopen(req, timeout=120) as resp:
        out.write_bytes(resp.read())

    chars = len(text)
    print(f"OK voice/narration.mp3 (Azure, {voice}, {chars} chars, ~{chars/500000*100:.2f}% of monthly free quota)")
    print("Next: python scripts/make_alignment.py", cid, "  (refresh timings on the new audio)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/make_voice_azure.py <content_id>")
    main(sys.argv[1])
