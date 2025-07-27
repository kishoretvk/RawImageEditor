import React, { useState, useEffect, useRef } from 'react';

const SmoothPanelContainer = ({ 
  activePanel, 
  panels, 
  onPanelChange,
  className = '',
  minHeight = '400px'
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedPanels, setLoadedPanels] = useState(new Set([activePanel]));
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(minHeight);

  // Preload adjacent panels for better performance
  useEffect(() => {
    const panelKeys = Object.keys(panels);
    const currentIndex = panelKeys.indexOf(activePanel);
    
    // Preload previous and next panels
    const toPreload = [];
    if (currentIndex > 0) toPreload.push(panelKeys[currentIndex - 1]);
    if (currentIndex < panelKeys.length - 1) toPreload.push(panelKeys[currentIndex + 1]);
    
    toPreload.forEach(panelKey => {
      if (!loadedPanels.has(panelKey)) {
        setTimeout(() => {
          setLoadedPanels(prev => new Set([...prev, panelKey]));
        }, 500); // Delay to not interfere with current rendering
      }
    });
  }, [activePanel, panels, loadedPanels]);

  // Preload panels on hover
  const preloadPanel = (panelKey) => {
    if (!loadedPanels.has(panelKey)) {
      setLoadedPanels(prev => new Set([...prev, panelKey]));
    }
  };

  // Handle panel change with smooth transition
  const handlePanelChange = async (newPanel) => {
    if (newPanel === activePanel || isTransitioning) return;

    setIsTransitioning(true);
    
    // Measure current height before transition
    if (containerRef.current) {
      const currentHeight = containerRef.current.offsetHeight;
      setContainerHeight(`${currentHeight}px`);
    }

    // Preload the new panel if not already loaded
    if (!loadedPanels.has(newPanel)) {
      setLoadedPanels(prev => new Set([...prev, newPanel]));
      // Small delay to ensure panel is loaded
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Start the transition
    onPanelChange(newPanel);

    // After a brief moment, measure new content and adjust height
    setTimeout(() => {
      if (containerRef.current) {
        // Create a temporary invisible clone to measure the new content
        const tempContainer = containerRef.current.cloneNode(true);
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.height = 'auto';
        tempContainer.style.top = '-9999px';
        
        // Show the new panel in the clone
        const panels = tempContainer.querySelectorAll('[data-panel]');
        panels.forEach(panel => {
          panel.style.display = panel.dataset.panel === newPanel ? 'block' : 'none';
        });
        
        document.body.appendChild(tempContainer);
        const newHeight = tempContainer.offsetHeight;
        document.body.removeChild(tempContainer);
        
        // Trigger smooth height transition
        requestAnimationFrame(() => {
          setContainerHeight(`${newHeight}px`);
        });
      }
    }, 50);

    // End transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setContainerHeight('auto');
    }, 350);
  };

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {Object.keys(panels).map(panelKey => (
          <button
            key={panelKey}
            className={`px-4 py-2 rounded-xl font-bold border-2 shadow transition-all duration-200 transform hover:scale-105 ${
              activePanel === panelKey 
                ? 'bg-blue-500 text-white border-blue-700 shadow-lg' 
                : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
            }`}
            onClick={() => handlePanelChange(panelKey)}
            onMouseEnter={() => preloadPanel(panelKey)}
            disabled={isTransitioning}
          >
            {panels[panelKey].title}
          </button>
        ))}
      </div>

      {/* Panel Container with Smooth Transitions */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden transition-all duration-300 ease-in-out"
        style={{ 
          height: containerHeight,
          minHeight: minHeight
        }}
      >
        {/* Loading overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 transition-opacity duration-150">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        )}

        {/* Panel Content */}
        <div className={`transition-all duration-300 ${
          isTransitioning ? 'opacity-70 scale-98' : 'opacity-100 scale-100'
        }`}>
          {Object.keys(panels).map(panelKey => (
            <div
              key={panelKey}
              data-panel={panelKey}
              className={`${
                activePanel === panelKey ? 'block' : 'hidden'
              }`}
            >
              {loadedPanels.has(panelKey) ? (
                <div className="panel-content-wrapper">
                  {panels[panelKey].component}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading panel...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmoothPanelContainer;
