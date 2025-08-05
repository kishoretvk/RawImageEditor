/**
 * Lens Correction Node
 * Real implementation that wraps src/utils/lensCorrection.js
 * Input: ImageData (or OffscreenCanvas/canvas) in ctx, plus params
 * Output: corrected ImageData
 */
import * as lens from '../../../utils/lensCorrection';

export const meta = {
  id: 'lensCorrection',
  label: 'Lens Correction',
  description: 'Apply distortion, chromatic aberration, and vignette correction',
  inputs: ['image'],
  outputs: ['image'],
  defaultParams: {
    profile: 'auto', // 'auto' | 'none' | profile id
    distortion: 0,   // fine tune override, -100..100
    caRed: 0,        // -100..100
    caBlue: 0,       // -100..100
    vignette: 0      // -100..100
  }
};

/**
 * run(ctx, params)
 * ctx: { canvas, imageData?, exif? }
 * returns { imageData }
 */
export async function run(ctx, params = {}) {
  const { canvas } = ctx;
  if (!canvas) throw new Error('LensCorrection: missing canvas');
  const cctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = cctx.getImageData(0, 0, canvas.width, canvas.height);

  // Resolve profile (auto -> from EXIF if available)
  const profile = await resolveProfile(params.profile, ctx.exif);

  const corrected = lens.applyLensCorrection(img, {
    distortion: clamp(params.distortion ?? 0, -100, 100),
    caRed: clamp(params.caRed ?? 0, -100, 100),
    caBlue: clamp(params.caBlue ?? 0, -100, 100),
    vignette: clamp(params.vignette ?? 0, -100, 100),
    profile
  });

  cctx.putImageData(corrected, 0, 0);
  return { imageData: corrected };
}

async function resolveProfile(sel, exif) {
  if (sel === 'none') return null;
  if (sel && sel !== 'auto') return { id: sel };
  // auto: best-effort match from EXIF
  const make = (exif?.Make || '').toLowerCase();
  const model = (exif?.Model || '').toLowerCase();
  const lensModel = (exif?.LensModel || '').toLowerCase();
  // Minimal heuristic; integrate real LCP lookup here.
  return { id: `auto:${make}:${model}:${lensModel}` };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
