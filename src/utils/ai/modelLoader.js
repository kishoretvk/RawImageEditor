/**
 * modelLoader.js
 * AI model loading and management
 */

import * as ort from 'onnxruntime-web';

export class ModelLoader {
  constructor(models) {
    this.models = models;
    this.sessions = new Map();
    this.initPromise = null;
  }

  async init({ preferWebGPU = true } = {}) {
    if (!this.initPromise) {
      this.initPromise = this._init(preferWebGPU);
    }
    return this.initPromise;
  }

  async _init(preferWebGPU) {
    try {
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ort.env.wasm.simd = true;
      
      const backend = preferWebGPU && await this.supportsWebGPU() ? 'webgpu' : 'wasm';
      return { backend };
    } catch (error) {
      console.error('ONNX Runtime init failed:', error);
      return { backend: 'wasm' };
    }
  }

  async supportsWebGPU() {
    return typeof navigator.gpu?.requestAdapter === 'function';
  }

  async getSession(modelName) {
    if (this.sessions.has(modelName)) {
      return this.sessions.get(modelName);
    }

    const model = this.models[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const { backend } = await this.init();
    const session = await ort.InferenceSession.create(model.url, {
      executionProviders: [backend],
    });

    this.sessions.set(modelName, session);
    return session;
  }

  async preload(modelNames) {
    const promises = modelNames.map(name => this.getSession(name));
    await Promise.all(promises);
  }
}
