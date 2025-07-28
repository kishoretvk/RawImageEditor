import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BatchWorkflowProcessor from '../components/BatchWorkflowProcessor';
import '../styles/pages.css';

const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [presets, setPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workflows and presets from localStorage on component mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Load workflows
        const savedWorkflows = localStorage.getItem('imageEditorWorkflows');
        if (savedWorkflows) {
          const parsedWorkflows = JSON.parse(savedWorkflows);
          // Ensure each workflow has required properties
          const validatedWorkflows = parsedWorkflows.map(workflow => ({
            ...workflow,
            isActive: workflow.isActive !== undefined ? workflow.isActive : true,
            steps: workflow.steps || [],
            createdAt: workflow.createdAt || new Date().toISOString()
          }));
          setWorkflows(validatedWorkflows);
        }
        
        // Load presets
        const savedPresets = localStorage.getItem('imageEditorPresets');
        if (savedPresets) {
          const parsedPresets = JSON.parse(savedPresets);
          // Ensure each preset has required properties
          const validatedPresets = parsedPresets.map(preset => ({
            ...preset,
            id: preset.id || Date.now() + Math.random(),
            createdAt: preset.createdAt || new Date().toISOString()
          }));
          setPresets(validatedPresets);
        }
      } catch (e) {
        console.error('Failed to load stored data', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStoredData();
  }, []);

  // Save workflows to localStorage whenever they change
  const handleWorkflowsChange = (updatedWorkflows) => {
    setWorkflows(updatedWorkflows);
    localStorage.setItem('imageEditorWorkflows', JSON.stringify(updatedWorkflows));
  };

  // Save presets to localStorage whenever they change
  const handlePresetsChange = (updatedPresets) => {
    setPresets(updatedPresets);
    localStorage.setItem('imageEditorPresets', JSON.stringify(updatedPresets));
  };

  if (isLoading) {
    return (
      <div className="page">
        <nav className="top-navigation">
          <div className="nav-container">
            <div className="logo">RawConverter</div>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/editor" className="nav-link">Editor</Link>
              <Link to="/compression" className="nav-link">Compression</Link>
              <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
            </div>
          </div>
        </nav>
        
        <div className="page-content">
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Professional Workflow Management</h1>
            <p className="text-gray-400 text-lg">
              Streamline your image processing with automated workflows and batch operations
            </p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">{workflows.length}</div>
              <div className="text-gray-400">Workflows</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">{presets.length}</div>
              <div className="text-gray-400">Presets</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {workflows.filter(w => w.isActive).length}
              </div>
              <div className="text-gray-400">Active Workflows</div>
            </div>
          </div>
          
          {/* Workflow Processor */}
          <BatchWorkflowProcessor 
            workflows={workflows}
            presets={presets}
            onWorkflowsChange={handleWorkflowsChange}
          />
          
          {/* Info Section */}
          <div className="mt-12 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">How Workflows Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl mb-3">1️⃣</div>
                <h3 className="text-lg font-bold text-white mb-2">Create Workflow</h3>
                <p className="text-gray-400">
                  Define a sequence of processing steps including preset application, format conversion, and resizing.
                </p>
              </div>
              <div>
                <div className="text-2xl mb-3">2️⃣</div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Images</h3>
                <p className="text-gray-400">
                  Select multiple images to process with your workflow. Supports RAW, JPEG, PNG, and other formats.
                </p>
              </div>
              <div>
                <div className="text-2xl mb-3">3️⃣</div>
                <h3 className="text-lg font-bold text-white mb-2">Process & Download</h3>
                <p className="text-gray-400">
                  Execute your workflow and download all processed images in a single ZIP file.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
