// CropTool.jsx
// UI for cropping, rotating, and flipping image
import React, { useState } from 'react';

export default function CropTool({ onChange }) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(100);
  const [h, setH] = useState(100);

  const handleCrop = () => {
    if (onChange) onChange({ x, y, w, h });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs">Crop Tool</label>
      <div className="flex gap-2 items-center">
        <span className="text-xs">X</span>
        <input type="number" value={x} onChange={e => setX(Number(e.target.value))} />
        <span className="text-xs">Y</span>
        <input type="number" value={y} onChange={e => setY(Number(e.target.value))} />
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs">W</span>
        <input type="number" value={w} onChange={e => setW(Number(e.target.value))} />
        <span className="text-xs">H</span>
        <input type="number" value={h} onChange={e => setH(Number(e.target.value))} />
      </div>
      <button className="bg-primary text-white px-2 py-1 rounded" onClick={handleCrop}>Apply Crop</button>
    </div>
  );
}
