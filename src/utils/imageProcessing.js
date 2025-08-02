export function convertRawToJpeg(options) {
  const { file, name } = typeof options === 'object' ? options : { file: options, name: undefined };
  console.debug('[RAW] convertRawToJpeg called', { hasFile: !!file, name });

  return new Promise((resolve, reject) => {
    let worker;
    let finished = false;

    const cleanup = () => {
      if (!finished && worker) {
        try { worker.terminate(); } catch {}
      }
      finished = true;
    };

    try {
      worker = new Worker(
        new URL('../workers/imageProcessing.worker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = async (event) => {
        try {
          const data = event?.data || {};
          if (data.error) {
            console.error('[RAW Worker] returned error', data.error);
            cleanup();
            reject(data.error);
            return;
          }

          // Expect either preview (data URL or blob URL) or raw bytes we must convert
          if (data.preview) {
            cleanup();
            resolve({ preview: data.preview });
            return;
          }

          if (data.jpegBytes) {
            // Convert to blob URL
            const blob = new Blob([data.jpegBytes], { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            cleanup();
            resolve({ preview: url });
            return;
          }

          console.warn('[RAW Worker] no preview/jpegBytes in response');
          cleanup();
          resolve(null);
        } catch (e) {
          console.error('[RAW Worker] onmessage handler failed', e);
          cleanup();
          reject(e);
        }
      };

      worker.onmessageerror = (e) => {
        console.error('[RAW Worker] messageerror', e);
        cleanup();
        reject('RAW worker message error');
      };

      worker.onerror = (e) => {
        console.error('[RAW Worker] error', e);
        cleanup();
        reject(e?.message || 'RAW worker error');
      };

      // Post the file to worker. Prefer transferring ArrayBuffer to avoid structured clone overhead.
      if (file && typeof file.arrayBuffer === 'function') {
        file.arrayBuffer().then((buffer) => {
          try {
            worker.postMessage({ name, buffer }, [buffer]);
          } catch (postErr) {
            console.error('[RAW Worker] postMessage failed', postErr);
            cleanup();
            reject(postErr);
          }
        }).catch((readErr) => {
          console.error('[RAW] failed to read file to ArrayBuffer', readErr);
          cleanup();
          reject(readErr);
        });
      } else {
        // Fallback: try structured clone of File directly (may be heavier)
        try {
          worker.postMessage({ name, file });
        } catch (postErr) {
          console.error('[RAW Worker] postMessage (file) failed', postErr);
          cleanup();
          reject(postErr);
        }
      }
    } catch (err) {
      console.error('[RAW] worker creation failed', err);
      cleanup();
      reject(err);
    }
  });
}
