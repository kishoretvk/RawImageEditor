import React, { useState, useRef } from 'react';
import FileUploader from './FileUploader';
import WorkflowManager from './WorkflowManager';
import ImageSlider from './ImageSlider';
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
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFilesSelected = (selectedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  // Handle removing a file
  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  // Handle processing files with workflow
  const handleProcessFiles = async () => {
    if (files.length === 0) {
      alert('Please select files to process');
      return;
    }
    
    if (!selectedWorkflow) {
      alert('Please select a workflow');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessedFiles([]);
    
    try {
      // Simulate processing (in a real app, this would use the batchProcessImages function)
      for (let i = 0; i < files.length; i++) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Create a processed file entry
        const processedFile = {
          id: Date.now() + i,
          originalFile: files[i],
          name: files[i].name.replace(/\.[^/.]+$/, "") + "_processed.jpg",
          size: files[i].size,
          status: 'completed',
          downloadUrl: URL.createObjectURL(files[i]), // In real app, this would be the processed file
          previewUrl: URL.createObjectURL(files[i]) // In real app, this would be a preview of the processed file
        };
        
        setProcessedFiles(prev => [...prev, processedFile]);
        setProcessingProgress(((i + 1) / files.length) * 100);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert('Batch processing failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle downloading all processed files
  const handleDownloadAll = () => {
    // In a real app, this would download a ZIP file with all processed images
    alert('In a real implementation, this would download a ZIP file with all processed images.');
  };

  // Reset the processor
  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setSelectedWorkflow(null);
    setShowResults(false);
    setProcessingProgress(0);
  };

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
                <div className="space-y-2">
                  {workflows
                    .filter(w => w.isActive)
                    .map((workflow) => (
                      <div
                        key={workflow.id}
                        onClick={() => setSelectedWorkflow(workflow)}
                        className={`p-3 rounded-lg cursor-pointer border ${
                          selectedWorkflow?.id === workflow.id
                            ? 'bg-blue-900 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-white font-medium">{workflow.name}</h4>
                          {selectedWorkflow?.id === workflow.id && (
                            <span className="text-blue-400">✓</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            {/* Process Button */}
            <button
              onClick={handleProcessFiles}
              disabled={files.length === 0 || !selectedWorkflow || isProcessing}
              className={`w-full py-3 rounded-lg font-medium ${
                files.length === 0 || !selectedWorkflow || isProcessing
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? `Processing... ${Math.round(processingProgress)}%` : 'Process Images'}
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Processing Results</h2>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                Download All
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md"
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
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Processed Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedFiles.map((file) => (
              <div key={file.id} className="bg-gray-700 rounded-lg overflow-hidden">
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
                    <div>
                      <h3 className="text-white font-medium truncate">{file.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a 
                      href={file.downloadUrl} 
                      download={file.name}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchWorkflowProcessor;
