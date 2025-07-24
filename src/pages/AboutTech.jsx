import React from 'react';

const AboutTech = () => (
  <div className="min-h-screen bg-gray-100 text-gray-900 py-20">
    <h1 className="text-4xl font-bold mb-8">About & Tech</h1>
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Tech Used</h2>
      <ul className="mb-8">
        <li>React + Tailwind CSS</li>
        <li>WebAssembly (LibRaw/RawSpeed)</li>
        <li>WebGL/WebGPU</li>
        <li>TensorFlow.js</li>
        <li>Cloudflare R2 / AWS S3</li>
        <li>Firebase / Auth0</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-4">Security & Privacy</h2>
      <p className="mb-8">All RAW files are processed in-browser. No files are uploaded to our servers unless you choose cloud backup. Your privacy is our priority.</p>
      <h2 className="text-2xl font-semibold mb-4">Vision & Mission</h2>
      <p className="mb-8">Empowering photographers with world-class browser-based RAW editing and conversion tools.</p>
      <h2 className="text-2xl font-semibold mb-4">Contributors</h2>
      <ul>
        <li>Designer: [Your Name]</li>
        <li>Developer: [Your Name]</li>
        <li>Community: [Open Source]</li>
      </ul>
    </div>
  </div>
);

export default AboutTech;
