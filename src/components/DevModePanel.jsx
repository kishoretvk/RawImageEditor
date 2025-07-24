import React, { useEffect, useState } from 'react';
import { getCapabilities } from '../utils/CapabilityManager';

const DevModePanel = () => {
  const [caps, setCaps] = useState({});
  useEffect(() => {
    setCaps(getCapabilities());
  }, []);
  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-xl mt-8">
      <h2 className="text-2xl font-bold mb-4">🛠 Dev Mode / Debug Panel</h2>
      <ul className="mb-4">
        <li><strong>WASM:</strong> {caps.wasm ? 'Available' : 'Not available'}</li>
        <li><strong>WebGL:</strong> {caps.webgl ? 'Available' : 'Not available'}</li>
        <li><strong>IndexedDB:</strong> {caps.indexedDB ? 'Available' : 'Not available'}</li>
        <li><strong>FileSystem API:</strong> {caps.fileSystemAPI ? 'Available' : 'Not available'}</li>
        <li><strong>Touch:</strong> {caps.touch ? 'Available' : 'Not available'}</li>
        <li><strong>Pointer:</strong> {caps.pointer ? 'Available' : 'Not available'}</li>
        <li><strong>Device Memory:</strong> {caps.memory}</li>
        <li><strong>Threads:</strong> {caps.threads ? 'Available' : 'Not available'}</li>
      </ul>
      <div className="font-mono text-xs bg-gray-800 p-2 rounded">Session memory, IndexedDB usage, and active threads can be shown here.</div>
    </div>
  );
};

export default DevModePanel;
