import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import './styles/modern-enhancements.css'
import AppRouter from './AppRouter.jsx'
import { initDemo } from './demo.js'

// Initialize demo when DOM is loaded
initDemo();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
