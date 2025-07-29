import React, { useState } from 'react';
import PresetSelector from './PresetSelector';
import UnifiedSlider from './UnifiedSlider';

const WorkflowBuilder = ({ onSave, onCancel, initialWorkflow = null }) => {
  const [workflow, setWorkflow] = useState({
    name: '',
    steps: [],
    ...(initialWorkflow || {})
  });
  const [currentStep, setCurrentStep] = useState({
    type: 'convert',
    settings: {}
  });

  const handleAddStep = () => {
    if (currentStep.type) {
      setWorkflow(prev => ({
        ...prev,
        steps: [...prev.steps, { ...currentStep, id: Date.now() }]
      }));
      setCurrentStep({ type: 'convert', settings: {} });
    }
  };

  const handleRemoveStep = (id) => {
    setWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== id)
    }));
  };

  const handleSave = () => {
    if (workflow.name && workflow.steps.length > 0) {
      onSave(workflow);
    }
  };

  const updateCurrentStepSetting = (key, value) => {
    setCurrentStep(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  return (
    <div className="workflow-builder" style={{ 
      background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', 
      borderRadius: '15px', 
      padding: '24px', 
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      color: '#e0e0e0'
    }}>
      <h2 style={{ 
        color: '#4a9eff', 
        marginBottom: '24px', 
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {initialWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
      </h2>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          color: '#a0a0a0',
          fontWeight: '500'
        }}>
          Workflow Name
        </label>
        <input
          type="text"
          value={workflow.name}
          onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter workflow name"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #4a5568',
            color: '#e0e0e0',
            fontSize: '16px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          color: '#4a9eff', 
          marginBottom: '16px',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Add Processing Step
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: '#a0a0a0',
            fontWeight: '500'
          }}>
            Step Type
          </label>
          <select
            value={currentStep.type}
            onChange={(e) => setCurrentStep(prev => ({ ...prev, type: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #4a5568',
              color: '#e0e0e0',
              fontSize: '16px'
            }}
          >
            <option value="convert">Convert Format</option>
            <option value="preset">Apply Preset</option>
            <option value="resize">Resize Image</option>
            <option value="watermark">Add Watermark</option>
          </select>
        </div>
        
        {currentStep.type === 'convert' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#a0a0a0',
              fontWeight: '500'
            }}>
              Output Format
            </label>
            <select
              value={currentStep.settings.format || 'jpeg'}
              onChange={(e) => updateCurrentStepSetting('format', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #4a5568',
                color: '#e0e0e0',
                fontSize: '16px',
                marginBottom: '16px'
              }}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
            
            {currentStep.settings.format === 'jpeg' && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#a0a0a0',
                  fontWeight: '500'
                }}>
                  JPEG Quality: {currentStep.settings.quality || 80}%
                </label>
                <UnifiedSlider
                  min={1}
                  max={100}
                  value={currentStep.settings.quality || 80}
                  onChange={(value) => updateCurrentStepSetting('quality', value)}
                />
              </div>
            )}
          </div>
        )}
        
        {currentStep.type === 'preset' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#a0a0a0',
              fontWeight: '500'
            }}>
              Select Preset
            </label>
            <PresetSelector 
              onPresetSelect={(preset) => updateCurrentStepSetting('preset', preset)}
              selectedPreset={currentStep.settings.preset}
            />
          </div>
        )}
        
        {currentStep.type === 'resize' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#a0a0a0',
              fontWeight: '500'
            }}>
              Max Dimension (px)
            </label>
            <input
              type="number"
              value={currentStep.settings.dimension || 1920}
              onChange={(e) => updateCurrentStepSetting('dimension', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #4a5568',
                color: '#e0e0e0',
                fontSize: '16px'
              }}
            />
          </div>
        )}
        
        <button
          onClick={handleAddStep}
          disabled={!currentStep.type}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            background: currentStep.type ? 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)' : '#4a5568',
            color: '#fff',
            border: 'none',
            cursor: currentStep.type ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          Add Step
        </button>
      </div>
      
      {workflow.steps.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            color: '#4a9eff', 
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Workflow Steps
          </h3>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {workflow.steps.map((step, index) => (
              <div 
                key={step.id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}
              >
                <div>
                  <span style={{ fontWeight: '600', color: '#4a9eff' }}>
                    Step {index + 1}: {step.type}
                  </span>
                  <div style={{ fontSize: '14px', color: '#a0a0a0', marginTop: '4px' }}>
                    {step.type === 'convert' && `Format: ${step.settings.format || 'jpeg'}${step.settings.format === 'jpeg' ? `, Quality: ${step.settings.quality || 80}%` : ''}`}
                    {step.type === 'preset' && `Preset: ${step.settings.preset?.name || 'None'}`}
                    {step.type === 'resize' && `Dimension: ${step.settings.dimension || 1920}px`}
                    {step.type === 'watermark' && 'Add watermark'}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStep(step.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={!workflow.name || workflow.steps.length === 0}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            background: workflow.name && workflow.steps.length > 0 
              ? 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)' 
              : '#4a5568',
            color: '#fff',
            border: 'none',
            cursor: workflow.name && workflow.steps.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Save Workflow
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: '#e0e0e0',
            border: '1px solid #4a5568',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
