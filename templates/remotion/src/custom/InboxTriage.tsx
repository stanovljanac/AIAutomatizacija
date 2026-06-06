import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (D-022) — s08. A noisy inbox is read and sorted into three labelled lanes:
 * "Needs you" (accent, rises to the top), "FYI / receipts", and "Later". Synthetic
 * subjects only. Window-aware: lanes + cards reveal across the scene so motion lasts.
 */
type Lane = { title: string; icon: IconName; accent?: boolean; cards: string[] };
const LANES: Lane[] = [
  { title: "Needs you", icon: "flag", accent: true, cards: ["Refund request", "Contract question", "Reply by 5pm"] },
  { title: "FYI / receipts", icon: "check", cards: ["Payment received", "Order shipped", "Calendar invite"] },
  { title: "Later", icon: "clock", cards: ["Newsletter", "Promo: 20% off", "Webinar invite", "Survey"] },
];
const TOTAL_CARDS = LANES.reduce((n, l) => n + l.cards.length, 0);

export const InboxTriage: React.FC<{ data?: { title?: string } }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const W = durationInFrames / fps;
  const t = (s: number) => s * fps;
  const lin = (a: number, b: number) => interpolate(frame, [t(a), t(b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const head = fadeUp(frame, fps, 0, 16);
  const inbox = lin(0.4, 1.0);
  const sweep = lin(W * 0.18, W * 0.34);
  // cards reveal sequentially from ~25% to ~88% of the window
  const cardStart = W * 0.25, cardEnd = W * 0.88;
  let cardIdx = 0;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "150px 6% 210px" }}>
      {data?.title && (
        <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 56, color: theme.color.textPrimary, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
          {data.title}
        </div>
      )}

      {/* incoming count fades as the sweep sorts */}
      <div style={{ position: "absolute", top: 168, display: "flex", alignItems: "center", gap: 14, opacity: interpolate(sweep, [0, 0.6], [inbox, 0], { extrapolateRight: "clamp" }) }}>
        <Icon name="inbox" size={40} color={theme.color.textSecondary} />
        <span style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 34, color: theme.color.textSecondary }}>40 new emails</span>
      </div>

      {/* three lanes */}
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", marginTop: 0 }}>
        {LANES.map((lane, li) => {
          const laneIn = lin(W * 0.2 + li * 0.06 * W, W * 0.2 + li * 0.06 * W + 0.6);
          const rise = lane.accent ? interpolate(lin(W * 0.55, W * 0.7), [0, 1], [0, -28]) : 0;
          return (
            <div key={li} style={{ width: 420, opacity: laneIn, transform: `translateY(${interpolate(laneIn, [0, 1], [26, 0]) + rise}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <Icon name={lane.icon} size={34} color={lane.accent ? theme.color.accent : theme.color.textSecondary} accent={theme.color.accentSecondary} />
                <span style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, color: lane.accent ? theme.color.accent : theme.color.textSecondary }}>{lane.title}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {lane.cards.map((c, ci) => {
                  const f0 = cardStart + (cardEnd - cardStart) * (cardIdx / TOTAL_CARDS);
                  cardIdx++;
                  const cardIn = lin(f0, f0 + 0.5);
                  return (
                    <div key={ci} style={{
                      background: theme.color.surface,
                      border: `2px solid ${lane.accent ? theme.color.accent : "#1d2630"}`,
                      borderRadius: 12, padding: "16px 20px",
                      fontFamily: theme.font.body, fontWeight: 600, fontSize: 30,
                      color: lane.accent ? theme.color.textPrimary : theme.color.textSecondary,
                      opacity: cardIn, transform: `translateX(${interpolate(cardIn, [0, 1], [-24, 0])}px)`,
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <Icon name="email" size={26} color={lane.accent ? theme.color.accent : theme.color.textSecondary} />
                      {c}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
