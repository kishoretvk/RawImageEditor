/**
 * Performance Monitor for tracking seamless navigation and preloading effectiveness
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.navigationTimes = [];
    this.preloadTimes = [];
    this.enabled = true;
  }

  /**
   * Start tracking a navigation event
   */
  startNavigation(path) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    this.metrics.set(`nav_${path}`, {
      startTime,
      path,
      type: 'navigation'
    });
  }

  /**
   * End tracking a navigation event
   */
  endNavigation(path, wasPreloaded = false) {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(`nav_${path}`);
    if (!metric) return;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.navigationTimes.push({
      path,
      duration,
      wasPreloaded,
      timestamp: Date.now()
    });

    // Log performance improvement
    if (wasPreloaded) {
      console.log(`[PerfMonitor] ⚡ Fast navigation to ${path}: ${duration.toFixed(2)}ms (preloaded)`);
    } else {
      console.log(`[PerfMonitor] 🐌 Standard navigation to ${path}: ${duration.toFixed(2)}ms`);
    }

    this.metrics.delete(`nav_${path}`);
  }

  /**
   * Track preloading performance
   */
  trackPreload(componentName, duration, success = true) {
    if (!this.enabled) return;
    
    this.preloadTimes.push({
      componentName,
      duration,
      success,
      timestamp: Date.now()
    });

    if (success) {
      console.log(`[PerfMonitor] ✅ Preloaded ${componentName} in ${duration.toFixed(2)}ms`);
    } else {
      console.warn(`[PerfMonitor] ❌ Failed to preload ${componentName} after ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Track resource loading (images, etc.)
   */
  trackResourceLoad(resourceUrl, fromCache = false) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    
    return {
      finish: () => {
        const duration = performance.now() - startTime;
        console.log(`[PerfMonitor] 📦 Resource ${fromCache ? '(cached)' : '(network)'}: ${resourceUrl} - ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Get navigation performance statistics
   */
  getNavigationStats() {
    if (this.navigationTimes.length === 0) {
      return { message: 'No navigation data yet' };
    }

    const preloadedNavs = this.navigationTimes.filter(nav => nav.wasPreloaded);
    const standardNavs = this.navigationTimes.filter(nav => !nav.wasPreloaded);

    const avgPreloaded = preloadedNavs.length > 0 
      ? preloadedNavs.reduce((sum, nav) => sum + nav.duration, 0) / preloadedNavs.length 
      : 0;
    
    const avgStandard = standardNavs.length > 0
      ? standardNavs.reduce((sum, nav) => sum + nav.duration, 0) / standardNavs.length
      : 0;

    const improvement = avgStandard > 0 && avgPreloaded > 0 
      ? ((avgStandard - avgPreloaded) / avgStandard * 100).toFixed(1)
      : 0;

    return {
      totalNavigations: this.navigationTimes.length,
      preloadedNavigations: preloadedNavs.length,
      averagePreloadedTime: avgPreloaded.toFixed(2) + 'ms',
      averageStandardTime: avgStandard.toFixed(2) + 'ms',
      performanceImprovement: improvement + '%',
      preloadEffectiveness: preloadedNavs.length > 0 ? 
        ((preloadedNavs.length / this.navigationTimes.length) * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Get preloading performance statistics
   */
  getPreloadStats() {
    if (this.preloadTimes.length === 0) {
      return { message: 'No preload data yet' };
    }

    const successful = this.preloadTimes.filter(p => p.success);
    const failed = this.preloadTimes.filter(p => !p.success);
    
    const avgDuration = successful.length > 0
      ? successful.reduce((sum, p) => sum + p.duration, 0) / successful.length
      : 0;

    return {
      totalPreloads: this.preloadTimes.length,
      successfulPreloads: successful.length,
      failedPreloads: failed.length,
      successRate: ((successful.length / this.preloadTimes.length) * 100).toFixed(1) + '%',
      averagePreloadTime: avgDuration.toFixed(2) + 'ms'
    };
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport() {
    return {
      navigation: this.getNavigationStats(),
      preloading: this.getPreloadStats(),
      timestamp: new Date().toISOString(),
      recommendation: this.getRecommendation()
    };
  }

  /**
   * Get performance recommendations
   */
  getRecommendation() {
    const navStats = this.getNavigationStats();
    const preloadStats = this.getPreloadStats();

    if (navStats.message) {
      return 'Start navigating to collect performance data';
    }

    const effectivenessPercent = parseFloat(navStats.preloadEffectiveness);
    const improvementPercent = parseFloat(navStats.performanceImprovement);

    if (effectivenessPercent < 30) {
      return 'Consider enabling more hover-based preloading to improve navigation speed';
    } else if (effectivenessPercent > 70 && improvementPercent > 50) {
      return '🎉 Excellent preloading performance! Navigation is seamless.';
    } else if (improvementPercent > 30) {
      return '✅ Good preloading performance. Users should notice faster navigation.';
    } else {
      return 'Preloading is working but could be optimized further';
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.navigationTimes = [];
    this.preloadTimes = [];
    console.log('[PerfMonitor] Performance metrics reset');
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[PerfMonitor] Monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const startNavigation = (path) => performanceMonitor.startNavigation(path);
export const endNavigation = (path, wasPreloaded) => performanceMonitor.endNavigation(path, wasPreloaded);
export const trackPreload = (componentName, duration, success) => performanceMonitor.trackPreload(componentName, duration, success);
export const trackResourceLoad = (resourceUrl, fromCache) => performanceMonitor.trackResourceLoad(resourceUrl, fromCache);
export const getPerformanceReport = () => performanceMonitor.getPerformanceReport();
export const resetMetrics = () => performanceMonitor.reset();

export default performanceMonitor;
