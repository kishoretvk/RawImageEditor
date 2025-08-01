import React, { useState, useEffect } from 'react';
import WorkflowManager from '../components/WorkflowManager';
import WorkflowBuilder from '../components/WorkflowBuilder';
import BatchWorkflowProcessor from '../components/BatchWorkflowProcessor';
import PresetManager from '../components/PresetManager';
import '../styles/WorkflowPage.css';

const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [presets, setPresets] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  useEffect(() => {
    setWorkflows(WorkflowManager.getWorkflows());
    setPresets(PresetManager.getPresets());
  }, []);

  const handleSaveWorkflow = (workflow) => {
    WorkflowManager.saveWorkflow(workflow);
    setWorkflows(WorkflowManager.getWorkflows());
    setIsBuilding(false);
    setEditingWorkflow(null);
  };

  const handleSelectWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setIsBuilding(false);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setIsBuilding(true);
  };
  
  const handleDeleteWorkflow = (workflowId) => {
    WorkflowManager.deleteWorkflow(workflowId);
    setWorkflows(WorkflowManager.getWorkflows());
    if (selectedWorkflow && selectedWorkflow.id === workflowId) {
      setSelectedWorkflow(null);
    }
  };

  const startNewWorkflow = () => {
    setEditingWorkflow(null);
    setIsBuilding(true);
    setSelectedWorkflow(null);
  };

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <h1>Workflow Automation</h1>
        <p>Create, manage, and run powerful batch processing workflows.</p>
      </header>

      <div className="workflow-container">
        <aside className="workflow-sidebar">
          <div className="sidebar-header">
            <h2>Your Workflows</h2>
            <button className="btn-primary" onClick={startNewWorkflow}>
              + New Workflow
            </button>
          </div>
          <ul className="workflow-list">
            {workflows.map(wf => (
              <li 
                key={wf.id} 
                className={`workflow-item ${selectedWorkflow?.id === wf.id ? 'active' : ''}`}
                onClick={() => handleSelectWorkflow(wf)}
              >
                <span className="workflow-name">{wf.name}</span>
                <div className="workflow-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleEditWorkflow(wf); }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="workflow-main">
          {isBuilding ? (
            <WorkflowBuilder 
              presets={presets}
              onSave={handleSaveWorkflow}
              workflow={editingWorkflow}
              onCancel={() => setIsBuilding(false)}
            />
          ) : selectedWorkflow ? (
            <BatchWorkflowProcessor
              workflow={selectedWorkflow}
              presets={presets}
            />
          ) : (
            <div className="empty-state">
              <h2>Select a workflow to run, or create a new one.</h2>
              <p>Workflows allow you to apply a series of edits to multiple images at once.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WorkflowPage;
