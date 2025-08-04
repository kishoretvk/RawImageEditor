/**
 * Minimal IndexedDB wrapper for job persistence.
 * DB: rie-jobs-v1
 * Stores:
 *  - jobs: keyPath 'id'
 *      { id, name, createdAt, status, spec, itemsMeta, outputsSummary?, error? }
 *  - jobProgress: keyPath 'key' (jobId-itemIndex-nodeId)
 *      { key, jobId, itemIndex, nodeId, status, progress, message, ts }
 */

const DB_NAME = 'rie-jobs-v1';
const DB_VERSION = 1;
const STORE_JOBS = 'jobs';
const STORE_PROGRESS = 'jobProgress';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_JOBS)) {
        db.createObjectStore(STORE_JOBS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore(storeName, mode, fn) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;
      const p = Promise.resolve(fn(store)).then((r) => (result = r));
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  });
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const JobStore = {
  async createJob({ name, spec, itemsMeta }) {
    const job = {
      id: uid(),
      name: name || 'Batch Job',
      createdAt: Date.now(),
      status: 'running', // 'running' | 'completed' | 'error'
      spec,
      itemsMeta: Array.isArray(itemsMeta) ? itemsMeta : [],
    };
    await withStore(STORE_JOBS, 'readwrite', (s) => s.add(job));
    return job.id;
  },

  async pushProgress(jobId, { itemIndex = 0, nodeId = '', status = 'info', progress = 0, message = '' }) {
    const key = `${jobId}-${itemIndex}-${nodeId}-${Date.now()}`;
    const rec = { key, jobId, itemIndex, nodeId, status, progress, message, ts: Date.now() };
    await withStore(STORE_PROGRESS, 'readwrite', (s) => s.add(rec));
    // Also keep latest status in job for quick glance (optional, lightweight update)
    try {
      const job = await JobStore.getJob(jobId);
      if (job) {
        job.lastStatus = { nodeId, status, progress, message, ts: rec.ts };
        await withStore(STORE_JOBS, 'readwrite', (s) => s.put(job));
      }
    } catch {}
  },

  async completeJob(jobId, outputsSummary) {
    const job = await JobStore.getJob(jobId);
    if (!job) return;
    job.status = 'completed';
    if (outputsSummary !== undefined) job.outputsSummary = outputsSummary;
    job.completedAt = Date.now();
    await withStore(STORE_JOBS, 'readwrite', (s) => s.put(job));
  },

  async failJob(jobId, error) {
    const job = await JobStore.getJob(jobId);
    if (!job) return;
    job.status = 'error';
    job.error = error ? String(error) : 'Unknown error';
    job.completedAt = Date.now();
    await withStore(STORE_JOBS, 'readwrite', (s) => s.put(job));
  },

  async listJobs(limit = 100) {
    const rows = await withStore(STORE_JOBS, 'readonly', (s) => {
      return new Promise((resolve) => {
        const out = [];
        const req = s.openCursor(null, 'prev'); // newest first if supported
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor && out.length < limit) {
            out.push(cursor.value);
            cursor.continue();
          } else {
            resolve(out);
          }
        };
        req.onerror = () => resolve(out);
      });
    });
    return rows;
  },

  async getJob(jobId) {
    if (!jobId) return null;
    return withStore(STORE_JOBS, 'readonly', (s) => s.get(jobId));
  },

  async getJobProgress(jobId, limit = 1000) {
    if (!jobId) return [];
    return withStore(STORE_PROGRESS, 'readonly', (s) => {
      return new Promise((resolve) => {
        const out = [];
        const req = s.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return resolve(out);
          const val = cursor.value;
          if (val.jobId === jobId) {
            out.push(val);
            if (out.length >= limit) return resolve(out);
          }
          cursor.continue();
        };
        req.onerror = () => resolve(out);
      });
    });
  },

  async getLastIncompleteJob() {
    const jobs = await JobStore.listJobs(200);
    return jobs.find((j) => j.status === 'running') || null;
  },

  // Optional: prune old jobs to keep storage small
  async prune(maxJobs = 100) {
    const jobs = await JobStore.listJobs(1000);
    if (jobs.length <= maxJobs) return;
    const toDelete = jobs.slice(maxJobs);
    await withStore(STORE_JOBS, 'readwrite', async (s) => {
      for (const j of toDelete) s.delete(j.id);
    });
  },
};
