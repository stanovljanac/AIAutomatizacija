import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "./theme";
import { BackgroundFX } from "./components/BackgroundFX";
import { Icon, IconName } from "./icons/Icon";

/**
 * YouTube thumbnail (1280x720). Rendered as a still with --props for each variant.
 *   npx remotion still Thumbnail out/thumb.png --props='{...}'
 *
 * Thumbnails should NOT be formulaic. `motif` picks the hero visual so variants (and
 * different videos) look distinct: an icon row of the actual topic, one big faded icon,
 * or the generic flow. `kicker` is optional — omit it unless it's a real, clear label.
 */
export type ThumbProps = {
  kicker?: string;
  line1: string;
  line2: string;
  accent2?: boolean;
  icon?: IconName;
  motif?: "iconRow" | "bigIcon" | "flow" | "none";
  icons?: IconName[];
  bigIcon?: IconName;
};

export const thumbDefault: ThumbProps = {
  line1: "STILL DOING THIS",
  line2: "BY HAND?",
  accent2: true,
  icon: "spreadsheet",
  motif: "flow",
};

const IconRow: React.FC<{ icons: IconName[] }> = ({ icons }) => (
  <div style={{ position: "absolute", top: 70, right: 60, display: "flex", alignItems: "center", gap: 18 }}>
    {icons.map((ic, i) => (
      <div key={i} style={{ width: 92, height: 92, borderRadius: 18, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={ic} size={50} color={theme.color.accent} accent={theme.color.accentSecondary} />
      </div>
    ))}
  </div>
);

const FlowMotif: React.FC = () => {
  const items: IconName[] = ["spreadsheet", "ai", "check"];
  return (
    <div style={{ position: "absolute", top: 56, right: 60, display: "flex", alignItems: "center", gap: 22, opacity: 0.22 }}>
      {items.map((ic, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="arrow" size={40} color={theme.color.accent} />}
          <div style={{ width: 96, height: 96, borderRadius: 16, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={ic} size={52} color={theme.color.accent} accent={theme.color.accentSecondary} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

const BigIcon: React.FC<{ name: IconName }> = ({ name }) => (
  <div style={{ position: "absolute", right: -40, top: "50%", transform: "translateY(-50%)", opacity: 0.16 }}>
    <Icon name={name} size={620} color={theme.color.accent} accent={theme.color.accentSecondary} />
  </div>
);

export const Thumbnail: React.FC<ThumbProps> = ({ kicker, line1, line2, accent2, icon, motif = "flow", icons = [], bigIcon = "ai" }) => (
  <AbsoluteFill style={{ backgroundColor: theme.color.bg }}>
    <BackgroundFX />
    {motif === "iconRow" && <IconRow icons={icons} />}
    {motif === "bigIcon" && <BigIcon name={bigIcon} />}
    {motif === "flow" && <FlowMotif />}
    <AbsoluteFill style={{ padding: "0 70px", justifyContent: "center" }}>
      {(kicker || icon) && (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}>
          {icon && (
            <div style={{ width: 64, height: 64, borderRadius: 14, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={38} color={theme.color.accent} accent={theme.color.accentSecondary} />
            </div>
          )}
          {kicker && <div style={{ fontFamily: theme.font.body, fontWeight: 800, letterSpacing: 5, fontSize: 28, color: theme.color.accentSecondary }}>{kicker}</div>}
        </div>
      )}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 120, lineHeight: 1.02, color: theme.color.textPrimary }}>{line1}</div>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 120, lineHeight: 1.02, color: accent2 ? theme.color.accent : theme.color.textPrimary }}>{line2}</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
