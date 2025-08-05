import React, { useEffect, useMemo, useRef, useState } from 'react';
import { JobStore } from '../../utils/db/indexedDb';

const LS_KEY = 'logsDrawerHeight';
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function LogsDrawer({ open, onClose, jobId, title = 'Job Logs' }) {
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('all'); // all | info | success | error

  // Mobile bottom-sheet state
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false), []);
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const minH = 200;
  const defaultH = Math.round(vh * 0.5);

  const [height, setHeight] = useState(() => {
    if (typeof window === 'undefined') return defaultH;
    const stored = Number(localStorage.getItem(LS_KEY));
    return clamp(Number.isFinite(stored) && stored > 0 ? stored : defaultH, minH, Math.round(vh * 0.95));
  });
  const [collapsed, setCollapsed] = useState(false);

  const startYRef = useRef(0);
  const startHRef = useRef(height);
  const draggingRef = useRef(false);

  useEffect(() => {
    const mm = window.matchMedia('(max-width: 768px)');
    const handler = () => {
      // when switching breakpoints, ensure height within limits
      const vh2 = window.innerHeight;
      setHeight((h) => clamp(h, minH, Math.round(vh2 * 0.95)));
    };
    mm.addEventListener?.('change', handler);
    window.addEventListener('resize', handler);
    return () => {
      mm.removeEventListener?.('change', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);

  // Persist height
  useEffect(() => {
    if (!isMobile) return;
    localStorage.setItem(LS_KEY, String(height));
  }, [isMobile, height]);

  // Load logs
  useEffect(() => {
    let timer;
    const load = async () => {
      if (!jobId) return;
      try {
        const entries = await JobStore.getJobProgress(jobId, 2000);
        setLogs(entries || []);
      } catch {}
    };
    if (open) {
      load();
      if (autoRefresh) {
        timer = setInterval(load, 1000);
      }
    }
    return () => { if (timer) clearInterval(timer); };
  }, [open, jobId, autoRefresh]);

  const filtered = logs.filter(l => {
    if (filter === 'all') return true;
    return (l.status || '').toLowerCase() === filter;
  });

  // Drag handlers (mobile)
  useEffect(() => {
    if (!isMobile) return;
    const onMove = (clientY) => {
      if (!draggingRef.current) return;
      const dy = startYRef.current - clientY; // up = positive
      const next = clamp(startHRef.current + dy, minH, Math.round(window.innerHeight * 0.95));
      setHeight(next);
      if (next <= minH) setCollapsed(true);
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
  }, [isMobile]);

  const startDrag = (clientY) => {
    draggingRef.current = true;
    startYRef.current = clientY;
    startHRef.current = height;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const onHandleMouseDown = (e) => startDrag(e.clientY);
  const onHandleTouchStart = (e) => startDrag(e.touches[0].clientY);

  // Rail (collapsed) click to expand
  const expandFromRail = () => {
    setCollapsed(false);
    const vh2 = window.innerHeight;
    setHeight((h) => clamp(h < minH ? Math.round(vh2 * 0.5) : h, minH, Math.round(vh2 * 0.95)));
  };

  // Desktop layout (unchanged)
  const DesktopDrawer = () => (
    <div className={`logs-drawer ${open ? 'drawer-open' : ''}`} aria-hidden={!open} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="Logs">
        <div className="header">
          <div className="title">{title}</div>
          <div className="controls">
            <label className="chk">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span>Auto-refresh</span>
            </label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="body">
          {filtered.length === 0 ? (
            <div className="empty">No log entries.</div>
          ) : (
            <ul className="log-list">
              {filtered.map((l) => (
                <li key={l.id || `${l.ts}-${l.nodeId}-${Math.random()}`} className={`line ${l.status || ''}`}>
                  <span className="ts">{new Date(l.ts).toLocaleTimeString()}</span>
                  <span className="node">{l.nodeId}</span>
                  <span className="pct">{Math.round(((l.progress || 0) * 100))}%</span>
                  <span className="status">{l.status}</span>
                  <span className="msg">{l.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <style>{desktopStyles}</style>
    </div>
  );

  // Mobile bottom sheet
  const MobileSheet = () => (
    <div className={`logs-mobile-wrapper ${open ? 'open' : ''}`}>
      {/* Rail when collapsed */}
      {collapsed && open && (
        <button className="logs-rail" aria-label="Logs" title="Logs" onClick={expandFromRail}>
          Logs
        </button>
      )}

      {/* Backdrop */}
      <div
        className={`logs-backdrop ${open && !collapsed ? 'show' : 'hide'}`}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        onTouchStart={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        aria-hidden={!open || collapsed}
      />

      {/* Sheet */}
      <div
        className={`logs-sheet ${open && !collapsed ? 'sheet-open' : 'sheet-closed'}`}
        style={{ height: `${height}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Logs"
      >
        <div
          className="sheet-handle"
          onMouseDown={onHandleMouseDown}
          onTouchStart={onHandleTouchStart}
          role="separator"
          aria-label="Drag to resize"
        >
          <div className="sheet-grip" />
        </div>

        <div className="sheet-header">
          <div className="title">{title}</div>
          <div className="controls">
            <label className="chk">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              <span>Auto-refresh</span>
            </label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <button className="btn" onClick={() => setCollapsed(true)}>Collapse</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="sheet-body">
          {filtered.length === 0 ? (
            <div className="empty">No log entries.</div>
          ) : (
            <ul className="log-list">
              {filtered.map((l) => (
                <li key={l.id || `${l.ts}-${l.nodeId}-${Math.random()}`} className={`line ${l.status || ''}`}>
                  <span className="ts">{new Date(l.ts).toLocaleTimeString()}</span>
                  <span className="node">{l.nodeId}</span>
                  <span className="pct">{Math.round(((l.progress || 0) * 100))}%</span>
                  <span className="status">{l.status}</span>
                  <span className="msg">{l.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <style>{mobileStyles}</style>
    </div>
  );

  if (!open && !isMobile) return null;
  return isMobile ? <MobileSheet /> : <DesktopDrawer />;
}

const desktopStyles = `
.logs-drawer {
  position: fixed; inset: 0; z-index: 1000;
  pointer-events: none;
}
.logs-drawer.drawer-open { pointer-events: auto; }
.logs-drawer .panel {
  position: absolute; right: 0; top: 0; bottom: 0; width: 520px;
  background: rgba(17,20,26,0.98);
  border-left: 1px solid rgba(255,255,255,0.08);
  transform: translateX(100%);
  transition: transform .25s ease;
  color: #e6e9ef;
  display: flex; flex-direction: column; min-height: 0;
  box-shadow: -20px 0 60px rgba(0,0,0,0.35);
}
.logs-drawer.drawer-open .panel { transform: translateX(0); }

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; background: rgba(17,20,26,0.98); z-index: 1;
}
.title { font-weight: 700; }
.controls { display: flex; align-items: center; gap: 8px; }
.chk { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #9aa4b2; }
.btn {
  font-size: 12px; padding: 6px 8px; border-radius: 8px;
  background: rgba(255,255,255,0.06); color: #e6e9ef; border: 1px solid rgba(255,255,255,0.12);
  cursor: pointer;
}
.btn:hover { background: rgba(102,126,234,0.18); border-color: rgba(102,126,234,0.35); }

.body { padding: 8px 10px; overflow: auto; }
.empty { color: #9aa4b2; padding: 10px; }
.log-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.line {
  display: grid; grid-template-columns: 84px 1fr 60px 80px; gap: 8px;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 6px 8px;
  background: rgba(255,255,255,0.04);
  font-size: 12px;
}
.line .ts { color: #97a3b6; }
.line .status { text-transform: capitalize; }
.line.success { border-color: rgba(110,231,183,0.35); background: rgba(110,231,183,0.12); }
.line.error { border-color: rgba(239,154,154,0.35); background: rgba(239,154,154,0.12); }
`;

const mobileStyles = `
.logs-mobile-wrapper { position: fixed; inset: 0; z-index: 1000; pointer-events: none; }
.logs-mobile-wrapper.open { pointer-events: auto; }

.logs-rail {
  position: fixed; left: 8px; right: 8px; bottom: 8px;
  height: 36px; border-radius: 999px;
  background: rgba(31,31,31,0.96);
  border: 1px solid rgba(255,255,255,0.12);
  color: #e6e9ef; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.logs-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  opacity: 0; transition: opacity 200ms ease;
}
.logs-backdrop.show { opacity: 1; pointer-events: auto; }
.logs-backdrop.hide { opacity: 0; pointer-events: none; }

.logs-sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #1f1f1f;
  border-top-left-radius: 12px; border-top-right-radius: 12px;
  box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
  transform: translateY(100%);
  transition: transform 220ms ease;
  display: flex; flex-direction: column;
}
.logs-sheet.sheet-open { transform: translateY(0%); }
.logs-sheet.sheet-closed { transform: translateY(100%); }

.sheet-handle {
  width: 100%; padding: 8px 0 4px 0;
  display: flex; justify-content: center; align-items: center;
  cursor: ns-resize;
}
.sheet-grip { width: 42px; height: 5px; border-radius: 999px; background: #3a3a3a; }

.sheet-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
  color: #e6e9ef;
}

.sheet-body { padding: 8px 10px; overflow: auto; }
.empty { color: #9aa4b2; padding: 10px; }
.log-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.line {
  display: grid; grid-template-columns: 84px 1fr 60px 80px; gap: 8px;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 6px 8px;
  background: rgba(255,255,255,0.04);
  font-size: 12px;
}
.line .ts { color: #97a3b6; }
.line .status { text-transform: capitalize; }
.line.success { border-color: rgba(110,231,183,0.35); background: rgba(110,231,183,0.12); }
.line.error { border-color: rgba(239,154,154,0.35); background: rgba(239,154,154,0.12); }
`;
