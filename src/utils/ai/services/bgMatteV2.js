/**
 * bgMatteV2
 * Background matting utilities: high-quality background blur and background remove (alpha PNG).
 * Uses segmentation + matteRefine; returns edit deltas and masks for composition.
 *
 * API:
 *   await bgMatteV2.blur(image, { strength: 50 })    -> { editsDelta, masks, meta }
 *   await bgMatteV2.remove(image, { feather: 2.0 })  -> { editsDelta, masks, meta }
 */
import { loadSegmentationModel, segment } from '../../segmentation';
import { matteRefine } from '../../matteRefine';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

async function subjectMask(image) {
  await loadSegmentationModel();
  const seg = await segment(image, { classes: ['person', 'main'] }); // model-dependent
  const m = seg?.masks?.person || seg?.masks?.main || null;
  return m ? await matteRefine(image, m, { iterations: 2 }) : null;
}

export const bgMatteV2 = {
  id: 'bgMatteV2',
  label: 'Background Matte v2',

  /**
   * Background blur while keeping subject sharp
   * params: { strength?: number (0..100) }
   */
  async blur(image, params = {}) {
    const strength = Number.isFinite(params.strength) ? params.strength : 50;
    const t = clamp01(strength / 100);

    const mask = await subjectMask(image);

    // Canvas renderer will interpret: keep subject sharp via mask, blur background to target amount
    const editsDelta = {
      effects: {
        blur: Math.round(100 * t) // use existing EffectsPanel blur param as baseline (0..100)
      }
    };

    const meta = {
      usedSegmentation: !!mask,
      params: { strength }
    };

    return {
      editsDelta,
      masks: { subject: mask },
      meta
    };
  },

  /**
   * Background remove — produce alpha premultiplied matte (subject opaque, background transparent).
   * params: { feather?: number (px, for UI hint only) }
   */
  async remove(image, params = {}) {
    const feather = Number.isFinite(params.feather) ? params.feather : 2.0;

    const mask = await subjectMask(image);

    // Consumer should set PNG export default; canvas shows checkerboard backdrop
    const editsDelta = {
      // Signal downstream to keep PNG and consider alpha during export
      hasAlphaBackgroundRemoved: true
    };

    const meta = {
      usedSegmentation: !!mask,
      params: { feather }
    };

    return {
      editsDelta,
      masks: { alpha: mask }, // consumer comp should treat this as alpha
      meta
    };
  }
};

export default bgMatteV2;
