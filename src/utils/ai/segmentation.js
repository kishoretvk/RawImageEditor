/**
 * segmentation.js (stub)
 * Person and sky segmentation entry points. Stubbed for PR2 wiring.
 * Real implementation will use TF.js models and return Uint8ClampedArray masks.
 */

export async function segmentPerson(image, options = {}) {
  // image: ImageBitmap | ImageData | HTMLCanvasElement
  const { width = 1024, height = 768 } = options;
  // Return just meta in stub
  return {
    maskMeta: { width, height, source: 'stub-person' },
    // mask: new Uint8ClampedArray(width * height) // to be added later
  };
}

export async function segmentSky(image, options = {}) {
  const { width = 1024, height = 768 } = options;
  return {
    maskMeta: { width, height, source: 'stub-sky' },
  };
}
