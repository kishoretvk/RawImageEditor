import React, { useState } from 'react';

const ExifPanel = ({ metadata, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState(metadata || {});

  const handleChange = (key, value) => {
    setEdited({ ...edited, [key]: value });
  };
  const handleSave = () => {
    setEditMode(false);
    if (onSave) onSave(edited);
  };

  return (
    <div className="bg-editor-bg p-4 rounded-xl text-white border border-editor-border max-h-80 overflow-y-auto exif-panel">
      <h3 className="font-bold mb-2 text-primary">EXIF Metadata</h3>
      <ul>
        {edited ? Object.entries(edited).map(([key, value]) => (
          <li key={key} className="mb-1">
            <span className="font-semibold text-accent">{key}:</span>
            {editMode ? (
              <input className="ml-2 p-1 rounded bg-gray-700 text-white" value={value} onChange={e => handleChange(key, e.target.value)} />
            ) : (
              <span className="ml-2">{value}</span>
            )}
          </li>
        )) : <li>No metadata available.</li>}
      </ul>
      <div className="mt-2">
        {editMode ? (
          <button className="bg-success text-white px-3 py-1 rounded" onClick={handleSave}>Save</button>
        ) : (
          <button className="bg-primary text-white px-3 py-1 rounded" onClick={() => setEditMode(true)}>Edit</button>
        )}
      </div>
    </div>
  );
};

export default ExifPanel;
