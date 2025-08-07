/**
 * Lightweight FIFO job queue with cancellation and de-duplication.
 * Intended to drive AI worker requests without UI flicker or race conditions.
 *
 * Usage:
 *  const queue = new JobQueue({ coalesceKey: job => job.type }); // optional dedupe
 *  const { id, promise, cancel } = queue.enqueue(async signal => { ... });
 *  const result = await promise;
 */
export class JobQueue {
  constructor({ coalesceKey = null, onChange = null } = {}) {
    this.queue = [];
    this.active = null;
    this.coalesceKey = typeof coalesceKey === "function" ? coalesceKey : null;
    this.onChange = onChange || (() => {});
    this._jobId = 0;
  }

  _emit() {
    this.onChange({
      size: this.queue.length + (this.active ? 1 : 0),
      active: !!this.active,
      pending: this.queue.length,
    });
  }

  /**
   * Enqueue a new job.
   * The executor receives an AbortSignal; it must check signal.aborted and abort work when set.
   * Returns { id, promise, cancel }.
   */
  enqueue(executor, meta = {}) {
    // Coalesce duplicates if configured
    if (this.coalesceKey) {
      const key = this.coalesceKey(meta);
      if (key != null) {
        // remove any pending job with same key
        this.queue = this.queue.filter(j => (j._coalesceKey || "__no__") !== key);
      }
      meta._coalesceKey = key;
    }

    const id = `job-${Date.now()}-${++this._jobId}`;
    let resolve, reject;
    const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
    const controller = new AbortController();

    const job = {
      id,
      meta,
      controller,
      resolve,
      reject,
      run: () => {
        try {
          const maybePromise = executor(controller.signal);
          Promise.resolve(maybePromise).then(
            (val) => {
              if (!controller.signal.aborted) resolve(val);
            },
            (err) => {
              if (!controller.signal.aborted) reject(err);
            }
          ).finally(() => {
            if (this.active && this.active.id === id) {
              this.active = null;
              this._next();
            }
          });
        } catch (e) {
          if (!controller.signal.aborted) reject(e);
          if (this.active && this.active.id === id) {
            this.active = null;
            this._next();
          }
        }
      },
      cancel: () => {
        try { controller.abort(); } catch {}
        // If it's pending, remove it. If active, active will observe abort and finish soon.
        if (!this.active || this.active.id !== id) {
          this.queue = this.queue.filter(j => j.id !== id);
          reject(new DOMException("Aborted", "AbortError"));
          this._emit();
        }
      },
      _coalesceKey: meta._coalesceKey,
    };

    this.queue.push(job);
    this._emit();
    this._kick();
    return { id, promise, cancel: job.cancel };
  }

  /**
   * Cancel all queued jobs (not the active one).
   * Optionally abort the active one too (force = true).
   */
  cancelAll({ force = false } = {}) {
    // Cancel pending
    for (const j of this.queue) {
      try { j.cancel(); } catch {}
    }
    this.queue = [];
    // Cancel active
    if (force && this.active) {
      try { this.active.controller.abort(); } catch {}
    }
    this._emit();
  }

  _kick() {
    if (!this.active) this._next();
  }

  _next() {
    if (this.active) return;
    const next = this.queue.shift();
    if (!next) {
      this._emit();
      return;
    }
    this.active = next;
    this._emit();
    // Run on next microtask to allow callers to attach handlers
    queueMicrotask(() => next.run());
  }
}

/**
 * Convenience: create a single shared queue instance.
 * Example coalescing: only keep the latest job per "type".
 */
let sharedQueue = null;
export function getSharedAIQueue() {
  if (!sharedQueue) {
    sharedQueue = new JobQueue({
      coalesceKey: (meta) => meta && meta.type ? meta.type : null,
    });
  }
  return sharedQueue;
}
