import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (011 S2 — THE FLIP, v2 after owner rejection). The angle surfaces here, visualized:
 * an "app builder" window (prompt "build me an app" + fake UI blocks) is struck "no app" and
 * FLIES OUT left while the inbox panel slides up into the vacated space — both ABSOLUTELY
 * positioned on a fixed stage, so the swap is a designed motion, never a layout reflow
 * (v1 collapsed the app's height, which read as the page "shifting" — owner rejected).
 *
 * Layout rule (owner, 2026-07-07): content fills the 5%→85% band (bottom 15% = captions);
 * big type, no small floating cluster. Portrait-first, frame-pure. Beats key off reveals:
 *   [1] "not build software — just read my inbox" → swap (app out, inbox up) ·
 *   [2] "no app" → strike stamp · [3] "I actually ran it" → ▶ Run pill. Final HOLDS.
 */
type Data = { kicker?: string; hype?: string; reality?: string; reveals?: number[] };

const INBOX: { from: string; sub: string; icon: IconName }[] = [
  { from: "Client — Following up…", sub: "on the quote from Tuesday", icon: "flag" },
  { from: "Weekly Digest", sub: "10 links you missed", icon: "note" },
  { from: "Store Receipts", sub: "Your order shipped", icon: "invoice" },
  { from: "Promo Mailer", sub: "48h flash sale — 30% off", icon: "note" },
  { from: "Bank Alerts", sub: "Payment of $128 cleared", icon: "invoice" },
];

export const AppToInboxFlip: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fFlip = rv[1] ?? t(2.4); // "just read my inbox" → the swap
  const fStrike = Math.min(rv[2] ?? t(4.4), fFlip + 4); // "no app" stamp (lands just before/at the swap)
  const fRun = rv[3] ?? t(5.6); // "I actually ran it"

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;
  const RED = "#FF5C5C";

  const head = fadeUp(frame, fps, 0, 16);
  const appIn = progress(frame, fps, (rv[0] ?? 0) + 4, 16);
  const strike = progress(frame, fps, fStrike, 12);
  // the swap: app flies OUT left (translate + tilt + fade), inbox slides UP into its place —
  // pure transforms on absolutely-positioned layers; nothing reflows.
  const swap = progress(frame, fps, fFlip + 6, 22);
  const run = progress(frame, fps, fRun, 12);

  const appX = interpolate(swap, [0, 1], [0, -1260]);
  const appRot = interpolate(swap, [0, 1], [0, -7]);
  const appOp = appIn * interpolate(swap, [0, 0.85], [1, 0], { extrapolateRight: "clamp" });
  // inbox: starts low + dim behind the app, rises to the top of the stage as the app leaves
  const inboxY = interpolate(swap, [0, 1], [560, 0]);
  const inboxOp = Math.max(progress(frame, fps, fFlip, 18) * 0.35, swap);

  return (
    <AbsoluteFill style={{ padding: "5% 6% 15%" }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* kicker — pinned top of the band */}
        <div style={{ position: "absolute", top: 0, width: "100%", textAlign: "center", fontFamily: theme.font.heading, fontWeight: 800, fontSize: 36, letterSpacing: 5, textTransform: "uppercase", color: gold, opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
          {data?.kicker ?? "So I asked mine to"}
        </div>

        {/* the app-builder window — absolute, centered in the band pre-swap; flies out left (no reflow) */}
        <div style={{ position: "absolute", top: 330, left: 0, right: 0, opacity: appOp, transform: `translateX(${appX}px) rotate(${appRot}deg)` }}>
          <div style={{ background: theme.color.surface, border: `3px solid ${blue}`, borderRadius: 22, overflow: "hidden", boxShadow: "0 16px 44px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 26px", background: "#0c1219", borderBottom: "1px solid #26303c" }}>
              {[RED, gold, mint].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />)}
              <div style={{ marginLeft: 12, fontFamily: theme.font.mono, fontWeight: 700, fontSize: 28, color: theme.color.textSecondary }}>app-builder · vibe.dev</div>
            </div>
            <div style={{ padding: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderRadius: 14, background: theme.color.bg, border: `2px solid ${blue}55`, marginBottom: 22 }}>
                <Icon name="ai" size={42} color={blue} accent={mint} />
                <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 44, color: theme.color.textPrimary }}>{data?.hype ?? "build me an app"}</div>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 2, height: 74, borderRadius: 12, background: `${blue}22`, border: `2px solid ${blue}55` }} />
                <div style={{ flex: 1, height: 74, borderRadius: 12, background: `${mint}22`, border: `2px solid ${mint}55` }} />
              </div>
              <div style={{ height: 74, borderRadius: 12, background: `${gold}18`, border: `2px solid ${gold}55` }} />
            </div>
          </div>
          {/* "no app" strike stamp */}
          {strike > 0 && (
            <>
              <div style={{ position: "absolute", top: "52%", left: 0, width: `${strike * 100}%`, height: 10, background: RED, transform: "rotate(-8deg)", borderRadius: 5 }} />
              <div style={{ position: "absolute", top: 24, right: 26, fontFamily: theme.font.heading, fontWeight: 900, fontSize: 52, color: RED, border: `4px solid ${RED}`, borderRadius: 12, padding: "6px 20px", transform: `rotate(8deg) scale(${0.8 + strike * 0.2})`, opacity: strike, background: "#0B0F14dd" }}>no app</div>
            </>
          )}
        </div>

        {/* the inbox — absolute; rises into the vacated space (transform only, no reflow);
            rows spread evenly across the full band height (fill-the-stage) */}
        <div style={{ position: "absolute", top: 130, bottom: 0, left: 0, right: 0, display: "flex", flexDirection: "column", opacity: inboxOp, transform: `translateY(${inboxY}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <Icon name="inbox" size={56} color={gold} accent={gold} />
            <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 64, color: theme.color.textPrimary, flex: 1 }}>{data?.reality ?? "read my inbox"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 26px", borderRadius: 999, border: `3px solid ${mint}`, color: mint, fontFamily: theme.font.heading, fontWeight: 800, fontSize: 34, opacity: run, transform: `scale(${0.9 + run * 0.1})` }}>▶ Run</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
            {INBOX.map((r, i) => {
              const accent = i === 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 24px", background: theme.color.surface, borderRadius: 14, borderLeft: `6px solid ${accent ? gold : "#26303c"}` }}>
                  <Icon name={r.icon} size={38} color={accent ? gold : theme.color.textSecondary} accent={accent ? gold : mint} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: theme.font.body, fontWeight: accent ? 800 : 700, fontSize: 35, color: accent ? theme.color.textPrimary : theme.color.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.from}</div>
                    <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 27, color: "#5b6b7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
