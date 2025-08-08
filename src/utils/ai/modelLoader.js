/**
 * modelLoader.js
 * AI model loading and management
 * Handles model downloading, caching, and worker communication
 */

import modelCache from './modelCache.js';
import { createWorker } from '../../utils/workerPool.js';

// Model registry
const MODEL_REGISTRY = {
  'portrait-enhance-v2': {
    url: 'https://huggingface.co/kishoretvk/raw-image-editor-models/resolve/main/portrait-enhance-v2.onnx',
    size: 15728640, // ~15MB
    inputShape: [1, 3, 512, 512],
    outputShape: [1, 3, 512, 512],
    description: 'Portrait enhancement model v2'
  },
  'landscape-enhance-v2': {
    url: 'https://huggingface.co/kishoretvk/raw-image-editor-models/resolve/main/landscape-enhance-v2.onnx',
    size: 20971520, // ~20MB
    inputShape: [1, 3, 512, 512],
    outputShape: [1, 3, 512, 512],
    description: 'Landscape enhancement model v2'
  },
  'bg-matte-v2': {
    url: 'https://huggingface.co/kishoretvk/raw-image-editor-models/resolve/main/bg-matte-v2.onnx',
    size: 10485760, // ~10MB
    inputShape: [1, 3, 512, 512],
    outputShape: [1, 1, 512, 512],
    description: 'Background matting model v2'
  }
};

class ModelLoader {
  constructor() {
    this.workers = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Get model info
   */
  getModelInfo(modelId) {
    return MODEL_REGISTRY[modelId] || null;
  }

  /**
   * Check if model is available
   */
  isModelAvailable(modelId) {
    return modelId in MODEL_REGISTRY;
  }

  /**
   * List available models
   */
  listAvailableModels() {
    return Object.entries(MODEL_REGISTRY).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  /**
   * Load a model
   */
  async loadModel(modelId, options = {}) {
    if (!this.isModelAvailable(modelId)) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Check if already loading
    if (this.loadingPromises.has(modelId)) {
      return this.loadingPromises.get(modelId);
    }

    const loadPromise = this._loadModelInternal(modelId, options);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  /**
   * Internal model loading
   */
  async _loadModelInternal(modelId, options) {
    const modelInfo = this.getModelInfo(modelId);
    
    try {
      // Check cache first
      const cached = await modelCache.getCachedModel(modelId);
      if (cached && !options.forceReload) {
        console.log(`Using cached model: ${modelId}`);
        return cached;
      }

      // Download model
      console.log(`Downloading model: ${modelId}`);
      const modelData = await this.downloadModel(modelInfo.url);

      // Cache model
      await modelCache.cacheModel(modelId, modelData, {
        name: modelInfo.description,
        version: '1.0.0',
        size: modelInfo.size,
        inputShape: modelInfo.inputShape,
        outputShape: modelInfo.outputShape
      });

      return {
        id: modelId,
        data: modelData,
        ...modelInfo
      };
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Download model file
   */
  async downloadModel(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to download model:', error);
      throw error;
    }
  }

  /**
   * Create a worker for model processing
   */
  async createWorker(modelId) {
    if (this.workers.has(modelId)) {
      return this.workers.get(modelId);
    }

    try {
      // Load model data
      const modelData = await this.loadModel(modelId);
      
      // Create worker
      const worker = createWorker('/src/workers/ai.worker.js');
      
      // Convert ArrayBuffer to blob URL for worker
      const blob = new Blob([modelData.data], { type: 'application/octet-stream' });
      const modelUrl = URL.createObjectURL(blob);

      // Load model in worker
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Worker timeout')), 30000);
        
        worker.onmessage = (event) => {
          clearTimeout(timeout);
          if (event.data.type === 'modelLoaded') {
            resolve();
          } else if (event.data.type === 'error') {
            reject(new Error(event.data.error));
          }
        };

        worker.postMessage({
          type: 'loadModel',
          data: {
            modelPath: modelUrl,
            options: {
              backend: 'wasm'
            }
          }
        });
      });

      this.workers.set(modelId, worker);
      return worker;
    } catch (error) {
      console.error(`Failed to create worker for ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Run inference with worker
   */
  async runInference(modelId, inputData, options = {}) {
    const worker = await this.createWorker(modelId);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Inference timeout')), 60000);

      worker.onmessage = (event) => {
        clearTimeout(timeout);
        
        if (event.data.type === 'inferenceComplete') {
          resolve(event.data.data);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      };

      worker.postMessage({
        type: 'runInference',
        data: {
          inputData,
          options
        }
      });
    });
  }

  /**
   * Get cache status
   */
  async getCacheStatus() {
    return await modelCache.getCacheStats();
  }

  /**
   * Clear model cache
   */
  async clearCache() {
    await modelCache.clearCache();
    await this.terminateAllWorkers();
  }

  /**
   * Terminate all workers
   */
  async terminateAllWorkers() {
    const promises = Array.from(this.workers.values()).map(worker => {
      worker.terminate();
      return Promise.resolve();
    });
    
    await Promise.all(promises);
    this.workers.clear();
  }

  /**
   * Preload models
   */
  async preloadModels(modelIds = []) {
    const promises = modelIds.map(id => this.loadModel(id));
    await Promise.allSettled(promises);
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(modelId) {
    if (this.loadingPromises.has(modelId)) {
      return { loading: true, progress: 0 };
    }
    
    return { loading: false, progress: 100 };
  }
}

// Global instance
const modelLoader = new ModelLoader();

// Export both the class and global instance
export { ModelLoader };
export default modelLoader;

// Convenience functions
export const loadModel = (modelId, options) => modelLoader.loadModel(modelId, options);
export const getModelInfo = (modelId) => modelLoader.getModelInfo(modelId);
export const listAvailableModels = () => modelLoader.listAvailableModels();
export const runInference = (modelId, inputData, options) => modelLoader.runInference(modelId, inputData, options);
export const getCacheStatus = () => modelLoader.getCacheStatus();
export const clearCache = () => modelLoader.clearCache();
export const preloadModels = (modelIds) => modelLoader.preloadModels(modelIds);
