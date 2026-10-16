// The MECHANICAL kit (templates/hyperframes/_lib/hf-mech.js, built for 025). Its pure helpers are what
// every mechanical scene's timing and motion stands on, so they are pinned here:
//   · mesh()      two gears that are supposed to mesh actually do, at every angle (teeth never collide)
//   · integral()  a rate read back as a position never jumps when the rate changes mid-scene
//   · Part.place  assemble and explode are the same function run in opposite directions
//   · clock()     word marks and the dev-range shortcut do not change what a scene sees
// hf-mech is a browser classic script; these functions only need HF3 + HW's pure helpers, so the three
// files run in a VM sandbox with a fake `window` (same idiom as hf-world-motion.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "hyperframes", "_lib");

function load() {
  const sandbox = { Math, Float64Array, Float32Array, isFinite, Number };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["hf-three.js", "hf-world.js", "hf-mech.js"]) vm.runInContext(fs.readFileSync(path.join(LIB, f), "utf8"), sandbox, { filename: f });
  return sandbox;
}
const { HM } = load();
const TAU = Math.PI * 2;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
/** distance from angle a to the nearest multiple of `period` */
const off = (a, period) => { const r = ((a % period) + period) % period; return Math.min(r, period - r); };

test("mesh(): when gear A has a tooth on the line of centres, gear B has a gap there", () => {
  for (const [NA, NB, phi] of [[40, 16, 0], [16, 30, -0.349], [30, 12, 0.611], [12, 24, -0.262], [24, 14, 0.698]]) {
    const pA = TAU / NA, pB = TAU / NB;
    for (let k = 0; k < 7; k++) {
      const thA = phi + k * pA;                 // a tooth of A (tooth 0 is centred on local angle 0) points at B
      const thB = HM.mesh(thA, NA, NB, phi);
      // B sees the contact at local angle (phi + PI - thB): a GAP centre is half a pitch off a tooth centre
      assert.ok(near(off(phi + Math.PI - thB - pB / 2, pB), 0, 1e-9), `NA ${NA} NB ${NB} k ${k}`);
    }
  }
});

test("mesh(): B turns the other way at the tooth ratio, so the pitch circles roll without slipping", () => {
  const NA = 40, NB = 16, phi = 0.3;
  const d = 0.01;
  const dB = HM.mesh(1 + d, NA, NB, phi) - HM.mesh(1, NA, NB, phi);
  assert.ok(near(dB, -(NA / NB) * d, 1e-12));
});

test("integral(): a constant rate reads back as rate × time, and 0 before the clock starts", () => {
  const f = HM.integral(() => 0.7, 20);
  assert.equal(f(-1), 0);
  assert.equal(f(0), 0);
  for (const t of [0.5, 3.21, 12, 19.99]) assert.ok(near(f(t), 0.7 * t, 1e-9), `t ${t}`);
});

test("integral(): a rate that stops mid-scene leaves the position exactly where it was (no jump, no drift)", () => {
  const stopAt = 6;
  const f = HM.integral((t) => (t < stopAt ? 2 : 0), 12);
  assert.ok(near(f(stopAt), 2 * stopAt, 2 / 240 + 1e-9));
  assert.equal(f(8), f(11.5));
  let prev = -1;
  for (let t = 0; t <= 12; t += 0.05) { const v = f(t); assert.ok(v >= prev - 1e-12, "monotonic"); prev = v; }
});

test("Part.place(): k = 1 is exactly home, k = 0 is exactly the away pose, and the path bows by `lift`", () => {
  const obj = { position: { set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, rotation: { set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, scale: { setScalar(s) { this.s = s; } }, visible: true };
  const p = new HM.Part(null, obj, { p: [1, 2, 0.5], r: [0, 0, 0.3] });
  p.setAway("exploded", { p: [5, -4, 6], r: [0.2, -0.1, 1.3], lift: 2, turn: Math.PI });
  const at = (want) => [obj.position.x, obj.position.y, obj.position.z].every((v, i) => near(v, want[i], 1e-9));
  p.place(1, "exploded");
  assert.ok(at([1, 2, 0.5]), "home");          // to 1e-9: the lift term is sin(PI) × lift, not a literal 0
  assert.ok(near(obj.rotation.z, 0.3));
  p.place(0, "exploded");
  assert.ok(at([5, -4, 6]), "away");
  assert.ok(near(obj.rotation.z, 1.3 + Math.PI));
  p.place(0.5, "exploded");
  assert.ok(near(obj.position.z, (0.5 + 6) / 2 + 2), "mid-flight the part is lifted toward the lens");
  assert.equal(obj.visible, true);
});

test("Part.place(): an away pose with scale 0 hides the part (a module that is not installed)", () => {
  const obj = { position: { set() {} }, rotation: { set() {} }, scale: { setScalar(s) { this.s = s; } }, visible: true };
  const p = new HM.Part(null, obj, { p: [0, 0, 0] });
  p.setAway("off", { p: [9, 9, 9], s: 0 });
  p.place(0, "off");
  assert.equal(obj.visible, false);
  p.place(1, "off");
  assert.equal(obj.visible, true);
  assert.equal(obj.scale.s, 1);
});

test("clock(): beats and word marks come from the pipeline, with typed fallbacks when none were passed", () => {
  const S = { D: 12, beats: [0, 3.1, 7.4], props: { marks: { send: 5.25 } } };
  const K = HM.clock(S);
  assert.equal(K.D, 12);
  assert.equal(K.b(1, 0.5), 3.1);
  assert.equal(K.b(5, 0.5), 6);            // no beat 5 → the fraction of D
  assert.equal(K.m("send", 99), 5.25);
  assert.equal(K.m("missing", 4.2), 4.2);
  assert.equal(K.t(3), 3);
});

test("clock(): a dev range shifts the clock but the scene still sees its full length and its real beats", () => {
  const S = { D: 4, beats: [0, 9.5, 14], props: { devClock: { offset: 8, full: 20 } } };
  const K = HM.clock(S);
  assert.equal(K.D, 20);
  assert.equal(K.t(0), 8);
  assert.equal(K.t(4), 12);
  assert.equal(K.b(2, 0.5), 14);           // not clamped to the 4 s the dev clip lasts
});
