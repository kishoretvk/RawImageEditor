/* eslint-disable no-restricted-globals */
// Worker: try embedded JPEG extraction first (instant preview), then fall back to a neutral placeholder.
// This guarantees a photo-like preview for many RAWs that contain embedded JPEGs.
// Main thread already upgrades display when LibRaw-wasm is added later.

function makePlaceholderDataUrl(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="#1f1f1f"/>
    <text x="400" y="300" fill="#777" font-family="sans-serif" font-size="20" text-anchor="middle">
      RAW preview${name ? ' - ' + name : ''}
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Very simple JPEG marker scan to find an embedded JPEG inside a RAW buffer.
// Not a full parser; best-effort extraction that works in many cases (ARW/CR2/NEF with embedded JPEG).
function extractEmbeddedJpeg(buffer) {
  if (!buffer || buffer.byteLength < 4) return null;
  const bytes = new Uint8Array(buffer);
  // JPEG Start of Image (SOI): 0xFF 0xD8
  // JPEG End of Image (EOI): 0xFF 0xD9
  let start = -1;
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  let end = -1;
  for (let j = bytes.length - 2; j > start; j--) {
    if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
      end = j + 2; // inclusive of EOI
      break;
    }
  }
  if (end === -1 || end <= start) return null;

  try {
    // Return the raw JPEG bytes so the main thread can create the blob URL
    const jpegBytes = bytes.slice(start, end);
    return jpegBytes.buffer.slice(jpegBytes.byteOffset, jpegBytes.byteOffset + jpegBytes.byteLength);
  } catch (e) {
    return null;
  }
}

self.onmessage = async (event) => {
  try {
    const { buffer, file, name } = event.data || {};

    // Prefer ArrayBuffer sent by main thread
    let buf = buffer;
    if (!buf && file && typeof file.arrayBuffer === 'function') {
      try {
        buf = await file.arrayBuffer();
      } catch {
        // ignore; we'll fall back to placeholder
      }
    }

    // 1) Try to extract embedded JPEG quickly
    let jpegBytes = null;
    if (buf) {
      jpegBytes = extractEmbeddedJpeg(buf);
    }

    if (jpegBytes) {
      // Post back transferable bytes so main thread creates a blob URL in its own context
      self.postMessage({ jpegBytes }, [jpegBytes]);
      return;
    }

    // 2) Fallback: neutral placeholder (ensures UI shows something)
    const placeholder = makePlaceholderDataUrl(name || (file && file.name));
    self.postMessage({ preview: placeholder });
  } catch (err) {
    self.postMessage({ error: err?.message || 'Worker failure' });
  }
};
