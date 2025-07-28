import React, { useState, useRef, useCallback } from 'react';
import FileUploader from './FileUploader';
import WorkflowManager from './WorkflowManager';
import ImageSlider from './ImageSlider';
import { batchProcessImages } from '../utils/batchExport';
import { isRawFormat, processRAWFile, convertRAWToJPEG } from '../utils/rawProcessor';
import '../styles/batch-workflow.css';

const BatchWorkflowProcessor = ({ 
  workflows = [], 
  presets = [],
  onWorkflowsChange
}) => {
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [processingStats, setProcessingStats] = useState({ total: 0, completed: 0, failed: 0 });
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFilesSelected = useCallback((selectedFiles) => {
    // Filter out unsupported files
    const supportedFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || isRawFormat(file.name)
    );
    
    if (supportedFiles.length !== selectedFiles.length) {
      const unsupportedCount = selectedFiles.length - supportedFiles.length;
      alert(`${unsupportedCount} unsupported file${unsupportedCount !== 1 ? 's' : ''} were ignored. Only image files are supported.`);
    }
    
    setFiles(prevFiles => [...prevFiles, ...supportedFiles]);
  }, []);

  // Handle removing a file
  const handleRemoveFile = useCallback((index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  // Process a single file with workflow
  const processFileWithWorkflow = useCallback(async (file, workflow) => {
    try {
      // Handle RAW files by converting them to JPEG first
      let processedFile = file;
      if (isRawFormat(file.name)) {
        const rawProcessed = await convertRAWToJPEG(file, {
          outputFormat: 'jpeg',
          quality: 0.95,
          enhanceQuality: true,
          maxWidth: 4000,
          maxHeight: 4000
        });
        processedFile = new File([await fetch(rawProcessed.url).then(r => r.blob())], 
          file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
      }
      
      // Find the preset for this workflow step
      const presetStep = workflow.steps.find(step => step.type === 'preset');
      if (!presetStep) {
        throw new Error('No preset step found in workflow');
      }
      
      const preset = presets.find(p => p.id === presetStep.presetId);
      if (!preset) {
        throw new Error('Preset not found');
      }
      
      // Apply edits and export
      const editedImage = await batchProcessImages([processedFile], preset.settings, { quality: 0.9 });
      return editedImage[0];
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }, [presets]);

  // Handle processing files with workflow
  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0) {
      alert('Please select files to process');
      return;
    }
    
    if (!selectedWorkflow) {
      alert('Please select a workflow');
      return;
    }
    
    if (selectedWorkflow.steps.length === 0) {
      alert('Selected workflow has no steps');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessedFiles([]);
    setProcessingStats({ total: files.length, completed: 0, failed: 0 });
    
    try {
      const results = [];
      
      // Process files sequentially to avoid memory issues
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await processFileWithWorkflow(files[i], selectedWorkflow);
          
          // Create a processed file entry
          const processedFile = {
            id: Date.now() + i,
            originalFile: files[i],
            name: files[i].name.replace(/\.[^/.]+$/, "") + "_processed.jpg",
            size: result.size || files[i].size,
            status: 'completed',
            downloadUrl: result.dataUrl, // Processed image data URL
            previewUrl: result.dataUrl // Processed image preview
          };
          
          results.push(processedFile);
          setProcessedFiles(prev => [...prev, processedFile]);
          setProcessingProgress(((i + 1) / files.length) * 100);
          setProcessingStats(prev => ({
            ...prev,
            completed: prev.completed + 1
          }));
        } catch (error) {
          console.error(`Error processing file ${files[i].name}:`, error);
          
          // Create a failed file entry
          const failedFile = {
            id: Date.now() + i,
            originalFile: files[i],
            name: files[i].name,
            size: files[i].size,
            status: 'failed',
            error: error.message
          };
          
          results.push(failedFile);
          setProcessedFiles(prev => [...prev, failedFile]);
          setProcessingStats(prev => ({
            ...prev,
            failed: prev.failed + 1
          }));
        }
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert('Batch processing failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [files, selectedWorkflow, processFileWithWorkflow]);

  // Handle downloading all processed files as a ZIP
  const handleDownloadAll = useCallback(async () => {
    try {
      // In a real implementation, we would use a library like JSZip to create a ZIP file
      // For now, we'll download the first successful file as an example
      const successfulFiles = processedFiles.filter(file => file.status === 'completed');
      
      if (successfulFiles.length === 0) {
        alert('No successfully processed files to download');
        return;
      }
      
      // Download the first file as an example
      const firstFile = successfulFiles[0];
      const link = document.createElement('a');
      link.href = firstFile.downloadUrl;
      link.download = firstFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Downloading ${successfulFiles.length} files. In a full implementation, this would be a ZIP file.`);
    } catch (error) {
      console.error('Error downloading files:', error);
      alert('Error downloading files: ' + error.message);
    }
  }, [processedFiles]);

  // Reset the processor
  const handleReset = useCallback(() => {
    setFiles([]);
    setProcessedFiles([]);
    setSelectedWorkflow(null);
    setShowResults(false);
    setProcessingProgress(0);
    setProcessingStats({ total: 0, completed: 0, failed: 0 });
  }, []);

  // Get preset by ID
  const getPresetById = useCallback((presetId) => {
    return presets.find(preset => preset.id === presetId);
  }, [presets]);

  return (
    <div className="batch-workflow-processor">
      {!showResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Section */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Upload Images</h2>
            
            <FileUploader 
              onFilesSelected={handleFilesSelected}
              multiple={true}
              accept="image/*"
              className="mb-6"
            />
            
            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-white">Selected Files ({files.length})</h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gray-700 rounded p-3"
                    >
                      <div className="flex items-center min-w-0">
                        {file.type.startsWith('image/') && (
                          <div className="flex-shrink-0 mr-3">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Workflow Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Select Workflow</h3>
              
              {workflows.length === 0 ? (
                <div className="text-center py-4 bg-gray-700 rounded-lg">
                  <p className="text-gray-400">No workflows available</p>
                  <p className="text-gray-500 text-sm mt-1">Create a workflow first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflows
                    .filter(w => w.isActive)
                    .map((workflow) => {
                      const presetStep = workflow.steps.find(step => step.type === 'preset');
                      const preset = presetStep ? getPresetById(presetStep.presetId) : null;
                      
                      return (
                        <div
                          key={workflow.id}
                          onClick={() => setSelectedWorkflow(workflow)}
                          className={`p-4 rounded-lg cursor-pointer border transition-all ${
                            selectedWorkflow?.id === workflow.id
                              ? 'bg-blue-900 border-blue-500 shadow-lg'
                              : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-white font-medium">{workflow.name}</h4>
                            {selectedWorkflow?.id === workflow.id && (
                              <span className="text-blue-400">✓</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                          </p>
                          {preset && (
                            <div className="flex items-center text-xs text-gray-300">
                              <span className="bg-gray-600 px-2 py-1 rounded mr-2">Preset</span>
                              <span>{preset.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
            
            {/* Process Button */}
            <button
              onClick={handleProcessFiles}
              disabled={files.length === 0 || !selectedWorkflow || isProcessing}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                files.length === 0 || !selectedWorkflow || isProcessing
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing... {Math.round(processingProgress)}%
                </div>
              ) : (
                'Process Images'
              )}
            </button>
          </div>
          
          {/* Workflow Manager */}
          <div className="lg:col-span-2">
            <WorkflowManager
              workflows={workflows}
              presets={presets}
              onWorkflowsChange={onWorkflowsChange}
            />
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Processing Results</h2>
              <p className="text-gray-400">
                {processingStats.completed} completed, {processingStats.failed} failed
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md shadow transition-all"
              >
                Download All
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-all"
              >
                Process More
              </button>
            </div>
          </div>
          
          {/* Progress */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-white">Processing...</span>
                <span className="text-gray-400">{Math.round(processingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Processed Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedFiles.map((file) => (
              <div key={file.id} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                {file.status === 'completed' ? (
                  <>
                    <div className="h-48">
                      <ImageSlider
                        originalImage={URL.createObjectURL(file.originalFile)}
                        editedImage={file.previewUrl}
                        initialPosition={sliderPosition}
                        onPositionChange={setSliderPosition}
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <h3 className="text-white font-medium truncate">{file.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <a 
                          href={file.downloadUrl} 
                          download={file.name}
                          className="text-blue-400 hover:text-blue-300 flex-shrink-0 ml-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center p-4 text-center">
                    <div className="text-red-500 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-medium truncate mb-1">{file.name}</h3>
                    <p className="text-red-400 text-sm mb-2">Processing failed</p>
                    <p className="text-gray-400 text-xs">{file.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchWorkflowProcessor;
