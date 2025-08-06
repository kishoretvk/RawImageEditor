/**
 * portraitEnhanceV2
 * State-of-the-art portrait enhancement using segmentation + matte refine and adaptive filters.
 * Returns an edit delta compatible with EnhancedImageCanvas edits model, plus optional masks.
 *
 * API:
 *   await portraitEnhanceV2.run(image, { strength: 50, preserveSkinTone: true })
 * -> { editsDelta, masks, meta }
 */
import { loadSegmentationModel, segment } from '../../segmentation';
import { matteRefine } from '../../matteRefine';
import * as F from '../../filters';

// Utility: clamp 0..1
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export const portraitEnhanceV2 = {
  id: 'portraitEnhanceV2',
  label: 'Portrait Enhance v2',

  /**
   * image: HTMLImageElement | ImageBitmap | OffscreenCanvas | {width,height,data}
   * params: { strength?: number (0..100), preserveSkinTone?: boolean }
   */
  async run(image, params = {}) {
    const strength = Number.isFinite(params.strength) ? params.strength : 50;
    const preserveSkin = params.preserveSkinTone !== false;

    // 1) Segment person regions
    await loadSegmentationModel();
    const seg = await segment(image, { classes: ['person'] });
    const personMask = seg?.masks?.person || null;

    // 2) Matte refine to improve edges for hair/shoulders
    const refinedMask = personMask ? await matteRefine(image, personMask, { iterations: 2 }) : null;

    // 3) Compute adaptive parameters from strength
    const t = clamp01(strength / 100);
    const exposureDelta = (0.10 * t);             // up to +0.10 stops equivalent
    const contrastMid = (0.10 * t);               // midtone contrast
    const warmthBias = preserveSkin ? (0.05 * t) : (0.02 * t);
    const saturationDelta = (0.12 * t);
    const vibranceDelta = (0.12 * t);
    const skinSmoothing = (0.35 * t);             // to luma/chroma NR

    // 4) Use filters to prepare per-region masks if needed (future expansion)
    // For now we compose a generic delta that the composition pipeline maps to edits.

    // 5) Construct edits delta
    const editsDelta = {
      adjustments: {
        exposure: exposureDelta,
        contrast: Math.round(contrastMid * 100)
      },
      colorAdjustments: {
        temperature: Math.round(warmthBias * 100),
        saturation: Math.round(saturationDelta * 100)
      },
      detailAdjustments: {
        lumaNR: Math.round(skinSmoothing * 40),   // mild skin smoothing
        chromaNR: Math.round(skinSmoothing * 30),
        sharpenAmount: Math.round((0.2 * t) * 80) + 40 // gentle sharpen bias
      }
    };

    // 6) Metadata for UI
    const meta = {
      usedSegmentation: !!personMask,
      refined: !!refinedMask,
      params: { strength, preserveSkinTone: preserveSkin }
    };

    return {
      editsDelta,
      masks: { subject: refinedMask || personMask || null },
      meta
    };
  }
};

export default portraitEnhanceV2;
