import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import EditorPage from './pages/EditorPage';
import WorkflowPage from './pages/WorkflowPage';
import DemoPage from './pages/DemoPage';
import EnhancedHome from './pages/EnhancedHome';
import ProfessionalDemo from './pages/ProfessionalDemo';
import CompressionPage from './pages/CompressionPage';
import RawConvertPage from './pages/RawConvertPage';
import UploadConvert from './pages/UploadConvert';
import AboutTech from './pages/AboutTech';
import Competition from './pages/Competition';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Dashboard from './pages/Dashboard';
import Gallery from './pages/Gallery';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EnhancedLandingPage />} />
        <Route path="/home" element={<EnhancedHome />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/professional-demo" element={<ProfessionalDemo />} />
        <Route path="/compression" element={<CompressionPage />} />
        <Route path="/raw-convert" element={<RawConvertPage />} />
        <Route path="/upload-convert" element={<UploadConvert />} />
        <Route path="/about-tech" element={<AboutTech />} />
        <Route path="/competition" element={<Competition />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
