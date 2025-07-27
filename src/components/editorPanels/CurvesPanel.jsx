import React, { useState, useContext } from 'react';
import { useCurve } from '../../context/CurveContext';
import CurveEditor from '../CurveEditor';
import PanelWrapper from '../PanelWrapper';

const CurvesPanel = () => {
  const { curves, updateCurve } = useCurve();
  const [activeChannel, setActiveChannel] = useState('rgb');

  // Get current curve points from context
  const getCurrentPoints = (channel) => {
    return curves[`curve${channel.charAt(0).toUpperCase() + channel.slice(1)}`] || [[0, 0], [1, 1]];
  };

  // Handle curve changes
  const handleCurveChange = (points, channel) => {
    const curveKey = `curve${channel.charAt(0).toUpperCase() + channel.slice(1)}`;
    updateCurve(curveKey, points);
  };

  // Channel options
  const channels = [
    { id: 'rgb', name: 'RGB' },
    { id: 'r', name: 'Red' },
    { id: 'g', name: 'Green' },
    { id: 'b', name: 'Blue' },
    { id: 'luminance', name: 'Luminance' }
  ];

  return (
    <PanelWrapper title="Tone Curves" defaultExpanded={true}>
      <div className="curves-panel">
        {/* Channel Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Channel</label>
          <div className="grid grid-cols-5 gap-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                className={`py-2 px-1 text-xs rounded ${
                  activeChannel === channel.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setActiveChannel(channel.id)}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </div>

        {/* Curve Editor */}
        <div className="mb-4">
          <CurveEditor
            points={getCurrentPoints(activeChannel)}
            onChange={(points) => handleCurveChange(points, activeChannel)}
            channel={activeChannel}
            width={280}
            height={280}
          />
        </div>

        {/* Curve Controls */}
        <div className="flex gap-2">
          <button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm"
            onClick={() => handleCurveChange([[0, 0], [1, 1]], activeChannel)}
          >
            Reset Channel
          </button>
          <button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm"
            onClick={() => {
              channels.forEach(channel => {
                handleCurveChange([[0, 0], [1, 1]], channel.id);
              });
            }}
          >
            Reset All
          </button>
        </div>
      </div>
    </PanelWrapper>
  );
};

export default CurvesPanel;
