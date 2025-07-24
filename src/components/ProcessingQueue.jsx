import React from 'react';

const ProcessingQueue = ({ queue, onRemove }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-4 text-white">Processing Queue</h2>
      <ul className="space-y-2">
        {queue.map((item, idx) => (
          <li key={item.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
            <span className="text-white">{item.name}</span>
            <span className="text-gray-400">{item.status}</span>
            <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProcessingQueue;
