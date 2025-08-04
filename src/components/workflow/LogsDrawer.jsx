import React, { useEffect, useState } from 'react';
import { JobStore } from '../../utils/db/indexedDb';

export default function LogsDrawer({ open, onClose, jobId, title = 'Job Logs' }) {
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('all'); // all | info | success | error

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

  const visible = !open ? '' : 'drawer-open';
  const filtered = logs.filter(l => {
    if (filter === 'all') return true;
    return (l.status || '').toLowerCase() === filter;
  });

  return (
    <div className={`logs-drawer ${visible}`} aria-hidden={!open} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
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

      <style>{styles}</style>
    </div>
  );
}

const styles = `
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
