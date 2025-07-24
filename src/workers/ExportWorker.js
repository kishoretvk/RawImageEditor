// ExportWorker.js
// Worker for parallel JPEG export
self.onmessage = async function(e) {
  // e.data: { imageBuffer: Uint8Array, quality: number, wasmModule: any }
  const { imageBuffer, quality = 85, wasmModule } = e.data;
  // TODO: Integrate mozJPEG WASM
  let result = null;
  if (wasmModule && wasmModule.encodeJPEG) {
    try {
      result = await wasmModule.encodeJPEG(imageBuffer, quality);
    } catch (err) {
      self.postMessage({ error: err.message });
      return;
    }
  }
  self.postMessage({ result });
};
