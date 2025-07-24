// DecoderWorker.js
// Worker for RAW decoding
self.onmessage = async function(e) {
  // e.data: { buffer: ArrayBuffer, wasmModule: any }
  const { buffer, wasmModule } = e.data;
  // TODO: Integrate LibRaw WASM
  // Example stub: decode RAW buffer using wasmModule
  let decoded = null;
  let exif = null;
  if (wasmModule && wasmModule.decodeRAW) {
    try {
      decoded = await wasmModule.decodeRAW(buffer);
      exif = decoded.exif || null;
    } catch (err) {
      self.postMessage({ error: err.message });
      return;
    }
  }
  self.postMessage({ decoded, exif });
};
