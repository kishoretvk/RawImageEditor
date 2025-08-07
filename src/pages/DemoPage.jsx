import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from '../components/ImageSlider';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import EnhancedImageCanvas from '../components/EnhancedImageCanvas';
import './DemoPage.css';
import '../styles/tokens.css';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Panel from '../components/ui/Panel.jsx';
import { effectsRegistry, reduceComposition, getEffect } from '../utils/ai/effectsRegistry';

const samples = [
  { key: 'color', name: 'Color', before: '/demo-images/color-before.jpg', after: '/demo-images/color-after.jpg' },
  { key: 'landscape', name: 'Landscape', before: '/demo-images/landscape-before.jpg', after: '/demo-images/landscape-after.jpg' },
  { key: 'portrait', name: 'Portrait', before: '/demo-images/portrait-before.jpg', after: '/demo-images/portrait-after.jpg' },
];

const DemoPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('slider');
  const [selectedSample, setSelectedSample] = useState(samples[0]);

  // Optional upload for custom image (defaults to samples)
  const [uploaded, setUploaded] = useState(null); // { url, file }
  const currentImage = useMemo(() => {
    if (uploaded?.url) return uploaded.url;
    // default to sample "after" as the processed reference for slider demo
    return selectedSample.after;
  }, [uploaded, selectedSample]);

  // Composition of effects: [{ id, type, params, enabled, result }]
  const [layers, setLayers] = useState([]);

  // Selected effect for the right-side dynamic panel
  const [selectedEffectKey, setSelectedEffectKey] = useState(null);

  // Derived final edits for preview
  const { edits } = useMemo(() => reduceComposition(layers), [layers]);

  // Helpers for registry utilities (export, rgb split)
  const helpers = useMemo(() => ({
    getProcessedCanvas: () => {
      // Try to get processed canvas used by EnhancedImageCanvas (same heuristic as EditorPage)
      const processedCanvas = document.querySelector('.enhanced-canvas')?.parentElement?.querySelector('canvas[style*="display: none"]:last-child') || null;
      return processedCanvas || null;
    },
    onSplitChannels: (source) => {
      // Trigger the same channel split flow as EditorPage (processed/original)
      const evt = new CustomEvent('demo-rgb-split', { detail: { source } });
      window.dispatchEvent(evt);
    }
  }), []);

  // Read ?tool= query to preselect scenario and sample
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const tool = (qs.get('tool') || '').toLowerCase();
      if (!tool) return;

      // Choose sample based on tool intent
      if (tool === 'portrait') {
        const s = samples.find(x => x.key === 'portrait');
        if (s) setSelectedSample(s);
      } else if (tool === 'landscape' || tool === 'hsl' || tool === 'splittoning' || tool === 'detail') {
        const s = samples.find(x => x.key === 'landscape');
        if (s) setSelectedSample(s);
      } else if (tool === 'rgbsplit' || tool === 'bgblur' || tool === 'bgremove' || tool === 'target2mb') {
        const s = samples.find(x => x.key === 'color');
        if (s) setSelectedSample(s);
      }

      // Ensure slider tab is visible to showcase effect immediately
      setActiveTab('slider');

      // Pre-open the appropriate effect panel
      const map = {
        portrait: 'portrait',
        landscape: 'landscape',
        hsl: 'hslPop',
        splittoning: 'splitToningMood',
        detail: 'detailCleanup',
        rgbsplit: 'rgbSplit',
        bgblur: 'bgBlur',
        bgremove: 'bgRemove',
        target2mb: 'export2MB'
      };
      const key = map[tool];
      if (key) setSelectedEffectKey(key);
    } catch (_) {
      // no-op
    }
  }, []);

  // Ensure sample paths are correct for Vite dev server (public/ is served at root)
  const withBase = (p) => p.startsWith('/demo-images') ? p : p;

  // Effect orchestration — incremental wiring

  // Persist and rehydrate demo session
  useEffect(() => {
    // rehydrate on mount
    try {
      const raw = localStorage.getItem('demo-session-current');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.layers) setLayers(s.layers);
        if (s?.selectedEffectKey) setSelectedEffectKey(s.selectedEffectKey);
        if (s?.selectedSample) {
          const found = samples.find(x => x.key === s.selectedSample?.key);
          if (found) setSelectedSample(found);
        }
        if (s?.uploadedAsset?.url) setUploaded(s.uploadedAsset);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // debounce save
    const t = setTimeout(() => {
      try {
        const payload = {
          layers,
          selectedEffectKey,
          selectedSample: { key: selectedSample?.key },
          uploadedAsset: uploaded ? { url: uploaded.url } : null
        };
        localStorage.setItem('demo-session-current', JSON.stringify(payload));
      } catch {}
    }, 150);
    return () => clearTimeout(t);
  }, [layers, selectedEffectKey, selectedSample, uploaded]);

  // Add or select an effect layer, then run it
  const addOrSelectEffect = async (key) => {
    setSelectedEffectKey(key);
    const fx = effectsRegistry[key] || null;
    if (!fx) return;

    setLayers((prev) => {
      const exists = prev.find((l) => l.type === key);
      if (exists) return prev;
      const layer = {
        id: `${key}-${Date.now().toString(36)}`,
        type: key,
        params: { ...(fx.defaults || {}) },
        enabled: true,
        result: null
      };
      return [...prev, layer];
    });

    queueMicrotask(async () => {
      await runEffect(key);
    });
  };

  const updateLayerParams = (key, partial) => {
    setLayers((prev) =>
      prev.map((l) => (l.type === key ? { ...l, params: { ...(l.params || {}), ...(partial || {}) } } : l))
    );
  };

  const runEffect = async (key) => {
    const fx = effectsRegistry[key] || null;
    if (!fx) return;

    // Resolve image source for the effect
    const imageSrc = uploaded?.url || withBase(selectedSample.after);
    try {
      const params = (layers.find((l) => l.type === key)?.params) || (fx.defaults || {});
      const res = await fx.run(imageSrc, params, helpers);
      setLayers((prev) =>
        prev.map((l) => (l.type === key ? { ...l, result: res } : l))
      );
    } catch (e) {
      console.warn('Effect run failed', key, e);
    }
  };

  const toggleLayer = (key) => {
    setLayers((prev) => prev.map((l) => (l.type === key ? { ...l, enabled: !l.enabled } : l)));
  };

  const removeLayer = (key) => {
    setLayers((prev) => prev.filter((l) => l.type !== key));
    if (selectedEffectKey === key) setSelectedEffectKey(null);
  };

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Live AI Demo</h1>
        <p>Pick a sample or upload your own. Apply stacked AI effects, then export or open in the full editor.</p>

        {/* Upload control */}
        <div className="demo-upload">
          <input
            id="demoUpload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const url = URL.createObjectURL(f);
                setUploaded({ url, file: f });
              }
            }}
          />
          {uploaded?.url && (
            <Button size="sm" variant="secondary" onClick={() => { URL.revokeObjectURL(uploaded.url); setUploaded(null); }}>
              Clear Upload
            </Button>
          )}
        </div>

        {/* Action buttons row */}
        <div className="demo-actions">
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('portrait')}>Portrait Enhance</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('landscape')}>Landscape Enhance</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('hslPop')}>HSL Pop</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('splitToningMood')}>Split Toning Mood</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('detailCleanup')}>Detail Cleanup</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('bgBlur')}>Background Blur</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('bgRemove')}>Background Remove (PNG)</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('export2MB')}>Export 2 MB</Button>
          <Button size="sm" variant="secondary" onClick={() => addOrSelectEffect('rgbSplit')}>RGB Split</Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/editor')}>Open in Editor →</Button>
        </div>
      </div>

      <div className="demo-samples" role="tablist" aria-label="Sample images">
        {samples.map((s) => (
          <button
            key={s.key}
            className={`sample-chip ${selectedSample.key === s.key ? 'active' : ''}`}
            onClick={() => setSelectedSample(s)}
            role="tab"
            aria-selected={selectedSample.key === s.key}
            title={`Use ${s.name} sample`}
          >
            {s.name}
          </button>
        ))}
        <button
          className="open-in-editor-chip"
          onClick={() => navigate('/editor')}
          title="Open in full editor"
        >
          Open in Editor →
        </button>
      </div>

      <div className="demo-tabs">
        <button
          className={`tab-button ${activeTab === 'slider' ? 'active' : ''}`}
          onClick={() => setActiveTab('slider')}
        >
          Interactive Slider
        </button>
        <button
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Before/After Gallery
        </button>
      </div>

      <div className="demo-content">
        {activeTab === 'slider' ? (
          <div className="slider-demo">
            {/* Use EnhancedImageCanvas for live AI-driven preview */}
            <div className="demo-canvas-wrap" style={{ width: '100%', height: 420 }}>
              <EnhancedImageCanvas
                imageSrc={currentImage}
                edits={edits}
                showSlider={false}
                sliderPosition={50}
                // For demo, do not pass ai mask/alpha; the services return deltas; future: route masks from services
                ai={null}
                hasAlphaBackgroundRemoved={!!edits?.hasAlphaBackgroundRemoved}
                featherPx={2}
              />
            </div>
          </div>
        ) : (
          <div className="gallery-demo">
            <BeforeAfterDemo />
          </div>
        )}
      </div>

      {/* Effects list (left) — simple summary with enable/disable and select */}
      {layers?.length > 0 && (
        <div className="demo-effects-list">
          <Panel title="Applied Effects">
            <div style={{ display: 'grid', gap: 8 }}>
              {layers.map((l) => (
                <div key={l.id} className="effect-row" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button size="sm" variant={selectedEffectKey === l.type ? 'primary' : 'secondary'} onClick={() => setSelectedEffectKey(l.type)}>
                      {effectsRegistry[l.type]?.label || l.type}
                    </Button>
                    <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                      {l.enabled === false ? '(disabled)' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="secondary" onClick={() => toggleLayer(l.type)}>{l.enabled === false ? 'Enable' : 'Disable'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => removeLayer(l.type)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Right-side dynamic panel (minimal placeholder) */}
      {selectedEffectKey && (
        <div className="demo-sidepanel">
          <Panel title={`Effect: ${effectsRegistry[selectedEffectKey]?.label || selectedEffectKey}`}>
            <div style={{ display: 'grid', gap: 8 }}>
              {/* Minimal param controls per common keys; detailed per-effect UIs will be added later */}
              {effectsRegistry[selectedEffectKey]?.defaults?.strength !== undefined && (
                <div className="field">
                  <label>Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={layers.find(l => l.type === selectedEffectKey)?.params?.strength ?? effectsRegistry[selectedEffectKey].defaults.strength}
                    onChange={(e) => updateLayerParams(selectedEffectKey, { strength: Number(e.target.value) })}
                  />
                </div>
              )}
              {selectedEffectKey === 'landscape' && (
                <>
                  <div className="field">
                    <label><input
                      type="checkbox"
                      checked={!!(layers.find(l => l.type === 'landscape')?.params?.skyBoost ?? true)}
                      onChange={(e) => updateLayerParams('landscape', { skyBoost: e.target.checked })}
                    /> Sky Boost</label>
                  </div>
                  <div className="field">
                    <label><input
                      type="checkbox"
                      checked={!!(layers.find(l => l.type === 'landscape')?.params?.textureBoost ?? true)}
                      onChange={(e) => updateLayerParams('landscape', { textureBoost: e.target.checked })}
                    /> Texture Boost</label>
                  </div>
                </>
              )}
              {selectedEffectKey === 'bgRemove' && (
                <div className="field">
                  <label>Feather</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={layers.find(l => l.type === 'bgRemove')?.params?.feather ?? effectsRegistry['bgRemove'].defaults.feather}
                    onChange={(e) => updateLayerParams('bgRemove', { feather: Number(e.target.value) })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <Button size="sm" variant="primary" onClick={() => runEffect(selectedEffectKey)}>Run</Button>
                <Button size="sm" variant="secondary" onClick={() => toggleLayer(selectedEffectKey)}>
                  {layers.find(l => l.type === selectedEffectKey)?.enabled === false ? 'Enable' : 'Disable'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeLayer(selectedEffectKey)}>Remove</Button>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <div className="demo-cta">
        <Card
          title="Move beyond the basics"
          subtitle="Open the full editor to try WB region, RGB split, and target‑size export."
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="md" onClick={() => navigate('/editor')}>Open Editor</Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/workflow')}>Create Workflow</Button>
            </div>
          }
          variant="elevated"
        >
          {/* Keep existing layout classes; minimal markup inside Card */}
        </Card>
      </div>
    </div>
  );
};

export default DemoPage;
