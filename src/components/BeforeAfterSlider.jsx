import React, { useRef, useState } from 'react';
import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';

const BeforeAfterSlider = ({ before = cheetahImg, after }) => {
  const containerRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);

  const handleDrag = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    let x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let percent = ((x - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    setSliderPos(percent);
  };

  return (
    <div ref={containerRef} className="relative w-64 h-40 bg-black rounded overflow-hidden select-none" style={{ touchAction: 'none' }}>
      <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)`, opacity: 0.7 }} />
      <div
        className="absolute top-0 left-0 h-full w-1 bg-blue-500 cursor-ew-resize"
        style={{ left: `${sliderPos}%` }}
        onMouseDown={e => {
          e.preventDefault();
          window.onmousemove = handleDrag;
          window.onmouseup = () => { window.onmousemove = null; };
        }}
        onTouchStart={e => {
          window.ontouchmove = handleDrag;
          window.ontouchend = () => { window.ontouchmove = null; };
        }}
      />
    </div>
  );
};

export default BeforeAfterSlider;
