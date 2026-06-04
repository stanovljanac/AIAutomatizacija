import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";
import { Icon, IconName } from "./icons/Icon";

/**
 * YouTube thumbnail (1280x720). Rendered as a still with --props for each variant.
 *   npx remotion still Thumbnail out/thumb.png --props='{...}'
 */
export type ThumbProps = { kicker: string; line1: string; line2: string; accent2?: boolean; icon: IconName };

export const thumbDefault: ThumbProps = {
  kicker: "THE AUTOMATION DESK",
  line1: "STILL DOING THIS",
  line2: "BY HAND?",
  accent2: true,
  icon: "spreadsheet",
};

const FlowMotif: React.FC = () => {
  const box = (ic: IconName): React.CSSProperties => ({ width: 96, height: 96, borderRadius: 16, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" });
  const items: IconName[] = ["spreadsheet", "ai", "check"];
  return (
    <div style={{ position: "absolute", top: 56, right: 60, display: "flex", alignItems: "center", gap: 22, opacity: 0.22 }}>
      {items.map((ic, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="arrow" size={40} color={theme.color.accent} />}
          <div style={box(ic)}><Icon name={ic} size={52} color={theme.color.accent} accent={theme.color.accentSecondary} /></div>
        </React.Fragment>
      ))}
    </div>
  );
};

export const Thumbnail: React.FC<ThumbProps> = ({ kicker, line1, line2, accent2, icon }) => (
  <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
    <BackgroundFX />
    <FlowMotif />
    <AbsoluteFill style={{ padding: "0 70px", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={38} color={theme.color.accent} accent={theme.color.accentSecondary} />
        </div>
        <div style={{ fontFamily: theme.font.body, fontWeight: 800, letterSpacing: 5, fontSize: 28, color: theme.color.accentSecondary }}>{kicker}</div>
      </div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 120, lineHeight: 1.02, color: theme.color.textPrimary }}>{line1}</div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 120, lineHeight: 1.02, color: accent2 ? theme.color.accent : theme.color.textPrimary }}>{line2}</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
