import { interpolate, spring } from "remotion";

/** Shared entrance helper: spring-driven opacity + upward translate. */
export const fadeUp = (
  frame: number,
  fps: number,
  delay = 0,
  dur = 26,
  distance = 34
) => {
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: dur,
  });
  return { opacity: s, y: interpolate(s, [0, 1], [distance, 0]), s };
};

/** Spring 0->1 with a delay, for scale/draw progress. */
export const progress = (frame: number, fps: number, delay = 0, dur = 28) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: dur });
