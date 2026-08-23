// FRAME GATE — the mechanical answer to the owner's standing complaint that scenes look
// "too simple, plain and generic" (2026-08-22, on 022; the same verdict on 021 produced D-064).
// Prose rules about filling the stage (MOTION_SPEC §0/§10) kept being ignored because nothing
// checked them, so this file checks them.
//
// WHAT THE CALIBRATION ACTUALLY FOUND (2026-08-22, 24 evenly-spaced frames per video).
// The first hypothesis was that the rejected videos have EMPTY frames. Measured, that is false:
//
//     ink coverage      012 (benchmark)  median 15.6%      022 (rejected)  median 17.5%
//
// 022 is marginally FULLER than the video the owner locked as the floor. Emptiness is not the
// defect. What separates them is what is drawn IN the filled area — 022's pages are blank white
// bars and its cards are an empty rounded rect with a dot and a line. So the discriminating
// measurement is FINE DETAIL: text, texture and material produce small-scale variation; flat
// fills and smooth gradients do not, however much of the frame they cover.
//
//     detail density    012  median 4.15%  p25 2.45%      022  median 3.92%  p25 1.81%
//                       021  median 2.04%  p25 1.45%   <- the "slideshow" verdict, clearly apart
//
// So the gate is primarily a DETAIL floor, with the coverage/box pair kept as the backstop for
// the genuinely empty frame (022 @90s: coverage 6.3%, box 6.7%, detail 0.62% — fails all three).
//
// Pure — no fs, no ffmpeg, no media decoding. The CLI (frame-gate.mjs) fetches pixels and hands a
// grayscale plane in, so every threshold here is unit-testable on synthetic frames.

/** Default analysis knobs. Every value below is calibrated, not guessed — see the header. */
export const DEFAULTS = {
  captionBandFrac: 0.15, // bottom band carries burned-in captions; never counted as scene content
  detailThreshold: 12, // departure from the 3x3 mean (0-255) that counts as real detail
  blurFrac: 0.06, // background-estimate radius, as a fraction of the frame's short side
  inkThreshold: 12, // departure from the local background that counts a pixel as ink
  spanPercentile: 0.08, // trim this share of ink from each end before measuring span
};

/**
 * Separable box blur over a Float32 plane. Two O(n) passes with a running sum, so cost does not
 * grow with the radius — which is what a background estimate needs. Edges clamp, so a bright frame
 * border cannot invent ink. Pure.
 */
export function boxBlur(plane, width, height, radius) {
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(plane.length);
  const out = new Float32Array(plane.length);
  const win = 2 * r + 1;

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = plane[row] * (r + 1);
    for (let x = 1; x <= r; x++) sum += plane[row + Math.min(x, width - 1)];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum / win;
      sum += plane[row + Math.min(x + r + 1, width - 1)] - plane[row + Math.max(x - r, 0)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = tmp[x] * (r + 1);
    for (let y = 1; y <= r; y++) sum += tmp[Math.min(y, height - 1) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / win;
      sum += tmp[Math.min(y + r + 1, height - 1) * width + x] - tmp[Math.max(y - r, 0) * width + x];
    }
  }
  return out;
}

/**
 * FINE DETAIL DENSITY — the fraction of the analyzed area whose luminance departs from its own
 * 3x3 neighbourhood. This is the metric that matches the owner's verdict: readable text, texture
 * and material score; a blank bar, a flat card and a smooth gradient do not, no matter how large.
 *
 * Resolution matters and is the caller's job: measure at >= 960x540, because downscaling far below
 * that destroys exactly the text detail the metric exists to find.
 * @param gray  one byte per pixel, length >= width*height
 * Pure.
 */
export function detailDensity(gray, { width, height, detailThreshold = DEFAULTS.detailThreshold, captionBandFrac = DEFAULTS.captionBandFrac } = {}) {
  assertPlane(gray, width, height, "detailDensity");
  const band = Math.max(3, Math.round(height * (1 - captionBandFrac)));
  let hits = 0;
  for (let y = 1; y < band - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const row = (y + dy) * width + x;
        sum += gray[row - 1] + gray[row] + gray[row + 1];
      }
      if (Math.abs(gray[y * width + x] - sum / 9) >= detailThreshold) hits++;
    }
  }
  return hits / ((band - 2) * (width - 2));
}

/**
 * INK COVERAGE + SPAN — the backstop for a genuinely empty stage. "Ink" is every pixel that departs
 * from a heavily blurred copy of the frame, which makes the measure independent of palette and of
 * how bright a scene happens to be (our stage is a smooth dark gradient; a naive non-black test
 * would score the background as content).
 *
 *   coverage  fraction of the analyzed area that is ink       — catches the empty frame
 *   spanX/Y   fraction of width/height the ink reaches across — catches a small object in a void
 *   boxFrac   spanX * spanY, the content bounding box as a share of frame area
 * Pure.
 */
export function measureInk(gray, opts = {}) {
  const { width, height } = opts;
  assertPlane(gray, width, height, "measureInk");
  const cfg = { ...DEFAULTS, ...opts };

  // The caption band is burned in by the renderer, not authored by the scene — counting it would
  // let a wall of subtitles paper over an empty stage.
  const analyzedHeight = Math.max(2, Math.round(height * (1 - cfg.captionBandFrac)));

  const plane = new Float32Array(width * analyzedHeight);
  for (let i = 0; i < plane.length; i++) plane[i] = gray[i];

  const radius = Math.max(2, Math.round(Math.min(width, analyzedHeight) * cfg.blurFrac));
  const bg = boxBlur(plane, width, analyzedHeight, radius);

  const rowHits = new Uint32Array(analyzedHeight);
  const colHits = new Uint32Array(width);
  let inkPixels = 0;
  for (let y = 0; y < analyzedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (Math.abs(plane[i] - bg[i]) >= cfg.inkThreshold) {
        inkPixels++;
        rowHits[y]++;
        colHits[x]++;
      }
    }
  }

  const spanY = spanFraction(rowHits, inkPixels, cfg.spanPercentile);
  const spanX = spanFraction(colHits, inkPixels, cfg.spanPercentile);
  return {
    coverage: inkPixels / (width * analyzedHeight),
    spanX,
    spanY,
    boxFrac: spanX * spanY,
    inkPixels,
    analyzedPixels: width * analyzedHeight,
  };
}

/** Both measurements over one grayscale frame. Pure. */
export function measureFrame(gray, opts = {}) {
  return { ...measureInk(gray, opts), detail: detailDensity(gray, opts) };
}

/**
 * How far the ink reaches along one axis, as a fraction of that axis. Trims `pct` of the ink from
 * each end first, so a corner source-chip or a stray dust mote cannot report a full-height subject
 * (calibrated: the untrimmed span read 81% on a frame whose subject covered a third of the
 * height, because a chip in one corner and the object in the middle bracketed the frame between
 * them). Returns 0 when there is no ink. Pure.
 */
export function spanFraction(hits, totalInk, pct = DEFAULTS.spanPercentile) {
  if (!totalInk) return 0;
  const trim = totalInk * pct;
  let acc = 0;
  let lo = 0;
  let hi = hits.length - 1;
  for (let i = 0; i < hits.length; i++) {
    acc += hits[i];
    if (acc > trim) {
      lo = i;
      break;
    }
  }
  acc = 0;
  for (let i = hits.length - 1; i >= 0; i--) {
    acc += hits[i];
    if (acc > trim) {
      hi = i;
      break;
    }
  }
  return hi >= lo ? (hi - lo + 1) / hits.length : 0;
}

/**
 * The floors, per scene role. `detail` is the primary gate (see the header); `coverage` and
 * `boxFrac` are the empty-stage backstop.
 *
 * The body floor sits at 012's measured p25 (2.45% → 2.4%), so it flags the bottom quartile of
 * the two rejected videos while the benchmark's own body frames clear it. Roles whose composition
 * is deliberately quiet get their own floors — the signature black+gold monolith close (021 s22 /
 * 022 s25 / 023 s25) is ONE line of big type BY DESIGN and must never be bullied into clutter.
 */
export const FLOORS = {
  default: { detail: 0.024, coverage: 0.08, boxFrac: 0.18 },
  // hook: the tightest pacing and the fullest frame of the whole video (MOTION_SPEC §2).
  hook: { detail: 0.03, coverage: 0.1, boxFrac: 0.22 },
  // cta/outro: the deliberate monolith, held to be screenshotted.
  cta: { detail: 0.008, coverage: 0.02, boxFrac: 0.08 },
  outro: { detail: 0.008, coverage: 0.02, boxFrac: 0.08 },
  // transition: connective tissue, frequently sampled mid-move.
  transition: { detail: 0.014, coverage: 0.04, boxFrac: 0.12 },
};

/** Floors for a scene role, falling back to the default set. Pure. */
export function floorsFor(role) {
  return FLOORS[role] ?? FLOORS.default;
}

const pc = (v) => `${(v * 100).toFixed(1)}%`;

/**
 * Does this frame clear the floors for its role?
 * @param measured  the object returned by measureFrame
 * @param role      the script scene role (hook|intro|point|demo|transition|cta|outro)
 * @returns {{ pass, detail, coverage, boxFrac, floors, reasons[] }} — fails-closed: any missed
 *          floor fails the frame, and `reasons` names the fix, not just the number. Pure.
 */
export function gateFrame(measured, role = "point") {
  const floors = floorsFor(role);
  const reasons = [];
  if (measured.detail < floors.detail) {
    reasons.push(
      `plain frame: only ${pc(measured.detail)} of the stage carries real detail (floor ${pc(floors.detail)}). ` +
        `Blank bars and flat cards score low however big they are — give the objects readable content, texture and material (MOTION_SPEC §0).`,
    );
  }
  if (measured.coverage < floors.coverage) {
    reasons.push(`empty frame: ${pc(measured.coverage)} of the stage is drawn content (floor ${pc(floors.coverage)}).`);
  }
  if (measured.boxFrac < floors.boxFrac) {
    reasons.push(
      `subject too small: content spans ${pc(measured.spanX)} x ${pc(measured.spanY)} of the frame ` +
        `(box ${pc(measured.boxFrac)}, floor ${pc(floors.boxFrac)}) — MOTION_SPEC §10 asks for a hero at 55-65% of frame height.`,
    );
  }
  return {
    pass: reasons.length === 0,
    detail: measured.detail,
    coverage: measured.coverage,
    boxFrac: measured.boxFrac,
    spanX: measured.spanX,
    spanY: measured.spanY,
    floors,
    reasons,
  };
}

function assertPlane(gray, width, height, who) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 3 || height < 3) {
    throw new Error(`${who} needs integer width/height >= 3 (got ${width}x${height})`);
  }
  if (gray.length < width * height) {
    throw new Error(`${who}: plane holds ${gray.length} bytes, need ${width * height} for ${width}x${height}`);
  }
}
