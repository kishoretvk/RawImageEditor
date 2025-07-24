import React from 'react';

// Stub: Google Drive, Dropbox, OneDrive file picker
const CloudFilePicker = ({ provider, onPick }) => {
  const handlePick = () => {
    // TODO: Integrate OAuth2 and provider SDK
    alert(`Pick file from ${provider} (stub)`);
    if (onPick) onPick({ name: 'example.raw', provider });
  };
  return (
    <button className="bg-primary text-white px-4 py-2 rounded" onClick={handlePick}>
      Open from {provider}
    </button>
  );
};

export default CloudFilePicker;
