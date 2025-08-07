/**
 * Model caching and session creation helper.
 * - Downloads model(s) once, stores bytes in IndexedDB keyed by name@version.
 * - Subsequent loads read from cache and create an ORT session.
 * - Supports multiple URL mirrors; first successful fetch wins.
 */
import { initRuntime, getORT, createSession } from "./runtime";

const DB_NAME = "ai-model-cache";
const STORE = "models";

/**
 * Open IndexedDB database (lazy).
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get ArrayBuffer from IndexedDB by key.
 */
async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Put ArrayBuffer into IndexedDB by key.
 */
async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch a URL as ArrayBuffer with optional progress callback.
 */
async function fetchAsArrayBuffer(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (!res.body || !("getReader" in res.body)) {
    // No stream; return directly
    const buf = await res.arrayBuffer();
    if (onProgress && contentLength) onProgress(contentLength, contentLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (onProgress && contentLength) onProgress(received, contentLength);
    }
  }
  // concat
  const total = received;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out.buffer;
}

/**
 * Get model bytes from cache or download from one of the provided URLs.
 */
export async function getModelBuffer({ name, version, urls, onProgress }) {
  if (!name || !version || !urls || !urls.length) {
    throw new Error("getModelBuffer: missing name/version/urls");
  }
  const key = `${name}@${version}`;
  const cached = await idbGet(key);
  if (cached && cached.byteLength > 0) {
    if (onProgress) onProgress(1, 1, { cached: true });
    return { buffer: cached, fromCache: true };
  }

  // Try URLs in order
  let lastErr = null;
  for (const url of urls) {
    try {
      const buf = await fetchAsArrayBuffer(url, (loaded, total) => {
        if (onProgress) onProgress(loaded, total, { url, cached: false });
      });
      await idbPut(key, buf);
      return { buffer: buf, fromCache: false };
    } catch (e) {
      lastErr = e;
      // next mirror
    }
  }
  throw lastErr || new Error("All model URL downloads failed");
}

/**
 * Create a compiled ORT session using cached model bytes.
 * Ensures runtime is initialized and returns { session, backend, fromCache }.
 */
export async function getModelSession({ name, version, urls, preferredBackend = "webgpu", onProgress, sessionOptions } = {}) {
  const { ok, backend } = await initRuntime({ preferWebGPU: preferredBackend === "webgpu" });
  if (!ok && backend === "unavailable") {
    throw new Error("AI runtime unavailable");
  }
  const { buffer, fromCache } = await getModelBuffer({ name, version, urls, onProgress });
  const session = await createSession(buffer, sessionOptions || {});
  return { session, backend, fromCache };
}

/**
 * Utility to clear a specific cached model (for upgrades).
 */
export async function clearModel({ name, version }) {
  const key = `${name}@${version}`;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Utility to check if a model is cached.
 */
export async function isModelCached({ name, version }) {
  const key = `${name}@${version}`;
  const buf = await idbGet(key);
  return !!buf;
}
