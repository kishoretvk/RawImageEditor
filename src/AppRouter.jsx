import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EnhancedHome from './pages/EnhancedHome';
import EditorPage from './pages/EditorPage';
import WorkflowPage from './pages/WorkflowPage';
import Gallery from './pages/Gallery';
import AboutTech from './pages/AboutTech';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Competition from './pages/Competition';
import DemoPage from './pages/DemoPage';
import ProfessionalDemo from './pages/ProfessionalDemo';
import EnhancedLandingPage from './components/EnhancedLandingPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<EnhancedLandingPage />} />
      <Route path="/home" element={<EnhancedHome />} />
      <Route path="/editor" element={<EditorPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/about" element={<AboutTech />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/competition" element={<Competition />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/professional-demo" element={<ProfessionalDemo />} />
    </Routes>
  );
};

export default AppRouter;
