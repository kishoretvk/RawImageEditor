import React from 'react';

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <img src="/empty.svg" alt="Empty" className="h-32 mb-6" />
    <div className="text-xl text-gray-400">{message || 'No files uploaded yet.'}</div>
  </div>
);

export default EmptyState;
