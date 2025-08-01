import React from 'react';
import CurveEditor from '../CurveEditor';

const CurvesPanel = ({ curves, onChange }) => {
  if (!curves) {
    return <div>Loading curves...</div>;
  }

  const handleCurveChange = (newPoints) => {
    onChange({ ...curves, points: newPoints });
  };

  return (
    <div className="curves-panel">
      <CurveEditor
        points={curves.points}
        onChange={handleCurveChange}
      />
    </div>
  );
};

export default CurvesPanel;
