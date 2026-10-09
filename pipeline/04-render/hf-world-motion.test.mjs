// The MOTION BUDGET in templates/hyperframes/_lib/hf-world.js (024 Short, 2026-10-09). The owner's ask
// was numeric — "decrease motion 10% and settle on the important takes" — so the knob has to do exactly
// that, and NOTHING when it is not passed: the long 024 cut's nine scenes call HW.shots(list, D) with no
// budget and must render byte-identically. hf-world is a browser classic script; it only needs HF3's
// pure helpers for these functions, so it runs here in a VM sandbox with a fake `window`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "hyperframes", "_lib");

function loadHW() {
  const sandbox = { Math, Float64Array, isFinite, Number };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["hf-three.js", "hf-world.js"]) vm.runInContext(fs.readFileSync(path.join(LIB, f), "utf8"), sandbox, { filename: f });
  return sandbox.HW;
}
const HW = loadHW();
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

/** a dolly along z, 20 → 10 over [0, 10], look fixed — the simplest shot with measurable velocity */
const dolly = [{ t: 0, cam: (p) => ({ pos: [0, 2, 20 - 10 * p], look: [0, 2, 0], fov: 40 }) }];

test("motion(): no spec / scale 1 with no focus is the IDENTITY budget", () => {
  for (const spec of [undefined, null, {}, { scale: 1 }, { scale: 1, focus: [] }]) {
    const M = HW.motion(spec, 10);
    assert.equal(M.identity, true);
    assert.equal(M.amb(3.7), 3.7);
    assert.equal(M.slow(3.7), 3.7);
    assert.equal(M.focus(3.7), 0);
  }
});

test("shots() without a budget returns the plain camera — the long cut's scenes are untouched", () => {
  const plain = HW.shots(dolly, 10);
  const viaIdentity = HW.shots(dolly, 10, { motion: HW.motion(null, 10) });
  for (const t of [0, 2.5, 7.1, 10]) {
    assert.deepEqual(viaIdentity(t), plain(t));
    assert.equal(plain(t).pos[2], 20 - 10 * Math.min(t / 10, 1));
  }
});

test("scale 0.9: the camera covers 90% of its path (velocity × 0.9) and still LANDS on the composed end pose", () => {
  const cam = HW.shots(dolly, 10, { motion: HW.motion({ scale: 0.9 }, 10) });
  assert.ok(near(cam(10).pos[2], 10), "the end framing is untouched");
  assert.ok(near(cam(0).pos[2], 19), "it starts 10% of the way closer: 10 + 0.9 × 10");
  const v = (cam(6) .pos[2] - cam(5).pos[2]) / 1;
  assert.ok(near(v, -0.9 * 1, 1e-9), `velocity scaled by 0.9 (got ${v})`);
});

test("scale 0.9 keeps a CONTINUOUS move continuous across a shot boundary (no jump inside a run)", () => {
  const two = [
    { t: 0, cam: (p) => ({ pos: [0, 2, 20 - 5 * p], look: [0, 2, 0], fov: 40 }) },
    { t: 5, cam: (p) => ({ pos: [0, 2, 15 - 5 * p], look: [0, 2, 0], fov: 40 }) },
  ];
  const cam = HW.shots(two, 10, { motion: HW.motion({ scale: 0.9 }, 10) });
  assert.ok(near(cam(5 - 1e-6).pos[2], cam(5).pos[2], 1e-4), "same pose either side of the boundary");
  assert.ok(near(cam(10).pos[2], 10), "anchored on the RUN's end, not each shot's");
});

test("a hard cut starts a new run: each run lands on its own end pose", () => {
  const cut = [
    { t: 0, cam: (p) => ({ pos: [0, 2, 20 - 4 * p], look: [0, 2, 0], fov: 40 }) },
    { t: 5, cam: (p) => ({ pos: [9, 6, 30 - 6 * p], look: [1, 3, 0], fov: 36 }) },
  ];
  const cam = HW.shots(cut, 10, { motion: HW.motion({ scale: 0.9 }, 10) });
  assert.ok(near(cam(5 - 1e-9).pos[2], 16, 1e-6), "run 1 lands where shot 1 was composed to end");
  assert.ok(near(cam(10).pos[2], 24), "run 2 lands on its own end pose");
  assert.ok(near(cam(5).pos[2], 24 + 0.9 * 6), "run 2 starts 10% of its travel closer to that end");
});

test("a focus window slows the camera to focusScale, and the lag it builds resets at the next cut", () => {
  const M = HW.motion({ scale: 1.0001, focus: [[2, 4]], focusScale: 0.25, ease: 0 }, 10);
  assert.equal(M.focus(3), 1);
  assert.equal(M.focus(1.9), 0);
  const cut = [
    { t: 0, cam: (p) => ({ pos: [0, 2, 20 - 6 * p], look: [0, 2, 0], fov: 40 }) },   // 1 unit/s
    { t: 6, cam: (p) => ({ pos: [5, 2, 30 - 4 * p], look: [0, 2, 0], fov: 40 }) },
  ];
  const cam = HW.shots(cut, 10, { motion: M });
  const v = cam(3.5).pos[2] - cam(3).pos[2];
  assert.ok(near(v, -0.5 * 0.25, 1e-3), `inside the window the camera runs at a quarter speed (got ${v})`);
  const plain = HW.shots(cut, 10);
  assert.ok(near(cam(7).pos[2], 26 + 1.0001 * (plain(7).pos[2] - 26), 1e-6), "after the cut there is no lag left");
});

test("the ambient clock runs at scale × focusScale inside a window and is continuous and monotonic", () => {
  const M = HW.motion({ scale: 0.9, focus: [[4, 6]], focusScale: 0.35, ease: 0.4 }, 12);
  assert.ok(near(M.amb(2) - M.amb(1), 0.9, 1e-6), "outside: 0.9 s of drift per second");
  assert.ok(near(M.amb(5.5) - M.amb(4.5), 0.9 * 0.35, 1e-6), "settled inside: 0.315 s per second");
  let prev = -1;
  for (let t = 0; t <= 12; t += 0.01) { const a = M.amb(t); assert.ok(a >= prev - 1e-12); prev = a; }
  assert.ok(near(M.amb(3.999), M.amb(4.001), 0.01), "no jump at the window edge");
});

// D-068 (owner, 2026-10-09, on the 024 Short): "no constant animation in the background through the
// whole video — only now and then, and 10% calmer". So the ambient clock gets its own scale and its
// own windows; outside a window the background holds still.
test("ambientScale: the background clock has its own scale, the camera keeps `scale`", () => {
  const M = HW.motion({ scale: 0.855, ambientScale: 0.81 }, 10);
  assert.equal(M.identity, false);
  assert.ok(near(M.amb(2) - M.amb(1), 0.81, 1e-6), "0.81 s of drift per second");
  assert.ok(near(M.speed(3), 0.855, 1e-9), "the camera runs at scale");
  assert.ok(near(HW.motion({ scale: 0.9 }, 10).amb(2) - HW.motion({ scale: 0.9 }, 10).amb(1), 0.9, 1e-6), "absent → ambientScale = scale (the 024 Short's scenes are unchanged)");
});

test("ambient: [] freezes the background for the whole scene — even at scale 1 it is not the identity", () => {
  const M = HW.motion({ ambient: [] }, 10);
  assert.equal(M.identity, false);
  for (const t of [0, 1, 4.2, 10]) assert.equal(M.amb(t), 0);
  assert.ok(near(M.slow(4.2), 4.2, 1e-9), "the camera is untouched");
});

test("ambient windows: the background drifts only inside them, eases in and out, never jumps or runs back", () => {
  const M = HW.motion({ ambientScale: 0.81, ambient: [[2, 4]], ease: 0.4 }, 10);
  assert.ok(near(M.amb(1.5), 0, 1e-9), "still before the window's soft edge");
  assert.ok(near(M.amb(3.5) - M.amb(2.5), 0.81, 1e-6), "settled inside: 0.81 s per second");
  const held = M.amb(4.5);
  assert.ok(near(M.amb(9), held, 1e-9), "after the window the background holds where it stopped");
  let prev = -1;
  for (let t = 0; t <= 10; t += 0.01) { const a = M.amb(t); assert.ok(a >= prev - 1e-12); prev = a; }
  assert.ok(near(M.amb(1.999), M.amb(2.001), 0.01) && near(M.amb(3.999), M.amb(4.001), 0.01), "no jump at the edges");
});

test("an ambient window inside a focus window runs at ambientScale × focusScale", () => {
  const M = HW.motion({ scale: 0.855, ambientScale: 0.81, ambient: [[0, 10]], focus: [[4, 6]], focusScale: 0.35, ease: 0.4 }, 12);
  assert.ok(near(M.amb(5.5) - M.amb(4.5), 0.81 * 0.35, 1e-6));
});

test("kicks are added at REAL time (× scale), so an impact stays on its word even inside a focus window", () => {
  const M = HW.motion({ scale: 0.9, focus: [[0, 10]], focusScale: 0.2, ease: 0 }, 10);
  const kick = (t) => (t >= 5 && t < 5.5 ? [1, 0, 0] : [0, 0, 0]);
  const cam = HW.shots(dolly, 10, { motion: M, kick });
  assert.ok(near(cam(5.2).pos[0], 0.9), "the kick fires at 5.0 real seconds, scaled by 0.9");
  assert.equal(cam(4.9).pos[0], 0);
});

test("a run with a `keep` shot is story motion: left exactly as authored under any budget", () => {
  const list = [
    { t: 0, keep: true, cam: (p) => ({ pos: [0, 2, 20 - 6 * p], look: [0, 2, 0], fov: 40 }) },
    { t: 5, cam: (p) => ({ pos: [9, 6, 30 - 6 * p], look: [1, 3, 0], fov: 36 }) },
  ];
  const plain = HW.shots(list, 10);
  const cam = HW.shots(list, 10, { motion: HW.motion({ scale: 0.9, focus: [[1, 3]] }, 10) });
  for (const t of [0, 1.5, 2.5, 4.9]) assert.deepEqual(cam(t).pos, plain(t).pos, `kept run untouched at ${t}`);
  assert.ok(near(cam(5).pos[2], 24 + 0.9 * 6), "the next (unkept) run is still budgeted");
});
