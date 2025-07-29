
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CompressionPageComponent from '../components/CompressionPage';
import '../styles/pages.css';

const CompressionPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <button className="menu-toggle" onClick={toggleMenu}>
            ☰
          </button>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/editor" className="nav-link" onClick={() => setIsMenuOpen(false)}>Editor</Link>
            <Link to="/workflow" className="nav-link" onClick={() => setIsMenuOpen(false)}>Workflow</Link>
            <Link to="/raw-convert" className="nav-link" onClick={() => setIsMenuOpen(false)}>RAW Convert</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <CompressionPageComponent />
      </div>
    </div>
  );
};

export default CompressionPage;
