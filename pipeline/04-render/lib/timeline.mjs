// V5 — the engine-agnostic TIMELINE builder. Pure (no fs, no media). Turns a video's
// script + scene-plan + forced-alignment into a `timeline.json` (schema: timeline.schema.json)
// expressed entirely in ABSOLUTE video-SECONDS, with a per-scene `engine` field. The render engine
// is then a swappable back-end: a per-engine compiler (compile-remotion.mjs today; compile-hyperframes
// later) translates these seconds into its own frames/offsets. This decouples the forced-alignment
// SYNC logic (which lives here) from any one renderer.
//
// FRAME-ACCURATE CONTRACT: every stored second is SNAPPED to an exact frame at `fps` — each value is
// literally `frameIndex / fps`, where frameIndex is computed the SAME way build-props used to (the
// integer intro offset plus `Math.round(rawSeconds * fps)`). This is deliberate: naive absolute math
// (`round((introSeconds + rawSeconds) * fps)`) is NOT equal to `introFrames + round(rawSeconds * fps)`
// in IEEE-754 (e.g. rawSeconds=0.55 @ fps=30 → 61.4999… rounds to 61, not 62), which would drift scene
// cuts/reveals by a frame on real alignments. By snapping here, a compiler's `Math.round(seconds * fps)`
// recovers the exact frame with no float slop — single-value events (scene starts, reveals, focal cues)
// match the legacy inline math EXACTLY for all inputs; proven byte-identical on content/_FIXTURE.

import { resolveCueWindowSeconds } from "./focal.mjs";

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * @param {object} args
 * @param {object} args.script      script.json
 * @param {object} args.plan        scene-plan.json
 * @param {object} args.alignment   alignment.json (sentences[], words[], duration)
 * @param {object} args.fmt         resolved format recipe (for motion + branding)
 * @param {object} args.timings     deriveRenderTimings(fmt) — introFrames/outroFrames/captions
 * @param {number} args.fps
 * @param {number} args.crossfadeFrames  resolved crossfade (config override already applied)
 * @param {{width:number,height:number}} args.dims
 * @param {string} args.outId       flattened content id (slashes → dashes)
 * @returns a timeline object satisfying timeline.schema.json
 */
export function buildTimeline({ script, plan, alignment, fmt, timings, fps, crossfadeFrames, dims, outId }) {
  const introFrames = timings.introFrames;
  // SNAP a raw (narration-relative) second to its absolute frame, as seconds. This is the legacy frame
  // `introFrames + Math.round(raw*fps)` divided by fps — so a compiler's round(sec*fps) recovers it exactly.
  const frameSec = (frame) => frame / fps;
  const snap = (rawSeconds) => frameSec(introFrames + Math.round(rawSeconds * fps));
  const introSeconds = frameSec(introFrames);
  const outroSeconds = frameSec(timings.outroFrames);
  const audioDuration = alignment.duration;
  const audioEndSeconds = snap(audioDuration); // narration end = intro + round(duration*fps), as seconds

  const planBy = Object.fromEntries(plan.scenes.map((s) => [s.scene_id, s]));
  const sentByScene = {};
  for (const s of alignment.sentences) (sentByScene[s.scene] ??= []).push(s);
  const wordsByScene = {};
  for (const w of alignment.words ?? []) (wordsByScene[w.scene] ??= []).push(w);

  // flatten script scenes → visual beats (one script scene may fan out into several timed beats)
  const beats = [];
  for (const sc of script.scenes) {
    const sents = sentByScene[sc.id] ?? [];
    const ps = planBy[sc.id] ?? { template: "section-header", props: { title: sc.id } };
    // D-060: a scene's `transitionOut` describes how the SCENE exits, so on a beat fan-out it governs
    // the LAST beat only; inner beat boundaries default to `cut` unless the beat authored its own.
    // `direction` is art-direction prose for the author and is deliberately NOT copied — keeping it out
    // of the timeline keeps it out of jobVariables, and therefore out of the HF render cache key.
    const defs = ps.beats?.length
      ? ps.beats.map((b, bi) => ({ template: b.template, engine: b.engine ?? ps.engine, props: { ...b.props }, sentences: b.sentences, revealOn: b.revealOn ?? ps.revealOn, cueWords: b.cueWords ?? ps.cueWords, transitionOut: b.transitionOut ?? (bi === ps.beats.length - 1 ? ps.transitionOut : undefined) }))
      : [{ template: ps.template, engine: ps.engine, props: { ...ps.props }, revealOn: ps.revealOn, cueWords: ps.cueWords, transitionOut: ps.transitionOut }];

    const n = defs.length;
    defs.forEach((d, bi) => {
      let slice;
      if (d.sentences) slice = sents.slice(d.sentences[0], d.sentences[1] + 1);
      else {
        const a = Math.floor((bi * sents.length) / n);
        const b = Math.floor(((bi + 1) * sents.length) / n);
        slice = sents.slice(a, Math.max(b, a + 1));
      }
      if (!slice.length) slice = [sents[Math.min(bi, sents.length - 1)] ?? { start: 0, end: 0.5 }];
      beats.push({ sceneId: `${sc.id}.${bi}`, sid: sc.id, template: d.template, engine: d.engine, props: d.props, sents: slice, revealOn: d.revealOn, cueWords: d.cueWords, transitionOut: d.transitionOut });
    });
  }

  const scenes = beats.map((bt, k) => {
    const startSeconds = snap(bt.sents[0].start);
    const endSeconds = k + 1 < beats.length ? snap(beats[k + 1].sents[0].start) : audioEndSeconds;
    const props = { ...bt.props };

    // reveal-sync for list/flow/diagram sub-elements → absolute seconds (engine subtracts its lead)
    const arr = props.items ?? props.steps ?? props.nodes;
    let reveals;
    if (Array.isArray(arr) && arr.length) {
      const sw = (wordsByScene[bt.sid] ?? []).filter((w) => w.start >= bt.sents[0].start - 0.01);
      reveals = [];
      for (let i = 0; i < arr.length; i++) {
        let absSec;
        if (bt.cueWords && bt.cueWords[i]) {
          const cue = norm(bt.cueWords[i]);
          const hit = sw.find((w) => norm(w.w) === cue);
          absSec = hit ? hit.start : (bt.sents[Math.min(i, bt.sents.length - 1)]?.start ?? bt.sents[0].start);
        } else {
          absSec = bt.sents[Math.min(i, bt.sents.length - 1)]?.start ?? bt.sents[0].start;
        }
        reveals.push({ at_seconds: snap(absSec) });
      }
    } else if (bt.revealOn === "sentences" && Array.isArray(bt.sents) && bt.sents.length) {
      // Generic per-sentence reveals for scenes with no list to map (e.g. a bespoke HyperFrames
      // scene that wants the narration's sentence beats as its motion cues). One reveal per sentence.
      reveals = bt.sents.map((s) => ({ at_seconds: snap(s.start) }));
    }

    // Sequential reveals MUST build in author order. A later element's cue word can resolve EARLIER
    // in the narration than an earlier element's (008 flow: node 3 "re-checks" landed before node 2
    // "reads"), which pops a downstream node before its upstream one — the chain assembled out of
    // order on screen. Clamp the reveal times to be non-decreasing so a flow/list/diagram always
    // builds left-to-right / top-to-bottom regardless of where its cue words fall.
    if (Array.isArray(reveals)) {
      for (let i = 1; i < reveals.length; i++) {
        if (reveals[i].at_seconds < reveals[i - 1].at_seconds) reveals[i] = { at_seconds: reveals[i - 1].at_seconds };
      }
    }

    // motivated-motion (opt-in): resolve focalZoom / pip cue words → ABSOLUTE (frame-snapped) seconds.
    const sceneWords = wordsByScene[bt.sid] ?? [];
    if (props.focalZoom) props.focalZoom = resolveCueWindowSeconds(props.focalZoom, sceneWords, { introFrames, fps });
    if (props.pip) props.pip = resolveCueWindowSeconds(props.pip, sceneWords, { introFrames, fps });

    const scene = {
      scene_id: bt.sceneId,
      engine: bt.engine ?? "remotion",
      template: bt.template,
      start_seconds: startSeconds,
      end_seconds: endSeconds,
      // conditional spread (same idiom as `engine` in the compilers): an unauthored boundary emits no
      // key at all, so a plan that never mentions transitions produces the pre-D-060 timeline shape.
      ...(bt.transitionOut ? { transition_out: bt.transitionOut } : {}),
      props,
    };
    if (reveals) scene.reveals = reveals;
    return scene;
  });

  // caption cues — words grouped into <=2-line chunks, each timed to its words as spoken. Same grouping
  // as before (max-words / scene change / gap); emitted in absolute seconds. The "AI" display-casing is
  // applied here (a caption-copy concern), so the compiler passes words through verbatim.
  const words = (alignment.words ?? []).filter((w) => w && w.w).slice().sort((a, b) => a.start - b.start);
  const MAX_WORDS = timings.captions.maxWords;
  const GAP = timings.captions.gapSeconds;
  const groups = [];
  let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const next = words[i + 1];
    const boundary = !next || cur.length >= MAX_WORDS || next.scene !== words[i].scene || (next.start - words[i].end) > GAP;
    if (boundary) { groups.push(cur); cur = []; }
  }
  // Captions are NOT snapped (unlike the sync-critical scene cuts/reveals above, which ARE). A caption's
  // frame timing — cue.fromFrame and each word's relFrom/relDur — is computed in the compiler from
  // DIFFERENCES of these times, and the legacy build-props rounded the RAW difference,
  // `round((rawWord - rawCue)*fps)`. Snapping each word to its own frame first would turn that into a
  // difference-of-rounded-frames, which diverges from the golden on the fixture. So we keep word times on
  // the un-snapped absolute clock (introSeconds + raw). On the fixture (and whenever values avoid an FP
  // half-frame boundary) the intro offset cancels in the compiler's subtraction and the caption frames
  // are byte-identical to legacy. At a boundary the un-snapped subtraction can differ from legacy by ≤1
  // frame — a per-word fade-timing wobble of ≤1/fps s (≤33ms @30), imperceptible and never an AUDIO
  // desync (the narration track and the snapped scene/reveal cuts are unaffected). We accept that ≤1px
  // caption wobble to preserve the exact byte-identical golden, which is the V5 acceptance proof.
  const captions = groups.map((g) => ({
    start_seconds: introSeconds + g[0].start,
    end_seconds: introSeconds + g[g.length - 1].end,
    words: g.map((w) => ({ w: /^ai$/i.test(w.w) ? "AI" : w.w, start_seconds: introSeconds + w.start, end_seconds: introSeconds + w.end })),
  }));

  // Optional SOUND DESIGN layer (D-063). The narration is still the one continuous track that is
  // never cut; these are ADDITIONAL tracks mixed alongside it — a quiet bed under the whole video and
  // one-shot cues (a riser into a run, an impact on a reveal). Authored in scene-plan.audio because
  // it is art direction; `at_seconds` is authored on the NARRATION clock, the same clock as
  // alignment.json, and snapped to a frame here so a cue lands exactly on the beat it was written for.
  const sfxIn = plan.audio?.sfx ?? [];
  const audioLayers = {
    ...(plan.audio?.bed ? { bed: { src: plan.audio.bed.src, gain: plan.audio.bed.gain ?? 0.08 } } : {}),
    ...(sfxIn.length
      ? { sfx: sfxIn.map((c) => ({ src: c.src, at_seconds: snap(c.atSeconds), gain: c.gain ?? 0.6 })) }
      : {}),
  };

  return {
    version: 1,
    out_id: outId,
    format: { width: dims.width ?? 1920, height: dims.height ?? 1080, fps },
    duration_seconds: audioEndSeconds + outroSeconds, // (intro + round(dur*fps) + outro) frames, as seconds
    audio: { src: `${outId}/narration.mp3`, start_seconds: introSeconds },
    // conditional spread: a plan with no sound design emits no key, so its timeline keeps the
    // pre-D-063 shape byte-for-byte.
    ...(Object.keys(audioLayers).length ? { audio_layers: audioLayers } : {}),
    intro: { duration_seconds: introSeconds, wordmark: "The Automation Desk", tagline: "automate the boring stuff" },
    outro: { duration_seconds: outroSeconds, cta: "@TheAutomationDesk", brand: "" },
    crossfade_seconds: crossfadeFrames / fps,
    motion: fmt.motion,
    scenes,
    captions,
  };
}
