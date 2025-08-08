/**
 * modelCache.js
 * Model caching system using IndexedDB for persistent storage
 * Handles model file caching and session management
 */

import { openDB } from 'idb';
import { getBackendInfo } from './runtime.js';

// Database configuration
const DB_NAME = 'raw-image-editor-models';
const DB_VERSION = 1;
const MODEL_STORE = 'models';
const METADATA_STORE = 'metadata';

class ModelCache {
  constructor() {
    this.db = null;
    this.cache = new Map();
    this.initPromise = this.init();
  }

  async init() {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(MODEL_STORE)) {
            const store = db.createObjectStore(MODEL_STORE, { keyPath: 'id' });
            store.createIndex('name', 'name');
            store.createIndex('version', 'version');
            store.createIndex('timestamp', 'timestamp');
          }
          
          if (!db.objectStoreNames.contains(METADATA_STORE)) {
            db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
          }
        }
      });
      
      console.log('Model cache initialized');
    } catch (error) {
      console.error('Failed to initialize model cache:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   */
  async ensureInitialized() {
    if (!this.db) {
      await this.initPromise;
    }
  }

  /**
   * Cache a model file
   */
  async cacheModel(modelId, modelData, metadata = {}) {
    await this.ensureInitialized();
    
    const entry = {
      id: modelId,
      name: metadata.name || modelId,
      version: metadata.version || '1.0.0',
      data: modelData,
      size: modelData.byteLength || modelData.length,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        cachedAt: Date.now()
      }
    };

    try {
      await this.db.put(MODEL_STORE, entry);
      this.cache.set(modelId, entry);
      
      // Update cache metadata
      await this.updateCacheMetadata();
      
      console.log(`Cached model: ${modelId} (${this.formatBytes(entry.size)})`);
      return true;
    } catch (error) {
      console.error('Failed to cache model:', error);
      return false;
    }
  }

  /**
   * Get cached model
   */
  async getCachedModel(modelId) {
    await this.ensureInitialized();
    
    // Check memory cache first
    if (this.cache.has(modelId)) {
      return this.cache.get(modelId);
    }
    
    try {
      const entry = await this.db.get(MODEL_STORE, modelId);
      if (entry) {
        this.cache.set(modelId, entry);
        return entry;
      }
    } catch (error) {
      console.error('Failed to get cached model:', error);
    }
    
    return null;
  }

  /**
   * Check if model is cached
   */
  async isCached(modelId) {
    const cached = await this.getCachedModel(modelId);
    return cached !== null;
  }

  /**
   * List all cached models
   */
  async listCachedModels() {
    await this.ensureInitialized();
    
    try {
      const entries = await this.db.getAll(MODEL_STORE);
      return entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        version: entry.version,
        size: entry.size,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      }));
    } catch (error) {
      console.error('Failed to list cached models:', error);
      return [];
    }
  }

  /**
   * Remove cached model
   */
  async removeCachedModel(modelId) {
    await this.ensureInitialized();
    
    try {
      await this.db.delete(MODEL_STORE, modelId);
      this.cache.delete(modelId);
      
      // Update cache metadata
      await this.updateCacheMetadata();
      
      console.log(`Removed cached model: ${modelId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove cached model:', error);
      return false;
    }
  }

  /**
   * Clear all cached models
   */
  async clearCache() {
    await this.ensureInitialized();
    
    try {
      await this.db.clear(MODEL_STORE);
      this.cache.clear();
      
      // Update cache metadata
      await this.updateCacheMetadata();
      
      console.log('Cleared model cache');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    await this.ensureInitialized();
    
    try {
      const models = await this.listCachedModels();
      const totalSize = models.reduce((sum, model) => sum + model.size, 0);
      
      return {
        totalModels: models.length,
        totalSize,
        models: models.sort((a, b) => b.timestamp - a.timestamp)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalModels: 0, totalSize: 0, models: [] };
    }
  }

  /**
   * Update cache metadata
   */
  async updateCacheMetadata() {
    const stats = await this.getCacheStats();
    
    const metadata = {
      key: 'cache_stats',
      lastUpdated: Date.now(),
      totalModels: stats.totalModels,
      totalSize: stats.totalSize
    };
    
    try {
      await this.db.put(METADATA_STORE, metadata);
    } catch (error) {
      console.error('Failed to update cache metadata:', error);
    }
  }

  /**
   * Clean old cache entries
   */
  async cleanCache(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
    await this.ensureInitialized();
    
    const cutoff = Date.now() - maxAge;
    
    try {
      const tx = this.db.transaction(MODEL_STORE, 'readwrite');
      const store = tx.objectStore(MODEL_STORE);
      const index = store.index('timestamp');
      
      const oldEntries = await index.getAll(IDBKeyRange.upperBound(cutoff));
      
      const removed = [];
      for (const entry of oldEntries) {
        await store.delete(entry.id);
        this.cache.delete(entry.id);
        removed.push(entry.id);
      }
      
      if (removed.length > 0) {
        console.log(`Cleaned ${removed.length} old cache entries`);
        await this.updateCacheMetadata();
      }
      
      return removed;
    } catch (error) {
      console.error('Failed to clean cache:', error);
      return [];
    }
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global instance
const modelCache = new ModelCache();

// Export both the class and global instance
export { ModelCache };
export default modelCache;

// Convenience functions
export const cacheModel = (id, data, metadata) => modelCache.cacheModel(id, data, metadata);
export const getCachedModel = (id) => modelCache.getCachedModel(id);
export const isCached = (id) => modelCache.isCached(id);
export const listCachedModels = () => modelCache.listCachedModels();
export const removeCachedModel = (id) => modelCache.removeCachedModel(id);
export const clearCache = () => modelCache.clearCache();
export const getCacheStats = () => modelCache.getCacheStats();
export const cleanCache = (maxAge) => modelCache.cleanCache(maxAge);
