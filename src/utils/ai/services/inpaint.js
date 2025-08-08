import { callAI } from '../worker';

/**
 * Calls the AI worker to perform an inpainting operation.
 * @param {Worker} worker - The AI worker instance.
 * @param {HTMLCanvasElement} imageCanvas - The canvas containing the source image.
 * @param {HTMLCanvasElement} maskCanvas - The canvas containing the inpainting mask.
 * @returns {Promise<ImageData>} - A promise that resolves with the inpainted image data.
 */
export async function inpaint(worker, imageCanvas, maskCanvas) {
  const image = imageCanvas.getContext('2d').getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  const mask = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  const result = await callAI(worker, 'inpaint', { image, mask });

  if (result.ok) {
    return result.payload.image;
  } else {
    throw new Error(result.error || 'Inpainting failed');
  }
}
