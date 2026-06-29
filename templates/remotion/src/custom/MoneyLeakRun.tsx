import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon } from "../icons/Icon";
import { fadeUp, progress, ramp, countUp, pop } from "../lib/anim";

/**
 * Bespoke (009 S4 — owner-insisted VISIBLE proof): the viewer must SEE the boring loop run,
 * not just hear the result. A messy spreadsheet appears, the user "presses go", a progress bar
 * sweeps while a live counter ticks the rows processed, sample rows flip from broken → clean,
 * then it resolves to a big "39 ✔ clean / 1 ⚠ Review" and an overdue invoice flips to "Chased".
 *
 * Portrait-first (1080×1920). Frame-pure + seek-accurate (anim helpers only — no Date/random),
 * so it renders deterministically and the run animation aligns to the scene window. All beats key
 * off scene-local seconds and the final state HOLDS, so it's robust to any scene duration >= ~9s.
 */
type Invoice = { label?: string; before?: string; after?: string };
type Data = {
  title?: string;
  rows?: number;
  clean?: number;
  flagged?: number;
  invoice?: Invoice;
  /** Scene-local frames of each narration sentence start (from revealOn:"sentences"). The beats
   *  sync to these so "watch it run", "39 clean / 1 flagged" and "already chased" land on cue. */
  reveals?: number[];
};

// Six representative rows; the last is the one the model flags for review.
const SAMPLE = [
  { cells: ["Brightleaf Co", "2026-05-02", "$1,240.00"] },
  { cells: ["Marlow Market", "2026-05-04", "$86.50"] },
  { cells: ["Granby Coffee", "2026-05-07", "$54.20"] },
  { cells: ["CityPark Garage", "2026-05-09", "$18.00"] },
  { cells: ["Nimbus Cloud", "2026-05-11", "$240.00"] },
  { cells: ["Ridgeline ?????", "2026-05-1?", "$??.??"] }, // the messy / flagged row
];

export const MoneyLeakRun: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;

  const total = data?.rows ?? 40;
  const flaggedCount = data?.flagged ?? 1;
  const cleanCount = data?.clean ?? total - flaggedCount;
  const inv = data?.invoice ?? { label: "Invoice #1042", before: "3 weeks overdue", after: "Chased" };

  // ── timeline — beats SYNC to the narration sentence starts (scene-local frames in data.reveals):
  //   reveals[1] "watch it run" → run begins · reveals[2] "39 clean / 1 flagged" → resolve ·
  //   reveals[3] "already chased" → invoice flips. Falls back to fixed seconds when reveals are
  //   absent (standalone preview), clamped so a tight window still animates. ─────────────────────
  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const fStart = rv[1] ?? t(1.6); // run begins ("press go")
  const fResolve = Math.max(rv[2] ?? t(5.2), fStart + 16); // resolve (>= ~0.5s after the run starts)
  const fInvoice = Math.max(rv[3] ?? t(6.7), fResolve + 8); // invoice flip
  const runDur = fResolve - fStart;

  const head = fadeUp(frame, fps, 0, 16);
  const panelIn = progress(frame, fps, (rv[0] ?? 0) + 6, 18);
  const runProg = ramp(frame, fStart, runDur); // 0→1 progress fill across the run window
  const running = frame >= fStart && frame < fResolve;
  const processed = Math.round(countUp(frame, total, { from: 0, delay: fStart, dur: runDur }));
  const resolved = frame >= fResolve;
  const badgePop = pop(frame, fResolve, 0.16);
  const cleanBadge = progress(frame, fps, fResolve, 16);
  const flagBadge = progress(frame, fps, fResolve + 12, 16);
  const invIn = progress(frame, fps, fInvoice, 18);
  const invFlip = ramp(frame, fInvoice + 8, 16); // 0=overdue, 1=chased

  const gold = theme.color.highlight;
  const mint = theme.color.accentSecondary;
  const blue = theme.color.accent;
  const RED = "#FF5C5C";

  // Per-row flip time spread across the run window (last row ends flagged, not cleaned).
  const rowCleanAt = (i: number) => fStart + ((i + 1) / SAMPLE.length) * runDur * 0.92;

  return (
    <AbsoluteFill style={{ padding: "0 7%", justifyContent: "center", alignItems: "center" }}>
      {/* title */}
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 64, color: theme.color.textPrimary, marginBottom: 36, opacity: head.opacity, transform: `translateY(${head.y}px)`, textAlign: "center" }}>
        {data?.title ?? "watch it run"}
      </div>

      {/* spreadsheet panel */}
      <div style={{ width: "100%", background: theme.color.surface, border: "1px solid #26303c", borderRadius: 22, padding: 28, opacity: panelIn, transform: `scale(${interpolate(panelIn, [0, 1], [0.94, 1])})`, boxShadow: "0 18px 50px rgba(0,0,0,0.45)" }}>
        {/* header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Icon name="spreadsheet" size={40} color={theme.color.textSecondary} accent={blue} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 700, fontSize: 32, color: theme.color.textSecondary, flex: 1 }}>expenses.xlsx</div>
          {/* RUN button / Running… pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 999, fontFamily: theme.font.heading, fontWeight: 800, fontSize: 28, background: running ? `${gold}22` : resolved ? `${mint}22` : `${blue}22`, color: running ? gold : resolved ? mint : blue, border: `2px solid ${running ? gold : resolved ? mint : blue}` }}>
            {running ? "Running…" : resolved ? "Done" : "▶ Run"}
          </div>
        </div>

        {/* rows */}
        {SAMPLE.map((row, i) => {
          const isFlaggedRow = i === SAMPLE.length - 1;
          const cleaned = frame >= rowCleanAt(i);
          const cellsClean = isFlaggedRow
            ? ["Ridgeline Hardware", "2026-05-12", "$??.??"] // name+date recovered, total still unreadable
            : row.cells;
          const showState = !cleaned ? "messy" : isFlaggedRow ? "flag" : "clean";
          const edge = showState === "clean" ? mint : showState === "flag" ? gold : RED;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", marginTop: i ? 10 : 0, background: theme.color.bg, borderRadius: 12, borderLeft: `5px solid ${edge}` }}>
              <div style={{ width: 34, display: "flex", justifyContent: "center" }}>
                {showState === "clean" && <Icon name="check" size={30} color={mint} accent={mint} />}
                {showState === "flag" && <Icon name="flag" size={30} color={gold} accent={gold} />}
                {showState === "messy" && <div style={{ width: 18, height: 18, borderRadius: 9, border: `3px solid ${RED}` }} />}
              </div>
              {(cleaned ? cellsClean : row.cells).map((c, j) => (
                <div key={j} style={{ flex: j === 0 ? 2 : 1, fontFamily: j === 2 ? theme.font.mono : theme.font.body, fontWeight: 600, fontSize: 28, color: showState === "messy" ? RED : theme.color.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c}
                </div>
              ))}
            </div>
          );
        })}

        {/* progress bar */}
        <div style={{ marginTop: 22, height: 18, borderRadius: 999, background: "#0c1116", overflow: "hidden", border: "1px solid #26303c" }}>
          <div style={{ height: "100%", width: `${runProg * 100}%`, background: `linear-gradient(90deg, ${blue}, ${mint})` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: theme.font.mono, fontWeight: 700, fontSize: 30, color: theme.color.textSecondary }}>
          <span>{running ? "reading · filling · flagging" : resolved ? "complete" : "ready"}</span>
          <span style={{ color: theme.color.textPrimary }}>{processed} / {total} rows</span>
        </div>
      </div>

      {/* resolve badges */}
      <div style={{ display: "flex", gap: 26, marginTop: 34, opacity: resolved ? 1 : 0, transform: `scale(${resolved ? badgePop : 0.8})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 30px", borderRadius: 18, background: `${mint}1c`, border: `3px solid ${mint}`, opacity: cleanBadge }}>
          <Icon name="check" size={48} color={mint} accent={mint} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary }}>{cleanCount} <span style={{ fontSize: 34, color: mint }}>clean</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 30px", borderRadius: 18, background: `${gold}1c`, border: `3px solid ${gold}`, opacity: flagBadge }}>
          <Icon name="flag" size={48} color={gold} accent={gold} />
          <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 50, color: theme.color.textPrimary }}>{flaggedCount} <span style={{ fontSize: 34, color: gold }}>Review</span></div>
        </div>
      </div>

      {/* invoice flip: overdue → chased */}
      <div style={{ width: "100%", marginTop: 30, display: "flex", alignItems: "center", gap: 18, padding: "22px 28px", borderRadius: 18, background: theme.color.surface, border: `3px solid ${invFlip > 0.5 ? mint : RED}`, opacity: invIn, transform: `translateY(${interpolate(invIn, [0, 1], [24, 0])}px)` }}>
        <Icon name="invoice" size={46} color={invFlip > 0.5 ? mint : RED} accent={invFlip > 0.5 ? mint : RED} />
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 38, color: theme.color.textPrimary, flex: 1 }}>{inv.label}</div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 36, color: invFlip > 0.5 ? mint : RED }}>
          {invFlip > 0.5 ? `✓ ${inv.after}` : inv.before}
        </div>
      </div>
    </AbsoluteFill>
  );
};
