import React from 'react';
import { Brush, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Panel from '../ui/Panel';
import UnifiedSlider from '../UnifiedSlider';

const InpaintingPanel = ({
  onStartInpainting,
  onCommitInpainting,
  onCancelInpainting,
  isInpainting,
  brushSize,
  setBrushSize,
}) => {
  return (
    <Panel title="Object Removal (Inpaint)">
      <div className="flex flex-col gap-3">
        {!isInpainting ? (
          <Button
            variant="primary"
            onClick={onStartInpainting}
            title="Start painting over objects to remove them"
          >
            <Brush size={16} className="mr-2" />
            Start Removal
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-center text-blue-300 bg-blue-900/50 p-2 rounded">
              Paint over areas to remove.
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs w-20">Brush Size</label>
              <UnifiedSlider
                value={brushSize}
                onChange={setBrushSize}
                min={5}
                max={100}
                step={1}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="primary"
                onClick={onCommitInpainting}
                title="Commit the inpainting operation"
              >
                <Trash2 size={16} className="mr-2" />
                Apply Removal
              </Button>
              <Button
                variant="secondary"
                onClick={onCancelInpainting}
                title="Cancel the inpainting operation"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default InpaintingPanel;
