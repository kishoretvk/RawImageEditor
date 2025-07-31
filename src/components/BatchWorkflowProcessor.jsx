import React, { useState, useRef, useCallback, useEffect } from 'react';
import FileUploader from './FileUploader';
import WorkflowManager from './WorkflowManager';
import ImageSlider from './ImageSlider';
import { batchProcessImages } from '../utils/batchExport';
import { isRawFormat, processRAWFile, convertRAWToJPEG } from '../utils/rawProcessor';
import { applyProfessionalFilters } from './EnhancedImageCanvas_professional';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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

  // Process a single file with a given workflow
  const processFileWithWorkflow = useCallback(async (file, workflow) => {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let currentFile = file;

    // If RAW, convert to a processable format first
    if (isRawFormat(file.name)) {
        const rawProcessed = await convertRAWToJPEG(file, {
            outputFormat: 'jpeg',
            quality: 0.95,
            enhanceQuality: true
        });
        const blob = await fetch(rawProcessed.url).then(r => r.blob());
        currentFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
    }

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);

    // Apply each step in the workflow
    for (const step of workflow.steps) {
        if (step.type === 'preset') {
            const preset = presets.find(p => p.id === step.settings.preset?.id);
            if (preset) {
                applyProfessionalFilters(ctx, canvas, preset.settings);
            }
        } else if (step.type === 'resize') {
            const { dimension } = step.settings;
            const ratio = Math.min(dimension / canvas.width, dimension / canvas.height);
            const newWidth = Math.round(canvas.width * ratio);
            const newHeight = Math.round(canvas.height * ratio);
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            tempCanvas.getContext('2d').drawImage(canvas, 0, 0, newWidth, newHeight);
            canvas = tempCanvas;
            ctx = canvas.getContext('2d');
        } else if (step.type === 'watermark') {
            // Simple watermark example
            ctx.font = '48px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText('RawImageEditor', canvas.width / 2, canvas.height / 2);
        }
    }

    // Handle final conversion
    const convertStep = workflow.steps.find(step => step.type === 'convert');
    const format = convertStep?.settings.format || 'jpeg';
    const quality = (convertStep?.settings.quality || 80) / 100;
    const mimeType = `image/${format}`;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
    
    return {
        blob,
        name: file.name.replace(/\.[^/.]+$/, `_processed.${format}`),
    };
  }, [presets]);

  // Handle processing files with workflow
  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0 || !selectedWorkflow) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessedFiles([]);
    setProcessingStats({ total: files.length, completed: 0, failed: 0 });
    
    const results = [];
    for (let i = 0; i < files.length; i++) {
        try {
            const result = await processFileWithWorkflow(files[i], selectedWorkflow);
            const processedFile = {
                id: Date.now() + i,
                originalFile: files[i],
                name: result.name,
                size: result.blob.size,
                status: 'completed',
                downloadUrl: URL.createObjectURL(result.blob),
                previewUrl: URL.createObjectURL(result.blob)
            };
            results.push(processedFile);
            setProcessingStats(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error) {
            console.error(`Error processing file ${files[i].name}:`, error);
            const failedFile = {
                id: Date.now() + i,
                originalFile: files[i],
                name: files[i].name,
                size: files[i].size,
                status: 'failed',
                error: error.message
            };
            results.push(failedFile);
            setProcessingStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
        setProcessedFiles(prev => [...prev, ...results.slice(prev.length)]);
        setProcessingProgress(((i + 1) / files.length) * 100);
    }
    
    setShowResults(true);
    setIsProcessing(false);
  }, [files, selectedWorkflow, processFileWithWorkflow]);

  // Handle downloading all processed files as a ZIP
  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip();
    const successfulFiles = processedFiles.filter(file => file.status === 'completed');
    
    if (successfulFiles.length === 0) {
        alert('No successfully processed files to download');
        return;
    }

    for (const file of successfulFiles) {
        const response = await fetch(file.downloadUrl);
        const blob = await response.blob();
        zip.file(file.name, blob);
    }

    zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, 'processed_images.zip');
    });
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

  return (
    <div className="batch-workflow-processor">
      {!showResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">1. Upload Images</h2>
            <FileUploader onFilesSelected={handleFilesSelected} multiple={true} accept="image/*" className="mb-6" />
            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white">Selected Files ({files.length})</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 mt-3">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300 ml-2">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 className="text-xl font-bold text-white mb-4 mt-6">2. Select Workflow</h2>
            <div className="space-y-3">
              {workflows.filter(w => w.isActive !== false).map(workflow => (
                <div key={workflow.id} onClick={() => setSelectedWorkflow(workflow)}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${selectedWorkflow?.id === workflow.id ? 'bg-blue-900 border-blue-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                  <h4 className="text-white font-medium">{workflow.name}</h4>
                </div>
              ))}
            </div>
            <button onClick={handleProcessFiles} disabled={files.length === 0 || !selectedWorkflow || isProcessing}
              className={`w-full py-3 mt-6 rounded-lg font-medium transition-all ${files.length === 0 || !selectedWorkflow || isProcessing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
              {isProcessing ? `Processing... ${Math.round(processingProgress)}%` : '3. Process Images'}
            </button>
          </div>
          <div className="lg:col-span-2">
            <WorkflowManager onWorkflowSelect={setSelectedWorkflow} />
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white">Processing Results</h2>
          <p className="text-gray-400">{processingStats.completed} completed, {processingStats.failed} failed</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleDownloadAll} className="px-4 py-2 bg-green-600 text-white rounded-md">Download All</button>
            <button onClick={handleReset} className="px-4 py-2 bg-gray-600 text-white rounded-md">Process More</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {processedFiles.map((file) => (
              <div key={file.id} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                {file.status === 'completed' ? (
                  <>
                    <div className="h-48">
                      <ImageSlider originalImage={URL.createObjectURL(file.originalFile)} editedImage={file.previewUrl} />
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium truncate">{file.name}</h3>
                      <a href={file.downloadUrl} download={file.name} className="text-blue-400 hover:text-blue-300">Download</a>
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center p-4 text-center">
                    <h3 className="text-white font-medium truncate mb-1">{file.name}</h3>
                    <p className="text-red-400 text-sm">Processing failed</p>
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
