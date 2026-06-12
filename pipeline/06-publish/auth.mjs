// YouTube OAuth bootstrap (P4). One-time interactive consent mints token.json (outside the
// repo); after that uploads are automatic with silent refresh. Pure helpers are testable;
// googleapis is lazy-imported so unrelated tests don't need it.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

export const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  // Read-only Analytics — so the SAME one-time consent also covers the T5.2 analytics loop.
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function saveToken(tokenPath, tokens) {
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
}

export function loadToken(tokenPath) {
  return tokenPath && fs.existsSync(tokenPath) ? loadJson(tokenPath) : null;
}

/** Build an OAuth2 client from a Google client_secret.json (Desktop app). */
export async function makeOAuthClient(clientSecretPath) {
  const { google } = await import("googleapis");
  const secret = loadJson(clientSecretPath);
  const cfg = secret.installed || secret.web;
  if (!cfg) throw new Error("client_secret.json missing an 'installed'/'web' block");
  const redirect = (cfg.redirect_uris && cfg.redirect_uris[0]) || "http://localhost";
  return new google.auth.OAuth2(cfg.client_id, cfg.client_secret, redirect);
}

export function authUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: YT_SCOPES });
}

/**
 * One-time interactive consent (T5.1 setup). Starts a throwaway loopback server, prints the Google
 * auth URL, captures the `?code=` redirect, exchanges it for tokens, and writes them to `tokenPath`
 * (OUTSIDE the repo). Idempotent: if a token already exists it short-circuits. `deps.google` is
 * injectable so the full loopback is testable without the real googleapis/browser; `onReady(port)`
 * lets a test drive the redirect.
 *
 * @returns Promise<{ authorized:true, tokenPath, alreadyAuthorized?:true }>
 */
export async function runConsent({ clientSecretPath, tokenPath, log = console.log, open, onReady, deps = {} } = {}) {
  if (!clientSecretPath) throw new Error("Set YOUTUBE_CLIENT_SECRET_PATH in .env to your client_secret.json path.");
  if (!fs.existsSync(clientSecretPath)) {
    throw new Error(
      `client_secret.json not found at ${clientSecretPath} — create an OAuth client (Desktop app) at ` +
        `https://console.cloud.google.com/ (enable YouTube Data API v3), download it, and point YOUTUBE_CLIENT_SECRET_PATH there.`
    );
  }
  if (!tokenPath) throw new Error("Set YOUTUBE_TOKEN_PATH in .env (a path OUTSIDE the repo, e.g. C:\\secure\\token.json).");
  if (loadToken(tokenPath)) {
    log(`Already authorized — token at ${tokenPath}. Delete it to re-consent.`);
    return { authorized: true, alreadyAuthorized: true, tokenPath };
  }

  const google = deps.google || (await import("googleapis")).google;
  const secret = loadJson(clientSecretPath);
  const cfg = secret.installed || secret.web;
  if (!cfg) throw new Error("client_secret.json missing an 'installed'/'web' block");

  return await new Promise((resolve, reject) => {
    let oauth = null;
    const server = http.createServer(async (req, res) => {
      const code = new URL(req.url, "http://localhost").searchParams.get("code");
      if (!code) {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("Waiting for Google authorization…");
        return;
      }
      try {
        const { tokens } = await oauth.getToken(code);
        saveToken(tokenPath, tokens);
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("✅ Authorized. Close this tab and return to the terminal.");
        server.close();
        log(`Saved token → ${tokenPath}. Uploads + analytics are now automatic.`);
        resolve({ authorized: true, tokenPath });
      } catch (e) {
        res.writeHead(500);
        res.end(`Error: ${e.message}`);
        server.close();
        reject(e);
      }
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      oauth = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, `http://localhost:${port}`);
      const url = oauth.generateAuthUrl({ access_type: "offline", prompt: "consent", scope: YT_SCOPES });
      log(`\n1) Open this URL in your browser and authorize:\n\n${url}\n\n2) The page redirects back here and saves your token automatically.\n`);
      if (open) open(url);
      if (onReady) onReady(port);
    });
  });
}

/**
 * Get an authorized OAuth2 client. Returns { client, authorized }. If a token exists it is
 * applied and refreshed tokens are persisted; otherwise authorized=false (run the consent CLI).
 */
export async function getAuthorizedClient({ clientSecretPath, tokenPath }) {
  const client = await makeOAuthClient(clientSecretPath);
  const token = loadToken(tokenPath);
  if (!token) return { client, authorized: false };
  client.setCredentials(token);
  client.on("tokens", (t) => saveToken(tokenPath, { ...token, ...t }));
  return { client, authorized: true };
}

// CLI: `node pipeline/06-publish/auth.mjs` — one-time browser consent → token.json.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  (await import("../shared/lib/load-env.mjs")).loadEnv();
  const clientSecretPath = process.env.YOUTUBE_CLIENT_SECRET_PATH;
  const tokenPath = process.env.YOUTUBE_TOKEN_PATH;
  // best-effort: open the URL in the default browser (Windows `start`, mac `open`, linux `xdg-open`).
  const open = (url) => {
    const cmd = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
    const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
    import("node:child_process").then(({ spawn }) => spawn(cmd, args, { detached: true, stdio: "ignore" }).unref()).catch(() => {});
  };
  runConsent({ clientSecretPath, tokenPath, open })
    .then((r) => {
      if (r.alreadyAuthorized) process.exit(0);
    })
    .catch((e) => {
      console.error(`\n${e.message}\n`);
      process.exit(1);
    });
}
