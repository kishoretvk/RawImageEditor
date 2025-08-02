import React, { useMemo } from 'react';
import CurveEditor from '../CurveEditor';

const DEFAULT_POINTS = [
  { x: 0, y: 0 },
  { x: 85, y: 85 },
  { x: 170, y: 170 },
  { x: 256, y: 256 },
];

// Ensure we always have a unified curves object with RGB + channels and a mode
const withDefaults = (curves) => {
  const identity = { points: DEFAULT_POINTS };
  const mode = curves?.mode || 'rgb';
  return {
    mode,
    rgb: curves?.rgb?.points?.length ? { points: curves.rgb.points } : identity,
    r:   curves?.r?.points?.length ? { points: curves.r.points } : identity,
    g:   curves?.g?.points?.length ? { points: curves.g.points } : identity,
    b:   curves?.b?.points?.length ? { points: curves.b.points } : identity,
  };
};

const CHANNEL_META = {
  rgb: { label: 'RGB', colorClass: 'curve-tab-rgb' },
  r: { label: 'R', colorClass: 'curve-tab-red' },
  g: { label: 'G', colorClass: 'curve-tab-green' },
  b: { label: 'B', colorClass: 'curve-tab-blue' },
};

const CurvesPanel = ({ curves, onChange }) => {
  const safe = useMemo(() => withDefaults(curves), [curves]);

  const setMode = (next) => {
    if (!onChange) return;
    onChange({ ...safe, mode: next });
  };

  // Convert normalized points [0..1] to editor-space [0..256] that CurveEditor expects.
  const toEditorPoint = (p) => {
    if (Array.isArray(p)) {
      const x = p[0] <= 1 ? p[0] * 256 : p[0];
      const y = p[1] <= 1 ? p[1] * 256 : p[1];
      return { x, y };
    }
    const x = (p?.x ?? 0) <= 1 ? (p?.x ?? 0) * 256 : (p?.x ?? 0);
    const y = (p?.y ?? 0) <= 1 ? (p?.y ?? 0) * 256 : (p?.y ?? 0);
    return { x, y };
  };
  const toNormalizedPoint = (p) => {
    if (Array.isArray(p)) return [ (p[0] ?? 0) / 256, (p[1] ?? 0) / 256 ];
    return [ (p?.x ?? 0) / 256, (p?.y ?? 0) / 256 ];
  };

  const getChannelPoints = () => {
    switch (safe.mode) {
      case 'r': return safe.r.points;
      case 'g': return safe.g.points;
      case 'b': return safe.b.points;
      case 'rgb':
      default: return safe.rgb.points;
    }
  };

  const activePoints = useMemo(() => {
    const pts = getChannelPoints();
    const source = (Array.isArray(pts) && pts.length > 0) ? pts : DEFAULT_POINTS;
    return source.map(toEditorPoint);
  }, [safe]);

  const handleCurveChange = (newPoints) => {
    if (!onChange) return;
    // Convert editor-space [0..256] points back to normalized [0..1]
    const normalized = Array.isArray(newPoints) ? newPoints.map(toNormalizedPoint) : DEFAULT_POINTS.map(toNormalizedPoint);
    const next = { ...safe };
    if (safe.mode === 'rgb') next.rgb = { points: normalized };
    if (safe.mode === 'r') next.r = { points: normalized };
    if (safe.mode === 'g') next.g = { points: normalized };
    if (safe.mode === 'b') next.b = { points: normalized };
    onChange(next);
  };

  const resetChannel = () => {
    if (!onChange) return;
    const next = { ...safe };
    if (safe.mode === 'rgb') next.rgb = { points: DEFAULT_POINTS };
    if (safe.mode === 'r') next.r = { points: DEFAULT_POINTS };
    if (safe.mode === 'g') next.g = { points: DEFAULT_POINTS };
    if (safe.mode === 'b') next.b = { points: DEFAULT_POINTS };
    onChange(next);
  };

  const resetAll = () => {
    if (!onChange) return;
    onChange({ mode: 'rgb', rgb: { points: DEFAULT_POINTS }, r: { points: DEFAULT_POINTS }, g: { points: DEFAULT_POINTS }, b: { points: DEFAULT_POINTS } });
  };

  return (
    <div className="curves-panel">
      <div className="curve-tabs">
        {(['rgb','r','g','b']).map((key) => (
          <button
            key={key}
            className={`curve-tab ${CHANNEL_META[key].colorClass} ${safe.mode === key ? 'active' : ''}`}
            onClick={() => setMode(key)}
            type="button"
            aria-pressed={safe.mode === key}
            title={`Edit ${CHANNEL_META[key].label} curve`}
          >
            {CHANNEL_META[key].label}
          </button>
        ))}
        <div className="curve-actions">
          <button className="curve-add" type="button" title="Add midpoint"
            onClick={() => {
              // Insert a midpoint between nearest neighbors around x=128
              const ptsNorm = getChannelPoints();
              const toEditorPoint = (p) => Array.isArray(p)
                ? { x: (p[0] <= 1 ? p[0]*256 : p[0]), y: (p[1] <= 1 ? p[1]*256 : p[1]) }
                : { x: ((p?.x ?? 0) <= 1 ? (p?.x ?? 0)*256 : (p?.x ?? 0)), y: ((p?.y ?? 0) <= 1 ? (p?.y ?? 0)*256 : (p?.y ?? 0)) };
              const toNormalizedPoint = (p) => [ (p.x ?? 0)/256, (p.y ?? 0)/256 ];

              const editorPts = (Array.isArray(ptsNorm) && ptsNorm.length ? ptsNorm : DEFAULT_POINTS).map(toEditorPoint)
                .map(p => ({ x: Math.max(0, Math.min(256, p.x)), y: Math.max(0, Math.min(256, p.y)) }))
                .sort((a,b) => a.x - b.x);

              const targetX = 128;
              let insertIdx = 0;
              for (let i = 0; i < editorPts.length-1; i++) {
                if (editorPts[i].x <= targetX && targetX <= editorPts[i+1].x) { insertIdx = i+1; break; }
              }
              const left = editorPts[Math.max(0, insertIdx-1)];
              const right = editorPts[Math.min(editorPts.length-1, insertIdx)];
              const mid = { x: Math.max(0, Math.min(256, (left.x + right.x)/2)), y: Math.max(0, Math.min(256, (left.y + right.y)/2)) };
              const deduped = [...editorPts.slice(0, insertIdx), mid, ...editorPts.slice(insertIdx)]
                .map((p, i, arr) => (i>0 && p.x <= arr[i-1].x) ? { x: Math.min(256, arr[i-1].x + 0.001), y: p.y } : p);

              const normalized = deduped.map(toNormalizedPoint);
              const next = { ...safe };
              if (safe.mode === 'rgb') next.rgb = { points: normalized };
              if (safe.mode === 'r') next.r = { points: normalized };
              if (safe.mode === 'g') next.g = { points: normalized };
              if (safe.mode === 'b') next.b = { points: normalized };
              onChange && onChange(next);
            }}
          >+ Add point</button>
          <button className="curve-remove" type="button" title="Remove middle point"
            onClick={() => {
              // Remove a middle point closest to x=128; keep endpoints
              const ptsNorm = getChannelPoints();
              const toEditorPoint = (p) => Array.isArray(p)
                ? { x: (p[0] <= 1 ? p[0]*256 : p[0]), y: (p[1] <= 1 ? p[1]*256 : p[1]) }
                : { x: ((p?.x ?? 0) <= 1 ? (p?.x ?? 0)*256 : (p?.x ?? 0)), y: ((p?.y ?? 0) <= 1 ? (p?.y ?? 0)*256 : (p?.y ?? 0)) };
              const toNormalizedPoint = (p) => [ (p.x ?? 0)/256, (p.y ?? 0)/256 ];

              let editorPts = (Array.isArray(ptsNorm) && ptsNorm.length ? ptsNorm : DEFAULT_POINTS).map(toEditorPoint)
                .map(p => ({ x: Math.max(0, Math.min(256, p.x)), y: Math.max(0, Math.min(256, p.y)) }))
                .sort((a,b) => a.x - b.x);

              if (editorPts.length <= 2) return; // nothing to remove beyond endpoints
              // Find closest non-endpoint to x=128
              let idx = -1, bestDist = Infinity;
              for (let i = 1; i < editorPts.length-1; i++) {
                const d = Math.abs(editorPts[i].x - 128);
                if (d < bestDist) { bestDist = d; idx = i; }
              }
              if (idx > 0 && idx < editorPts.length-1) {
                editorPts = editorPts.filter((_, i) => i !== idx);
                const normalized = editorPts.map(toNormalizedPoint);
                const next = { ...safe };
                if (safe.mode === 'rgb') next.rgb = { points: normalized };
                if (safe.mode === 'r') next.r = { points: normalized };
                if (safe.mode === 'g') next.g = { points: normalized };
                if (safe.mode === 'b') next.b = { points: normalized };
                onChange && onChange(next);
              }
            }}
          >− Remove point</button>
          <button className="curve-reset" onClick={resetChannel} type="button" title="Reset current curve">Reset</button>
          <button className="curve-reset-all" onClick={resetAll} type="button" title="Reset all curves">Reset All</button>
        </div>
      </div>

      <CurveEditor
        points={activePoints}
        onChange={handleCurveChange}
      />

      <div className="curve-legend">
        <span className="legend-chip rgb">RGB</span>
        <span className="legend-chip r">R</span>
        <span className="legend-chip g">G</span>
        <span className="legend-chip b">B</span>
      </div>
    </div>
  );
};

export default CurvesPanel;
