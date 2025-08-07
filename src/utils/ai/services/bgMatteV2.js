/**
 * bgMatteV2
 * Background matting utilities: high-quality background blur and background remove (alpha PNG).
 * Uses segmentation + matteRefine; returns edit deltas and masks for composition.
 *
 * API:
 *   await bgMatteV2.blur(image, { strength: 50 })    -> { editsDelta, masks, meta }
 *   await bgMatteV2.remove(image, { feather: 2.0 })  -> { editsDelta, masks, meta }
 */
import { runPersonSeg } from '../segmentation.js';
import { guidedRefine } from '../matteRefine.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

async function subjectMask(image) {
  // Ensure we have an ImageBitmap input for runPersonSeg
  let bitmap = image;
  if (!(bitmap instanceof ImageBitmap)) {
    try {
      if (image instanceof HTMLCanvasElement) {
        bitmap = await createImageBitmap(image);
      } else if (image instanceof OffscreenCanvas) {
        bitmap = await createImageBitmap(image.transferToImageBitmap());
      } else if (image instanceof HTMLImageElement) {
        bitmap = await createImageBitmap(image);
      } else if (image && typeof image.width === 'number' && typeof image.height === 'number' && image.data) {
        // ImageData-like
        const off = new OffscreenCanvas(image.width, image.height);
        off.getContext('2d').putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
        bitmap = await createImageBitmap(off);
      }
    } catch (e) {
      bitmap = null;
    }
  }

  let m = null;
  if (bitmap) {
    try {
      const seg = await runPersonSeg(bitmap, { targetSize: 384 });
      m = seg?.mask || null;
    } catch (e) {
      m = null;
    } finally {
      try { if (bitmap && typeof bitmap.close === 'function') bitmap.close(); } catch {}
    }
  }
  if (!m) return null;

  // guidedRefine is currently a stub; keep original mask but run to produce meta/telemetry
  await guidedRefine(
    { width: image?.width, height: image?.height },
    { width: image?.width, height: image?.height },
    { radius: 2, feather: 2.0 }
  );
  return m;
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
