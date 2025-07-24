import React, { useState, useRef } from 'react';

const ZoomPanControl = ({ onZoom, onPan }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoom = (e) => {
    const newZoom = Number(e.target.value);
    setZoom(newZoom);
    onZoom(newZoom);
  };

  // Simple pan controls (buttons)
  const panStep = 20;
  const handlePan = (dx, dy) => {
    const newPan = { x: pan.x + dx, y: pan.y + dy };
    setPan(newPan);
    if (onPan) onPan(newPan);
  };

  // Touch gesture handlers
  const touchState = useRef({});
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
      touchState.current.zoomStart = zoom;
    } else if (e.touches.length === 1) {
      // Pan start
      touchState.current.panStartX = e.touches[0].clientX;
      touchState.current.panStartY = e.touches[0].clientY;
      touchState.current.panStart = { ...pan };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchState.current.pinchStartDist) {
      // Pinch move
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / touchState.current.pinchStartDist;
      const newZoom = Math.max(1, Math.min(5, touchState.current.zoomStart * scale));
      setZoom(newZoom);
      onZoom(newZoom);
    } else if (e.touches.length === 1 && touchState.current.panStartX !== undefined) {
      // Pan move
      const dx = e.touches[0].clientX - touchState.current.panStartX;
      const dy = e.touches[0].clientY - touchState.current.panStartY;
      const newPan = {
        x: touchState.current.panStart.x + dx,
        y: touchState.current.panStart.y + dy,
      };
      setPan(newPan);
      if (onPan) onPan(newPan);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      <div className="flex items-center gap-2">
        <label className="text-white">Zoom:</label>
        <input type="range" min={1} max={5} step={0.1} value={zoom} onChange={handleZoom} />
        <span className="text-gray-400">{zoom}x</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-white">Pan:</label>
        <button className="bg-gray-700 text-white px-2 rounded" onClick={() => handlePan(-panStep, 0)}>&larr;</button>
        <button className="bg-gray-700 text-white px-2 rounded" onClick={() => handlePan(panStep, 0)}>&rarr;</button>
        <button className="bg-gray-700 text-white px-2 rounded" onClick={() => handlePan(0, -panStep)}>&uarr;</button>
        <button className="bg-gray-700 text-white px-2 rounded" onClick={() => handlePan(0, panStep)}>&darr;</button>
      </div>
    </div>
  );
};

export default ZoomPanControl;
