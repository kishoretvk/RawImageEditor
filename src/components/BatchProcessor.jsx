import React, { useState, useRef } from 'react';
import PresetManager from './PresetManager';
import FileUploader from './FileUploader';
import { batchProcessImages, createZipFromImages } from '../utils/batchExport';

const BatchProcessor = () => {
  const [files, setFiles] = useState([]);
  const [workflow, setWorkflow] = useState({
    convertToJpeg: false,
    jpegQuality: 80,
    applyPreset: false,
    selectedPreset: null,
    keepOriginal: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFilesSelected = (selectedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (presetSettings) => {
    setWorkflow(prev => ({
      ...prev,
      applyPreset: true,
      selectedPreset: presetSettings
    }));
  };

  const handleWorkflowChange = (key, value) => {
    setWorkflow(prev => ({ ...prev, [key]: value }));
  };

  const handleProcessBatch = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setProcessedFiles([]);
    
    try {
      // Prepare edits to apply, including curve data
      let editsToApply = {};
      if (workflow.applyPreset && workflow.selectedPreset) {
        editsToApply = { ...workflow.selectedPreset };
        // If preset includes curves, make sure they're properly structured
        if (workflow.selectedPreset.curves) {
          editsToApply.curves = workflow.selectedPreset.curves;
        }
      }
      
      // Process images with applied edits
      const results = await batchProcessImages(
        files, 
        editsToApply, 
        { quality: workflow.jpegQuality / 100 }
      );
      
      // Update progress
      setProgress(100);
      setProcessedFiles(results);
    } catch (error) {
      console.error('Batch processing error:', error);
      alert('Batch processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (processedFiles.length === 0) return;
    
    try {
      // Create a ZIP file with all processed images
      // In a real app, this would use a library like JSZip
      alert('In a real implementation, this would download a ZIP file with all processed images.');
      
      // For demo purposes, let's download the first successful image
      const successfulFiles = processedFiles.filter(file => file.status === 'completed');
      if (successfulFiles.length > 0) {
        const firstFile = successfulFiles[0];
        const a = document.createElement('a');
        a.href = firstFile.dataUrl;
        a.download = firstFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download all error:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="batch-processor">
      <h2 className="text-2xl font-bold mb-4">Batch Processing Workflow</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-bold mb-3">Upload Images</h3>
          <FileUploader 
            onFilesSelected={handleFilesSelected}
            multiple={true}
            accept="image/*"
          />
          
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
              <div className="max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-1">
                    <span className="text-sm truncate">{file.name}</span>
                    <button 
                      className="text-red-500 hover:text-red-300"
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Workflow Configuration */}
        <div className="bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-bold mb-3">Workflow Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="convertToJpeg"
                checked={workflow.convertToJpeg}
                onChange={(e) => handleWorkflowChange('convertToJpeg', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="convertToJpeg">Convert to JPEG</label>
            </div>
            
            {workflow.convertToJpeg && (
              <div className="ml-6">
                <label className="block mb-1">JPEG Quality: {workflow.jpegQuality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={workflow.jpegQuality}
                  onChange={(e) => handleWorkflowChange('jpegQuality', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="applyPreset"
                checked={workflow.applyPreset}
                onChange={(e) => handleWorkflowChange('applyPreset', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="applyPreset">Apply Preset</label>
            </div>
            
            {workflow.applyPreset && (
              <div className="ml-6">
                <PresetManager 
                  onApplyPreset={handleApplyPreset}
                  currentEdits={workflow.selectedPreset || {}}
                />
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="keepOriginal"
                checked={workflow.keepOriginal}
                onChange={(e) => handleWorkflowChange('keepOriginal', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="keepOriginal">Keep Original Files</label>
            </div>
          </div>
          
          <button
            className={`w-full mt-6 py-2 rounded font-medium ${
              files.length === 0 || isProcessing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-dark'
            }`}
            onClick={handleProcessBatch}
            disabled={files.length === 0 || isProcessing}
          >
            {isProcessing ? `Processing... ${Math.round(progress)}%` : 'Process Batch'}
          </button>
        </div>
      </div>
      
      {/* Progress and Results */}
      {isProcessing && (
        <div className="mt-6 bg-gray-800 p-4 rounded-xl">
          <h3 className="text-lg font-bold mb-2">Processing Progress</h3>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center mt-2">{Math.round(progress)}% Complete</p>
        </div>
      )}
      
      {processedFiles.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Processed Files</h3>
            <button 
              className="bg-primary text-white px-4 py-2 rounded"
              onClick={handleDownloadAll}
            >
              Download All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedFiles.map(file => (
              <div key={file.id} className="bg-gray-700 p-3 rounded">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                {file.status === 'completed' ? (
                  <a 
                    href={file.dataUrl} 
                    download={file.name}
                    className="text-primary text-sm mt-1 inline-block"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-red-500 text-sm mt-1 inline-block">
                    Failed: {file.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
