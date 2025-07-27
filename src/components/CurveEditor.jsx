import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createSmoothCurve, curvePresets, createCurveLUT, applyLUTToImageData } from '../utils/curveUtils';

const CurveEditor = ({ 
  points = [[0, 0], [1, 1]], 
  onChange, 
  channel = 'rgb',
  width = 300, 
  height = 300,
  showGrid = true,
  showPresets = true
}) => {
  const canvasRef = useRef(null);
  const [currentPoints, setCurrentPoints] = useState(points);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('linear');

  // Create curve function from points
  const curveFn = useCallback(createSmoothCurve(currentPoints), [currentPoints]);

  // Draw the curve editor
  const drawCurve = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * graphWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = padding + (i / 10) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
    }
    
    // Draw axes
    ctx.strokeStyle = '#718096';
    ctx.lineWidth = 2;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // Draw curve
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i <= graphWidth; i++) {
      const x = i / graphWidth;
      const y = curveFn(x);
      const canvasX = padding + i;
      const canvasY = height - padding - y * graphHeight;
      
      if (i === 0) {
        ctx.moveTo(canvasX, canvasY);
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    
    ctx.stroke();
    
    // Draw control points
    currentPoints.forEach((point, index) => {
      const x = padding + point[0] * graphWidth;
      const y = height - padding - point[1] * graphHeight;
      
      // Draw point
      ctx.fillStyle = index === draggingPoint ? '#f56565' : '#63b3ed';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw point border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Draw labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // X axis labels
    ctx.fillText('0', padding, height - padding + 20);
    ctx.fillText('1', width - padding, height - padding + 20);
    
    // Y axis labels
    ctx.textAlign = 'right';
    ctx.fillText('0', padding - 10, height - padding);
    ctx.fillText('1', padding - 10, padding);
  }, [currentPoints, curveFn, draggingPoint, width, height, showGrid]);

  // Handle mouse events
  const getPointFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    const x = (e.clientX - rect.left - padding) / graphWidth;
    const y = 1 - (e.clientY - rect.top - padding) / graphHeight;
    
    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
  };

  const findNearestPoint = (point) => {
    const threshold = 0.05;
    for (let i = 0; i < currentPoints.length; i++) {
      const dx = currentPoints[i][0] - point[0];
      const dy = currentPoints[i][1] - point[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < threshold) {
        return i;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const point = getPointFromEvent(e);
    if (!point) return;
    
    const nearestPointIndex = findNearestPoint(point);
    
    if (nearestPointIndex !== null) {
      // Drag existing point
      setDraggingPoint(nearestPointIndex);
    } else {
      // Add new point
      const newPoints = [...currentPoints, point].sort((a, b) => a[0] - b[0]);
      setCurrentPoints(newPoints);
      setDraggingPoint(newPoints.length - 1);
      if (onChange) onChange(newPoints);
    }
    
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || draggingPoint === null) return;
    
    const point = getPointFromEvent(e);
    if (!point) return;
    
    // Prevent moving first and last points horizontally
    let newPoints = [...currentPoints];
    if (draggingPoint === 0) {
      // First point - only allow vertical movement
      newPoints[0] = [0, point[1]];
    } else if (draggingPoint === currentPoints.length - 1) {
      // Last point - only allow vertical movement
      newPoints[draggingPoint] = [1, point[1]];
    } else {
      // Middle points - allow both movements but maintain order
      newPoints[draggingPoint] = point;
      
      // Ensure points remain sorted
      newPoints.sort((a, b) => a[0] - b[0]);
      
      // Update dragging point index if it changed
      const newIndex = newPoints.findIndex(p => p[0] === point[0] && p[1] === point[1]);
      if (newIndex !== draggingPoint) {
        setDraggingPoint(newIndex);
      }
    }
    
    setCurrentPoints(newPoints);
    if (onChange) onChange(newPoints);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDraggingPoint(null);
  };

  const handleDeletePoint = (index) => {
    // Don't delete first and last points
    if (index === 0 || index === currentPoints.length - 1) return;
    
    const newPoints = currentPoints.filter((_, i) => i !== index);
    setCurrentPoints(newPoints);
    if (onChange) onChange(newPoints);
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    if (curvePresets[preset]) {
      const newPoints = [...curvePresets[preset]];
      setCurrentPoints(newPoints);
      if (onChange) onChange(newPoints);
    }
  };

  const resetCurve = () => {
    const newPoints = [[0, 0], [1, 1]];
    setCurrentPoints(newPoints);
    setSelectedPreset('linear');
    if (onChange) onChange(newPoints);
  };

  // Draw curve when points change
  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  // Add event listeners for mouse movement
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    
    if (isDrawing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing, handleMouseMove]);

  return (
    <div className="curve-editor">
      <div className="curve-editor-header">
        <h3 className="text-lg font-medium mb-2">Tone Curve ({channel.toUpperCase()})</h3>
        {showPresets && (
          <div className="flex flex-wrap gap-2 mb-3">
            <select 
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
            >
              <option value="linear">Linear</option>
              <option value="sCurve">S-Curve</option>
              <option value="highlightCompress">Highlight Compress</option>
              <option value="shadowBoost">Shadow Boost</option>
              <option value="contrastBoost">Contrast Boost</option>
              <option value="contrastReduce">Contrast Reduce</option>
            </select>
            <button 
              onClick={resetCurve}
              className="bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1 text-sm"
            >
              Reset
            </button>
          </div>
        )}
      </div>
      
      <div className="curve-editor-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          className="border border-gray-600 rounded cursor-crosshair"
        />
      </div>
      
      <div className="curve-editor-points mt-3">
        <div className="text-sm text-gray-400 mb-2">Control Points:</div>
        <div className="flex flex-wrap gap-2">
          {currentPoints.map((point, index) => (
            <div 
              key={index}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                index === 0 || index === currentPoints.length - 1 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-blue-600 text-white'
              }`}
            >
              <span>({point[0].toFixed(2)}, {point[1].toFixed(2)})</span>
              {index !== 0 && index !== currentPoints.length - 1 && (
                <button 
                  onClick={() => handleDeletePoint(index)}
                  className="text-red-300 hover:text-red-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurveEditor;
