// SessionControls.jsx
// UI for saving/loading sessions
import React, { useState } from 'react';

export default function SessionControls({ session, onSave, onLoad }) {
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    if (onSave) await onSave();
    setStatus('Session saved!');
  };

  const handleLoad = async () => {
    if (onLoad) await onLoad();
    setStatus('Session loaded!');
  };

  return (
    <div className="flex gap-2 items-center">
      <button className="bg-primary text-white px-3 py-1 rounded" onClick={handleSave}>Save Session</button>
      <button className="bg-accent text-white px-3 py-1 rounded" onClick={handleLoad}>Load Session</button>
      <span className="ml-2 text-xs text-info">{status}</span>
    </div>
  );
}
