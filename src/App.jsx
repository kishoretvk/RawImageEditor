import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/global.css';
import LandingPageNew from './components/LandingPageNew';
import EditorPage from './pages/EditorPage';
import CompressionPage from './pages/CompressionPage';
import RawConvertPage from './pages/RawConvertPage';
import WorkflowPage from './pages/WorkflowPage';
import DemoPage from './pages/DemoPage';
import PerformancePanel from './components/PerformancePanel';

function App() {
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);

  useEffect(() => {
    const handleKeydown = (event) => {
      // Toggle performance panel with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowPerformancePanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPageNew />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/compression" element={<CompressionPage />} />
        <Route path="/raw-convert" element={<RawConvertPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
      
      <PerformancePanel 
        isVisible={showPerformancePanel}
        onClose={() => setShowPerformancePanel(false)}
      />
    </div>
  );
}

export default App;
