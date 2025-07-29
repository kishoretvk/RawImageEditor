import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCurve } from '../context/CurveContext';

const CurveEditor = ({ channel = 'rgb', onCurveChange }) => {
  const { curves, updateCurve } = useCurve();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [gridSize, setGridSize] = useState(10);
  
  // Get current curve for this channel
  const currentCurve = curves[channel] || [];
  
  // Initialize with default diagonal line if no curve exists
  useEffect(() => {
    if (currentCurve.length === 0) {
      updateCurve(channel, [
        [0, 0],
        [1, 1]
      ]);
    }
  }, [channel, currentCurve.length, updateCurve]);
  
  // Draw the curve editor
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    
    // Diagonal reference line
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    
    // Draw curve
    if (currentCurve.length > 0) {
      ctx.strokeStyle = channel === 'rgb' ? '#ffffff' : 
                       channel === 'r' ? '#ff0000' : 
                       channel === 'g' ? '#00ff00' : 
                       channel === 'b' ? '#0000ff' : '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      // Draw smooth curve through points
      for (let i = 0; i < currentCurve.length - 1; i++) {
        const [x1, y1] = currentCurve[i];
        const [x2, y2] = currentCurve[i + 1];
        
        const canvasX1 = x1 * width;
        const canvasY1 = height - y1 * height;
        const canvasX2 = x2 * width;
        const canvasY2 = height - y2 * height;
        
        if (i === 0) {
          ctx.moveTo(canvasX1, canvasY1);
        }
        
        // Simple linear interpolation for now
        ctx.lineTo(canvasX2, canvasY2);
      }
      
      ctx.stroke();
      
      // Draw control points
      currentCurve.forEach(([x, y], index) => {
        const canvasX = x * width;
        const canvasY = height - y * height;
        
        // Check if point is hovered or selected
        const isHovered = hoveredPoint && hoveredPoint.index === index;
        const isSelected = selectedPoint && selectedPoint.index === index;
        
        // Draw point
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, isHovered || isSelected ? 8 : 6, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? '#ff9900' : isHovered ? '#ffffff' : '#4a9eff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }, [currentCurve, channel, gridSize, hoveredPoint, selectedPoint]);
  
  // Redraw when curve or other dependencies change
  useEffect(() => {
    draw();
  }, [draw]);
  
  // Handle mouse events for curve editing
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = 1 - (e.clientY - rect.top) / canvas.height;
    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
  };
  
  const findNearestPoint = (x, y, threshold = 0.05) => {
    for (let i = 0; i < currentCurve.length; i++) {
      const [px, py] = currentCurve[i];
      const distance = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
      if (distance < threshold) {
        return { index: i, point: [px, py] };
      }
    }
    return null;
  };
  
  const handleMouseDown = (e) => {
    const [x, y] = getCanvasCoordinates(e);
    const nearestPoint = findNearestPoint(x, y);
    
    if (nearestPoint) {
      // Select existing point
      setSelectedPoint(nearestPoint);
      setIsDrawing(true);
    } else {
      // Add new point
      const newCurve = [...currentCurve, [x, y]].sort((a, b) => a[0] - b[0]);
      updateCurve(channel, newCurve);
      const newIndex = newCurve.findIndex(([px, py]) => px === x && py === y);
      setSelectedPoint({ index: newIndex, point: [x, y] });
      setIsDrawing(true);
    }
  };
  
  const handleMouseMove = (e) => {
    const [x, y] = getCanvasCoordinates(e);
    
    if (isDrawing && selectedPoint) {
      // Move selected point
      const newCurve = [...currentCurve];
      const [oldX, oldY] = newCurve[selectedPoint.index];
      
      // Prevent moving first point to x < 0 or last point to x > 1
      let newX = x;
      if (selectedPoint.index === 0) {
        newX = 0;
      } else if (selectedPoint.index === currentCurve.length - 1) {
        newX = 1;
      }
      
      newCurve[selectedPoint.index] = [newX, y];
      updateCurve(channel, newCurve);
      setSelectedPoint({ ...selectedPoint, point: [newX, y] });
    } else {
      // Check for hover
      const nearestPoint = findNearestPoint(x, y, 0.03);
      setHoveredPoint(nearestPoint);
    }
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  const handleDoubleClick = (e) => {
    const [x, y] = getCanvasCoordinates(e);
    const nearestPoint = findNearestPoint(x, y, 0.03);
    
    if (nearestPoint && nearestPoint.index !== 0 && nearestPoint.index !== currentCurve.length - 1) {
      // Remove point (but not first or last)
      const newCurve = currentCurve.filter((_, i) => i !== nearestPoint.index);
      updateCurve(channel, newCurve);
      setSelectedPoint(null);
    }
  };
  
  const resetCurve = () => {
    updateCurve(channel, [
      [0, 0],
      [1, 1]
    ]);
    setSelectedPoint(null);
    setHoveredPoint(null);
  };
  
  return (
    <div className="curve-editor" style={{ 
      background: '#1a1a1a',
      borderRadius: '8px',
      padding: '16px',
      color: '#e0e0e0'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px' 
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '16px', 
          fontWeight: '600',
          color: channel === 'rgb' ? '#ffffff' : 
                 channel === 'r' ? '#ff6666' : 
                 channel === 'g' ? '#66ff66' : 
                 channel === 'b' ? '#6666ff' : '#ffff66'
        }}>
          {channel.toUpperCase()} Curve
        </h3>
        <button
          onClick={resetCurve}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid #4a5568',
            color: '#e0e0e0',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset
        </button>
      </div>
      
      <div style={{ 
        position: 'relative',
        marginBottom: '12px'
      }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            width: '100%',
            height: '300px',
            background: '#2a2a2a',
            borderRadius: '4px',
            cursor: isDrawing ? 'grabbing' : 'crosshair'
          }}
        />
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#a0a0a0',
        textAlign: 'center'
      }}>
        Click to add points • Drag to move • Double-click to remove
      </div>
    </div>
  );
};

export default CurveEditor;
