import React, { useEffect, useRef, useState } from 'react';

/**
 * BottomSheet
 * - Mobile-first bottom sheet with drag handle, animation, and ESC/Backdrop close.
 * - Props:
 *   open: boolean
 *   onClose: () => void
 *   minHeight: number (px), default 200
 *   maxHeight: number (px), default window.innerHeight * 0.95
 *   initialHeight: number (px), default Math.round(window.innerHeight * 0.5)
 *   header?: ReactNode (optional header area above handle)
 *   children: content
 *   portal?: false (kept simple without portal for SPA)
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const BottomSheet = ({
  open,
  onClose,
  minHeight,
  maxHeight,
  initialHeight,
  header = null,
  children,
}) => {
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const startYRef = useRef(0);
  const startHRef = useRef(0);
  const draggingRef = useRef(false);

  const [height, setHeight] = useState(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const defMax = Math.round(vh * 0.95);
    const defInit = Math.round(vh * 0.5);
    return clamp(initialHeight ?? defInit, minHeight ?? 200, maxHeight ?? defMax);
  });

  // Adjust to viewport changes
  useEffect(() => {
    const onResize = () => {
      const vh = window.innerHeight;
      const defMax = Math.round(vh * 0.95);
      const minH = minHeight ?? 200;
      setHeight((h) => clamp(h, minH, maxHeight ?? defMax));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [minHeight, maxHeight]);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Drag handling (mouse + touch)
  useEffect(() => {
    const onMove = (clientY) => {
      if (!draggingRef.current) return;
      const dy = startYRef.current - clientY; // dragging up => positive
      const newH = clamp(startHRef.current + dy, minHeight ?? 200, maxHeight ?? Math.round(window.innerHeight * 0.95));
      setHeight(newH);
    };

    const onMouseMove = (e) => onMove(e.clientY);
    const onMouseUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    const onTouchMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      onMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [minHeight, maxHeight]);

  const startDrag = (clientY) => {
    draggingRef.current = true;
    startYRef.current = clientY;
    startHRef.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const onHandleMouseDown = (e) => startDrag(e.clientY);
  const onHandleTouchStart = (e) => startDrag(e.touches[0].clientY);

  // Close if clicking on translucent backdrop
  const onBackdropClick = (e) => {
    if (!sheetRef.current) return;
    // prevent close when clicking inside the sheet
    if (sheetRef.current.contains(e.target)) return;
    onClose?.();
  };

  // Animated classes
  const openClass = open ? 'rieb-sheet-open' : 'rieb-sheet-closed';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`rieb-sheet-backdrop ${open ? 'rieb-backdrop-show' : 'rieb-backdrop-hide'}`}
        onMouseDown={onBackdropClick}
        onTouchStart={onBackdropClick}
        aria-hidden={!open}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`rieb-bottom-sheet ${openClass}`}
        style={{ height: `${height}px` }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div
          ref={handleRef}
          className="rieb-sheet-handle"
          onMouseDown={onHandleMouseDown}
          onTouchStart={onHandleTouchStart}
          aria-label="Drag to resize"
          role="separator"
          tabIndex={0}
        >
          <div className="rieb-sheet-grip" />
        </div>

        {/* Optional header */}
        {header ? <div className="rieb-sheet-header">{header}</div> : null}

        {/* Content */}
        <div className="rieb-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
