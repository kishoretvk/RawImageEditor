/**
 * Person segmentation utilities.
 * Constraints: model size ≤ 25 MB (≤ 50 MB cached). Use quantized ONNX.
 *
 * Expected model I/O (can be adjusted once model is finalized):
 *  - Input: 'input'  (1 x 3 x H x W) float32 normalized to [0,1] or mean/std
 *  - Output: 'output' (1 x 1 x H x W) float32 sigmoid probabilities for foreground
 *
 * If your model uses different names/shapes or normalization, update MODEL_SPEC below.
 */
import { getModelSession } from "./modelCache";
import { initRuntime, getBackendInfo } from "./runtime";

const MODEL_SPEC = {
  name: "person-seg",
  version: "v1",
  // You can add mirrors here (CDN URLs) – first successful URL is cached to IDB
  urls: [`${import.meta.env.BASE_URL || "/"}models/person-seg-v1.onnx`],
  inputName: "input",
  outputName: "output",
  // Normalization: if the model expects mean/std, set these arrays; otherwise null
  normalize: {
    mean: null, // e.g., [0.485, 0.456, 0.406]
    std: null,  // e.g., [0.229, 0.224, 0.225]
    scale: 1.0, // if input expects [0,1], keep scale=1.0; if [0,255], set scale=1/255
  },
};

let _sessionPromise = null;

export async function ensurePersonSegSession(onProgress) {
  if (_sessionPromise) return _sessionPromise;
  // Initialize runtime first
  await initRuntime({ preferWebGPU: true });
  _sessionPromise = getModelSession({
    name: MODEL_SPEC.name,
    version: MODEL_SPEC.version,
    urls: MODEL_SPEC.urls,
    preferredBackend: "webgpu",
    onProgress,
    sessionOptions: { graphOptimizationLevel: "all" },
  });
  return _sessionPromise;
}

/**
 * Resize an ImageBitmap to targetSize x targetSize and return ImageData.
 */
async function toSquareImageData(imageBitmap, targetSize) {
  const size = targetSize | 0;
  const off = new OffscreenCanvas(size, size);
  const ctx = off.getContext("2d", { willReadFrequently: true });
  // Fit center-crop to square
  const iw = imageBitmap.width;
  const ih = imageBitmap.height;
  const s = Math.min(iw, ih);
  const sx = ((iw - s) / 2) | 0;
  const sy = ((ih - s) / 2) | 0;
  ctx.drawImage(imageBitmap, sx, sy, s, s, 0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  return img;
}

/**
 * Convert ImageData RGBA to NCHW Float32Array suitable for ORT.
 */
function imageDataToNCHWFloat(img, { mean, std, scale }) {
  const { width: W, height: H, data } = img;
  const C = 3;
  const out = new Float32Array(1 * C * H * W);
  const haveMeanStd = Array.isArray(mean) && Array.isArray(std) && mean.length === 3 && std.length === 3;
  const s = scale || 1.0;

  // NCHW indexing: [c][y][x] => c*H*W + y*W + x
  let idxR = 0 * H * W;
  let idxG = 1 * H * W;
  let idxB = 2 * H * W;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let r = data[i] * s;
      let g = data[i + 1] * s;
      let b = data[i + 2] * s;

      if (haveMeanStd) {
        r = (r - mean[0]) / std[0];
        g = (g - mean[1]) / std[1];
        b = (b - mean[2]) / std[2];
      }

      out[idxR++] = r;
      out[idxG++] = g;
      out[idxB++] = b;
    }
  }
  return out;
}

/**
 * Run person segmentation: returns { mask: Float32Array, w, h, timeMs }
 * mask is a flat Float32Array of size w*h with values 0..1.
 */
export async function runPersonSeg(imageBitmap, { targetSize = 384 } = {}) {
  const t0 = performance.now();

  // Ensure session ready (download+cache if needed)
  const { session } = await ensurePersonSegSession();

  // Prepare input tensor
  const img = await toSquareImageData(imageBitmap, targetSize);
  const inputData = imageDataToNCHWFloat(img, MODEL_SPEC.normalize || { scale: 1 / 255 });
  const tensor = new (await import("onnxruntime-web")).Tensor("float32", inputData, [1, 3, img.height, img.width]);

  // Run inference
  const feeds = {};
  feeds[MODEL_SPEC.inputName] = tensor;
  const outputs = await session.run(feeds);
  const out = outputs[MODEL_SPEC.outputName];

  // Post-process
  let mask;
  if (out && out.data) {
    // Expect [1,1,H,W]
    const arr = out.data;
    const size = img.width * img.height;
    mask = new Float32Array(size);
    // If model already outputs probabilities, just clamp 0..1
    for (let i = 0; i < size; i++) {
      const v = arr[i];
      mask[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  } else {
    mask = new Float32Array(img.width * img.height);
  }

  const t1 = performance.now();
  return { mask, w: img.width, h: img.height, timeMs: Math.round(t1 - t0) };
}

/**
 * Utility to convert returned mask buffer back into Float32Array.
 * Used on UI thread after worker returns transferable buffer.
 */
export function toFloat32(buffer) {
  return new Float32Array(buffer);
}

/**
 * Hint UI with current backend label.
 */
export function getRuntimeLabel() {
  const { backend } = getBackendInfo();
  return backend || "wasm";
}
