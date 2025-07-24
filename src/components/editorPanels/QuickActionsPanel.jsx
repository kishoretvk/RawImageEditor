import React from "react";

/**
 * QuickActionsPanel - provides quick access to common actions (reset, auto enhance, revert, etc.)
 * Props:
 *   edits: current edits object
 *   updateEdits: function to update edits
 */
const QuickActionsPanel = ({ edits, updateEdits }) => {
  const handleReset = () => updateEdits({});
  const handleAutoEnhance = () => {
    // Example: set some auto values (customize as needed)
    updateEdits({ brightness: 10, contrast: 10, exposure: 5 });
  };
  return (
    <section className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
      <div className="flex gap-2">
        <button className="btn btn-sm btn-outline" onClick={handleReset} title="Reset all edits">Reset</button>
        <button className="btn btn-sm btn-primary" onClick={handleAutoEnhance} title="Auto Enhance">Auto Enhance</button>
      </div>
    </section>
  );
};

export default QuickActionsPanel;
