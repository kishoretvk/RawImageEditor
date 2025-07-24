// ParallelExporter.js
// Splits export batch across workers
export async function exportBatch(images, quality = 85, wasmModule) {
  // images: array of image buffers
  // Returns array of results
  const workerCount = Math.min(navigator.hardwareConcurrency || 4, images.length);
  const workers = [];
  const results = [];
  for (let i = 0; i < workerCount; i++) {
    workers[i] = new Worker('src/workers/ExportWorker.js');
  }
  const promises = images.map((img, idx) => {
    return new Promise((resolve, reject) => {
      const worker = workers[idx % workerCount];
      worker.onmessage = (e) => {
        if (e.data.error) reject(e.data.error);
        else resolve(e.data.result);
      };
      worker.postMessage({ imageBuffer: img, quality, wasmModule });
    });
  });
  const exported = await Promise.all(promises);
  workers.forEach(w => w.terminate());
  return exported;
}
