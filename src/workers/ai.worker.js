/* eslint-disable no-restricted-globals */
/**
 * AI Web Worker
 * - Initializes ONNX Runtime Web (via dynamic import in utils)
 * - Preloads and caches models in IndexedDB
 * - Runs segmentation and returns a low-res matte (Float32Array serialized)
 *
 * Messages in:
 *  { id, type: 'initRuntime', payload: { preferWebGPU?: boolean } }
 *  { id, type: 'preloadModels', payload: { list: [{ name, version, urls }] } }
 *  { id, type: 'personSeg', payload: { targetSize?: number, imageBitmapTransfer?: boolean } , transfer: [ImageBitmap] }
 *     If imageBitmapTransfer=true, the payload must include imageBitmap; otherwise, we will try to capture via OffscreenCanvas path in future work.
 *
 * Messages out:
 *  { id, ok: true, type, backend?, payload? } or { id, ok: false, error }
 */

importScripts("../utils/dev/extensionNoiseGuard.js"); // no-op guard if exists

let runtimeReady = false;
let backend = "wasm";
const sessions = new Map(); // key: `${name}@${version}` -> ORT session

// Lazy dynamic imports inside worker (Vite supports importScripts? We'll rely on ESM import.)
async function importUtils() {
  const [{ initRuntime, getBackendInfo }, { getModelSession }, seg] = await Promise.all([
    import("../utils/ai/runtime.js"),
    import("../utils/ai/modelCache.js"),
    import("../utils/ai/segmentation.js").catch(() => ({ ensurePersonSegSession: async () => { throw new Error("segmentation.js missing"); }, runPersonSeg: async () => { throw new Error("segmentation.js missing"); } })),
  ]);
  return { initRuntime, getBackendInfo, getModelSession, seg };
}

// Serialize Float32Array into a transferable ArrayBuffer to reduce copy time
function packFloat32(mask) {
  if (mask instanceof Float32Array) {
    return mask.buffer;
  }
  if (mask && mask.buffer) return mask.buffer;
  return new Float32Array(0).buffer;
}

async function handleInitRuntime(id, payload) {
  try {
    const { initRuntime, getBackendInfo } = await importUtils();
    const res = await initRuntime({ preferWebGPU: payload?.preferWebGPU !== false });
    runtimeReady = !!res.ok;
    backend = res.backend || getBackendInfo().backend || "wasm";
    postMessage({ id, ok: true, type: "initRuntime", backend });
  } catch (e) {
    postMessage({ id, ok: false, type: "initRuntime", error: String(e) });
  }
}

async function handlePreloadModels(id, payload) {
  try {
    const { getModelSession } = await importUtils();
    const list = Array.isArray(payload?.list) ? payload.list : [];
    const loaded = [];
    for (const m of list) {
      const key = `${m.name}@${m.version}`;
      if (!sessions.has(key)) {
        const { session, backend: be } = await getModelSession({
          name: m.name,
          version: m.version,
          urls: m.urls,
          preferredBackend: payload?.preferredBackend || "webgpu",
        });
        sessions.set(key, session);
        backend = be || backend;
        loaded.push(key);
      } else {
        loaded.push(key); // already present
      }
    }
    postMessage({ id, ok: true, type: "preloadModels", backend, payload: { loaded } });
  } catch (e) {
    postMessage({ id, ok: false, type: "preloadModels", error: String(e) });
  }
}

async function handlePersonSeg(id, payload) {
  const t0 = performance.now();
  try {
    const { seg } = await importUtils();
    const targetSize = Math.max(128, Math.min(1024, payload?.targetSize || 384));
    const imageBitmap = payload?.imageBitmap || null;

    if (!imageBitmap) {
      throw new Error("personSeg requires payload.imageBitmap (transferred ImageBitmap)");
    }

    // Ensure session ready inside segmentation helper (it uses modelCache + runtime)
    const result = await seg.runPersonSeg(imageBitmap, { targetSize });
    // result: { mask: Float32Array(wh), w, h, timeMs }
    const t1 = performance.now();
    const timeMs = Math.round(result?.timeMs ?? (t1 - t0));
    const buffer = packFloat32(result.mask);
    // Transfer the underlying buffer to avoid copying
    postMessage(
      { id, ok: true, type: "personSeg", backend, payload: { w: result.w, h: result.h, timeMs, maskBuffer: buffer } },
      [buffer]
    );
  } catch (e) {
    postMessage({ id, ok: false, type: "personSeg", error: String(e) });
  } finally {
    try {
      if (payload?.imageBitmap && typeof payload.imageBitmap.close === "function") {
        payload.imageBitmap.close();
      }
    } catch {}
  }
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  const { id, type, payload } = msg;
  if (!id || !type) return;

  switch (type) {
    case "initRuntime":
      return void handleInitRuntime(id, payload);
    case "preloadModels":
      return void handlePreloadModels(id, payload);
    case "personSeg":
      return void handlePersonSeg(id, payload);
    default:
      postMessage({ id, ok: false, error: `Unknown message type: ${type}` });
  }
};
