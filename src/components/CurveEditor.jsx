import React, { useRef, useState, useEffect } from 'react';
import './CurveEditor.css';

const CurveEditor = ({ points, onChange }) => {
  const svgRef = useRef(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const size = 256; // Size of the editor

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const CTM = svg.getScreenCTM().inverse();
    return pt.matrixTransform(CTM);
  };

  const handleMouseDown = (e, index) => {
    setDraggingPoint(index);
  };

  const handleMouseMove = (e) => {
    if (draggingPoint === null) return;
    const svgPoint = getSVGPoint(e);
    if (!svgPoint) return;

    let newX = Math.max(0, Math.min(size, svgPoint.x));
    let newY = Math.max(0, Math.min(size, svgPoint.y));

    const newPoints = [...points];
    // Prevent points from crossing over each other
    if (draggingPoint > 0) {
      newX = Math.max(newPoints[draggingPoint - 1].x, newX);
    }
    if (draggingPoint < newPoints.length - 1) {
      newX = Math.min(newPoints[draggingPoint + 1].x, newX);
    }
    
    newPoints[draggingPoint] = { x: newX, y: size - newY };
    onChange(newPoints);
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const addPoint = (e) => {
    const svgPoint = getSVGPoint(e);
    if (!svgPoint) return;
    const newPoint = { x: svgPoint.x, y: size - svgPoint.y };
    
    const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  // Create the SVG path data for the curve
  const pathData = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${size - p.y}`;
    return `L ${p.x} ${size - p.y}`;
  }).join(' ');

  return (
    <div className="curve-editor">
      <svg 
        ref={svgRef} 
        viewBox={`0 0 ${size} ${size}`} 
        onDoubleClick={addPoint}
      >
        {/* Grid lines */}
        <path d="M 64 0 V 256 M 128 0 V 256 M 192 0 V 256" stroke="#e2e8f0" />
        <path d="M 0 64 H 256 M 0 128 H 256 M 0 192 H 256" stroke="#e2e8f0" />
        
        <path d={pathData} stroke="#1e3c72" strokeWidth="2" fill="none" />
        
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={size - p.y}
            r="5"
            fill="#1e3c72"
            stroke="white"
            strokeWidth="2"
            onMouseDown={(e) => handleMouseDown(e, i)}
            className="curve-point"
          />
        ))}
      </svg>
    </div>
  );
};

export default CurveEditor;
