/**
 * ExportDialog.jsx
 * Extended export UI:
 * - Existing: format, quality, filename
 * - New: Split Channels (R/G/B) via onRequestSplitChannels(useAdjusted)
 * - New: Target Size (MB) export (UI only; actual toJPEGTargetSize wiring added after util impl)
 */
import React, { useState } from 'react';
import { toJPEGTargetSize } from '../utils/imageProcessing';

export default function ExportDialog({
  onExport,
  // New props (optional, safe to omit)
  onRequestSplitChannels,   // (useAdjusted:boolean) => void
  onExportTargetSize,       // (targetMB:number, options:{ tolerance:number, allowDownscale:boolean }) => void
  // Optional: direct processed canvas supplier to run target-size export here
  getProcessedCanvas        // () => HTMLCanvasElement | Promise<HTMLCanvasElement>
}) {
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(85);
  const [filename, setFilename] = useState('exported-image');

  // New state for features
  const [useAdjusted, setUseAdjusted] = useState(true);
  const [targetMB, setTargetMB] = useState('');
  const [tolerancePct, setTolerancePct] = useState(5);
  const [allowDownscale, setAllowDownscale] = useState(false);

  const handleExport = () => {
    if (onExport) onExport({ format, quality, filename });
  };

  const handleSplitChannels = () => {
    if (typeof onRequestSplitChannels === 'function') {
      onRequestSplitChannels(!!useAdjusted);
    }
  };

  const handleTargetSizeExport = async () => {
    const mb = parseFloat(targetMB);
    const tolPct = Math.max(0, Math.min(100, Number.isFinite(+tolerancePct) ? +tolerancePct : 5));
    if (!Number.isFinite(mb) || mb <= 0) return;

    // Prefer external handler if provided
    if (typeof onExportTargetSize === 'function') {
      onExportTargetSize(mb, { tolerance: tolPct / 100, allowDownscale: !!allowDownscale });
      return;
    }

    // Fallback: if we have a canvas provider, do the export here
    if (typeof getProcessedCanvas === 'function') {
      try {
        const canvas = await getProcessedCanvas();
        if (!canvas) return;
        const { blob, quality, finalBytes, width, height } = await toJPEGTargetSize(canvas, mb, {
          tolerance: tolPct / 100,
          allowDownscale: !!allowDownscale
        });
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export-target-${mb}MB-q${Math.round(quality * 100)}-${width}x${height}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 0);
        }
      } catch (e) {
        console.warn('Target size export failed:', e);
      }
    }
  };

  const targetMode = Number.isFinite(parseFloat(targetMB)) && parseFloat(targetMB) > 0;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold">Export Image</label>

      <div className="flex gap-2 items-center">
        <span className="text-xs">Format</span>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="tiff">TIFF</option>
        </select>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-xs">Quality</span>
        <input
          type="range"
          min="10"
          max="100"
          value={quality}
          onChange={e => setQuality(Number(e.target.value))}
          disabled={targetMode} // disabled when target size is used
        />
        <span className="text-xs">{quality}%</span>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-xs">Filename</span>
        <input type="text" value={filename} onChange={e => setFilename(e.target.value)} />
      </div>

      <button className="bg-success text-white px-2 py-1 rounded" onClick={handleExport}>
        Export
      </button>

      {/* Split Channels */}
      <div className="mt-3 p-2 rounded border border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Split Channels (R/G/B)</span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] flex items-center gap-1">
              <input
                type="checkbox"
                checked={useAdjusted}
                onChange={e => setUseAdjusted(e.target.checked)}
              />
              Use current adjustments
            </label>
            <button
              className="px-2 py-1 rounded bg-blue-600/80 text-white text-xs"
              onClick={handleSplitChannels}
              title="Export R/G/B mono images"
            >
              Split
            </button>
          </div>
        </div>
      </div>

      {/* Target Size Export */}
      <div className="p-2 rounded border border-white/10 bg-white/5">
        <div className="text-xs font-semibold mb-2">Target Size (MB) Export</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs w-24">Target Size</span>
          <input
            className="flex-1"
            type="number"
            min="0"
            step="0.1"
            value={targetMB}
            onChange={e => setTargetMB(e.target.value)}
            placeholder="e.g. 2.0"
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs w-24">Tolerance (%)</span>
          <input
            className="w-20"
            type="number"
            min="0"
            max="50"
            value={tolerancePct}
            onChange={e => setTolerancePct(Number(e.target.value))}
          />
        </div>
        <label className="text-[11px] flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={allowDownscale}
            onChange={e => setAllowDownscale(e.target.checked)}
          />
          Allow auto downscale if needed
        </label>
        <button
          className="px-2 py-1 rounded bg-emerald-600/80 text-white text-xs"
          onClick={handleTargetSizeExport}
          title="Encode JPEG to meet target size"
        >
          Export at Target Size
        </button>
      </div>
    </div>
  );
}
