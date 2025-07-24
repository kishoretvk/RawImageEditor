import React from 'react';
import BatchImageItem from './BatchImageItem';

const BatchCard = ({ item, preset }) => (
  <div className="bg-gray-800 rounded-xl p-4">
    <BatchImageItem item={item} preset={preset} />
  </div>
);

export default BatchCard;
