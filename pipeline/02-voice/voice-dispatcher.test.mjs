// T4.2 — the TtsProvider seam. Pure provider-selection + an injectable synth (no child process).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectVoiceProvider,
  selectVoiceBackend,
  voiceArgs,
  synthesizeVoice,
  VOICE_SCRIPTS,
  DRAFT_DEFAULT,
  FINAL_DEFAULT,
} from "./voice-dispatcher.mjs";

const edgeCfg = { voice: { provider: "edge-tts", final_provider: "azure" } };

test("selectVoiceProvider: draft = config.voice.provider, final = config.voice.final_provider", () => {
  assert.equal(selectVoiceProvider(edgeCfg), "edge-tts");
  assert.equal(selectVoiceProvider(edgeCfg, { final: false }), "edge-tts");
  assert.equal(selectVoiceProvider(edgeCfg, { final: true }), "azure");
});

test("selectVoiceProvider: defaults to edge-tts(draft)/azure(final) when config.voice is absent", () => {
  assert.equal(selectVoiceProvider({}), DRAFT_DEFAULT);
  assert.equal(selectVoiceProvider({}, { final: true }), FINAL_DEFAULT);
  assert.equal(selectVoiceProvider(undefined), "edge-tts"); // no config at all
});

test("selectVoiceBackend maps edge-tts → make_voice.py and azure → make_voice_azure.py", () => {
  assert.deepEqual(selectVoiceBackend(edgeCfg), { provider: "edge-tts", script: "scripts/make_voice.py" });
  assert.deepEqual(selectVoiceBackend(edgeCfg, { final: true }), {
    provider: "azure",
    script: "scripts/make_voice_azure.py",
  });
});

test("selectVoiceBackend throws on an unregistered provider (lists the known ones)", () => {
  assert.throws(
    () => selectVoiceBackend({ voice: { provider: "elevenlabs" } }),
    /unknown TTS provider "elevenlabs".*edge-tts, azure/s
  );
});

test("voiceArgs returns [script, id] and passes the id through verbatim (incl. id/short)", () => {
  assert.deepEqual(voiceArgs(edgeCfg, "005-foo"), ["scripts/make_voice.py", "005-foo"]);
  assert.deepEqual(voiceArgs(edgeCfg, "005-foo/short"), ["scripts/make_voice.py", "005-foo/short"]);
  assert.deepEqual(voiceArgs(edgeCfg, "005-foo", { final: true }), ["scripts/make_voice_azure.py", "005-foo"]);
});

test("voiceArgs defaults (empty config) match the legacy hardcoded edge-tts call", () => {
  // This is the invariant that keeps the orchestrator's existing voice_long/voice_short green.
  assert.deepEqual(voiceArgs({}, "005-x"), ["scripts/make_voice.py", "005-x"]);
  assert.deepEqual(voiceArgs({}, "005-x/short"), ["scripts/make_voice.py", "005-x/short"]);
});

test("synthesizeVoice spawns the selected script via the injected run() with the right cmd/args/cwd", async () => {
  const seen = [];
  const run = async (spec) => {
    seen.push(spec);
    return { code: 0, stdout: "OK narration\n", stderr: "" };
  };
  const draft = await synthesizeVoice({ id: "005-x", root: "/repo", config: edgeCfg, python: "/repo/.venv/py", run });
  assert.equal(draft.provider, "edge-tts");
  assert.equal(draft.code, 0);
  assert.deepEqual(seen[0], { cmd: "/repo/.venv/py", args: ["scripts/make_voice.py", "005-x"], cwd: "/repo" });

  const final = await synthesizeVoice({ id: "005-x", root: "/repo", config: edgeCfg, python: "py", final: true, run });
  assert.equal(final.provider, "azure");
  assert.deepEqual(seen[1].args, ["scripts/make_voice_azure.py", "005-x"]);
});

test("synthesizeVoice surfaces a non-zero exit (code + stderr) without throwing", async () => {
  const run = async () => ({ code: 1, stdout: "", stderr: "boom" });
  const r = await synthesizeVoice({ id: "x", config: edgeCfg, python: "py", run });
  assert.equal(r.code, 1);
  assert.equal(r.stderr, "boom");
});

test("synthesizeVoice requires an id", async () => {
  await assert.rejects(() => synthesizeVoice({ config: edgeCfg, run: async () => ({ code: 0 }) }), /id is required/);
});

// --- guards on the registry itself ---
test("VOICE_SCRIPTS holds exactly the two D-024 backends", () => {
  assert.deepEqual(Object.keys(VOICE_SCRIPTS).sort(), ["azure", "edge-tts"]);
});

// --- [verifier] regression: default-invariant with every empty/partial config shape ---
test("[verifier] voiceArgs({voice:{}}, id) — partial config with empty voice section — defaults to edge-tts", () => {
  // Orchestrator calls voiceArgs(ctx.config, ...) where ctx.config may be partially constructed.
  // voice section present but provider missing must NOT throw and must return the legacy script.
  assert.deepEqual(voiceArgs({ voice: {} }, "005-x"), ["scripts/make_voice.py", "005-x"]);
  assert.deepEqual(voiceArgs({ voice: {} }, "005-x/short"), ["scripts/make_voice.py", "005-x/short"]);
});

test("[verifier] selectVoiceProvider(null) — null config — defaults to edge-tts/azure gracefully", () => {
  // null is a valid JS value that can slip through when config is loaded and the file is missing keys.
  assert.equal(selectVoiceProvider(null), DRAFT_DEFAULT);
  assert.equal(selectVoiceProvider(null, { final: true }), FINAL_DEFAULT);
});

test("[verifier] voiceArgs(null, id) and voiceArgs(undefined, id) — null/undefined config — match legacy path", () => {
  // Ensures the orchestrator does not crash if config is null (e.g. a test that forgets to pass it).
  assert.deepEqual(voiceArgs(null, "005-z"), ["scripts/make_voice.py", "005-z"]);
  assert.deepEqual(voiceArgs(undefined, "005-z"), ["scripts/make_voice.py", "005-z"]);
});

test("[verifier] selectVoiceProvider: voice.provider present but final_provider absent — final falls back to azure default", () => {
  // Common real-world config where only draft provider is set.
  const cfg = { voice: { provider: "edge-tts" } };
  assert.equal(selectVoiceProvider(cfg, { final: false }), "edge-tts");
  assert.equal(selectVoiceProvider(cfg, { final: true }), FINAL_DEFAULT);
});

test("[verifier] selectVoiceProvider: voice.final_provider present but provider absent — draft falls back to edge-tts default", () => {
  const cfg = { voice: { final_provider: "azure" } };
  assert.equal(selectVoiceProvider(cfg), DRAFT_DEFAULT);
  assert.equal(selectVoiceProvider(cfg, { final: true }), "azure");
});
