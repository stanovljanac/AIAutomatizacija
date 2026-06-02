"""Quick free Serbian TTS sample via edge-tts (Microsoft neural voices).
Generates the same paragraph in the male and female Serbian voices so the
owner can judge quality by ear. Free, no GPU, no API key. See DECISIONS D-010.
"""
import asyncio
from pathlib import Path
import edge_tts

OUT = Path(r"f:/AI/AI Automatizacija/content/001-sta-je-ai/voice")
OUT.mkdir(parents=True, exist_ok=True)

# Representative chunk from the "Šta je AI" narration (~30–40s).
TEXT = (
    "Veštačka inteligencija u 2026. više nije naučna fantastika. "
    "Danas ti piše kod, pravi slike i odgovara na pitanja bolje nego ikad. "
    "Za nekih sedam minuta objasniću ti šta ona zaista jeste, šta sve može "
    "i kako da je koristiš potpuno besplatno. "
    "Krenimo od osnovnog pitanja: šta je zapravo veštačka inteligencija? "
    "Kada danas kažemo AI, najčešće mislimo na takozvane velike jezičke modele."
)

VOICES = {
    "sample_edge_nicholas_m.mp3": "sr-RS-NicholasNeural",
    "sample_edge_sophie_f.mp3": "sr-RS-SophieNeural",
}


async def gen(filename: str, voice: str):
    out = OUT / filename
    # rate/pitch left default; we can tune pace (~+0%) later if needed.
    communicate = edge_tts.Communicate(TEXT, voice)
    await communicate.save(str(out))
    print(f"OK -> {out}  ({voice})")


async def main():
    for fn, voice in VOICES.items():
        await gen(fn, voice)


if __name__ == "__main__":
    asyncio.run(main())
