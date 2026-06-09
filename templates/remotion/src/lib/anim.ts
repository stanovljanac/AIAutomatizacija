import { Easing, interpolate, spring } from "remotion";

/**
 * Motion vocabulary for the scene library. Everything here is **frame-pure** (no Date.now /
 * Math.random) so renders stay deterministic and seek-accurate. The goal (owner brief): lively
 * but CALM — purposeful motion on reveals/emphasis, not constant animation. The `Intensity`
 * budget (from the format recipe via MotionContext) scales how much things move.
 */

export type Intensity = "calm" | "standard" | "lively";

/** Travel-distance / amplitude multiplier for the motion budget. calm holds more; lively moves more. */
export const motionScale = (intensity: Intensity = "standard") =>
  intensity === "calm" ? 0.6 : intensity === "lively" ? 1.35 : 1;

/** Whether idle/continuous drift is allowed at this intensity (calm = no ambient motion). */
export const ambientOn = (intensity: Intensity = "standard") => intensity !== "calm";

/** Shared entrance helper: spring-driven opacity + upward translate. (Unchanged — used everywhere.) */
export const fadeUp = (
  frame: number,
  fps: number,
  delay = 0,
  dur = 26,
  distance = 34,
) => {
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: dur,
  });
  return { opacity: s, y: interpolate(s, [0, 1], [distance, 0]), s };
};

/** Spring 0->1 with a delay, for scale/draw progress. (Unchanged — used everywhere.) */
export const progress = (frame: number, fps: number, delay = 0, dur = 28) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });

/** Eased 0->1 ramp via interpolate + cubic bezier — monotonic, more character than a damped spring. */
export const ramp = (
  frame: number,
  delay = 0,
  dur = 18,
  easing: (t: number) => number = Easing.out(Easing.cubic),
) =>
  interpolate(frame - delay, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Spring presets (snappy / gentle / bouncy) returning 0->1, for entrances with character. */
export const springPreset = (
  frame: number,
  fps: number,
  delay = 0,
  kind: "snappy" | "gentle" | "bouncy" = "snappy",
) => {
  const config =
    kind === "bouncy"
      ? { damping: 12, stiffness: 120, mass: 0.8 }
      : kind === "gentle"
        ? { damping: 200, stiffness: 80 }
        : { damping: 26, stiffness: 170, mass: 0.7 };
  return spring({ frame: frame - delay, fps, config });
};

/** Count a number up from `from` to `to` over an eased (monotonic) ramp — lands exactly on `to`. */
export const countUp = (
  frame: number,
  to: number,
  { from = 0, delay = 0, dur = 26 }: { from?: number; delay?: number; dur?: number } = {},
) => from + (to - from) * ramp(frame, delay, dur, Easing.out(Easing.cubic));

/** SVG path draw-on: the strokeDashoffset for a path of `length`, given delay/dur (monotonic). */
export const draw = (frame: number, length: number, delay = 0, dur = 24) =>
  length * (1 - ramp(frame, delay, dur, Easing.inOut(Easing.cubic)));

/** A short scale "pop" for emphasis at frame `at` (peaks just over 1, settles back to 1). */
export const pop = (frame: number, at = 0, amount = 0.12) =>
  interpolate(frame - at, [0, 5, 12], [1, 1 + amount, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Subtle deterministic ambient drift (px) — frame-pure sine. Gate with ambientOn(intensity). */
export const drift = (frame: number, fps: number, amp = 6, periodSec = 6, phase = 0) =>
  amp * Math.sin((frame / (fps * periodSec)) * Math.PI * 2 + phase);

/** Per-item reveal frame: builder-provided `reveals[i]` (narration-synced) else a fixed cadence. */
export const staggerDelay = (
  reveals: number[] | undefined,
  i: number,
  base: number,
  step: number,
) => (reveals && reveals[i] != null ? reveals[i] : base + i * step);

/** Split a numeric on-screen value ("26,000", "92%", "3x", "Once.") into prefix/number/suffix so
 *  the number can count up while the surrounding text stays put. Returns num=null when there is no
 *  leading number to animate. */
export const splitNumeric = (value: string) => {
  const m = String(value).match(/^(\D*?)(-?[\d][\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null as number | null, suffix: String(value), decimals: 0, grouped: false };
  const raw = m[2];
  const grouped = raw.includes(",");
  const num = Number(raw.replace(/,/g, ""));
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  return { prefix: m[1], num, suffix: m[3], decimals, grouped };
};

/** Format a counted value back to a display string matching the original (grouping + decimals). */
export const formatNumber = (n: number, decimals: number, grouped: boolean) => {
  const fixed = n.toFixed(decimals);
  if (!grouped) return fixed;
  const [int, dec] = fixed.split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${withSep}.${dec}` : withSep;
};
