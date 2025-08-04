import React, { useEffect } from 'react';

export default function Modal({ open, title = '', onClose, children, width = 720 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-panel" style={{ width }}>
        <div className="modal-header">
          <div className="title">{title}</div>
          <button className="close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.modal-root {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55);
  display: grid; place-items: center;
  backdrop-filter: blur(2px);
}
.modal-panel {
  max-height: 86vh; overflow: auto;
  background: rgba(29,31,36,0.98);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  color: #e6e9ef;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; background: rgba(29,31,36,0.98);
}
.modal-header .title { font-weight: 600; }
.modal-header .close {
  background: transparent; border: 1px solid rgba(255,255,255,0.2);
  color: #e6e9ef; border-radius: 8px; padding: 4px 8px; cursor: pointer;
}
.modal-header .close:hover {
  background: rgba(102,126,234,0.18); border-color: rgba(102,126,234,0.35);
}
.modal-body { padding: 14px; }
`;
