import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EnhancedHome from './pages/EnhancedHome';
import UploadConvert from './pages/UploadConvert';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DevModePanel from './components/DevModePanel';
const Editor = React.lazy(() => import('./pages/Editor'));
const GalleryPage = React.lazy(() => import('./pages/Gallery'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Competition = React.lazy(() => import('./pages/Competition'));
const AboutTech = React.lazy(() => import('./pages/AboutTech'));
import BatchProcessor from './components/BatchProcessor';
import Footer from './components/Footer';

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<EnhancedHome />} />
      <Route path="/upload" element={<UploadConvert />} />
      <Route path="/editor" element={<Suspense fallback={<div>Loading...</div>}><Editor /></Suspense>} />
      <Route path="/batch" element={<BatchProcessor />} />
      <Route path="/gallery" element={<Suspense fallback={<div>Loading...</div>}><GalleryPage /></Suspense>} />
      <Route path="/dashboard" element={<Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense>} />
      <Route path="/competition" element={<Suspense fallback={<div>Loading...</div>}><Competition /></Suspense>} />
      <Route path="/about" element={<Suspense fallback={<div>Loading...</div>}><AboutTech /></Suspense>} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/debug" element={<DevModePanel />} />
    </Routes>
    <Footer />
  </Router>
);

export default AppRouter;
