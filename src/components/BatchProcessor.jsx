import React, { useState } from 'react';
import BatchImageItem from './BatchImageItem';
import BatchActions from './BatchActions';
import { processWithWorkers } from '../utils/workerQueue';

const CONCURRENCY_LIMIT = 3;

const BatchProcessor = ({ files, preset, onComplete }) => {
  const [processingQueue, setProcessingQueue] = useState([]);
  const [results, setResults] = useState([]);

  // Start batch processing using Web Workers
  const startBatch = async () => {
    let queue = files.map(file => ({ file, status: 'pending', progress: 0, before: file.preview, after: null }));
    setProcessingQueue(queue);
    const processed = await processWithWorkers(files, preset, CONCURRENCY_LIMIT);
    processed.forEach((result, idx) => {
      queue[idx].after = result.preview;
      queue[idx].status = result.status;
      queue[idx].progress = 100;
    });
    setProcessingQueue([...queue]);
    setResults(processed);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Batch Processing</h2>
      <button onClick={startBatch} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Start Batch</button>
      <BatchActions items={processingQueue.filter(item => item.status === 'done')} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processingQueue.map((item, idx) => (
          <BatchImageItem key={idx} item={item} preset={preset} />
        ))}
      </div>
    </div>
  );
};

export default BatchProcessor;
