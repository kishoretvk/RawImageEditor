import React from 'react';
import { downloadAsZip } from '../utils/zipDownload';

const BatchActions = ({ items }) => (
  <div className="flex gap-4 mb-4">
    <button
      className="bg-green-600 text-white px-4 py-2 rounded"
      onClick={() => downloadAsZip(items)}
      disabled={items.length === 0}
    >
      Download All as ZIP
    </button>
  </div>
);

export default BatchActions;
