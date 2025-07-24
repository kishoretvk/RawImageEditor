import React from 'react';

const LoadingState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-6"></div>
    <div className="text-xl text-gray-400">{message || 'Loading...'}</div>
  </div>
);

export default LoadingState;
