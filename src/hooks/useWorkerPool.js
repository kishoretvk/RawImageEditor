// Worker pool manager (stub)
import { useRef } from 'react';

export function useWorkerPool(workerScript, poolSize = 3) {
  const pool = useRef([]);

  function getWorker() {
    // Find idle worker
    const idleWorker = pool.current.find(w => w.idle);
    if (idleWorker) return idleWorker;
    // Create new worker if pool not full
    if (pool.current.length < poolSize) {
      const worker = new Worker(workerScript);
      worker.idle = false;
      worker.onerror = (e) => {
        worker.idle = true;
        console.error('Worker error:', e);
      };
      pool.current.push(worker);
      return worker;
    }
    // Otherwise, wait for idle
    return null;
  }

  function setIdle(worker, idle = true) {
    worker.idle = idle;
  }

  function terminateAll() {
    pool.current.forEach(w => w.terminate());
    pool.current = [];
  }

  return { getWorker, setIdle, terminateAll };
}
