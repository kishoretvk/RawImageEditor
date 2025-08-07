import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/tokens.css';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import { convertRawToJpeg } from '../utils/imageProcessing';
import { isRawFile } from '../utils/rawFileDetector';
import Histogram from '../components/Histogram';
import { Link } from 'react-router-dom';
import '../styles/modern-editor.css';
import ConversionSettings from '../components/ConversionSettings';
import BasicAdjustmentsPanel from '../components/editorPanels/BasicAdjustmentsPanel';
import ColorAdjustmentsPanel from '../components/editorPanels/ColorAdjustmentsPanel';
import SharpnessPanel from '../components/editorPanels/SharpnessPanel';
import DetailPanel from '../components/editorPanels/DetailPanel';
import EffectsPanel from '../components/editorPanels/EffectsPanel';
import GeometryPanel from '../components/editorPanels/GeometryPanel';
import AdvancedPanel from '../components/editorPanels/AdvancedPanel';
import CurvesPanel from '../components/editorPanels/CurvesPanel';
import HSLPanel, { defaultHSLState } from '../components/editorPanels/HSLPanel';
import SplitToningPanel from '../components/editorPanels/SplitToningPanel';
import LocalAdjustmentsPanel from '../components/LocalAdjustmentsPanel';
import GradientMaskOverlay from '../components/GradientMaskOverlay';
import { buildLUTsFromCurves } from '../utils/curveUtils';
import FileUploader from '../components/FileUploader';
import EditorUploadPlaceholder from '../components/EditorUploadPlaceholder';
import EnhancedImageCanvas from '../components/EnhancedImageCanvas';
import ExportDialog from '../components/ExportDialog';
import PresetSelector from '../components/PresetSelector';
import PresetBuilder from '../components/PresetBuilder';
import PresetManager from '../components/PresetManager';
import UnifiedSlider from '../components/UnifiedSlider';
import '../styles/unified-slider.css';
import WhiteBalanceTool from '../components/WhiteBalanceTool';

// AI imports (stubs)
import AITab from '../components/ai/AITab';

function CollapsibleControlPanel({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="collapsible-panel">
      <button className="panel-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="panel-title">{title}</span>
        <span className={`panel-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="panel-content">{children}</div>}
    </div>
  );
}

const EditorPage = () => {
  const [settings, setSettings] = useState({
    quality: 50,
    format: 'jpeg',
    resize: 1000,
    sharpening: 0,
    noiseReduction: 0,
  });

  // White balance state (WB Region Select - Step A)
  const [whiteBalance, setWhiteBalance] = useState({
    multipliers: { r: 1, g: 1, b: 1 },
    temperature: 0,
    tint: 0,
    samplingSpace: 'original', // 'original' | 'processed'
    selecting: false
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [jpegPreview, setJpegPreview] = useState(null);
  const objectUrlRef = useRef(null);
  const [adjustments, setAdjustments] = useState({
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    gamma: 1,
  });
  const [colorAdjustments, setColorAdjustments] = useState({
    temperature: 0,
    tint: 0,
    hue: 0,
    saturation: 0,
  });
  const [sharpness, setSharpness] = useState({
    amount: 0,
    radius: 1,
    detail: 0.5,
    masking: 0,
  });

  // Detail panel state (separate from simple Sharpness panel) with defaults
  const [detailAdjustments, setDetailAdjustments] = useState({
    lumaNR: 0,
    chromaNR: 0,
    sharpenAmount: 40,
    sharpenRadius: 1.0,
    sharpenDetail: 25,
    sharpenMasking: 0
  });
  const [effects, setEffects] = useState({
    vignette: 0,
    grain: 0,
    blur: 0,
  });

  // Split Toning state with confirmed defaults
  const [splitToning, setSplitToning] = useState({
    highlightsHue: 40,
    highlightsSat: 15,
    shadowsHue: 220,
    shadowsSat: 15,
    balance: 0
  });
  const [geometry, setGeometry] = useState({
    crop: 0,
    rotate: 0,
    flip: 'none',
  });
  const [advanced, setAdvanced] = useState({
    hdr: 1,
    curves: 1,
    channelMixer: 1,
  });

  // HSL / Color Mixer state
  const [hslAdjustments, setHslAdjustments] = useState(defaultHSLState());

  // AI: Edit | AI segmented toggle
  const [mode, setMode] = useState('edit'); // 'edit' | 'ai'
  const [aiBackend, setAiBackend] = useState(null); // webgpu | webgl | wasm
  // AI state slice (non-destructive, stubs)
  const [ai, setAi] = useState({
    personMask: null,
    skyMask: null,
    portrait: { strength: 50, params: null },
    landscape: { strength: 50, params: null },
    bg: { blurStrength: 10, removed: false },
    lastRun: null,
    loading: false
  });

  // Unified tone curves state (master RGB + per-channel), normalized [0..1] point pairs
  const ID = [[0, 0], [1, 1]];
  const [curves, setCurves] = useState({
    mode: 'rgb',
    rgb: { points: ID },
    r: { points: ID },
    g: { points: ID },
    b: { points: ID }
  });

  const { lutR, lutG, lutB } = useMemo(() => buildLUTsFromCurves(curves, { size: 256, space: 'linear' }), [curves]);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Local adjustments state
  const [localMasks, setLocalMasks] = useState([]);
  const [editingMaskId, setEditingMaskId] = useState(null);

  // Split channels wiring (B)
  const [extractChannelsFrom, setExtractChannelsFrom] = useState(null); // 'original' | 'processed' | null

  const downloadBlob = (blob, name) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 0);
  };

  const handleExtractedChannels = React.useCallback(({ rBlob, gBlob, bBlob }) => {
    // Use current timestamp to avoid name collisions
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(rBlob, `channel-R-${ts}.png`);
    downloadBlob(gBlob, `channel-G-${ts}.png`);
    downloadBlob(bBlob, `channel-B-${ts}.png`);
    // clear request to avoid re-trigger
    setExtractChannelsFrom(null);
  }, []);

  useEffect(() => {
    // edits are passed down; no direct URL swaps here
  }, [adjustments, colorAdjustments, sharpness, effects, geometry, advanced, ai, whiteBalance]);

  const handleFileUpload = async (incoming) => {
    try {
      const file = Array.isArray(incoming) ? incoming[0] : incoming;
      if (!file) return;
      setUploadedImage(file);
      setIsLoading(true);

      const fileName = file?.name || file?.filename || '';
      const knownUrl = file?.url || file?.preview || null;

      if (objectUrlRef.current) {
        try { URL.revokeObjectURL(objectUrlRef.current); } catch {}
        objectUrlRef.current = null;
      }

      let instantUrl = knownUrl;
      if (!instantUrl && file instanceof Blob) {
        instantUrl = URL.createObjectURL(file);
        objectUrlRef.current = instantUrl;
      }

      const isRaw = isRawFile(fileName) || (file?.type && /application\/octet-stream|image\/x-(?:canon|nikon|sony|fujifilm|olympus|panasonic)-raw|image\/(?:dng|arw|nef|cr2|cr3|raf|orf|rw2)/i.test(file.type));

      if (!isRaw) {
        if (instantUrl) {
          setEditedImageUrl(instantUrl);
          setJpegPreview(instantUrl);
        }
        setIsLoading(false);
        return;
      }

      const rawPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMyYTJhMmEiLz48dGV4dCB4PSI0MDAiIHk9IjMwMCIgZmlsbD0iIzc2NyIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdlbmVyYXRpbmcgUkFXIHByZXZpZXcuLi48L3RleHQ+PC9zdmc+';
      setEditedImageUrl(rawPlaceholder);
      if (instantUrl) setJpegPreview(instantUrl);

      try {
        const timeoutMs = 2000;
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ preview: instantUrl, status: 'timeout' }), timeoutMs);
        });

        const workerPromise = convertRawToJpeg({
          file,
          name: fileName
        });

        const jpegResult = await Promise.race([workerPromise, timeoutPromise]);
        const displayUrl = jpegResult?.preview || null;

        if (displayUrl) {
          setJpegPreview(displayUrl);
          setEditedImageUrl(displayUrl);
        } else {
          if (instantUrl) setJpegPreview(instantUrl);
        }
      } catch (e) {
        if (instantUrl) setJpegPreview(instantUrl);
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAdjustments({
      exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, gamma: 1,
    });
    setColorAdjustments({ temperature: 0, tint: 0, hue: 0, saturation: 0 });
    setSharpness({ amount: 0, radius: 1, detail: 0.5, masking: 0 });
    setEffects({ vignette: 0, grain: 0, blur: 0 });
    setGeometry({ crop: 0, rotate: 0, flip: 'none' });
    setAdvanced({ hdr: 1, curves: 1, channelMixer: 1 });
    setSettings({ quality: 50, format: 'jpeg', resize: 1000, sharpening: 0, noiseReduction: 0 });
    setAi({ personMask: null, skyMask: null, portrait: { strength: 50, params: null }, landscape: { strength: 50, params: null }, bg: { blurStrength: 10, removed: false }, lastRun: null, loading: false });
  };

  const onUndo = () => {};
  const onRedo = () => {};

  const handleExport = async () => {
    if (!uploadedImage) return;
    setIsExporting(true);
    try {
      const imageUrl =
        editedImageUrl ||
        jpegPreview ||
        (typeof uploadedImage === 'string' ? uploadedImage : (uploadedImage?.url || uploadedImage?.preview || null));
      if (!imageUrl) throw new Error('No exportable image URL available');
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `edited-image.${settings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
    } finally {
      setIsExporting(false);
    }
  };

  const handleResizeStart = (e) => { e.preventDefault(); setIsResizing(true); };
  const handleResizeMove = (e) => { if (!isResizing) return; const newWidth = Math.max(280, Math.min(600, e.clientX)); setPanelWidth(newWidth); };
  const handleResizeEnd = () => { setIsResizing(false); };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  // Background alpha flag must be declared before use in allEdits
  const [hasAlphaBackgroundRemoved, setHasAlphaBackgroundRemoved] = useState(false);

  const allEdits = {
    ...adjustments,
    ...colorAdjustments,
    ...sharpness,
    // detail panel adjustments for NR + sharpen pipeline
    detailAdjustments,
    ...effects,
    ...geometry,
    ...advanced,
    // inject HSL adjustments in a dedicated object so canvas can apply a pass
    hslAdjustments,
    // split toning params grouped under splitToning
    splitToning,
    // background alpha removal flag for export/canvas awareness
    hasAlphaBackgroundRemoved
  };

  // AI worker wiring (stubs)
  const aiWorkerRef = useRef(null);
  useEffect(() => {
    // Lazy instantiate worker only when AI mode is entered
    if (mode !== 'ai') return;
    if (!aiWorkerRef.current) {
      // Create worker via constructor (Vite supports new URL with import.meta.url)
      try {
        aiWorkerRef.current = new Worker(new URL('../workers/ai.worker.js', import.meta.url), { type: 'module' });
        // init runtime and capture backend label
        const id = 'init-' + Date.now();
        const worker = aiWorkerRef.current;
        const onMsg = (e) => {
          const msg = e.data || {};
          if (msg.id !== id) return;
          worker.removeEventListener('message', onMsg);
          if (msg.ok && msg.type === 'initRuntime') {
            setAiBackend(msg.backend || null);
          }
        };
        worker.addEventListener('message', onMsg);
        worker.postMessage({ id, type: 'initRuntime', payload: { preferWebGPU: true } });
      } catch (err) {
        console.warn('AI worker init failed (stub):', err);
      }
    }
    return () => {};
  }, [mode]);

  // Safe worker call with timeout to avoid dangling async listeners
  const callAI = (type, payload = {}, { timeoutMs = 10000 } = {}) =>
    new Promise((resolve) => {
      const worker = aiWorkerRef.current;
      if (!worker) return resolve({ ok: false, error: 'worker-not-ready' });
      const id = type + '-' + Math.random().toString(36).slice(2);

      let settled = false;
      const handler = (e) => {
        const msg = e.data;
        if (!msg || msg.id !== id) return;
        worker.removeEventListener('message', handler);
        settled = true;
        resolve(msg);
      };

      worker.addEventListener('message', handler);

      // Failsafe timeout to prevent "async response but channel closed" errors
      const to = setTimeout(() => {
        if (settled) return;
        try { worker.removeEventListener('message', handler); } catch {}
        resolve({ ok: false, id, error: 'timeout', type });
      }, timeoutMs);

      try {
        worker.postMessage({ id, type, payload });
      } catch (err) {
        clearTimeout(to);
        try { worker.removeEventListener('message', handler); } catch {}
        resolve({ ok: false, id, error: 'postMessage-failed', detail: String(err) });
      }
    });

  // Helper to preload models (person-seg) via worker
  const preloadAIModels = React.useCallback(async () => {
    const worker = aiWorkerRef.current;
    if (!worker) return;
    const id = 'preload-' + Math.random().toString(36).slice(2);
    const list = [
      { name: 'person-seg', version: 'v1', urls: [`${import.meta.env.BASE_URL || '/'}models/person-seg-v1.onnx`] }
    ];
    return new Promise((resolve) => {
      const onMsg = (e) => {
        const msg = e.data || {};
        if (msg.id !== id) return;
        worker.removeEventListener('message', onMsg);
        if (msg.ok) {
          if (msg.backend) setAiBackend(msg.backend);
        }
        resolve(msg);
      };
      worker.addEventListener('message', onMsg);
      worker.postMessage({ id, type: 'preloadModels', payload: { list, preferredBackend: 'webgpu' } });
    });
  }, []);

  // AI Preview/Apply handlers (stub)
  // Map portrait params from worker into editor adjustments for visible change
  const applyPortraitParamsToEdits = (params) => {
    if (!params) return;
    const {
      exposureDelta = 0,
      contrastMid = 0,      // 0..~0.15
      warmthBias = 0,       // 0..~0.08
      clarityDelta = 0,     // negative -> NR, positive -> sharpen
      saturationDelta = 0,
      vibranceDelta = 0
    } = params;

    // Basic/global adjustments
    setAdjustments(prev => ({
      ...prev,
      exposure: (prev.exposure || 0) + exposureDelta, // exposure is log2 stop-like scaling
      contrast: (prev.contrast || 0) + Math.round(contrastMid * 100), // map to slider range
    }));

    setColorAdjustments(prev => ({
      ...prev,
      temperature: (prev.temperature || 0) + Math.round(warmthBias * 100),
      saturation: (prev.saturation || 0) + Math.round(saturationDelta * 100),
      // vibrance slider may not exist; approximate by slight saturation if vibranceDelta present
      // If you add a dedicated vibrance control later, wire it here.
    }));

    // Detail: clarity approximation
    setDetailAdjustments(prev => {
      const next = { ...prev };
      if (clarityDelta < 0) {
        // increase luma NR slightly
        next.lumaNR = Math.min(100, (next.lumaNR || 0) + Math.round(Math.abs(clarityDelta) * 50));
      } else if (clarityDelta > 0) {
        // increase sharpening amount modestly
        next.sharpenAmount = Math.min(150, (next.sharpenAmount || 40) + Math.round(clarityDelta * 80));
      }
      return next;
    });
  };

  const onPreviewPortrait = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('portraitEnhance', { strength: ai.portrait?.strength ?? 50 });
    const params = res?.payload?.params || null;
    // Apply directly for visible preview
    applyPortraitParamsToEdits(params);
    setAi((prev) => ({ ...prev, portrait: { ...prev.portrait, params }, lastRun: 'portraitPreview', loading: false }));
  };
  const onApplyPortrait = async () => {
    // Apply again to ensure persisted state (already applied in preview)
    await onPreviewPortrait();
  };
  const applyLandscapeParamsToEdits = (params) => {
    if (!params) return;
    const { sky = {}, ground = {}, global = {} } = params;
    const { vibrance = 0, texture = 0 } = ground;
    const { curveMid = 0 } = global;

    // Global saturation/vibrance approximation
    setColorAdjustments(prev => ({
      ...prev,
      saturation: (prev.saturation || 0) + Math.round((vibrance || 0) * 80)
    }));

    // Gentle mid-curve via contrast
    setAdjustments(prev => ({
      ...prev,
      contrast: (prev.contrast || 0) + Math.round((curveMid || 0) * 100)
    }));

    // Texture approximation through sharpening
    setDetailAdjustments(prev => ({
      ...prev,
      sharpenAmount: Math.min(150, (prev.sharpenAmount || 40) + Math.round((texture || 0) * 120))
    }));
  };

  const onPreviewLandscape = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('landscapeEnhance', { strength: ai.landscape?.strength ?? 50 });
    const params = res?.payload?.params || null;
    applyLandscapeParamsToEdits(params);
    setAi((prev) => ({ ...prev, landscape: { ...prev.landscape, params }, lastRun: 'landscapePreview', loading: false }));
  };
  const onApplyLandscape = async () => { await onPreviewLandscape(); };
  // Background blur: approximate visibly by adding slight global blur in Effects panel for now
  const onPreviewBgBlur = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('backgroundBlur', { blurStrength: ai.bg?.blurStrength ?? 10 });
    const blurStrength = res?.payload?.blurStrength ?? ai.bg?.blurStrength ?? 10;
    setEffects(prev => ({ ...prev, blur: Math.min(100, Math.max(0, blurStrength)) }));
    setAi((prev) => ({ ...prev, bg: { ...prev.bg, blurStrength }, lastRun: 'bgBlurPreview', loading: false }));
  };
  const onApplyBgBlur = async () => { await onPreviewBgBlur(); };

  // Background remove: set a state flag so Export can default to PNG; canvas can later respect alpha when masks arrive
  const onPreviewBgRemove = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('backgroundRemove', {});
    const ok = !!(res?.payload?.transparent);
    if (ok) {
      setHasAlphaBackgroundRemoved(true);
    }
    setAi((prev) => ({ ...prev, bg: { ...prev.bg, removed: ok }, lastRun: 'bgRemovePreview', loading: false }));
  };
  const onApplyBgRemove = async () => { await onPreviewBgRemove(); };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div className="header-left">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>RAW Image Editor</h1>
          {mode === 'ai' && (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }} title="AI Backend">
              AI: {aiBackend || '…'}
            </span>
          )}
        </div>
        <div className="header-right">
          <Button size="sm" variant="ghost" onClick={onUndo}>Undo</Button>
          <Button size="sm" variant="ghost" onClick={onRedo}>Redo</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>
          <Button size="sm" variant="primary" onClick={handleExport} disabled={!uploadedImage || isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExport(true)}
            disabled={!uploadedImage}
            title="Open Export Options"
          >
            Export Options
          </Button>
        </div>
      </div>

      {/* Edit | AI segmented toggle */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px' }}>
        <Button
          variant={mode === 'edit' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('edit')}
        >
          Edit
        </Button>
        <Button
          variant={mode === 'ai' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode('ai')}
        >
          AI
        </Button>
        {mode === 'ai' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => preloadAIModels()}
            title="Preload AI models into cache"
          >
            Preload AI
          </Button>
        )}
      </div>

      <div className="editor-content">
        <div className="editor-main">
          <div className="canvas-container" style={{ minHeight: 320 }}>
            {!uploadedImage ? (
              <div className="upload-placeholder">
                <FileUploader onFileUpload={handleFileUpload} />
              </div>
            ) : (
              <>
                {/* safe no-op AI props for now */}
                <EnhancedImageCanvas
                  imageSrc={editedImageUrl}
                  edits={allEdits}
                  localMasks={localMasks}
                  showSlider={showBeforeAfter}
                  sliderPosition={sliderPosition}
                  onSliderChange={setSliderPosition}
                  curveLUTs={lutR && lutG && lutB ? { lutR, lutG, lutB } : null}
                  ai={ai}
                  // WB Region Select wiring
                  wbGains={{
                    rGain: whiteBalance.multipliers.r,
                    gGain: whiteBalance.multipliers.g,
                    bGain: whiteBalance.multipliers.b
                  }}
                  wbSelectEnabled={whiteBalance.selecting}
                  wbSamplingSpace={whiteBalance.samplingSpace}
                  onWbRegionSelected={(rect, { avgR, avgG, avgB }, { rGain, gGain, bGain }) => {
                    // derive simple temperature/tint heuristics from averages
                    const temperature = (avgR - avgB) || 0;
                    const tint = (avgG - (avgR + avgB) / 2) / 2 || 0;
                    setWhiteBalance(prev => ({
                      ...prev,
                      multipliers: { r: rGain, g: gGain, b: bGain },
                      temperature,
                      tint,
                      selecting: false
                    }));
                  }}
                  // Split channels one-shot trigger
                  onExtractChannels={extractChannelsFrom ? handleExtractedChannels : null}
                  extractChannelsFrom={extractChannelsFrom || 'processed'}
                />
                {isLoading && (
                  <div className="canvas-loading-overlay">
                    <div className="spinner" />
                    <span>Processing…</span>
                  </div>
                )}
                <div className="canvas-controls">
                  <Button
                    variant={showBeforeAfter ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  >
                    {showBeforeAfter ? 'Hide' : 'Show'} Before/After
                  </Button>
                  {showBeforeAfter && (
                    <UnifiedSlider
                      value={sliderPosition}
                      onChange={setSliderPosition}
                      min={0}
                      max={100}
                      step={1}
                      label="Before/After"
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Local Adjustments Overlay (Gradient) */}
          {uploadedImage && editingMaskId && (
            <div style={{ position: 'relative' }}>
              {(() => {
                const m = localMasks.find(mm => mm.id === editingMaskId);
                if (!m || !m.enabled) return null;
                if (m.type === 'gradient') {
                  // Use image dimensions if available, otherwise rely on container size via effect
                  const w = (document.querySelector('.enhanced-canvas')?.width) || 800;
                  const h = (document.querySelector('.enhanced-canvas')?.height) || 600;
                  return (
                    <GradientMaskOverlay
                      width={w}
                      height={h}
                      mask={m}
                      onChange={(nextMask) => {
                        setLocalMasks(prev => prev.map(mm => mm.id === m.id ? nextMask : mm));
                      }}
                    />
                  );
                }
                return null;
              })()}
            </div>
          )}

          {showExport && (
            <div className="modal-backdrop">
              <div className="modal-panel">
                <div className="modal-header">
                  <h3>Export</h3>
                  <button className="header-button" onClick={() => setShowExport(false)}>Close</button>
                </div>
                <div className="modal-body">
                  <ExportDialog
                    hasAlphaBackgroundRemoved={hasAlphaBackgroundRemoved}
                    onExport={({ format, quality, filename, preserveTransparency }) => {
                      // basic inline export of current preview URL; advanced handled in canvas utils
                      const imageUrl =
                        editedImageUrl ||
                        jpegPreview ||
                        (typeof uploadedImage === 'string' ? uploadedImage : (uploadedImage?.url || uploadedImage?.preview || null));
                      if (!imageUrl) return;
                      const a = document.createElement('a');
                      a.href = imageUrl;
                      a.download = `${filename || 'export'}.${format || 'jpeg'}`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    onRequestSplitChannels={(useAdjusted) => {
                      setExtractChannelsFrom(useAdjusted ? 'processed' : 'original');
                    }}
                    // Provide handler to run target-size export via util
                    onExportTargetSize={async (targetMB, options) => {
                      try {
                        // Get processed canvas from EnhancedImageCanvas' hidden processed canvas
                        const canvas = document.querySelector('.enhanced-canvas')?.parentElement?.querySelector('canvas[style*="display: none"] + canvas') || null;
                        // Fallback: access our ref if available
                        const processedCanvas = document.querySelector('.enhanced-canvas')?.parentElement?.querySelector('canvas[style*="display: none"]:last-child') || null;
                        const c = processedCanvas || canvas;
                        if (!c) return;
                        const { toJPEGTargetSize } = await import('../utils/imageProcessing');
                        const { blob } = await toJPEGTargetSize(c, targetMB, options || { tolerance: 0.05, allowDownscale: false });
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `export-${targetMB}MB.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          setTimeout(() => URL.revokeObjectURL(url), 0);
                        }
                      } catch (e) {
                        console.warn('Target size export failed:', e);
                      }
                    }}
                    // Optional direct canvas provider for internal fallback mode
                    getProcessedCanvas={() => {
                      // try to locate processed hidden canvas used for drawing
                      const processedCanvas = document.querySelector('.enhanced-canvas')?.parentElement?.querySelector('canvas[style*="display: none"]:last-child') || null;
                      return processedCanvas || null;
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {uploadedImage && (
            <div className="histogram-container">
              <Histogram
                imageUrl={
                  jpegPreview ||
                  editedImageUrl ||
                  (typeof uploadedImage === 'string' ? uploadedImage : (uploadedImage?.url || uploadedImage?.preview || null))
                }
              />
            </div>
          )}
        </div>

        {uploadedImage && mode === 'edit' && (
          <div className="editor-sidebar" style={{ width: `${panelWidth}px` }}>
            <div className="resize-handle" onMouseDown={handleResizeStart} />
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3>Adjustments</h3>
              </div>

              {/* Quick Channel Split action (exports from here for now) */}
              <Panel title="Split Channels (R/G/B)" className="mb-3">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Split from original (no adjustments)"
                    onClick={() => setExtractChannelsFrom('original')}
                  >
                    Original
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    title="Split from processed (with current adjustments)"
                    onClick={() => setExtractChannelsFrom('processed')}
                  >
                    Processed
                  </Button>
                </div>
              </Panel>

              <div className="adjustment-panels">

                {/* Local Adjustments */}
                <CollapsibleControlPanel title="Local Adjustments" defaultOpen={false}>
                  <LocalAdjustmentsPanel
                    masks={localMasks}
                    onChange={setLocalMasks}
                    onEditOverlay={(id) => setEditingMaskId(prev => prev === id ? null : id)}
                  />
                </CollapsibleControlPanel>
                <CollapsibleControlPanel title="Basic Adjustments" defaultOpen={true}>
                  {/* Use the 'edits' prop name expected by the panel and defensively merge updates */}
                  <BasicAdjustmentsPanel
                    edits={adjustments}
                    onChange={(next) => setAdjustments((prev) => ({ ...prev, ...(next || {}) }))}
                  />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Color Adjustments" defaultOpen={false}>
                  <ColorAdjustmentsPanel
                    colorAdjustments={colorAdjustments}
                    onChange={(next) => setColorAdjustments((prev) => ({ ...prev, ...(next || {}) }))}
                  />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="HSL / Color Mixer" defaultOpen={false}>
                  <HSLPanel
                    hsl={hslAdjustments}
                    onChange={setHslAdjustments}
                  />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Split Toning" defaultOpen={false}>
                  <SplitToningPanel
                    edits={{ splitToning }}
                    onEditsChange={(next) => {
                      // next is full edits object with splitToning inside
                      const st = next?.splitToning || splitToning;
                      setSplitToning(st);
                    }}
                  />
                </CollapsibleControlPanel>

                {/* White Balance Tool (WB Region Select) */}
                <CollapsibleControlPanel title="White Balance" defaultOpen={false}>
                  <WhiteBalanceTool
                    whiteBalance={whiteBalance}
                    onStartWBSelect={() => setWhiteBalance(prev => ({ ...prev, selecting: true }))}
                    onChangeSamplingSpace={(val) => setWhiteBalance(prev => ({ ...prev, samplingSpace: val }))}
                    onResetWB={() => setWhiteBalance({ multipliers: { r: 1, g: 1, b: 1 }, temperature: 0, tint: 0, samplingSpace: 'original', selecting: false })}
                  />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Sharpness & Detail" defaultOpen={false}>
                  <SharpnessPanel sharpness={sharpness} onChange={setSharpness} />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Detail (NR + Sharpen)" defaultOpen={false}>
                  <DetailPanel
                    detail={detailAdjustments}
                    onChange={setDetailAdjustments}
                  />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Effects & Filters" defaultOpen={false}>
                  <EffectsPanel effects={effects} onChange={setEffects} />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Geometry" defaultOpen={false}>
                  <GeometryPanel geometry={geometry} onChange={setGeometry} />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Advanced" defaultOpen={false}>
                  <AdvancedPanel advanced={advanced} onChange={setAdvanced} />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Tone Curves" defaultOpen={false}>
                  <CurvesPanel curves={curves} onChange={setCurves} />
                </CollapsibleControlPanel>

                <CollapsibleControlPanel title="Presets" defaultOpen={true}>
                  <PresetSelector
                    onPresetSelect={(preset) => {
                      const { settings } = preset;
                      setAdjustments(prev => ({ ...prev, ...settings }));
                      setColorAdjustments(prev => ({ ...prev, ...settings }));
                      setSharpness(prev => ({ ...prev, ...settings }));
                      setEffects(prev => ({ ...prev, ...settings }));
                      setGeometry(prev => ({ ...prev, ...settings }));
                      setAdvanced(prev => ({ ...prev, ...settings }));
                    }}
                  />
                  <PresetBuilder
                    onSave={(preset) => {
                      PresetManager.savePreset(preset);
                    }}
                    currentEdits={allEdits}
                  />
                </CollapsibleControlPanel>
              </div>
            </div>
          </div>
        )}

        {uploadedImage && mode === 'ai' && (
          <div className="editor-sidebar" style={{ width: `${panelWidth}px` }}>
            <div className="resize-handle" onMouseDown={handleResizeStart} />
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3>AI Assist</h3>
              </div>

              <AITab
                loading={ai.loading}
                onPreviewPortrait={onPreviewPortrait}
                onApplyPortrait={onApplyPortrait}
                onPreviewLandscape={onPreviewLandscape}
                onApplyLandscape={onApplyLandscape}
                onPreviewBgBlur={onPreviewBgBlur}
                onApplyBgBlur={onApplyBgBlur}
                onPreviewBgRemove={onPreviewBgRemove}
                onApplyBgRemove={onApplyBgRemove}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
