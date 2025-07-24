import React from 'react';
import Gallery from '../components/Gallery';

const GalleryPage = ({ files }) => (
  <div className="min-h-screen bg-gray-900 text-white py-20">
    <h1 className="text-4xl font-bold text-center mb-16">Gallery</h1>
    <Gallery files={files} />
  </div>
);

export default GalleryPage;
