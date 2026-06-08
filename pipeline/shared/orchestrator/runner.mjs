// Runner port — the hybrid orchestration seam (locked decision #5).
//
// The production DAG has two kinds of nodes:
//   • mechanical  — run a Node/Python command (voice, align, render, upload). Same everywhere.
//   • agent       — an LLM task (write-script, review, qa). HOW it executes is the swappable part:
//        - "claude-code" (now): the top-level agent fulfils agent nodes by spawning sub-agents;
//          from inside a node script we cannot call the Agent tool, so we DEFER the request.
//        - "headless"   (later): a standalone process shells out to `claude -p` (Agent SDK).
//        - "mock"       (tests): canned responses.
//
// Adapters share runCommand(); they differ only in runAgent().
import { spawn } from "node:child_process";

/** Run a child process. Resolves (never rejects) so the orchestrator's error policy decides. */
export function runCommand({ cmd, args = [], cwd, env, timeoutMs } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...(env || {}) },
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    let timer = null;
    if (timeoutMs) timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr + String(e.message), error: e });
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

/** Base runner: mechanical nodes are identical across modes. */
export class Runner {
  constructor(opts = {}) {
    this.opts = opts;
    this.mode = "base";
  }
  async runCommand(spec) {
    return runCommand(spec);
  }
  // eslint-disable-next-line no-unused-vars
  async runAgent(task) {
    throw new Error(`${this.constructor.name}.runAgent not implemented`);
  }
}

/** Tests: returns canned results. `responder(task)` may override per-task. */
export class MockRunner extends Runner {
  constructor(opts = {}) {
    super(opts);
    this.mode = "mock";
    this.responder = opts.responder || (() => ({ ok: true, data: {} }));
    this.calls = [];
  }
  async runAgent(task) {
    this.calls.push(task);
    return this.responder(task);
  }
}

/** Mode A (Claude Code): defer agent nodes back to the top-level orchestrating agent. */
export class ClaudeCodeRunner extends Runner {
  constructor(opts = {}) {
    super(opts);
    this.mode = "claude-code";
  }
  async runAgent(task) {
    // The node process cannot call the Agent tool; signal a deferral the orchestrator surfaces.
    return { deferred: true, task };
  }
}

/** Mode B (headless): shell out to the Claude Code SDK CLI. Not exercised in unit tests. */
export class HeadlessRunner extends Runner {
  constructor(opts = {}) {
    super(opts);
    this.mode = "headless";
    this.cli = opts.cli || "claude";
  }
  async runAgent(task) {
    const args = ["-p", task.prompt, "--output-format", "json"];
    if (task.model) args.push("--model", task.model);
    const { code, stdout, stderr } = await this.runCommand({ cmd: this.cli, args, timeoutMs: task.timeoutMs });
    if (code !== 0) return { ok: false, error: stderr || `claude exited ${code}` };
    try {
      return { ok: true, data: JSON.parse(stdout) };
    } catch {
      return { ok: true, data: { text: stdout } };
    }
  }
}

const REGISTRY = {
  mock: MockRunner,
  "claude-code": ClaudeCodeRunner,
  headless: HeadlessRunner,
};

/** Pick a runner by explicit mode, then env (TAD_RUNNER), default "claude-code". */
export function createRunner(opts = {}) {
  const mode = opts.mode || process.env.TAD_RUNNER || "claude-code";
  const Cls = REGISTRY[mode];
  if (!Cls) throw new Error(`unknown runner mode: ${mode} (have: ${Object.keys(REGISTRY).join(", ")})`);
  return new Cls(opts);
}
