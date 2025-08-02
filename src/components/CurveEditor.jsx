import React, { useRef, useState, useEffect } from 'react';
import './CurveEditor.css';

const CurveEditor = ({ points = [], onChange }) => {
  const svgRef = useRef(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const size = 256; // editor space (0..256)

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const CTM = svg.getScreenCTM().inverse();
    return pt.matrixTransform(CTM);
  };

  const safePoints = Array.isArray(points) && points.length >= 2
    ? points
    : [{ x: 0, y: 0 }, { x: 256, y: 256 }];

  // Ensure sorted by x and clamped, and finite numbers
  const sortedPoints = safePoints
    .map(p => ({
      x: Number.isFinite(p?.x) ? Math.max(0, Math.min(256, p.x)) : 0,
      y: Number.isFinite(p?.y) ? Math.max(0, Math.min(256, p.y)) : 0
    }))
    .sort((a, b) => a.x - b.x)
    .map((p, i, arr) => {
      if (i > 0 && p.x <= arr[i - 1].x) {
        return { x: Math.min(256, arr[i - 1].x + 0.001), y: p.y };
      }
      return p;
    });

  const handleMouseDown = (e, index) => {
    setDraggingPoint(index);
    setSelectedIndex(index);
  };

  const handleMouseMove = (e) => {
    if (draggingPoint === null) return;
    const svgPoint = getSVGPoint(e);
    if (!svgPoint) return;

    let newX = Math.max(0, Math.min(size, svgPoint.x));
    let newY = Math.max(0, Math.min(size, svgPoint.y));

    const base = [...sortedPoints];
    // Prevent points from crossing over each other
    if (draggingPoint > 0) {
      newX = Math.max(base[draggingPoint - 1].x + 0.001, newX);
    }
    if (draggingPoint < base.length - 1) {
      newX = Math.min(base[draggingPoint + 1].x - 0.001, newX);
    }

    base[draggingPoint] = { x: newX, y: size - newY };
    if (typeof onChange === 'function') {
      onChange(base);
    }
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
    const newPoint = {
      x: Math.max(0, Math.min(size, svgPoint.x)),
      y: Math.max(0, Math.min(size, size - svgPoint.y))
    };
    const base = [...sortedPoints, newPoint].sort((a, b) => a.x - b.x)
      .map((p, i, arr) => {
        if (i > 0 && p.x <= arr[i - 1].x) {
          return { x: Math.min(256, arr[i - 1].x + 0.001), y: p.y };
        }
        return p;
      });
    if (typeof onChange === 'function') {
      onChange(base);
    }
  };

  const removeSelectedPoint = () => {
    if (selectedIndex === null) return;
    // Do not allow deleting endpoints to keep curve anchored
    if (selectedIndex === 0 || selectedIndex === sortedPoints.length - 1) return;
    const base = sortedPoints.filter((_, i) => i !== selectedIndex);
    setSelectedIndex(null);
    if (typeof onChange === 'function') {
      onChange(base);
    }
  };

  // Create safe SVG path data for the curve
  const pathData = (sortedPoints.length >= 2 ? sortedPoints : [{x:0,y:0},{x:256,y:256}])
    .map((p, i) => {
      const x = Number.isFinite(p.x) ? p.x : 0;
      const y = Number.isFinite(p.y) ? p.y : 0;
      const sy = size - y;
      return (i === 0) ? `M ${x} ${sy}` : `L ${x} ${sy}`;
    })
    .join(' ');

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
        
        {sortedPoints.map((p, i) => {
          const x = Number.isFinite(p.x) ? p.x : 0;
          const y = Number.isFinite(p.y) ? p.y : 0;
          const cy = size - y;
          return (
            <circle
              key={i}
              cx={x}
              cy={cy}
              r="5"
              fill={i === selectedIndex ? "#2563eb" : "#1e3c72"}
              stroke="white"
              strokeWidth="2"
              onMouseDown={(e) => handleMouseDown(e, i)}
              className="curve-point"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedIndex(i)}
              onDoubleClick={(evt) => {
                evt.stopPropagation();
                if (i !== 0 && i !== sortedPoints.length - 1) {
                  // delete on double click (not endpoints)
                  const base = sortedPoints.filter((_, idx) => idx !== i);
                  if (typeof onChange === 'function') onChange(base);
                }
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default CurveEditor;
