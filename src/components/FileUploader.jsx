import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';

const FileUploader = ({ onFileUpload, multiple = true, className = '' }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      const validExtensions = ['.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2'];
      const extension = '.' + file.name.toLowerCase().split('.').pop();
      return validExtensions.includes(extension);
    });

    if (validFiles.length === 0) {
      alert('Please select valid RAW files (.raw, .cr2, .cr3, .nef, .arw, .dng, .raf, .orf, .rw2)');
      return;
    }

    // Simulate upload progress
    const newProgress = {};
    validFiles.forEach((file, index) => {
      newProgress[file.name] = 0;
      
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[file.name] || 0;
          if (current >= 100) {
            clearInterval(interval);
            return { ...prev, [file.name]: 100 };
          }
          return { ...prev, [file.name]: current + 10 };
        });
      }, 200);
    });

    setUploadProgress(newProgress);
    
    // Call the parent callback
    if (onFileUpload) {
      onFileUpload(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className={`file-uploader ${className}`}>
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <ArrowUpTrayIcon className="upload-icon" />
          <h3>Upload RAW Files</h3>
          <p>Drag and drop your RAW files here, or click to browse</p>
          <p className="file-types">Supports: CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept=".raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="progress-item">
              <span className="filename">{filename}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
