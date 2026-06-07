"""02-voice (alignment): build alignment.json from an existing narration.mp3 using
faster-whisper word timestamps, mapped onto the script's exact sentences.

  python scripts/make_alignment.py <content_id>

edge-tts in this version doesn't emit WordBoundary events, so we recover per-word
timing from the (crystal-clear) TTS audio with faster-whisper and snap it to the
known script text. One continuous track; scene windows come from sentence times.
"""
import difflib
import json
import re
import string
import sys
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
PUNCT = string.punctuation + "—–"


def norm(t: str) -> str:
    return t.strip(PUNCT + " ").lower()


def tokens_of(sentence: str):
    # Split on whitespace AND on hyphens/dashes: whisper emits a hyphenated compound like
    # "upload-a-file-and-say-wow" or "last-name-first" as separate words, so we must too —
    # otherwise one mega-token can never match and the alignment drifts (v2-1 fix).
    out = []
    for raw in sentence.split():
        t = raw.strip(PUNCT)
        if not t:
            continue
        for part in re.split(r"[-–—]", t):
            p = part.strip(PUNCT)
            if p:
                out.append(p.lower())
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
    script_toks = [t for (_, t) in flat]
    wn = [w["n"] for w in ww]

    # Robust mapping script tokens -> whisper words via SEQUENCE ALIGNMENT (v2-1). This
    # handles whisper insertions / deletions / substitutions (e.g. "twenty-five" vs "25")
    # without the old pointer-walk drifting or parking everything at the end. Matched
    # ("equal") tokens take the real whisper time; the rest are interpolated between anchors.
    times = [None] * len(script_toks)
    sm = difflib.SequenceMatcher(a=script_toks, b=wn, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                w = ww[j1 + k]
                times[i1 + k] = (w["start"], w["end"])
    dur_guess = ww[-1]["end"] if ww else 0.0
    n = len(times)
    i = 0
    while i < n:
        if times[i] is not None:
            i += 1
            continue
        a = i - 1
        b = i
        while b < n and times[b] is None:
            b += 1
        left = times[a][1] if a >= 0 else 0.0
        right = times[b][0] if b < n else dur_guess
        gap = b - i
        span = max(right - left, 0.0)
        for k in range(gap):
            t0 = round(left + span * k / (gap + 1), 3)
            t1 = round(left + span * (k + 1) / (gap + 1), 3)
            times[i + k] = (t0, t1)
        i = b

    words_out, si_start, si_end = [], {}, {}
    for idx, (si, tok) in enumerate(flat):
        st, en = times[idx] if times[idx] else (0.0, 0.0)
        words_out.append({"scene": sents[si]["scene"], "w": tok, "start": st, "end": en})
        si_start.setdefault(si, st)
        si_end[si] = en

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
