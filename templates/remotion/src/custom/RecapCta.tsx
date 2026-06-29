import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress, pop } from "../lib/anim";

/**
 * Bespoke (009 S7 — CTA). Replaces the dead title card: the hyped "money printer" is struck out,
 * the episode's three wins recap as ✔ glyphs (cleaned sheet / chased invoice / time back), then the
 * brand wordmark + a gently pulsing subscribe pill. One subtle subscribe CTA (the auto Outro follows).
 *
 * Portrait-first (1080×1920), frame-pure + seek-accurate. Beats key to the narration sentence
 * reveals (revealOn:"sentences"):
 *   reveals[0] "stop chasing the money printer" → printer✕ · reveals[1] "plug the boring leak" →
 *   title + recap checks · reveals[2] "follow The Automation Desk" → brand + subscribe. HOLDS at end.
 */
type Recap = { icon: IconName; label: string };
type Data = { title?: string; brand?: string; recap?: Recap[]; reveals?: number[] };

const DEFAULT_RECAP: Recap[] = [
  { icon: "spreadsheet", label: "Sheet cleaned" },
  { icon: "invoice", label: "Invoice chased" },
  { icon: "clock", label: "Time back" },
];

export const RecapCta: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const title = data?.title ?? "Plug the boring leak";
  const brand = data?.brand ?? "The Automation Desk";
  const recap = data?.recap ?? DEFAULT_RECAP;

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fStop = rv[0] ?? t(0.4); // stop chasing the printer
  const fTitle = Math.max(rv[1] ?? t(2.2), fStop + 14); // plug the boring leak + recap
  const fBrand = Math.max(rv[2] ?? t(4.6), fTitle + 16); // brand + subscribe

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;
  const RED = "#FF5C5C";

  const stop = fadeUp(frame, fps, Math.max(fStop, 0), 14);
  const titleIn = progress(frame, fps, fTitle, 18);
  const brandIn = progress(frame, fps, fBrand, 16);
  // gentle subscribe pulse (frame-pure) once it's in
  const pulse = frame >= fBrand + 16 ? 1 + 0.035 * Math.sin((frame - fBrand) / fps * Math.PI * 2 * 0.9) : 1;

  return (
    <AbsoluteFill style={{ padding: "0 8%", justifyContent: "center", alignItems: "center" }}>
      {/* stop chasing the money printer */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36, opacity: stop.opacity, transform: `translateY(${stop.y}px)` }}>
        <div style={{ position: "relative" }}>
          <Icon name="factory" size={56} color={RED} accent={RED} />
          <div style={{ position: "absolute", inset: -4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.heading, fontWeight: 900, fontSize: 64, color: RED }}>✕</div>
        </div>
        <div style={{ position: "relative", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 38, color: theme.color.textSecondary }}>
          stop chasing the money printer
        </div>
      </div>

      {/* the boring-leak title */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 84, color: theme.color.textPrimary, textAlign: "center", lineHeight: 1.04, opacity: titleIn, transform: `scale(${interpolate(titleIn, [0, 1], [0.92, 1])})`, marginBottom: 40 }}>
        Plug the <span style={{ color: gold }}>boring leak</span>
      </div>

      {/* recap checks */}
      <div style={{ display: "flex", gap: 18, marginBottom: 48 }}>
        {recap.map((r, i) => {
          const inP = progress(frame, fps, fTitle + 8 + i * 6, 14);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 22px", borderRadius: 16, background: theme.color.surface, border: `2px solid ${mint}`, opacity: inP, transform: `translateY(${interpolate(inP, [0, 1], [22, 0])}px)`, minWidth: 180 }}>
              <Icon name={r.icon} size={52} color={mint} accent={mint} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="check" size={26} color={mint} accent={mint} />
                <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 28, color: theme.color.textPrimary }}>{r.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* brand + subscribe */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: brandIn, transform: `translateY(${interpolate(brandIn, [0, 1], [24, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 44, background: gold, borderRadius: 3 }} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 52, color: theme.color.textPrimary }}>{brand}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 40px", borderRadius: 999, background: blue, transform: `scale(${pulse * pop(frame, fBrand + 16, 0.1)})`, boxShadow: `0 8px 30px ${blue}55` }}>
          <Icon name="bell" size={34} color="#0B0F14" accent="#0B0F14" />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 38, color: "#0B0F14" }}>Subscribe</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
