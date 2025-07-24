import React from 'react';

const UndoRedoPanel = ({ canUndo, canRedo, onUndo, onRedo }) => (
  <div className="flex gap-2 mb-4">
    <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={onUndo} disabled={!canUndo}>Undo</button>
    <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={onRedo} disabled={!canRedo}>Redo</button>
  </div>
);

export default UndoRedoPanel;
