// P3 — loudnorm arg-builder hits the -16 LUFS target; runner is invoked with ffmpeg + args.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLoudnormArgs, normalizeLoudness } from "./normalize-loudness.mjs";

test("buildLoudnormArgs targets I=-16 and wires input/output", () => {
  const args = buildLoudnormArgs("in.mp3", "out.mp3");
  assert.ok(args.includes("in.mp3"));
  assert.ok(args.includes("out.mp3"));
  const af = args[args.indexOf("-af") + 1];
  assert.match(af, /loudnorm=I=-16/);
  assert.ok(args.includes("-ar"));
});

test("buildLoudnormArgs honors a custom target", () => {
  const args = buildLoudnormArgs("a", "b", { I: -14 });
  const af = args[args.indexOf("-af") + 1];
  assert.match(af, /I=-14/);
});

test("normalizeLoudness calls the injected runner with ffmpeg + args", async () => {
  let seen = null;
  const run = (cmd, args) => { seen = { cmd, args }; return Promise.resolve({ code: 0 }); };
  const r = await normalizeLoudness("in.mp3", "out.mp3", {}, { run, ffmpeg: "ffmpeg" });
  assert.equal(seen.cmd, "ffmpeg");
  assert.ok(seen.args.includes("in.mp3") && seen.args.includes("out.mp3"));
  assert.equal(r.code, 0);
});
