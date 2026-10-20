// The 026 objects (templates/hyperframes/_lib/hf-watch.js) and the scene files that stand on the kits.
//   · every kit file and every scene's own script PARSES — a scene that fails to parse still renders: a
//     blank canvas with exit 0 (026: a trailing comment swallowed half a line, every watcher scene went dark)
//   · the watcher's hammer, at the end of its strike, lands under the bell's rim (it used to stop short)
//   · the ledger's slipped belt hangs above the week pointer and the cells (layering law: nothing over them)
// hf-watch is a browser classic script; its layout constants only need HF3 + HW + HM, so the four files run
// in a VM sandbox with a fake `window` (same idiom as hf-mech.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HF = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "hyperframes");
const LIB = path.join(HF, "_lib");

function load() {
  const sandbox = { Math, Float64Array, Float32Array, isFinite, Number, Object, JSON };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ["hf-three.js", "hf-world.js", "hf-mech.js", "hf-watch.js"]) vm.runInContext(fs.readFileSync(path.join(LIB, f), "utf8"), sandbox, { filename: f });
  return sandbox;
}

test("every _lib kit file and every scene script parses", () => {
  const files = fs.readdirSync(LIB).filter((f) => f.endsWith(".js")).map((f) => path.join(LIB, f));
  for (const d of fs.readdirSync(path.join(HF, "scenes"))) {
    const f = path.join(HF, "scenes", d, d + ".js");
    if (fs.existsSync(f)) files.push(f);
  }
  assert.ok(files.length > 20, "found the scene scripts");
  for (const f of files) {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(f, "utf8"), { filename: f }), `${path.relative(HF, f)} does not parse`);
  }
});

const { HWT } = load();

test("hf-watch exposes the six objects and the shared helpers", () => {
  for (const k of ["line", "watcher", "vault", "cab", "ledger", "trays", "kit", "cam", "plaque"]) assert.equal(typeof HWT[k], "function", k);
});

test("watcher: the hammer's struck pose puts its head right under the bell rim", () => {
  const { hammer: h, bell: b } = HWT.WL;
  const a = h.rest + h.strike;
  const x = h.x + h.len * Math.cos(a), y = h.y + h.len * Math.sin(a);
  const RIM = 0.55;                                       // the bell lathe's mouth radius
  assert.ok(Math.abs(y + h.head - b.y) <= 0.08, `head top ${(y + h.head).toFixed(3)} vs rim ${b.y}`);
  assert.ok(x > b.x - RIM && x < b.x + RIM, `head x ${x.toFixed(3)} inside the rim ${b.x}±${RIM}`);
  /* and at rest it is well clear of the bell (the pawl holds it down) */
  const y0 = h.y + h.len * Math.sin(h.rest);
  assert.ok(b.y - (y0 + h.head) > 0.8, "rests clear of the bell");
});

test("ledger: the slipped belt hangs above the week pointer and the cells", () => {
  const { clock: c, stamp: st, belt, cell } = HWT.GL;
  const x0 = c.x + 1.4, len = st.x - x0, rz = belt.slipRz;
  /* the lowest point of the slipped belt: the far end of its lower run, rotated about the clock's pulley */
  const yLow = c.y + belt.slipY + len * Math.sin(rz) - belt.run * Math.cos(rz) - 0.035;
  const pointerTop = cell.y0 + 0.82 + 0.18, cellTop = cell.y0 + cell.h / 2;
  assert.ok(yLow > pointerTop + 0.05, `belt ${yLow.toFixed(3)} clears the pointer ${pointerTop.toFixed(3)}`);
  assert.ok(yLow > cellTop, "belt clears the cells");
});
