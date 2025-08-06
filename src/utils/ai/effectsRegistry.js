/**
 * effectsRegistry
 * Central registry for DemoPage effects with a uniform contract:
 * effect.run(image, params, helpers) => Promise<{ editsDelta, masks?, meta? }>
 *
 * Also includes a composition reducer that merges layered editsDelta into a single
 * EnhancedImageCanvas-compatible edits object.
 */
import { portraitEnhanceV2 } from './services/portraitEnhanceV2';
import { landscapeEnhanceV2 } from './services/landscapeEnhanceV2';
import { bgMatteV2 } from './services/bgMatteV2';

// Utility: deep merge for known edit shapes with additive semantics
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function mergeNumber(a, b) {
  if (typeof a !== 'number' && typeof b !== 'number') return undefined;
  const av = typeof a === 'number' ? a : 0;
  const bv = typeof b === 'number' ? b : 0;
  return av + bv;
}
function mergeObject(target, delta) {
  const out = { ...(target || {}) };
  for (const k of Object.keys(delta || {})) {
    const dv = delta[k];
    const tv = out[k];
    if (typeof dv === 'number') {
      out[k] = mergeNumber(tv, dv);
    } else if (dv && typeof dv === 'object' && !Array.isArray(dv)) {
      out[k] = mergeObject(tv || {}, dv);
    } else {
      out[k] = dv;
    }
  }
  return out;
}

/**
 * Reduce an array of effect layers into final edits object.
 * layers: [{ id, type, params, enabled, result?: { editsDelta, masks, meta } }]
 * Returns { edits, masksIndex } where masksIndex maps layerId -> masks.
 */
export function reduceComposition(layers) {
  const edits = {
    adjustments: {},
    colorAdjustments: {},
    detailAdjustments: {},
    effects: {},
    splitToning: undefined,
    hslAdjustments: undefined,
    hasAlphaBackgroundRemoved: false
  };
  const masksIndex = {};

  for (const layer of (layers || [])) {
    if (layer && layer.enabled !== false && layer.result && layer.result.editsDelta) {
      const d = layer.result.editsDelta;

      if (d.adjustments) {
        edits.adjustments = mergeObject(edits.adjustments, d.adjustments);
      }
      if (d.colorAdjustments) {
        edits.colorAdjustments = mergeObject(edits.colorAdjustments, d.colorAdjustments);
      }
      if (d.detailAdjustments) {
        edits.detailAdjustments = mergeObject(edits.detailAdjustments, d.detailAdjustments);
      }
      if (d.effects) {
        edits.effects = mergeObject(edits.effects, d.effects);
        // Clamp blur range 0..100 if present
        if (typeof edits.effects.blur === 'number') {
          edits.effects.blur = Math.max(0, Math.min(100, edits.effects.blur));
        }
      }
      if (d.splitToning) {
        // Latest splitToning wins (can be extended to merge)
        edits.splitToning = { ...(edits.splitToning || {}), ...d.splitToning };
      }
      if (d.hslAdjustments) {
        // Replace or shallow-merge
        edits.hslAdjustments = { ...(edits.hslAdjustments || {}), ...d.hslAdjustments };
      }
      if (d.hslHints) {
        // Hints for UI only; ignored by canvas unless mapped externally
        edits.hslHints = { ...(edits.hslHints || {}), ...d.hslHints };
      }
      if (d.hasAlphaBackgroundRemoved) {
        edits.hasAlphaBackgroundRemoved = !!d.hasAlphaBackgroundRemoved;
      }
      if (layer.result.masks) {
        masksIndex[layer.id] = layer.result.masks;
      }
    }
  }
  return { edits, masksIndex };
}

/**
 * Built-in effects registry
 * Each entry exposes:
 *  - id
 *  - label
 *  - defaults: params defaults
 *  - run(image, params, helpers) -> Promise<{ editsDelta, masks?, meta? }>
 */
export const effectsRegistry = {
  portrait: {
    id: 'portrait',
    label: 'Portrait Enhance',
    defaults: { strength: 50, preserveSkinTone: true },
    async run(image, params, helpers) {
      return await portraitEnhanceV2.run(image, params);
    }
  },
  landscape: {
    id: 'landscape',
    label: 'Landscape Enhance',
    defaults: { strength: 50, skyBoost: true, textureBoost: true },
    async run(image, params, helpers) {
      return await landscapeEnhanceV2.run(image, params);
    }
  },
  bgBlur: {
    id: 'bgBlur',
    label: 'Background Blur',
    defaults: { strength: 50 },
    async run(image, params, helpers) {
      return await bgMatteV2.blur(image, params);
    }
  },
  bgRemove: {
    id: 'bgRemove',
    label: 'Background Remove (PNG)',
    defaults: { feather: 2.0 },
    async run(image, params, helpers) {
      return await bgMatteV2.remove(image, params);
    }
  },
  // Computed deltas (non-AI initial implementations)
  hslPop: {
    id: 'hslPop',
    label: 'HSL Pop',
    defaults: { saturationBoost: 15, target: 'auto' }, // target: auto | blues | greens | reds
    async run(image, params, helpers) {
      const sat = Math.max(0, Math.min(100, Number(params?.saturationBoost ?? 15)));
      // Simple default; future: detect dominant hue via histogram
      const adjustments = {
        // UI will interpret and turn into hslAdjustments bands
      };
      return {
        editsDelta: {
          colorAdjustments: { saturation: sat },
          hslHints: { target: params?.target || 'auto', saturation: sat }
        },
        meta: { type: 'computed', params }
      };
    }
  },
  splitToningMood: {
    id: 'splitToningMood',
    label: 'Split Toning Mood',
    defaults: { preset: 'cinematicWarm' }, // cinematicWarm | tealOrangeLight | coolNight
    async run(image, params) {
      const preset = params?.preset || 'cinematicWarm';
      let st = { highlightsHue: 205, highlightsSat: 8, shadowsHue: 35, shadowsSat: 6, balance: 0 };
      if (preset === 'tealOrangeLight') {
        st = { highlightsHue: 200, highlightsSat: 6, shadowsHue: 28, shadowsSat: 6, balance: 0 };
      } else if (preset === 'coolNight') {
        st = { highlightsHue: 220, highlightsSat: 7, shadowsHue: 240, shadowsSat: 8, balance: -5 };
      }
      return { editsDelta: { splitToning: st }, meta: { preset } };
    }
  },
  detailCleanup: {
    id: 'detailCleanup',
    label: 'Detail Cleanup',
    defaults: { lumaNR: 20, chromaNR: 15, sharpenBias: 10 },
    async run(image, params) {
      const lumaNR = Math.max(0, Math.min(100, Number(params?.lumaNR ?? 20)));
      const chromaNR = Math.max(0, Math.min(100, Number(params?.chromaNR ?? 15)));
      const sharpenBias = Math.max(0, Math.min(100, Number(params?.sharpenBias ?? 10)));
      return {
        editsDelta: {
          detailAdjustments: {
            lumaNR,
            chromaNR,
            sharpenAmount: 40 + Math.round(sharpenBias * 0.8)
          }
        },
        meta: { type: 'computed', params: { lumaNR, chromaNR, sharpenBias } }
      };
    }
  },
  // Utility hooks (non-edit effects)
  export2MB: {
    id: 'export2MB',
    label: 'Export 2 MB',
    defaults: { targetMB: 2.0, tolerance: 0.05, allowDownscale: false },
    async run(image, params, helpers) {
      // helpers.getProcessedCanvas required
      const canvas = helpers?.getProcessedCanvas?.();
      if (!canvas) {
        return { editsDelta: {}, meta: { error: 'no-canvas' } };
      }
      const { toJPEGTargetSize } = await import('../imageProcessing.js');
      const { blob } = await toJPEGTargetSize(canvas, params?.targetMB ?? 2.0, {
        tolerance: params?.tolerance ?? 0.05,
        allowDownscale: params?.allowDownscale ?? false
      });
      return { editsDelta: {}, meta: { exported: !!blob, blob } };
    }
  },
  rgbSplit: {
    id: 'rgbSplit',
    label: 'RGB Split',
    defaults: { source: 'processed' }, // processed | original
    async run(image, params, helpers) {
      // helpers.onSplitChannels expected to trigger split
      helpers?.onSplitChannels?.(params?.source === 'original' ? 'original' : 'processed');
      return { editsDelta: {}, meta: { triggered: true } };
    }
  }
};

/**
 * Convenience helpers to work with registry
 */
export function getEffect(key) {
  return effectsRegistry[key] || null;
}

export function listEffects() {
  return Object.values(effectsRegistry);
}
