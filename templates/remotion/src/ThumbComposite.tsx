import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/**
 * Thumbnail COMPOSITE (1280x720): an owner-generated AI image as the background +
 * the two tool logos overlaid. We do NOT auto-generate thumbnails anymore (owner rule
 * 2026-06-07: the code-drawn ones were poor) — the owner generates the image from the
 * 2 prompts in visual-prompts.json; this only composites logos (no title) on top.
 *   npx remotion still ThumbComposite out/thumb.png --props='{"bg":"thumb-bg.png",...}'
 */
export type ThumbCompositeProps = { bg: string; left?: string; right?: string; excel?: string };
export const thumbCompositeDefault: ThumbCompositeProps = {
  bg: "thumb-bg.png",
  left: "brand/chatgpt-icon.png",
  right: "brand/claude-ai-icon.png",
  excel: "brand/microsoft-excel-icon.png",
};

const Chip: React.FC<{ src: string; pos: React.CSSProperties; size?: number }> = ({ src, pos, size = 156 }) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.19),
      background: "rgba(11,15,20,0.55)",
      border: "2px solid rgba(255,255,255,0.20)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 10px 34px rgba(0,0,0,0.55)",
      ...pos,
    }}
  >
    <Img src={staticFile(src)} style={{ width: "78%", height: "78%", objectFit: "contain" }} />
  </div>
);

export const ThumbComposite: React.FC<ThumbCompositeProps> = ({ bg, left, right, excel }) => (
  <AbsoluteFill style={{ backgroundColor: "#0B0F14" }}>
    <Img src={staticFile(bg)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    {left && <Chip src={left} pos={{ top: 40, left: 48 }} />}
    {right && <Chip src={right} pos={{ top: 40, right: 48 }} />}
    {/* Excel logo bottom-right — covers the AI tool's watermark + signals the Excel context */}
    {excel && <Chip src={excel} pos={{ bottom: 30, right: 44 }} size={132} />}
  </AbsoluteFill>
);
