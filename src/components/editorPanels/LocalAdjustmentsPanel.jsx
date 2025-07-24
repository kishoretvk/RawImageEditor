import React from "react";

/**
 * LocalAdjustmentsPanel - controls for local (brush/mask) adjustments
 * Props:
 *   edits: current edits object
 *   updateEdits: function to update edits
 */
const LocalAdjustmentsPanel = ({ edits, updateEdits }) => {
  // Placeholder: In a real app, this would show a list of masks/brushes and allow editing them
  return (
    <section className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Local Adjustments</h3>
      <div className="text-xs text-gray-400">(Coming soon: Brush, mask, and AI region tools)</div>
    </section>
  );
};

export default LocalAdjustmentsPanel;
