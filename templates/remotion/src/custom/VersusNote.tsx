import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fadeUp } from "../lib/anim";

/**
 * Full-frame "X vs Y" note (D-022 bespoke). Two tool cards (logo from public/brand/ if
 * build-props wired it, else a wordmark fallback) + a center "VS", with a list of short
 * caveat lines that reveal in sync with the narration (data.reveals). Used so a long
 * caveat is never a near-empty static screen (no-empty-scene rule).
 *
 * props: { title?, left, right, leftLogo?, rightLogo?, items?: string[], reveals?: number[] }
 */
const Side: React.FC<{ name: string; logo?: string; o: number; dx: number }> = ({ name, logo, o, dx }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: o, transform: `translateX(${dx}px)` }}>
    <div style={{ width: 190, height: 190, borderRadius: 30, background: theme.color.surface, border: `2px solid ${theme.color.accent}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {logo ? (
        <Img src={staticFile(logo)} style={{ width: "70%", height: "70%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 32, color: theme.color.textPrimary, textAlign: "center", padding: 10, lineHeight: 1.1 }}>{name}</span>
      )}
    </div>
    <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: theme.color.textSecondary }}>{name}</div>
  </div>
);

export const VersusNote: React.FC<{ data?: any }> = ({ data = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const l = fadeUp(frame, fps, 0, 16);
  const r = fadeUp(frame, fps, 6, 16);
  const v = fadeUp(frame, fps, 12, 16);
  const items: string[] = data.items ?? [];
  const reveals: number[] | undefined = data.reveals;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 9% 210px" }}>
      {data.title && (
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 54, color: theme.color.textPrimary, marginBottom: 46, opacity: v.opacity, transform: `translateY(${v.y}px)` }}>{data.title}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 64, marginBottom: 50 }}>
        <Side name={data.left ?? "ChatGPT"} logo={data.leftLogo} o={l.opacity} dx={interpolate(l.opacity, [0, 1], [-50, 0])} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 76, color: theme.color.accent, opacity: v.opacity }}>VS</div>
        <Side name={data.right ?? "Claude"} logo={data.rightLogo} o={r.opacity} dx={interpolate(r.opacity, [0, 1], [50, 0])} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", maxWidth: 1240 }}>
        {items.map((it, i) => {
          const a = fadeUp(frame, fps, reveals && reveals[i] != null ? reveals[i] : 20 + i * 22);
          return (
            <div key={i} style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 40, color: theme.color.textPrimary, textAlign: "center", opacity: a.opacity, transform: `translateY(${a.y}px)` }}>{it}</div>
          );
        })}
      </div>
    </div>
  );
};
