import React from 'react';

import cheetah from '../assets/images/cheetah-hotirontal.jpg';
import elephant from '../assets/images/elephant-hotirontal.jpg';
import lava from '../assets/images/lava.jpg';
import nature from '../assets/images/nature-horizontal.jpg';
import newyork from '../assets/images/newyork-night.jpg';
import northernlights from '../assets/images/northernlights.jpg';
import tree from '../assets/images/tree-horozontal.jpg';

const previewImages = [cheetah, elephant, lava, nature, newyork, northernlights, tree];

const Home = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-300 text-black flex flex-col items-center justify-center relative">
    {/* Background image grid */}
    <div className="absolute inset-0 z-0 grid grid-cols-4 grid-rows-2 gap-4 opacity-30 pointer-events-none">
      {previewImages.map((img, i) => (
        <img key={i} src={img} alt="preview" className="w-full h-full object-cover rounded-2xl" />
      ))}
    </div>
    <div className="relative z-10 text-center py-32 w-full">
      <h1 className="text-6xl font-bold mb-8 drop-shadow-lg">Unleash the RAW Power.</h1>
      <div className="flex justify-center gap-6 mb-8">
        <button
          className="bg-blue-500 text-black font-bold px-8 py-4 rounded-xl shadow-lg border-2 border-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-200"
          onClick={() => window.location.href = '/upload'}
        >
          Get Started
        </button>
        <button
          className="bg-blue-700 text-black font-bold px-8 py-4 rounded-xl shadow border-2 border-blue-800 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-400 transition duration-200"
          onClick={() => window.location.href = '/editor'}
        >
          Edit RAW Image
        </button>
        <button className="bg-white text-blue-700 font-bold px-8 py-4 rounded-xl border-2 border-blue-300 shadow hover:bg-blue-100 transition-colors">Watch the Vision</button>
      </div>
      {/* Feature previews */}
      <div className="flex flex-wrap justify-center gap-8 mt-16">
        {previewImages.map((img, i) => (
          <div key={i} className="bg-white bg-opacity-90 rounded-2xl shadow-lg p-4 flex flex-col items-center w-72">
            <img src={img} alt="preview" className="rounded-xl mb-4 h-40 w-full object-cover" />
            <div className="font-bold text-lg mb-2">{['Exposure', 'Contrast', 'Highlights', 'Shadows', 'Color', 'Vibrance', 'Clarity'][i % 7]}</div>
            <input type="range" min="0" max="2" step="0.01" defaultValue={1} className="w-full accent-blue-500 mb-2" />
            <button className="bg-blue-500 text-black font-bold px-4 py-2 rounded-xl shadow border-2 border-blue-700 hover:bg-blue-600 transition duration-200 mt-2">Live Preview</button>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-8 mt-12">
        <img src="/sony-logo.png" alt="Sony" className="h-12" />
        <img src="/canon-logo.png" alt="Canon" className="h-12" />
        <img src="/nikon-logo.png" alt="Nikon" className="h-12" />
      </div>
      <div className="mt-16 text-2xl font-semibold">Why RAW Matters</div>
    </div>
  </div>
);

export default Home;
