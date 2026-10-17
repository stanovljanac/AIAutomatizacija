/**
 * encode.mjs — the ONE place the master video's encode quality is set.
 *
 * Owner rule (2026-10-16): every video ships as ONE file, `video/final.mp4`, at the best quality the
 * pipeline can make. No share / phone / lighter copies, whatever the size. So every step that writes
 * pixels into the master encodes at MASTER_CRF:
 *   - Remotion's composite (templates/remotion/remotion.config.ts: PNG frames, setCrf(MASTER_CRF) —
 *     a TS config cannot import this file, so encode.test.mjs pins the literal to this constant);
 *   - compile-hyperframes' normalise pass over every HF clip (an intermediate the composite decodes);
 *   - repair-dropouts, which re-encodes the master when it fixes a dropped frame.
 * Lower CRF = higher quality (x264: 0 lossless … 18 "visually lossless" … 51). 12 keeps gradients,
 * grain and motion blur intact through YouTube's own re-encode.
 *
 * x264 writes its option string into the stream ("… crf=12.0 …"). patch-scenes reads it back so a
 * re-rendered segment is encoded at the same quality as the base it is spliced into.
 */
import { closeSync, openSync, readSync, statSync } from "node:fs";

export const MASTER_CRF = 12;
export const MASTER_PRESET = "medium";

/**
 * PURE: the CRF from an x264 SEI option string ("x264 - core 164 … crf=16.0 …"), or null when the
 * text carries none (not x264, or a non-CRF rate control).
 * @param {string} text
 * @returns {number|null}
 */
export function parseX264Crf(text) {
  const s = String(text ?? "");
  const at = s.indexOf("x264 - core");
  if (at < 0) return null;
  const m = /\bcrf=(\d+(?:\.\d+)?)/.exec(s.slice(at, at + 4096));
  return m ? Number(m[1]) : null;
}

/**
 * The CRF an mp4 was encoded at, read from the x264 SEI in its first video sample. With +faststart the
 * moov comes first, so the SEI sits a few hundred KB in; `bytes` bounds the read.
 * @param {string} file
 * @param {number} [bytes]
 * @returns {number|null}
 */
export function readX264Crf(file, bytes = 32 * 1024 * 1024) {
  const fd = openSync(file, "r");
  try {
    const n = Math.min(statSync(file).size, bytes);
    const buf = Buffer.alloc(n);
    readSync(fd, buf, 0, n, 0);
    return parseX264Crf(buf.toString("latin1"));
  } finally {
    closeSync(fd);
  }
}
