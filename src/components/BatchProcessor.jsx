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
    <div className="batch-processor" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 className="text-2xl font-bold mb-4" style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>Batch Processing Workflow</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload Section */}
        <div className="bg-gray-800 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#4a9eff' }}>Upload Images</h3>
          <FileUploader 
            onFilesSelected={handleFilesSelected}
            multiple={true}
            accept="image/*"
          />
          
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2" style={{ color: '#e0e0e0' }}>Selected Files ({files.length})</h4>
              <div className="max-h-40 overflow-y-auto" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-1" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
                    <span className="text-sm truncate" style={{ color: '#e0e0e0', maxWidth: '70%' }}>{file.name}</span>
                    <button 
                      className="text-red-500 hover:text-red-300"
                      onClick={() => handleRemoveFile(index)}
                      style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
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
        <div className="bg-gray-800 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#4a9eff' }}>Workflow Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center" style={{ alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="convertToJpeg"
                checked={workflow.convertToJpeg}
                onChange={(e) => handleWorkflowChange('convertToJpeg', e.target.checked)}
                className="mr-2"
                style={{ marginRight: '10px', width: '18px', height: '18px', accentColor: '#4a9eff' }}
              />
              <label htmlFor="convertToJpeg" style={{ color: '#e0e0e0', fontSize: '16px' }}>Convert to JPEG</label>
            </div>
            
            {workflow.convertToJpeg && (
              <div className="ml-6" style={{ marginLeft: '24px', marginBottom: '16px' }}>
                <label className="block mb-1" style={{ color: '#a0a0a0', marginBottom: '8px', display: 'block' }}>JPEG Quality: {workflow.jpegQuality}%</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={workflow.jpegQuality}
                  onChange={(e) => handleWorkflowChange('jpegQuality', parseInt(e.target.value))}
                  className="w-full"
                  style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#4a9eff', outline: 'none' }}
                />
              </div>
            )}
            
            <div className="flex items-center" style={{ alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="applyPreset"
                checked={workflow.applyPreset}
                onChange={(e) => handleWorkflowChange('applyPreset', e.target.checked)}
                className="mr-2"
                style={{ marginRight: '10px', width: '18px', height: '18px', accentColor: '#4a9eff' }}
              />
              <label htmlFor="applyPreset" style={{ color: '#e0e0e0', fontSize: '16px' }}>Apply Preset</label>
            </div>
            
            {workflow.applyPreset && (
              <div className="ml-6" style={{ marginLeft: '24px', marginBottom: '16px' }}>
                <PresetManager 
                  onApplyPreset={handleApplyPreset}
                  currentEdits={workflow.selectedPreset || {}}
                />
              </div>
            )}
            
            <div className="flex items-center" style={{ alignItems: 'center', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="keepOriginal"
                checked={workflow.keepOriginal}
                onChange={(e) => handleWorkflowChange('keepOriginal', e.target.checked)}
                className="mr-2"
                style={{ marginRight: '10px', width: '18px', height: '18px', accentColor: '#4a9eff' }}
              />
              <label htmlFor="keepOriginal" style={{ color: '#e0e0e0', fontSize: '16px' }}>Keep Original Files</label>
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
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '600',
              background: files.length === 0 || isProcessing ? '#4a5568' : 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)',
              color: '#fff',
              border: 'none',
              cursor: files.length === 0 || isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (files.length > 0 && !isProcessing) {
                e.target.style.background = 'linear-gradient(135deg, #66b3ff 0%, #4a9eff 100%)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 255, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (files.length > 0 && !isProcessing) {
                e.target.style.background = 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {isProcessing ? `Processing... ${Math.round(progress)}%` : 'Process Batch'}
          </button>
        </div>
      </div>
      
      {/* Progress and Results */}
      {isProcessing && (
        <div className="mt-6 bg-gray-800 p-4 rounded-xl" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#4a9eff', marginBottom: '16px' }}>Processing Progress</h3>
          <div className="w-full bg-gray-700 rounded-full h-2.5" style={{ width: '100%', background: '#4a5568', borderRadius: '12px', height: '10px', marginBottom: '12px' }}>
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4a9eff, #66b3ff)', height: '10px', borderRadius: '12px', transition: 'width 0.3s ease' }}
            ></div>
          </div>
          <p className="text-center mt-2" style={{ textAlign: 'center', color: '#e0e0e0' }}>{Math.round(progress)}% Complete</p>
        </div>
      )}
      
      {processedFiles.length > 0 && (
        <div className="mt-6 bg-gray-800 p-4 rounded-xl" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', borderRadius: '15px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div className="flex justify-between items-center mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="text-lg font-bold" style={{ color: '#4a9eff' }}>Processed Files</h3>
            <button 
              className="bg-primary text-white px-4 py-2 rounded"
              onClick={handleDownloadAll}
              style={{ background: 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Download All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {processedFiles.map(file => (
              <div key={file.id} className="bg-gray-700 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                <p className="font-medium truncate" style={{ fontWeight: '600', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                <p className="text-sm text-gray-400" style={{ fontSize: '14px', color: '#a0a0a0' }}>{(file.size / 1024).toFixed(1)} KB</p>
                {file.status === 'completed' ? (
                  <a 
                    href={file.dataUrl} 
                    download={file.name}
                    className="text-primary text-sm mt-1 inline-block"
                    style={{ color: '#4a9eff', fontSize: '14px', marginTop: '4px', display: 'inline-block', textDecoration: 'none' }}
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-red-500 text-sm mt-1 inline-block" style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '4px', display: 'inline-block' }}>
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
