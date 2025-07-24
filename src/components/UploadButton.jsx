import React, { useRef } from 'react';

const UploadButton = ({ onFileSelected }) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const isRawFormat = checkIfRawFormat(file.name);
    
    console.log(`File selected: ${file.name}, isRaw: ${isRawFormat}`);

    // Create a URL for the file
    const url = URL.createObjectURL(file);

    // Call the callback with the file metadata and actual file object
    onFileSelected({
      url,
      name: file.name,
      type: file.type,
      size: file.size,
      isRaw: isRawFormat,
      lastModified: file.lastModified,
      file: file  // Include the actual file object for RAW processing
    });
  };

  // Function to check if file is a RAW format
  const checkIfRawFormat = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop().toLowerCase();
    const rawExtensions = ['raw', 'cr2', 'nef', 'arw', 'orf', 'rw2', 'dng', 'raf'];
    return rawExtensions.includes(extension);
  };

  return (
    <div className="upload-button-container">
      <button 
        className="upload-button" 
        onClick={handleUploadClick}
      >
        Upload Image
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,.raw,.cr2,.nef,.arw,.orf,.rw2,.dng,.raf"
      />
    </div>
  );
};

export default UploadButton;
