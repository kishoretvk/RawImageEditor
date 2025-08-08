/**
 * Safe AI worker call with timeout to avoid dangling async listeners.
 * @param {Worker} worker - The AI worker instance.
 * @param {string} type - The message type.
 * @param {object} payload - The message payload.
 * @param {object} options - Additional options.
 * @param {number} options.timeoutMs - Timeout in milliseconds.
 * @returns {Promise<object>} - A promise that resolves with the worker's response.
 */
export function callAI(worker, type, payload = {}, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve) => {
    if (!worker) return resolve({ ok: false, error: 'worker-not-ready' });
    const id = type + '-' + Math.random().toString(36).slice(2);

    let settled = false;
    const handler = (e) => {
      const msg = e.data;
      if (!msg || msg.id !== id) return;
      worker.removeEventListener('message', handler);
      settled = true;
      resolve(msg);
    };

    worker.addEventListener('message', handler);

    // Failsafe timeout to prevent "async response but channel closed" errors
    const to = setTimeout(() => {
      if (settled) return;
      try { worker.removeEventListener('message', handler); } catch {}
      resolve({ ok: false, id, error: 'timeout', type });
    }, timeoutMs);

    try {
      worker.postMessage({ id, type, payload });
    } catch (err) {
      clearTimeout(to);
      try { worker.removeEventListener('message', handler); } catch {}
      resolve({ ok: false, id, error: 'postMessage-failed', detail: String(err) });
    }
  });
}
