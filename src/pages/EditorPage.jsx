import React, { useState, useEffect, useRef, useMemo } from 'react';
import { convertRawToJpeg } from '../utils/imageProcessing';
import { isRawFile } from '../utils/rawFileDetector';
import Histogram from '../components/Histogram';
import { Link } from 'react-router-dom';
import '../styles/modern-editor.css';
import ConversionSettings from '../components/ConversionSettings';
import BasicAdjustmentsPanel from '../components/editorPanels/BasicAdjustmentsPanel';
import ColorAdjustmentsPanel from '../components/editorPanels/ColorAdjustmentsPanel';
import SharpnessPanel from '../components/editorPanels/SharpnessPanel';
import EffectsPanel from '../components/editorPanels/EffectsPanel';
import GeometryPanel from '../components/editorPanels/GeometryPanel';
import AdvancedPanel from '../components/editorPanels/AdvancedPanel';
import CurvesPanel from '../components/editorPanels/CurvesPanel';
import HSLPanel, { defaultHSLState } from '../components/editorPanels/HSLPanel';
import { buildLUTsFromCurves } from '../utils/curveUtils';
import FileUploader from '../components/FileUploader';
import EditorUploadPlaceholder from '../components/EditorUploadPlaceholder';
import EnhancedImageCanvas from '../components/EnhancedImageCanvas';
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
  const [effects, setEffects] = useState({
    vignette: 0,
    grain: 0,
    blur: 0,
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

  const allEdits = {
    ...adjustments,
    ...colorAdjustments,
    ...sharpness,
    ...effects,
    ...geometry,
    ...advanced,
    // inject HSL adjustments in a dedicated object so canvas can apply a pass
    hslAdjustments
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
        // init
        const id = 'init-' + Date.now();
        aiWorkerRef.current.postMessage({ id, type: 'init', payload: {} });
      } catch (err) {
        console.warn('AI worker init failed (stub):', err);
      }
    }
    return () => {};
  }, [mode]);

  const callAI = (type, payload = {}) => new Promise((resolve) => {
    const worker = aiWorkerRef.current;
    if (!worker) return resolve({ ok: false, error: 'worker-not-ready' });
    const id = type + '-' + Math.random().toString(36).slice(2);
    const handler = (e) => {
      const msg = e.data;
      if (!msg || msg.id !== id) return;
      worker.removeEventListener('message', handler);
      resolve(msg);
    };
    worker.addEventListener('message', handler);
    worker.postMessage({ id, type, payload });
  });

  // AI Preview/Apply handlers (stub)
  const onPreviewPortrait = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('portraitEnhance', { strength: ai.portrait?.strength ?? 50 });
    setAi((prev) => ({ ...prev, portrait: { ...prev.portrait, params: res?.payload?.params || null }, lastRun: 'portraitPreview', loading: false }));
  };
  const onApplyPortrait = async () => {
    // same as preview, but we can flag "applied" later
    await onPreviewPortrait();
  };
  const onPreviewLandscape = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('landscapeEnhance', { strength: ai.landscape?.strength ?? 50 });
    setAi((prev) => ({ ...prev, landscape: { ...prev.landscape, params: res?.payload?.params || null }, lastRun: 'landscapePreview', loading: false }));
  };
  const onApplyLandscape = async () => { await onPreviewLandscape(); };
  const onPreviewBgBlur = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('backgroundBlur', { blurStrength: ai.bg?.blurStrength ?? 10 });
    setAi((prev) => ({ ...prev, bg: { ...prev.bg, blurStrength: res?.payload?.blurStrength ?? prev.bg.blurStrength }, lastRun: 'bgBlurPreview', loading: false }));
  };
  const onApplyBgBlur = async () => { await onPreviewBgBlur(); };
  const onPreviewBgRemove = async () => {
    setAi((prev) => ({ ...prev, loading: true }));
    const res = await callAI('backgroundRemove', {});
    setAi((prev) => ({ ...prev, bg: { ...prev.bg, removed: !!(res?.payload?.transparent) }, lastRun: 'bgRemovePreview', loading: false }));
  };
  const onApplyBgRemove = async () => { await onPreviewBgRemove(); };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div className="header-left">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>RAW Image Editor</h1>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={onUndo}>Undo</button>
          <button className="header-button" onClick={onRedo}>Redo</button>
          <button className="header-button" onClick={handleReset}>Reset</button>
          <button className="header-button primary" onClick={handleExport} disabled={!uploadedImage || isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Edit | AI segmented toggle */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px' }}>
        <button
          className={`header-button ${mode === 'edit' ? 'primary' : ''}`}
          onClick={() => setMode('edit')}
        >
          Edit
        </button>
        <button
          className={`header-button ${mode === 'ai' ? 'primary' : ''}`}
          onClick={() => setMode('ai')}
        >
          AI
        </button>
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
                  <button
                    className={`control-button ${showBeforeAfter ? 'active' : ''}`}
                    onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  >
                    {showBeforeAfter ? 'Hide' : 'Show'} Before/After
                  </button>
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
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/80">Split Channels (R/G/B)</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="header-button"
                      title="Split from original (no adjustments)"
                      onClick={() => setExtractChannelsFrom('original')}
                    >
                      Original
                    </button>
                    <button
                      className="header-button primary"
                      title="Split from processed (with current adjustments)"
                      onClick={() => setExtractChannelsFrom('processed')}
                    >
                      Processed
                    </button>
                  </div>
                </div>
              </div>

              <div className="adjustment-panels">
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
