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
import React, { useState, useEffect } from 'react';
import { Droplet, RotateCcw } from 'lucide-react';

export default function WhiteBalanceTool({
  whiteBalance,
  onStartWBSelect,
  onChangeSamplingSpace,
  onResetWB,
  onTemperatureTintChange
}) {
  const [temp, setTemp] = useState(whiteBalance?.temperature ?? 0);
  const [tint, setTint] = useState(whiteBalance?.tint ?? 0);

  useEffect(() => {
    setTemp(whiteBalance?.temperature ?? 0);
    setTint(whiteBalance?.tint ?? 0);
  }, [whiteBalance?.temperature, whiteBalance?.tint]);

  useEffect(() => {
    if (onTemperatureTintChange) {
      onTemperatureTintChange({ temperature: temp, tint });
    }
  }, [temp, tint]);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold">White Balance</label>

      {/* Derived Temp/Tint (read-only preview from computed WB) */}
      <div className="flex gap-2 items-center">
        <span className="text-xs w-20">Temperature</span>
        <input type="range" min="-100" max="100" value={temp} onChange={(e) => setTemp(parseInt(e.target.value, 10))} className="flex-1" />
        <span className="text-xs w-14 text-right">{Number.isFinite(temp) ? temp.toFixed(0) : 0}</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs w-20">Tint</span>
        <input type="range" min="-100" max="100" value={tint} onChange={(e) => setTint(parseInt(e.target.value, 10))} className="flex-1" />
        <span className="text-xs w-14 text-right">{Number.isFinite(tint) ? tint.toFixed(0) : 0}</span>
      </div>

      {/* WB Region Selection */}
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onStartWBSelect}
          className="p-2 rounded text-xs font-semibold border bg-white/5 text-white/80 border-white/20 hover:bg-white/10"
          title="Select a neutral color region on the image to automatically set the white balance."
        >
          <Droplet size={16} />
        </button>

        <button
          type="button"
          onClick={onResetWB}
          className="p-2 rounded text-xs font-semibold bg-white/5 text-white/70 border border-white/20 hover:bg-white/10"
          title="Reset white balance adjustments"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Sampling Space */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs">Sampling:</span>
        <label className="text-xs flex items-center gap-1">
          <input
            type="radio"
            name="wb-sampling-space"
            checked={(whiteBalance?.samplingSpace ?? 'original') === 'original'}
            onChange={() => onChangeSamplingSpace?.('original')}
          />
          Original
        </label>
        <label className="text-xs flex items-center gap-1">
          <input
            type="radio"
            name="wb-sampling-space"
            checked={(whiteBalance?.samplingSpace ?? 'original') === 'processed'}
            onChange={() => onChangeSamplingSpace?.('processed')}
          />
          Processed
        </label>
      </div>

      {/* Current Multipliers */}
      <div className="text-[11px] text-white/70 bg-white/5 border border-white/10 rounded p-2 mt-1">
        <div>Multipliers:</div>
        <div>R {whiteBalance?.multipliers?.r?.toFixed?.(3) ?? '1.000'}</div>
        <div>G {whiteBalance?.multipliers?.g?.toFixed?.(3) ?? '1.000'}</div>
        <div>B {whiteBalance?.multipliers?.b?.toFixed?.(3) ?? '1.000'}</div>
      </div>
    </div>
  );
}
