import React from 'react';

const ImageMetadata = ({ metadata }) => {
  if (!metadata) return null;
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-4 text-white">Image Metadata</h2>
      <ul className="text-white">
        {Object.entries(metadata).map(([key, value]) => (
          <li key={key} className="mb-1"><span className="font-semibold">{key}:</span> {value}</li>
        ))}
      </ul>
    </div>
  );
};

export default ImageMetadata;
