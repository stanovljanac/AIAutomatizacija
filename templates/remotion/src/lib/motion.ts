import React from "react";
import type { Intensity } from "./anim";

/** The motion budget passed down from the format recipe (props.motion in Main). Scenes read it
 *  via useMotion() to scale how much they move — the "lively but calm" dial. */
export type MotionBudget = {
  intensity: Intensity;
  ambient?: boolean;
  emphasis?: boolean;
  max_moving_elements?: number;
};

export const DEFAULT_MOTION: MotionBudget = {
  intensity: "standard",
  ambient: true,
  emphasis: true,
};

export const MotionContext = React.createContext<MotionBudget>(DEFAULT_MOTION);

/** Read the active motion budget (defaults to `standard` when no provider is mounted, e.g. the gallery). */
export const useMotion = (): MotionBudget => React.useContext(MotionContext);
