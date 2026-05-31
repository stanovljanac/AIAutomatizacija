/**
 * Brand tokens — defaults from style/VISUAL_IDENTITY.md §2/§3.
 * These are the Phase-1 starting values; Phase 3 locks them from the
 * reference screenshots. Keep this the single source of color/type truth
 * for the Remotion components so the look stays consistent.
 */
export const theme = {
  color: {
    bg: "#0B0F14", // base background (near-black)
    surface: "#151B23", // cards / panels
    textPrimary: "#F2F5F8",
    textSecondary: "#9AA7B2",
    accent: "#4F8CFF", // electric blue — the one primary accent
    accentSecondary: "#22D3A7", // mint — contrast moments only
    highlight: "#FFB020",
  },
  font: {
    // System stacks for Phase 1 (no web-font dependency / deterministic render).
    // Phase 3 swaps in Inter / Satoshi / JetBrains Mono from assets/fonts/.
    heading:
      '"Segoe UI", Inter, system-ui, -apple-system, Roboto, Arial, sans-serif',
    body: '"Segoe UI", Inter, system-ui, -apple-system, Roboto, Arial, sans-serif',
    mono: '"Cascadia Code", "JetBrains Mono", Consolas, monospace',
  },
} as const;
