// CompareView.jsx
// Side-by-side or overlay slider for before/after
import React from 'react';
import ImageCanvas from './ImageCanvas';

export default function CompareView({ original, edited }) {
  return (
    <div className="flex gap-4">
      <div>
        <div className="text-xs text-center">Original</div>
        <ImageCanvas imageData={original} />
      </div>
      <div>
        <div className="text-xs text-center">Edited</div>
        <ImageCanvas imageData={edited} />
      </div>
    </div>
  );
}
