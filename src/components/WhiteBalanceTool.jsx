/**
 * WhiteBalanceTool.jsx
 * UI for white balance controls:
 * - Temperature/Tint sliders (legacy)
 * - WB Region Select mode: click-drag a rectangle on the canvas to compute avg RGB and derive per-channel gains.
 * 
 * Props:
 * - onChange: (payload) => void   // receives updates for temp/tint or wbGains
 * - enableWbSelect: (enabled: boolean) => void  // callback to toggle canvas WB selection overlay
 * - lastWbInfo: optional info object for display { avgR, avgG, avgB, rGain, gGain, bGain }
 */
import React, { useState } from 'react';

export default function WhiteBalanceTool({ onChange, enableWbSelect, lastWbInfo = null }) {
  const [temp, setTemp] = useState(5500);
  const [tint, setTint] = useState(0);
  const [selectMode, setSelectMode] = useState(false);

  const handleTemp = (e) => {
    const v = Number(e.target.value);
    setTemp(v);
    onChange?.({ temp: v, tint });
  };
  const handleTint = (e) => {
    const v = Number(e.target.value);
    setTint(v);
    onChange?.({ temp, tint: v });
  };

  const toggleWbSelect = () => {
    const next = !selectMode;
    setSelectMode(next);
    enableWbSelect?.(next);
  };

  const handleResetWbGains = () => {
    // Inform parent to clear wbGains (set to null)
    onChange?.({ wbGains: null });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold">White Balance</label>

      {/* Temp/Tint controls */}
      <div className="flex gap-2 items-center">
        <span className="text-xs w-10">Temp</span>
        <input type="range" min="2000" max="9000" value={temp} onChange={handleTemp} className="flex-1" />
        <span className="text-xs w-14 text-right">{temp}K</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs w-10">Tint</span>
        <input type="range" min="-100" max="100" value={tint} onChange={handleTint} className="flex-1" />
        <span className="text-xs w-14 text-right">{tint}</span>
      </div>

      {/* WB Region Selection */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleWbSelect}
          className={`px-3 py-1 rounded text-xs font-semibold border ${selectMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-white/5 text-white/80 border-white/20'}`}
          title="Click, then drag a rectangle on the image to compute WB gains from a neutral region"
        >
          {selectMode ? 'WB Region Select: ON' : 'WB Region Select'}
        </button>
        <button
          type="button"
          onClick={handleResetWbGains}
          className="px-3 py-1 rounded text-xs font-semibold bg-white/5 text-white/70 border border-white/20"
          title="Clear WB per-channel gains"
        >
          Reset WB
        </button>
      </div>

      {/* Show last computed averages and gains if available */}
      {lastWbInfo && (
        <div className="text-[11px] text-white/70 bg-white/5 border border-white/10 rounded p-2 mt-1">
          <div>Avg RGB: {lastWbInfo.avgR?.toFixed(1)} / {lastWbInfo.avgG?.toFixed(1)} / {lastWbInfo.avgB?.toFixed(1)}</div>
          <div>Gains: R {lastWbInfo.rGain?.toFixed(3)}, G {lastWbInfo.gGain?.toFixed(3)}, B {lastWbInfo.bGain?.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
}
