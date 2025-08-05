import React, { useRef, useState } from 'react';
import { ArrowUpTrayIcon, PhotoIcon, FolderOpenIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import './FileUploader.css';

const ACCEPT = 'image/*,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2';

const FileUploader = ({ onFileUpload, multiple = true, className = '', compact = false }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hover, setHover] = useState(false);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (onFileUpload) {
      onFileUpload(multiple ? fileList : fileList[0]);
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
          title="Upload image"
        >
          <ArrowUpTrayIcon className="upload-icon-compact" />
          <span>Upload Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={ACCEPT}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  return (
    <div className={`file-uploader ${className}`}>
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${hover ? 'hover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content enhanced">
          <div className="upload-icon-wrap">
            <ArrowUpTrayIcon className="upload-icon" />
          </div>

          <div className="upload-headline">
            <h3>Upload or Drop Images</h3>
            <p className="sub">Drag files here, paste from clipboard, or click to browse</p>
            <p className="file-types">JPEG, PNG, WebP and RAW (DNG/ARW/NEF/CR2/CR3/RAF/ORF/RW2)</p>
          </div>

          <div className="uploader-actions">
            <button
              className="uploader-btn primary"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FolderOpenIcon className="btn-icon" />
              Browse Files
            </button>
            <button
              className="uploader-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Optional: hook for future cloud import
                alert('Cloud import coming soon');
              }}
            >
              <CloudArrowUpIcon className="btn-icon" />
              Import from Cloud
            </button>
          </div>

          <div className="uploader-tips">
            <div className="tip">
              <PhotoIcon className="tip-icon" />
              <span>Tip: You can paste an image directly (Ctrl/Cmd + V)</span>
            </div>
            <div className="tip">
              <span className="kbd">Shift</span> + <span className="kbd">Drop</span> to queue multiple files
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={ACCEPT}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default FileUploader;
