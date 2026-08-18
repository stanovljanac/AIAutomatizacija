// V6 — the HyperFrames engine compiler. The headline guarantee is WINDOW PARITY: an HF clip is
// EXACTLY as long as the Remotion scene window it composites into (same crossfade pull-back, same
// rounding), and its clip-relative reveal seconds equal the Remotion reveal frames / fps. Rendering
// is spawn-injected so tests never launch a browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertValid, withTempDir } from "../shared/testkit/index.mjs";
import { hfClipLocalSeconds } from "../04b-thumbnails/extract.mjs";
import { compileTimeline } from "./compile-remotion.mjs";
import {
  buildHyperframesJobs,
  buildEntryCommand,
  buildRenderCommand,
  buildNormaliseCommand,
  copyHyperframesClips,
  detectDeadRender,
  jobVariables,
  renderHyperframesScenes,
} from "./compile-hyperframes.mjs";

const fps = 30;

/**
 * A synthetic 3-scene timeline; the middle scene is a hyperframes hero with reveals.
 * s1 authors a DISSOLVE so the pull-back path stays exercised (D-060 made the hard cut the default,
 * so an unauthored timeline overlaps nowhere and the parity assertions would be trivially true).
 */
function syntheticTimeline() {
  return {
    version: 1,
    out_id: "syn",
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 14,
    audio: { src: "syn/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 2.5, cta: "C", brand: "" },
    crossfade_seconds: 9 / fps,
    motion: { intensity: "standard" },
    scenes: [
      { scene_id: "s1.0", engine: "remotion", template: "hook-card", start_seconds: 1.5, end_seconds: 4, transition_out: "dissolve", props: { title: "Hook" } },
      {
        scene_id: "s2.0", engine: "hyperframes", template: "custom",
        start_seconds: 4, end_seconds: 8.5,
        props: { hf_scene: "kinetic-hook", title: "Hero", items: ["a", "b"] },
        reveals: [{ at_seconds: 5 }, { at_seconds: 7 }],
      },
      { scene_id: "s3.0", engine: "remotion", template: "cta-card", start_seconds: 8.5, end_seconds: 11.5, props: { title: "CTA" } },
    ],
    captions: [],
  };
}

test("synthetic HF timeline satisfies the timeline schema (engine + props.hf_scene allowed)", () => {
  assertValid(syntheticTimeline(), "timeline");
});

test("[PARITY] HF job window math equals compileTimeline's scene window exactly (with crossfade)", () => {
  const timeline = syntheticTimeline();
  const leadFrames = 7;
  const props = compileTimeline(timeline, { leadFrames });
  const { jobs, warnings } = buildHyperframesJobs(timeline, { leadFrames });
  assert.equal(warnings.length, 0);
  assert.equal(jobs.length, 1, "only the hyperframes scene becomes a job");

  const job = jobs[0];
  const rsc = props.scenes.find((s) => s.sceneId === "s2.0");
  assert.equal(job.sceneIndex, 1, "k indexes the FULL timeline.scenes list (crossfade pull-back applies)");
  assert.equal(job.durationFrames, rsc.durFrames, "HF clip length === Remotion scene window 1:1");
  assert.equal(job.durationSeconds, job.durationFrames / fps);
  // reveals: clip-relative seconds === Remotion's clip-relative frames / fps (lead applied identically)
  assert.deepEqual(job.revealsSeconds, rsc.props.reveals.map((f) => f / fps));
  // hand-checked: xf=9; fromFrame = round(4*30)-9 = 111; dur = round(8.5*30)-111 = 144
  assert.equal(job.durationFrames, 144);
  assert.deepEqual(job.revealsSeconds, [(150 - 111 - 7) / fps, (210 - 111 - 7) / fps]);
});

test("a FIRST-scene HF job gets no crossfade pull-back (k === 0), mirroring Remotion", () => {
  const timeline = syntheticTimeline();
  timeline.scenes[0].engine = "hyperframes";
  timeline.scenes[0].props.hf_scene = "opener";
  const props = compileTimeline(timeline);
  const { jobs } = buildHyperframesJobs(timeline);
  assert.equal(jobs[0].sceneId, "s1.0");
  assert.equal(jobs[0].durationFrames, props.scenes[0].durFrames);
  assert.equal(jobs[0].durationFrames, Math.round(4 * fps) - Math.round(1.5 * fps)); // 75, no pull-back
});

test("hf_scene missing → warning + skip (other jobs unaffected)", () => {
  const timeline = syntheticTimeline();
  delete timeline.scenes[1].props.hf_scene;
  const { jobs, warnings } = buildHyperframesJobs(timeline);
  assert.equal(jobs.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /s2\.0/);
  assert.match(warnings[0], /hf_scene/);
});

test("remotion-only timeline → zero jobs, zero warnings", () => {
  const timeline = syntheticTimeline();
  timeline.scenes[1].engine = "remotion";
  const { jobs, warnings } = buildHyperframesJobs(timeline);
  assert.deepEqual(jobs, []);
  assert.deepEqual(warnings, []);
});

test("job/variables shape: the fixed contract, props WITHOUT hf_scene, empty reveals when none", () => {
  const timeline = syntheticTimeline();
  delete timeline.scenes[1].reveals;
  const { jobs } = buildHyperframesJobs(timeline);
  const job = jobs[0];
  assert.equal(job.hfScene, "kinetic-hook");
  assert.equal(job.outFile, "s2.0.mp4");
  assert.deepEqual(job.props, { title: "Hero", items: ["a", "b"] }, "hf_scene stripped from props");
  assert.deepEqual(job.revealsSeconds, [], "no reveals → empty array (contract: always present)");
  assert.deepEqual(Object.keys(jobVariables(job)), ["hfScene", "fps", "width", "height", "durationFrames", "durationSeconds", "revealsSeconds", "props"]);
  assert.equal(jobVariables(job).durationSeconds, job.durationFrames / fps);
});

test("buildHyperframesJobs is pure — does not mutate the timeline", () => {
  const timeline = syntheticTimeline();
  const snapshot = JSON.stringify(timeline);
  buildHyperframesJobs(timeline, { leadFrames: 7 });
  assert.equal(JSON.stringify(timeline), snapshot);
});

test("buildEntryCommand derives the per-job render entry from the variables file", () => {
  const { jobs } = buildHyperframesJobs(syntheticTimeline());
  const { cmd, args } = buildEntryCommand(jobs[0], { varsFile: "V.json" });
  assert.equal(cmd, "node");
  assert.deepEqual(args, ["scenes/kinetic-hook/make-entry.mjs", "V.json"]);
});

test("buildRenderCommand carries scene dir, entry, output, fps and variables file", () => {
  const { jobs } = buildHyperframesJobs(syntheticTimeline());
  const { cmd, args } = buildRenderCommand(jobs[0], { varsFile: "V.json", outFile: "O.mp4", entry: "compositions/e.html" });
  assert.equal(cmd, "npx");
  assert.deepEqual(args, [
    "hyperframes", "render", "./scenes/kinetic-hook",
    "-c", "compositions/e.html",
    "--variables-file", "V.json",
    "--fps", "30",
    "--quality", "high",
    "--output", "O.mp4",
  ]);
});

// ── renderHyperframesScenes: spawn-injected, idempotent/resumable ────────────────────────────────

/**
 * A fake spawnSync. Each render is now TWO spawns: the make-entry pre-step (returns the entry path
 * on stdout, never recorded) and the actual render (recorded; "renders" by writing the --output
 * target). Only render calls land in `calls`, so the existing call-count assertions still hold.
 */
function fakeSpawn(calls, { status = 0, produceFile = true } = {}) {
  return (cmd, args, opts) => {
    if (cmd === "node" && /make-entry\.mjs$/.test(args[0])) {
      return { status: 0, stdout: "compositions/render-entry.html\n" };
    }
    if (cmd === "ffmpeg") {
      // the compositor-safe normalisation pass: writes its -y target, never counted as a render
      fs.writeFileSync(args[args.length - 1], "fake-normalised-mp4");
      return { status: 0 };
    }
    calls.push({ cmd, args, opts });
    const out = args[args.indexOf("--output") + 1];
    if (produceFile && status === 0) fs.writeFileSync(out, "fake-mp4");
    return { status };
  };
}

test("renderHyperframesScenes writes the variables file + renders, then SKIPS when unchanged", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline(), { leadFrames: 7 });

    const calls = [];
    const r1 = renderHyperframesScenes({ root: dir, cdir, jobs, spawn: fakeSpawn(calls) });
    assert.deepEqual(r1, { rendered: ["s2.0"], skipped: [] });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].opts.cwd, path.join(dir, "templates", "hyperframes"), "renders with cwd = templates/hyperframes");
    const varsFile = path.join(cdir, "video", "hf", "s2.0.variables.json");
    const vars = JSON.parse(fs.readFileSync(varsFile, "utf8"));
    assert.deepEqual(vars, jobVariables(jobs[0]), "variables file is exactly the contract payload");
    assert.ok(fs.existsSync(path.join(cdir, "video", "hf", "s2.0.mp4")));

    // 2nd run, same inputs → idempotent skip (no spawn)
    const r2 = renderHyperframesScenes({ root: dir, cdir, jobs, spawn: fakeSpawn(calls) });
    assert.deepEqual(r2, { rendered: [], skipped: ["s2.0"] });
    assert.equal(calls.length, 1, "no new spawn on unchanged inputs");

    // changed variables (different lead) → re-render
    const { jobs: jobs2 } = buildHyperframesJobs(syntheticTimeline(), { leadFrames: 0 });
    const r3 = renderHyperframesScenes({ root: dir, cdir, jobs: jobs2, spawn: fakeSpawn(calls) });
    assert.deepEqual(r3.rendered, ["s2.0"]);
    assert.equal(calls.length, 2, "changed variables invalidate the skip");

    // --force → re-render even when unchanged
    const r4 = renderHyperframesScenes({ root: dir, cdir, jobs: jobs2, force: true, spawn: fakeSpawn(calls) });
    assert.deepEqual(r4.rendered, ["s2.0"]);
    assert.equal(calls.length, 3);
  });
});

test("renderHyperframesScenes throws loudly on a non-zero exit", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline());
    assert.throws(
      () => renderHyperframesScenes({ root: dir, cdir, jobs, spawn: fakeSpawn([], { status: 1 }) }),
      /exit 1/
    );
  });
});

test("renderHyperframesScenes throws when a zero-exit render produced no mp4", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline());
    assert.throws(
      () => renderHyperframesScenes({ root: dir, cdir, jobs, spawn: fakeSpawn([], { produceFile: false }) }),
      /not produced/
    );
  });
});

// ── copyHyperframesClips: public/ resolution + missing-clip warning ──────────────────────────────

test("copyHyperframesClips copies the clip into remotion public/ and sets props.hfSrc", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(path.join(cdir, "video", "hf"), { recursive: true });
    fs.writeFileSync(path.join(cdir, "video", "hf", "s2.0.mp4"), "clip");
    const props = compileTimeline(syntheticTimeline());
    const warnings = copyHyperframesClips({ root: dir, cdir, outId: "004-x", props });
    assert.deepEqual(warnings, []);
    const sc = props.scenes.find((s) => s.sceneId === "s2.0");
    assert.equal(sc.props.hfSrc, "004-x/hf/s2.0.mp4");
    assert.ok(fs.existsSync(path.join(dir, "templates/remotion/public", "004-x", "hf", "s2.0.mp4")));
    // remotion scenes untouched
    assert.equal(props.scenes[0].props.hfSrc, undefined);
  });
});

test("copyHyperframesClips warns (with the resume command) when the clip is missing", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x", "short");
    fs.mkdirSync(cdir, { recursive: true });
    const props = compileTimeline(syntheticTimeline());
    const warnings = copyHyperframesClips({ root: dir, cdir, outId: "004-x-short", props });
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /node pipeline\/04-render\/compile-hyperframes\.mjs 004-x\/short/, "tells the user the exact resume command (nested id)");
    const sc = props.scenes.find((s) => s.sceneId === "s2.0");
    assert.equal(sc.props.hfSrc, undefined, "no hfSrc → Remotion falls back to the scene template");
  });
});

// ── compileTimeline engine pass-through (the Remotion side of the combo) ─────────────────────────

test("compileTimeline passes engine through for HF scenes and OMITS the key for remotion scenes", () => {
  const props = compileTimeline(syntheticTimeline());
  const hf = props.scenes.find((s) => s.sceneId === "s2.0");
  assert.equal(hf.engine, "hyperframes");
  for (const s of props.scenes) {
    if (s.sceneId === "s2.0") continue;
    assert.ok(!("engine" in s), `remotion scene ${s.sceneId} must not carry an engine key (golden byte-identity)`);
  }
});

// ── VERIFIER-ADDED REGRESSION TESTS ───────────────────────────────────────────────────────────────

// ── BUG 1: hf_scene not in jobVariables → silent wrong-clip reuse ─────────────────────────────────
//
// CONFIRMED BUG (severity: HIGH). jobVariables() intentionally omits `hfScene` from the
// variables payload (it's stripped from props so the hero scene doesn't receive it). However,
// the *skip* decision — "is the variables file byte-identical?" — uses jobVariables() as its
// sole cache key. Consequence: if the operator changes ONLY props.hf_scene (pointing the scene
// at a completely different hero template) but no other render param changes, the old mp4 is
// wrongly reused and the wrong clip composites into the final video. The fix is to add a
// top-level `hfScene` key to the jobVariables payload so a scene-name change invalidates the cache.
//
// FIX LOCATION: compile-hyperframes.mjs, jobVariables() ~line 85-95.
// SUGGESTED CHANGE:
//   return {
//     hfScene: job.hfScene,   // <-- ADD THIS LINE
//     fps: job.fps,
//     ...
//   };

test("[REGRESSION] jobVariables includes hfScene so changing hf_scene invalidates the skip cache", () => {
  const tl1 = syntheticTimeline();
  const tl2 = syntheticTimeline();
  tl2.scenes[1].props.hf_scene = "completely-different-scene";

  const { jobs: j1 } = buildHyperframesJobs(tl1, { leadFrames: 7 });
  const { jobs: j2 } = buildHyperframesJobs(tl2, { leadFrames: 7 });

  const vars1 = jobVariables(j1[0]);
  const vars2 = jobVariables(j2[0]);

  // hfScene must be present in the payload so the fingerprint changes when the scene template changes
  assert.ok("hfScene" in vars1, "jobVariables must carry hfScene so the skip fingerprint covers the rendered template");
  assert.notEqual(
    JSON.stringify(vars1),
    JSON.stringify(vars2),
    "changing only props.hf_scene must produce a different jobVariables JSON (different cache fingerprint) to prevent wrong-clip reuse"
  );
});

// Companion: prove renderHyperframesScenes re-renders when ONLY hf_scene changes (once the fix lands).
// Currently this test FAILS because jobVariables omits hfScene.
test("[REGRESSION] renderHyperframesScenes re-renders when hf_scene changes even if dimensions/reveals are identical", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });

    const tl1 = syntheticTimeline();
    const tl2 = syntheticTimeline();
    tl2.scenes[1].props.hf_scene = "completely-different-scene";

    const { jobs: j1 } = buildHyperframesJobs(tl1, { leadFrames: 7 });
    const { jobs: j2 } = buildHyperframesJobs(tl2, { leadFrames: 7 });

    function fakeSpawn(calls) {
      return (cmd, args, opts) => {
        if (cmd === "node" && /make-entry\.mjs$/.test(args[0])) {
          return { status: 0, stdout: "compositions/render-entry.html\n" };
        }
        if (cmd === "ffmpeg") {
          fs.writeFileSync(args[args.length - 1], "fake-normalised-mp4");
          return { status: 0 };
        }
        calls.push({ cmd, args, opts });
        // strip any cmd.exe shell-quoting so we locate the real output path
        const rawArgs = args.map((a) => (typeof a === "string" && a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1).replace(/\\"/g, '"') : a));
        const out = rawArgs[rawArgs.indexOf("--output") + 1];
        if (out) fs.writeFileSync(out, "fake-mp4");
        return { status: 0 };
      };
    }

    const calls1 = [];
    renderHyperframesScenes({ root: dir, cdir, jobs: j1, spawn: fakeSpawn(calls1) });
    assert.equal(calls1.length, 1, "first render runs");

    // second run with different hf_scene — must NOT skip (without the fix it wrongly skips)
    const calls2 = [];
    const r2 = renderHyperframesScenes({ root: dir, cdir, jobs: j2, spawn: fakeSpawn(calls2) });
    assert.equal(calls2.length, 1, "hf_scene change must invalidate the skip and trigger a re-render");
    assert.deepEqual(r2.rendered, ["s2.0"]);
    assert.deepEqual(r2.skipped, []);
  });
});

// ── BUG 2 (LOW / latent): process.env aliased when .bin is absent ─────────────────────────────────
//
// When templates/hyperframes/.bin does NOT exist, childEnv is assigned the direct reference
// `process.env` (not a spread copy). Any future code that writes to childEnv would silently
// corrupt the parent process environment. Currently no code path writes to childEnv after the
// assignment, so this is a latent hazard rather than an active bug. The fix is a one-liner:
//   : { ...process.env };   (always spread)
//
// FIX LOCATION: compile-hyperframes.mjs, renderHyperframesScenes ~line 144-146.
// SUGGESTED CHANGE:
//   const childEnv = existsSync(binDir)
//     ? { ...process.env, PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}` }
//     : { ...process.env };   // always a fresh copy — never alias process.env

test("[REGRESSION] renderHyperframesScenes childEnv is a fresh object (never aliases process.env)", async () => {
  // We cannot read childEnv directly, but we CAN verify that a sentinel property written by the
  // spawn mock does NOT appear on process.env — which would happen if childEnv === process.env.
  // Strategy: inject a fakeSpawn that mutates opts.env (the childEnv passed to spawn) and assert
  // process.env is untouched.
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline(), { leadFrames: 7 });

    const sentinel = "__TAD_TEST_SENTINEL_" + Date.now();
    let capturedEnv = null;
    function fakeSpawn(cmd, args, opts) {
      if (cmd === "node" && /make-entry\.mjs$/.test(args[0])) {
        return { status: 0, stdout: "compositions/render-entry.html\n" };
      }
      if (cmd === "ffmpeg") {
        fs.writeFileSync(args[args.length - 1], "fake-normalised-mp4");
        return { status: 0 };
      }
      capturedEnv = opts.env;
      // Mutate the received env object to test aliasing
      opts.env[sentinel] = "LEAKED";
      const rawArgs = args.map((a) => (typeof a === "string" && a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1).replace(/\\"/g, '"') : a));
      const out = rawArgs[rawArgs.indexOf("--output") + 1];
      if (out) fs.writeFileSync(out, "fake-mp4");
      return { status: 0 };
    }

    renderHyperframesScenes({ root: dir, cdir, jobs, spawn: fakeSpawn });
    assert.ok(capturedEnv !== null, "spawn was called");
    // If childEnv was process.env itself, the sentinel would have leaked into process.env
    assert.equal(process.env[sentinel], undefined,
      "mutating opts.env (childEnv) must NOT leak into process.env — childEnv must be a fresh object, not an alias");
    // Clean up in case the test fails and childEnv IS process.env
    delete process.env[sentinel];
  });
});

// ── WINDOW PARITY: HF at index > 1 and as last scene (gap in the existing suite) ─────────────────

test("[REGRESSION-PARITY] HF scene at index 2 of 4 gets the correct crossfade pull-back and parity", () => {
  // Existing suite only has HF at index 1 of 3. This pins the case where HF is at index 2
  // (i.e. k=2, full crossfade pull-back), which is the most common real-world scenario.
  // D-060: now also a MIXED-transition timeline — cut, then dissolve, then an authorial `match`
  // (which composites as a cut). The HF window must track the boundary policy exactly.
  const timeline = {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 20,
    audio: { src: "x/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 2.5, cta: "C", brand: "" },
    crossfade_seconds: 9 / fps,
    motion: { intensity: "standard" },
    scenes: [
      { scene_id: "sa", engine: "remotion", template: "hook-card", start_seconds: 1.5, end_seconds: 5, transition_out: "cut", props: { title: "A" } },
      // sb dissolves INTO the HF hero — so the hero is the pulled-back scene (the case this pins)
      { scene_id: "sb", engine: "remotion", template: "section-header", start_seconds: 5, end_seconds: 9, transition_out: "dissolve", props: { title: "B" } },
      {
        scene_id: "sc", engine: "hyperframes", template: "custom",
        start_seconds: 9, end_seconds: 14,
        transition_out: "match",
        props: { hf_scene: "kinetic", title: "C" },
        reveals: [{ at_seconds: 10.5 }, { at_seconds: 12 }],
      },
      { scene_id: "sd", engine: "remotion", template: "cta-card", start_seconds: 14, end_seconds: 17.5, props: { title: "D" } },
    ],
    captions: [],
  };
  const leadFrames = 7;
  const remotionProps = compileTimeline(timeline, { leadFrames });
  const { jobs, warnings } = buildHyperframesJobs(timeline, { leadFrames });

  assert.equal(warnings.length, 0);
  assert.equal(jobs.length, 1);
  const job = jobs[0];
  const rsc = remotionProps.scenes.find((s) => s.sceneId === "sc");

  assert.equal(job.sceneIndex, 2, "k=2 — uses the FULL timeline index (not HF-scene-only index)");
  assert.equal(job.durationFrames, rsc.durFrames, "HF durFrames === Remotion durFrames (parity)");
  assert.deepEqual(
    job.revealsSeconds,
    rsc.props.reveals.map((f) => f / fps),
    "reveal seconds === Remotion reveal frames / fps"
  );
  // Hand-checked: xf=9, fromFrame=round(9*30)-9=261; dur=round(14*30)-261=159
  assert.equal(job.durationFrames, 159);
});

test("[REGRESSION-PARITY] HF scene as the LAST scene of the timeline (no following scene)", () => {
  const timeline = {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 15,
    audio: { src: "x/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 2.5, cta: "C", brand: "" },
    crossfade_seconds: 9 / fps,
    motion: {},
    scenes: [
      { scene_id: "sa", engine: "remotion", template: "hook-card", start_seconds: 1.5, end_seconds: 6, props: { title: "A" } },
      { scene_id: "sb", engine: "remotion", template: "section-header", start_seconds: 6, end_seconds: 10, props: { title: "B" } },
      {
        scene_id: "sc", engine: "hyperframes", template: "custom",
        start_seconds: 10, end_seconds: 12.5,
        props: { hf_scene: "kinetic", title: "C" },
        reveals: [{ at_seconds: 11 }],
      },
    ],
    captions: [],
  };
  const leadFrames = 0;
  const remotionProps = compileTimeline(timeline, { leadFrames });
  const { jobs } = buildHyperframesJobs(timeline, { leadFrames });

  assert.equal(jobs.length, 1);
  const job = jobs[0];
  const rsc = remotionProps.scenes.find((s) => s.sceneId === "sc");
  assert.equal(job.sceneIndex, 2, "last scene k=2 — still applies crossfade pull-back");
  assert.equal(job.durationFrames, rsc.durFrames, "last-scene HF durFrames === Remotion durFrames (parity)");
  assert.deepEqual(
    job.revealsSeconds,
    rsc.props.reveals.map((f) => f / fps)
  );
});

// ── THE THIRD PARITY LEG (D-060) ─────────────────────────────────────────────────────────────────
// The window math had THREE consumers, and only two were ever compared: 04b-thumbnails' hfClipLocalSeconds
// was a hand-mirrored copy in another phase dir with no parity test, and it fails SILENTLY (a drifted
// copy grabs the wrong frame out of every HF clip and nothing errors). All three now call sceneWindow;
// this test is what keeps them honest.

test("[PARITY] 04b hfClipLocalSeconds agrees with compileTimeline's window on a MIXED-transition timeline", () => {
  const timeline = {
    version: 1,
    format: { width: 1920, height: 1080, fps },
    duration_seconds: 22,
    audio: { src: "x/narration.mp3", start_seconds: 1.5 },
    intro: { duration_seconds: 1.5, wordmark: "W", tagline: "T" },
    outro: { duration_seconds: 2.5, cta: "C", brand: "" },
    crossfade_seconds: 9 / fps,
    motion: {},
    scenes: [
      { scene_id: "s1.0", engine: "hyperframes", template: "custom", start_seconds: 1.5, end_seconds: 5, transition_out: "dissolve", props: { hf_scene: "a" } },
      { scene_id: "s2.0", engine: "hyperframes", template: "custom", start_seconds: 5, end_seconds: 9, transition_out: "cut", props: { hf_scene: "b" } },
      { scene_id: "s3.0", engine: "hyperframes", template: "custom", start_seconds: 9, end_seconds: 14, transition_out: "carry", props: { hf_scene: "c" } },
      { scene_id: "s4.0", engine: "hyperframes", template: "custom", start_seconds: 14, end_seconds: 19, transition_out: "push", props: { hf_scene: "d" } },
    ],
    captions: [],
  };
  const props = compileTimeline(timeline);

  timeline.scenes.forEach((sc, k) => {
    const rsc = props.scenes[k];
    // grab in the middle of the scene: the clip-local time must map back to the same ABSOLUTE frame
    const abs = (sc.start_seconds + sc.end_seconds) / 2;
    const local = hfClipLocalSeconds(timeline, k, abs);
    assert.equal(
      Math.round(local * fps) + rsc.fromFrame,
      Math.round(abs * fps),
      `${sc.scene_id}: a thumbnail grabbed at clip-local ${local}s must be the frame the composite shows at ${abs}s`
    );
    assert.ok(local >= 0 && local <= (rsc.durFrames - 1) / fps, `${sc.scene_id}: the grab stays inside the clip`);
  });
});

// ── ATTACK 3: q() quoting robustness ─────────────────────────────────────────────────────────────
// The fakeSpawn in these tests must tolerate q()'d paths (args are already quoted on win32 before
// being handed to spawn). Test that the fakeSpawn helper strips cmd.exe shell-quoting so the output
// file is written to the CORRECT unquoted path — and that the real renderHyperframesScenes
// SKIP logic works correctly (existsSync uses the unquoted path).

test("[REGRESSION] renderHyperframesScenes skip logic works when output path contains spaces (q() quoting)", async () => {
  // Simulate the repo living under a path with a space ("AI Automatizacija").
  // We can't create a real space-path tmp dir reliably in CI, but we CAN verify the skip logic
  // by using a fakeSpawn that explicitly strips cmd.exe shell-quoting before writing the file,
  // then confirming the second run skips correctly.
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline(), { leadFrames: 7 });

    // Quote-tolerant fakeSpawn: strips wrapping cmd.exe double-quotes from the --output arg
    // before writing the file, exactly as cmd.exe would interpret the arg.
    function quoteTolerantFakeSpawn(calls) {
      return (cmd, args, opts) => {
        if (cmd === "node" && /make-entry\.mjs$/.test(args[0])) {
          return { status: 0, stdout: "compositions/render-entry.html\n" };
        }
        if (cmd === "ffmpeg") {
          fs.writeFileSync(args[args.length - 1], "fake-normalised-mp4");
          return { status: 0 };
        }
        calls.push({ cmd, args, opts });
        const rawArgs = args.map((a) =>
          typeof a === "string" && a.startsWith('"') && a.endsWith('"')
            ? a.slice(1, -1).replace(/\\"/g, '"')
            : a
        );
        const out = rawArgs[rawArgs.indexOf("--output") + 1];
        if (out) fs.writeFileSync(out, "fake-mp4");
        return { status: 0 };
      };
    }

    const calls = [];
    const r1 = renderHyperframesScenes({ root: dir, cdir, jobs, spawn: quoteTolerantFakeSpawn(calls) });
    assert.deepEqual(r1.rendered, ["s2.0"]);
    assert.equal(calls.length, 1);

    // Second run: same inputs → skip (the mp4 was written to the correct unquoted path)
    const r2 = renderHyperframesScenes({ root: dir, cdir, jobs, spawn: quoteTolerantFakeSpawn(calls) });
    assert.deepEqual(r2.skipped, ["s2.0"], "skip works when fakeSpawn strips q() shell-quoting before writing");
    assert.equal(calls.length, 1, "no new spawn on second run");
  });
});

// ── detectDeadRender: the silent-death guard (D-060 Phase 3) ─────────────────────────────────────

/**
 * The real log of a scene whose gsap 404'd (captured from an actual `hyperframes render`,
 * 2026-07-17). Every line here came out of a run that exited 0 and wrote a VALID, static mp4 —
 * which is exactly why exit status is not a truth signal.
 */
const DEAD_LOG = `
[hyperframes] browserGpuMode auto → hardware (WebGL probe succeeded)
[FileServer] 404 Not Found: /_lib/gsap.min.js
[non-blocking] Failed to load resource: the server responded with a status of 404 (Not Found)
[Browser:PAGEERROR] gsap is not defined
[FrameCapture] Sub-composition timelines not registered after 45000ms: probe.
  █████████████████████████  100%  Render complete
`;

const LIVE_LOG = `
[Compiler] Found 1 asset(s) outside project directory — will copy to render output
[INFO] [Render] No HDR sources detected — rendering SDR
  █████████████████████████  100%  Render complete
`;

test("detectDeadRender flags a 404'd asset, the page error, and the missing timeline", () => {
  const reasons = detectDeadRender(DEAD_LOG);
  assert.equal(reasons.length, 3);
  assert.match(reasons.join(" "), /\/_lib\/gsap\.min\.js/);
  assert.match(reasons.join(" "), /gsap is not defined/);
  assert.match(reasons.join(" "), /no timeline registered/);
});

test("detectDeadRender stays quiet on a healthy render (incl. the _lib external-asset copy)", () => {
  assert.deepEqual(detectDeadRender(LIVE_LOG), []);
  assert.deepEqual(detectDeadRender(""), []);
  assert.deepEqual(detectDeadRender(undefined), []);
});

test("detectDeadRender does not trip on ordinary scene text that merely resembles the signals", () => {
  // anchored to the CLI's own prefixes — a scene may legitimately render these words
  const log = 'rendering card "404 Not Found" · headline: the term is not defined · Render complete\n';
  assert.deepEqual(detectDeadRender(log), []);
});

test("[ACCEPTANCE] a render that exits 0 but is DEAD throws AND discards the mp4 (never cached as good)", async () => {
  await withTempDir(async (dir) => {
    const cdir = path.join(dir, "content", "004-x");
    fs.mkdirSync(cdir, { recursive: true });
    const { jobs } = buildHyperframesJobs(syntheticTimeline(), { leadFrames: 7 });

    // exits 0, writes a real file, but the log says the scene never came alive
    const deadSpawn = (cmd, args) => {
      if (cmd === "node" && /make-entry\.mjs$/.test(args[0])) return { status: 0, stdout: "compositions/e.html\n" };
      const out = args[args.indexOf("--output") + 1];
      fs.writeFileSync(out, "fake-mp4");
      return { status: 0, stdout: DEAD_LOG, stderr: "" };
    };

    assert.throws(
      () => renderHyperframesScenes({ root: dir, cdir, jobs, spawn: deadSpawn }),
      /DEAD clip.*gsap is not defined|gsap is not defined.*DEAD clip/s,
      "a silently dead render must fail the build, not pass",
    );
    assert.equal(
      fs.existsSync(path.join(cdir, "video", "hf", "s2.0.mp4")),
      false,
      "the dead mp4 must be deleted, or the next run skips it as cached-and-fine",
    );
  });
});

// ── compositor-safe normalisation (2026-08-18) ────────────────────────────────────────────────
// Remotion's compositor intermittently reports "No frame found at position" on the raw HyperFrames
// output — a hard failure in portrait, a single BLACK FRAME in 16:9. Every clip is re-encoded CFR
// with a cloned tail so the compositor is never asked for a frame at or past the last one.
test("buildNormaliseCommand pads a cloned tail and pins CFR at the job's fps", () => {
  const { cmd, args } = buildNormaliseCommand({ fps: 30 }, { inFile: "in.mp4", outFile: "out.mp4" });
  assert.equal(cmd, "ffmpeg");
  const vf = args[args.indexOf("-vf") + 1];
  assert.match(vf, /tpad=stop_mode=clone:stop_duration=/, "a cloned tail past the end is the documented remedy");
  assert.match(vf, /fps=30$/, "and the stream is resampled to the job's exact fps");
  assert.equal(args[args.indexOf("-vsync") + 1], "cfr", "variable frame rate is what the compositor mis-seeks");
  assert.equal(args[args.indexOf("-i") + 1], "in.mp4");
  assert.equal(args[args.length - 1], "out.mp4");
  assert.ok(args.includes("-an"), "HF clips are silent; the narration lives only in Remotion");
});

test("buildNormaliseCommand follows a non-30 fps job", () => {
  const { args } = buildNormaliseCommand({ fps: 24 }, { inFile: "a.mp4", outFile: "b.mp4" });
  assert.match(args[args.indexOf("-vf") + 1], /fps=24$/);
});
