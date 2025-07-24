import React from 'react';

const Toolbar = ({ onExport, onReset, onHelp }) => (
  <div className="flex gap-4 mb-4">
    <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onExport}>Export</button>
    <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={onReset}>Reset</button>
    <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={onHelp}>Help</button>
  </div>
);

export default Toolbar;
