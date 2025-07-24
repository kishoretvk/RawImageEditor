import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const WorkflowPage = () => {
  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container">
          <h1>Workflow Management</h1>
          <p>Streamline your image processing workflow</p>
          {/* Workflow functionality will go here */}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
