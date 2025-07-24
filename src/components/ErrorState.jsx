import React from 'react';

const ErrorState = ({ error }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="text-2xl text-red-600 mb-4">Error</div>
    <div className="text-lg text-gray-400">{error}</div>
  </div>
);

export default ErrorState;
