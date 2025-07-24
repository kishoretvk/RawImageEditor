// ExportDialog.jsx
// UI for export format, quality, filename
import React, { useState } from 'react';

export default function ExportDialog({ onExport }) {
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(85);
  const [filename, setFilename] = useState('exported-image');

  const handleExport = () => {
    if (onExport) onExport({ format, quality, filename });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs">Export Image</label>
      <div className="flex gap-2 items-center">
        <span className="text-xs">Format</span>
        <select value={format} onChange={e => setFormat(e.target.value)}>
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="tiff">TIFF</option>
        </select>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs">Quality</span>
        <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} />
        <span className="text-xs">{quality}%</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs">Filename</span>
        <input type="text" value={filename} onChange={e => setFilename(e.target.value)} />
      </div>
      <button className="bg-success text-white px-2 py-1 rounded" onClick={handleExport}>Export</button>
    </div>
  );
}
