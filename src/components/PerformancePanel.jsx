import React, { useState, useEffect } from 'react';
import { getPerformanceReport, resetMetrics } from '../utils/performanceMonitor';
import { getCacheStats } from '../utils/preloadManager';

const PerformancePanel = ({ isVisible, onClose }) => {
  const [perfReport, setPerfReport] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);

  useEffect(() => {
    if (isVisible) {
      const updateStats = () => {
        setPerfReport(getPerformanceReport());
        setCacheStats(getCacheStats());
      };

      updateStats();
      const interval = setInterval(updateStats, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible || !perfReport) return null;

  const handleReset = () => {
    resetMetrics();
    setPerfReport(getPerformanceReport());
  };

  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Performance Monitor</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Navigation Performance */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">Navigation Performance</h4>
        {perfReport.navigation.message ? (
          <p className="text-sm text-gray-400">{perfReport.navigation.message}</p>
        ) : (
          <div className="text-xs space-y-1">
            <div>Total Navigations: <span className="text-green-400">{perfReport.navigation.totalNavigations}</span></div>
            <div>Preloaded: <span className="text-green-400">{perfReport.navigation.preloadedNavigations}</span></div>
            <div>Avg Preloaded Time: <span className="text-green-400">{perfReport.navigation.averagePreloadedTime}</span></div>
            <div>Avg Standard Time: <span className="text-yellow-400">{perfReport.navigation.averageStandardTime}</span></div>
            <div>Performance Gain: <span className="text-green-400">{perfReport.navigation.performanceImprovement}</span></div>
            <div>Preload Effectiveness: <span className="text-blue-400">{perfReport.navigation.preloadEffectiveness}</span></div>
          </div>
        )}
      </div>

      {/* Preloading Performance */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-purple-400 mb-2">Preloading Performance</h4>
        {perfReport.preloading.message ? (
          <p className="text-sm text-gray-400">{perfReport.preloading.message}</p>
        ) : (
          <div className="text-xs space-y-1">
            <div>Total Preloads: <span className="text-green-400">{perfReport.preloading.totalPreloads}</span></div>
            <div>Success Rate: <span className="text-green-400">{perfReport.preloading.successRate}</span></div>
            <div>Avg Time: <span className="text-blue-400">{perfReport.preloading.averagePreloadTime}</span></div>
          </div>
        )}
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-orange-400 mb-2">Cache Status</h4>
          <div className="text-xs space-y-1">
            <div>Cached Components: <span className="text-green-400">{cacheStats.cachedComponents}</span></div>
            <div>Preloaded Components: <span className="text-green-400">{cacheStats.preloadedComponents}</span></div>
            <div>Cached Resources: <span className="text-blue-400">{cacheStats.cachedResources}</span></div>
            <div>Active Preloads: <span className="text-yellow-400">{cacheStats.activePreloads}</span></div>
            <div>Status: <span className={cacheStats.isPreloading ? "text-yellow-400" : "text-green-400"}>
              {cacheStats.isPreloading ? "Preloading..." : "Ready"}
            </span></div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-green-400 mb-2">Recommendation</h4>
        <p className="text-xs text-gray-300">{perfReport.recommendation}</p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
        >
          Reset Metrics
        </button>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Last updated: {new Date(perfReport.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PerformancePanel;
