import React from 'react';
import { listNodeTypes, NodeCategories } from './nodeDefinitions';

export default function NodePalette({ onAdd }) {
  const types = listNodeTypes();
  const grouped = groupBy(types, (t) => t.category);

  return (
    <div className="node-palette">
      <h3 className="palette-title">Nodes</h3>
      {Object.values(NodeCategories).map((cat) => (
        <div key={cat} className="palette-group">
          <div className="palette-group-title">{cat}</div>
          <div className="palette-items">
            {(grouped[cat] || []).map((nt) => (
              <button
                key={nt.type}
                className="palette-item"
                onClick={() => onAdd?.(nt.type)}
                title={nt.name}
              >
                {nt.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <style>{styles}</style>
    </div>
  );
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, x) => {
    const k = keyFn(x);
    (acc[k] = acc[k] || []).push(x);
    return acc;
  }, {});
}

const styles = `
.node-palette {
  padding: 12px;
  border-right: 1px solid rgba(255,255,255,0.08);
}
.palette-title {
  font-weight: 600;
  margin: 0 0 8px;
}
.palette-group {
  margin-bottom: 12px;
}
.palette-group-title {
  font-size: 12px;
  color: #9aa4b2;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.palette-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.palette-item {
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: #e6e9ef;
  cursor: pointer;
}
.palette-item:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.35);
}
`;
