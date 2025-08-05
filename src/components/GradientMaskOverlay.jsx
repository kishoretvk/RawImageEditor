import React, { useRef, useEffect, useState } from 'react';

// Simple gradient mask overlay allowing user to position/rotate/feather a linear gradient.
// Emits mask definition up to parent; parent composes adjustments using this alpha.
export default function GradientMaskOverlay({
  width,
  height,
  mask = {
    id: 'grad-1',
    type: 'linear',
    start: { x: 0.25, y: 0.25 },
    end: { x: 0.75, y: 0.75 },
    feather: 0.2, // 0..0.5 relative feather
    invert: false,
    enabled: true
  },
  onChange
}) {
  const canvasRef = useRef(null);
  const [drag, setDrag] = useState(null); // { target: 'start'|'end', ox, oy }

  const norm = (v, min, max) => Math.max(min, Math.min(max, v));
  const toPx = (p, dim) => Math.round(p * dim);
  const toPct = (px, dim) => norm(px / dim, 0, 1);

  const commit = (next) => onChange && onChange({ ...mask, ...next });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // draw translucent overlay of the gradient axis
    const sx = toPx(mask.start.x, width);
    const sy = toPx(mask.start.y, height);
    const ex = toPx(mask.end.x, width);
    const ey = toPx(mask.end.y, height);

    // Axis line
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Handles
    const drawHandle = (x, y, color) => {
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    drawHandle(sx, sy, 'rgba(79,209,197,0.95)');
    drawHandle(ex, ey, 'rgba(124,58,237,0.95)');

    // Feather visualization: draw band edges
    const vx = ex - sx, vy = ey - sy;
    const len = Math.max(1, Math.hypot(vx, vy));
    const nx = -vy / len, ny = vx / len; // normal unit
    const f = mask.feather || 0;
    const half = (f * Math.min(width, height)) * 0.5;

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(sx + nx * half, sy + ny * half);
    ctx.lineTo(ex + nx * half, ey + ny * half);
    ctx.moveTo(sx - nx * half, sy - ny * half);
    ctx.lineTo(ex - nx * half, ey - ny * half);
    ctx.stroke();

  }, [width, height, mask]);

  const pickHandle = (mx, my) => {
    const sx = toPx(mask.start.x, width);
    const sy = toPx(mask.start.y, height);
    const ex = toPx(mask.end.x, width);
    const ey = toPx(mask.end.y, height);
    const dist = (x, y) => Math.hypot(mx - x, my - y);
    const ds = dist(sx, sy);
    const de = dist(ex, ey);
    if (ds < 10) return 'start';
    if (de < 10) return 'end';
    return null;
  };

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const target = pickHandle(mx, my);
    if (target) {
      setDrag({ target, ox: mx, oy: my });
      e.preventDefault();
    }
  };

  const onMouseMove = (e) => {
    if (!drag) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = mx - drag.ox;
    const dy = my - drag.oy;

    if (drag.target === 'start') {
      const sx = toPx(mask.start.x, width) + dx;
      const sy = toPx(mask.start.y, height) + dy;
      commit({ start: { x: toPct(sx, width), y: toPct(sy, height) } });
    } else if (drag.target === 'end') {
      const ex = toPx(mask.end.x, width) + dx;
      const ey = toPx(mask.end.y, height) + dy;
      commit({ end: { x: toPct(ex, width), y: toPct(ey, height) } });
    }
    setDrag((d) => d && { ...d, ox: mx, oy: my });
  };

  const onMouseUp = () => setDrag(null);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: drag ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#fff', opacity: 0.85 }}>
          Feather
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={mask.feather ?? 0.2}
            onChange={(e) => commit({ feather: norm(parseFloat(e.target.value) || 0, 0, 0.5) })}
            style={{ width: 120, marginLeft: 8 }}
          />
        </label>
        <label style={{ fontSize: 12, color: '#fff', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={!!mask.invert}
            onChange={(e) => commit({ invert: !!e.target.checked })}
          />
          Invert
        </label>
      </div>
    </div>
  );
}
