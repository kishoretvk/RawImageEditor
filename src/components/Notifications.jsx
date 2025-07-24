import React from 'react';

const Notifications = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded shadow-lg text-white ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
    </div>
  );
};

export default Notifications;
