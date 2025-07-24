// This is a guide for updating EditorLayout.jsx
// Copy this code to your EditorLayout.jsx file

import React from 'react';
import ImageCanvas from './ImageCanvas';
import '../styles/editor.css'; // Import the editor-specific CSS
import ColorAdjustmentsPanel from './editorPanels/ColorAdjustmentsPanel';
import SharpnessPanel from './editorPanels/SharpnessPanel';
import EffectsPanel from './editorPanels/EffectsPanel';
import GeometryPanel from './editorPanels/GeometryPanel';
import AdvancedPanel from './editorPanels/AdvancedPanel';
import QuickActionsPanel from './editorPanels/QuickActionsPanel';
import PresetFiltersPanel from './editorPanels/PresetFiltersPanel';
import BackgroundBlurPanel from './editorPanels/BackgroundBlurPanel';
import LocalAdjustmentsPanel from './editorPanels/LocalAdjustmentsPanel';

// Modern, Tailwind-based, collapsible sidebar layout with glassmorphism
const Sidebar = ({ isOpen, onToggle, children }) => (
  <aside
    className={`editor-sidebar transition-all duration-300 bg-gray-900/80 backdrop-blur-lg shadow-lg h-full overflow-y-auto space-y-4 p-4
      ${isOpen ? 'w-full lg:w-80' : 'w-0 lg:w-16'} 
      ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      rounded-r-xl relative`}
    aria-label="Editing panels"
  >
    <button
      className="absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-800/70 hover:bg-gray-700 focus:outline-none"
      onClick={onToggle}
      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <span className="text-white">{isOpen ? '⏴' : '⏵'}</span>
    </button>
    <div className={isOpen ? '' : 'hidden'}>
      {children}
    </div>
  </aside>
);


const EditorLayout = ({ imageSrc, edits = {}, setEdits = () => {}, onProcessed }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const updateEdits = (update) => setEdits(prev => ({ ...prev, ...update }));

  return (
    <div className="editor-container flex flex-col lg:flex-row w-full h-full relative">
      {/* Sidebar Panels */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
        <QuickActionsPanel edits={edits} updateEdits={updateEdits} />
        <PresetFiltersPanel edits={edits} updateEdits={updateEdits} />
        <ColorAdjustmentsPanel edits={edits} updateEdits={updateEdits} />
        <SharpnessPanel edits={edits} updateEdits={updateEdits} />
        <EffectsPanel edits={edits} updateEdits={updateEdits} />
        <GeometryPanel edits={edits} updateEdits={updateEdits} />
        <AdvancedPanel edits={edits} updateEdits={updateEdits} />
        <BackgroundBlurPanel edits={edits} updateEdits={updateEdits} />
        <LocalAdjustmentsPanel edits={edits} updateEdits={updateEdits} />
      </Sidebar>

      {/* Main Canvas Area */}
      <main className="canvas-area flex-1 flex items-center justify-center p-4 bg-black rounded-xl shadow-xl">
        <ImageCanvas imageSrc={imageSrc} edits={edits} onProcessed={onProcessed} />
      </main>
    </div>
  );
};

export default EditorLayout;
