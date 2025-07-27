import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPageNew from './components/LandingPageNew';
import UploadConvert from './pages/UploadConvert';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DevModePanel from './components/DevModePanel';
import DemoPage from './pages/DemoPage';
import BatchProcessor from './components/BatchProcessor';
import Footer from './components/Footer';
import SmartComponentWrapper from './components/SmartComponentWrapper';
import SeamlessLoader from './components/SeamlessLoader';
import PerformancePanel from './components/PerformancePanel';
import preloadManager, { preloadAllComponents } from './utils/preloadManager';

// Component import functions
const importEditor = () => import('./pages/EditorPage');
const importGallery = () => import('./pages/Gallery');
const importDashboard = () => import('./pages/Dashboard');
const importCompetition = () => import('./pages/Competition');
const importAboutTech = () => import('./pages/AboutTech');
const importCompressionPage = () => import('./pages/CompressionPage');

const AppRouter = () => {
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);

  useEffect(() => {
    // Start preloading components after initial render
    const timer = setTimeout(() => {
      preloadAllComponents();
    }, 1000); // Wait 1 second after page load

    // Keyboard shortcut for performance panel
    const handleKeydown = (event) => {
      // Toggle performance panel with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowPerformancePanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPageNew />} />
        <Route path="/upload" element={<UploadConvert />} />
        
        {/* Smart wrapped routes with seamless loading */}
        <Route 
          path="/editor" 
          element={
            <SmartComponentWrapper
              componentName="EditorPage"
              importFunction={importEditor}
              fallback={<SeamlessLoader type="minimal" message="Loading Editor..." />}
            />
          } 
        />
        
        <Route 
          path="/gallery" 
          element={
            <SmartComponentWrapper
              componentName="Gallery"
              importFunction={importGallery}
              fallback={<SeamlessLoader type="minimal" message="Loading Gallery..." />}
            />
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <SmartComponentWrapper
              componentName="Dashboard"
              importFunction={importDashboard}
              fallback={<SeamlessLoader type="minimal" message="Loading Dashboard..." />}
            />
          } 
        />
        
        <Route 
          path="/competition" 
          element={
            <SmartComponentWrapper
              componentName="Competition"
              importFunction={importCompetition}
              fallback={<SeamlessLoader type="minimal" message="Loading Competition..." />}
            />
          } 
        />
        
        <Route 
          path="/about" 
          element={
            <SmartComponentWrapper
              componentName="AboutTech"
              importFunction={importAboutTech}
              fallback={<SeamlessLoader type="minimal" message="Loading About..." />}
            />
          } 
        />
        
        <Route 
          path="/compression" 
          element={
            <SmartComponentWrapper
              componentName="CompressionPage"
              importFunction={importCompressionPage}
              fallback={<SeamlessLoader type="minimal" message="Loading Compression..." />}
            />
          } 
        />

        <Route path="/batch" element={<BatchProcessor />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/debug" element={<DevModePanel />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
      <Footer />
      
      <PerformancePanel 
        isVisible={showPerformancePanel}
        onClose={() => setShowPerformancePanel(false)}
      />
    </Router>
  );
};

export default AppRouter;
