import React from "react";
import { theme } from "../theme";

/**
 * Flat, on-brand inline-SVG icon set (D-022). One registry, themed via `color`
 * (stroke) + `accent` (highlights). Used by flow / icon-list templates and the
 * bespoke illustration scenes. Add new icons here; keep them simple line + accent.
 */
export type IconName =
  | "spreadsheet" | "email" | "calendar" | "invoice" | "document" | "clock"
  | "ai" | "person" | "desk" | "factory" | "database" | "gear" | "chart"
  | "money" | "arrow" | "check" | "flag" | "note" | "inbox" | "magnifier" | "coffee" | "bell";

const P: Record<IconName, (a: string) => React.ReactNode> = {
  spreadsheet: (a) => (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16M15 4v16" /></>),
  email: () => (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  calendar: (a) => (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /><rect x="7" y="12" width="3" height="3" fill={a} stroke="none" /></>),
  invoice: (a) => (<><path d="M6 3h9l3 3v15H6z" /><path d="M9 8h6M9 12h6" /><path d="M9 16h3" stroke={a} /></>),
  document: () => (<><path d="M7 3h7l4 4v14H7z" /><path d="M9 9h6M9 13h6M9 17h4" /></>),
  clock: (a) => (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" stroke={a} /></>),
  ai: (a) => (<><rect x="5" y="5" width="14" height="14" rx="3" fill={a} fillOpacity={0.12} /><path d="M9 16l2-7 2 7M9.6 13.5h2.8M16 9v7" stroke={a} /></>),
  person: () => (<><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /></>),
  desk: (a) => (<><path d="M3 8h18M5 8v11M19 8v11M3 19h18" /><rect x="8" y="11" width="8" height="4" fill={a} fillOpacity={0.18} stroke={a} /></>),
  factory: () => (<><path d="M3 21V10l5 3V10l5 3V8l5 3v10z" /><path d="M7 17h2M12 17h2M17 17h1" /></>),
  database: () => (<><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>),
  gear: (a) => (<><circle cx="12" cy="12" r="3.2" stroke={a} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
  chart: (a) => (<><path d="M4 20V4M4 20h16" /><rect x="7" y="12" width="3" height="5" fill={a} stroke="none" /><rect x="12" y="8" width="3" height="9" fill={a} stroke="none" /><rect x="17" y="5" width="3" height="12" fill={a} fillOpacity={0.5} stroke="none" /></>),
  money: (a) => (<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M14.5 9.2c-.6-.8-3.5-1.2-4.2.3-.6 1.4 1.2 1.8 2.4 2.1 1.3.3 3 .8 2.4 2.3-.7 1.5-3.6 1.1-4.2.3" stroke={a} /></>),
  arrow: () => (<><path d="M4 12h14M13 6l6 6-6 6" /></>),
  check: (a) => (<><path d="M4 12l5 5L20 6" stroke={a} /></>),
  flag: (a) => (<><path d="M6 21V4M6 4h11l-2 3 2 3H6" stroke={a} /></>),
  note: () => (<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>),
  inbox: (a) => (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 14h5l2 3h4l2-3h5" stroke={a} /></>),
  magnifier: () => (<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>),
  coffee: (a) => (<><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 9h2.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3c-.6 1 .6 1.6 0 2.6M12 3c-.6 1 .6 1.6 0 2.6" stroke={a} /></>),
  bell: (a) => (<><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 21h4" stroke={a} /></>),
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; accent?: string; style?: React.CSSProperties }> = ({
  name, size = 48, color = theme.color.textPrimary, accent = theme.color.accent, style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {P[name](accent)}
  </svg>
);
