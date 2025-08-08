import React from 'react';

const ColorPlanesPanel = ({ onSelectPlane, activePlane, onDownloadPlane }) => {
  const handleDownload = (plane) => {
    if (onDownloadPlane) {
      onDownloadPlane(plane);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Color Planes</h3>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <button
            onClick={() => onSelectPlane('r')}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
              activePlane === 'r' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Red
          </button>
          <button
            onClick={() => handleDownload('r')}
            className="mt-2 w-full px-4 py-2 text-sm font-medium rounded-md bg-gray-300 text-gray-800"
          >
            Download
          </button>
        </div>
        <div>
          <button
            onClick={() => onSelectPlane('g')}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
              activePlane === 'g' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Green
          </button>
          <button
            onClick={() => handleDownload('g')}
            className="mt-2 w-full px-4 py-2 text-sm font-medium rounded-md bg-gray-300 text-gray-800"
          >
            Download
          </button>
        </div>
        <div>
          <button
            onClick={() => onSelectPlane('b')}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
              activePlane === 'b' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Blue
          </button>
          <button
            onClick={() => handleDownload('b')}
            className="mt-2 w-full px-4 py-2 text-sm font-medium rounded-md bg-gray-300 text-gray-800"
          >
            Download
          </button>
        </div>
      </div>
      {activePlane && (
        <button
          onClick={() => onSelectPlane(null)}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-gray-400 text-white w-full"
        >
          Reset to Full Color
        </button>
      )}
    </div>
  );
};

export default ColorPlanesPanel;
