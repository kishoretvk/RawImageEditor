// Utility to process files in parallel using Web Workers
export function processWithWorkers(files, preset, concurrency = 3) {
  return new Promise((resolve) => {
    let results = [];
    let idx = 0;
    let active = 0;
    const workers = [];

    function startWorker(file) {
      const worker = new Worker(new URL('../workers/rawWorker.js', import.meta.url));
      workers.push(worker);
      worker.onmessage = (e) => {
        results.push({ ...file, ...e.data });
        active--;
        worker.terminate();
        next();
      };
      worker.postMessage({ file, preset });
    }

    function next() {
      if (idx >= files.length && active === 0) {
        resolve(results);
        return;
      }
      while (active < concurrency && idx < files.length) {
        active++;
        startWorker(files[idx++]);
      }
    }
    next();
  });
}
