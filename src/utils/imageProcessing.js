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

/**
 * Scale a canvas to new dimensions with high quality.
 * Returns a new canvas with the requested size.
 */
export function scaleCanvas(sourceCanvas, newW, newH) {
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(newW));
  out.height = Math.max(1, Math.round(newH));
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, out.width, out.height);
  return out;
}

/**
 * Export canvas to JPEG targeting a file size (in megabytes).
 * Performs a binary search on quality, optionally downscales if allowDownscale is true.
 * Returns { blob, quality, finalBytes, width, height } on success.
 */
export async function toJPEGTargetSize(canvas, targetMB, opts = {}) {
  const {
    tolerance = 0.05, // ±5%
    minQ = 0.2,
    maxQ = 0.95,
    maxIter = 8,
    allowDownscale = false,
    downscaleStep = 0.9,
    minWidth = 512,
    minHeight = 512
  } = opts;

  const targetBytes = Math.max(1, Math.round(targetMB * 1024 * 1024));
  const withinTolerance = (bytes) => Math.abs(bytes - targetBytes) / targetBytes <= tolerance;

  let curCanvas = canvas;
  let attempt = 0;

  while (true) {
    // Binary search quality
    let lo = minQ, hi = maxQ;
    let best = null;

    for (let i = 0; i < maxIter; i++) {
      const q = (lo + hi) / 2;
      const blob = await canvasToJpeg(curCanvas, q);
      const bytes = blob.size;

      best = (!best || Math.abs(bytes - targetBytes) < Math.abs(best.bytes - targetBytes)) ? { blob, q, bytes } : best;

      if (withinTolerance(bytes)) {
        return { blob, quality: q, finalBytes: bytes, width: curCanvas.width, height: curCanvas.height };
      }

      if (bytes > targetBytes) {
        // too big -> lower quality
        hi = q;
      } else {
        // too small -> higher quality
        lo = q;
      }
    }

    // If not within tolerance and allowed to downscale, try reducing dimensions and repeat
    if (allowDownscale) {
      const nextW = Math.round(curCanvas.width * downscaleStep);
      const nextH = Math.round(curCanvas.height * downscaleStep);
      if (nextW < minWidth || nextH < minHeight) {
        // cannot downscale further, return best effort
        return { blob: best.blob, quality: best.q, finalBytes: best.bytes, width: curCanvas.width, height: curCanvas.height };
      }
      curCanvas = scaleCanvas(curCanvas, nextW, nextH);
      attempt++;
      // continue to next loop to binary search again
    } else {
      // No downscale allowed; return best effort
      return { blob: best.blob, quality: best.q, finalBytes: best.bytes, width: curCanvas.width, height: curCanvas.height };
    }
  }
}

function canvasToJpeg(canvas, quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}
