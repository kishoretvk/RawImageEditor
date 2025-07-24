// ResetTools.jsx
// UI for reverting to original RAW image
import React, { useContext } from 'react';
import OriginalImageContext from '../context/OriginalImageContext';

export default function ResetTools({ onReset }) {
  const originalImage = useContext(OriginalImageContext);
  const handleReset = () => {
    if (onReset) onReset(originalImage);
  };
  return (
    <button className="bg-error text-white px-3 py-1 rounded" onClick={handleReset}>
      Revert to Original
    </button>
  );
}
