import React from 'react';

const PrivacyPolicy = () => (
  <div className="max-w-2xl mx-auto p-8 bg-gray-900 text-white rounded-xl mt-8">
    <h1 className="text-3xl font-bold mb-4">🔒 Data Privacy & Processing Policy</h1>
    <div className="mb-4">
      <span className="inline-block bg-success text-white px-3 py-1 rounded-xl font-semibold mr-2">Local-Only</span>
      <span className="inline-block bg-primary text-white px-3 py-1 rounded-xl font-semibold mr-2">No Uploads</span>
      <span className="inline-block bg-accent text-white px-3 py-1 rounded-xl font-semibold">Fully Offline Capable</span>
    </div>
    <p className="mb-4">No Cloud Processing. No Data Collection. No Uploads.</p>
    <ul className="list-disc pl-6 mb-4">
      <li>All images and processing stay 100% on your device, in your browser.</li>
      <li>No data is sent to our servers. In fact, we don't have servers for this.</li>
      <li>Your RAW files, edits, previews, and exports are only saved locally.</li>
      <li>You can delete your data anytime — nothing persists beyond your device.</li>
    </ul>
    <p className="mb-4">You can sign in to cloud providers only to open/save files. We do not store or sync anything.</p>
    <p className="mb-4 font-semibold">Export transparency: When you download, zip, or export, files are only saved to your device or your chosen cloud provider.</p>
    <p className="mb-4">Offline support: Runs entirely without internet once loaded.</p>
  </div>
);

export default PrivacyPolicy;
