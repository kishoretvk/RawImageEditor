import React, { useState, useEffect } from 'react';
import PresetSelector from './PresetSelector';

const WorkflowBuilder = ({ 
  onSave, 
  onCancel, 
  initialWorkflow = null,
  availablePresets = []
}) => {
  const [workflow, setWorkflow] = useState({
    name: '',
    steps: [],
    isActive: true,
    createdAt: new Date().toISOString()
  });

  const [newStep, setNewStep] = useState({
    type: 'preset',
    presetId: '',
    parameters: {},
    order: 0
  });

  // Initialize workflow if editing existing one
  useEffect(() => {
    if (initialWorkflow) {
      setWorkflow(initialWorkflow);
    }
  }, [initialWorkflow]);

  // Handle workflow name change
  const handleNameChange = (e) => {
    setWorkflow(prev => ({
      ...prev,
      name: e.target.value
    }));
  };

  // Add a new step to the workflow
  const handleAddStep = () => {
    if (!newStep.presetId) return;
    
    const step = {
      id: Date.now(),
      ...newStep,
      order: workflow.steps.length
    };
    
    setWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, step]
    }));
    
    // Reset new step form
    setNewStep({
      type: 'preset',
      presetId: '',
      parameters: {},
      order: 0
    });
  };

  // Remove a step from the workflow
  const handleRemoveStep = (stepId) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps
        .filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, order: index }))
    }));
  };

  // Move a step up in the order
  const handleMoveStepUp = (stepId) => {
    setWorkflow(prev => {
      const steps = [...prev.steps];
      const index = steps.findIndex(step => step.id === stepId);
      
      if (index > 0) {
        // Swap with previous step
        [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]];
        // Update order
        steps.forEach((step, i) => step.order = i);
      }
      
      return { ...prev, steps };
    });
  };

  // Move a step down in the order
  const handleMoveStepDown = (stepId) => {
    setWorkflow(prev => {
      const steps = [...prev.steps];
      const index = steps.findIndex(step => step.id === stepId);
      
      if (index < steps.length - 1) {
        // Swap with next step
        [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
        // Update order
        steps.forEach((step, i) => step.order = i);
      }
      
      return { ...prev, steps };
    });
  };

  // Handle new step changes
  const handleNewStepChange = (field, value) => {
    setNewStep(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save the workflow
  const handleSave = () => {
    if (!workflow.name.trim()) {
      alert('Please enter a workflow name');
      return;
    }
    
    if (workflow.steps.length === 0) {
      alert('Please add at least one step to the workflow');
      return;
    }
    
    const workflowToSave = {
      ...workflow,
      id: workflow.id || Date.now(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(workflowToSave);
  };

  // Get preset by ID
  const getPresetById = (presetId) => {
    return availablePresets.find(preset => preset.id === presetId);
  };

  return (
    <div className="workflow-builder bg-gray-800 rounded-lg p-6">
      <div className="workflow-builder-header mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {initialWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
        </h2>
        <p className="text-gray-400">
          Define your image processing workflow with presets and custom steps
        </p>
      </div>

      {/* Workflow Name */}
      <div className="workflow-name mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Workflow Name
        </label>
        <input
          type="text"
          value={workflow.name}
          onChange={handleNameChange}
          placeholder="Enter workflow name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Step Section */}
      <div className="add-step-section mb-6 bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-3">Add Step</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Step Type
            </label>
            <select
              value={newStep.type}
              onChange={(e) => handleNewStepChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="preset">Apply Preset</option>
              <option value="convert">Convert Format</option>
              <option value="resize">Resize Image</option>
              <option value="export">Export Settings</option>
            </select>
          </div>
          
          {newStep.type === 'preset' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Preset
              </label>
              <PresetSelector
                presets={availablePresets}
                selectedPreset={newStep.presetId}
                onPresetSelect={(presetId) => handleNewStepChange('presetId', presetId)}
                className="w-full"
              />
            </div>
          )}
          
          {newStep.type === 'convert' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Format
              </label>
              <select
                value={newStep.parameters.format || 'jpeg'}
                onChange={(e) => handleNewStepChange('parameters', {
                  ...newStep.parameters,
                  format: e.target.value
                })}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="tiff">TIFF</option>
              </select>
            </div>
          )}
          
          {newStep.type === 'resize' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={newStep.parameters.width || ''}
                  onChange={(e) => handleNewStepChange('parameters', {
                    ...newStep.parameters,
                    width: parseInt(e.target.value) || 0
                  })}
                  placeholder="Width"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={newStep.parameters.height || ''}
                  onChange={(e) => handleNewStepChange('parameters', {
                    ...newStep.parameters,
                    height: parseInt(e.target.value) || 0
                  })}
                  placeholder="Height"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleAddStep}
          disabled={!newStep.presetId && newStep.type === 'preset'}
          className={`mt-4 px-4 py-2 rounded-md ${
            (!newStep.presetId && newStep.type === 'preset') 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Add Step
        </button>
      </div>

      {/* Workflow Steps */}
      <div className="workflow-steps mb-6">
        <h3 className="text-lg font-medium text-white mb-3">Workflow Steps</h3>
        
        {workflow.steps.length === 0 ? (
          <div className="text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">No steps added yet</p>
            <p className="text-gray-500 text-sm mt-1">Add steps to build your workflow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflow.steps
              .sort((a, b) => a.order - b.order)
              .map((step, index) => {
                const preset = step.type === 'preset' ? getPresetById(step.presetId) : null;
                
                return (
                  <div 
                    key={step.id} 
                    className="flex items-center justify-between bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center">
                      <div className="flex flex-col items-center mr-4">
                        <span className="text-gray-400 text-sm">Step</span>
                        <span className="text-white font-medium">{index + 1}</span>
                      </div>
                      
                      <div>
                        <div className="text-white font-medium">
                          {step.type === 'preset' && preset ? preset.name : step.type}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {step.type === 'preset' && preset && (
                            <span>Preset: {preset.name}</span>
                          )}
                          {step.type === 'convert' && (
                            <span>Convert to {step.parameters.format || 'JPEG'}</span>
                          )}
                          {step.type === 'resize' && (
                            <span>Resize to {step.parameters.width}×{step.parameters.height}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMoveStepUp(step.id)}
                        disabled={index === 0}
                        className={`p-2 rounded ${
                          index === 0 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveStepDown(step.id)}
                        disabled={index === workflow.steps.length - 1}
                        className={`p-2 rounded ${
                          index === workflow.steps.length - 1 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveStep(step.id)}
                        className="p-2 text-red-400 hover:bg-gray-600 rounded"
                        title="Remove step"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="workflow-actions flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Save Workflow
        </button>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
