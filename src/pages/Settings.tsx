import React from 'react';
import './pages.css';

const Settings: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Application Settings</h3>
        <p style={{ color: '#999' }}>Configure application preferences here.</p>
      </div>
    </div>
  );
};

export default Settings;
