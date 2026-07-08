import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress, ramp, countUp, pop } from "../lib/anim";

/**
 * Bespoke (011 S4 — owner-insisted VISIBLE proof, sibling of MoneyLeakRun): the viewer must SEE
 * the inbox triage RUN, not just hear the result. A noisy inbox appears, the user "presses go", a
 * sweep runs while a live counter ticks the mail processed, rows get tagged into labels
 * (Newsletters · Receipts · Needs you today), it resolves to three label chips with counts, then
 * the AHA beat: the camera zooms the ONE buried "Client — Following up…" row, holds, and pulls it
 * to the top of a "Needs you" shortlist. Nothing is ever deleted (the reliability guard, shown).
 *
 * Portrait-first (1080×1920). Frame-pure + seek-accurate (anim helpers only — no Date/random), so
 * it renders deterministically and the run aligns to the scene window. Beats key off the narration
 * sentence starts (data.reveals) with a fixed-second fallback; the final state HOLDS.
 */
type Buried = { label?: string; from?: string };
type Data = {
  unread?: number;
  flagged?: number;
  buried?: Buried;
  /** Scene-local frames of each narration sentence start (revealOn:"sentences").
   *  reveals[1] "watch it sort" → run begins · reveals[2] "…six flagged" → labels resolve ·
   *  reveals[3] "pulled to the top" → the aha zoom + pull-up. */
  reveals?: number[];
};

type Kind = "news" | "receipt" | "needs";
type Row = { from: string; subject: string; kind: Kind; icon: IconName };

// Representative inbox rows; row index 4 is the buried client reply that gets surfaced.
const SAMPLE: Row[] = [
  { from: "Weekly Digest", subject: "10 links you missed", kind: "news", icon: "note" },
  { from: "Store Receipts", subject: "Your order shipped", kind: "receipt", icon: "invoice" },
  { from: "Promo Mailer", subject: "48h flash sale — 30% off", kind: "news", icon: "note" },
  { from: "Bank Alerts", subject: "Payment of $128 cleared", kind: "receipt", icon: "invoice" },
  { from: "Client — Marlow", subject: "Following up on the quote…", kind: "needs", icon: "flag" }, // the buried one
  { from: "Newsletter", subject: "This week in AI", kind: "news", icon: "note" },
];
const BURIED_IDX = 4;

const LABELS: Record<Kind, { title: string; icon: IconName }> = {
  news: { title: "Newsletters", icon: "note" },
  receipt: { title: "Receipts", icon: "invoice" },
  needs: { title: "Needs you today", icon: "flag" },
};

export const InboxSortRun: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const total = data?.unread ?? 214;
  const flaggedCount = data?.flagged ?? 6;
  const buriedLabel = data?.buried?.label ?? "Client — Following up…";
  const buriedFrom = data?.buried?.from ?? "page 4";
  const newsCount = Math.max(0, total - flaggedCount - 40);
  const receiptCount = total - flaggedCount - newsCount;

  // ── timeline — beats SYNC to narration sentence starts (scene-local frames in data.reveals) ──
  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fStart = rv[1] ?? t(2.0); // "press go, and watch it sort"
  const fResolve = Math.max(rv[2] ?? t(5.0), fStart + 16); // labels resolve
  const fAha = Math.max(rv[3] ?? t(8.0), fResolve + 10); // zoom + pull-up
  const runDur = fResolve - fStart;

  const head = fadeUp(frame, fps, 0, 16);
  const panelIn = progress(frame, fps, (rv[0] ?? 0) + 6, 18);
  const runProg = ramp(frame, fStart, runDur);
  const running = frame >= fStart && frame < fResolve;
  const processed = Math.round(countUp(frame, total, { from: 0, delay: fStart, dur: runDur }));
  const remaining = total - processed;
  const resolved = frame >= fResolve;

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;

  // Per-row tag time spread across the run; each row is "sorted" (tagged) sequentially.
  const rowTagAt = (i: number) => fStart + ((i + 1) / SAMPLE.length) * runDur * 0.9;

  // AHA: focal zoom on the buried client row, then pull it up. 0→1 across the aha window.
  const aha = ramp(frame, fAha, 20);
  const pulled = frame >= fAha + 22; // after the hold, it sits at the top of the shortlist

  // label chip counts resolve with a pop
  const chipPop = pop(frame, fResolve, 0.16);
  const chipIn = progress(frame, fps, fResolve, 16);

  const kindColor = (k: Kind) => (k === "needs" ? gold : theme.color.textSecondary);

  return (
    <AbsoluteFill style={{ padding: "0 6%", justifyContent: "center", alignItems: "center" }}>
      {/* title */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 64, color: theme.color.textPrimary, marginBottom: 30, opacity: head.opacity, transform: `translateY(${head.y}px)`, textAlign: "center" }}>
        watch it sort
      </div>

      {/* inbox panel */}
      <div style={{ width: "100%", background: theme.color.surface, border: "1px solid #26303c", borderRadius: 22, padding: 26, opacity: panelIn, transform: `scale(${interpolate(panelIn, [0, 1], [0.94, 1])})`, boxShadow: "0 18px 50px rgba(0,0,0,0.45)" }}>
        {/* header: inbox + unread counter + Run/Sorting…/Done pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Icon name="inbox" size={40} color={theme.color.textSecondary} accent={blue} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 32, color: theme.color.textSecondary, flex: 1 }}>
            Inbox · <span style={{ color: theme.color.textPrimary }}>{resolved ? 0 : remaining}</span> unread
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 999, fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, background: running ? `${gold}22` : resolved ? `${mint}22` : `${blue}22`, color: running ? gold : resolved ? mint : blue, border: `2px solid ${running ? gold : resolved ? mint : blue}` }}>
            {running ? "Sorting…" : resolved ? "Done" : "▶ Run"}
          </div>
        </div>

        {/* rows — each gets tagged into a label as the sweep passes; the buried client row zooms at the aha */}
        {SAMPLE.map((row, i) => {
          const tagged = frame >= rowTagAt(i);
          const isBuried = i === BURIED_IDX;
          // buried row: zoom + glow at aha, then fade out of the list (it "moves" to the shortlist)
          const focus = isBuried ? aha : 0;
          const dim = isBuried ? 1 : interpolate(aha, [0, 1], [1, 0.28], { extrapolateRight: "clamp" });
          const rowGone = isBuried && pulled;
          const edge = tagged ? kindColor(row.kind) : "#26303c";
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", marginTop: i ? 10 : 0,
              background: theme.color.bg, borderRadius: 12, borderLeft: `5px solid ${edge}`,
              opacity: rowGone ? 0 : dim,
              transform: `scale(${1 + focus * 0.06})`,
              boxShadow: focus > 0.05 ? `0 0 ${focus * 34}px ${gold}88` : "none",
              zIndex: isBuried ? 5 : 1,
            }}>
              <Icon name={tagged ? row.icon : "email"} size={28} color={tagged ? kindColor(row.kind) : theme.color.textSecondary} accent={row.kind === "needs" ? gold : mint} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: theme.font.body, fontWeight: 700, fontSize: 27, color: theme.color.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.from}</div>
                <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 23, color: theme.color.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.subject}</div>
              </div>
              {/* the label tag it got sorted into */}
              {tagged && (
                <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 20, color: kindColor(row.kind), border: `2px solid ${kindColor(row.kind)}`, borderRadius: 999, padding: "4px 12px", opacity: 0.9 }}>
                  {LABELS[row.kind].title}
                </div>
              )}
            </div>
          );
        })}

        {/* progress bar + live counter */}
        <div style={{ marginTop: 22, height: 18, borderRadius: 999, background: "#0c1116", overflow: "hidden", border: "1px solid #26303c" }}>
          <div style={{ height: "100%", width: `${runProg * 100}%`, background: `linear-gradient(90deg, ${blue}, ${mint})` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: theme.font.mono, fontWeight: 700, fontSize: 28, color: theme.color.textSecondary }}>
          <span>{running ? "reading · labelling · never deleting" : resolved ? "complete · nothing deleted" : "ready"}</span>
          <span style={{ color: theme.color.textPrimary }}>{processed} / {total}</span>
        </div>
      </div>

      {/* three label chips with counts — resolve with a pop */}
      <div style={{ display: "flex", gap: 18, marginTop: 30, opacity: chipIn, transform: `scale(${resolved ? chipPop : 0.85})` }}>
        {([["news", newsCount], ["receipt", receiptCount], ["needs", flaggedCount]] as [Kind, number][]).map(([k, n]) => {
          const accent = k === "needs";
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 22px", borderRadius: 16, background: accent ? `${gold}1c` : theme.color.surface, border: `3px solid ${accent ? gold : "#26303c"}` }}>
              <Icon name={LABELS[k].icon} size={34} color={accent ? gold : theme.color.textSecondary} accent={accent ? gold : mint} />
              <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 40, color: accent ? gold : theme.color.textPrimary }}>{n}</div>
              <div style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 20, color: theme.color.textSecondary }}>{LABELS[k].title}</div>
            </div>
          );
        })}
      </div>

      {/* "Needs you" shortlist — the buried client reply pulled to the top at the aha beat */}
      <div style={{ width: "100%", marginTop: 26, opacity: aha, transform: `translateY(${interpolate(aha, [0, 1], [24, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Icon name="flag" size={30} color={gold} accent={gold} />
          <span style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, color: gold }}>Needs you today</span>
          <span style={{ fontFamily: theme.font.body, fontWeight: 600, fontSize: 24, color: theme.color.textSecondary }}>· pulled from {buriedFrom}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderRadius: 14, background: `${gold}14`, border: `3px solid ${gold}`, transform: `scale(${interpolate(pulled ? 1 : aha, [0, 1], [0.96, 1])})`, boxShadow: `0 0 ${aha * 26}px ${gold}55` }}>
          <Icon name="flag" size={34} color={gold} accent={gold} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 30, color: theme.color.textPrimary, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{buriedLabel}</div>
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 26, color: gold }}>↑ top</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
