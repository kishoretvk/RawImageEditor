import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './BatchWorkflowProcessor.css';

const BatchWorkflowProcessor = ({ workflow, presets }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = (acceptedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'queued',
      progress: 0,
    }))]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const processFiles = async () => {
    setProcessing(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      file.status = 'processing';
      setFiles([...files]);

      // Simulate processing for now
      for (let p = 0; p <= 100; p += 10) {
        await new Promise(res => setTimeout(res, 50));
        file.progress = p;
        setProgress(((i + (p / 100)) / files.length) * 100);
        setFiles([...files]);
      }

      file.status = 'complete';
      setFiles([...files]);
    }
    setProcessing(false);
  };

  return (
    <div className="batch-processor">
      <h3>Run Workflow: {workflow.name}</h3>
      
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>

      <div className="file-list">
        {files.map(file => (
          <div key={file.id} className="file-item">
            <span className="file-name">{file.file.name}</span>
            <span className={`status ${file.status}`}>{file.status}</span>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${file.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {files.length > 0 && (
        <div className="batch-actions">
          <button onClick={processFiles} disabled={processing} className="btn-primary">
            {processing ? `Processing... ${Math.round(progress)}%` : 'Run Batch Process'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchWorkflowProcessor;
