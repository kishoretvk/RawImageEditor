import React, { useState } from 'react';
import AICard from './AICard';
import PortraitEnhancePanel from './PortraitEnhancePanel';
import LandscapeEnhancePanel from './LandscapeEnhancePanel';
import BackgroundToolsPanel from './BackgroundToolsPanel';

export default function AITab({
  onPreviewPortrait,
  onApplyPortrait,
  onPreviewLandscape,
  onApplyLandscape,
  onPreviewBgBlur,
  onApplyBgBlur,
  onPreviewBgRemove,
  onApplyBgRemove,
  loading = false
}) {
  return (
    <div className="ai-tab" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <AICard
        title="Portrait Enhance"
        description="Subject-aware tonal and color adjustments (on-device)."
        loading={loading}
        actions={
          <>
            <button className="header-button" onClick={onPreviewPortrait}>Preview</button>
            <button className="header-button primary" onClick={onApplyPortrait}>Apply</button>
          </>
        }
      >
        <PortraitEnhancePanel />
      </AICard>

      <AICard
        title="Landscape Enhance"
        description="Sky/ground-aware enhancements (on-device)."
        loading={loading}
        actions={
          <>
            <button className="header-button" onClick={onPreviewLandscape}>Preview</button>
            <button className="header-button primary" onClick={onApplyLandscape}>Apply</button>
          </>
        }
      >
        <LandscapeEnhancePanel />
      </AICard>

      <AICard
        title="Background Tools"
        description="Blur or remove background using subject masks."
        loading={loading}
        actions={
          <>
            <button className="header-button" onClick={onPreviewBgBlur}>Preview Blur</button>
            <button className="header-button" onClick={onApplyBgBlur}>Apply Blur</button>
            <button className="header-button" onClick={onPreviewBgRemove}>Preview Remove</button>
            <button className="header-button primary" onClick={onApplyBgRemove}>Apply Remove</button>
          </>
        }
      >
        <BackgroundToolsPanel />
      </AICard>
    </div>
  );
}
