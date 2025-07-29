import React from 'react';
import CurveEditor from '../CurveEditor';
import { useCurve } from '../../context/CurveContext';

const CurvesPanel = ({ isActive, onPanelChange }) => {
  const { curves, updateCurve } = useCurve();
  
  if (!isActive) return null;
  
  return (
    <div className="curves-panel" style={{ 
      padding: '20px',
      background: '#1a1a1a',
      borderRadius: '8px',
      color: '#e0e0e0'
    }}>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: '#4a9eff'
      }}>
        Tone Curves
      </h2>
      
      <p style={{ 
        fontSize: '14px', 
        color: '#a0a0a0', 
        marginBottom: '20px' 
      }}>
        Adjust the tonal range of your image by modifying curve points. 
        Drag points to create custom curves or double-click to remove points.
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        <CurveEditor channel="rgb" />
        <CurveEditor channel="r" />
        <CurveEditor channel="g" />
        <CurveEditor channel="b" />
        <CurveEditor channel="luminance" />
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '6px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '10px' 
        }}>
          Curve Presets
        </h3>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          flexWrap: 'wrap' 
        }}>
          <button
            onClick={() => {
              // Reset all curves to linear
              updateCurve('rgb', [[0, 0], [1, 1]]);
              updateCurve('r', [[0, 0], [1, 1]]);
              updateCurve('g', [[0, 0], [1, 1]]);
              updateCurve('b', [[0, 0], [1, 1]]);
              updateCurve('luminance', [[0, 0], [1, 1]]);
            }}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #4a5568',
              color: '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reset All
          </button>
          <button
            onClick={() => {
              // S-curve for contrast
              updateCurve('rgb', [[0, 0], [0.25, 0.1], [0.75, 0.9], [1, 1]]);
            }}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #4a5568',
              color: '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            S-Curve (Contrast)
          </button>
          <button
            onClick={() => {
              // Inverse S-curve for softness
              updateCurve('rgb', [[0, 0], [0.25, 0.3], [0.75, 0.7], [1, 1]]);
            }}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #4a5568',
              color: '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Inverse S (Soft)
          </button>
          <button
            onClick={() => {
              // Shadows boost
              updateCurve('rgb', [[0, 0.2], [0.5, 0.5], [1, 1]]);
            }}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #4a5568',
              color: '#e0e0e0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Shadows Boost
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurvesPanel;
