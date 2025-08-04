import React, { useEffect, useRef, useState } from 'react';
import CropBoxOverlay from './CropBoxOverlay';

/**
 * RegionPicker
 * Lightweight preview + draggable rectangle to emit normalized rect {x,y,w,h}
 * Props:
 *  - imageUrl: string (preview image)
 *  - value: { x, y, w, h } normalized [0..1]
 *  - onChange: (rect) => void
 *  - width?: number (px)
 *  - height?: number (px)
 */
export default function RegionPicker({ imageUrl, value, onChange, width = 280, height = 180 }) {
  const containerRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState(() => normalizeRect(value) || { x: 0.4, y: 0.4, w: 0.2, h: 0.2 });

  useEffect(() => {
    setBox(normalizeRect(value) || { x: 0.4, y: 0.4, w: 0.2, h: 0.2 });
  }, [value?.x, value?.y, value?.w, value?.h]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => setImgSize({ w: img.width, h: img.height });
    img.onerror = () => setImgSize({ w: 0, h: 0 });
    img.src = imageUrl;
  }, [imageUrl]);

  const handleBoxChange = (pxBox) => {
    // pxBox: { left, top, width, height } in container pixels
    const rect = toNormalized(pxBox, containerRef.current);
    setBox(rect);
    if (onChange) onChange(rect);
  };

  const initialPxBox = toPixels(box, width, height);

  return (
    <div className="region-picker" style={{ width, height, position: 'relative' }}>
      <div ref={containerRef} className="region-canvas" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#111' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'contrast(1.05) brightness(0.98)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#777' }}>
            No preview
          </div>
        )}
        <CropBoxOverlay
          initialBox={initialPxBox}
          containerRef={containerRef}
          onChange={handleBoxChange}
          minBoxSize={12}
        />
      </div>
      <div className="region-info" style={{ marginTop: 8, fontSize: 12, color: '#bbb' }}>
        x: {box.x.toFixed(2)}, y: {box.y.toFixed(2)} • w: {box.w.toFixed(2)}, h: {box.h.toFixed(2)}
      </div>
    </div>
  );
}

function normalizeRect(r) {
  if (!r) return null;
  const x = clamp01(r.x);
  const y = clamp01(r.y);
  const w = clamp01(r.w);
  const h = clamp01(r.h);
  // ensure non-zero area
  const ww = Math.max(0.01, w);
  const hh = Math.max(0.01, h);
  return { x, y, w: ww, h: hh };
}

function toPixels(norm, W, H) {
  const x = clamp01(norm?.x) * W;
  const y = clamp01(norm?.y) * H;
  const w = clamp01(norm?.w) * W;
  const h = clamp01(norm?.h) * H;
  return { left: x, top: y, width: Math.max(8, w), height: Math.max(8, h) };
}

function toNormalized(pxBox, containerEl) {
  if (!containerEl) return { x: 0.4, y: 0.4, w: 0.2, h: 0.2 };
  const rect = containerEl.getBoundingClientRect();
  const W = rect.width || 1;
  const H = rect.height || 1;
  const x = clamp01(pxBox.left / W);
  const y = clamp01(pxBox.top / H);
  const w = clamp01(pxBox.width / W);
  const h = clamp01(pxBox.height / H);
  return { x, y, w: Math.max(0.01, w), h: Math.max(0.01, h) };
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
