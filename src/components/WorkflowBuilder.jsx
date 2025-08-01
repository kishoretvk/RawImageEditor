import React, { useState, useEffect } from 'react';
import './WorkflowBuilder.css';

const WorkflowBuilder = ({ presets, onSave, workflow, onCancel }) => {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setSteps(workflow.steps);
    } else {
      setName('');
      setSteps([]);
    }
  }, [workflow]);

  const addStep = (type) => {
    setSteps([...steps, { type, params: {} }]);
  };

  const updateStep = (index, params) => {
    const newSteps = [...steps];
    newSteps[index].params = params;
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleSave = () => {
    const newWorkflow = {
      id: workflow ? workflow.id : null,
      name,
      steps,
    };
    onSave(newWorkflow);
  };

  return (
    <div className="workflow-builder">
      <h2>{workflow ? 'Edit Workflow' : 'Create New Workflow'}</h2>
      <div className="form-group">
        <label>Workflow Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="e.g., 'Social Media JPEGs'"
        />
      </div>

      <h3>Workflow Steps</h3>
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-header">
              <h4>Step {index + 1}: {step.type}</h4>
              <button onClick={() => removeStep(index)} className="btn-remove">Remove</button>
            </div>
            {step.type === 'apply_preset' && (
              <div className="form-group">
                <label>Preset</label>
                <select 
                  value={step.params.presetId || ''}
                  onChange={(e) => updateStep(index, { presetId: e.target.value })}
                >
                  <option value="" disabled>Select a preset</option>
                  {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
            )}
            {step.type === 'convert_format' && (
              <div className="form-group">
                <label>Format</label>
                <select 
                  value={step.params.format || 'jpeg'}
                  onChange={(e) => updateStep(index, { format: e.target.value })}
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="tiff">TIFF</option>
                </select>
              </div>
            )}
             {step.type === 'resize' && (
              <div className="form-group">
                <label>Max Width (px)</label>
                <input 
                  type="number"
                  value={step.params.width || ''}
                  onChange={(e) => updateStep(index, { ...step.params, width: parseInt(e.target.value) })}
                />
                 <label>Max Height (px)</label>
                <input 
                  type="number"
                  value={step.params.height || ''}
                  onChange={(e) => updateStep(index, { ...step.params, height: parseInt(e.target.value) })}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="add-step-buttons">
        <button onClick={() => addStep('apply_preset')}>+ Add Preset Step</button>
        <button onClick={() => addStep('convert_format')}>+ Add Convert Step</button>
        <button onClick={() => addStep('resize')}>+ Add Resize Step</button>
      </div>

      <div className="builder-actions">
        <button onClick={handleSave} className="btn-primary">Save Workflow</button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
