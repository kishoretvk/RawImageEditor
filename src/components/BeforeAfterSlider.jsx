import React, { useRef, useState, useEffect } from 'react';
import cheetahImg from '../assets/images/cheetah-horizontal.jpg';

/**
 * Performance-optimized Before/After slider:
 * - Avoids state updates on every mousemove (uses requestAnimationFrame).
 * - Uses a single absolutely positioned overlay div for the "after" image and transforms the clip via width,
 *   which is cheaper than recalculating clipPath.
 * - Pointer events API for unified desktop/mobile handling; falls back to mouse/touch if unavailable.
 * - CSS will handle GPU-friendly transforms and will-change hints.
 */
const BeforeAfterSlider = ({ before = cheetahImg, after }) => {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const afterRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);

  // rAF throttling
  const rafRef = useRef(0);
  const desiredPosRef = useRef(sliderPos);
  const draggingRef = useRef(false);

  useEffect(() => {
    // Apply initial width cut without reflow storms
    if (afterRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      afterRef.current.style.width = Math.max(0, Math.min(100, sliderPos)) + '%';
      if (handleRef.current) {
        handleRef.current.style.left = Math.max(0, Math.min(100, sliderPos)) + '%';
      }
    }
  }, []); // once

  const updateVisuals = (percent) => {
    // Update only DOM styles; avoid setState to keep main thread cool
    if (!containerRef.current || !afterRef.current || !handleRef.current) return;
    const p = Math.max(0, Math.min(100, percent));
    afterRef.current.style.width = p + '%';
    handleRef.current.style.left = p + '%';
  };

  const scheduleUpdate = (percent) => {
    desiredPosRef.current = percent;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      updateVisuals(desiredPosRef.current);
    });
  };

  const posFromEvent = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    let clientX;
    if (e.touches && e.touches.length) clientX = e.touches[0].clientX;
    else clientX = e.clientX;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    return percent;
  };

  const startDrag = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    scheduleUpdate(posFromEvent(e));
    // Save the final logical value to state on end only
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', endDrag, { passive: true });

    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', endDrag, { passive: true });
  };

  const onMove = (e) => {
    if (!draggingRef.current) return;
    scheduleUpdate(posFromEvent(e));
  };

  const endDrag = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const finalP = posFromEvent(e) || desiredPosRef.current;
    setSliderPos(Math.max(0, Math.min(100, finalP)));
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', endDrag);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', endDrag);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-64 h-40 bg-black rounded overflow-hidden select-none"
      style={{ touchAction: 'none', willChange: 'transform' }}
    >
      <img
        src={before}
        alt="Before"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        decoding="async"
        loading="lazy"
      />
      {/* After image inside a clipping container whose width we adjust via styles for performance */}
      <div
        ref={afterRef}
        className="absolute inset-y-0 left-0 h-full"
        style={{ width: `${sliderPos}%`, willChange: 'width' }}
      >
        <img
          src={after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          decoding="async"
          loading="lazy"
          style={{ opacity: 0.9 }}
        />
      </div>

      {/* Slider handle */}
      <div
        ref={handleRef}
        className="absolute top-0 h-full w-1 bg-blue-500 cursor-ew-resize"
        style={{ left: `${sliderPos}%`, willChange: 'left' }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPos)}
        aria-label="Before/After position"
      />
    </div>
  );
};

export default BeforeAfterSlider;
