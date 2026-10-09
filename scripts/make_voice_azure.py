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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_voice import key_take_set, pause_map, plan_segments, read_pacing  # noqa: E402  (same segment plan as the draft)

AZURE_MAX_BREAK_MS = 5000  # Azure caps one <break> at 5s; a longer hold is several in a row


def build_ssml(scenes, voice: str, rate: str, key_rate=None) -> str:
    """The narration as SSML, segmented exactly like the edge-tts draft: one <prosody> per segment
    (key takes at `key_rate`) and a real <break> for every scripted pause, so the final voice keeps
    the draft's pacing. With no pauses and no key takes this is the single prosody it always was."""
    sents = [s for sc in scenes for s in sc["sentences"]]
    parts = []
    for idx, seg_rate, pause in plan_segments(len(sents), pause_map(scenes), key_take_set(scenes), rate, key_rate):
        parts.append(f"<prosody rate='{seg_rate}'>{escape(' '.join(sents[i] for i in idx))}</prosody>")
        ms = round(pause * 1000)
        while ms > 0:
            parts.append(f"<break time='{min(ms, AZURE_MAX_BREAK_MS)}ms'/>")
            ms -= AZURE_MAX_BREAK_MS
    return f"<speak version='1.0' xml:lang='en-US'><voice name='{voice}'>{''.join(parts)}</voice></speak>"


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
    # Per-video pacing override (brief.json.voice_rate / voice_rate_key) — matches the draft so the
    # final voice keeps the same pace. A Short without its own brief inherits the parent's.
    rate, key_rate = read_pacing(cdir, az.get("rate", "+0%"))
    ssml = build_ssml(script["scenes"], voice, rate, key_rate)

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
