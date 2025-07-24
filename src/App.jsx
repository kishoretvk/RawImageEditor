import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/global.css';
import LandingPageNew from './components/LandingPageNew';
import EditorPage from './pages/EditorPage';
import CompressionPage from './pages/CompressionPage';
import RawConvertPage from './pages/RawConvertPage';
import WorkflowPage from './pages/WorkflowPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPageNew />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/compression" element={<CompressionPage />} />
        <Route path="/raw-convert" element={<RawConvertPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
      </Routes>
    </div>
  );
}

export default App;
