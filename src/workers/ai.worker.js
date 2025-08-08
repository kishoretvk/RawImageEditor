/**
 * ai.worker.js
 * Web Worker for AI model processing
 * Handles model inference in a separate thread
 */

// Import ONNX Runtime Web
import * as ort from 'onnxruntime-web';

// Worker state
let session = null;
let currentModel = null;
let isProcessing = false;

// Message handlers
self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'loadModel':
        await handleLoadModel(data);
        break;
      case 'runInference':
        await handleRunInference(data);
        break;
      case 'unloadModel':
        await handleUnloadModel();
        break;
      case 'getStatus':
        handleGetStatus();
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message || error.toString()
    });
  }
};

/**
 * Load a model
 */
async function handleLoadModel({ modelPath, options = {} }) {
  try {
    if (session) {
      await session.release();
    }

    const sessionOptions = {
      executionProviders: [options.backend || 'wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      ...options.sessionOptions
    };

    session = await ort.InferenceSession.create(modelPath, sessionOptions);
    currentModel = modelPath;

    self.postMessage({
      type: 'modelLoaded',
      data: {
        modelPath,
        inputNames: session.inputNames,
        outputNames: session.outputNames
      }
    });
  } catch (error) {
    throw new Error(`Failed to load model: ${error.message}`);
  }
}

/**
 * Run inference
 */
async function handleRunInference({ inputData, options = {} }) {
  if (!session) {
    throw new Error('No model loaded');
  }

  if (isProcessing) {
    throw new Error('Already processing');
  }

  isProcessing = true;

  try {
    // Prepare input tensors
    const feeds = {};
    for (const [name, tensorData] of Object.entries(inputData)) {
      const { data, dims, type = 'float32' } = tensorData;
      feeds[name] = new ort.Tensor(type, data, dims);
    }

    // Run inference
    const startTime = performance.now();
    const results = await session.run(feeds);
    const inferenceTime = performance.now() - startTime;

    // Convert results to transferable format
    const outputData = {};
    for (const [name, tensor] of Object.entries(results)) {
      outputData[name] = {
        data: tensor.data,
        dims: tensor.dims,
        type: tensor.type
      };
    }

    self.postMessage({
      type: 'inferenceComplete',
      data: {
        results: outputData,
        inferenceTime
      }
    }, Object.values(outputData).map(o => o.data.buffer));
  } catch (error) {
    throw new Error(`Inference failed: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Unload current model
 */
async function handleUnloadModel() {
  if (session) {
    await session.release();
    session = null;
    currentModel = null;
  }

  self.postMessage({
    type: 'modelUnloaded'
  });
}

/**
 * Get worker status
 */
function handleGetStatus() {
  self.postMessage({
    type: 'status',
    data: {
      hasModel: !!session,
      currentModel,
      isProcessing,
      inputNames: session ? session.inputNames : [],
      outputNames: session ? session.outputNames : []
    }
  });
}

// Handle worker termination
self.onerror = (error) => {
  console.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error.message || error.toString()
  });
};

// Cleanup on close
self.addEventListener('beforeunload', async () => {
  if (session) {
    await session.release();
  }
});
