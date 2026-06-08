// Error policy (locked decision #9): transient → retry with backoff; else save state,
// pause, notify, and let the run resume from that point. Pure + injectable so it tests
// without real sleeps or real failures.

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Default classifier: network blips, timeouts, 429 and 5xx are transient (worth retrying). */
export function defaultIsTransient(err) {
  if (!err) return false;
  const code = err.code || "";
  if (["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "EPIPE"].includes(code)) return true;
  const status = err.status || err.statusCode;
  if (status === 429 || (status >= 500 && status <= 599)) return true;
  if (/rate.?limit|timeout|temporar|throttl/i.test(err.message || "")) return true;
  return false;
}

/** Run `fn(attempt)` with exponential backoff on transient errors. Throws the last error otherwise. */
export async function withRetry(fn, opts = {}) {
  const {
    max_attempts = 3,
    backoff_ms = 2000,
    backoff_factor = 2,
    isTransient = defaultIsTransient,
    sleepFn = sleep,
  } = opts;
  let attempt = 0;
  let lastErr;
  while (attempt < max_attempts) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      attempt += 1;
      if (attempt >= max_attempts || !isTransient(e)) break;
      await sleepFn(backoff_ms * Math.pow(backoff_factor, attempt - 1));
    }
  }
  const err = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  err.attempts = attempt;
  throw err;
}

/**
 * Run one pipeline step under the error policy. On unrecoverable failure it does NOT throw —
 * it calls onFatal (save state + notify) and returns a paused result so nothing broken ships.
 */
export async function guardStep(name, fn, { retry = {}, onFatal } = {}) {
  try {
    const result = await withRetry(fn, retry);
    return { ok: true, name, result };
  } catch (err) {
    const info = { name, error: String(err?.message || err), attempts: err?.attempts };
    if (onFatal) {
      try {
        await onFatal(info);
      } catch {
        /* notifying must never mask the original failure */
      }
    }
    return { ok: false, paused: true, ...info };
  }
}
