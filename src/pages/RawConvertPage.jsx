import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const RawConvertPage = () => {
  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container">
          <h1>RAW File Converter</h1>
          <p>Convert RAW files to standard formats with professional quality</p>
          {/* RAW conversion functionality will go here */}
        </div>
      </div>
    </div>
  );
};

export default RawConvertPage;
