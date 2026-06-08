// YouTube OAuth bootstrap (P4). One-time interactive consent mints token.json (outside the
// repo); after that uploads are automatic with silent refresh. Pure helpers are testable;
// googleapis is lazy-imported so unrelated tests don't need it.
import fs from "node:fs";
import path from "node:path";

export const YT_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
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
