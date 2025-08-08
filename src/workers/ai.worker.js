/**
 * ai.worker.js
 * Web Worker for AI model processing
 * Manages an AIRuntime instance and delegates tasks to it.
 */

import { AIRuntime } from '../utils/ai/runtime';

let runtime = null;

// Respond to messages from the main thread
self.onmessage = async (event) => {
  const { id, type, payload } = event.data;

  try {
    // Lazy-init the runtime on first use
    if (!runtime) {
      runtime = new AIRuntime();
    }

    let result = null;
    switch (type) {
      case 'initRuntime':
        const { backend } = await runtime.init(payload);
        result = { ok: true, backend };
        break;
      
      case 'preloadModels':
        const { list } = payload;
        await runtime.preload(list);
        result = { ok: true };
        break;

      case 'portraitEnhance':
        result = await runtime.runPortraitEnhance(payload);
        break;
      
      case 'landscapeEnhance':
        result = await runtime.runLandscapeEnhance(payload);
        break;

      case 'backgroundBlur':
        result = await runtime.runBackgroundBlur(payload);
        break;

      case 'backgroundRemove':
        result = await runtime.runBackgroundRemove(payload);
        break;
      
      case 'inpaint':
        result = await runtime.runInpainting(payload);
        break;

      default:
        throw new Error(`Unknown AI worker task type: ${type}`);
    }

    self.postMessage({ id, type, ok: true, payload: result });

  } catch (error) {
    self.postMessage({
      id,
      type,
      ok: false,
      error: error.message || 'An unknown error occurred in the AI worker.'
    });
  }
};

self.onerror = (error) => {
  console.error('AI Worker unhandled error:', error);
};
