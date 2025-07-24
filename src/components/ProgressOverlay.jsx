import React from 'react';

const ProgressOverlay = ({ progress, message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50">
    <div className="text-white text-xl mb-4">{message || 'Processing...'}</div>
    <div className="w-1/2 bg-gray-700 rounded h-4">
      <div className="bg-blue-500 h-4 rounded" style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

export default ProgressOverlay;
