import React from 'react';
import './pages.css';

const ElementManager: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Element Manager</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Captured Elements</h3>
        <p style={{ color: '#999' }}>No elements captured yet. Start recording to capture UI elements.</p>
      </div>
    </div>
  );
};

export default ElementManager;
