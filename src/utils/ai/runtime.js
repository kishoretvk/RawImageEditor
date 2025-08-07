/**
 * AI Runtime bootstrap for on-device inference.
 * Prefers WebGPU, falls back to WebGL, then WASM.
 * Loads ONNX Runtime Web dynamically to avoid bloating initial bundle.
 */
let ort = null;
let backend = null;
let initialized = false;

export async function initRuntime({ preferWebGPU = true } = {}) {
  if (initialized) return { ok: true, backend };
  try {
    // Dynamic import to keep initial bundle lean
    const mod = await import("onnxruntime-web");
    ort = mod;

    // Detect capabilities
    const supportsWebGPU = typeof navigator !== "undefined" && !!navigator.gpu;
    const supportsWebGL = typeof document !== "undefined" && (document.createElement("canvas").getContext("webgl") || document.createElement("canvas").getContext("webgl2"));

    const candidates = [];
    if (preferWebGPU && supportsWebGPU) candidates.push("webgpu");
    if (supportsWebGL) candidates.push("webgl");
    candidates.push("wasm");

    // Try backends in order
    for (const candidate of candidates) {
      try {
        await ort.env.wasm.wasmPaths; // no-op, ensure env exists
      } catch {}
      // Configure preferred execution provider
      const ep = candidate;
      // For ORT Web GPU/WebGL/WASM selection is via session options EPs at session creation time.
      backend = ep;
      initialized = true;
      return { ok: true, backend };
    }

    backend = "wasm";
    initialized = true;
    return { ok: true, backend };
  } catch (e) {
    backend = "unavailable";
    initialized = false;
    return { ok: false, backend, error: String(e) };
  }
}

export function getBackendInfo() {
  return { backend, initialized };
}

export function getORT() {
  if (!initialized || !ort) throw new Error("ORT runtime not initialized");
  return ort;
}

/**
 * Create an ORT session for a given model buffer and options.
 * The caller should manage caching of the model bytes (e.g., IndexedDB).
 */
export async function createSession(modelBuffer, { graphOptimizationLevel = "all", intraOpNumThreads = 1 } = {}) {
  const ort = getORT();
  const options = {
    executionProviders: [backend || "wasm"],
    graphOptimizationLevel: graphOptimizationLevel === "all" ? "all" : "basic",
    intraOpNumThreads,
  };
  return await ort.InferenceSession.create(modelBuffer, options);
}
