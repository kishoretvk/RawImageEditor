import React, { useState, useCallback } from 'react';
import UploadButton from './UploadButton';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import Sidebar from './Sidebar';
import '../styles/EditorLayout.css';

const EditorLayout = () => {
  const [currentImage, setCurrentImage] = useState(null);
  const [edits, setEdits] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [processedData, setProcessedData] = useState(null);

  // Handle file upload
  const handleFileSelected = (imageData) => {
    console.log('[EditorLayout] Received new image:', imageData);
    
    // Reset edits when new image is loaded
    setEdits({});
    
    // Set the new image with all its metadata
    setCurrentImage(imageData);
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
        <UploadButton onFileSelected={handleFileSelected} />
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? "→" : "←"}
        </button>
      </header>

      {/* Main content area */}
      <div className="editor-content">
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
      </div>
    </div>
  );
};

export default EditorLayout;
