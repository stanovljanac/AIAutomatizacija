import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress, countUp } from "../lib/anim";

/**
 * Bespoke (011 S3 — "the pile"). EXPERIENCE-FIRST, per the KOS lesson
 * (dont-break-momentum-with-a-spoken-stat): show the mess, don't recite a number. An unread counter
 * climbs 0→214 while noise rows (newsletters / receipts / payment alerts) pile in and BURY one
 * starred "Client — Following up…" row; the beat ends pointing at that buried row (→ sets up the S4
 * sort). The email-time stat lives ONLY as a small corner source chip (never spoken).
 *
 * Portrait-first, frame-pure + seek-accurate. Beats key off narration reveals:
 *   [0] "look at the pile" · [1] "214 unread" · [2] "newsletters, receipts, payment alerts" ·
 *   [3] "the one client I actually needed" → gold ring + arrow on the buried row. Final HOLDS.
 */
type Data = { unread?: number; buriedLabel?: string; source?: string; reveals?: number[] };

type Noise = { from: string; subject: string; icon: IconName };
const NOISE: Noise[] = [
  { from: "Weekly Digest", subject: "10 links you missed", icon: "note" },
  { from: "Store Receipts", subject: "Your order shipped", icon: "invoice" },
  { from: "Promo Mailer", subject: "48h flash sale — 30% off", icon: "note" },
  { from: "Bank Alerts", subject: "Payment of $128 cleared", icon: "invoice" },
  { from: "Newsletter", subject: "This week in AI", icon: "note" },
  { from: "Calendar", subject: "Reminder: nothing urgent", icon: "calendar" },
];

export const InboxPile: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const total = data?.unread ?? 214;
  const buriedLabel = data?.buriedLabel ?? "Client — Following up…";
  const source = data?.source ?? "~11.7 hrs/week on email · surveys 2025";

  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fCount = rv[1] ?? t(1.4); // "214 unread" → counter climbs
  const fPile = rv[2] ?? t(3.0); // noise piles in
  const fPoint = rv[3] ?? t(6.0); // point at the buried client row

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;

  const head = fadeUp(frame, fps, 0, 16);
  const count = Math.round(countUp(frame, total, { from: 0, delay: fCount, dur: t(2.2) }));
  const pileDur = Math.max(t(2.6), fPoint - fPile);

  // the buried client row gets dimmed + overlapped as noise arrives; ring pulses at fPoint
  const buriedDim = interpolate(frame, [fPile, fPile + pileDur * 0.8], [1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ring = frame >= fPoint ? interpolate(frame, [fPoint, fPoint + 10], [0, 1], { extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ padding: "5% 7% 15%", justifyContent: "center", alignItems: "center" }}>
      {/* header: inbox + climbing unread counter */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
        <Icon name="inbox" size={64} color={theme.color.textSecondary} accent={blue} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 108, color: theme.color.textPrimary }}>{count}</div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 46, color: theme.color.textSecondary }}>unread</div>
      </div>

      {/* the pile — noise rows cascade in over time */}
      <div style={{ width: "100%", position: "relative" }}>
        {NOISE.map((n, i) => {
          const f0 = fPile + (i / NOISE.length) * pileDur;
          const inp = progress(frame, fps, f0, 12);
          // unrevealed rows COLLAPSE (height 0) so the pile visibly GROWS and pushes the buried
          // client row down — reads as burial (perceptual QA 011: invisible rows held space and
          // left a hole between the pile and the buried row).
          const rowH = interpolate(inp, [0, 1], [0, 112], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ height: rowH, overflow: "hidden", marginTop: inp > 0.01 && i ? 12 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", background: theme.color.surface, borderRadius: 14, borderLeft: "5px solid #26303c", opacity: inp * 0.92, transform: `translateX(${interpolate(inp, [0, 1], [-30, 0])}px)` }}>
                <Icon name={n.icon} size={34} color={theme.color.textSecondary} accent={mint} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 31, color: theme.color.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.from}</div>
                  <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 26, color: "#5b6b7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.subject}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* the buried client row — present early, dimmed by the pile, then ringed at the end */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", marginTop: 14, background: theme.color.surface, borderRadius: 14, borderLeft: `6px solid ${gold}`, opacity: Math.max(buriedDim, ring), boxShadow: ring ? `0 0 ${ring * 30}px ${gold}88` : "none", border: ring ? `2px solid ${gold}` : "2px solid transparent", position: "relative" }}>
          <Icon name="flag" size={34} color={gold} accent={gold} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: theme.font.body, fontWeight: 800, fontSize: 31, color: theme.color.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{buriedLabel}</div>
            <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 26, color: gold }}>the one you actually needed</div>
          </div>
          {ring > 0 && (
            <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, color: gold, opacity: ring }}>← somewhere in here</div>
          )}
        </div>
      </div>

      {/* source chip (D-026) — never spoken */}
      <div style={{ marginTop: 34, fontFamily: theme.font.body, fontWeight: 600, fontSize: 26, color: theme.color.textSecondary, opacity: 0.8 }}>
        source: {source}
      </div>
    </AbsoluteFill>
  );
};
