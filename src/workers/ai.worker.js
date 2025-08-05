/* eslint-disable no-restricted-globals */
// ai.worker.js (stubbed worker for PR2 wiring)
// Implements a message protocol without heavy model execution yet.
// Later we will import TF.js and real segmentation/models.

const ctx = self;

// Simple message protocol:
// { id, type, payload }
// Responses mirror { id, ok, type, payload, error }
function respond(id, type, payload, ok = true, error = null) {
  ctx.postMessage({ id, ok, type, payload, error });
}

ctx.onmessage = async (event) => {
  const { id, type, payload = {} } = event.data || {};
  try {
    switch (type) {
      case 'init': {
        // In real impl: lazy-load tfjs + select backend
        respond(id, type, { status: 'ready', backend: 'stub' });
        break;
      }

      case 'segmentPerson': {
        // Return a mocked mask meta (no pixels for now)
        const { width = 1024, height = 768 } = payload;
        respond(id, type, {
          maskMeta: { width, height, source: 'stub-person' },
        });
        break;
      }

      case 'segmentSky': {
        const { width = 1024, height = 768 } = payload;
        respond(id, type, {
          maskMeta: { width, height, source: 'stub-sky' },
        });
        break;
      }

      case 'refineMask': {
        // No-op refinement for now
        const { maskMeta } = payload;
        respond(id, type, { maskMeta, refined: true });
        break;
      }

      case 'backgroundBlur': {
        const { blurStrength = 10 } = payload;
        respond(id, type, { applied: true, blurStrength });
        break;
      }

      case 'backgroundRemove': {
        respond(id, type, { applied: true, transparent: true });
        break;
      }

      case 'portraitEnhance': {
        const { strength = 50 } = payload;
        // Return mock adjustment params scaled by strength
        respond(id, type, {
          params: {
            exposureDelta: 0.1 * (strength / 100),
            contrastMid: 0.15 * (strength / 100),
            warmthBias: 0.08 * (strength / 100),
            clarityDelta: -0.05 * (strength / 100),
            saturationDelta: 0.05 * (strength / 100),
            vibranceDelta: 0.04 * (strength / 100)
          }
        });
        break;
      }

      case 'landscapeEnhance': {
        const { strength = 50 } = payload;
        respond(id, type, {
          params: {
            sky: { dehazeLite: 0.12 * (strength / 100), hueShift: 0.04 * (strength / 100), clarity: 0.08 * (strength / 100) },
            ground: { vibrance: 0.1 * (strength / 100), texture: 0.08 * (strength / 100) },
            global: { curveMid: 0.08 * (strength / 100) }
          }
        });
        break;
      }

      default: {
        respond(id, type, null, false, `Unknown message type: ${type}`);
      }
    }
  } catch (err) {
    respond(id, type, null, false, err?.message || String(err));
  }
};
