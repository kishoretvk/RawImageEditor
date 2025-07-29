import React, { useState, useEffect } from 'react';
import WorkflowBuilder from './WorkflowBuilder';

const WorkflowManager = ({ onWorkflowSelect }) => {
  const [workflows, setWorkflows] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load workflows from localStorage on component mount
  useEffect(() => {
    const savedWorkflows = localStorage.getItem('imageEditorWorkflows');
    if (savedWorkflows) {
      try {
        setWorkflows(JSON.parse(savedWorkflows));
      } catch (e) {
        console.error('Failed to parse workflows', e);
      }
    }
  }, []);

  // Save workflows to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('imageEditorWorkflows', JSON.stringify(workflows));
  }, [workflows]);

  const handleSaveWorkflow = (workflow) => {
    const newWorkflow = {
      id: Date.now(),
      ...workflow,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setWorkflows(prev => {
      const existingIndex = prev.findIndex(w => w.id === newWorkflow.id);
      if (existingIndex >= 0) {
        // Update existing workflow
        const updated = [...prev];
        updated[existingIndex] = newWorkflow;
        return updated;
      } else {
        // Add new workflow
        return [...prev, newWorkflow];
      }
    });
    
    setShowBuilder(false);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = (id) => {
    setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="workflow-manager" style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px' 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ 
          color: '#fff', 
          fontSize: '24px', 
          fontWeight: '600' 
        }}>
          Workflow Manager
        </h2>
        <button
          onClick={() => setShowBuilder(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          Create Workflow
        </button>
      </div>
      
      {showBuilder ? (
        <WorkflowBuilder
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowBuilder(false);
            setEditingWorkflow(null);
          }}
          initialWorkflow={editingWorkflow}
        />
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          
          {filteredWorkflows.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)', 
              borderRadius: '15px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ 
                color: '#a0a0a0', 
                marginBottom: '16px',
                fontSize: '18px'
              }}>
                {searchTerm ? 'No matching workflows found' : 'No workflows created yet'}
              </h3>
              <p style={{ 
                color: '#6c757d', 
                marginBottom: '24px'
              }}>
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first workflow to get started with batch processing'}
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Create Workflow
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {filteredWorkflows.map(workflow => (
                <div 
                  key={workflow.id} 
                  style={{
                    background: 'linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)',
                    borderRadius: '15px',
                    padding: '20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ 
                      color: '#4a9eff', 
                      fontSize: '18px', 
                      fontWeight: '600',
                      margin: 0
                    }}>
                      {workflow.name}
                    </h3>
                    <span style={{ 
                      color: '#a0a0a0', 
                      fontSize: '12px',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {workflow.steps.length} steps
                    </span>
                  </div>
                  
                  <div style={{ 
                    marginBottom: '20px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {workflow.steps.map((step, index) => (
                      <div 
                        key={index} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <span style={{
                          background: '#4a9eff',
                          color: '#fff',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginRight: '10px'
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ 
                          color: '#e0e0e0',
                          fontSize: '14px'
                        }}>
                          {step.type}
                          {step.type === 'convert' && ` (${step.settings.format || 'jpeg'})`}
                          {step.type === 'preset' && ` (${step.settings.preset?.name || 'preset'})`}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => onWorkflowSelect(workflow)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #4a9eff 0%, #3a8eed 100%)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleEditWorkflow(workflow)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#e0e0e0',
                        border: '1px solid #4a5568',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'rgba(255,69,69,0.1)',
                        color: '#ff6b6b',
                        border: '1px solid #ff6b6b',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#a0a0a0',
                    fontSize: '12px'
                  }}>
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowManager;
