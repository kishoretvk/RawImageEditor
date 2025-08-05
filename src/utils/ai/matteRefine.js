/**
 * matteRefine.js (stub)
 * API surface for matte refinement. Real impl will use a WASM guided filter
 * or fast bilateral to edge-refine subject/sky masks.
 */

export async function guidedRefine(maskMeta, imageMeta, options = {}) {
  // maskMeta: { width, height, ... }
  // imageMeta: optional info about image dims/color space
  // options: { radius, eps, feather }
  return {
    maskMeta,
    refined: true,
    options
  };
}
