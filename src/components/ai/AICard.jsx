import React from 'react';

export default function AICard({ title, description, children, actions, loading = false }) {
  return (
    <div className="ai-card" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </div>
      {description && (
        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{description}</p>
      )}
      <div style={{ marginTop: 6 }}>
        {children}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {actions}
      </div>
      {loading && (
        <div style={{ marginTop: 8, fontSize: '0.85rem', opacity: 0.85 }}>
          Loading…
        </div>
      )}
    </div>
  );
}
