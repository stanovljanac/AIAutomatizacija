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
 * Branded intro sting (VISUAL_IDENTITY §7 + owner re-skin 2026-06-13): the gold "desk" mark
 * lands over a black+gold aurora, the wordmark rises, a gold rule sweeps, tagline fades in.
 * Cinematic but short. Gold (theme.highlight) is the intro/outro accent — heroes + stings are
 * black/gold; the body keeps electric blue.
 */
const GOLD = theme.color.highlight; // #FFB020

export const Intro: React.FC<{ wordmark: string; tagline: string }> = ({ wordmark, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // The intro Sequence is ~1.5s (45f) + crossfade; frame is sequence-relative. SceneWrapper
  // crossfades the intro out, so all motion just needs to LAND by ~frame 38. No manual fade.

  // the gold mark lands with a spring + a soft glow ring that expands
  const markPop = spring({ frame, fps, config: { damping: 14, stiffness: 120 }, durationInFrames: 18 });
  const markScale = interpolate(markPop, [0, 1], [0.55, 1]);
  const markOpacity = interpolate(frame, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = interpolate(frame, [2, 24], [0.6, 1.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ringO = interpolate(frame, [2, 24], [0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const wordRise = spring({ frame: frame - 9, fps, config: { damping: 200 }, durationInFrames: 16 });
  const wordY = interpolate(wordRise, [0, 1], [26, 0]);
  const wordO = interpolate(frame, [9, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const underline = interpolate(frame, [18, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagO = interpolate(frame, [22, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <GoldAurora intensity={1} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          {/* gold desk mark + expanding glow ring */}
          <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 18px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${GOLD}`, transform: `scale(${ring})`, opacity: ringO }} />
            <Img
              src={staticFile("brand/logo.png")}
              style={{ width: 240, height: 240, objectFit: "contain", transform: `scale(${markScale})`, opacity: markOpacity, filter: `drop-shadow(0 0 26px ${GOLD}66)` }}
            />
          </div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 112, letterSpacing: -2, color: theme.color.textPrimary, transform: `translateY(${wordY}px)`, opacity: wordO, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
            {wordmark}
          </div>
          <div style={{ height: 6, width: 360, margin: "22px auto 0", borderRadius: 3, background: `linear-gradient(90deg, ${GOLD}, #ffd37a)`, transform: `scaleX(${underline})`, transformOrigin: "center", boxShadow: `0 0 22px ${GOLD}88` }} />
          <div style={{ marginTop: 26, fontFamily: theme.font.body, fontWeight: 600, fontSize: 34, letterSpacing: 8, textTransform: "uppercase", color: "#ffd37a", opacity: tagO }}>
            {tagline}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
