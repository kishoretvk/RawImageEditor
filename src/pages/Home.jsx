import React from 'react';
import '../styles/tokens.css';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

import cheetah from '../assets/images/cheetah-horizontal.jpg';
import elephant from '../assets/images/elephant-horizontal.jpg';
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
        <Button variant="primary" size="lg" onClick={() => (window.location.href = '/upload')}>
          Get Started
        </Button>
        <Button variant="secondary" size="lg" onClick={() => (window.location.href = '/editor')}>
          Edit RAW Image
        </Button>
        <Button variant="ghost" size="lg">Watch the Vision</Button>
      </div>
      {/* Feature previews */}
      <div className="flex flex-wrap justify-center gap-8 mt-16">
        {previewImages.map((img, i) => (
          <Card
            key={i}
            image={img}
            title={['Exposure', 'Contrast', 'Highlights', 'Shadows', 'Color', 'Vibrance', 'Clarity'][i % 7]}
            actions={
              <Button size="sm" variant="secondary">Live Preview</Button>
            }
            className="w-72"
            variant="elevated"
          >
            <div className="text-sm opacity-80">
              Fine-tune {['exposure', 'contrast', 'highlights', 'shadows', 'color', 'vibrance', 'clarity'][i % 7]} with real-time feedback.
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              defaultValue={1}
              className="w-full accent-blue-500 mt-3"
            />
          </Card>
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
