/**
 * adjustmentPresets.js (stub)
 * Returns deterministic parameter deltas based on strength [0..100].
 * These params are consumed by the UI/canvas to compose non-destructive effects.
 */

export function getPortraitParams(strength = 50) {
  const s = Math.max(0, Math.min(100, Number(strength) || 0)) / 100;
  return {
    exposureDelta: +(0.10 * s).toFixed(4),
    contrastMid: +(0.15 * s).toFixed(4),
    warmthBias: +(0.08 * s).toFixed(4),
    clarityDelta: +(-0.05 * s).toFixed(4),
    saturationDelta: +(0.05 * s).toFixed(4),
    vibranceDelta: +(0.04 * s).toFixed(4),
  };
}

export function getLandscapeParams(strength = 50) {
  const s = Math.max(0, Math.min(100, Number(strength) || 0)) / 100;
  return {
    sky: {
      dehazeLite: +(0.12 * s).toFixed(4),
      hueShift: +(0.04 * s).toFixed(4),
      clarity: +(0.08 * s).toFixed(4),
    },
    ground: {
      vibrance: +(0.10 * s).toFixed(4),
      texture: +(0.08 * s).toFixed(4),
    },
    global: {
      curveMid: +(0.08 * s).toFixed(4),
    },
  };
}
