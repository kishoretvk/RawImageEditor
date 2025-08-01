export function convertRawToJpeg(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/imageProcessing.worker.js', import.meta.url));

    worker.onmessage = (event) => {
      resolve(event.data);
      worker.terminate();
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({ file });
  });
}
