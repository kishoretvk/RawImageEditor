/**
 * runtime.js
 * ONNX Runtime Web integration and backend management
 * Handles runtime initialization and session creation
 */

// Import ONNX Runtime Web
import * as ort from 'onnxruntime-web';

// Runtime configuration
const RUNTIME_CONFIG = {
  webgpu: {
    name: 'WebGPU',
    supported: () => 'gpu' in navigator,
    priority: 1
  },
  webgl: {
    name: 'WebGL',
    supported: () => {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
    },
    priority: 2
  },
  wasm: {
    name: 'WebAssembly',
    supported: () => typeof WebAssembly !== 'undefined',
    priority: 3
  }
};

class RuntimeManager {
  constructor() {
    this.initialized = false;
    this.currentBackend = null;
    this.sessions = new Map();
    this.initPromise = this.init();
  }

  async init() {
    if (this.initialized) return;

    try {
      // Configure ONNX Runtime
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ort.env.wasm.simd = true;
      
      // Enable profiling in development
      if (import.meta.env.DEV) {
        ort.env.logLevel = 'verbose';
      }

      this.initialized = true;
      console.log('ONNX Runtime initialized');
    } catch (error) {
      console.error('Failed to initialize ONNX Runtime:', error);
      throw error;
    }
  }

  /**
   * Get available backends
   */
  getAvailableBackends() {
    return Object.entries(RUNTIME_CONFIG)
      .filter(([key, config]) => config.supported())
      .map(([key, config]) => ({
        key,
        name: config.name,
        priority: config.priority
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the best available backend
   */
  getBestBackend() {
    const available = this.getAvailableBackends();
    return available.length > 0 ? available[0].key : 'wasm';
  }

  /**
   * Create a new session
   */
  async createSession(modelPath, options = {}) {
    await this.initPromise;

    const backend = options.backend || this.getBestBackend();
    const sessionOptions = {
      executionProviders: [backend],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      ...options.sessionOptions
    };

    try {
      const session = await ort.InferenceSession.create(modelPath, sessionOptions);
      
      // Store session info
      const sessionInfo = {
        session,
        backend,
        modelPath,
        created: Date.now()
      };
      
      this.sessions.set(modelPath, sessionInfo);
      
      console.log(`Created session for ${modelPath} with backend: ${backend}`);
      
      return {
        session,
        backend,
        inputNames: session.inputNames,
        outputNames: session.outputNames
      };
    } catch (error) {
      console.error(`Failed to create session for ${modelPath}:`, error);
      
      // Try fallback backends
      if (backend !== 'wasm') {
        console.log(`Trying fallback backend: wasm`);
        try {
          const fallbackOptions = { ...sessionOptions, executionProviders: ['wasm'] };
          const session = await ort.InferenceSession.create(modelPath, fallbackOptions);
          
          const sessionInfo = {
            session,
            backend: 'wasm',
            modelPath,
            created: Date.now()
          };
          
          this.sessions.set(modelPath, sessionInfo);
          
          return {
            session,
            backend: 'wasm',
            inputNames: session.inputNames,
            outputNames: session.outputNames
          };
        } catch (fallbackError) {
          console.error('Fallback backend also failed:', fallbackError);
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get session info
   */
  getSessionInfo(modelPath) {
    return this.sessions.get(modelPath) || null;
  }

  /**
   * Close a session
   */
  async closeSession(modelPath) {
    const sessionInfo = this.sessions.get(modelPath);
    if (sessionInfo) {
      try {
        await sessionInfo.session.release();
        this.sessions.delete(modelPath);
        console.log(`Closed session for ${modelPath}`);
      } catch (error) {
        console.error(`Failed to close session for ${modelPath}:`, error);
      }
    }
  }

  /**
   * Close all sessions
   */
  async closeAllSessions() {
    const promises = Array.from(this.sessions.keys()).map(path => this.closeSession(path));
    await Promise.all(promises);
  }

  /**
   * Get runtime info
   */
  getRuntimeInfo() {
    return {
      initialized: this.initialized,
      currentBackend: this.currentBackend,
      availableBackends: this.getAvailableBackends(),
      sessions: this.sessions.size
    };
  }

  /**
   * Warm up a session with dummy data
   */
  async warmupSession(session, inputShape) {
    try {
      const dummyInput = new Float32Array(inputShape.reduce((a, b) => a * b, 1));
      const feeds = {};
      
      // Create feeds based on input names
      const inputNames = session.inputNames;
      if (inputNames.length > 0) {
        feeds[inputNames[0]] = new ort.Tensor('float32', dummyInput, inputShape);
      }
      
      await session.run(feeds);
      console.log('Session warmed up successfully');
    } catch (error) {
      console.warn('Session warmup failed:', error);
    }
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return null;
  }
}

// Global instance
const runtimeManager = new RuntimeManager();

// Export both the class and global instance
export { RuntimeManager };
export default runtimeManager;

// Convenience functions
export const createSession = (modelPath, options) => runtimeManager.createSession(modelPath, options);
export const getAvailableBackends = () => runtimeManager.getAvailableBackends();
export const getBestBackend = () => runtimeManager.getBestBackend();
export const getRuntimeInfo = () => runtimeManager.getRuntimeInfo();
export const closeSession = (modelPath) => runtimeManager.closeSession(modelPath);
export const closeAllSessions = () => runtimeManager.closeAllSessions();
export const warmupSession = (session, inputShape) => runtimeManager.warmupSession(session, inputShape);
export const getBackendInfo = () => runtimeManager.getRuntimeInfo();
