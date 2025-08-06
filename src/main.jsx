import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import AppRouter from './AppRouter.jsx'
import './index.css'

// Dev-only console annotation for extension-originated errors
import { installExtensionNoiseGuard } from './utils/dev/extensionNoiseGuard.js'
if (import.meta.env && import.meta.env.DEV) {
  try { installExtensionNoiseGuard() } catch {}
}

// Disable service worker registration during development
const isDevelopment = import.meta.env.DEV;

if (!isDevelopment && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router basename="/RawImageEditor">
      <AppRouter />
    </Router>
  </React.StrictMode>,
)
