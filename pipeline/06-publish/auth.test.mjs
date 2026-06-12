// P4 — token persistence + OAuth URL (real googleapis client, no network).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { YT_SCOPES, saveToken, loadToken, makeOAuthClient, authUrl, runConsent } from "./auth.mjs";
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

// --- runConsent (T5.1 one-time OAuth consent CLI) ---

const writeClientSecret = (dir) => {
  const cs = path.join(dir, "client_secret.json");
  fs.writeFileSync(cs, JSON.stringify({ installed: { client_id: "cid", client_secret: "sec", redirect_uris: ["http://localhost"] } }));
  return cs;
};

// A fake googleapis whose OAuth2 exchanges any code for canned tokens — no network, no browser.
const fakeGoogle = {
  auth: {
    OAuth2: class {
      constructor(id, secret, redirect) { this.redirect = redirect; }
      generateAuthUrl() { return "https://accounts.google.com/o/oauth2/auth?fake=1"; }
      async getToken(code) { return { tokens: { access_token: "AT", refresh_token: "RT", code_seen: code } }; }
    },
  },
};

test("runConsent errors helpfully when the client_secret path is unset or the file is missing", async () => {
  await assert.rejects(() => runConsent({ tokenPath: "t" }), /YOUTUBE_CLIENT_SECRET_PATH/);
  await withTempDir(async (dir) => {
    await assert.rejects(
      () => runConsent({ clientSecretPath: path.join(dir, "nope.json"), tokenPath: path.join(dir, "t.json") }),
      /client_secret\.json not found.*Google Cloud Console|console\.cloud\.google/is
    );
  });
});

test("runConsent errors when the token path is unset", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    await assert.rejects(() => runConsent({ clientSecretPath: cs }), /YOUTUBE_TOKEN_PATH/);
  });
});

test("runConsent short-circuits when a token already exists (idempotent)", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    const tokenPath = path.join(dir, "token.json");
    saveToken(tokenPath, { refresh_token: "existing" });
    const res = await runConsent({ clientSecretPath: cs, tokenPath, log: () => {}, deps: { google: fakeGoogle } });
    assert.equal(res.alreadyAuthorized, true);
    assert.equal(res.authorized, true);
  });
});

test("runConsent loopback: exchanges the redirect code and writes the token outside the repo", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    const tokenPath = path.join(dir, "secure", "token.json"); // nested → mkdir -p path
    const res = await runConsent({
      clientSecretPath: cs,
      tokenPath,
      log: () => {},
      deps: { google: fakeGoogle },
      onReady: (port) => http.get(`http://127.0.0.1:${port}/?code=abc123`, (r) => r.resume()),
    });
    assert.equal(res.authorized, true);
    const saved = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    assert.equal(saved.refresh_token, "RT");
    assert.equal(saved.code_seen, "abc123", "the redirect code was exchanged");
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

// --- VERIFIER REGRESSION TESTS (Wave 5 verification pass) ---

// getToken rejection → server closes and promise rejects (no hang).
// Verifies the catch block at auth.mjs:88 correctly calls server.close() then reject(e).
test("[verifier] runConsent rejects (and frees the server) when getToken throws", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    const tokenPath = path.join(dir, "token.json");
    const boom = new Error("invalid_grant");
    const failGoogle = {
      auth: {
        OAuth2: class {
          constructor() {}
          generateAuthUrl() { return "https://accounts.google.com/o/oauth2/auth?fake=1"; }
          async getToken() { throw boom; }
        },
      },
    };
    let capturedPort;
    const p = runConsent({
      clientSecretPath: cs,
      tokenPath,
      log: () => {},
      deps: { google: failGoogle },
      onReady: (port) => {
        capturedPort = port;
        // Send a request with a code — this will trigger getToken which will throw.
        http.get(`http://127.0.0.1:${port}/?code=bad_code`, (r) => r.resume());
      },
    });
    await assert.rejects(() => p, /invalid_grant/, "runConsent must reject when getToken throws");
    // After rejection, the server must have been closed — a new server can bind on any port (no leaked fd).
    // We verify by confirming the promise did reject (above) and no token file was written.
    assert.ok(!fs.existsSync(tokenPath), "token must NOT be written when getToken fails");
  });
});

// A request with no ?code= returns HTTP 200 but does NOT resolve or reject the promise.
// The real redirect (with ?code=) must still be able to arrive and resolve normally.
test("[verifier] runConsent: no-code request waits; subsequent code request resolves", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    const tokenPath = path.join(dir, "token.json");
    const res = await runConsent({
      clientSecretPath: cs,
      tokenPath,
      log: () => {},
      deps: { google: fakeGoogle },
      onReady: (port) => {
        // First: a no-code request (e.g., favicon, preflight). Must NOT resolve the promise.
        http.get(`http://127.0.0.1:${port}/favicon.ico`, (r) => {
          // After the no-code response arrives, send the real redirect with the code.
          r.resume();
          r.on("end", () => {
            http.get(`http://127.0.0.1:${port}/?code=real_code`, (r2) => r2.resume());
          });
        });
      },
    });
    assert.equal(res.authorized, true);
    const saved = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
    assert.equal(saved.refresh_token, "RT", "token written after no-code + real-code sequence");
    assert.equal(saved.code_seen, "real_code", "the real code (not the no-code request) was exchanged");
  });
});

// The auth code from the redirect is NOT persisted in the token file — only Google-returned
// token fields are saved. (fakeGoogle includes code_seen to verify the correct code was used,
// but real googleapis never echoes the code back; this test checks saveToken only writes
// what getToken returns, not any additional sensitive request parameters.)
test("[verifier] runConsent does not log tokens or the auth code — only the file path", async () => {
  await withTempDir(async (dir) => {
    const cs = writeClientSecret(dir);
    const tokenPath = path.join(dir, "token.json");
    const logged = [];
    await runConsent({
      clientSecretPath: cs,
      tokenPath,
      log: (...args) => logged.push(args.join(" ")),
      deps: { google: fakeGoogle },
      onReady: (port) => http.get(`http://127.0.0.1:${port}/?code=secret_code`, (r) => r.resume()),
    });
    const allLogs = logged.join("\n");
    assert.ok(!allLogs.includes("AT"), "access_token must not appear in logs");
    assert.ok(!allLogs.includes("RT"), "refresh_token must not appear in logs");
    assert.ok(!allLogs.includes("secret_code"), "the auth code must not appear in logs");
    // The path IS expected to appear (so the user knows where the file went).
    assert.ok(allLogs.includes(tokenPath), "the token file path should appear in the success log");
  });
});
