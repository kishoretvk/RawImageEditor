import React, { useState, useEffect, Suspense } from 'react';
import SeamlessLoader from './SeamlessLoader';
import preloadManager, { getCachedComponent } from '../utils/preloadManager';

const SmartComponentWrapper = ({ 
  componentName, 
  importFunction, 
  fallback,
  invisible = false,
  ...props 
}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadComponent();
  }, [componentName]);

  const loadComponent = async () => {
    try {
      // Check if component is already cached
      const cachedComponent = getCachedComponent(componentName);
      
      if (cachedComponent) {
        setComponent(() => cachedComponent.default || cachedComponent);
        setLoading(false);
        setProgress(100);
        return;
      }

      // Load component with progress tracking
      setProgress(25);
      
      const module = await importFunction();
      setProgress(75);
      
      // Cache the component
      preloadManager.cache.set(componentName, module);
      preloadManager.preloadedComponents.add(componentName);
      
      setProgress(100);
      setComponent(() => module.default || module);
      
      // Small delay for smooth transition
      setTimeout(() => setLoading(false), 100);
      
    } catch (error) {
      console.error(`[Smart Wrapper] Failed to load ${componentName}:`, error);
      setLoading(false);
    }
  };

  if (loading) {
    if (invisible) {
      return <SeamlessLoader type="invisible" />;
    }
    
    return fallback || (
      <SeamlessLoader 
        type="minimal" 
        message={`Loading ${componentName}...`}
        showProgress={true}
        progress={progress}
      />
    );
  }

  if (!Component) {
    return <div>Failed to load component</div>;
  }

  return <Component {...props} />;
};

export default SmartComponentWrapper;
