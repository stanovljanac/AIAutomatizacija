// Loudness normalize to the channel target (config.voice.loudness_lufs = -16; Phase B #5).
// Pure arg-builder (tested) + a thin ffmpeg runner (injectable).
import { runCommand } from "../shared/orchestrator/runner.mjs";

/** ffmpeg loudnorm args for a single-pass normalize to I LUFS, true-peak TP, range LRA. */
export function buildLoudnormArgs(input, output, { I = -16, TP = -1.5, LRA = 11, ar = 48000 } = {}) {
  return ["-y", "-i", input, "-af", `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`, "-ar", String(ar), output];
}

/** Normalize `input` → `output`. Returns the runner result; pass a fake `run` in tests. */
export async function normalizeLoudness(input, output, opts = {}, deps = {}) {
  const ffmpeg = deps.ffmpeg || "ffmpeg";
  const run = deps.run || ((cmd, args) => runCommand({ cmd, args }));
  const args = buildLoudnormArgs(input, output, opts);
  return run(ffmpeg, args);
}
