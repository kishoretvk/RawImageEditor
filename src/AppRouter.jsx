import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EnhancedProfessionalLanding from './components/EnhancedProfessionalLanding';
import EditorPage from './pages/EditorPage';
import WorkflowPage from './pages/WorkflowPage';
import CompressionPage from './pages/CompressionPage';
import Gallery from './pages/Gallery';
import AboutTech from './pages/AboutTech';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DemoPage from './pages/DemoPage';
import EnhancedHome from './pages/EnhancedHome';
import ProfessionalDemo from './pages/ProfessionalDemo';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<EnhancedProfessionalLanding />} />
      <Route path="/home" element={<EnhancedHome />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/compression" element={<CompressionPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/about" element={<AboutTech />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/professional-demo" element={<ProfessionalDemo />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
