import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { GoldAurora } from "./BrandBackdrop";

/**
 * Outro sting (owner re-skin 2026-06-13): the gold "desk" mark + channel handle over the
 * black+gold aurora, with a "subscribe" prompt. Matches the Intro. The CTA copy still lives on
 * the previous scene; this is the branded end card. `cta` = handle, `brand` = optional kicker.
 */
const GOLD = theme.color.highlight; // #FFB020

export const Outro: React.FC<{ cta: string; brand: string }> = ({ cta, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markPop = spring({ frame, fps, config: { damping: 14, stiffness: 110 }, durationInFrames: 22 });
  const markScale = interpolate(markPop, [0, 1], [0.6, 1]);
  const markO = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rise = spring({ frame: frame - 10, fps, config: { damping: 200 }, durationInFrames: 22 });
  const y = interpolate(rise, [0, 1], [30, 0]);
  const handleO = interpolate(frame, [10, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subO = interpolate(frame, [24, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <GoldAurora intensity={0.9} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Img
            src={staticFile("brand/logo.png")}
            style={{ width: 180, height: 180, objectFit: "contain", margin: "0 auto 10px", transform: `scale(${markScale})`, opacity: markO, filter: `drop-shadow(0 0 24px ${GOLD}66)` }}
          />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 84, color: GOLD, transform: `translateY(${y}px)`, opacity: handleO, textShadow: "0 2px 22px rgba(0,0,0,0.6)" }}>
            {cta}
          </div>
          <div style={{ marginTop: 18, fontFamily: theme.font.body, fontWeight: 700, fontSize: 36, letterSpacing: 4, textTransform: "uppercase", color: "#ffd37a", opacity: subO }}>
            {brand ? brand : "Subscribe to The Automation Desk"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
