import React, { useState, useRef, useEffect } from 'react';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const UnifiedSlider = ({
  min = 0,
  max = 100,
  value = 50,
  onChange,
  label = '',
  showLabels = true,
  showValue = true,
  className = '',
  step = 0.01,
  showRange = true,
  minLabel,
  maxLabel,
  showTicks = false,
  tickCount = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const emitChange = (next) => {
    if (!onChange) return;
    const numeric = toNumber(next, value);
    // snap to step
    const snapped = step > 0 ? Math.round(numeric / step) * step : numeric;
    onChange(clamp(snapped, min, max));
  };

  // pointer handlers
  const updateFromClientX = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const pos = min + ratio * (max - min);
    emitChange(pos);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const t = e.touches[0];
    updateFromClientX(t.clientX);
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const t = e.touches[0];
    updateFromClientX(t.clientX);
  };
  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const numericValue = clamp(toNumber(value, min), min, max);
  const sliderPosition = ((numericValue - min) / (max - min)) * 100;

  return (
    <div className={`unified-slider ${className}`}>
      {label && <label className="slider-label">{label}</label>}
      <div className="slider-container">
        {showRange && (
          <div className="slider-range">
            <span className="slider-min-value">{minLabel ?? min}</span>
            <span className="slider-max-value">{maxLabel ?? max}</span>
          </div>
        )}

        <div
          ref={sliderRef}
          className="slider-track"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Number.isFinite(numericValue) ? Math.round(numericValue * 100) / 100 : 0}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!onChange) return;
            if (e.key === 'ArrowLeft') emitChange(numericValue - step);
            if (e.key === 'ArrowRight') emitChange(numericValue + step);
            if (e.key === 'Home') emitChange(min);
            if (e.key === 'End') emitChange(max);
            if (e.key === 'PageUp') emitChange(numericValue + step * 10);
            if (e.key === 'PageDown') emitChange(numericValue - step * 10);
          }}
          onDoubleClick={() => {
            // default reset midpoint; parent can override by controlling value
            emitChange((min + max) / 2);
          }}
          style={{ '--slider-fill': `${sliderPosition}%` }}
        >
          <div className="slider-fill" style={{ width: `${sliderPosition}%` }} />
          {showTicks && tickCount > 1 && (
            <div className="slider-ticks">
              {Array.from({ length: tickCount }).map((_, i) => (
                <span key={i} className="slider-tick" style={{ left: `${(i / (tickCount - 1)) * 100}%` }} />
              ))}
            </div>
          )}
          <div className="slider-handle" style={{ left: `${sliderPosition}%` }} />
        </div>

        {showLabels && (
          <div className="slider-value-container">
            {showValue && (
              <span className="slider-value">{Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00'}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedSlider;
