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
type Strike = { icon: IconName; label: string };
type Data = { title?: string; brand?: string; recap?: Recap[]; strike?: Strike; reveals?: number[] };

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
  const strike = data?.strike ?? { icon: "factory" as IconName, label: "stop chasing the money printer" };
  // render the title with its last word accented (generic version of the old hardcoded
  // "Plug the <gold>boring leak</gold>" — title was declared but ignored before; 009 masked it
  // because its title matched the hardcode)
  const tWords = title.split(" ");
  const tHead = tWords.slice(0, -1).join(" ");
  const tLast = tWords[tWords.length - 1];

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
    // fill the 5%→85% band (owner layout rule 2026-07-07): spread the beats across the stage
    // instead of a small centered cluster; bottom 15% stays free for captions.
    <AbsoluteFill style={{ padding: "7% 8% 15%", justifyContent: "space-evenly", alignItems: "center" }}>
      {/* strike line (the hyped ask, struck out) */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: stop.opacity, transform: `translateY(${stop.y}px)` }}>
        <div style={{ position: "relative" }}>
          <Icon name={strike.icon} size={68} color={RED} accent={RED} />
          <div style={{ position: "absolute", inset: -4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: theme.font.heading, fontWeight: 900, fontSize: 76, color: RED }}>✕</div>
        </div>
        <div style={{ position: "relative", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 46, color: theme.color.textSecondary }}>
          {strike.label}
        </div>
      </div>

      {/* the boring-leak title */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 96, color: theme.color.textPrimary, textAlign: "center", lineHeight: 1.04, opacity: titleIn, transform: `scale(${interpolate(titleIn, [0, 1], [0.92, 1])})` }}>
        {tHead ? `${tHead} ` : ""}<span style={{ color: gold }}>{tLast}</span>
      </div>

      {/* recap checks */}
      <div style={{ display: "flex", gap: 20 }}>
        {recap.map((r, i) => {
          const inP = progress(frame, fps, fTitle + 8 + i * 6, 14);
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "26px 24px", borderRadius: 18, background: theme.color.surface, border: `2px solid ${mint}`, opacity: inP, transform: `translateY(${interpolate(inP, [0, 1], [22, 0])}px)`, minWidth: 210, flex: 1 }}>
              <Icon name={r.icon} size={62} color={mint} accent={mint} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="check" size={30} color={mint} accent={mint} />
                <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 32, color: theme.color.textPrimary }}>{r.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* brand + subscribe */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: brandIn, transform: `translateY(${interpolate(brandIn, [0, 1], [24, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 16, height: 52, background: gold, borderRadius: 3 }} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 60, color: theme.color.textPrimary }}>{brand}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 48px", borderRadius: 999, background: blue, transform: `scale(${pulse * pop(frame, fBrand + 16, 0.1)})`, boxShadow: `0 8px 30px ${blue}55` }}>
          <Icon name="bell" size={40} color="#0B0F14" accent="#0B0F14" />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 44, color: "#0B0F14" }}>Subscribe</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
