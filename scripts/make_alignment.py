"""02-voice (alignment): build alignment.json from an existing narration.mp3 using
faster-whisper word timestamps, mapped onto the script's exact sentences.

  python scripts/make_alignment.py <content_id>

edge-tts in this version doesn't emit WordBoundary events, so we recover per-word
timing from the (crystal-clear) TTS audio with faster-whisper and snap it to the
known script text. One continuous track; scene windows come from sentence times.
"""
import json
import string
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
PUNCT = string.punctuation + "—–"


def norm(t: str) -> str:
    return t.strip(PUNCT + " ").lower()


def tokens_of(sentence: str):
    out = []
    for raw in sentence.split():
        t = raw.strip(PUNCT)
        if t:
            out.append(t.lower())
    return out


def main(cid: str):
    cdir = ROOT / "content" / cid
    mp3 = cdir / "voice" / "narration.mp3"
    script = json.loads((cdir / "script.json").read_text(encoding="utf-8"))

    sents = []
    for sc in script["scenes"]:
        for s in sc["sentences"]:
            sents.append({"scene": sc["id"], "text": s, "tok": tokens_of(s)})

    print("loading faster-whisper (small.en, cpu/int8)...")
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segments, info = model.transcribe(str(mp3), language="en", word_timestamps=True)
    ww = []  # whisper words
    for seg in segments:
        for w in (seg.words or []):
            ww.append({"w": w.word, "n": norm(w.word), "start": round(w.start, 3), "end": round(w.end, 3)})
    print(f"whisper words: {len(ww)}")

    flat = [(si, t) for si, s in enumerate(sents) for t in s["tok"]]
    words_out, si_start, si_end = [], {}, {}
    j = 0
    for (si, tok) in flat:
        match = None
        for scan in range(j, min(j + 4, len(ww))):  # small look-ahead
            if ww[scan]["n"] == tok:
                match = ww[scan]
                j = scan + 1
                break
        if match is None:  # best effort: take current, advance by 1
            match = ww[j] if j < len(ww) else (ww[-1] if ww else {"start": 0, "end": 0})
            j = min(j + 1, len(ww))
        words_out.append({"scene": sents[si]["scene"], "w": tok, "start": match["start"], "end": match["end"]})
        si_start.setdefault(si, match["start"])
        si_end[si] = match["end"]

    duration = round((ww[-1]["end"] if ww else 0) + 0.5, 3)
    sentences_out = []
    last_end = 0.0
    for si, s in enumerate(sents):
        st = round(si_start.get(si, last_end), 3)
        en = round(max(si_end.get(si, st), st + 0.2), 3)
        last_end = en
        sentences_out.append({"scene": s["scene"], "index": si, "text": s["text"], "start": st, "end": en})

    alignment = {"audio": "voice/narration.mp3", "duration": duration,
                 "sentences": sentences_out, "words": words_out}
    (cdir / "alignment.json").write_text(json.dumps(alignment, indent=2) + "\n", encoding="utf-8")
    print(f"OK alignment.json  ({len(sentences_out)} sentences, {len(words_out)} words, {duration:.1f}s)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/make_alignment.py <content_id>")
    main(sys.argv[1])
