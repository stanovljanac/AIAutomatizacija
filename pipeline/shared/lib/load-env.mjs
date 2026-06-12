// load-env.mjs — make the repo-root .env actually take effect (free, zero-dependency).
//
// The code reads secrets from process.env (GEMINI_API_KEY, YOUTUBE_*, AZURE_*, …) but nothing
// loaded the .env file, so a key the owner put in .env never reached the process. This wires it
// with Node's BUILT-IN parser (process.loadEnvFile, Node ≥20.12) — no `dotenv` dependency.
//
// Real OS environment variables WIN over .env values (loadEnvFile does not override existing keys),
// so CI / production env vars are never clobbered. Safe to call from any entrypoint: it no-ops when
// .env is absent or the runtime lacks loadEnvFile, and never throws on a malformed file.
//
// Call loadEnv() at the TOP of a CLI entrypoint (not in importable library bodies) so unit tests
// stay hermetic — they import modules without pulling the owner's real secrets into the test process.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** Load `envPath` (default repo-root .env) into process.env. Returns { loaded, path? }. */
export function loadEnv(envPath = path.join(REPO_ROOT, ".env")) {
  try {
    if (typeof process.loadEnvFile === "function" && fs.existsSync(envPath)) {
      process.loadEnvFile(envPath);
      return { loaded: true, path: envPath };
    }
  } catch {
    // malformed .env or an unsupported runtime must never block the run — just skip it.
  }
  return { loaded: false };
}
