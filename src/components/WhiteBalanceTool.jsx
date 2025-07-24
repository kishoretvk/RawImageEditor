// WhiteBalanceTool.jsx
// UI for white balance (temp/tint)
import React, { useState } from 'react';

export default function WhiteBalanceTool({ onChange }) {
  const [temp, setTemp] = useState(5500);
  const [tint, setTint] = useState(0);

  const handleTemp = e => {
    setTemp(Number(e.target.value));
    if (onChange) onChange({ temp: Number(e.target.value), tint });
  };
  const handleTint = e => {
    setTint(Number(e.target.value));
    if (onChange) onChange({ temp, tint: Number(e.target.value) });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs">White Balance</label>
      <div className="flex gap-2 items-center">
        <span className="text-xs">Temp</span>
        <input type="range" min="2000" max="9000" value={temp} onChange={handleTemp} />
        <span className="text-xs">{temp}K</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs">Tint</span>
        <input type="range" min="-100" max="100" value={tint} onChange={handleTint} />
        <span className="text-xs">{tint}</span>
      </div>
    </div>
  );
}
