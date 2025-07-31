import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import './FileUploader.css';

const FileUploader = ({ onFileUpload, multiple = true, className = '', compact = false }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (onFileUpload) {
      if (multiple) {
        onFileUpload(fileList);
      } else {
        onFileUpload(fileList[0]);
      }
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

  if (compact) {
    return (
      <div className={`file-uploader-compact ${className}`}>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="upload-button"
        >
          <ArrowUpTrayIcon className="upload-icon-compact" />
          <span>Upload Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

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
          <h3>Upload Image</h3>
          <p>Drag and drop your image here, or click to browse</p>
          <p className="file-types">Supports JPEG, PNG, WebP, and various RAW formats</p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default FileUploader;
