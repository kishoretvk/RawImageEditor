import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, Camera, Image, Zap } from 'lucide-react';

const EditorUploadPlaceholder = ({ onFileUpload, className = '' }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    e.preventDefault();
    if (e.target && e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = async (fileList) => {
    setError(null);
    setIsProcessing(true);

    try {
      const file = fileList[0];
      
      // Validate file type
      const validExtensions = ['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raw', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
      const fileName = file.name.toLowerCase();
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValid) {
        throw new Error('Please select a valid image file (RAW, JPEG, PNG, WebP, TIFF)');
      }

      // Create file data object
      const fileData = {
        file,
        filename: file.name,
        url: URL.createObjectURL(file),
        preview: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      };

      // Call parent handler
      if (onFileUpload) {
        await onFileUpload(fileData);
      }

    } catch (err) {
      console.error('File upload error:', err);
      setError(err.message || 'Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openFileDialog = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={`editor-upload-placeholder ${className}`}>
      <div
        className={`upload-dropzone ${isDragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".arw,.cr2,.cr3,.nef,.dng,.raw,.jpg,.jpeg,.png,.webp,.tiff,.tif"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          <div className="upload-icon-container">
            {isProcessing ? (
              <div className="processing-spinner">
                <Zap className="upload-icon processing" />
              </div>
            ) : (
              <div className="upload-icons">
                <Upload className="upload-icon primary" />
                <div className="upload-icons-grid">
                  <Camera className="upload-icon secondary" />
                  <FileImage className="upload-icon secondary" />
                  <Image className="upload-icon secondary" />
                </div>
              </div>
            )}
          </div>

          <div className="upload-text">
            <h2 className="upload-title">
              {isProcessing ? 'Processing Image...' : 'Upload Your Image'}
            </h2>
            <p className="upload-description">
              {isProcessing 
                ? 'Please wait while we prepare your image for editing'
                : 'Drag and drop your image here, or click to browse'
              }
            </p>
            <div className="upload-formats">
              <span className="format-badge">RAW</span>
              <span className="format-badge">JPEG</span>
              <span className="format-badge">PNG</span>
              <span className="format-badge">WebP</span>
              <span className="format-badge">TIFF</span>
            </div>
          </div>

          <div className="upload-features">
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <span>Professional Editing Tools</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Real-time Preview</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📸</div>
              <span>RAW Support</span>
            </div>
          </div>

          {!isProcessing && (
            <button className="upload-button" onClick={openFileDialog}>
              <Upload className="button-icon" />
              Choose Image
            </button>
          )}
        </div>

        {error && (
          <div className="upload-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .editor-upload-placeholder {
          width: 100%;
          height: 100%;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .upload-dropzone {
          width: 100%;
          max-width: 600px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px dashed rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .upload-dropzone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .upload-dropzone:hover::before {
          transform: translateX(100%);
        }

        .upload-dropzone:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .upload-dropzone.drag-active {
          border-color: #4ade80;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: scale(1.02);
        }

        .upload-dropzone.processing {
          pointer-events: none;
          opacity: 0.8;
        }

        .upload-content {
          position: relative;
          z-index: 1;
          color: white;
        }

        .upload-icon-container {
          margin-bottom: 2rem;
        }

        .upload-icons {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .upload-icons-grid {
          display: flex;
          gap: 1rem;
        }

        .upload-icon {
          transition: all 0.3s ease;
        }

        .upload-icon.primary {
          width: 4rem;
          height: 4rem;
          opacity: 0.9;
        }

        .upload-icon.secondary {
          width: 2rem;
          height: 2rem;
          opacity: 0.6;
        }

        .upload-icon.processing {
          animation: spin 1s linear infinite;
          width: 4rem;
          height: 4rem;
          color: #fbbf24;
        }

        .processing-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .upload-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .upload-description {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .upload-formats {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .format-badge {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .upload-features {
          display: flex;
          gap: 2rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .upload-button {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .upload-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .button-icon {
          width: 1.2rem;
          height: 1.2rem;
        }

        .upload-error {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: #ef4444;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 768px) {
          .upload-dropzone {
            padding: 2rem 1rem;
          }

          .upload-title {
            font-size: 1.5rem;
          }

          .upload-features {
            gap: 1rem;
          }

          .upload-formats {
            gap: 0.25rem;
          }

          .format-badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EditorUploadPlaceholder;
