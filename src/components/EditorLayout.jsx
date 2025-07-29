import React, { useState, useCallback } from 'react';
import UploadButton from './UploadButton';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import Sidebar from './Sidebar';
import '../styles/EditorLayout.css';

const EditorLayout = ({ currentImage, controls, children }) => {
  const [edits, setEdits] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Handle file upload
  const handleFileSelected = (imageData) => {
    console.log('[EditorLayout] Received new image:', imageData);
    
    // Reset edits when new image is loaded
    setEdits({});
    
    // Set the new image with all its metadata
    if (currentImage === undefined) {
      // This is for the default editor layout
      setCurrentImage(imageData);
    }
  };

  // Handle edit changes from sidebar
  const handleEditChange = useCallback((editName, value) => {
    setEdits(prev => ({
      ...prev,
      [editName]: value
    }));
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Handle processed image data from canvas
  const handleImageProcessed = useCallback((data) => {
    setProcessedData(data);
  }, []);

  return (
    <div className="editor-layout">
      {/* Header with upload button */}
      <header className="editor-header">
        <div className="logo">RAW Converter</div>
        {controls ? (
          <button 
            className="mobile-sidebar-toggle" 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          >
            {showMobileSidebar ? "Hide Controls" : "Show Controls"}
          </button>
        ) : (
          <>
            <UploadButton onFileSelected={handleFileSelected} />
            <button 
              className="sidebar-toggle" 
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? "→" : "←"}
            </button>
          </>
        )}
      </header>

      {/* Main content area */}
      <div className="editor-content">
        {controls ? (
          <>
            {/* Controls sidebar for pages like CompressionPage */}
            <div className={`sidebar ${showMobileSidebar ? 'mobile-visible' : ''}`} style={{ 
              width: '300px', 
              height: '100%', 
              overflowY: 'auto',
              backgroundColor: '#2d2d2d',
              borderRight: '1px solid #3a3a3a',
              display: showMobileSidebar || window.innerWidth > 768 ? 'block' : 'none'
            }}>
              {controls}
            </div>
            
            {/* Main content area */}
            <div className="canvas-area">
              {children}
            </div>
          </>
        ) : (
          <>
            {/* Sidebar with editing tools */}
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              edits={edits}
              onEditChange={handleEditChange}
              imageInfo={processedData}
            />

            {/* Main canvas area */}
            <div className="canvas-area">
              {currentImage ? (
                <EnhancedImageCanvas 
                  imageSrc={currentImage}
                  edits={edits}
                  onProcessed={handleImageProcessed}
                />
              ) : (
                <div className="upload-prompt">
                  <div className="upload-icon">↑</div>
                  <p>Upload an image to get started</p>
                  <p className="supported-formats">
                    Supported formats: JPEG, PNG, WebP, RAW (CR2, NEF, ARW, etc.)
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditorLayout;
