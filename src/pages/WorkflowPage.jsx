import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BatchWorkflowProcessor from '../components/BatchWorkflowProcessor';
import '../styles/pages.css';

const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [presets, setPresets] = useState([]);

  // Load workflows and presets from localStorage on component mount
  useEffect(() => {
    const savedWorkflows = localStorage.getItem('imageEditorWorkflows');
    if (savedWorkflows) {
      try {
        setWorkflows(JSON.parse(savedWorkflows));
      } catch (e) {
        console.error('Failed to parse workflows', e);
      }
    }
    
    const savedPresets = localStorage.getItem('imageEditorPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }
  }, []);

  // Save workflows to localStorage whenever they change
  const handleWorkflowsChange = (updatedWorkflows) => {
    setWorkflows(updatedWorkflows);
    localStorage.setItem('imageEditorWorkflows', JSON.stringify(updatedWorkflows));
  };

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
          <h1>Workflow Management</h1>
          <p>Streamline your image processing workflow</p>
          <BatchWorkflowProcessor 
            workflows={workflows}
            presets={presets}
            onWorkflowsChange={handleWorkflowsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
