import React from 'react';

/**
 * Shared Panel wrapper component for all adjustment panels
 * Provides consistent styling and interaction for editor panels
 */
const PanelWrapper = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  
  return (
    <div className="editor-panel mb-4 rounded overflow-hidden">
      <button 
        className="panel-header w-full px-4 py-3 flex justify-between items-center bg-gray-800 hover:bg-gray-700 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-white">{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <div className="panel-content p-3 bg-gray-900 bg-opacity-50">
          {children}
        </div>
      )}
    </div>
  );
};

export default PanelWrapper;
