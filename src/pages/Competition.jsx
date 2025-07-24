import React from 'react';

const Competition = ({ submissions, onVote }) => (
  <div className="min-h-screen bg-gray-900 text-white py-20">
    <h1 className="text-4xl font-bold text-center mb-16">Competition</h1>
    <div className="max-w-4xl mx-auto">
      <ul className="space-y-6">
        {submissions.map((item, idx) => (
          <li key={idx} className="bg-gray-800 p-6 rounded shadow flex justify-between items-center">
            <div>
              <img src={item.preview} alt={item.filename} className="h-24 w-24 object-cover rounded mr-4 inline-block" />
              <span className="font-semibold text-lg">{item.filename}</span>
            </div>
            <div className="flex gap-4">
              <button className="bg-pink-600 px-4 py-2 rounded" onClick={() => onVote(item, 'love')}>❤️</button>
              <button className="bg-yellow-500 px-4 py-2 rounded" onClick={() => onVote(item, 'star')}>⭐</button>
              <button className="bg-blue-500 px-4 py-2 rounded" onClick={() => onVote(item, 'like')}>👍</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Competition;
