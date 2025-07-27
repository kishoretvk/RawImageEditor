import React, { useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { preloadOnHover, prefetchRouteData } from '../utils/preloadManager';
import { startNavigation, endNavigation } from '../utils/performanceMonitor';
import preloadManager from '../utils/preloadManager';

const PreloadLink = ({ 
  to, 
  children, 
  componentName, 
  importFunction, 
  className = '',
  style = {},
  ...props 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  useEffect(() => {
    // Preload if this is an active or likely next route
    if (isActive && componentName && importFunction) {
      preloadOnHover(componentName, importFunction);
    }
  }, [isActive, componentName, importFunction]);

  const handleMouseEnter = useCallback(() => {
    if (componentName && importFunction) {
      // Preload component on hover
      preloadOnHover(componentName, importFunction);
      
      // Prefetch route data
      const routeName = to.replace('/', '') || 'home';
      prefetchRouteData(routeName);
    }
  }, [componentName, importFunction, to]);

  const handleFocus = useCallback(() => {
    // Also preload on focus for accessibility
    handleMouseEnter();
  }, [handleMouseEnter]);

  // Handle click navigation with performance tracking
  const handleClick = useCallback((event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      return; // Let browser handle special clicks
    }

    event.preventDefault();
    
    // Start performance tracking
    startNavigation(to);
    
    // Check if component is already cached
    const isPreloaded = componentName ? 
      preloadManager.getCachedComponent(componentName) !== null : false;
    
    navigate(to);
    
    // End performance tracking after navigation
    setTimeout(() => {
      endNavigation(to, isPreloaded);
    }, 50);
  }, [to, navigate, componentName]);

  return (
    <Link
      to={to}
      className={`preload-link ${className} ${isActive ? 'active' : ''}`}
      style={{
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PreloadLink;
