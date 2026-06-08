// P4 — token persistence + OAuth URL (real googleapis client, no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { YT_SCOPES, saveToken, loadToken, makeOAuthClient, authUrl } from "./auth.mjs";
import { withTempDir } from "../shared/testkit/index.mjs";

test("YT_SCOPES grants upload", () => {
  assert.ok(YT_SCOPES.some((s) => s.includes("youtube.upload")));
});

test("saveToken/loadToken round-trip; missing token loads as null", async () => {
  await withTempDir(async (dir) => {
    const tp = path.join(dir, "nested", "token.json");
    assert.equal(loadToken(tp), null);
    saveToken(tp, { access_token: "a", refresh_token: "r" });
    assert.equal(loadToken(tp).refresh_token, "r");
  });
});

test("makeOAuthClient builds a client and authUrl requests offline + the upload scope", async () => {
  await withTempDir(async (dir) => {
    const cs = path.join(dir, "client_secret.json");
    fs.writeFileSync(
      cs,
      JSON.stringify({ installed: { client_id: "cid", client_secret: "sec", redirect_uris: ["http://localhost"] } })
    );
    const client = await makeOAuthClient(cs);
    const url = authUrl(client);
    assert.match(url, /access_type=offline/);
    assert.match(url, /youtube\.upload/);
  });
});

test("makeOAuthClient rejects a malformed client_secret.json", async () => {
  await withTempDir(async (dir) => {
    const cs = path.join(dir, "bad.json");
    fs.writeFileSync(cs, JSON.stringify({ nope: true }));
    await assert.rejects(() => makeOAuthClient(cs), /installed.*web|web.*installed/);
  });
});

// --- VERIFIER TESTS (Wave 1 Batch 1B auth gap coverage) ---

// getAuthorizedClient: missing client_secret file throws (not a graceful authorized:false).
// This is a DESIGN NOTE — the function is documented as "requires a valid secret to proceed";
// missing-file is a misconfiguration, so a throw is acceptable, but callers must be aware.
test("[verifier] getAuthorizedClient throws when client_secret file is missing — not authorized:false", async () => {
  const { getAuthorizedClient } = await import("./auth.mjs");
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => getAuthorizedClient({ clientSecretPath: path.join(dir, "nonexistent.json"), tokenPath: null }),
      /ENOENT|no such file/i,
      "Missing client_secret must throw, not silently return authorized:false — callers must guard this"
    );
  });
});

// getAuthorizedClient: returns authorized:false (not a crash) when secret exists but token is absent.
test("[verifier] getAuthorizedClient returns authorized:false when no token file exists", async () => {
  const { getAuthorizedClient } = await import("./auth.mjs");
  await withTempDir(async (dir) => {
    const cs = path.join(dir, "client_secret.json");
    fs.writeFileSync(
      cs,
      JSON.stringify({ installed: { client_id: "cid", client_secret: "sec", redirect_uris: ["http://localhost"] } })
    );
    const result = await getAuthorizedClient({ clientSecretPath: cs, tokenPath: path.join(dir, "no-token.json") });
    assert.equal(result.authorized, false);
    assert.ok(result.client, "client object must still be returned so caller can run consent flow");
  });
});

// loadToken: null tokenPath returns null (no crash).
test("[verifier] loadToken returns null when tokenPath is null", () => {
  assert.equal(loadToken(null), null);
});

// loadToken: undefined tokenPath returns null (no crash).
test("[verifier] loadToken returns null when tokenPath is undefined", () => {
  assert.equal(loadToken(undefined), null);
});

// YT_SCOPES: must include the broad youtube scope (needed for thumbnail + metadata edits).
test("[verifier] YT_SCOPES includes the broad youtube scope (needed for thumbnails/metadata)", () => {
  assert.ok(YT_SCOPES.some((s) => s.endsWith("/youtube") || s.includes("youtube.force-ssl")),
    "YT_SCOPES must include a scope beyond youtube.upload to allow thumbnail + metadata API calls");
});
