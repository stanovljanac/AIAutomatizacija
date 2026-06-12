// Voice dispatcher — the TtsProvider seam (Wave 4 / T4.2). ONE entry selects the TTS backend
// from config.voice, so adding a provider (ElevenLabs, …) is one map entry + one synth script,
// never a pipeline rewrite. Two real adapters prove the seam today (D-024):
//   • draft  → config.voice.provider        (edge-tts: free, fast iteration, never published)
//   • final  → config.voice.final_provider  (Azure AI Speech: the licensed published voice)
//
// The orchestrator's voice nodes call voiceArgs() instead of hardcoding make_voice.py; the
// `--final` lock step (pre-publish) flips to the commercial provider. Alignment is unchanged
// and provider-agnostic — make_alignment.py (faster-whisper) runs on narration.mp3 regardless
// of which backend produced it (a separate DAG node), so a dispatched backend only synthesizes
// the audio.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "../shared/orchestrator/runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..", "..");

// provider name (config.voice.provider / final_provider) → its Python synth script (repo-relative).
// Add a provider here + its script; nothing else in the pipeline changes.
export const VOICE_SCRIPTS = {
  "edge-tts": "scripts/make_voice.py",
  azure: "scripts/make_voice_azure.py",
};

export const DRAFT_DEFAULT = "edge-tts";
export const FINAL_DEFAULT = "azure";

/**
 * Which provider to use. final=true → the licensed published voice (D-024).
 * Defaults keep the orchestrator's existing behavior when config.voice is absent (edge-tts draft).
 */
export function selectVoiceProvider(config = {}, { final = false } = {}) {
  const v = (config && config.voice) || {};
  return final ? v.final_provider || FINAL_DEFAULT : v.provider || DRAFT_DEFAULT;
}

/** Resolve { provider, script } for the chosen provider; throw on an unregistered provider. */
export function selectVoiceBackend(config = {}, opts = {}) {
  const provider = selectVoiceProvider(config, opts);
  const script = VOICE_SCRIPTS[provider];
  if (!script) {
    throw new Error(
      `unknown TTS provider "${provider}" — register it in VOICE_SCRIPTS (have: ${Object.keys(VOICE_SCRIPTS).join(", ")})`
    );
  }
  return { provider, script };
}

/** The Python args ([script, id]) for the chosen backend — what the orchestrator's runner spawns. */
export function voiceArgs(config, id, opts = {}) {
  const { script } = selectVoiceBackend(config, opts);
  return [script, id];
}

function pythonExe(root) {
  const win = process.platform === "win32";
  return path.join(root, win ? ".venv/Scripts/python.exe" : ".venv/bin/python");
}

function loadConfig(root) {
  const live = path.join(root, "pipeline/shared/config.json");
  const example = path.join(root, "pipeline/shared/config.example.json");
  return JSON.parse(fs.readFileSync(fs.existsSync(live) ? live : example, "utf8"));
}

/**
 * Synthesize narration.mp3 for <id> via the configured backend. Side-effecting (spawns Python);
 * `run` is injectable so tests need no child process. Returns { provider, script, code, stdout, stderr }.
 */
export async function synthesizeVoice({ id, root = REPO_ROOT, config, final = false, python, run = runCommand } = {}) {
  if (!id) throw new Error("synthesizeVoice: id is required");
  config = config || loadConfig(root);
  const { provider, script } = selectVoiceBackend(config, { final });
  const py = python || pythonExe(root);
  const r = await run({ cmd: py, args: [script, id], cwd: root });
  return { provider, script, code: r.code, stdout: r.stdout, stderr: r.stderr };
}

// CLI:  node pipeline/02-voice/voice-dispatcher.mjs <id> [--final]
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const final = args.includes("--final");
  const id = args.find((a) => !a.startsWith("--"));
  if (!id) {
    console.error("usage: node pipeline/02-voice/voice-dispatcher.mjs <id> [--final]");
    process.exit(2);
  }
  synthesizeVoice({ id, final })
    .then((r) => {
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.code !== 0) {
        console.error(r.stderr || `exit ${r.code}`);
        process.exit(r.code || 1);
      }
      console.log(`OK voice via ${r.provider} (${r.script})${final ? " [final]" : " [draft]"}`);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
