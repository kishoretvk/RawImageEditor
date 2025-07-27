import React, { useState, useEffect } from 'react';
import WorkflowBuilder from './WorkflowBuilder';
import { batchProcessImages } from '../utils/batchExport';

const WorkflowManager = ({ 
  workflows = [], 
  presets = [],
  onWorkflowsChange,
  onProcessComplete
}) => {
  const [activeWorkflows, setActiveWorkflows] = useState(workflows);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  // Update active workflows when prop changes
  useEffect(() => {
    setActiveWorkflows(workflows);
  }, [workflows]);

  // Filter workflows based on search term
  const filteredWorkflows = activeWorkflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle saving a workflow
  const handleSaveWorkflow = (workflow) => {
    const updatedWorkflows = activeWorkflows.some(w => w.id === workflow.id)
      ? activeWorkflows.map(w => w.id === workflow.id ? workflow : w)
      : [...activeWorkflows, workflow];
    
    setActiveWorkflows(updatedWorkflows);
    if (onWorkflowsChange) {
      onWorkflowsChange(updatedWorkflows);
    }
    
    setShowBuilder(false);
    setEditingWorkflow(null);
  };

  // Handle deleting a workflow
  const handleDeleteWorkflow = (workflowId) => {
    const updatedWorkflows = activeWorkflows.filter(w => w.id !== workflowId);
    setActiveWorkflows(updatedWorkflows);
    if (onWorkflowsChange) {
      onWorkflowsChange(updatedWorkflows);
    }
  };

  // Handle editing a workflow
  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  // Handle toggling workflow active state
  const handleToggleWorkflow = (workflowId) => {
    const updatedWorkflows = activeWorkflows.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, isActive: !workflow.isActive } 
        : workflow
    );
    
    setActiveWorkflows(updatedWorkflows);
    if (onWorkflowsChange) {
      onWorkflowsChange(updatedWorkflows);
    }
  };

  // Handle executing a workflow
  const handleExecuteWorkflow = async (workflow, files) => {
    if (!files || files.length === 0) {
      alert('Please select files to process');
      return;
    }
    
    if (workflow.steps.length === 0) {
      alert('Workflow has no steps to execute');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setSelectedWorkflow(workflow);
    
    try {
      // Process images with the workflow
      const results = await batchProcessImages(files, workflow, presets);
      
      setProcessingProgress(100);
      
      if (onProcessComplete) {
        onProcessComplete(results, workflow);
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
      alert('Workflow execution failed: ' + error.message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProcessingProgress(0);
        setSelectedWorkflow(null);
      }, 2000);
    }
  };

  // Get preset by ID
  const getPresetById = (presetId) => {
    return presets.find(preset => preset.id === presetId);
  };

  return (
    <div className="workflow-manager">
      {showBuilder ? (
        <WorkflowBuilder
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
          initialWorkflow={editingWorkflow}
          availablePresets={presets}
        />
      ) : (
        <div className="workflow-list bg-gray-800 rounded-lg p-6">
          <div className="workflow-header mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Workflows</h2>
                <p className="text-gray-400">
                  Manage and execute your image processing workflows
                </p>
              </div>
              <button
                onClick={() => setShowBuilder(true)}
                className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
              >
                <span className="mr-2">+</span>
                Create Workflow
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="workflow-search mb-6">
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Processing Status */}
          {isProcessing && selectedWorkflow && (
            <div className="workflow-processing mb-6 bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">
                  Processing with "{selectedWorkflow.name}"
                </h3>
                <span className="text-gray-400">{Math.round(processingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Workflow List */}
          <div className="workflow-items">
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12 bg-gray-700 rounded-lg">
                <p className="text-gray-400">
                  {searchTerm ? 'No matching workflows found' : 'No workflows created yet'}
                </p>
                <button
                  onClick={() => setShowBuilder(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Create Your First Workflow
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkflows.map((workflow) => (
                  <div 
                    key={workflow.id} 
                    className={`bg-gray-700 rounded-lg p-4 border ${
                      workflow.isActive 
                        ? 'border-gray-600' 
                        : 'border-gray-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{workflow.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleWorkflow(workflow.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            workflow.isActive ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            workflow.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    {/* Workflow Steps Preview */}
                    <div className="mb-4">
                      <div className="text-gray-400 text-xs mb-1">Steps:</div>
                      <div className="flex flex-wrap gap-1">
                        {workflow.steps
                          .sort((a, b) => a.order - b.order)
                          .slice(0, 3)
                          .map((step, index) => {
                            const preset = step.type === 'preset' ? getPresetById(step.presetId) : null;
                            return (
                              <span 
                                key={step.id}
                                className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded"
                                title={step.type === 'preset' && preset ? preset.name : step.type}
                              >
                                {step.type === 'preset' && preset 
                                  ? preset.name.substring(0, 8) + (preset.name.length > 8 ? '...' : '')
                                  : step.type}
                              </span>
                            );
                          })}
                        {workflow.steps.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                            +{workflow.steps.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Workflow Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager;
