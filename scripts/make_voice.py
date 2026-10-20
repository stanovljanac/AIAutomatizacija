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

KEY TAKES (optional). A scene may mark the lines the viewer must remember:

    "key_takes": [0]

...(indexes into that scene's `sentences`). They are spoken at `brief.voice_rate_key` instead of
`brief.voice_rate`, so the take has time to land. A rate change starts a new segment, exactly like
a pause does (one edge-tts request carries one rate).

THE OPENING (D-078). The hook and the after-hook — the leading sentences that end by the recipe's
`opening.max_seconds` (the first always, inside the first `max_scenes` scenes) — are spoken
`opening.tempo`× faster than the body (1.12 by default). alignment.json records them as
`opening: {scenes, sentences, tempo}` (scenes = the ones those sentences touch).
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


# MEASURED 2026-10-09 (Andrew, edge-tts 7.2.8): edge-tts pads a short request to ~1.87s, so a key take
# synthesized on its own ("Not one had moved.") carries ~1s of trailing silence — a pause nobody asked
# for. A RATE-CHANGE boundary must sound like an ordinary sentence break (median 0.389s on 024's long
# track = tail + the next segment's ~0.1s lead-in), so its tail is cut back to this.
RATE_BOUNDARY_TAIL = 0.30


def trim_tail(audio: bytes, last_word_end: float, keep: float = RATE_BOUNDARY_TAIL) -> bytes:
    """Drop whole MP3 frames after `last_word_end + keep` seconds. Only TRAILING frames are ever
    dropped (MP3's bit reservoir makes a frame depend on the ones before it, never after), and a
    segment that already ends sooner is returned untouched."""
    frames = mp3_frames(audio)
    want = math.ceil((last_word_end + keep) / MP3_FRAME_SECONDS)
    return audio if want >= len(frames) else b"".join(frames[:max(want, 1)])


def key_take_set(scenes):
    """Flat sentence indexes a scene marks as KEY TAKES (`"key_takes": [sentence idx, ...]`).

    A key take is the line the viewer must remember; it is spoken at `brief.voice_rate_key` (slower
    than the rest) so it has time to land. Out-of-range indexes fail loud, like pause_map.
    """
    out = set()
    flat = 0
    for scene in scenes:
        n = len(scene["sentences"])
        for idx in scene.get("key_takes", []):
            idx = int(idx)
            if not 0 <= idx < n:
                raise SystemExit(f"FAIL  {scene['id']}.key_takes[{idx}] is out of range (scene has {n} sentences).")
            out.add(flat + idx)
        flat += n
    return out


def faster(rate: str, tempo: float) -> str:
    """The edge-tts rate that speaks `tempo`× faster than `rate`: a rate scales the speaking speed, so
    the speeds multiply — "-11%" × 1.12 → "+0%", "-15%" × 1.12 → "-5%"."""
    pct = round(((1 + int(rate.strip().rstrip("%")) / 100) * tempo - 1) * 100)
    return f"{pct:+d}%"


def plan_segments(n, pauses, keys, rate, key_rate=None, fast=frozenset(), tempo=1.0):
    """Group sentences 0..n-1 into synthesis segments: [(indexes, rate, pause_after_seconds)].

    A segment ends after every scripted pause AND wherever the speaking rate changes (a key take
    starts or ends, the opening ends), because one edge-tts request carries one rate. With no pauses,
    key takes or opening this is the single segment the track has always been. `fast` = the flat
    sentence indexes of the opening (D-078), spoken `tempo`× faster — key takes in it too.
    """
    segs = []
    cur, cur_rate = [], None
    for i in range(n):
        r = key_rate if (key_rate and i in keys) else rate
        if i in fast:
            r = faster(r, tempo)
        if cur and r != cur_rate:
            segs.append((cur, cur_rate, 0.0))
            cur = []
        cur.append(i)
        cur_rate = r
        if i in pauses:
            segs.append((cur, cur_rate, pauses[i]))
            cur, cur_rate = [], None
    if cur:
        segs.append((cur, cur_rate, 0.0))
    return segs


def recipe_pacing(fallback: str):
    """(rate, rate_key) — the default pace from the format recipe (pipeline/shared/formats/default.json
    `voice`, D-068), else `fallback` (the config rate) with no key rate."""
    fpath = ROOT / "pipeline" / "shared" / "formats" / "default.json"
    v = json.loads(fpath.read_text(encoding="utf-8")).get("voice", {}) if fpath.exists() else {}
    return v.get("rate") or fallback, v.get("rate_key")


# D-078: the opening's defaults when the recipe has no `opening` block — off.
OPENING_OFF = {"tempo": 1.0, "max_seconds": 15, "max_scenes": 3, "words_per_second": 2.42}


def read_opening(cdir: Path):
    """The opening knobs (D-078): the format recipe's `opening`, shallow-overridden by the nearest
    brief's `format_recipe.opening` (a video may switch it off with tempo 1). None when off."""
    fpath = ROOT / "pipeline" / "shared" / "formats" / "default.json"
    o = dict(OPENING_OFF)
    if fpath.exists():
        o.update(json.loads(fpath.read_text(encoding="utf-8")).get("opening") or {})
    for bdir in (cdir, cdir.parent):
        bpath = bdir / "brief.json"
        if bpath.exists():
            o.update(((json.loads(bpath.read_text(encoding="utf-8")).get("format_recipe") or {}).get("opening")) or {})
            break
    return o if float(o["tempo"]) > 1 else None


def opening_sentences(scenes, tempo: float, max_seconds: float, max_scenes: int, words_per_second: float):
    """Flat indexes of the sentences that form the opening — the hook and the after-hook (D-078): the
    first sentence always, then each next one whose estimated END stays within `max_seconds`, inside
    the first `max_scenes` scenes. No voice exists yet, so the end is estimated from the word count at
    the body pace sped up by `tempo`, plus the scripted pauses. Per sentence, not per scene: a long
    after-hook scene is sped up only for its first ~15 s, like the owner asked."""
    pauses = pause_map(scenes)
    out, t, flat = [], 0.0, 0
    for sc in scenes[:max_scenes]:
        for s in sc["sentences"]:
            t += len(tokens_of(s)) / (words_per_second * tempo)
            if out and t > max_seconds:
                return out
            out.append(flat)
            t += pauses.get(flat, 0.0)
            flat += 1
    return out


def read_pacing(cdir: Path, rate: str, key_rate=None):
    """(voice_rate, voice_rate_key) from the nearest brief.json — the video's own, else its parent's
    (a nested Short inherits the long brief unless it carries one). The FIRST brief found wins, so a
    Short with its own brief never mixes in the long video's pace. `rate`/`key_rate` are the defaults;
    the default key rate applies only when that brief sets no voice_rate of its own."""
    for bdir in (cdir, cdir.parent):
        bpath = bdir / "brief.json"
        if bpath.exists():
            b = json.loads(bpath.read_text(encoding="utf-8"))
            vr, vk = b.get("voice_rate"), b.get("voice_rate_key")
            own = isinstance(vr, str) and vr.strip()
            base = vr.strip() if own else rate
            key = vk.strip() if isinstance(vk, str) and vk.strip() else (None if own else key_rate)
            return base, key
    return rate, key_rate


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


def expand_boundaries(wbs):
    """Split a compound WordBoundary into one slot per token, so the 1:1 word walk stays in step.

    MEASURED 2026-08-15 (en-US-AndrewMultilingualNeural, edge-tts 7.2.8): edge-tts emits a hyphenated
    compound as a SINGLE event ("seventy-five", "character-exact"), while tokens_of splits it in two.
    The mapping below consumes one event per token in strict order, so each compound shifted every
    LATER word by one — on 021 the drift reached the takeaway scene and exposed a spliced pause 1.4s
    early. Share the event's span across its parts (proportional to length) instead of guessing.
    """
    out = []
    for wb in wbs:
        parts = [p for p in re.split(r"[-–—]", wb["w"]) if norm(p)]
        if len(parts) <= 1:
            out.append(wb)
            continue
        total = sum(len(p) for p in parts)
        span = wb["end"] - wb["start"]
        t = wb["start"]
        for i, p in enumerate(parts):
            # the last part keeps the event's exact end — the track clock must not drift by rounding
            end = wb["end"] if i == len(parts) - 1 else t + span * len(p) / total
            out.append({"w": p, "start": round(t, 3), "end": round(end, 3)})
            t = end
    return out


async def main(cid: str):
    cdir = ROOT / "content" / cid
    cfg = json.loads((ROOT / "pipeline" / "shared" / "config.json").read_text(encoding="utf-8"))
    voice = cfg["voice"]["edge_tts"]["voice"]
    # Default pace = the format recipe's `voice` (D-068); a brief's voice_rate (+ voice_rate_key for
    # key takes) overrides it for one video.
    rate, key_rate = read_pacing(cdir, *recipe_pacing(cfg["voice"]["edge_tts"].get("rate", "+0%")))

    script = json.loads((cdir / "script.json").read_text(encoding="utf-8"))

    # ordered sentences with scene + expected tokens
    sents = []
    for sc in script["scenes"]:
        for s in sc["sentences"]:
            sents.append({"scene": sc["id"], "text": s, "tok": tokens_of(s)})

    # One segment per run of sentences between scripted pauses / rate changes (usually exactly one).
    pauses = pause_map(script["scenes"])
    keys = key_take_set(script["scenes"])
    # D-078: the hook + after-hook run faster than the body, to hold the viewer through the first ~15 s.
    opening = read_opening(cdir)
    tempo = float(opening["tempo"]) if opening else 1.0
    fast = set(opening_sentences(script["scenes"], tempo, float(opening["max_seconds"]), int(opening["max_scenes"]), float(opening["words_per_second"]))) if opening else set()
    open_ids = list(dict.fromkeys(sents[i]["scene"] for i in sorted(fast)))  # the scenes it touches, in order
    segments = [([sents[i] for i in idx], r, p) for idx, r, p in plan_segments(len(sents), pauses, keys, rate, key_rate, fast, tempo)]

    # synthesize: collect audio + word boundaries, shifting each segment by everything before it
    (cdir / "voice").mkdir(parents=True, exist_ok=True)
    mp3 = cdir / "voice" / "narration.mp3"
    audio = bytearray()
    wbs = []  # {w, start, end}
    offset = 0.0
    inserted = 0.0
    for si_seg, (seg_sents, seg_rate, pause_seconds) in enumerate(segments):
        text = " ".join(s["text"] for s in seg_sents)
        # edge-tts >= 7 defaults to boundary="SentenceBoundary" — with that default the stream emits
        # NO WordBoundary events at all and every word below silently lands at 0.0s, i.e. a valid-looking
        # alignment.json with a completely dead clock. Ask for word boundaries explicitly (older releases
        # have no such kwarg and always emitted them, hence the fallback).
        try:
            comm = edge_tts.Communicate(text, voice, rate=seg_rate, boundary="WordBoundary")
        except TypeError:
            comm = edge_tts.Communicate(text, voice, rate=seg_rate)
        seg_audio = bytearray()
        seg_last = 0.0
        async for ch in comm.stream():
            if ch["type"] == "audio":
                seg_audio += ch["data"]
            elif ch["type"] == "WordBoundary":
                start = offset + ch["offset"] / 1e7
                end = offset + (ch["offset"] + ch["duration"]) / 1e7
                seg_last = max(seg_last, (ch["offset"] + ch["duration"]) / 1e7)
                wbs.append({"w": ch["text"], "start": round(start, 3), "end": round(end, 3)})
        # a segment that ends only because the RATE changes (no pause, not the last) is cut back to an
        # ordinary sentence break — see RATE_BOUNDARY_TAIL. Pause boundaries keep their behaviour.
        if pause_seconds <= 0 and si_seg + 1 < len(segments):
            seg_audio = bytearray(trim_tail(bytes(seg_audio), seg_last))
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

    # one slot per expected token before the 1:1 walk below (a hyphenated compound arrives as one event)
    wbs = expand_boundaries(wbs)

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
    if open_ids:
        # read by compile-hyperframes (the opening's quicker motion budget) and 05-qa (opening_tempo)
        alignment["opening"] = {"scenes": open_ids, "sentences": sorted(fast), "tempo": tempo}
    (cdir / "alignment.json").write_text(json.dumps(alignment, indent=2) + "\n", encoding="utf-8")

    print(f"OK  voice/narration.mp3  ({len(audio)//1024} KB)")
    print(f"OK  alignment.json  ({len(sentences_out)} sentences, {len(words_out)} words, {duration:.1f}s)")
    print(f"voice={voice} rate={rate}" + (f" key_rate={key_rate} ({len(keys)} key takes)" if key_rate and keys else ""))
    if inserted > 0:
        print(f"    {len(segments)} segments, {inserted:.2f}s of scripted silence spliced in")
    if open_ids:
        last = sentences_out[max(fast)]
        print(f"    opening {len(fast)} sentence(s) in {', '.join(open_ids)}, 0-{last['end']:.1f}s, at {tempo}x the body pace (D-078)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/make_voice.py <content_id>")
    asyncio.run(main(sys.argv[1]))
