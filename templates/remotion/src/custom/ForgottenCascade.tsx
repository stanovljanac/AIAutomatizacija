import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { Icon, IconName } from "../icons/Icon";
import { fadeUp, progress } from "../lib/anim";

/**
 * Bespoke (011 S5 — why it matters). A CAUSAL cascade shown, not just said: the email that matters
 * → buried under everything → the email you forgot. Inbox-shaped (NOT a reskin of the money
 * error-cascade). Downward connectors draw between steps so causality reads visually. Non-dramatic,
 * per the KOS lesson (no-invented-anecdotes-in-scripts): a general truth, no fabricated outcome.
 *
 * Portrait-first, frame-pure. Steps reveal on narration reveals[0..2]; the last carries a "forgotten"
 * stamp. Final state HOLDS.
 */
type Step = { icon: IconName; label: string; detail: string; stamp?: boolean };
type Data = { steps?: Step[]; reveals?: number[] };

const DEFAULT_STEPS: Step[] = [
  { icon: "email", label: "The email that matters", detail: "a real reply, waiting" },
  { icon: "inbox", label: "Buried under everything", detail: "newsletters, receipts" },
  { icon: "clock", label: "The email you forgot", detail: "never answered", stamp: true },
];

export const ForgottenCascade: React.FC<{ data?: Data }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (s: number) => s * fps;
  const steps = data?.steps && data.steps.length ? data.steps : DEFAULT_STEPS;
  const rv: number[] = Array.isArray(data?.reveals) ? (data!.reveals as number[]) : [];
  const stepAt = (i: number) => rv[i] ?? t(1.0 + i * 1.8);

  const gold = theme.color.highlight;
  const RED = "#FF5C5C";
  const head = fadeUp(frame, fps, 0, 16);

  return (
    <AbsoluteFill style={{ padding: "5% 9% 15%", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 60, color: theme.color.textPrimary, marginBottom: 52, textAlign: "center", opacity: head.opacity, transform: `translateY(${head.y}px)` }}>
        It never wrote a line of code.
      </div>

      {steps.map((s, i) => {
        const inp = progress(frame, fps, stepAt(i), 16);
        const isLast = i === steps.length - 1;
        const edge = isLast ? RED : i === 1 ? "#26303c" : gold;
        // connector to the next step draws after this one lands
        const conn = i < steps.length - 1 ? progress(frame, fps, stepAt(i) + 10, 12) : 0;
        return (
          <React.Fragment key={i}>
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 26, padding: "30px 32px", borderRadius: 18, background: theme.color.surface, border: `3px solid ${edge}`, opacity: inp, transform: `translateY(${interpolate(inp, [0, 1], [26, 0])}px) scale(${interpolate(inp, [0, 1], [0.96, 1])})`, position: "relative" }}>
              <Icon name={s.icon} size={60} color={edge === "#26303c" ? theme.color.textSecondary : edge} accent={edge === "#26303c" ? gold : edge} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.font.heading, fontWeight: 800, fontSize: 46, color: theme.color.textPrimary }}>{s.label}</div>
                <div style={{ fontFamily: theme.font.body, fontWeight: 500, fontSize: 31, color: theme.color.textSecondary }}>{s.detail}</div>
              </div>
              {s.stamp && (
                <div style={{ fontFamily: theme.font.heading, fontWeight: 900, fontSize: 34, color: RED, border: `3px solid ${RED}`, borderRadius: 10, padding: "6px 16px", transform: "rotate(-6deg)", opacity: interpolate(inp, [0.4, 1], [0, 1], { extrapolateLeft: "clamp" }) }}>
                  forgotten
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: conn }}>
                <div style={{ width: 4, height: 30, background: theme.color.textSecondary }} />
                <div style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: `13px solid ${theme.color.textSecondary}` }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
