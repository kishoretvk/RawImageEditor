// HistoryPanel.jsx
// Visual timeline of edits with thumbnails
import React from 'react';
import ImageCanvas from './ImageCanvas';

export default function HistoryPanel({ history }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs">Edit History</label>
      <div className="flex gap-2 overflow-x-auto">
        {history.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <ImageCanvas imageData={item.imageBuffer} />
            <span className="text-xs">Step {idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
