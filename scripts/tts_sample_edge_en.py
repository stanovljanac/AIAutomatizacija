"""Phase 1 — channel voice A/B for "Boring AI Automations" (edge-tts, free, local).

Generates the same English paragraph in several professional neural voices so the
owner can pick ONE channel voice by ear. Output -> voice/samples/. See DECISIONS D-014.

Run:  python scripts/tts_sample_edge_en.py
Then listen to voice/samples/*.mp3 and tell me which voice to set in config.json.
"""
import asyncio
from pathlib import Path
import edge_tts

OUT = Path(__file__).resolve().parents[1] / "voice" / "samples"
OUT.mkdir(parents=True, exist_ok=True)

# On-brand sample: persona = sharp practical engineer + warm teacher, no hype.
TEXT = (
    "Here are three boring office jobs you never have to do by hand again. "
    "The tasks nobody automates are exactly where the easy money is. "
    "Today I'll show each idea on a tiny example, and then you scale it to your own process. "
    "First up: turning a messy spreadsheet export into a clean, finished invoice, automatically. "
    "It takes about thirty seconds to set up, and it saves that thirty seconds every single day. "
    "Stick around, because the third one is the kind of thing people quietly charge clients for."
)

# Chosen channel voice (DECISIONS D-014): Andrew, multilingual, slightly faster.
VOICES = {
    "sample_en_andrew_m.mp3": "en-US-AndrewMultilingualNeural",
}
RATE = "+8%"  # nudge pace; Andrew read a touch slow at +0%.


async def gen(filename: str, voice: str):
    out = OUT / filename
    communicate = edge_tts.Communicate(TEXT, voice, rate=RATE)
    await communicate.save(str(out))
    print(f"OK -> {out.name}  ({voice} {RATE})")


async def main():
    for fn, voice in VOICES.items():
        try:
            await gen(fn, voice)
        except Exception as e:  # keep going if one voice id is unavailable
            print(f"SKIP {fn} ({voice}): {e}")


if __name__ == "__main__":
    asyncio.run(main())
