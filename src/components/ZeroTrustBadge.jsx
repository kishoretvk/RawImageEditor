import React from 'react';

const ZeroTrustBadge = () => (
  <div className="flex gap-2 items-center justify-center mt-2 mb-2">
    <span className="inline-block bg-success text-white px-2 py-1 rounded font-semibold">🔒 Local-Only</span>
    <span className="inline-block bg-primary text-white px-2 py-1 rounded font-semibold">No Uploads</span>
    <span className="inline-block bg-accent text-white px-2 py-1 rounded font-semibold">Offline Capable</span>
  </div>
);

export default ZeroTrustBadge;
