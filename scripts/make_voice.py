"""02-voice: synthesize ONE continuous edge-tts narration + build alignment.json
from edge-tts's own WordBoundary events (exact per-word timing, no separate aligner).

  python scripts/make_voice.py <content_id>
  python scripts/make_voice.py 002-what-is-ai-automation

Outputs (under content/<id>/):
  voice/narration.mp3   (git-ignored)
  alignment.json        ({ audio, duration, sentences[], words[] })

The single continuous track is never cut (PRD R11); scene windows come from the
sentence timestamps (R12). Voice + rate come from pipeline/shared/config.json.
"""
import asyncio
import json
import string
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]


def norm(tok: str) -> str:
    return tok.strip(string.punctuation + "—-").lower()


def tokens_of(sentence: str):
    # split on whitespace, strip surrounding punctuation, keep internal hyphens,
    # drop empties (lone dashes) — mirrors edge-tts word emission closely.
    out = []
    for raw in sentence.split():
        t = raw.strip(string.punctuation + "—")
        if t:
            out.append(t.lower())
    return out


async def main(cid: str):
    cdir = ROOT / "content" / cid
    cfg = json.loads((ROOT / "pipeline" / "shared" / "config.json").read_text(encoding="utf-8"))
    voice = cfg["voice"]["edge_tts"]["voice"]
    rate = cfg["voice"]["edge_tts"].get("rate", "+0%")

    script = json.loads((cdir / "script.json").read_text(encoding="utf-8"))

    # ordered sentences with scene + expected tokens
    sents = []
    for sc in script["scenes"]:
        for s in sc["sentences"]:
            sents.append({"scene": sc["id"], "text": s, "tok": tokens_of(s)})
    full_text = " ".join(s["text"] for s in sents)

    # synthesize: collect audio + word boundaries
    (cdir / "voice").mkdir(parents=True, exist_ok=True)
    mp3 = cdir / "voice" / "narration.mp3"
    audio = bytearray()
    wbs = []  # {w, start, end}
    comm = edge_tts.Communicate(full_text, voice, rate=rate)
    async for ch in comm.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            start = ch["offset"] / 1e7
            end = (ch["offset"] + ch["duration"]) / 1e7
            wbs.append({"w": ch["text"], "start": round(start, 3), "end": round(end, 3)})
    mp3.write_bytes(bytes(audio))

    # sequential map: walk wb stream, assign to expected tokens 1:1 (normalized)
    flat = []  # expected tokens with their sentence ref
    for si, s in enumerate(sents):
        for t in s["tok"]:
            flat.append((si, t))

    words_out = []
    si_start = {}
    si_end = {}
    j = 0  # pointer into wbs
    for (si, tok) in flat:
        # advance wbs until a normalized match (tolerate the rare stray event)
        matched = None
        scan = j
        while scan < len(wbs):
            if norm(wbs[scan]["w"]) == tok or scan == j:
                matched = wbs[scan]
                j = scan + 1
                break
            scan += 1
        if matched is None:
            # fell off; reuse last known time
            matched = wbs[min(j, len(wbs) - 1)] if wbs else {"w": tok, "start": 0, "end": 0}
        words_out.append({"scene": sents[si]["scene"], "w": tok, "start": matched["start"], "end": matched["end"]})
        si_start.setdefault(si, matched["start"])
        si_end[si] = matched["end"]

    duration = round((wbs[-1]["end"] if wbs else 0) + 0.5, 3)

    sentences_out = []
    for si, s in enumerate(sents):
        sentences_out.append({
            "scene": s["scene"],
            "index": si,
            "text": s["text"],
            "start": round(si_start.get(si, 0.0), 3),
            "end": round(si_end.get(si, duration), 3),
        })

    alignment = {"audio": "voice/narration.mp3", "duration": duration,
                 "sentences": sentences_out, "words": words_out}
    (cdir / "alignment.json").write_text(json.dumps(alignment, indent=2) + "\n", encoding="utf-8")

    print(f"OK  voice/narration.mp3  ({len(audio)//1024} KB)")
    print(f"OK  alignment.json  ({len(sentences_out)} sentences, {len(words_out)} words, {duration:.1f}s)")
    print(f"voice={voice} rate={rate}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/make_voice.py <content_id>")
    asyncio.run(main(sys.argv[1]))
