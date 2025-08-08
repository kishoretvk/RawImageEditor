/**
 * ExportDialog.jsx
 * Extended export UI:
 * - Existing: format, quality, filename
 * - New: Split Channels (R/G/B) via onRequestSplitChannels(useAdjusted)
 * - New: Target Size (MB) export (UI only; actual toJPEGTargetSize wiring added after util impl)
 */
import React, { useState } from 'react';
import { toJPEGTargetSize } from '../utils/imageProcessing';
import '../styles/tokens.css';
import Button from './ui/Button.jsx';
import Panel from './ui/Panel.jsx';

export default function ExportDialog({
  onExport,
  onRequestSplitChannels,   // (useAdjusted:boolean) => void
  onExportTargetSize,       // (targetMB:number, options:{ tolerance:number, allowDownscale:boolean }) => void
  getProcessedCanvas,       // () => HTMLCanvasElement | Promise<HTMLCanvasElement>
  hasAlphaBackgroundRemoved = false
}) {
  const [format, setFormat] = useState(hasAlphaBackgroundRemoved ? 'png' : 'jpeg');
  const [quality, setQuality] = useState(85);
  const [filename, setFilename] = useState('exported-image');

  // New state for features
  const [useAdjusted, setUseAdjusted] = useState(true);
  const [targetMB, setTargetMB] = useState('');
  const [tolerancePct, setTolerancePct] = useState(5);
  const [allowDownscale, setAllowDownscale] = useState(false);
  const [preserveTransparency, setPreserveTransparency] = useState(!!hasAlphaBackgroundRemoved);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = () => {
    if (onExport) onExport({ format, quality, filename, preserveTransparency });
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
          setExportResult({ success: true, finalBytes });
        } else {
          setExportResult({ success: false, error: 'Could not generate image.' });
        }
      } catch (e) {
        console.warn('Target size export failed:', e);
        setExportResult({ success: false, error: e.message });
      }
    }
  };

  const targetMode = Number.isFinite(parseFloat(targetMB)) && parseFloat(targetMB) > 0;

  return (
    <div className="flex flex-col gap-3">
      <Panel title="Export Image">
        <div className="flex gap-2 items-center">
          <span className="text-xs">Format</span>
          <select value={format} onChange={e => setFormat(e.target.value)}>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="tiff">TIFF</option>
          </select>
        </div>
        {hasAlphaBackgroundRemoved && (
          <label className="text-[11px] flex items-center gap-2">
            <input
              type="checkbox"
              checked={preserveTransparency}
              onChange={e => {
                setPreserveTransparency(e.target.checked);
                if (e.target.checked && format !== 'png') setFormat('png');
              }}
            />
            Preserve transparency (background removed)
          </label>
        )}

        <div className="flex gap-2 items-center">
          <span className="text-xs">Quality</span>
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            disabled={targetMode}
          />
          <span className="text-xs">{quality}%</span>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs">Filename</span>
          <input type="text" value={filename} onChange={e => setFilename(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="primary" size="sm" onClick={handleExport}>Export</Button>
          <Button variant="ghost" size="sm" onClick={() => {
            // noop close: hosting modal handles closing
            const ev = new CustomEvent('export-dialog-close');
            window.dispatchEvent(ev);
          }}>Close</Button>
        </div>
      </Panel>

      <Panel title="Split Channels (R/G/B)">
        <div className="flex items-center justify-between">
          <label className="text-[11px] flex items-center gap-1">
            <input
              type="checkbox"
              checked={useAdjusted}
              onChange={e => setUseAdjusted(e.target.checked)}
            />
            Use current adjustments
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSplitChannels}
            title="Export R/G/B mono images"
          >
            Split
          </Button>
        </div>
      </Panel>

      <Panel title="Target Size (MB) Export">
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
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTargetSizeExport}
            title="Encode JPEG to meet target size"
          >
            Export at Target Size
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTargetMB('');
              setTolerancePct(5);
              setAllowDownscale(false);
              setExportResult(null);
            }}
          >
            Reset
          </Button>
        </div>
        {exportResult && (
          <div className={`mt-2 text-xs ${exportResult.success ? 'text-green-500' : 'text-red-500'}`}>
            {exportResult.success
              ? `Export successful! Final size: ${(exportResult.finalBytes / 1024 / 1024).toFixed(2)} MB`
              : `Export failed: ${exportResult.error}`}
          </div>
        )}
      </Panel>
    </div>
  );
}
