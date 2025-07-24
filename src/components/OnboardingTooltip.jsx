import React from 'react';

const OnboardingTooltip = ({ message, visible, onClose }) => (
  visible ? (
    <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-4 rounded shadow-lg z-50">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white font-bold">&times;</button>
    </div>
  ) : null
);

export default OnboardingTooltip;
