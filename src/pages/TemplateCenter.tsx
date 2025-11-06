import React from 'react';
import './pages.css';

const TemplateCenter: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Template Center</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Available Templates</h3>
        <p style={{ color: '#999' }}>No templates available.</p>
      </div>
    </div>
  );
};

export default TemplateCenter;
