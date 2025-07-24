// CloudPicker.jsx
// UI for picking files from cloud providers
import React from 'react';
import { startOAuth } from '../utils/OAuthManager';

export default function CloudPicker() {
  const handlePick = provider => {
    startOAuth(provider);
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs">Pick from Cloud</label>
      <button className="bg-primary text-white px-2 py-1 rounded" onClick={() => handlePick('google')}>Google Drive</button>
      <button className="bg-primary text-white px-2 py-1 rounded" onClick={() => handlePick('onedrive')}>OneDrive</button>
      <button className="bg-primary text-white px-2 py-1 rounded" onClick={() => handlePick('dropbox')}>Dropbox</button>
    </div>
  );
}
