"""02-voice: synthesize ONE continuous edge-tts narration + build alignment.json
from edge-tts's own WordBoundary events (exact per-word timing, no separate aligner).

  python scripts/make_voice.py <content_id>
  python scripts/make_voice.py 002-what-is-ai-automation

Outputs (under content/<id>/):
  voice/narration.mp3   (git-ignored)
  alignment.json        ({ audio, duration, sentences[], words[] })

The single continuous track is never cut (PRD R11); scene windows come from the
sentence timestamps (R12). Voice + rate come from pipeline/shared/config.json.

SCRIPTED PAUSES (optional). A scene may hold a beat of real silence:

    "pause_after": [{ "after_sentence": 1, "seconds": 3.2 }]

...where `after_sentence` indexes that scene's own `sentences`. Sentence-final punctuation buys
~0.4s and an ellipsis ~0.8s, which is nowhere near a designed hold, so we synthesize the narration
in SEGMENTS split at each pause, splice real silence between them, and shift every later timestamp
by the silence we inserted. A scene window still runs from one sentence start to the next, so the
silence simply widens the beat it sits in. The track stays ONE continuous file — we are lengthening
it, never cutting it.
"""
import asyncio
import json
import math
import re
import string
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]

# edge-tts hands back CBR MPEG-2 Layer III, 24 kHz mono, 48 kbps: every frame is exactly 144 bytes
# and 576 samples, i.e. 24 ms. That fixed shape is what lets us count a segment's exact duration and
# splice silence in by raw bytes, with no decode step and no drift.
MP3_FRAME_BYTES = 144
MP3_FRAME_SECONDS = 576 / 24000
_V2_L3_BITRATES = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
_V2_SAMPLE_RATES = {0: 22050, 1: 24000, 2: 16000}


def mp3_frames(data: bytes):
    """Split a 24 kHz mono MPEG-2 Layer III stream into frames, skipping any ID3/Xing junk."""
    out = []
    i = 0
    while i + 4 <= len(data):
        if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
            b1, b2 = data[i + 1], data[i + 2]
            version, layer = (b1 >> 3) & 3, (b1 >> 1) & 3
            bitrate_idx, rate_idx, padding = (b2 >> 4) & 0xF, (b2 >> 2) & 3, (b2 >> 1) & 1
            if version == 2 and layer == 1 and bitrate_idx not in (0, 15) and rate_idx != 3:
                size = 72 * (_V2_L3_BITRATES[bitrate_idx] * 1000) // _V2_SAMPLE_RATES[rate_idx] + padding
                out.append(data[i:i + size])
                i += size
                continue
        i += 1
    return out


def audio_seconds(data: bytes) -> float:
    return len(mp3_frames(data)) * MP3_FRAME_SECONDS


def ffmpeg_bin() -> str:
    """The repo's vendored ffmpeg first, a system one otherwise (same idiom as 04b-thumbnails)."""
    exe = "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"
    vendored = ROOT / "templates" / "hyperframes" / ".bin" / exe
    return str(vendored) if vendored.exists() else "ffmpeg"


def make_silence(seconds: float) -> bytes:
    """Exactly `seconds` of silence (rounded up to a whole 24 ms frame), in the same MP3 shape."""
    want = max(1, math.ceil(seconds / MP3_FRAME_SECONDS))
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "silence.mp3"
        # -write_xing 0 / -id3v2_version 0: no Xing header frame, no ID3 tag — both would land
        # mid-stream once spliced and throw the frame count (and therefore every later timestamp) off.
        cmd = [
            ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
            "-t", f"{seconds + 0.5:.3f}", "-c:a", "libmp3lame", "-b:a", "48k",
            "-write_xing", "0", "-id3v2_version", "0", str(out),
        ]
        res = subprocess.run(cmd, capture_output=True)
        if res.returncode != 0 or not out.exists():
            raise SystemExit(
                "FAIL  could not generate silence for a scripted pause.\n"
                f"      ffmpeg={ffmpeg_bin()} exit={res.returncode}\n"
                f"      {res.stderr.decode('utf-8', 'replace')[-400:]}"
            )
        frames = mp3_frames(out.read_bytes())
    if len(frames) < want:
        raise SystemExit(f"FAIL  silence generator returned {len(frames)} frames, needed {want}.")
    return b"".join(frames[:want])


def pause_map(scenes):
    """{flat sentence index: seconds of silence to splice in AFTER it} from each scene's pause_after."""
    out = {}
    flat = 0
    for scene in scenes:
        n = len(scene["sentences"])
        for p in scene.get("pause_after", []):
            idx = int(p["after_sentence"])
            seconds = float(p["seconds"])
            if not 0 <= idx < n:
                raise SystemExit(f"FAIL  {scene['id']}.pause_after[{idx}] is out of range (scene has {n} sentences).")
            if seconds > 0:
                out[flat + idx] = out.get(flat + idx, 0.0) + seconds
        flat += n
    return out


def norm(tok: str) -> str:
    return tok.strip(string.punctuation + "—-").lower()


def tokens_of(sentence: str):
    # split on whitespace AND hyphens/dashes — a hyphenated compound is spoken as separate
    # words, so it must tokenize as separate words too (keeps alignment from drifting; v2-1).
    out = []
    for raw in sentence.split():
        t = raw.strip(string.punctuation + "—–")
        if not t:
            continue
        for part in re.split(r"[-–—]", t):
            p = part.strip(string.punctuation + "—–")
            if p:
                out.append(p.lower())
    return out


async def main(cid: str):
    cdir = ROOT / "content" / cid
    cfg = json.loads((ROOT / "pipeline" / "shared" / "config.json").read_text(encoding="utf-8"))
    voice = cfg["voice"]["edge_tts"]["voice"]
    rate = cfg["voice"]["edge_tts"].get("rate", "+0%")
    # Per-video pacing override: brief.json.voice_rate (this video only; the Short inherits the
    # parent brief). Keeps the global default intact while letting one video run slower/faster.
    for bdir in (cdir, cdir.parent):
        bpath = bdir / "brief.json"
        if bpath.exists():
            vr = json.loads(bpath.read_text(encoding="utf-8")).get("voice_rate")
            if isinstance(vr, str) and vr.strip():
                rate = vr.strip()
            break

    script = json.loads((cdir / "script.json").read_text(encoding="utf-8"))

    # ordered sentences with scene + expected tokens
    sents = []
    for sc in script["scenes"]:
        for s in sc["sentences"]:
            sents.append({"scene": sc["id"], "text": s, "tok": tokens_of(s)})

    # One segment per run of sentences between scripted pauses (usually exactly one segment).
    pauses = pause_map(script["scenes"])
    segments = []
    cur = []
    for i, s in enumerate(sents):
        cur.append(s)
        if i in pauses:
            segments.append((cur, pauses[i]))
            cur = []
    if cur:
        segments.append((cur, 0.0))

    # synthesize: collect audio + word boundaries, shifting each segment by everything before it
    (cdir / "voice").mkdir(parents=True, exist_ok=True)
    mp3 = cdir / "voice" / "narration.mp3"
    audio = bytearray()
    wbs = []  # {w, start, end}
    offset = 0.0
    inserted = 0.0
    for seg_sents, pause_seconds in segments:
        text = " ".join(s["text"] for s in seg_sents)
        # edge-tts >= 7 defaults to boundary="SentenceBoundary" — with that default the stream emits
        # NO WordBoundary events at all and every word below silently lands at 0.0s, i.e. a valid-looking
        # alignment.json with a completely dead clock. Ask for word boundaries explicitly (older releases
        # have no such kwarg and always emitted them, hence the fallback).
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
        except TypeError:
            comm = edge_tts.Communicate(text, voice, rate=rate)
        seg_audio = bytearray()
        async for ch in comm.stream():
            if ch["type"] == "audio":
                seg_audio += ch["data"]
            elif ch["type"] == "WordBoundary":
                start = offset + ch["offset"] / 1e7
                end = offset + (ch["offset"] + ch["duration"]) / 1e7
                wbs.append({"w": ch["text"], "start": round(start, 3), "end": round(end, 3)})
        # the segment's TRUE length (frame count), not its last word — the tail after the final word
        # belongs to the track, and guessing it here would drift every later timestamp.
        offset += audio_seconds(bytes(seg_audio))
        audio += seg_audio
        if pause_seconds > 0:
            silence = make_silence(pause_seconds)
            audio += silence
            held = audio_seconds(silence)
            offset += held
            inserted += held
    if not wbs:
        sys.exit(
            "FAIL  edge-tts returned no WordBoundary events — every timestamp would be 0.0s and the\n"
            "      whole render would desync. Check the installed edge-tts (`pip show edge-tts`);\n"
            f"      voice={voice}. Nothing was written."
        )
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

    # The track's real length. The old estimate (last word + 0.5s of assumed tail) is kept as a floor
    # so behaviour is unchanged on videos with no pauses, where it already exceeded the true length.
    duration = round(max((wbs[-1]["end"] if wbs else 0) + 0.5, audio_seconds(bytes(audio))), 3)

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
    if inserted > 0:
        print(f"    {len(segments)} segments, {inserted:.2f}s of scripted silence spliced in")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/make_voice.py <content_id>")
    asyncio.run(main(sys.argv[1]))
