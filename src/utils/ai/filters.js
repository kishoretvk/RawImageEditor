/**
 * filters.js (stub)
 * Background blur and simple dehaze operations. Stubs for PR2 wiring.
 * Real implementation will run in worker with WASM kernels.
 */

export async function backgroundBlur({ imageMeta, blurStrength = 10 }) {
  return { applied: true, blurStrength, imageMeta };
}

export async function backgroundRemove({ imageMeta }) {
  return { applied: true, transparent: true, imageMeta };
}

export async function dehazeLite({ imageMeta, strength = 0.1 }) {
  return { applied: true, dehazeLite: strength, imageMeta };
}
