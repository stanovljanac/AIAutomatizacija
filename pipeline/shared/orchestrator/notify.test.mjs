// P7 — digest formatting + transport dispatch (deferred default, file transport).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildDigest, notify, deferredTransport, fileTransport } from "./notify.mjs";
import { withTempDir } from "../testkit/index.mjs";

test("buildDigest includes event, band, scores and action", () => {
  const d = buildDigest({ event: "Final approval", videoId: "005", band: "auto", scores: [9.3, 9.4], action: "review the cut" });
  assert.match(d, /Final approval/);
  assert.match(d, /band=auto/);
  assert.match(d, /9\.3\/9\.4/);
  assert.match(d, /Action needed: review the cut/);
});

test("notify defaults to the deferred transport (top agent fires PushNotification)", async () => {
  const r = await notify({ event: "gate", videoId: "005" });
  assert.equal(r.deferred, true);
  assert.equal(r.payload.channel, "push");
});

test("notify passes channel + digest to an injected transport", async () => {
  let seen = null;
  const transport = { name: "mock", async send(p) { seen = p; return { ok: true }; } };
  await notify({ event: "gate", channel: "email", digest: "hi" }, { channel: "email", transport });
  assert.equal(seen.channel, "email");
  assert.equal(seen.digest, "hi");
});

test("fileTransport appends a JSON line", async () => {
  await withTempDir(async (dir) => {
    const f = path.join(dir, "notif.log");
    await notify({ event: "gate", videoId: "005" }, { transport: fileTransport(f) });
    const content = fs.readFileSync(f, "utf8").trim();
    assert.match(content, /"event":"gate"/);
  });
});

test("deferredTransport is the default export shape", () => {
  assert.equal(deferredTransport.name, "deferred");
});
