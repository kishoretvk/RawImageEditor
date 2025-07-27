/**
 * Advanced Preloading and Caching Manager
 * Handles component preloading, resource caching, and seamless navigation
 */

class PreloadManager {
  constructor() {
    this.cache = new Map();
    this.preloadPromises = new Map();
    this.resourceCache = new Map();
    this.isPreloading = false;
    this.preloadedComponents = new Set();
    
    // Initialize browser caching
    this.initializeBrowserCache();
  }

  /**
   * Initialize browser-level caching
   */
  initializeBrowserCache() {
    // Cache assets in browser storage
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
    
    // Preload critical resources
    this.preloadCriticalResources();
  }

  /**
   * Register service worker for advanced caching
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[Preload Manager] Service Worker registered:', registration);
    } catch (error) {
      console.warn('[Preload Manager] Service Worker registration failed:', error);
    }
  }

  /**
   * Preload critical resources (images, fonts, etc.)
   */
  preloadCriticalResources() {
    const criticalResources = [
      '/src/assets/images/newyork-night.jpg',
      '/src/assets/images/cheetah-hotirontal.jpg',
      '/src/assets/images/nature-horizontal.jpg',
      '/src/assets/images/northernlights.jpg'
    ];

    criticalResources.forEach(resource => {
      this.preloadImage(resource);
    });
  }

  /**
   * Preload an image and cache it
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (this.resourceCache.has(src)) {
        resolve(this.resourceCache.get(src));
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.resourceCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Preload React components lazily
   */
  async preloadComponent(importFunction, componentName) {
    if (this.preloadedComponents.has(componentName)) {
      return this.cache.get(componentName);
    }

    if (this.preloadPromises.has(componentName)) {
      return this.preloadPromises.get(componentName);
    }

    const preloadPromise = importFunction().then(module => {
      this.cache.set(componentName, module);
      this.preloadedComponents.add(componentName);
      this.preloadPromises.delete(componentName);
      return module;
    });

    this.preloadPromises.set(componentName, preloadPromise);
    return preloadPromise;
  }

  /**
   * Preload all navigation components in background
   */
  async preloadAllComponents() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('[Preload Manager] Starting component preloading...');

    const componentImports = [
      { name: 'Editor', import: () => import('../pages/Editor') },
      { name: 'Gallery', import: () => import('../pages/Gallery') },
      { name: 'Dashboard', import: () => import('../pages/Dashboard') },
      { name: 'Competition', import: () => import('../pages/Competition') },
      { name: 'AboutTech', import: () => import('../pages/AboutTech') },
      { name: 'CompressionPage', import: () => import('../pages/CompressionPage') }
    ];

    // Preload components in parallel with staggered timing
    const preloadPromises = componentImports.map((component, index) => 
      new Promise(resolve => {
        setTimeout(() => {
          this.preloadComponent(component.import, component.name)
            .then(() => {
              console.log(`[Preload Manager] ✅ ${component.name} preloaded`);
              resolve();
            })
            .catch(error => {
              console.warn(`[Preload Manager] ❌ ${component.name} preload failed:`, error);
              resolve(); // Don't block other preloads
            });
        }, index * 200); // Stagger by 200ms to avoid blocking
      })
    );

    await Promise.allSettled(preloadPromises);
    console.log('[Preload Manager] All components preloading completed');
    this.isPreloading = false;
  }

  /**
   * Get cached component or return null
   */
  getCachedComponent(componentName) {
    return this.cache.get(componentName) || null;
  }

  /**
   * Preload on user interaction (hover, focus)
   */
  preloadOnInteraction(componentName, importFunction) {
    if (!this.preloadedComponents.has(componentName)) {
      this.preloadComponent(importFunction, componentName);
    }
  }

  /**
   * Clear cache (for memory management)
   */
  clearCache() {
    this.cache.clear();
    this.preloadPromises.clear();
    this.resourceCache.clear();
    this.preloadedComponents.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedComponents: this.cache.size,
      preloadedComponents: this.preloadedComponents.size,
      cachedResources: this.resourceCache.size,
      activePreloads: this.preloadPromises.size,
      isPreloading: this.isPreloading
    };
  }

  /**
   * Prefetch data for a route
   */
  async prefetchRouteData(routeName) {
    const dataFetchers = {
      gallery: () => this.prefetchGalleryData(),
      dashboard: () => this.prefetchDashboardData(),
      editor: () => this.prefetchEditorData()
    };

    const fetcher = dataFetchers[routeName];
    if (fetcher) {
      try {
        const data = await fetcher();
        sessionStorage.setItem(`preloaded_${routeName}`, JSON.stringify(data));
        return data;
      } catch (error) {
        console.warn(`[Preload Manager] Data prefetch failed for ${routeName}:`, error);
      }
    }
  }

  /**
   * Get preloaded data for a route
   */
  getPreloadedData(routeName) {
    try {
      const data = sessionStorage.getItem(`preloaded_${routeName}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[Preload Manager] Failed to get preloaded data:', error);
      return null;
    }
  }

  /**
   * Prefetch gallery data
   */
  async prefetchGalleryData() {
    // Simulate API call - replace with actual data fetching
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          images: [],
          metadata: { total: 0, lastUpdated: Date.now() }
        });
      }, 100);
    });
  }

  /**
   * Prefetch dashboard data
   */
  async prefetchDashboardData() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          stats: { processed: 0, uploaded: 0 },
          recentActivity: []
        });
      }, 100);
    });
  }

  /**
   * Prefetch editor data
   */
  async prefetchEditorData() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          presets: [],
          settings: {},
          tools: []
        });
      }, 100);
    });
  }
}

// Create singleton instance
const preloadManager = new PreloadManager();

// Export utility functions
export const preloadAllComponents = () => preloadManager.preloadAllComponents();
export const getCachedComponent = (name) => preloadManager.getCachedComponent(name);
export const preloadOnHover = (name, importFn) => preloadManager.preloadOnInteraction(name, importFn);
export const prefetchRouteData = (route) => preloadManager.prefetchRouteData(route);
export const getPreloadedData = (route) => preloadManager.getPreloadedData(route);
export const getCacheStats = () => preloadManager.getCacheStats();

export default preloadManager;
