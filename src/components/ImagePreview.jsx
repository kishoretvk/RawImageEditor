import React from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';

const ImagePreview = ({ before, after, showSlider }) => (
  <div className="relative h-40 w-full">
    {showSlider ? (
      <BeforeAfterSlider before={before} after={after} />
    ) : (
      <img src={after || before} alt="Preview" className="w-full h-full object-cover rounded" />
    )}
  </div>
);

export default ImagePreview;
