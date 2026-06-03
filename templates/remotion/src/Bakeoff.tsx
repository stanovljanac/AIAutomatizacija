import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";

/**
 * Phase-2 RENDER BAKE-OFF (Remotion side) — DECISIONS D-019.
 * One representative "bullet-steps" hook scene from the Ideas archetype, built the
 * way the real fixed-template renderer will: a title + sequential bullets, brand
 * dark theme, accent emphasis, deterministic spring animation. Compare against the
 * HyperFrames version (same content) in templates/hyperframes/.
 *
 * Render:  npx remotion render BakeoffRemotion out/bakeoff-remotion.mp4
 *          npx remotion still BakeoffRemotion out/bakeoff-remotion.png --frame=120
 */
export type BakeoffProps = {
  kicker: string;
  title: string;
  items: string[];
};

export const bakeoffDefaultProps: BakeoffProps = {
  kicker: "BORING AI AUTOMATIONS",
  title: "3 boring tasks AI can automate",
  items: [
    "Clean messy spreadsheet imports",
    "Email invoices automatically",
    "Auto-build weekly schedules",
  ],
};

export const BakeoffScene: React.FC<BakeoffProps> = ({ kicker, title, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const titleY = interpolate(titleIn, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
      <BackgroundFX />
      <AbsoluteFill style={{ padding: "0 9%", justifyContent: "center" }}>
        {/* kicker */}
        <div
          style={{
            fontFamily: theme.font.body,
            fontWeight: 700,
            letterSpacing: 6,
            fontSize: 26,
            color: theme.color.accentSecondary,
            opacity: titleIn,
            marginBottom: 18,
          }}
        >
          {kicker}
        </div>

        {/* title */}
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 800,
            fontSize: 88,
            lineHeight: 1.05,
            color: theme.color.textPrimary,
            transform: `translateY(${titleY}px)`,
            opacity: titleIn,
            marginBottom: 56,
          }}
        >
          {title}
        </div>

        {/* sequential bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {items.map((item, i) => {
            const start = 24 + i * 18;
            const enter = spring({
              frame: frame - start,
              fps,
              config: { damping: 200 },
              durationInFrames: 16,
            });
            const x = interpolate(enter, [0, 1], [-40, 0]);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  opacity: enter,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: theme.color.surface,
                    border: `2px solid ${theme.color.accent}`,
                    color: theme.color.accent,
                    fontFamily: theme.font.heading,
                    fontWeight: 800,
                    fontSize: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: theme.font.body,
                    fontWeight: 600,
                    fontSize: 46,
                    color: theme.color.textPrimary,
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
