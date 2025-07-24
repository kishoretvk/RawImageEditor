import React from "react";

/**
 * BackgroundBlurPanel - controls for background blur effect
 * Props:
 *   edits: current edits object
 *   updateEdits: function to update edits
 */

const BackgroundBlurPanel = ({ edits = {}, updateEdits = () => {} }) => {
  // Ensure edits is always an object and updateEdits is always a function
  const safeEdits = edits || {};
  
  // Safely get blur value
  const blurValue = typeof safeEdits.backgroundBlur === 'number' ? safeEdits.backgroundBlur : 0;
  
  // Safe handler for blur changes
  const handleBlurChange = (e) => {
    if (typeof updateEdits === 'function') {
      try {
        updateEdits({ backgroundBlur: Number(e.target.value) });
      } catch (error) {
        console.error("Error updating background blur:", error);
      }
    }
  };
  
  return (
    <section className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Background Blur</h3>
      <input
        type="range"
        min={0}
        max={100}
        value={blurValue}
        onChange={handleBlurChange}
        className="w-full"
        aria-label="Background blur amount"
        title={`Background blur: ${blurValue}%`}
      />
      <div className="text-xs text-gray-400 mt-1">{blurValue}%</div>
    </section>
  );
};

export default BackgroundBlurPanel;

